"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, Users, TrendingUp, Calendar, FileText, Rocket, CheckCircle } from "lucide-react"
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

interface SavedStrategiesListProps {
  familyMembersCount?: number
}

export function SavedStrategiesList({ familyMembersCount = 0 }: SavedStrategiesListProps) {
  const [strategies, setStrategies] = useState<SavedStrategy[]>([])
  const [allStrategies, setAllStrategies] = useState<SavedStrategy[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const router = useRouter()

  // Calcular límite de estrategias basado en cantidad de familiares
  // Si hay pocos familiares (0-2), mostrar más estrategias (5)
  // Si hay algunos familiares (3-5), mostrar menos (3)
  // Si hay muchos familiares (6+), mostrar muy pocas (2)
  const calcularLimiteEstrategias = (familiares: number): number => {
    if (familiares <= 2) return 5
    if (familiares <= 5) return 3
    return 2
  }

  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const response = await fetch('/api/mis-estrategias')
        if (response.ok) {
          const data = await response.json()
          setAllStrategies(data.estrategias)
          const limite = calcularLimiteEstrategias(familyMembersCount)
          setStrategies(data.estrategias.slice(0, limite))
        }
      } catch (error) {
        console.error('Error loading strategies:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStrategies()
  }, [familyMembersCount])

  // Actualizar estrategias mostradas cuando cambia showAll o familyMembersCount
  useEffect(() => {
    if (showAll) {
      setStrategies(allStrategies)
    } else {
      const limite = calcularLimiteEstrategias(familyMembersCount)
      setStrategies(allStrategies.slice(0, limite))
    }
  }, [showAll, allStrategies, familyMembersCount])

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
    // Detectar si es estrategia yam40 y redirigir a la ruta correcta
    const route = debugCode.startsWith('yam40_') 
      ? `/yam40-estrategia/${debugCode}`
      : `/estrategia/${debugCode}`
    window.open(route, '_blank')
  }

  // Función para detectar tipo de estrategia
  const getTipoEstrategia = (debugCode: string): 'desde-cero' | 'yam40-actual' | 'yam40-mejora' | 'otra' => {
    if (debugCode.startsWith('integration_')) {
      return 'desde-cero'
    }
    if (debugCode.startsWith('yam40_')) {
      if (debugCode.includes('_mejora_')) {
        return 'yam40-mejora'
      }
      return 'yam40-actual'
    }
    return 'otra'
  }

  // Función para obtener información del tipo de estrategia
  const getTipoInfo = (tipo: 'desde-cero' | 'yam40-actual' | 'yam40-mejora' | 'otra') => {
    switch (tipo) {
      case 'desde-cero':
        return {
          badge: { text: 'Estrategia Nueva', icon: Rocket, color: 'bg-blue-100 text-blue-800' },
          border: 'border-l-4 border-blue-500',
          title: null // Usar nombre del familiar
        }
      case 'yam40-actual':
        return {
          badge: { text: 'Mi M40 Actual', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
          border: 'border-l-4 border-green-500',
          title: 'Mi Modalidad 40 Actual'
        }
      case 'yam40-mejora':
        return {
          badge: { text: 'Mejora', icon: TrendingUp, color: 'bg-purple-100 text-purple-800' },
          border: 'border-l-4 border-purple-500',
          title: 'Mejora de Estrategia'
        }
      default:
        return {
          badge: { text: 'Estrategia', icon: FileText, color: 'bg-gray-100 text-gray-800' },
          border: 'border-l-4 border-gray-500',
          title: null
        }
    }
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
      {strategies.map((strategy, index) => {
        // Detectar tipo de estrategia
        const tipoEstrategia = getTipoEstrategia(strategy.debugCode)
        const tipoInfo = getTipoInfo(tipoEstrategia)
        const BadgeIcon = tipoInfo.badge.icon
        
        // Determinar título a mostrar
        const tituloMostrar = tipoInfo.title || strategy.datosUsuario?.nombreFamiliar || strategy.familiar?.name || 'Familiar'
        
        return (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gray-50 p-2 md:p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors ${tipoInfo.border}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2 flex-wrap">
                  {tipoEstrategia === 'desde-cero' && <Users className="w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />}
                  <span className="font-medium text-gray-900 text-xs md:text-sm truncate">
                    {tituloMostrar}
                  </span>
                  {tipoEstrategia === 'desde-cero' && (
                    <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">
                      ({strategy.datosUsuario?.edadActual || 'N/A'} años)
                    </span>
                  )}
                  {/* Badge de tipo de estrategia */}
                  <span className={`px-1.5 md:px-2 py-0.5 md:py-1 ${tipoInfo.badge.color} text-[10px] md:text-xs font-medium rounded-full flex items-center gap-0.5 md:gap-1 flex-shrink-0`}>
                    <BadgeIcon className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    <span className="hidden sm:inline">{tipoInfo.badge.text}</span>
                  </span>
                </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-4 text-[10px] md:text-sm">
                {/* Solo mostrar información detallada si no es yam40 */}
                {tipoEstrategia !== 'yam40-actual' && tipoEstrategia !== 'yam40-mejora' && (
                  <>
                    <div className="flex items-center gap-1 md:gap-2">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-600 truncate">Estrategia:</span>
                      <span className="font-medium truncate">
                        {strategy.datosEstrategia?.estrategia === 'fijo' ? 'Fija' : 'Progresiva'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 md:gap-2">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-gray-600 truncate">Duración:</span>
                      <span className="font-medium truncate">{strategy.datosEstrategia?.mesesM40 || 'N/A'} meses</span>
                    </div>
                    
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-gray-600 truncate">UMA:</span>
                      <span className="font-medium truncate">{strategy.datosEstrategia?.umaElegida || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-gray-600 truncate">Aportación:</span>
                      <span className="font-medium truncate">
                        {strategy.datosUsuario?.aportacionPromedio ? formatCurrency(strategy.datosUsuario.aportacionPromedio) : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
                {/* Para yam40, mostrar información relevante */}
                {(tipoEstrategia === 'yam40-actual' || tipoEstrategia === 'yam40-mejora') && (
                  <>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 text-purple-600 flex-shrink-0" />
                      <span className="text-gray-600 truncate">Meses:</span>
                      <span className="font-medium truncate">{strategy.datosEstrategia?.mesesM40 || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 md:gap-2">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-600 truncate">Pensión:</span>
                      <span className="font-medium truncate">
                        {strategy.datosEstrategia?.pensionMensual ? formatCurrency(strategy.datosEstrategia.pensionMensual) : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-1 md:mt-2 text-[9px] md:text-xs text-gray-500">
                {formatDate(strategy.createdAt)}
              </div>
            </div>
            
            <button
              onClick={() => viewStrategy(strategy.debugCode)}
              className="ml-2 md:ml-4 bg-blue-600 text-white p-1.5 md:p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 md:gap-2 flex-shrink-0"
            >
              <Eye className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-[10px] md:text-sm hidden sm:inline">Ver</span>
            </button>
          </div>
        </motion.div>
        )
      })}
      
      {allStrategies.length > calcularLimiteEstrategias(familyMembersCount) && (
        <div className="text-center pt-2 md:pt-4">
          {!showAll ? (
            <button 
              onClick={() => setShowAll(true)}
              className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium"
            >
              Ver {allStrategies.length - calcularLimiteEstrategias(familyMembersCount)} más →
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setShowAll(false)}
                className="text-gray-600 hover:text-gray-700 text-xs md:text-sm font-medium"
              >
                Ver menos ↑
              </button>
              <button 
                onClick={() => router.push('/mis-estrategias')}
                className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium"
              >
                Ver todas las estrategias →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
