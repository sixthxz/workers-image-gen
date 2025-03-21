"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ImageToImage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [strength, setStrength] = useState(0.65)
  const [guidance, setGuidance] = useState(15)
  const [loading, setLoading] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setResultImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadedImage || !prompt) return

    setLoading(true)
    try {
      // Asegurarse de que la imagen base64 esté correctamente formateada
      // Extraer solo la parte base64 sin el prefijo de URL de datos
      let imageBase64 = uploadedImage
      if (imageBase64.includes(",")) {
        imageBase64 = imageBase64.split(",")[1]
      }

      // Llamar a la API
      const response = await fetch("/api/cloudflare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "img2img",
          model: "@cf/runwayml/stable-diffusion-v1-5-img2img",
          prompt,
          image_b64: imageBase64,
          strength,
          guidance,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      // Crear una URL para la imagen a partir de la respuesta binaria
      const imageBlob = await response.blob()
      const imageUrl = URL.createObjectURL(imageBlob)
      setResultImage(imageUrl)
    } catch (error) {
      console.error("Error transforming image:", error)
      alert("Error transforming image")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="image-upload">Sube una imagen</Label>
        <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      {uploadedImage && (
        <>
          <div className="border rounded-lg overflow-hidden">
            <img src={uploadedImage || "/placeholder.svg"} alt="Uploaded image" className="max-w-full h-auto mx-auto" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Describe las modificaciones que quieres</Label>
              <Textarea
                id="prompt"
                placeholder="Describe cómo quieres transformar esta imagen"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="strength">Intensidad: {strength.toFixed(2)}</Label>
                </div>
                <Slider
                  id="strength"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={[strength]}
                  onValueChange={(value) => setStrength(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Controla cuánto de la imagen original se preserva (valores bajos = más fiel al original)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="guidance">Guía: {guidance}</Label>
                </div>
                <Slider
                  id="guidance"
                  min={1}
                  max={30}
                  step={1}
                  value={[guidance]}
                  onValueChange={(value) => setGuidance(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Controla cuánto se adhiere al prompt (valores altos = más fiel al prompt)
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Transformar Imagen"
              )}
            </Button>
          </form>

          {resultImage && (
            <Card className="mt-8">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-medium mb-4">Resultado:</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={resultImage || "/placeholder.svg"}
                      alt="Transformed image"
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

