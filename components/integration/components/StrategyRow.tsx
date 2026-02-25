import { motion } from "framer-motion"
import { Lock, Eye, ChevronDown, ChevronUp } from "lucide-react"
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
  onViewDetails: (strategy: StrategyResult) => void
  onDownloadPDF: (strategy: StrategyResult) => void
}

export function StrategyRow({
  strategy,
  index,
  isFirstCard = false,
  session,
  userPlan,
  onViewDetails,
  onDownloadPDF
}: StrategyRowProps) {
  const { currency: formatCurrency } = useFormatters()
  const [isExpanded, setIsExpanded] = useState(false)

  // Calcular aportación mensual promedio
  const aportacionPromedio = strategy.inversionTotal ? strategy.inversionTotal / strategy.mesesM40 : 0
  
  // Botón único: "Obtener Estrategia" que siempre guarda directamente
  const buttonConfig = {
    text: 'Obtener Estrategia',
    className: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white',
    onClick: onViewDetails
  }

  return (
    <motion.div
      key={`${strategy.estrategia}_${strategy.umaElegida}_${strategy.mesesM40}_${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300"
    >
      {/* Header de fila - Siempre visible */}
      <div 
        className={`py-3 px-2 sm:py-4 sm:px-3 md:py-4 md:px-4 cursor-pointer transition-colors duration-200 ${
          isExpanded 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200' 
            : 'hover:bg-gray-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Layout responsivo: dos filas en móvil, una fila en desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 md:gap-4">
          {/* Fila 1: Datos principales */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-3 flex-1 min-w-0">
            {/* Columna 1: Tipo de estrategia - Compacta */}
            <div className="flex items-center justify-center flex-shrink-0">
              <div className={`p-1.5 sm:p-2 rounded-lg ${
                strategy.estrategia === 'progresivo' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                <span className="text-lg sm:text-xl">
                  {strategy.estrategia === 'progresivo' ? '📈' : '📊'}
                </span>
              </div>
            </div>

            {/* Separador visual - Solo visible en desktop */}
            <div className="hidden sm:block h-12 w-px bg-gray-200 flex-shrink-0"></div>

            {/* Columna 2: UMA - Compacta con ancho fijo */}
            <div className="text-center w-10 sm:w-14 flex-shrink-0 px-1">
              <div className="text-xs sm:text-sm text-gray-500 mb-1.5">UMA</div>
              <div className="font-bold text-gray-900 text-lg sm:text-2xl md:text-2xl leading-tight">{strategy.umaElegida}</div>
            </div>

            {/* Separador visual - Solo visible en desktop */}
            <div className="hidden sm:block h-12 w-px bg-gray-200 flex-shrink-0"></div>

            {/* Columna 3: Aportación Mensual */}
            <div className="text-center min-w-0 flex-1 px-2 sm:px-3 md:px-4 lg:min-w-[130px]">
              <div className="text-xs sm:text-sm text-gray-500 mb-1.5">Aportación Mensual</div>
              <div className="font-bold text-blue-600 text-lg sm:text-2xl md:text-2xl leading-tight truncate">
                {formatCurrency(aportacionPromedio)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 leading-tight mt-0.5">{strategy.mesesM40}m</div>
            </div>

            {/* Separador visual con más espacio - Solo visible en desktop */}
            <div className="hidden sm:block h-12 w-px bg-gray-200 flex-shrink-0 mx-1 sm:mx-2"></div>

            {/* Columna 4: Pensión Mensual */}
            <div className="text-center min-w-0 flex-1 px-2 sm:px-3 md:px-4 lg:min-w-[130px]">
              <div className="text-xs sm:text-sm text-gray-500 mb-1.5">Pensión</div>
              <div className="font-bold text-green-600 text-lg sm:text-2xl md:text-2xl leading-tight truncate">
                {formatCurrency(strategy.pensionMensual || 0)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 leading-tight mt-0.5">Al jubilarse</div>
            </div>

            {/* Separador visual antes de acciones - Solo visible en desktop */}
            <div className="hidden sm:block h-12 w-px bg-gray-200 flex-shrink-0"></div>

            {/* Columna 6: Acciones - Solo visible en desktop - Ancho fijo para evitar compresión */}
            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 overflow-visible">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  buttonConfig.onClick(strategy)
                }}
                className={`${buttonConfig.className} px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200 min-h-[44px] flex items-center justify-center whitespace-nowrap`}
                style={{ width: '130px', maxWidth: '130px' }}
              >
                <span className="truncate block w-full text-center">{buttonConfig.text}</span>
              </button>
              
              {/* Indicador de collapse */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex-shrink-0 flex items-center justify-center transition-colors"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Fila 2: Acciones - Solo visible en móvil */}
          <div className="flex sm:hidden items-center gap-2 w-full">
            <button
              onClick={(e) => {
                e.stopPropagation()
                buttonConfig.onClick(strategy)
              }}
              className={`flex-1 ${buttonConfig.className} px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200 min-h-[44px] flex items-center justify-center text-center`}
            >
              {buttonConfig.text}
            </button>
            
            {/* Indicador de collapse */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors border border-gray-300 rounded-lg"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
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
          <div className="p-5 sm:p-6 md:p-6 bg-gray-50">
            {/* Información destacada en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-4">
              {/* Aportación mensual promedio */}
              <div className="bg-white p-5 sm:p-6 rounded-lg border border-gray-200">
                <div className="text-center">
                  <TooltipInteligente termino="Aportación mensual promedio">
                    <p className="text-base sm:text-lg text-blue-600 font-medium mb-2">Aportación Mensual</p>
                  </TooltipInteligente>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700">{formatCurrency(aportacionPromedio)}</p>
                  <p className="text-sm sm:text-base text-blue-500 mt-1">Durante {strategy.mesesM40} meses</p>
                </div>
              </div>

              {/* Pensión mensual */}
              <div className="bg-white p-5 sm:p-6 rounded-lg border border-gray-200">
                <div className="text-center">
                  <TooltipInteligente termino="Pensión mensual">
                    <p className="text-base sm:text-lg text-green-600 font-medium mb-2">Pensión Mensual</p>
                  </TooltipInteligente>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">{formatCurrency(strategy.pensionMensual || 0)}</p>
                  <p className="text-sm sm:text-base text-green-500 mt-1">Al jubilarse</p>
                </div>
              </div>

              {/* Inversión total */}
              <div className="bg-white p-5 sm:p-6 rounded-lg border border-gray-200">
                <div className="text-center">
                  <TooltipInteligente termino="Inversión total">
                    <p className="text-base sm:text-lg text-purple-600 font-medium mb-2">Inversión Total</p>
                  </TooltipInteligente>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-700">{formatCurrency(strategy.inversionTotal || 0)}</p>
                  <p className="text-sm sm:text-base text-purple-500 mt-1">Inversión estimada</p>
                </div>
              </div>
            </div>

            {/* Detalles técnicos */}
            <div className="bg-white p-5 sm:p-6 rounded-lg border border-gray-200 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">Detalles Técnicos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base sm:text-lg">
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
            </div>

            {/* Botones de acción expandidos */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => buttonConfig.onClick(strategy)}
                className={`flex-1 ${buttonConfig.className} py-4 px-6 sm:py-5 sm:px-8 rounded-lg text-lg sm:text-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 min-h-[56px]`}
              >
                <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>{buttonConfig.text}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
