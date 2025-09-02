"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Target, Users, ArrowRight, CheckCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import QuickRegistrationModal from "./QuickRegistrationModal"
import { LoginModal } from "./auth/LoginModal"

interface ToolAccessModalProps {
  isOpen: boolean
  onClose: () => void
  // Datos del HeroOnboard para pre-llenar el familiar
  heroOnboardData?: {
    name?: string
    birthDate?: string
    weeksContributed?: number
    lastGrossSalary?: number
    civilStatus?: string
  }
}

export default function ToolAccessModal({ isOpen, onClose, heroOnboardData }: ToolAccessModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [showQuickRegistration, setShowQuickRegistration] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [isCreatingFamily, setIsCreatingFamily] = useState(false)
  const [familyMemberName, setFamilyMemberName] = useState(heroOnboardData?.name || "")
  const [familyMemberData, setFamilyMemberData] = useState({
    birthDate: heroOnboardData?.birthDate || new Date().toISOString().split('T')[0],
    weeksContributed: heroOnboardData?.weeksContributed || 0,
    lastGrossSalary: heroOnboardData?.lastGrossSalary || 0,
    civilStatus: heroOnboardData?.civilStatus || 'soltero'
  })

  // Actualizar datos cuando heroOnboardData cambie
  useEffect(() => {
    if (heroOnboardData) {
      setFamilyMemberName(heroOnboardData.name || "")
      setFamilyMemberData({
        birthDate: heroOnboardData.birthDate || new Date().toISOString().split('T')[0],
        weeksContributed: heroOnboardData.weeksContributed || 0,
        lastGrossSalary: heroOnboardData.lastGrossSalary || 0,
        civilStatus: heroOnboardData.civilStatus || 'soltero'
      })
    }
  }, [heroOnboardData])

  const handleQuickRegistrationSuccess = async (userData: any) => {
    // Después del registro exitoso, mostrar el modal de guardar familiar
    setShowQuickRegistration(false)
    setIsCreatingFamily(true)
  }

  const handleLoginSuccess = () => {
    // Después del login exitoso, mostrar el modal de guardar familiar
    setShowLogin(false)
    setIsCreatingFamily(true)
  }

  const handleCreateFamily = async () => {
    if (!familyMemberName.trim()) {
      toast.error("Por favor ingresa el nombre del familiar")
      return
    }

    try {
      setIsCreatingFamily(false)
      
      console.log("📤 Creando familiar con datos:", {
        name: familyMemberName,
        ...familyMemberData
      })
      
      // Crear familiar en la base de datos
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: familyMemberName,
          birthDate: familyMemberData.birthDate,
          weeksContributed: familyMemberData.weeksContributed,
          lastGrossSalary: familyMemberData.lastGrossSalary,
          civilStatus: familyMemberData.civilStatus
        }),
      })

      const responseData = await response.json()
      console.log("📥 Respuesta del servidor:", response.status, responseData)

      if (response.ok) {
        toast.success('¡Familiar guardado exitosamente!')
        onClose()
        // Redirigir a la herramienta avanzada
        router.push('/simulador')
      } else {
        throw new Error(responseData.error || `Error ${response.status}: ${responseData.message || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error al crear familiar:', error)
      toast.error(`Error al crear el familiar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      // Volver a mostrar el modal de creación
      setIsCreatingFamily(true)
    }
  }

  if (showQuickRegistration) {
    return (
      <QuickRegistrationModal
        isOpen={showQuickRegistration}
        onClose={() => setShowQuickRegistration(false)}
        onSuccess={handleQuickRegistrationSuccess}
        strategyData={null}
        userData={heroOnboardData ? {
          // Mapear a formato que espera QuickRegistrationModal (HeroOnboard format)
          Nacimiento: heroOnboardData.birthDate,
          fechaNacimiento: heroOnboardData.birthDate,
          nombre: heroOnboardData.name,
          Semanas: heroOnboardData.weeksContributed.toString(),
          semanasPrevias: heroOnboardData.weeksContributed,
          sdi: (heroOnboardData.lastGrossSalary / 30.4).toString(), // Convertir de mensual a diario
          sdiHistorico: heroOnboardData.lastGrossSalary / 30.4,
          "Estado Civil": heroOnboardData.civilStatus === 'casado' ? 'Casado(a)' : 'Soltero(a)',
          estadoCivil: heroOnboardData.civilStatus,
          // Datos adicionales que pueda necesitar
          edad: 0, // Se calculará automáticamente
          dependiente: heroOnboardData.civilStatus === 'casado' ? 'conyuge' : 'ninguno'
        } : null}
      />
    )
  }

  if (showLogin) {
    return (
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
      />
    )
  }

  if (isCreatingFamily) {
    return (
      <AnimatePresence>
        {isCreatingFamily && (
          <motion.div
            key="family-creation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <button
                onClick={() => setIsCreatingFamily(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <Users className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Guardar Familiar</h2>
                <p className="mt-2 text-gray-600">
                  Para usar la herramienta avanzada, necesitamos guardar un familiar
                </p>
              </div>

                             <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Nombre del familiar
                 </label>
                 <input
                   type="text"
                   value={familyMemberName}
                   onChange={(e) => setFamilyMemberName(e.target.value)}
                   placeholder="Ej: Juan Pérez"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   autoFocus
                 />
               </div>

               {/* Mostrar datos del HeroOnboard si están disponibles */}
               {heroOnboardData && (
                 <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                   <h4 className="text-sm font-semibold text-blue-800 mb-3">📋 Datos de tu simulación:</h4>
                   <div className="grid grid-cols-2 gap-3 text-sm">
                     <div>
                       <span className="text-blue-600 font-medium">Fecha de nacimiento:</span>
                       <p className="text-gray-700">{heroOnboardData.birthDate || 'No especificada'}</p>
                     </div>
                     <div>
                       <span className="text-blue-600 font-medium">Semanas cotizadas:</span>
                       <p className="text-gray-700">{heroOnboardData.weeksContributed || 0}</p>
                     </div>
                     <div>
                       <span className="text-blue-600 font-medium">SDI mensual:</span>
                       <p className="text-gray-700">${heroOnboardData.lastGrossSalary?.toLocaleString() || 0}</p>
                     </div>
                     <div>
                       <span className="text-blue-600 font-medium">Estado civil:</span>
                       <p className="text-gray-700 capitalize">{heroOnboardData.civilStatus || 'No especificado'}</p>
                     </div>
                   </div>
                   <p className="text-xs text-blue-600 mt-2">
                     Estos datos se usarán como base para tu estrategia personalizada
                   </p>
                 </div>
               )}

              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreatingFamily(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFamily}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="tool-access-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-8">
              <Target className="mx-auto mb-4 h-16 w-16 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">Accede a la Herramienta Avanzada</h2>
              <p className="mt-2 text-xl text-gray-600">
                Calcula con precisión tu estrategia personalizada
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">📅</div>
                <h3 className="font-semibold text-blue-800 mb-2">Fecha de Inicio</h3>
                <p className="text-sm text-gray-600">Elige cuándo comenzar tu estrategia</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-blue-800 mb-2">Pensión Objetivo</h3>
                <p className="text-sm text-gray-600">Define tu meta específica de pensión</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">⏱️</div>
                <h3 className="font-semibold text-blue-800 mb-2">Duración Personalizada</h3>
                <p className="text-sm text-gray-600">Meses exactos en Modalidad 40</p>
              </div>
            </div>

            {!session ? (
              <div className="space-y-4">
                <p className="text-center text-gray-600 mb-6">
                  Para usar la herramienta avanzada, necesitas crear una cuenta y guardar un familiar
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowQuickRegistration(true)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Crear Cuenta
                  </button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="h-5 w-5" />
                    Iniciar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  ¡Perfecto! Ya tienes una cuenta. Solo necesitamos guardar un familiar para continuar
                </p>
                <button
                  onClick={() => setIsCreatingFamily(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <Users className="h-5 w-5" />
                  Guardar Familiar
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
