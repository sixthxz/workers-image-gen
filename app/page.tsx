"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TextToImage from "@/components/text-to-image"
import ImageEditor from "@/components/image-editor"
import ImageToImage from "@/components/image-to-image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [isImageEditorEnabled, setIsImageEditorEnabled] = useState(false) // Aquí controlamos si la pestaña está habilitada

  return (
    <main className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex flex-col items-center text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Generación de imágenes con IA</h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
          Utiliza la inteligencia artificial de Cloudflare para generar y editar imágenes
        </p>
      </div>

      <Tabs defaultValue="text-to-image" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="text-to-image">Texto a Imagen</TabsTrigger>
          {/* Deshabilitamos el botón de "Editar Imagen" si isImageEditorEnabled es false */}
          <TabsTrigger
            value="image-editor"
            disabled={!isImageEditorEnabled}
            className={`${
              !isImageEditorEnabled ? "text-gray-400 cursor-not-allowed" : ""
            }`}
          >
            Editar Imagen
          </TabsTrigger>
          <TabsTrigger value="image-to-image">Imagen a Imagen</TabsTrigger>
        </TabsList>

        <Card>
          <TabsContent value="text-to-image">
            <CardHeader>
              <CardTitle>Texto a Imagen</CardTitle>
              <CardDescription>Genera imágenes a partir de descripciones textuales detalladas</CardDescription>
            </CardHeader>
            <CardContent>
              <TextToImage />
            </CardContent>
          </TabsContent>

          <TabsContent value="image-editor">
            <CardHeader>
              <CardTitle>Editar Imagen</CardTitle>
              <CardDescription>Sube una imagen, selecciona un área y describe qué quieres cambiar</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Aquí irá tu componente ImageEditor */}
              <ImageEditor />
            </CardContent>
          </TabsContent>

          <TabsContent value="image-to-image">
            <CardHeader>
              <CardTitle>Imagen a Imagen</CardTitle>
              <CardDescription>Transforma una imagen existente según tus instrucciones</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageToImage />
            </CardContent>
          </TabsContent>
        </Card>
      </Tabs>
    </main>
  )
}
