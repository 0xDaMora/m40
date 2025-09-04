import { motion } from "framer-motion"
import { Users, Plus, ChevronDown, ChevronUp, Lock } from "lucide-react"
import { FamilyMember } from "@/types/family"
import { useFormatters } from "@/hooks/useFormatters"
import { calculateAge, getOptimalStartDate } from "../utils/calculations"
import { useState } from "react"
import { Session } from "next-auth"

interface FamilySelectorProps {
  familyMembers: FamilyMember[]
  selectedFamilyMember: FamilyMember | null
  onSelectFamilyMember: (member: FamilyMember) => void
  onOpenFamilyForm: () => void
  onOptimalDateChange?: (month: number, year: number) => void
  session: Session | null
  onOpenLoginModal: () => void
}

export function FamilySelector({
  familyMembers,
  selectedFamilyMember,
  onSelectFamilyMember,
  onOpenFamilyForm,
  onOptimalDateChange,
  session,
  onOpenLoginModal
}: FamilySelectorProps) {
  const [showAllMembers, setShowAllMembers] = useState(false)
  
  // Mostrar solo 4 familiares por defecto, o todos si showAllMembers es true
  const displayedMembers = showAllMembers ? familyMembers : familyMembers.slice(0, 4)
  const hasMoreMembers = familyMembers.length > 4
  const { currency: formatCurrency } = useFormatters()

  // Las funciones calculateAge y getOptimalStartDate ahora vienen de utils/calculations

  // Función para manejar el clic en "Registrar Familiar"
  const handleRegisterFamilyClick = () => {
    if (!session) {
      // Si no hay sesión, abrir modal de login
      onOpenLoginModal()
    } else {
      // Si hay sesión, abrir formulario de familiar
      onOpenFamilyForm()
    }
  }

  const handleSelectMember = (member: FamilyMember) => {
    onSelectFamilyMember(member)
    
    // Actualizar fecha de inicio óptima cuando se selecciona un familiar
    if (onOptimalDateChange) {
      const optimalDate = getOptimalStartDate(member.birthDate)
      onOptimalDateChange(optimalDate.month, optimalDate.year)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-2 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="bg-blue-600 p-2 rounded-lg self-start sm:self-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span>Perfil del Familiar</span>
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {!session 
                ? 'Inicia sesión para registrar y seleccionar familiares'
                : 'Selecciona o registra los datos del familiar para calcular estrategias personalizadas'
              }
            </p>
          </div>
          <button
            onClick={handleRegisterFamilyClick}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 text-sm sm:text-base ${
              !session 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {!session ? (
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span className="hidden sm:inline">
              {!session ? 'Iniciar Sesión' : 'Registrar Familiar'}
            </span>
            <span className="sm:hidden">
              {!session ? 'Login' : 'Registrar'}
            </span>
          </button>
        </div>
      </div>

      {familyMembers.length === 0 ? (
        <div className="p-6 sm:p-8 lg:p-12 text-center">
          <div className="bg-blue-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          </div>
          <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
            Comienza registrando un familiar
          </h4>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
            {!session 
              ? 'Inicia sesión para registrar familiares y calcular estrategias personalizadas de Modalidad 40'
              : 'Para calcular estrategias personalizadas de Modalidad 40, necesitamos los datos del familiar que desea jubilarse'
            }
          </p>
          <button
            onClick={handleRegisterFamilyClick}
            className={`px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base ${
              !session 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {!session ? 'Iniciar Sesión para Registrar Familiar' : 'Registrar Primer Familiar'}
          </button>
        </div>
      ) : (
        <div className="p-2 sm:p-4 lg:p-6 xl:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full">
            {displayedMembers.map((member) => (
              <motion.div
                key={member.id}
                onClick={() => handleSelectMember(member)}
                className={`relative p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl min-w-0 ${
                  selectedFamilyMember?.id === member.id
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                {selectedFamilyMember?.id === member.id && (
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                )}
                <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                  <div className="bg-blue-100 p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Edad</div>
                    <div className="text-xs sm:text-sm lg:text-base font-bold text-gray-900">{calculateAge(member.birthDate)} años</div>
                  </div>
                </div>
                <h4 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{member.name}</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-600">Semanas cotizadas</span>
                    <span className="text-xs font-semibold text-gray-900">{member.weeksContributed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Salario mensual</span>
                    <span className="text-xs font-semibold text-gray-900">{formatCurrency(member.lastGrossSalary)}</span>
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 lg:mt-4 pt-1.5 sm:pt-2 lg:pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {selectedFamilyMember?.id === member.id ? 'Seleccionado' : 'Haz clic para seleccionar'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Botón de collapse para mostrar más familiares */}
          {hasMoreMembers && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAllMembers(!showAllMembers)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                {showAllMembers ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Mostrar {familyMembers.length - 4} familiar{familyMembers.length - 4 !== 1 ? 'es' : ''} más
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
