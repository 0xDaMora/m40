"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Users, TrendingUp, Calendar, DollarSign, Target, Lock, Crown } from "lucide-react"
import { FamilyMember } from "@/types/family"
import { StrategyResult } from "@/types/strategy"
import { formatCurrency } from "@/lib/utils/formatters"
import { useMercadoPago } from "@/hooks/useMercadoPago"
import { useSession } from "next-auth/react"

interface StrategyPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  strategy: StrategyResult | null
  familyMember: FamilyMember | null
  onConfirmPurchase: (strategy: StrategyResult, familyMember: FamilyMember) => Promise<void>
  // Agregar props necesarias para la funcionalidad completa
  filters?: any
  router?: any
  onOpenPremiumModal?: () => void
}

export default function StrategyPurchaseModal({
  isOpen,
  onClose,
  strategy,
  familyMember,
  onConfirmPurchase,
  filters,
  router,
  onOpenPremiumModal
}: StrategyPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const { processPurchase, loading: mercadoPagoLoading } = useMercadoPago()

  if (!strategy || !familyMember) return null

  const handleConfirmPurchase = async () => {
    if (!session) {
      console.error('Usuario no autenticado')
      return
    }

    setIsLoading(true)
    try {
      // Usar MercadoPago para la compra
      const startMonth = filters?.startMonth || new Date().getMonth() + 1
      const startYear = filters?.startYear || new Date().getFullYear()
      const fechaInicio = new Date(startYear, startMonth, 1).toISOString().split('T')[0]
      
      // Importar las funciones necesarias dinámicamente
      const { generarCodigoEstrategia, construirDatosEstrategia, construirDatosUsuario } = await import('@/lib/utils/strategy')
      
      const strategyCode = generarCodigoEstrategia('integration', {
        familyMemberId: familyMember.id,
        estrategia: strategy.estrategia,
        umaElegida: strategy.umaElegida,
        mesesM40: strategy.mesesM40,
        edadJubilacion: filters?.retirementAge || 65,
        inicioM40: fechaInicio
      })
      
      const birthDate = familyMember.birthDate instanceof Date 
        ? familyMember.birthDate 
        : new Date(familyMember.birthDate)
      
      // Construir datos de estrategia
      const datosEstrategia = construirDatosEstrategia(strategy, {
        edad: filters?.retirementAge || 65,
        dependiente: familyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
        sdiHistorico: familyMember.lastGrossSalary / 30.4,
        semanasPrevias: familyMember.weeksContributed,
        familyMemberId: familyMember.id,
        inicioM40: fechaInicio
      }, fechaInicio)
      
      const datosUsuario = construirDatosUsuario({
        edad: filters?.retirementAge || 65,
        dependiente: familyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
        sdiHistorico: familyMember.lastGrossSalary / 30.4,
        semanasPrevias: familyMember.weeksContributed,
        familyMemberId: familyMember.id,
        fechaNacimiento: birthDate.toISOString().split('T')[0],
        inicioM40: fechaInicio
      }, strategy, familyMember.name)

      // Procesar compra con MercadoPago
      const orderData = {
        planType: 'basic' as const,
        strategyData: {
          ...datosEstrategia,
          familyMemberId: familyMember.id
        },
        userData: {
          ...datosUsuario,
          familyMemberId: familyMember.id,
          familyMemberName: familyMember.name
        },
        amount: 50
      }

      const success = await processPurchase(orderData)
      
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error al confirmar la compra:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Función completa para manejar la compra (igual que viewStrategyDetails)
  const handleCompleteStrategyPurchase = async () => {
    if (!filters || !router) return

    try {
      // Usar el nuevo código de estrategia que incluye fecha de inicio
      const startMonth = filters.startMonth || new Date().getMonth() + 1
      const startYear = filters.startYear || new Date().getFullYear()
      const fechaInicio = new Date(startYear, startMonth, 1).toISOString().split('T')[0]
      
      // Importar las funciones necesarias dinámicamente
      const { generarCodigoEstrategia, construirDatosEstrategia, construirDatosUsuario } = await import('@/lib/utils/strategy')
      
      const strategyCode = generarCodigoEstrategia('integration', {
        familyMemberId: familyMember.id,
        estrategia: strategy.estrategia,
        umaElegida: strategy.umaElegida,
        mesesM40: strategy.mesesM40,
        edadJubilacion: filters.retirementAge,
        inicioM40: fechaInicio
      })
      
      const birthDate = familyMember.birthDate instanceof Date 
        ? familyMember.birthDate 
        : new Date(familyMember.birthDate)
      
      // Construir datos de estrategia con la fecha de inicio específica
      const datosEstrategia = construirDatosEstrategia(strategy, {
        edad: filters.retirementAge,
        dependiente: familyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
        sdiHistorico: familyMember.lastGrossSalary / 30.4,
        semanasPrevias: familyMember.weeksContributed,
        familyMemberId: familyMember.id,
        inicioM40: fechaInicio
      }, fechaInicio)
      
      const datosUsuario = construirDatosUsuario({
        edad: filters.retirementAge,
        dependiente: familyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
        sdiHistorico: familyMember.lastGrossSalary / 30.4,
        semanasPrevias: familyMember.weeksContributed,
        familyMemberId: familyMember.id,
        fechaNacimiento: birthDate.toISOString().split('T')[0],
        inicioM40: fechaInicio
      }, strategy, familyMember.name)
      
      // Guardar la estrategia
      const response = await fetch('/api/guardar-estrategia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debugCode: strategyCode,
          datosEstrategia,
          datosUsuario,
          familyMemberId: familyMember.id
        }),
      })
      
      if (response.ok) {
        const url = `/estrategia/${strategyCode}`
        router.push(url)
      } else if (response.status === 409) {
        // La estrategia ya existe, abrir directamente
        const url = `/estrategia/${strategyCode}`
        router.push(url)
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error al guardar estrategia:', error)
      throw error
    }
  }

  // Calcular aportación mensual promedio
  const aportacionPromedio = strategy.inversionTotal ? strategy.inversionTotal / strategy.mesesM40 : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Confirmar Compra de Estrategia</h2>
                    <p className="text-orange-100 text-sm sm:text-base">Revisa los detalles antes de proceder</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg sm:rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Resumen de la Estrategia */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Estrategia Seleccionada
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                   {/* Tipo de Estrategia */}
                   <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                     <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1 sm:mb-2">Tipo de Estrategia</div>
                     <div className="text-sm sm:text-lg font-bold text-gray-900">
                       {strategy.estrategia === 'fijo' ? 'Estrategia Fija' : 'Estrategia Progresiva'}
                     </div>
                     <div className="text-xs sm:text-sm text-gray-600">Modalidad 40</div>
                   </div>

                   {/* UMA Elegida */}
                   <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                     <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1 sm:mb-2">Nivel UMA</div>
                     <div className="text-lg sm:text-2xl font-bold text-blue-700">{strategy.umaElegida}</div>
                     <div className="text-xs sm:text-sm text-gray-600">Unidades de Medida y Actualización</div>
                   </div>

                   {/* Duración */}
                   <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                     <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1 sm:mb-2">Duración</div>
                     <div className="text-lg sm:text-2xl font-bold text-blue-700">{strategy.mesesM40} meses</div>
                     <div className="text-xs sm:text-sm text-gray-600">En Modalidad 40</div>
                   </div>

                   {/* Fecha de Inicio M40 */}
                   <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                     <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1 sm:mb-2">Fecha de Inicio M40</div>
                     <div className="text-sm sm:text-lg font-bold text-gray-900">
                       {(() => {
                         const startMonth = filters?.startMonth || new Date().getMonth() + 1
                         const startYear = filters?.startYear || new Date().getFullYear()
                         const monthNames = [
                           'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                         ]
                         return `${monthNames[startMonth - 1]} ${startYear}`
                       })()}
                     </div>
                     <div className="text-xs sm:text-sm text-gray-600">Inicio de trámites</div>
                   </div>

                   {/* ROI */}
                   <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                     <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1 sm:mb-2">Retorno de Inversión</div>
                     <div className="text-lg sm:text-2xl font-bold text-green-600">{(strategy.ROI || 0).toFixed(1)}%</div>
                     <div className="text-xs sm:text-sm text-gray-600">Rendimiento esperado</div>
                   </div>
                 </div>

                {/* Información Financiera Destacada */}
                <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-200 text-center">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1">Pensión Mensual</div>
                    <div className="text-lg sm:text-2xl font-bold text-green-700">{formatCurrency(strategy.pensionMensual || 0)}</div>
                    <div className="text-xs text-green-600">Al jubilarse</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200 text-center">
                    <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Aportación Promedio</div>
                    <div className="text-lg sm:text-2xl font-bold text-blue-700">{formatCurrency(aportacionPromedio)}</div>
                    <div className="text-xs text-blue-600">Mensual</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-orange-200 text-center">
                    <div className="text-xs sm:text-sm text-orange-600 font-medium mb-1">Inversión Total</div>
                    <div className="text-2xl font-bold text-orange-700">{formatCurrency(strategy.inversionTotal || 0)}</div>
                    <div className="text-xs text-orange-600">En {strategy.mesesM40} meses</div>
                  </div>
                </div>
              </div>

              {/* Información del Familiar */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  Datos del Familiar
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-100">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1 sm:mb-2">Nombre</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{familyMember.name}</div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-100">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1 sm:mb-2">Edad Actual</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">
                      {new Date().getFullYear() - new Date(familyMember.birthDate).getFullYear()} años
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-100">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1 sm:mb-2">Semanas Cotizadas</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{familyMember.weeksContributed}</div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-100">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1 sm:mb-2">Salario Mensual</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{formatCurrency(familyMember.lastGrossSalary)}</div>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  Información Adicional
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                    <div className="text-xs sm:text-sm text-purple-600 font-medium mb-1 sm:mb-2">Estado Civil</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900 capitalize">{familyMember.civilStatus}</div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                    <div className="text-xs sm:text-sm text-purple-600 font-medium mb-1 sm:mb-2">Fecha de Registro</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">
                      {new Date(familyMember.createdAt).toLocaleDateString('es-MX')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-xs sm:text-sm">⚠️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-800 text-xs sm:text-sm mb-1 sm:mb-2">Importante</h4>
                    <div className="text-xs text-yellow-700 space-y-1">
                      <p>• Esta estrategia será guardada en tu cuenta y podrás acceder a ella desde "Mis Estrategias"</p>
                      <p>• Los cálculos están basados en la LEY 73 del IMSS y son precisos para tu perfil</p>
                      <p>• Una vez confirmada la compra, podrás ver todos los detalles y descargar el PDF</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con Botones */}
            <div className="sticky bottom-0 bg-gray-50 p-4 sm:p-6 rounded-b-2xl sm:rounded-b-3xl border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                {/* Botón Premium */}
                {onOpenPremiumModal && (
                  <button
                    onClick={() => {
                      onClose()
                      onOpenPremiumModal()
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Desbloquear con Premium
                  </button>
                )}
                
                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3 ml-auto">
                  <button
                    onClick={onClose}
                    disabled={isLoading || mercadoPagoLoading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={isLoading || mercadoPagoLoading}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                  >
                    <div className="flex items-center gap-2">
                      {(isLoading || mercadoPagoLoading) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                      <span>{(isLoading || mercadoPagoLoading) ? 'Procesando...' : 'Confirmar Compra de 50 MXN'}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
