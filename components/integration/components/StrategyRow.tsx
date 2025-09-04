import { motion } from "framer-motion"
import { Lock, Eye, Download, ChevronDown, ChevronUp } from "lucide-react"
import { StrategyResult } from "@/types/strategy"
import { useFormatters } from "@/hooks/useFormatters"
import TooltipInteligente from "@/components/TooltipInteligente"
import { Session } from "next-auth"
import { useState } from "react"

interface StrategyRowProps {
  strategy: StrategyResult
  index: number
  isFirstCard?: boolean
  session: Session | null
  userPlan: string
  onStrategyPurchase: (strategy: StrategyResult) => void
  onPremiumModalOpen: () => void
  onViewDetails: (strategy: StrategyResult) => void
  onDownloadPDF: (strategy: StrategyResult) => void
}

export function StrategyRow({
  strategy,
  index,
  isFirstCard = false,
  session,
  userPlan,
  onStrategyPurchase,
  onPremiumModalOpen,
  onViewDetails,
  onDownloadPDF
}: StrategyRowProps) {
  const { currency: formatCurrency } = useFormatters()
  const [isExpanded, setIsExpanded] = useState(false)

  // Calcular aportación mensual promedio
  const aportacionPromedio = strategy.inversionTotal ? strategy.inversionTotal / strategy.mesesM40 : 0

  return (
    <motion.div
      key={`${strategy.estrategia}_${strategy.umaElegida}_${strategy.mesesM40}_${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden"
    >
      {/* Header de fila - Siempre visible */}
      <div 
        className={`py-2 px-2 sm:py-3 sm:px-3 md:py-4 md:px-4 lg:py-5 lg:px-5 cursor-pointer transition-colors duration-200 ${
          isExpanded 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200' 
            : 'hover:bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Layout móvil optimizado - Información en fila horizontal */}
        <div className="flex items-center gap-2 sm:gap-1.5 md:gap-2 lg:gap-4">
          {/* Columna 1: Tipo de estrategia */}
          <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2 min-w-0 flex-shrink-0">
            <div className={`p-1 sm:p-1.5 md:p-2 rounded-lg ${
              strategy.estrategia === 'progresivo' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              <span className="text-xs sm:text-sm md:text-lg">
                {strategy.estrategia === 'progresivo' ? '📈' : '📊'}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base leading-tight">
                {strategy.estrategia === 'fijo' ? 'Fija' : 'Progresiva'}
              </h3>
              <p className="text-xs text-gray-500">M40</p>
            </div>
          </div>

          {/* Columna 2: UMA */}
          <div className="text-center min-w-0 flex-shrink-0">
            <div className="text-xs text-gray-500 mb-0.5">UMA</div>
            <div className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{strategy.umaElegida}</div>
          </div>

          {/* Columna 3: Aportación Mensual */}
          <div className="text-center min-w-0 flex-1 sm:flex-1">
            <div className="text-xs text-gray-500 mb-0.5">Aportación</div>
            <div className="font-bold text-blue-600 text-sm sm:text-base leading-tight">
              {formatCurrency(aportacionPromedio)}
            </div>
            <div className="text-xs text-gray-500 leading-tight">{strategy.mesesM40}m</div>
          </div>

          {/* Columna 4: Pensión Mensual */}
          <div className="text-center min-w-0 flex-1 sm:flex-1">
            <div className="text-xs text-gray-500 mb-0.5">Pensión</div>
            <div className="font-bold text-green-600 text-sm sm:text-base leading-tight">
              {formatCurrency(strategy.pensionMensual || 0)}
            </div>
            <div className="text-xs text-gray-500 leading-tight">Al jubilarse</div>
          </div>

          {/* Columna 5: ROI - Solo visible en tablet y desktop */}
          <div className="hidden sm:block text-center min-w-0 flex-shrink-0">
            <div className="text-xs text-gray-500 mb-0.5">ROI</div>
            <div className="font-bold text-orange-600 text-sm sm:text-base leading-tight">
              {(strategy.ROI || 0).toFixed(1)}%
            </div>
          </div>



          {/* Columna 6: Acciones */}
          <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2 min-w-0 flex-shrink-0">
            {(!session || userPlan === 'free' || userPlan === 'basic') ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onStrategyPurchase(strategy)
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg text-xs font-medium transition-colors duration-200"
              >
                Comprar
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewDetails(strategy)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 rounded-lg text-xs font-medium transition-colors duration-200"
              >
                Ver
              </button>
            )}
            
            {/* Indicador de collapse */}
            <div className="text-gray-400">
              {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
          </div>
        </div>

        {/* Badge de popularidad si es el mejor ROI */}
        {isFirstCard && (
          <div className="absolute top-2 right-2">
            <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              ⭐ Mejor ROI
            </div>
          </div>
        )}
      </div>

      {/* Contenido expandido - Collapse */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-gray-200"
        >
          <div className="p-4 sm:p-5 bg-gray-50">
            {/* Información destacada en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Aportación mensual promedio */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-center">
                  <TooltipInteligente termino="Aportación mensual promedio">
                    <p className="text-sm text-blue-600 font-medium mb-2">Aportación Mensual</p>
                  </TooltipInteligente>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(aportacionPromedio)}</p>
                  <p className="text-xs text-blue-500 mt-1">Durante {strategy.mesesM40} meses</p>
                </div>
              </div>

              {/* Pensión mensual */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-center">
                  <TooltipInteligente termino="Pensión mensual">
                    <p className="text-sm text-green-600 font-medium mb-2">Pensión Mensual</p>
                  </TooltipInteligente>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(strategy.pensionMensual || 0)}</p>
                  <p className="text-xs text-green-500 mt-1">Al jubilarse</p>
                </div>
              </div>

              {/* Inversión total */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-center">
                  <TooltipInteligente termino="Inversión total">
                    <p className="text-sm text-purple-600 font-medium mb-2">Inversión Total</p>
                  </TooltipInteligente>
                  <p className="text-xl font-bold text-purple-700">{formatCurrency(strategy.inversionTotal || 0)}</p>
                  <p className="text-xs text-purple-500 mt-1">Inversión estimada</p>
                </div>
              </div>
            </div>

            {/* Detalles técnicos */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Detalles Técnicos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <TooltipInteligente termino="Nivel UMA">
                    <span className="text-gray-600">UMA elegida:</span>
                  </TooltipInteligente>
                  <span className="font-semibold text-gray-900">{strategy.umaElegida}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <TooltipInteligente termino="Meses en M40">
                    <span className="text-gray-600">Duración:</span>
                  </TooltipInteligente>
                  <span className="font-semibold text-gray-900">{strategy.mesesM40} meses</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <TooltipInteligente termino="Retorno de inversión">
                    <span className="text-gray-600">ROI:</span>
                  </TooltipInteligente>
                  <span className="font-semibold text-orange-600">{(strategy.ROI || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <TooltipInteligente termino="Inversión estimada">
                    <span className="text-gray-600">Inversión total:</span>
                  </TooltipInteligente>
                  <span className="font-semibold text-gray-900">{formatCurrency(strategy.inversionTotal || 0)}</span>
                </div>
              </div>
            </div>

            {/* Botones de acción expandidos */}
            <div className="flex flex-col sm:flex-row gap-3">
              {(!session || userPlan === 'free' || userPlan === 'basic') ? (
                <>
                  <button
                    onClick={() => onStrategyPurchase(strategy)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Comprar Estrategia</span>
                  </button>
                  <button
                    onClick={onPremiumModalOpen}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>🚀</span>
                    <span>Desbloquear con Premium</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onViewDetails(strategy)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver Detalles Completos</span>
                  </button>
                  <button
                    onClick={() => onDownloadPDF(strategy)}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    title="Descargar PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
