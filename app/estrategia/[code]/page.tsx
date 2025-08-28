"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, AlertCircle, CheckCircle, Share2 } from "lucide-react"
import EstrategiaDetallada from "@/components/EstrategiaDetallada"

export default function EstrategiaCompartiblePage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const code = params.code as string
    
    if (!code) {
      setError("Código de estrategia no válido")
      setLoading(false)
      return
    }

    // Verificar si el código es válido (empieza con compra_ o integration_)
    if (!code.startsWith("compra_") && !code.startsWith("integration_")) {
      setError("Código de estrategia no válido")
      setLoading(false)
      return
    }

    setIsValid(true)
    cargarEstrategia(code)
  }, [params.code])

  const cargarEstrategia = async (code: string) => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/estrategia-compartible", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al cargar la estrategia")
      }

      setData(result)
    } catch (err: any) {
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const compartirEstrategia = () => {
    const url = window.location.href
    const mensaje = `¡Mira mi estrategia de Modalidad 40! ${url}`
    
    if (navigator.share) {
      navigator.share({
        title: "Mi Estrategia Modalidad 40",
        text: mensaje,
        url: url
      })
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(url).then(() => {
        alert("Link copiado al portapapeles")
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estrategia...</p>
        </div>
      </div>
    )
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Estrategia no encontrada
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "El código de estrategia no es válido o ha expirado."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 mx-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Estrategia Compartida
                  </h1>
                  <p className="text-sm text-gray-500">
                    Estrategia de Modalidad 40
                  </p>
                </div>
              </div>
              
              <button
                onClick={compartirEstrategia}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="py-8">
          <EstrategiaDetallada
            estrategia={data.estrategia}
            datosUsuario={data.datosUsuario}
            onVolver={() => window.history.back()}
          />
        </div>
      </div>
    )
  }

  return null
}
