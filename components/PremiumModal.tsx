"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { Crown, Star, CheckCircle, TrendingUp, FileText, Users, Zap, Shield, ArrowRight, Calculator, X } from "lucide-react"
import { toast } from "react-hot-toast"
import PremiumRegistrationModal from "./PremiumRegistrationModal"
import ConfirmationModal from "./ConfirmationModal"


interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickRegistration, setShowQuickRegistration] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  const handlePremiumPurchase = () => {
    if (!session) {
      // Usuario no logueado - mostrar modal de registro rápido
      setShowQuickRegistration(true)
    } else {
      // Usuario logueado - mostrar modal de confirmación Premium
      setShowConfirmationModal(true)
    }
  }

  const handleQuickRegistrationSuccess = async (userData: any) => {
    // Después del registro exitoso, mostrar el modal de confirmación
    setShowConfirmationModal(true)
  }

  const handleConfirmation = async (familyMemberName: string) => {
    try {
      // Flujo Premium: cambiar estatus del usuario
      const response = await fetch('/api/update-user-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: 'premium'
        }),
      })

      if (response.ok) {
        toast.success('¡Plan Premium activado exitosamente!')
        onClose()
        
        // Recargar la página para actualizar la sesión
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error('Error al actualizar el plan')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al procesar la compra Premium')
    }
  }

  const benefits = [
    {
      icon: Calculator,
      title: "2,000+ Estrategias",
      description: "Todas las combinaciones posibles analizadas para tu perfil específico"
    },
    {
      icon: FileText,
      title: "PDFs Ilimitados",
      description: "Descarga todas las estrategias que quieras en formato PDF"
    },
    {
      icon: TrendingUp,
      title: "Análisis Completo",
      description: "Proyección detallada de 20 años con todos los factores"
    },
    {
      icon: Crown,
      title: "Acceso de por Vida",
      description: "Una sola compra, acceso ilimitado para siempre"
    },
    {
      icon: Users,
      title: "Familia Completa",
      description: "Gestiona hasta 10 familiares con estrategias personalizadas"
    },
    {
      icon: Zap,
      title: "Soporte Prioritario",
      description: "Atención especializada para usuarios Premium"
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="premium-modal" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Plan Premium</h2>
                    <p className="text-purple-100">Acceso ilimitado de por vida</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-white/80 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Beneficios */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <benefit.icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {benefit.description}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Precio y CTA */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-purple-600 mb-2">$999</div>
                    <div className="text-lg text-gray-700 mb-4">Pago único de por vida</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">2,000+</div>
                        <div className="text-sm text-gray-600">Estrategias</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">∞</div>
                        <div className="text-sm text-gray-600">PDFs</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">20</div>
                        <div className="text-sm text-gray-600">Años análisis</div>
                      </div>
                    </div>

                                         <button
                       onClick={handlePremiumPurchase}
                       className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 mx-auto"
                     >
                       <Crown className="w-5 h-5" />
                       {session ? 'Comprar Premium' : 'Iniciar Sesión'}
                       <ArrowRight className="w-5 h-5" />
                     </button>

                    <div className="mt-4 text-sm text-gray-600">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Shield className="w-4 h-4" />
                        Pago seguro con Stripe
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Garantía de 30 días
                      </div>
                    </div>
                  </div>
                </div>

                
              
              </div>
            </div>
                     </motion.div>
         </div>
       )}

       {/* Modal de Registro Premium */}
       <PremiumRegistrationModal
         isOpen={showQuickRegistration}
         onClose={() => setShowQuickRegistration(false)}
         onSuccess={handleQuickRegistrationSuccess}
       />

       {/* Modal de Confirmación */}
       <ConfirmationModal
         isOpen={showConfirmationModal}
         onClose={() => setShowConfirmationModal(false)}
         onConfirm={handleConfirmation}
         strategy={null}
         userData={null}
         isPremium={true}
       />
     </AnimatePresence>
   )
 }
