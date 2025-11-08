"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Crown, Star, CheckCircle } from "lucide-react"
import { toast } from "react-hot-toast"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (familyMemberName: string) => void
  strategy?: any
  userData?: any
  isPremium?: boolean
  isPremiumStrategy?: boolean // Para distinguir entre compra Premium y ver estrategia Premium
  isIndividualPurchase?: boolean // Para indicar que es compra individual (50 MXN)
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  strategy, 
  userData,
  isPremium = false,
  isPremiumStrategy = false,
  isIndividualPurchase = false
}: ConfirmationModalProps) {
  const [familyMemberName, setFamilyMemberName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Resetear nombre cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setFamilyMemberName("")
    }
  }, [isOpen])

  const handleConfirm = async () => {
    // Requerir nombre cuando se va a guardar/crear familiar (usuarios normales, Premium viendo estrategia, o compra individual)
    const requiereNombre = !isPremium || (isPremium && isPremiumStrategy) || isIndividualPurchase
    if (requiereNombre && !familyMemberName.trim()) {
      toast.error("Por favor ingresa el nombre del familiar")
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(familyMemberName)
      setFamilyMemberName("")
      // No cerrar el modal aquí si es compra individual, el padre lo manejará
      if (!isIndividualPurchase) {
        onClose()
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al procesar la confirmación")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
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
            className={`relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden ${
              isPremium ? 'border-2 border-purple-200' : isIndividualPurchase ? 'border-2 border-orange-200' : ''
            }`}
          >
            {/* Header */}
            <div className={`p-6 ${
              isPremium ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
              : isIndividualPurchase ? 'bg-gradient-to-r from-orange-500 to-orange-600'
              : 'bg-gradient-to-r from-blue-600 to-blue-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPremium ? (
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                  ) : isIndividualPurchase ? (
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {isPremium && !isPremiumStrategy ? 'Confirmar Plan Premium' 
                       : isIndividualPurchase ? 'Compra de Estrategia' 
                       : 'Confirmar Compra'}
                    </h2>
                    <p className="text-white text-opacity-90 text-sm">
                      {isPremium && !isPremiumStrategy ? 'Acceso ilimitado de por vida' 
                       : isIndividualPurchase ? 'Ingresa el nombre del familiar' 
                       : 'Estrategia personalizada'}
                    </p>
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
            <div className="p-6">
              {isPremium && !isPremiumStrategy ? (
                // Contenido para compra Premium
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-3">
                      <Star className="w-4 h-4" />
                      Plan Premium de por Vida
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ¡Acceso Ilimitado Completo!
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Con tu Plan Premium tendrás acceso a todas las estrategias, PDFs ilimitados y análisis completo.
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Beneficios Premium:
                    </h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• 2,000+ estrategias personalizadas</li>
                      <li>• PDFs ilimitados</li>
                      <li>• Análisis completo de 20 años</li>
                      <li>• Acceso de por vida</li>
                      <li>• Soporte prioritario</li>
                    </ul>
                  </div>
                </div>
              ) : (
                // Contenido para estrategia individual
                <div className="space-y-4">
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-3 ${
                      isIndividualPurchase 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      <Star className="w-4 h-4" />
                      {isIndividualPurchase ? 'Compra Individual - 50 MXN' : '¡Tu Estrategia Gratis!'}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Estrategia Seleccionada
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {strategy?.pensionMensual ? new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0
                        }).format(strategy.pensionMensual) : 'N/A'}
                      </div>
                      <div className="text-sm text-blue-700">
                        Pensión mensual proyectada
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      {isIndividualPurchase 
                        ? 'Ingresa el nombre del familiar para continuar con la compra de esta estrategia por 50 MXN.'
                        : (
                          <>
                            Esta es tu <strong>única estrategia gratis</strong>. Para guardar más estrategias, actualiza a Premium.
                          </>
                        )}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-semibold text-gray-900">
                        {strategy?.inversionTotal ? new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          minimumFractionDigits: 0
                        }).format(strategy.inversionTotal) : 'N/A'}
                      </div>
                      <div className="text-gray-600">Inversión total</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-semibold text-gray-900">
                        {strategy?.mesesM40 || 'N/A'} meses
                      </div>
                      <div className="text-gray-600">Duración</div>
                    </div>
                  </div>
                  
                  {/* Debug info */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
                    <div className="font-semibold text-yellow-800 mb-1">Debug Info:</div>
                    <div>UMA: {strategy?.umaElegida || 'N/A'}</div>
                    <div>Estrategia: {strategy?.estrategia || strategy?.progresivo ? 'progresivo' : 'fijo'}</div>
                    <div>ROI: {strategy?.ROI || 'N/A'}%</div>
                  </div>
                </div>
              )}

                             {/* Input para nombre del familiar - solo para estrategias individuales */}
               {(!isPremium || (isPremium && isPremiumStrategy) || isIndividualPurchase) && (
                 <div className="mt-6">
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     <User className="w-4 h-4 inline mr-1" />
                     Nombre del familiar
                   </label>
                   <input
                     type="text"
                     value={familyMemberName}
                     onChange={(e) => setFamilyMemberName(e.target.value)}
                     placeholder="Ej: Juan Pérez"
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     autoFocus={isIndividualPurchase}
                   />
                   <p className="text-xs text-gray-500 mt-1">
                     {isIndividualPurchase 
                       ? 'Este nombre identificará al familiar en la estrategia que vas a comprar'
                       : 'Este nombre aparecerá en tu estrategia personalizada'}
                   </p>
                 </div>
               )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-colors ${
                    isPremium && !isPremiumStrategy
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                      : isIndividualPurchase
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Procesando...
                    </div>
                  ) : (
                    isPremium && !isPremiumStrategy 
                      ? 'Confirmar Premium' 
                      : isIndividualPurchase
                      ? 'Continuar con Compra'
                      : 'Obtener Gratis'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
