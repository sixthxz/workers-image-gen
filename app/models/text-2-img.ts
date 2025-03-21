// @cf/lykon/dreamshaper-8-lcm
export async function generateDreamShaper8lcmImage(values: {
  prompt: string
  negative_prompt?: string
  height?: number
  width?: number
  num_steps?: number
  seed?: number
  guidance?: number
  strength?: number
}): Promise<any> {
  // Returns response object (image or error)
  const { prompt, negative_prompt, height, width, num_steps = 20, seed, guidance = 7.5, strength = 1 } = values

  const payload = {
    prompt,
    negative_prompt,
    height,
    width,
    num_steps,
    seed,
    guidance,
    strength,
  }

  return { model: "@cf/lykon/dreamshaper-8-lcm", payload }
}

// flux-1-schnell
export async function generateFlux1SchnellImage(values: {
  prompt: string
  steps?: number
}): Promise<any> {
  // Returns response object (image or error)
  let { prompt, steps = 4 } = values
  steps = Math.min(Math.max(steps, 1), 8)

  const payload = {
    prompt,
    steps,
  }

  return { model: "@cf/black-forest-labs/flux-1-schnell", payload }
}

// @cf/stabilityai/stable-diffusion-xl-base-1.0
export async function generateStableDiffusionXlBase1Image(values: {
  prompt: string
  negative_prompt?: string
  height?: number
  width?: number
  num_steps?: number
  seed?: number
  guidance?: number
  strength?: number
}): Promise<any> {
  // Returns response object (image or error)
  const { prompt, negative_prompt, height, width, num_steps = 20, seed, guidance = 7.5, strength = 1 } = values

  const payload = {
    prompt,
    negative_prompt,
    height,
    width,
    num_steps,
    seed,
    guidance,
    strength,
  }

  return { model: "@cf/stabilityai/stable-diffusion-xl-base-1.0", payload }
}

//@cf/bytedance/stable-diffusion-xl-lightning
export async function generateStableDiffusionXlLightningImage(values: {
  prompt: string
  negative_prompt?: string
  height?: number
  width?: number
  num_steps?: number
  seed?: number
  guidance?: number
  strength?: number
}): Promise<any> {
  // Returns response object (image or error)
  const { prompt, negative_prompt, height, width, num_steps = 20, seed, guidance = 7.5, strength = 1 } = values

  const payload = {
    prompt,
    negative_prompt,
    height,
    width,
    num_steps,
    seed,
    guidance,
    strength,
  }

  return { model: "@cf/bytedance/stable-diffusion-xl-lightning", payload }
}

