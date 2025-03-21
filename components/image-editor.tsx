"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function ImageEditor() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [drawing, setDrawing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Effect to initialize canvas when component mounts
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Set initial canvas size
        canvas.width = 512
        canvas.height = 512

        // Fill with light gray background
        ctx.fillStyle = "#f0f0f0"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Add text to indicate this is where to draw
        ctx.fillStyle = "#666666"
        ctx.font = "16px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Sube una imagen para comenzar", canvas.width / 2, canvas.height / 2)
      }
    }
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setResultImage(null)

        // Create image element to get dimensions
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          imageRef.current = img

          // Reset canvas when new image is uploaded
          if (canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext("2d")
            if (ctx) {
              // Set canvas dimensions based on image
              canvas.width = img.width
              canvas.height = img.height
              ctx.clearRect(0, 0, canvas.width, canvas.height)

              // Draw the image on the canvas
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            }
          }
        }

        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setDrawing(false)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.fill()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadedImage || !prompt) return

    setLoading(true)
    try {
      // Create a new canvas to extract the mask
      const tempCanvas = document.createElement("canvas")
      if (canvasRef.current) {
        tempCanvas.width = canvasRef.current.width
        tempCanvas.height = canvasRef.current.height
      }
      const tempCtx = tempCanvas.getContext("2d")

      if (tempCtx && canvasRef.current) {
        // Get the current canvas data (with the mask)
        const currentImageData = canvasRef.current
          .getContext("2d")
          ?.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)

        // Create binary mask (where the red marks are)
        const maskCanvas = document.createElement("canvas")
        maskCanvas.width = canvasRef.current.width
        maskCanvas.height = canvasRef.current.height
        const maskCtx = maskCanvas.getContext("2d")

        if (maskCtx && currentImageData) {
          // Fill with black (transparent in the mask)
          maskCtx.fillStyle = "black"
          maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

          // Create ImageData for the mask
          const maskImageData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height)

          // Set white pixels where the red marks are
          for (let i = 0; i < currentImageData.data.length; i += 4) {
            // Check if the pixel has red component (our mask)
            if (
              currentImageData.data[i] > 200 &&
              currentImageData.data[i + 1] < 100 &&
              currentImageData.data[i + 2] < 100
            ) {
              // Set white for the mask
              maskImageData.data[i] = 255
              maskImageData.data[i + 1] = 255
              maskImageData.data[i + 2] = 255
              maskImageData.data[i + 3] = 255
            } else {
              // Set black for non-mask
              maskImageData.data[i] = 0
              maskImageData.data[i + 1] = 0
              maskImageData.data[i + 2] = 0
              maskImageData.data[i + 3] = 255 // Set alpha to 255 (fully opaque)
            }
          }

          // Put the mask data on the mask canvas
          maskCtx.putImageData(maskImageData, 0, 0)

          // Convert to base64
          const maskBase64 = maskCanvas.toDataURL("image/png")

          // Extraer solo la parte base64 sin el prefijo de URL de datos
          let imageBase64 = uploadedImage
          if (imageBase64.includes(",")) {
            imageBase64 = imageBase64.split(",")[1]
          }

          let maskBase64Clean = maskBase64
          if (maskBase64Clean.includes(",")) {
            maskBase64Clean = maskBase64Clean.split(",")[1]
          }

          // Call the API
          const response = await fetch("/api/cloudflare", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operation: "inpainting",
              model: "@cf/runwayml/stable-diffusion-v1-5-inpainting",
              prompt,
              image_b64: imageBase64,
              mask_b64: maskBase64Clean,
              mask_image: maskBase64Clean,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Error: ${response.status}` }))
            throw new Error(errorData.error || `Error: ${response.status}`)
          }

          // Crear una URL para la imagen a partir de la respuesta binaria
          const imageBlob = await response.blob()
          const imageUrl = URL.createObjectURL(imageBlob)
          setResultImage(imageUrl)
        }
      }
    } catch (error) {
      console.error("Error editing image:", error)
      alert("Error editing image")
    } finally {
      setLoading(false)
    }
  }

  const resetCanvas = () => {
    if (canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="image-upload">Sube una imagen</Label>
        <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      <div className="space-y-2">
        <Label>Dibuja sobre las áreas que quieres modificar</Label>
        <div className="border rounded-lg overflow-hidden flex justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseLeave={stopDrawing}
            className="cursor-crosshair max-w-full h-auto"
            style={{ maxHeight: "500px", objectFit: "contain" }}
          />
        </div>
        <Button variant="outline" onClick={resetCanvas} className="mt-2">
          Reiniciar selección
        </Button>
      </div>

      {uploadedImage && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">¿Qué te gustaría reemplazar en esta imagen?</Label>
            <Textarea
              id="prompt"
              placeholder="Describe lo que quieres cambiar en las áreas seleccionadas"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar"
            )}
          </Button>
        </form>
      )}

      {resultImage && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium mb-4">Resultado:</h3>
              <div className="border rounded-lg overflow-hidden flex justify-center">
                <img
                  src={resultImage || "/placeholder.svg"}
                  alt="Edited image"
                  className="max-w-full h-auto"
                  style={{ maxHeight: "500px", objectFit: "contain" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

