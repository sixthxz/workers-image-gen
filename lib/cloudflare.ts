"use server"

// Helper function to convert base64 to Blob (only if needed for img2img or image processing)
export async function base64ToBlob(base64: string): Promise<Blob> {
  // Check if the base64 string includes the data URL prefix
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64
  const byteCharacters = atob(base64Data)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024)
    const byteNumbers = Array.from(slice, (char) => char.charCodeAt(0))
    byteArrays.push(new Uint8Array(byteNumbers))
  }

  return new Blob(byteArrays, { type: "image/png" })
}

// Function to call Cloudflare API and return the image blob
export async function generateImageFromCloudflare(
  model: string,
  payload: any,
  apiToken: string,
  accountId: string,
): Promise<Blob> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to generate image: ${response.status} ${errorText}`)
  }

  // Check content type to determine how to handle the response
  const contentType = response.headers.get("content-type")

  // Handle JSON responses (like from Flux 1 model)
  if (contentType && contentType.includes("application/json")) {
    const responseBody = await response.json()

    // Check for various possible response formats
    if (responseBody.result && typeof responseBody.result === "string") {
      // Flux 1 model returns base64 in the result field
      return await base64ToBlob(responseBody.result)
    } else if (responseBody.image && typeof responseBody.image === "string") {
      // Some models return base64 in the image field
      return await base64ToBlob(responseBody.image)
    } else if (responseBody.data && responseBody.data.image && typeof responseBody.data.image === "string") {
      // Some models nest the image in a data object
      return await base64ToBlob(responseBody.data.image)
    } else if (
      responseBody.success &&
      responseBody.result &&
      responseBody.result.images &&
      responseBody.result.images[0]
    ) {
      // Check for Flux 1 specific format with images array
      return await base64ToBlob(responseBody.result.images[0])
    } else if (responseBody.success && responseBody.result && typeof responseBody.result === "object") {
      // If result is an object, try to find any string property that might be the image
      for (const key in responseBody.result) {
        if (typeof responseBody.result[key] === "string" && responseBody.result[key].length > 1000) {
          // Likely a base64 image if it's a long string
          return await base64ToBlob(responseBody.result[key])
        }
      }
    }

    // If we can't find an image in the JSON, throw an error
    throw new Error(`No image found in the response. Model: ${model}`)
  }

  // Handle binary responses (image data directly)
  return await response.blob()
}

// Text to Image generation - Server action
export async function generateTextToImage(values: any): Promise<Response> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare credentials are not configured")
  }

  // Import dynamically to avoid server/client mismatch
  const text2img = await import("@/app/models/text-2-img")

  let modelPayload: any

  // Use a switch statement to handle the different models
  switch (values.model) {
    case "@cf/lykon/dreamshaper-8-lcm":
      modelPayload = await text2img.generateDreamShaper8lcmImage(values)
      break

    case "@cf/black-forest-labs/flux-1-schnell":
      modelPayload = await text2img.generateFlux1SchnellImage(values)
      break

    case "@cf/stabilityai/stable-diffusion-xl-base-1.0":
      modelPayload = await text2img.generateStableDiffusionXlBase1Image(values)
      break

    case "@cf/bytedance/stable-diffusion-xl-lightning":
      modelPayload = await text2img.generateStableDiffusionXlLightningImage(values)
      break

    default:
      throw new Error(`Model ${values.model} not supported`)
  }

  try {
    const imageBlob = await generateImageFromCloudflare(modelPayload.model, modelPayload.payload, apiToken, accountId)

    // Return the image as a Response object
    return new Response(imageBlob, {
      headers: {
        "Content-Type": "image/png",
      },
    })
  } catch (error) {
    console.error("Error generating image:", error)
    return new Response(JSON.stringify({ error: "Error generating image" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

// Image editing with mask
export async function editImage(
  imageBase64: string,
  maskBase64: string,
  prompt: string,
  options: any = {},
): Promise<Response> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare credentials are not configured")
  }

  // Import dynamically to avoid server/client mismatch
  const img2img = await import("@/app/models/img-2-img")

  const values = {
    prompt,
    image_b64: imageBase64,
    mask_b64: maskBase64,
    ...options,
  }

  const modelPayload = await img2img.generateStableDiffusionV15Inpainting(values)

  try {
    const imageBlob = await generateImageFromCloudflare(modelPayload.model, modelPayload.payload, apiToken, accountId)

    // Return the image as a Response object
    return new Response(imageBlob, {
      headers: {
        "Content-Type": "image/png",
      },
    })
  } catch (error) {
    console.error("Error editing image:", error)
    return new Response(JSON.stringify({ error:"Error editing image" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

// Image to Image transformation
export async function transformImage(
  imageBase64: string,
  prompt: string,
  strength = 0.65,
  guidance = 15,
  options: any = {},
): Promise<Response> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !apiToken) {
    throw new Error("Cloudflare credentials are not configured")
  }

  // Import dynamically to avoid server/client mismatch
  const img2img = await import("@/app/models/img-2-img")

  const values = {
    prompt,
    image_b64: imageBase64,
    strength,
    guidance,
    ...options,
  }

  const modelPayload = await img2img.generateStableDiffusionV15Img2Img(values)

  try {
    const imageBlob = await generateImageFromCloudflare(modelPayload.model, modelPayload.payload, apiToken, accountId)

    // Return the image as a Response object
    return new Response(imageBlob, {
      headers: {
        "Content-Type": "image/png",
      },
    })
  } catch (error) {
    console.error("Error transforming image:", error)
    return new Response(JSON.stringify({ error: "Error transforming image" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

