import { type NextRequest, NextResponse } from "next/server"
import * as text2img from "../../models/text-2-img"
import * as img2img from "../../models/img-2-img"
import { generateImageFromCloudflare } from "@/lib/cloudflare" // Importamos las funciones de cloudflare.ts

export async function POST(request: NextRequest) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !apiToken) {
    return NextResponse.json({ error: "Cloudflare credentials are not configured" }, { status: 500 })
  }

  try {
    // Get the request payload
    const body = await request.json()
    const { model, prompt, operation } = body

    if (!model || !prompt) {
      return NextResponse.json({ error: "Model and prompt are required" }, { status: 400 })
    }

    let modelPayload: any

    // First check if it's an img2img operation
    if (operation === "img2img" && body.image_b64) {
      modelPayload = await img2img.generateStableDiffusionV15Img2Img(body)
    }
    // Check if it's an inpainting operation
    else if (operation === "inpainting" && body.image_b64 && (body.mask_b64 || body.mask_image)) {
      // Si tenemos mask_image pero no mask_b64, asignamos mask_image a mask_b64
      if (body.mask_image && !body.mask_b64) {
        body.mask_b64 = body.mask_image
      }
      // Si tenemos mask_b64 pero no mask_image, asignamos mask_b64 a mask_image
      else if (body.mask_b64 && !body.mask_image) {
        body.mask_image = body.mask_b64
      }

      modelPayload = await img2img.generateStableDiffusionV15Inpainting(body)
    }
    // Otherwise, use text2img models
    else {
      // Use a switch statement to handle the different models
      switch (model) {
        case "@cf/lykon/dreamshaper-8-lcm":
          modelPayload = await text2img.generateDreamShaper8lcmImage(body)
          break

        case "@cf/black-forest-labs/flux-1-schnell":
          modelPayload = await text2img.generateFlux1SchnellImage(body)
          break

        case "@cf/stabilityai/stable-diffusion-xl-base-1.0":
          modelPayload = await text2img.generateStableDiffusionXlBase1Image(body)
          break

        case "@cf/bytedance/stable-diffusion-xl-lightning":
          modelPayload = await text2img.generateStableDiffusionXlLightningImage(body)
          break
        // Add more cases for new models

        default:
          return NextResponse.json({ error: `Model ${model} not supported` }, { status: 400 })
      }
    }

    try {
      // Para depuración, vamos a imprimir el payload que se envía a Cloudflare
      console.log("Sending to Cloudflare:", JSON.stringify(modelPayload.payload, null, 2))

      const imageBlob = await generateImageFromCloudflare(modelPayload.model, modelPayload.payload, apiToken, accountId)

      // Return the image response
      return new NextResponse(imageBlob, {
        headers: {
          "Content-Type": "image/png", // Asumimos PNG como un ejemplo, o puede ser diferente dependiendo de la respuesta.
        },
      })
    } catch (error) {
      console.error("Error from Cloudflare API:", error)
      return NextResponse.json({ error: "Error from Cloudflare API" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

