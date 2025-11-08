import { motion } from "framer-motion"
import { Filter, DollarSign, Target, Calendar, Users, AlertCircle } from "lucide-react"
import { FamilyMember } from "@/types/family"
import { IntegrationFilters } from "@/types/strategy"
import { RangeSlider } from "@/components/ui/RangeSlider"
import { useFormatters } from "@/hooks/useFormatters"
import { calculateAge, calcularSDI, calcularSDIEnUMAs, getOptimalStartDate } from "../utils/calculations"
import { calculateMaxMonthsM40 } from "../utils/calculateMaxMonths"

interface StrategyFiltersProps {
  selectedFamilyMember: FamilyMember
  filters: IntegrationFilters
  onFiltersChange: (filters: IntegrationFilters) => void
  maxAportacion: number
}

export function StrategyFiltersPanel({
  selectedFamilyMember,
  filters,
  onFiltersChange,
  maxAportacion
}: StrategyFiltersProps) {
  const { currency: formatCurrency } = useFormatters()

  // Las funciones calculateAge, getOptimalStartDate, calcularSDI y calcularSDIEnUMAs ahora vienen de utils/calculations

  const updateFilters = (updates: Partial<IntegrationFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return months[month - 1] || 'Enero'
  }

  const sdi = calcularSDI(selectedFamilyMember.lastGrossSalary)
  const sdiEnUMAs = calcularSDIEnUMAs(selectedFamilyMember.lastGrossSalary)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-green-600 p-2 rounded-lg self-start sm:self-center">
            <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Configuración de Estrategia
            </h3>
            <p className="text-sm sm:text-base text-gray-600">Personaliza los parámetros para optimizar tu plan de Modalidad 40</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Rango de Aportación Mensual */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg self-start sm:self-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <label className="block text-base sm:text-lg font-semibold text-gray-900">
                  Aportación Mensual
                </label>
                <p className="text-xs sm:text-sm text-gray-600">Define tu capacidad de inversión</p>
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
            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${filters.monthlyContributionRange.min.toLocaleString()} - ${filters.monthlyContributionRange.max.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Rango mensual</div>
              </div>
            </div>
            
            {/* Explicación contextual */}
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 text-sm mb-2">¿Cómo influye la aportación mensual?</h4>
                  <div className="text-xs text-blue-700 space-y-2">
                    <p>• <strong>Mayor aportación = Mejor pensión:</strong> Cada peso adicional en M40 se multiplica por el factor de edad y semanas.</p>
                    <p>• <strong>Rango recomendado:</strong> $5,000 - $15,000 mensuales para obtener pensiones significativamente mejores.</p>
                    <p>• <strong>Recuperación:</strong> La inversión se recupera en 18-36 meses dependiendo de tu edad y SDI actual.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edad de Jubilación */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-900">
                  Edad de Jubilación
                </label>
                <p className="text-sm text-gray-600">Define tu objetivo de retiro</p>
              </div>
            </div>
            <select
              value={filters.retirementAge}
              onChange={(e) => updateFilters({ retirementAge: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-medium"
            >
              <option value={60}>60 años</option>
              <option value={61}>61 años</option>
              <option value={62}>62 años</option>
              <option value={63}>63 años</option>
              <option value={64}>64 años</option>
              <option value={65}>65 años</option>
            </select>
            <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filters.retirementAge} años
                </div>
                <div className="text-sm text-gray-600">Objetivo de jubilación</div>
              </div>
            </div>
            
            {/* Cuadro informativo de máximo de meses disponibles */}
            {(() => {
              const maxMonthsInfo = calculateMaxMonthsM40(
                selectedFamilyMember.birthDate,
                filters.retirementAge,
                filters.startMonth || new Date().getMonth() + 1,
                filters.startYear || new Date().getFullYear()
              )
              
              return (
                <div className={`mt-3 p-4 rounded-xl border ${
                  maxMonthsInfo.isLimited && maxMonthsInfo.maxMonths > 0
                    ? 'bg-yellow-50 border-yellow-200'
                    : maxMonthsInfo.maxMonths === 0
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      maxMonthsInfo.isLimited && maxMonthsInfo.maxMonths > 0
                        ? 'bg-yellow-100'
                        : maxMonthsInfo.maxMonths === 0
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                    }`}>
                      <AlertCircle className={`w-4 h-4 ${
                        maxMonthsInfo.isLimited && maxMonthsInfo.maxMonths > 0
                          ? 'text-yellow-600'
                          : maxMonthsInfo.maxMonths === 0
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm mb-1 ${
                        maxMonthsInfo.isLimited && maxMonthsInfo.maxMonths > 0
                          ? 'text-yellow-800'
                          : maxMonthsInfo.maxMonths === 0
                          ? 'text-red-800'
                          : 'text-blue-800'
                      }`}>
                        Máximo de meses en Modalidad 40: {maxMonthsInfo.message}
                      </div>
                      <div className={`text-xs ${
                        maxMonthsInfo.isLimited && maxMonthsInfo.maxMonths > 0
                          ? 'text-yellow-700'
                          : maxMonthsInfo.maxMonths === 0
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }`}>
                        {maxMonthsInfo.details}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
            
            {/* Explicación contextual */}
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800 text-sm mb-2">¿Cómo influye la edad de jubilación?</h4>
                  <div className="text-xs text-green-700 space-y-2">
                    <p>• <strong>Factor de edad:</strong> Jubilarse a los 65 años maximiza tu pensión (factor 1.0). Cada año antes reduce ~5%.</p>
                    <p>• <strong>Rango óptimo:</strong> 60-65 años. Antes de 60 años la reducción es significativa.</p>
                    <p>• <strong>Estrategia M40:</strong> Te permite jubilarte más joven manteniendo una pensión alta.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fecha de Inicio M40 */}
          <div className="bg-gray-50 p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-900">
                  Fecha de Inicio M40
                </label>
                <p className="text-sm text-gray-600">Cuándo iniciar trámites</p>
              </div>
            </div>
            
            <div className="mb-4 space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-sm font-semibold text-blue-800 mb-2">
                  📅 Fecha Recomendada
                </div>
                <div className="text-sm text-blue-700">
                  {getOptimalStartDate(selectedFamilyMember.birthDate).message}
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  {getOptimalStartDate(selectedFamilyMember.birthDate).details}
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
                <strong>⚠️ Importante:</strong> Esta fecha es para iniciar trámites (baja IMSS + alta M40). 
                Puedes posponerla según tus necesidades.
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <select
                  value={filters.startMonth}
                  onChange={(e) => updateFilters({ startMonth: parseInt(e.target.value) })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={filters.startYear}
                  onChange={(e) => updateFilters({ startYear: parseInt(e.target.value) })}
                  className="w-24 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium text-center"
                  placeholder="Año"
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 15}
                />
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>🗓️ <strong>Fecha personalizada:</strong> Elige cuándo quieres iniciar trámites</div>
                <div>📊 <strong>Los cálculos se ajustarán automáticamente</strong> a tu fecha elegida</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {getMonthName(filters.startMonth || new Date().getMonth() + 1)} {filters.startYear || new Date().getFullYear()}
                </div>
                <div className="text-sm text-gray-600">Fecha de inicio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Familiar */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-2xl border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="bg-blue-600 p-3 rounded-xl self-start sm:self-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                Perfil de {selectedFamilyMember.name}
              </h4>
              <p className="text-sm sm:text-base text-gray-600">Información personalizada para cálculos precisos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-100 p-1 rounded">
                  <span className="text-blue-600 text-xs sm:text-sm">📅</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Edad actual</div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{calculateAge(selectedFamilyMember.birthDate)} años</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-green-100 p-1 rounded">
                  <span className="text-green-600 text-xs sm:text-sm">📊</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Semanas cotizadas</div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{selectedFamilyMember.weeksContributed}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-yellow-100 p-1 rounded">
                  <span className="text-yellow-600 text-xs sm:text-sm">💰</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Salario mensual</div>
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(selectedFamilyMember.lastGrossSalary || 0)}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-purple-100 p-1 rounded">
                  <span className="text-purple-600 text-xs sm:text-sm">🎯</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Edad de jubilación</div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{filters.retirementAge} años</div>
            </div>
          </div>
          
          {/* Información de SDI */}
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <span className="text-white text-xs sm:text-sm font-bold">📊</span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-green-800">SDI Calculado</div>
                </div>
                <div className="text-base sm:text-lg font-bold text-green-700">${sdi.toFixed(2)} diario</div>
                <div className="text-xs text-green-600 mt-1">{sdiEnUMAs.toFixed(2)} UMAs</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 sm:p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <span className="text-white text-xs sm:text-sm font-bold">🎯</span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-purple-800">Filtros Inteligentes</div>
                </div>
                <div className="text-xs text-purple-700">
                  Las estrategias se filtran automáticamente según tu SDI para mostrar solo opciones viables
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
