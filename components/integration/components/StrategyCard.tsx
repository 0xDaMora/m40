import { motion } from "framer-motion"
import { Lock, Eye, Download } from "lucide-react"
import { StrategyResult } from "@/types/strategy"
import { useFormatters } from "@/hooks/useFormatters"
import TooltipInteligente from "@/components/TooltipInteligente"
import { Session } from "next-auth"

interface StrategyCardProps {
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

export function StrategyCard({
  strategy,
  index,
  isFirstCard = false,
  session,
  userPlan,
  onStrategyPurchase,
  onPremiumModalOpen,
  onViewDetails,
  onDownloadPDF
}: StrategyCardProps) {
  const { currency: formatCurrency } = useFormatters()

  // Calcular aportación mensual promedio
  const aportacionPromedio = strategy.inversionTotal ? strategy.inversionTotal / strategy.mesesM40 : 0

  return (
    <motion.div
      key={`${strategy.estrategia}_${strategy.umaElegida}_${strategy.mesesM40}_${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group min-w-0"
    >
      {/* Header con gradiente */}
      <div className={`relative h-16 sm:h-18 lg:h-22 xl:h-24 bg-gradient-to-r ${
        strategy.estrategia === 'progresivo' 
          ? 'from-purple-500 to-purple-600' 
          : 'from-green-500 to-green-600'
      }`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative p-3 sm:p-4 lg:p-5 text-white">
          <div className="flex justify-between items-start">
                          <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-1">
                  {strategy.estrategia === 'fijo' ? 'Estrategia Fija' : 'Estrategia Progresiva'}
                </h3>
                <p className="text-xs sm:text-sm opacity-90">Modalidad 40</p>
              </div>
                          <TooltipInteligente termino={strategy.estrategia === 'fijo' ? 'UMA Fijo' : 'UMA Progresivo'}>
                <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold ${
                  strategy.estrategia === 'progresivo' 
                    ? 'bg-purple-400/20 text-white' 
                    : 'bg-green-400/20 text-white'
                }`}>
                  {strategy.estrategia === 'progresivo' ? 'Progresiva' : 'Fija'}
                </div>
              </TooltipInteligente>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Información destacada */}
        <div className="space-y-2 sm:space-y-3 lg:space-y-4 mb-4 sm:mb-5 lg:mb-6">
          {/* Aportación mensual promedio - LO MÁS IMPORTANTE */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl border border-blue-100">
            <div className="text-center">
              <TooltipInteligente termino="Aportación mensual promedio">
                <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Aportación Mensual Promedio</p>
              </TooltipInteligente>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">{formatCurrency(aportacionPromedio)}</p>
              <p className="text-xs text-blue-500 mt-1">Durante {strategy.mesesM40} meses</p>
            </div>
          </div>

          {/* Pensión mensual - SEGUNDO MÁS IMPORTANTE */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
            <div className="text-center">
              <TooltipInteligente termino="Pensión mensual">
                <p className="text-sm text-green-600 font-medium mb-1">Pensión Mensual</p>
              </TooltipInteligente>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(strategy.pensionMensual || 0)}</p>
              <p className="text-xs text-green-500 mt-1">Al jubilarse</p>
            </div>
          </div>
        </div>

        {/* Detalles técnicos */}
        <div className="space-y-3 text-sm">
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
          <div className="flex justify-between items-center py-2">
            <TooltipInteligente termino="Inversión estimada">
              <span className="text-gray-600">Inversión total:</span>
            </TooltipInteligente>
            <span className="font-semibold text-gray-900">{formatCurrency(strategy.inversionTotal || 0)}</span>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="mt-6">
          {(!session || userPlan === 'free' || userPlan === 'basic') ? (
            <div className="space-y-3">
              <button
                onClick={() => onStrategyPurchase(strategy)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Comprar Estrategia</span>
                </div>
              </button>
              <button
                onClick={onPremiumModalOpen}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base sm:text-lg">🚀</span>
                  <span className="text-xs sm:text-sm">Desbloquear todas las estrategias con Premium</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => onViewDetails(strategy)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Ver Detalles</span>
                </div>
              </button>
              <button
                onClick={() => onDownloadPDF(strategy)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                title="Descargar PDF"
              >
                <div className="flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Descargar PDF</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Badge de popularidad si es el mejor ROI */}
      {isFirstCard && (
        <div className="absolute top-4 right-4">
          <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
            ⭐ Mejor ROI
          </div>
        </div>
      )}
    </motion.div>
  )
}
