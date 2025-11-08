"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { Crown, Lock, TrendingUp, Eye, ArrowRight, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import PremiumModal from "../PremiumModal"
import { useFormatters } from "@/hooks/useFormatters"
import { SimilarStrategyCard } from "./SimilarStrategyCard"
import { SimilarStrategyFilters } from "./SimilarStrategyFilters"
import { StrategyResult, IntegrationFilters, FamilyMemberData } from "@/types/strategy"
import { getMaxAportacion } from "@/lib/all/umaConverter"
import { calculateAge } from "@/components/integration/utils/calculations"

interface PremiumUpsellSectionProps {
  estrategiaActual: {
    estrategia: string
    umaElegida: number
    mesesM40: number
    pensionMensual: number
    inversionTotal?: number
    ROI?: number
  }
  datosUsuario: {
    edad?: number
    edadJubilacion?: string | number
    fechaNacimiento?: string
    semanasPrevias?: number
    semanasCotizadas?: number
    sdiHistorico?: number
    dependiente?: string
    estadoCivil?: string
    inicioM40?: string
  }
}

// Número inicial de estrategias a mostrar (menos en móvil para reducir scroll)
const INITIAL_DISPLAY_COUNT_MOBILE = 4
const INITIAL_DISPLAY_COUNT_DESKTOP = 8

export default function PremiumUpsellSection({ estrategiaActual, datosUsuario }: PremiumUpsellSectionProps) {
  const { data: session } = useSession()
  const { currency: formatCurrency } = useFormatters()
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [strategies, setStrategies] = useState<StrategyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Calcular valores iniciales para los filtros
  const initialRetirementAge = useMemo(() => {
    if (datosUsuario.edadJubilacion) {
      return typeof datosUsuario.edadJubilacion === 'string' 
        ? parseInt(datosUsuario.edadJubilacion) 
        : datosUsuario.edadJubilacion
    }
    if (datosUsuario.edad) {
      return datosUsuario.edad
    }
    if (datosUsuario.fechaNacimiento) {
      const age = calculateAge(datosUsuario.fechaNacimiento)
      return age + (65 - age)
    }
    return 65
  }, [datosUsuario])

  const initialMonthlyContributionRange = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const maxAportacion = getMaxAportacion(currentYear)
    
    if (estrategiaActual.inversionTotal && estrategiaActual.mesesM40) {
      const aportacionPromedio = estrategiaActual.inversionTotal / estrategiaActual.mesesM40
      const min = Math.max(1000, Math.floor(aportacionPromedio * 0.5))
      const max = Math.min(maxAportacion, Math.ceil(aportacionPromedio * 2))
      return { min, max }
    }
    
    return { min: 1000, max: Math.min(15000, maxAportacion) }
  }, [estrategiaActual])

  // Calcular valores iniciales de filtros
  const initialFilters = useMemo<IntegrationFilters>(() => ({
    familyMemberId: null,
    monthlyContributionRange: initialMonthlyContributionRange,
    months: estrategiaActual.mesesM40 || 24,
    retirementAge: initialRetirementAge,
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear(),
    monthsMode: 'scan' // Generar todas las estrategias posibles
  }), [initialMonthlyContributionRange, initialRetirementAge, estrategiaActual.mesesM40])
  
  // Inicializar filtros con valores calculados (solo una vez al montar)
  const [filters, setFilters] = useState<IntegrationFilters>(() => initialFilters)

  // No mostrar si el usuario es premium
  if ((session?.user as any)?.subscription === 'premium') {
    return null
  }

  // Construir familyData desde datosUsuario
  const familyData = useMemo<FamilyMemberData | null>(() => {
    if (!datosUsuario.fechaNacimiento) return null

    const birthDate = new Date(datosUsuario.fechaNacimiento)
    const weeksContributed = datosUsuario.semanasPrevias || datosUsuario.semanasCotizadas || 0
    const sdiHistorico = datosUsuario.sdiHistorico || 0
    const lastGrossSalary = sdiHistorico * 30.4 // Convertir SDI diario a mensual
    
    // Determinar estado civil
    let civilStatus = 'soltero'
    if (datosUsuario.dependiente === 'conyuge' || datosUsuario.estadoCivil === 'casado') {
      civilStatus = 'casado'
    }

    return {
      id: 'premium-upsell-user',
      name: datosUsuario.fechaNacimiento ? 'Usuario' : 'Usuario',
      birthDate,
      weeksContributed,
      lastGrossSalary,
      civilStatus: civilStatus as 'casado' | 'soltero'
    }
  }, [datosUsuario])


  // Calcular estrategias cuando cambien los filtros o datos (con debounce como FamilySimulatorIntegration)
  useEffect(() => {
    if (!familyData) return

    // Cancelar el timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Crear nuevo timer
    const timer = setTimeout(() => {
      const calculateStrategies = async () => {
        setLoading(true)
        setError(null)

        try {
          // Configurar filtros optimizados para generar todas las estrategias posibles (igual que FamilySimulatorIntegration)
          // La API calcula el rango de UMA desde monthlyContributionRange, así que solo agregamos monthsMode: 'scan'
          const optimizedFilters = {
            ...filters,
            // Agregar monthsMode: 'scan' para generar todas las estrategias posibles (CRÍTICO)
            // Esto permite que la API genere estrategias para todos los meses posibles, no solo el valor específico
            monthsMode: 'scan' as const
          }

          // Debug: mostrar los filtros optimizados que se están usando
          console.log('🔍 Calculando estrategias con filtros optimizados:', optimizedFilters)
          console.log('🔍 Filtros originales:', filters)

          const response = await fetch('/api/calculate-strategies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              familyData,
              filters: optimizedFilters // Usar filtros optimizados con monthsMode: 'scan'
            }),
          })

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          const calculatedStrategies = data.strategies || []
          
          // Filtrar estrategias según los filtros del usuario
          // 1. Filtrar por meses (el usuario especificó un valor específico en filters.months)
          // 2. Filtrar por rango de aportación mensual (ya se aplica en la API, pero verificamos)
          // 3. Filtrar por edad de jubilación (ya se aplica en la API, pero verificamos)
          const filteredStrategies = calculatedStrategies
            .filter((s: StrategyResult) => {
              // Filtrar por meses: solo mostrar estrategias con el número exacto de meses especificado
              const monthsMatch = (s.mesesM40 || 0) === filters.months
              
              // Filtrar por pensión e inversión válidas
              const hasValidData = s.pensionMensual && s.inversionTotal
              
              return monthsMatch && hasValidData
            })
          
          // Ordenar estrategias
          const sortedStrategies = filteredStrategies
            .sort((a: StrategyResult, b: StrategyResult) => {
              // Ordenar por pensión mensual descendente
              return (b.pensionMensual || 0) - (a.pensionMensual || 0)
            })
            .slice(0, 50) // Limitar a 50 estrategias máximo

          console.log('🔍 Estrategias filtradas:', {
            total: calculatedStrategies.length,
            filtradas: filteredStrategies.length,
            mesesBuscado: filters.months,
            mesesEncontrados: [...new Set(sortedStrategies.map(s => s.mesesM40))]
          })

          setStrategies(sortedStrategies)
        } catch (err) {
          console.error('Error calculando estrategias:', err)
          setError(err instanceof Error ? err.message : 'Error desconocido')
          setStrategies([])
        } finally {
          setLoading(false)
        }
      }

      calculateStrategies()
    }, 500) // 500ms de delay (debounce)

    debounceTimerRef.current = timer

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [familyData, filters])

  // Detectar si es móvil para mostrar menos estrategias inicialmente
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const initialDisplayCount = isMobile ? INITIAL_DISPLAY_COUNT_MOBILE : INITIAL_DISPLAY_COUNT_DESKTOP
  const displayedStrategies = showAll ? strategies : strategies.slice(0, initialDisplayCount)
  const hasMoreStrategies = strategies.length > initialDisplayCount

  const handleUnlock = () => {
    setShowPremiumModal(true)
  }

  return (
    <>
      {/* Componente de Upsell Premium - Clase no-pdf para ocultar en PDF */}
      <div className="no-pdf mt-4 md:mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 overflow-hidden relative"
        >
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            {/* Header - Compacto en móvil */}
            <div className="text-center mb-4 md:mb-6">
              <div className="inline-flex items-center gap-1.5 md:gap-2 bg-purple-100 text-purple-800 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm lg:text-base font-semibold mb-3 md:mb-4">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Desbloquea más de 2,000 estrategias</span>
                <span className="sm:hidden">2,000+ estrategias</span>
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 px-2">
                ¿Quieres ver más opciones similares?
              </h3>
              <p className="text-sm md:text-base lg:text-lg text-gray-700 max-w-2xl mx-auto px-2">
                Con el <strong>Plan Premium</strong> accedes a todas las estrategias personalizadas, 
                análisis completo y PDFs ilimitados por solo <strong className="text-purple-600">$200 MXN de por vida</strong>.
              </p>
            </div>

            {/* Filtros */}
            {familyData && (
              <SimilarStrategyFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-6 md:py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-purple-600 mb-3 md:mb-4"></div>
                <p className="text-gray-600 text-sm md:text-base lg:text-lg">Calculando estrategias similares...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg md:rounded-xl p-4 md:p-6 mb-4 md:mb-6">
                <p className="text-red-800 text-center text-sm md:text-base">
                  Error al cargar estrategias: {error}
                </p>
              </div>
            )}

            {/* Estrategias Calculadas */}
            {!loading && !error && strategies.length > 0 && (
              <>
                <div className="mb-3 md:mb-4">
                  <p className="text-gray-700 text-center text-sm md:text-base lg:text-lg font-semibold">
                    {strategies.length} estrategias similares encontradas
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6">
                  <AnimatePresence>
                    {displayedStrategies.map((estrategia, index) => (
                      <SimilarStrategyCard
                        key={`strategy-${index}-${estrategia.umaElegida}-${estrategia.mesesM40}`}
                        strategy={estrategia}
                        onUnlock={handleUnlock}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Botón Ver Más / Ver Menos */}
                {hasMoreStrategies && (
                  <div className="text-center mb-4 md:mb-6">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="inline-flex items-center gap-2 bg-white text-purple-600 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-semibold hover:bg-purple-50 transition-all duration-200 border-2 border-purple-200 hover:border-purple-300 w-full sm:w-auto"
                    >
                      {showAll ? (
                        <>
                          <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
                          <span>Ver menos</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                          <span>Ver más ({strategies.length - initialDisplayCount} adicionales)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Sin estrategias */}
            {!loading && !error && strategies.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg md:rounded-xl p-4 md:p-6 mb-4 md:mb-6">
                <p className="text-yellow-800 text-center text-sm md:text-base">
                  No se encontraron estrategias similares con los filtros actuales.
                </p>
              </div>
            )}

            {/* Beneficios Premium - Compacto en móvil */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 mb-4 md:mb-6 lg:mb-8 border border-purple-200">
              <h4 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
                Con Premium obtienes:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-1">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm md:text-base lg:text-lg mb-0.5 md:mb-1">
                      2,000+ Estrategias
                    </div>
                    <div className="text-xs md:text-sm lg:text-base text-gray-600">
                      Todas las combinaciones posibles analizadas
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-1">
                    <Eye className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm md:text-base lg:text-lg mb-0.5 md:mb-1">
                      Análisis Completo
                    </div>
                    <div className="text-xs md:text-sm lg:text-base text-gray-600">
                      Proyección detallada de 20 años
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-1">
                    <Crown className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm md:text-base lg:text-lg mb-0.5 md:mb-1">
                      De por Vida
                    </div>
                    <div className="text-xs md:text-sm lg:text-base text-gray-600">
                      Una sola compra, acceso ilimitado
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Principal - Optimizado para móvil */}
            <div className="text-center">
              <button
                onClick={() => setShowPremiumModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 md:px-8 py-3 md:py-4 lg:py-5 rounded-lg md:rounded-xl text-base md:text-lg lg:text-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 md:gap-3 mx-auto min-h-[56px] md:min-h-[64px] w-full sm:w-auto sm:min-w-[280px] md:min-w-[300px]"
              >
                <Crown className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                <span className="text-sm md:text-base lg:text-lg">Desbloquear Premium - $200 MXN</span>
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
              </button>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 mt-2 md:mt-4 px-2">
                Pago único • Acceso de por vida • Sin renovaciones
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal Premium */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>
  )
}

