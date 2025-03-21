export async function generateStableDiffusionV15Img2Img(values: {
  prompt: string
  negative_prompt?: string
  height?: number
  width?: number
  num_steps?: number
  seed?: number
  guidance?: number
  strength?: number
  image_b64: string // Base64 encoded image for img2img task
}): Promise<any> {
  // Desestructuramos los parámetros con valores por defecto
  const {
    prompt,
    negative_prompt,
    height = 512,
    width = 512,
    num_steps = 20,
    seed,
    guidance = 7.5,
    strength = 1,
    image_b64,
  } = values

  // Preparar el payload para la solicitud
  const payload: any = {
    prompt,
    negative_prompt,
    height,
    width,
    num_steps,
    seed,
    guidance,
    strength,
    image_b64,
  }

  // Verificar si se proporciona una imagen base64 (image_b64) o una máscara base64 (mask_b64)
  if (image_b64) {
    payload.image_b64 = image_b64 // Usar la imagen base64 proporcionada
  }

  // Retornar el modelo y el payload
  return {
    model: "@cf/runwayml/stable-diffusion-v1-5-img2img",
    payload,
  }
}

export async function generateStableDiffusionV15Inpainting(values: {
  prompt: string
  negative_prompt?: string
  height?: number
  width?: number
  num_steps?: number
  seed?: number
  guidance?: number
  strength?: number
  image_b64: string // Base64 encoded image
  mask_b64: string // Base64 encoded mask
  mask_image?: string // Alias para mask_b64 (algunos modelos usan este nombre)
}): Promise<any> {
  // Desestructuramos los parámetros con valores por defecto
  const {
    prompt,
    negative_prompt,
    height = 512,
    width = 512,
    num_steps = 20,
    seed,
    guidance = 7.5,
    strength = 1,
    image_b64,
    mask_b64,
    mask_image,
  } = values

  // Preparar el payload para la solicitud
  const payload: any = {
    prompt,
    negative_prompt,
    height,
    width,
    num_steps,
    seed,
    guidance,
    strength,
    image_b64,
  }

  // Añadir mask_image si está presente (algunos modelos usan este nombre)
  if (mask_image) {
    payload.mask_image = mask_image
  }

  // Añadir mask_b64 si está presente
  if (mask_b64) {
    payload.mask_b64 = mask_b64

    // Si no se proporcionó mask_image, usar mask_b64 como mask_image
    if (!payload.mask_image) {
      payload.mask_image = mask_b64
    }
  }

  // Si tenemos mask_image pero no mask_b64, asignar mask_image a mask_b64
  if (payload.mask_image && !payload.mask_b64) {
    payload.mask_b64 = payload.mask_image
  }

  // Retornar el modelo y el payload
  return {
    model: "@cf/runwayml/stable-diffusion-v1-5-inpainting",
    payload,
  }
}

