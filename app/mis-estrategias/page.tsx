"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Share2, 
  Eye,
  Trash2,
  AlertCircle
} from "lucide-react"

interface EstrategiaGuardada {
  id: string
  debugCode: string
  datosEstrategia: any
  datosUsuario: any
  activa: boolean
  visualizaciones: number
  createdAt: string
  familiar?: {
    name: string
  }
}

export default function MisEstrategiasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [estrategias, setEstrategias] = useState<EstrategiaGuardada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin?callbackUrl=/mis-estrategias")
      return
    }

    cargarEstrategias()
  }, [session, status, router])

  const cargarEstrategias = async () => {
    try {
      const response = await fetch("/api/mis-estrategias")
      const data = await response.json()

      if (response.ok) {
        setEstrategias(data.estrategias)
      } else {
        setError(data.error || "Error al cargar estrategias")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const compartirEstrategia = (debugCode: string) => {
    const url = `${window.location.origin}/estrategia/${debugCode}`
    
    if (navigator.share) {
      navigator.share({
        title: "Mi Estrategia Modalidad 40",
        text: `¡Mira mi estrategia de Modalidad 40! ${url}`,
        url: url
      })
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert("Link copiado al portapapeles")
      })
    }
  }

  const eliminarEstrategia = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta estrategia?")) {
      return
    }

    try {
      const response = await fetch(`/api/mis-estrategias/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setEstrategias(estrategias.filter(e => e.id !== id))
      } else {
        alert("Error al eliminar la estrategia")
      }
    } catch (error) {
      alert("Error de conexión")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Estrategias Guardadas
          </h1>
          <p className="text-gray-600">
            Gestiona y comparte tus estrategias de Modalidad 40
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando estrategias...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : estrategias.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes estrategias guardadas
            </h3>
            <p className="text-gray-600 mb-6">
              Ve al simulador y guarda tu primera estrategia
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir al Simulador
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {estrategias.map((estrategia) => (
              <motion.div
                key={estrategia.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header de la tarjeta */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      {estrategia.datosEstrategia.estrategia === "fijo" ? "UMA Fijo" : "UMA Progresivo"}
                    </h3>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">
                      {estrategia.datosEstrategia.umaElegida} UMA
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm">
                    {estrategia.familiar?.name || "Sin familiar"}
                  </p>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  {/* Métricas principales */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(estrategia.datosEstrategia.pensionMensual)}
                      </div>
                      <div className="text-xs text-gray-500">Pensión mensual</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {estrategia.datosEstrategia.mesesM40}
                      </div>
                      <div className="text-xs text-gray-500">Meses M40</div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Creada: {formatDate(estrategia.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{estrategia.visualizaciones} visualizaciones</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(`/estrategia/${estrategia.debugCode}`, '_blank')}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </button>
                    <button
                      onClick={() => compartirEstrategia(estrategia.debugCode)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Share2 className="w-4 h-4" />
                      Compartir
                    </button>
                    <button
                      onClick={() => eliminarEstrategia(estrategia.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
