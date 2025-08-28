"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react"
import EstrategiaDetallada from "@/components/EstrategiaDetallada"

export default function DebugEstrategiaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [debugCode, setDebugCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState<any>(null)
  const [isCompra, setIsCompra] = useState(false)

  // Protección de autenticación
  useEffect(() => {
    if (status === "loading") return // Esperar a que se cargue la sesión
    
    if (!session) {
      // Redirigir a login si no está autenticado
      router.push("/auth/signin?callbackUrl=/debug-estrategia")
      return
    }
  }, [session, status, router])

  // Mostrar loading mientras se verifica la autenticación
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // No mostrar nada si no está autenticado (se redirigirá)
  if (!session) {
    return null
  }

  // Verificar si es una compra desde URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const estrategia = urlParams.get('estrategia')
    const uma = urlParams.get('uma')
    const premium = urlParams.get('premium')
    const meses = urlParams.get('meses')
    const edad = urlParams.get('edad')
    const dependiente = urlParams.get('dependiente')
    const sdi = urlParams.get('sdi')
    const semanas = urlParams.get('semanas')
    const fecha = urlParams.get('fecha')
    
    if (code && (estrategia || premium)) {
      setIsCompra(true)
      setDebugCode(code)
      
      // Auto-cargar datos si es una compra
      handleCompraAutomatica(code, estrategia || undefined, uma || undefined, premium === 'true', {
        meses: meses || undefined,
        edad: edad || undefined,
        dependiente: dependiente || undefined,
        sdi: sdi || undefined,
        semanas: semanas || undefined,
        fecha: fecha || undefined
      })
    }
  }, [])

  const handleCompraAutomatica = async (code: string, estrategia?: string, uma?: string, premium?: boolean, datosUsuario?: any) => {
    setLoading(true)
    setError("")
    setData(null)

    try {
      const response = await fetch("/api/debug-estrategia-detallada", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          debugCode: code,
          estrategia,
          uma,
          premium,
          datosUsuario
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al obtener datos")
      }

      setData(result)
    } catch (err: any) {
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!debugCode.trim()) return

    setLoading(true)
    setError("")
    setData(null)

    try {
      const response = await fetch("/api/debug-estrategia-detallada", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ debugCode: debugCode.trim() }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al obtener datos")
      }

      setData(result)
    } catch (err: any) {
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const handleVolver = () => {
    setData(null)
    setError("")
  }

  // Ejemplos de debug codes para facilitar las pruebas
  const ejemplos = [
    "DEBUG_36_fijo_15_58_conyuge_150_500_2024-02-01",
    "DEBUG_48_progresivo_20_55_ninguno_200_600_2024-03-01",
    "DEBUG_24_fijo_10_60_conyuge_120_450_2024-01-01"
  ]

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {isCompra && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">
                    ¡Compra exitosa! 🎉
                  </h3>
                  <p className="text-sm text-green-700">
                    Tu estrategia está lista. Descarga el PDF con todos los detalles.
                  </p>
                </div>
              </div>
            </div>
          )}
          <EstrategiaDetallada 
            estrategia={data.estrategia}
            datosUsuario={data.datosUsuario}
            onVolver={handleVolver}
            debugCode={debugCode}
            familyMemberId={data.datosUsuario?.familyMemberId}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Debug: Estrategia Detallada
              </h1>
              <p className="text-gray-600">
                Prueba la interfaz de estrategia detallada con debug codes
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  Instrucciones de uso
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ingresa un debug code válido (formato: DEBUG_meses_estrategia_uma_edad_dependiente_sdi_semanas_fecha)</li>
                  <li>• Usa los ejemplos proporcionados para pruebas rápidas</li>
                  <li>• La interfaz mostrará todos los detalles de la estrategia seleccionada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="debugCode" className="block text-sm font-medium text-gray-700 mb-2">
                Debug Code
              </label>
              <input
                type="text"
                id="debugCode"
                value={debugCode}
                onChange={(e) => setDebugCode(e.target.value)}
                placeholder="DEBUG_36_fijo_15_58_conyuge_150_500_2024-02-01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !debugCode.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Cargando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Ver Estrategia Detallada
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ejemplos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Ejemplos de Debug Codes
          </h2>
          
          <div className="space-y-3">
            {ejemplos.map((ejemplo, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <code className="text-sm text-gray-700 font-mono">{ejemplo}</code>
                  <div className="text-xs text-gray-500 mt-1">
                    {ejemplo.includes("fijo") ? "Estrategia UMA Fijo" : "Estrategia UMA Progresivo"} • 
                    {ejemplo.includes("conyuge") ? " Con cónyuge" : " Sin dependientes"}
                  </div>
                </div>
                <button
                  onClick={() => setDebugCode(ejemplo)}
                  className="ml-4 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm rounded-md transition-colors"
                >
                  Usar
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">Formato del Debug Code</h3>
                <p className="text-sm text-yellow-700">
                  <strong>DEBUG_meses_estrategia_uma_edad_dependiente_sdi_semanas_fecha</strong>
                </p>
                <ul className="text-xs text-yellow-700 mt-2 space-y-1">
                  <li>• <strong>meses:</strong> 12-58 (meses en M40)</li>
                  <li>• <strong>estrategia:</strong> fijo o progresivo</li>
                  <li>• <strong>uma:</strong> 1-25 (nivel UMA)</li>
                  <li>• <strong>edad:</strong> 45-65 (edad de jubilación)</li>
                  <li>• <strong>dependiente:</strong> conyuge o ninguno</li>
                  <li>• <strong>sdi:</strong> 100-500 (SDI histórico)</li>
                  <li>• <strong>semanas:</strong> 300-1000 (semanas cotizadas)</li>
                  <li>• <strong>fecha:</strong> YYYY-MM-DD (inicio M40)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
