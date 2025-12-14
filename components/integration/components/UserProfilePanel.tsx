import { motion } from "framer-motion"
import { Users } from "lucide-react"
import { FamilyMember } from "@/types/family"
import { IntegrationFilters } from "@/types/strategy"
import { useFormatters } from "@/hooks/useFormatters"
import { calculateAge } from "../utils/calculations"

interface UserProfilePanelProps {
  selectedFamilyMember: FamilyMember
  filters: IntegrationFilters
}

export function UserProfilePanel({
  selectedFamilyMember,
  filters
}: UserProfilePanelProps) {
  const { currency: formatCurrency } = useFormatters()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="bg-blue-600 p-3 rounded-xl self-start sm:self-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Perfil de {selectedFamilyMember.name}
            </h3>
            <p className="text-sm sm:text-base text-gray-600">Información personalizada para cálculos precisos</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
              <div className="text-xs sm:text-sm text-gray-600">Tu Último salario bruto Mensual</div>
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(selectedFamilyMember.lastGrossSalary || 0)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

