import { motion } from "framer-motion"
import { ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import { StrategyResult, StrategyFilters } from "@/types/strategy"
import { StrategyRow } from "./StrategyRow"
import { Session } from "next-auth"
import { useState, useMemo, useEffect } from "react"
import { useFormatters } from "@/hooks/useFormatters"
// Ya no necesitamos importar funciones de conversión, usamos solo valores reales

interface StrategyListProps {
  strategies: StrategyResult[]
  strategyFilters: StrategyFilters
  onStrategyFiltersChange: (filters: StrategyFilters) => void
  session: Session | null
  userPlan: string
  hasUsedFreeStrategy?: boolean // Nuevo: indica si el usuario ya usó su estrategia gratis
  onStrategyPurchase: (strategy: StrategyResult) => void
  onPremiumModalOpen: () => void
  onViewDetails: (strategy: StrategyResult) => void
  onDownloadPDF: (strategy: StrategyResult) => void
}

export function StrategyList({
  strategies,
  strategyFilters,
  onStrategyFiltersChange,
  session,
  userPlan,
  hasUsedFreeStrategy = false,
  onStrategyPurchase,
  onPremiumModalOpen,
  onViewDetails,
  onDownloadPDF
}: StrategyListProps) {
  const { currency: formatCurrency } = useFormatters()
  
  // Estado para el modo de filtrado (UMA o Aportación Mensual)
  const [filterMode, setFilterMode] = useState<'uma' | 'contribution'>(strategyFilters.filterMode || 'contribution')
  
  // Rango fijo de aportación mensual: 1000 a 25000
  const contributionRangeFixed = { min: 1000, max: 25000 }
  
  // Rango fijo de UMA: siempre 1-25
  const umaRangeFixed = { min: 1, max: 25 }
  
  // Inicializar contributionRange si no existe
  useEffect(() => {
    if (!strategyFilters.contributionRange && filterMode === 'contribution') {
      updateStrategyFilters({ 
        contributionRange: contributionRangeFixed,
        filterMode: filterMode
      })
    }
  }, [filterMode])
  
  // Inicializar umaRange con rango fijo 1-25 siempre al montar
  useEffect(() => {
    // Siempre establecer 1-25 al inicio, sin importar qué valores tenga
    if (!strategyFilters.umaRange || 
        strategyFilters.umaRange.min !== 1 || 
        strategyFilters.umaRange.max !== 25) {
      updateStrategyFilters({
        umaRange: umaRangeFixed
      })
    }
  }, []) // Solo al montar el componente
  
  // Forzar rango 1-25 cuando se cambia a modo UMA
  useEffect(() => {
    if (filterMode === 'uma') {
      // Si el rango no es 1-25, forzarlo
      const currentRange = strategyFilters.umaRange
      if (!currentRange || currentRange.min !== 1 || currentRange.max !== 25) {
        console.log('🔧 Forzando rango UMA a 1-25. Rango actual:', currentRange)
        updateStrategyFilters({
          umaRange: { min: 1, max: 25 }
        })
      }
    }
  }, [filterMode]) // Solo cuando cambia el modo de filtro
  
  // Sincronizar filterMode con strategyFilters
  useEffect(() => {
    if (strategyFilters.filterMode !== filterMode) {
      updateStrategyFilters({ filterMode })
    }
  }, [filterMode, strategyFilters.filterMode])
  
  const updateStrategyFilters = (updates: Partial<StrategyFilters>) => {
    onStrategyFiltersChange({ ...strategyFilters, ...updates })
  }
  
  // Función para cambiar entre modos usando SOLO valores reales de estrategias
  const toggleFilterMode = () => {
    const newMode = filterMode === 'uma' ? 'contribution' : 'uma'
    setFilterMode(newMode)
    
    if (newMode === 'contribution') {
      // Al cambiar a aportación, buscar aportaciones reales de estrategias con esas UMAs
      const umaMin = strategyFilters.umaRange.min
      const umaMax = strategyFilters.umaRange.max
      
      // Buscar aportaciones reales de estrategias con esas UMAs
      const aportacionesReales = strategies
        .filter(s => s.umaElegida >= umaMin && s.umaElegida <= umaMax)
        .map(s => s.inversionTotal && s.mesesM40 ? s.inversionTotal / s.mesesM40 : null)
        .filter((a): a is number => a !== null && a > 0)
      
      if (aportacionesReales.length > 0) {
        const aportMin = Math.max(1000, Math.floor(Math.min(...aportacionesReales) / 1000) * 1000)
        const aportMax = Math.ceil(Math.max(...aportacionesReales) / 1000) * 1000
        
        updateStrategyFilters({
          filterMode: newMode,
          contributionRange: { min: aportMin, max: aportMax }
        })
      } else {
        // Fallback: usar rango fijo
        updateStrategyFilters({
          filterMode: newMode,
          contributionRange: contributionRangeFixed
        })
      }
    } else {
      // Al cambiar a UMA, siempre usar rango fijo 1-25
      console.log('🔄 Cambiando a modo UMA - estableciendo rango 1-25')
      updateStrategyFilters({
        filterMode: newMode,
        umaRange: { min: 1, max: 25 } // Forzar explícitamente 1-25
      })
    }
  }
  
  // Función para actualizar rango de aportación con límites fijos
  const handleContributionRangeChange = (range: { min: number; max: number }) => {
    // Validar límites fijos: 1000 a 25000
    const validMin = Math.max(
      contributionRangeFixed.min, 
      Math.min(range.min, contributionRangeFixed.max)
    )
    const validMax = Math.min(
      contributionRangeFixed.max,
      Math.max(range.max, validMin)
    )
    
    // Buscar UMAs reales de estrategias con esas aportaciones
    const umasEnRango = strategies
      .map(s => {
        const aportacion = s.inversionTotal && s.mesesM40 ? s.inversionTotal / s.mesesM40 : null
        if (aportacion && aportacion >= validMin && aportacion <= validMax) {
          return s.umaElegida
        }
        return null
      })
      .filter((u): u is number => u !== null && u >= 1 && u <= 25)
    
    // No actualizar el rango de UMA al cambiar aportación, mantener el rango actual
    // El usuario puede ajustar el rango de UMA manualmente si lo desea
    updateStrategyFilters({
      contributionRange: { min: validMin, max: validMax }
      // No actualizar umaRange aquí para mantener el rango fijo 1-25
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100"
    >
             <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 md:py-5 lg:py-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
          <div className="bg-purple-600 p-2 md:p-2.5 rounded-lg self-start sm:self-center">
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl md:text-3xl lg:text-3xl font-bold text-gray-900">
              Estrategias Calculadas
            </h3>
            <p className="text-base sm:text-lg md:text-lg lg:text-lg text-gray-600 mt-1">
              Filtra y ordena las estrategias según tus preferencias
            </p>
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-4 md:p-3 lg:p-4">
        {/* Filtros de estrategias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-5 lg:gap-6 mb-4 sm:mb-6 md:mb-6 lg:mb-8">
          {/* Tipo de estrategia */}
          <div>
            <label className="block text-base sm:text-lg md:text-lg font-medium text-gray-700 mb-2">
              Tipo de estrategia
            </label>
            <select
              value={strategyFilters.strategyType}
              onChange={(e) => updateStrategyFilters({ strategyType: e.target.value as 'all' | 'fijo' | 'progresivo' })}
              className="w-full px-4 py-3 sm:px-4 sm:py-3 md:px-4 md:py-3 lg:px-4 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg"
            >
              <option value="all">Todas</option>
              <option value="fijo">Fija</option>
              <option value="progresivo">Progresiva</option>
            </select>
          </div>

          {/* Rango de Aportación Mensual / UMA con toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-base sm:text-lg md:text-lg font-medium text-gray-700">
                {filterMode === 'contribution' ? 'Aportación Mensual' : 'Rango de UMA'}
              </label>
              <button
                onClick={toggleFilterMode}
                className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                title={`Cambiar a ${filterMode === 'contribution' ? 'UMA' : 'Aportación Mensual'}`}
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{filterMode === 'contribution' ? 'UMA' : 'Aportación'}</span>
              </button>
            </div>
            
            {filterMode === 'contribution' ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={strategyFilters.contributionRange?.min || contributionRangeFixed.min}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || contributionRangeFixed.min
                      const clampedValue = Math.max(
                        contributionRangeFixed.min, 
                        Math.min(value, contributionRangeFixed.max)
                      )
                      const currentMax = strategyFilters.contributionRange?.max || contributionRangeFixed.max
                      const validMax = Math.max(clampedValue, Math.min(currentMax, contributionRangeFixed.max))
                      
                      handleContributionRangeChange({
                        min: clampedValue,
                        max: validMax
                      })
                    }}
                    className="w-full pl-7 pr-4 py-3 sm:py-3 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg"
                    placeholder="Mín"
                    min={contributionRangeFixed.min}
                    max={contributionRangeFixed.max}
                    step={1000}
                  />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    Mín: {formatCurrency(contributionRangeFixed.min)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={strategyFilters.contributionRange?.max || contributionRangeFixed.max}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || contributionRangeFixed.max
                        // Límite fijo: máximo 25000
                        const clampedValue = Math.min(
                          contributionRangeFixed.max,
                          Math.max(value, contributionRangeFixed.min)
                        )
                        const currentMin = strategyFilters.contributionRange?.min || contributionRangeFixed.min
                        const validMin = Math.min(clampedValue, Math.max(currentMin, contributionRangeFixed.min))
                        
                        handleContributionRangeChange({
                          min: validMin,
                          max: clampedValue
                        })
                      }}
                      className="w-full pl-7 pr-4 py-3 sm:py-3 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg"
                      placeholder="Máx"
                      min={contributionRangeFixed.min}
                      max={contributionRangeFixed.max}
                      step={1000}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    Máx: {formatCurrency(contributionRangeFixed.max)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={strategyFilters.umaRange.min}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    const clampedValue = Math.max(1, Math.min(25, value))
                    updateStrategyFilters({
                      umaRange: {
                        ...strategyFilters.umaRange,
                        min: clampedValue,
                        max: Math.max(clampedValue, Math.min(25, strategyFilters.umaRange.max))
                      }
                    })
                  }}
                  className="w-1/2 px-4 py-3 sm:px-4 sm:py-3 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg"
                  placeholder="Min"
                  min="1"
                  max="25"
                />
                <input
                  type="number"
                  value={strategyFilters.umaRange.max}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 25
                    const clampedValue = Math.max(1, Math.min(25, value))
                    updateStrategyFilters({
                      umaRange: {
                        ...strategyFilters.umaRange,
                        max: clampedValue,
                        min: Math.min(clampedValue, Math.max(1, strategyFilters.umaRange.min))
                      }
                    })
                  }}
                  className="w-1/2 px-4 py-3 sm:px-4 sm:py-3 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg"
                  placeholder="Max"
                  min="1"
                  max="25"
                />
              </div>
            )}
          </div>

          {/* Rango de meses */}
          <div>
            <label className="block text-base sm:text-lg md:text-lg font-medium text-gray-700 mb-2">
              Rango de meses
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={strategyFilters.monthsRange.min}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  const clampedValue = Math.max(1, Math.min(58, value))
                  updateStrategyFilters({
                    monthsRange: {
                      ...strategyFilters.monthsRange,
                      min: clampedValue,
                      max: Math.max(clampedValue, strategyFilters.monthsRange.max)
                    }
                  })
                }}
                className="w-1/2 px-4 py-3 sm:px-4 sm:py-3 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg"
                placeholder="Min"
                min="1"
                max="58"
              />
              <input
                type="number"
                value={strategyFilters.monthsRange.max}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 58
                  const clampedValue = Math.max(1, Math.min(58, value))
                  updateStrategyFilters({
                    monthsRange: {
                      ...strategyFilters.monthsRange,
                      max: clampedValue,
                      min: Math.min(clampedValue, strategyFilters.monthsRange.min)
                    }
                  })
                }}
                className="w-1/2 px-4 py-3 sm:px-4 sm:py-3 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg"
                placeholder="Max"
                min="1"
                max="58"
              />
            </div>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-base sm:text-lg md:text-lg font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <div className="flex gap-2">
              <select
                value={strategyFilters.sortBy}
                onChange={(e) => updateStrategyFilters({ sortBy: e.target.value as 'pension' | 'investment' | 'months' })}
                className="flex-1 px-4 py-3 sm:px-4 sm:py-3 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base sm:text-lg"
              >
                <option value="pension">Pensión</option>
                <option value="investment">Inversión</option>
                <option value="months">Meses</option>
              </select>
              <button
                onClick={() => updateStrategyFilters({
                  sortOrder: strategyFilters.sortOrder === 'desc' ? 'asc' : 'desc'
                })}
                className="px-4 py-3 sm:px-4 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[48px] min-h-[48px] flex items-center justify-center"
              >
                {strategyFilters.sortOrder === 'desc' ? <ArrowDown className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowUp className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de estrategias - COLUMNAS HORIZONTALES */}
        {strategies.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 w-full">
              <div className="text-yellow-600 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron estrategias válidas
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Esto puede deberse a:
              </p>
              <ul className="text-xs text-gray-600 space-y-1 text-left max-w-md mx-auto">
                <li>• El rango de UMA seleccionado es muy restrictivo</li>
                <li>• El rango de meses seleccionado no tiene estrategias disponibles</li>
                <li>• El tipo de estrategia filtrado no tiene resultados</li>
              </ul>
              <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 max-w-md mx-auto">
                <strong>💡 Sugerencia:</strong> Ajusta los filtros de arriba para ampliar el rango de búsqueda. Por ejemplo, aumenta el rango de UMA o cambia el tipo de estrategia a "Todas".
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {strategies.map((strategy, index) => (
              <StrategyRow
                key={`${strategy.estrategia}_${strategy.umaElegida}_${strategy.mesesM40}_${index}`}
                strategy={strategy}
                index={index}
                isFirstCard={index === 0}
                session={session}
                userPlan={userPlan}
                hasUsedFreeStrategy={hasUsedFreeStrategy}
                onStrategyPurchase={onStrategyPurchase}
                onPremiumModalOpen={onPremiumModalOpen}
                onViewDetails={onViewDetails}
                onDownloadPDF={onDownloadPDF}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
