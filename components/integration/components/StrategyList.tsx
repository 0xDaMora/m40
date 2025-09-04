import { motion } from "framer-motion"
import { ArrowUp, ArrowDown } from "lucide-react"
import { StrategyResult, StrategyFilters } from "@/types/strategy"
import { StrategyRow } from "./StrategyRow"
import { Session } from "next-auth"

interface StrategyListProps {
  strategies: StrategyResult[]
  strategyFilters: StrategyFilters
  onStrategyFiltersChange: (filters: StrategyFilters) => void
  session: Session | null
  userPlan: string
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
  onStrategyPurchase,
  onPremiumModalOpen,
  onViewDetails,
  onDownloadPDF
}: StrategyListProps) {
  const updateStrategyFilters = (updates: Partial<StrategyFilters>) => {
    onStrategyFiltersChange({ ...strategyFilters, ...updates })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
             <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-1 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 lg:py-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg self-start sm:self-center">
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Estrategias Calculadas
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Filtra y ordena las estrategias según tus preferencias
            </p>
          </div>
        </div>
      </div>

      <div className="p-1 sm:p-3 md:p-4 lg:p-6 xl:p-8">
        {/* Filtros de estrategias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Tipo de estrategia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de estrategia
            </label>
            <select
              value={strategyFilters.strategyType}
              onChange={(e) => updateStrategyFilters({ strategyType: e.target.value as 'all' | 'fijo' | 'progresivo' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="fijo">Fija</option>
              <option value="progresivo">Progresiva</option>
            </select>
          </div>

          {/* Rango de UMA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de UMA
            </label>
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
                      max: Math.max(clampedValue, strategyFilters.umaRange.max)
                    }
                  })
                }}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      min: Math.min(clampedValue, strategyFilters.umaRange.min)
                    }
                  })
                }}
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Max"
                min="1"
                max="25"
              />
            </div>
          </div>

          {/* Rango de meses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Max"
                min="1"
                max="58"
              />
            </div>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <div className="flex gap-1">
              <select
                value={strategyFilters.sortBy}
                onChange={(e) => updateStrategyFilters({ sortBy: e.target.value as 'roi' | 'pension' | 'investment' | 'months' })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="roi">ROI</option>
                <option value="pension">Pensión</option>
                <option value="investment">Inversión</option>
                <option value="months">Meses</option>
              </select>
              <button
                onClick={() => updateStrategyFilters({
                  sortOrder: strategyFilters.sortOrder === 'desc' ? 'asc' : 'desc'
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {strategyFilters.sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de estrategias - COLUMNAS HORIZONTALES */}
        <div className="space-y-1 sm:space-y-2">
          {strategies.map((strategy, index) => (
            <StrategyRow
              key={`${strategy.estrategia}_${strategy.umaElegida}_${strategy.mesesM40}_${index}`}
              strategy={strategy}
              index={index}
              isFirstCard={index === 0}
              session={session}
              userPlan={userPlan}
              onStrategyPurchase={onStrategyPurchase}
              onPremiumModalOpen={onPremiumModalOpen}
              onViewDetails={onViewDetails}
              onDownloadPDF={onDownloadPDF}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
