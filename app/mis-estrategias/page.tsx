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
  AlertCircle,
  Clock,
  Target,
  CalendarDays,
  ArrowLeft
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
              // Show login modal instead of redirecting to deleted page
        // The login modal should handle the callback URL
        window.location.href = '/?login=true&callbackUrl=/mis-estrategias'
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

  const verEstrategia = (debugCode: string) => {
    router.push(`/estrategia/${debugCode}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long'
    })
  }

  const calcularFechaFin = (fechaInicio: string, mesesM40: number) => {
    const inicio = new Date(fechaInicio)
    const fin = new Date(inicio)
    fin.setMonth(fin.getMonth() + mesesM40)
    return fin.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long'
    })
  }

  const calcularAportacionMensual = (inversionTotal: number, mesesM40: number) => {
    return inversionTotal / mesesM40
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando estrategias...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center py-12 sm:py-20">
            <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Error al cargar estrategias</h2>
            <p className="text-gray-600 mb-4 px-4">{error}</p>
            <button
              onClick={cargarEstrategias}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (estrategias.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto p-4">
          <div className="text-center py-12 sm:py-20">
            <Target className="h-12 w-12 sm:h-16 sm:w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No tienes estrategias guardadas</h2>
            <p className="text-gray-600 mb-6 px-4">
              Crea tu primera estrategia de Modalidad 40 para empezar a planear tu jubilación
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Crear Estrategia
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header con botón de atrás */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </div>

        {/* Header */}
        <div className="text-center py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Mis Estrategias Guardadas
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Revisa y gestiona todas tus estrategias de Modalidad 40. Cada una es única y personalizada para tu situación.
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Estrategias</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{estrategias.length}</p>
              </div>
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Estrategias Activas</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {estrategias.filter(e => e.activa).length}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Visualizaciones</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {estrategias.reduce((sum, e) => sum + e.visualizaciones, 0)}
                </p>
              </div>
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Última Creada</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900">
                  {formatDate(estrategias[0]?.createdAt || '')}
                </p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Lista de Estrategias */}
        <div className="space-y-4 sm:space-y-6">
          {estrategias.map((estrategia) => {
            const datosEstrategia = estrategia.datosEstrategia
            const datosUsuario = estrategia.datosUsuario
            
            // Calcular fechas importantes
            const fechaInicio = datosEstrategia?.inicioM40 || datosUsuario?.inicioM40 || "2024-02-01"
            const mesesM40 = datosEstrategia?.mesesM40 || 36
            const fechaFin = calcularFechaFin(fechaInicio, mesesM40)
            
            // Calcular aportación mensual
            const inversionTotal = datosEstrategia?.inversionTotal || 0
            const aportacionMensual = calcularAportacionMensual(inversionTotal, mesesM40)
            
            return (
              <motion.div
                key={estrategia.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="p-4 sm:p-6">
                  {/* Header de la estrategia */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                          {datosUsuario?.nombreFamiliar || estrategia.familiar?.name || "Estrategia"}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium rounded-full">
                            {datosEstrategia?.estrategia || "Fijo"}
                          </span>
                          <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 text-xs sm:text-sm font-medium rounded-full">
                            UMA {datosEstrategia?.umaElegida || "15"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600">
                        Creada el {formatDate(estrategia.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => verEstrategia(estrategia.debugCode)}
                        className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </button>
                      <button
                        onClick={() => compartirEstrategia(estrategia.debugCode)}
                        className="bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 sm:gap-2 text-sm"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Compartir</span>
                      </button>
                      <button
                        onClick={() => eliminarEstrategia(estrategia.id)}
                        className="bg-red-100 text-red-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1 sm:gap-2 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  </div>

                  {/* Información principal */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
                    {/* Pensión Mensual */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 sm:p-4 rounded-lg border border-green-100">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        <span className="text-xs sm:text-sm font-medium text-green-700">Pensión Mensual</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold text-green-800">
                        {formatCurrency(datosEstrategia?.pensionMensual || 0)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Al jubilarse</p>
                    </div>

                    {/* Aportación Mensual */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        <span className="text-xs sm:text-sm font-medium text-blue-700">Aportación Mensual</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold text-blue-800">
                        {formatCurrency(aportacionMensual)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Durante M40</p>
                    </div>

                    {/* Fecha de Inicio */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 sm:p-4 rounded-lg border border-orange-100">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                        <span className="text-xs sm:text-sm font-medium text-orange-700">Inicia</span>
                      </div>
                      <p className="text-sm sm:text-lg font-bold text-orange-800">
                        {formatDate(fechaInicio)}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">Modalidad 40</p>
                    </div>

                    {/* Edad de Jubilación Objetivo */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 sm:p-4 rounded-lg border border-purple-100">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                        <span className="text-xs sm:text-sm font-medium text-purple-700">Edad de Jubilación</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold text-purple-800">
                        {datosUsuario?.edadJubilacion || datosEstrategia?.edad || datosUsuario?.edad || "65"} años
                      </p>
                      <p className="text-xs text-purple-600 mt-1">Objetivo</p>
                    </div>
                  </div>

                  {/* Detalles adicionales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Duración: <strong>{mesesM40} meses</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Familiar: <strong>{datosUsuario?.nombreFamiliar || estrategia.familiar?.name || "No especificado"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 sm:col-span-2 lg:col-span-1">
                      <Eye className="h-4 w-4" />
                      <span>Visualizaciones: <strong>{estrategia.visualizaciones}</strong></span>
                    </div>
                  </div>

                  {/* ROI y otros indicadores */}
                  {datosEstrategia?.ROI && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-lg border border-indigo-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-indigo-700 mb-1">Retorno de Inversión</p>
                          <p className="text-lg sm:text-2xl font-bold text-indigo-800">
                            {(datosEstrategia.ROI || 0).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-sm font-medium text-indigo-700 mb-1">Inversión Total</p>
                          <p className="text-base sm:text-xl font-bold text-indigo-800">
                            {formatCurrency(inversionTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
