"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, Users, TrendingUp, Calendar, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

interface SavedStrategy {
  id: string
  debugCode: string
  datosEstrategia: any
  datosUsuario: any
  createdAt: string
  familiar?: {
    name: string
  }
}

export function SavedStrategiesList() {
  const [strategies, setStrategies] = useState<SavedStrategy[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const response = await fetch('/api/mis-estrategias')
        if (response.ok) {
          const data = await response.json()
          setStrategies(data.estrategias.slice(0, 3)) // Mostrar solo las 3 más recientes
        }
      } catch (error) {
        console.error('Error loading strategies:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStrategies()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const viewStrategy = (debugCode: string) => {
    window.open(`/estrategia/${debugCode}`, '_blank')
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando estrategias...</p>
      </div>
    )
  }

  if (strategies.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <FileText className="w-16 h-16 mx-auto" />
        </div>
        <p className="text-gray-600 mb-4">
          No tienes estrategias guardadas aún
        </p>
        <button 
          onClick={() => router.push('/simulador')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Crear Primera Estrategia
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {strategies.map((strategy, index) => (
        <motion.div
          key={strategy.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                 <Users className="w-4 h-4 text-blue-600" />
                 <span className="font-medium text-gray-900">
                   {strategy.datosUsuario?.nombreFamiliar || strategy.familiar?.name || 'Familiar'}
                 </span>
                 <span className="text-sm text-gray-500">
                   ({strategy.datosUsuario?.edadActual || 'N/A'} años)
                 </span>
               </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                                 <div className="flex items-center gap-2">
                   <TrendingUp className="w-4 h-4 text-green-600" />
                   <span className="text-gray-600">Estrategia:</span>
                   <span className="font-medium">
                     {strategy.datosEstrategia?.estrategia === 'fijo' ? 'Fija' : 'Progresiva'}
                   </span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-purple-600" />
                   <span className="text-gray-600">Duración:</span>
                   <span className="font-medium">{strategy.datosEstrategia?.mesesM40 || 'N/A'} meses</span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <span className="text-gray-600">UMA:</span>
                   <span className="font-medium">{strategy.datosEstrategia?.umaElegida || 'N/A'}</span>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   <span className="text-gray-600">Aportación:</span>
                   <span className="font-medium">
                     {strategy.datosUsuario?.aportacionPromedio ? formatCurrency(strategy.datosUsuario.aportacionPromedio) : 'N/A'}
                   </span>
                 </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Creada el {formatDate(strategy.createdAt)}
              </div>
            </div>
            
            <button
              onClick={() => viewStrategy(strategy.debugCode)}
              className="ml-4 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">Ver</span>
            </button>
          </div>
        </motion.div>
      ))}
      
      {strategies.length >= 3 && (
        <div className="text-center pt-4">
          <button 
            onClick={() => router.push('/mis-estrategias')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Ver todas las estrategias →
          </button>
        </div>
      )}
    </div>
  )
}
