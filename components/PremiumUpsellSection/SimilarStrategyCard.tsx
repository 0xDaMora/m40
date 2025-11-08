"use client"

import { motion } from "framer-motion"
import { Lock, TrendingUp } from "lucide-react"
import { useFormatters } from "@/hooks/useFormatters"
import { StrategyResult } from "@/types/strategy"

interface SimilarStrategyCardProps {
  strategy: StrategyResult
  onUnlock: () => void
  index: number
}

export function SimilarStrategyCard({ strategy, onUnlock, index }: SimilarStrategyCardProps) {
  const { currency: formatCurrency, percentage: formatPercentage } = useFormatters()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative bg-white rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5 border-2 border-gray-200 overflow-hidden cursor-pointer group hover:border-purple-300 hover:shadow-lg transition-all duration-300"
      onClick={onUnlock}
    >
      {/* Candado en esquina superior derecha */}
      <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 bg-purple-600 text-white p-1.5 md:p-2 rounded-lg shadow-lg group-hover:bg-purple-700 transition-colors duration-200">
        <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
      </div>

      {/* Badge Premium en esquina superior izquierda */}
      <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold shadow-md">
        Premium
      </div>

      {/* Contenido real de la estrategia */}
      <div className="pt-6 md:pt-7 lg:pt-8">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div className="text-right">
            <div className="text-base md:text-lg lg:text-xl font-bold text-green-600">
              {formatCurrency(strategy.pensionMensual || 0)}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500">pensión mensual</div>
          </div>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Tipo:</span>
            <span className="font-semibold capitalize">{strategy.estrategia || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">UMA:</span>
            <span className="font-semibold">{strategy.umaElegida || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Meses:</span>
            <span className="font-semibold">{strategy.mesesM40 || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-600">Inversión:</span>
            <span className="font-semibold text-xs md:text-sm">{formatCurrency(strategy.inversionTotal || 0)}</span>
          </div>
          {strategy.inversionTotal && strategy.mesesM40 && (
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-gray-600">Aportación Mensual:</span>
              <span className="font-semibold text-blue-600 text-xs md:text-sm">
                {formatCurrency(Math.round(strategy.inversionTotal / strategy.mesesM40))}
              </span>
            </div>
          )}
        </div>
        
        {/* Botón de desbloquear */}
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-1.5 md:gap-2 text-purple-600 text-xs md:text-sm font-semibold group-hover:text-purple-700 transition-colors">
            <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Toca para desbloquear</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

