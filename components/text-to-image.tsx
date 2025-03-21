"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Define model types and their parameters
const modelConfigs = {
  "@cf/lykon/dreamshaper-8-lcm": {
    name: "Dreamshaper 8 LCM",
    params: ["negative_prompt", "height", "width", "num_steps", "guidance", "seed"],
  },
  "@cf/bytedance/stable-diffusion-xl-lightning": {
    name: "Stable Diffusion XL Lightning",
    params: ["negative_prompt", "height", "width", "num_steps", "guidance", "seed"],
  },
  "@cf/stabilityai/stable-diffusion-xl-base-1.0": {
    name: "Stable Diffusion XL Base 1.0",
    params: ["negative_prompt", "height", "width", "num_steps", "guidance", "seed"],
  },
  "@cf/black-forest-labs/flux-1-schnell": {
    name: "FLUX.1 Schnell",
    params: ["steps"],
  },
}

// Define a complete schema that includes all possible fields
const formSchema = z.object({
  model: z.string().min(1, {
    message: "Por favor selecciona un modelo",
  }),
  prompt: z.string().min(5, {
    message: "La descripción debe tener al menos 5 caracteres",
  }),
  negative_prompt: z.string().optional(),
  height: z.number().min(256).max(2048).default(512),
  width: z.number().min(256).max(2048).default(512),
  num_steps: z.number().min(1).max(20).default(20),
  guidance: z.number().min(1).max(20).default(7.5),
  seed: z.number().optional(),
  steps: z.number().min(1).max(8).default(4),
})

// Type for our form values
type FormValues = z.infer<typeof formSchema>

export default function TextToImage() {
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("@cf/lykon/dreamshaper-8-lcm")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: selectedModel,
      prompt: "",
      negative_prompt: "",
      height: 512,
      width: 512,
      num_steps: 20,
      guidance: 7.5,
      steps: 4,
    },
  })

  // Update form when model changes
  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    form.setValue("model", value)

    // Reset form values to defaults based on the model
    if (value === "@cf/black-forest-labs/flux-1-schnell") {
      form.setValue("steps", 4)
    } else {
      form.setValue("negative_prompt", "")
      form.setValue("height", 512)
      form.setValue("width", 512)
      form.setValue("num_steps", 20)
      form.setValue("guidance", 7.5)
    }
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      // Hacer la solicitud a la API
      const response = await fetch("/api/cloudflare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      // Crear una URL para la imagen a partir de la respuesta binaria
      const imageBlob = await response.blob()
      const imageUrl = URL.createObjectURL(imageBlob)
      setImage(imageUrl)
    } catch (error) {
      console.error("Error generating image:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleModelChange(value)
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="@cf/lykon/dreamshaper-8-lcm">Dreamshaper 8 LCM</SelectItem>
                    <SelectItem value="@cf/bytedance/stable-diffusion-xl-lightning">
                      Stable Diffusion XL Lightning
                    </SelectItem>
                    <SelectItem value="@cf/stabilityai/stable-diffusion-xl-base-1.0">
                      Stable Diffusion XL Base 1.0
                    </SelectItem>
                    <SelectItem value="@cf/black-forest-labs/flux-1-schnell">FLUX.1 Schnell</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe de manera detallada la imagen que deseas generar"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedModel !== "@cf/black-forest-labs/flux-1-schnell" && (
            <>
              <FormField
                control={form.control}
                name="negative_prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Negativo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe elementos que quieres evitar en la imagen"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ancho: {field.value}px</FormLabel>
                      <FormControl>
                        <Slider
                          min={256}
                          max={2048}
                          step={64}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alto: {field.value}px</FormLabel>
                      <FormControl>
                        <Slider
                          min={256}
                          max={2048}
                          step={64}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="num_steps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pasos de difusión: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={20}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guidance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guía: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={20}
                          step={0.5}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="seed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semilla (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Deja en blanco para aleatorio"
                        value={field.value === undefined ? "" : field.value}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : Number.parseInt(e.target.value, 10)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {selectedModel === "@cf/black-forest-labs/flux-1-schnell" && (
            <FormField
              control={form.control}
              name="steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pasos: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={8}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar Imagen"
            )}
          </Button>
        </form>
      </Form>

      {image && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium mb-4">Resultado:</h3>
              <div className="border rounded-lg overflow-hidden">
                <img src={image || "/placeholder.svg"} alt="Generated image" className="max-w-full h-auto" />
              </div>
              <p className="text-sm text-muted-foreground mt-2 max-w-full overflow-hidden text-ellipsis">
                {form.getValues().prompt}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

