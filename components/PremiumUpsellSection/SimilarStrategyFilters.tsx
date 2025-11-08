"use client"

import { motion } from "framer-motion"
import { Filter, DollarSign, Target, Calendar } from "lucide-react"
import { IntegrationFilters } from "@/types/strategy"
import { RangeSlider } from "@/components/ui/RangeSlider"
import { useFormatters } from "@/hooks/useFormatters"
import { getMaxAportacion } from "@/lib/all/umaConverter"

interface SimilarStrategyFiltersProps {
  filters: IntegrationFilters
  onFiltersChange: (filters: IntegrationFilters) => void
}

export function SimilarStrategyFilters({ filters, onFiltersChange }: SimilarStrategyFiltersProps) {
  const { currency: formatCurrency } = useFormatters()
  const currentYear = new Date().getFullYear()
  const maxAportacion = getMaxAportacion(currentYear)

  const updateFilters = (updates: Partial<IntegrationFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6"
    >
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-3 md:px-4 lg:px-6 py-3 md:py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-purple-600 p-1.5 md:p-2 rounded-lg">
            <Filter className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-900">
              Filtros de Estrategias
            </h3>
            <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Personaliza los parámetros para ver más opciones</p>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {/* Rango de Aportación Mensual */}
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="bg-blue-100 p-1.5 md:p-2 rounded-lg">
                <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-900">
                  Aportación Mensual
                </label>
                <p className="text-xs text-gray-600 hidden sm:block">Capacidad de inversión</p>
              </div>
            </div>
            <RangeSlider
              min={1000}
              max={maxAportacion}
              value={filters.monthlyContributionRange}
              onChange={(value) => updateFilters({ monthlyContributionRange: value })}
              step={1000}
              formatValue={(val) => `$${val.toLocaleString()}`}
            />
            <div className="mt-2 md:mt-3 p-2 md:p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-sm md:text-base lg:text-lg font-bold text-blue-600">
                  ${filters.monthlyContributionRange.min.toLocaleString()} - ${filters.monthlyContributionRange.max.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Rango mensual</div>
              </div>
            </div>
          </div>

          {/* Meses M40 */}
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="bg-green-100 p-1.5 md:p-2 rounded-lg">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-900">
                  Meses M40
                </label>
                <p className="text-xs text-gray-600 hidden sm:block">Duración del plan</p>
              </div>
            </div>
            <div className="space-y-2 md:space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Meses</label>
                <input
                  type="number"
                  min="1"
                  max="58"
                  value={filters.months}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 24
                    const clampedValue = Math.max(1, Math.min(58, value))
                    updateFilters({ months: clampedValue })
                  }}
                  className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                />
              </div>
              <div className="p-2 md:p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="text-sm md:text-base lg:text-lg font-bold text-green-600">
                    {filters.months} meses
                  </div>
                  <div className="text-xs text-gray-600">Duración</div>
                </div>
              </div>
            </div>
          </div>

          {/* Edad de Jubilación */}
          <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div className="bg-orange-100 p-1.5 md:p-2 rounded-lg">
                <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-600" />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-900">
                  Edad de Jubilación
                </label>
                <p className="text-xs text-gray-600 hidden sm:block">Edad objetivo</p>
              </div>
            </div>
            <div className="space-y-2 md:space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Años</label>
                <input
                  type="number"
                  min="60"
                  max="65"
                  value={filters.retirementAge}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 65
                    const clampedValue = Math.max(60, Math.min(65, value))
                    updateFilters({ retirementAge: clampedValue })
                  }}
                  className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                />
              </div>
              <div className="p-2 md:p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="text-sm md:text-base lg:text-lg font-bold text-orange-600">
                    {filters.retirementAge} años
                  </div>
                  <div className="text-xs text-gray-600">Edad objetivo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

