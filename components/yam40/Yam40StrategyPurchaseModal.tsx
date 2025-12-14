"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Users, TrendingUp, Calendar, DollarSign, Target, Lock, Crown, AlertTriangle, Info, Sparkles, CheckCircle } from "lucide-react"
import { StrategyResult } from "@/types/strategy"
import { MesConSDI, MesManual } from "@/types/yam40"
import { formatCurrency } from "@/lib/utils/formatters"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { construirDatosYam40ParaGuardar } from "@/lib/yam40/construirDatosYam40ParaGuardar"
import { generarCodigoEstrategia } from "@/lib/utils/strategy"
import toast from "react-hot-toast"
import { calcularLimitantesM40 } from "@/lib/yam40/limitantesM40"
import { useMercadoPago } from "@/hooks/useMercadoPago"

interface Yam40StrategyPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  pensionActual: StrategyResult | null
  mesesConSDI: MesConSDI[]
  fechaInicioM40: { mes: number; año: number }
  fechaFinM40: { mes: number; año: number }
  modoEntradaPagos: 'rango' | 'manual'
  paymentMethod?: 'aportacion' | 'uma'
  paymentValue?: number
  mesesManuales?: MesManual[]
  datosUsuario: {
    name: string
    birthDate: Date | null
    retirementAge: number
    totalWeeksContributed: number
    civilStatus: 'soltero' | 'casado'
    sdiHistorico: number
  }
  onOpenPremiumModal?: () => void
}

export default function Yam40StrategyPurchaseModal({
  isOpen,
  onClose,
  pensionActual,
  mesesConSDI,
  fechaInicioM40,
  fechaFinM40,
  modoEntradaPagos,
  paymentMethod,
  paymentValue,
  mesesManuales,
  datosUsuario,
  onOpenPremiumModal
}: Yam40StrategyPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmRetirementAge, setConfirmRetirementAge] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { processPurchase, loading: mercadoPagoLoading } = useMercadoPago()

  // Calcular elegibilidad para mejorar
  const limitantes = useMemo(() => {
    if (mesesConSDI.length === 0) return null
    return calcularLimitantesM40(mesesConSDI, new Date())
  }, [mesesConSDI])

  const puedeMejorar = limitantes?.puedeReingresar ?? true
  const isPremium = (session?.user as any)?.subscription === 'premium'

  if (!pensionActual || !datosUsuario.birthDate) return null

  const handleConfirmPurchase = async () => {
    if (!session) {
      toast.error('Debes iniciar sesión para comprar la estrategia')
      return
    }

    // Validar confirmación de edad de jubilación
    if (!confirmRetirementAge) {
      toast.error('Por favor confirma que estás seguro con la edad de jubilación seleccionada')
      return
    }

    setIsLoading(true)
    try {
      // Construir datos para guardar
      const { datosEstrategia, datosUsuario: datosUsuarioBD } = construirDatosYam40ParaGuardar({
        pensionActual,
        mesesConSDI,
        fechaInicioM40,
        fechaFinM40,
        modoEntradaPagos,
        paymentMethod,
        paymentValue,
        mesesManuales,
        datosUsuario
      })

      // Generar código de estrategia
      const strategyCode = generarCodigoEstrategia('yam40', {
        mesesPagados: mesesConSDI.length,
        fechaInicioM40: datosEstrategia.fechaInicioM40,
        fechaFinM40: datosEstrategia.fechaFinM40
      })

      // Verificar si tiene familiar creado, si no, crearlo
      let familyMemberId: string | null = null
      
      try {
        const familyResponse = await fetch('/api/family')
        if (familyResponse.ok) {
          const familyData = await familyResponse.json()
          if (familyData.length > 0) {
            familyMemberId = familyData[0].id
          } else {
            // Crear familiar automáticamente
            const createFamilyResponse = await fetch('/api/family', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: datosUsuario.name,
                birthDate: datosUsuario.birthDate.toISOString().split('T')[0],
                weeksContributed: datosUsuario.totalWeeksContributed,
                lastGrossSalary: datosUsuario.sdiHistorico * 30.4,
                civilStatus: datosUsuario.civilStatus
              })
            })
            
            if (createFamilyResponse.ok) {
              const newFamily = await createFamilyResponse.json()
              familyMemberId = newFamily.id
            }
          }
        }
      } catch (error) {
        console.warn('Error al verificar/crear familiar:', error)
      }

      // Si es premium, guardar directamente
      if (isPremium) {
        const response = await fetch('/api/guardar-estrategia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            debugCode: strategyCode,
            datosEstrategia,
            datosUsuario: datosUsuarioBD,
            familyMemberId
          }),
        })

        if (response.ok || response.status === 409) {
          toast.success('¡Estrategia guardada exitosamente!')
          onClose()
          router.push(`/yam40-estrategia/${strategyCode}`)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al guardar la estrategia')
        }
        return
      }

      // Si NO es premium, usar MercadoPago
      // Guardar progreso ANTES de redirigir a MercadoPago
      const orderData = {
        planType: 'premium' as const, // Comprar premium que incluye la estrategia
        strategyData: {
          ...datosEstrategia,
          strategyCode,
          familyMemberId,
          tipo: 'yam40'
        },
        userData: {
          ...datosUsuarioBD,
          familyMemberId
        },
        amount: 200
      }

      const success = await processPurchase(orderData)
      
      if (success) {
        // El usuario será redirigido a MercadoPago
        // El webhook procesará el pago y generará la estrategia
        onClose()
      } else {
        throw new Error('Error al procesar el pago')
      }
    } catch (error: any) {
      console.error('Error al confirmar la compra:', error)
      toast.error(error?.message || 'Error al procesar la compra')
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular aportación total
  const calcularAportacionTotal = () => {
    if (mesesConSDI.length === 0) return 0
    let total = 0
    mesesConSDI.forEach(mes => {
      const sdiMensual = mes.sdi * 30.4
      const { getTasaM40 } = require('@/lib/all/constants')
      const tasa = getTasaM40(mes.año)
      const aportacionMensual = sdiMensual * tasa
      total += aportacionMensual
    })
    return total
  }

  const aportacionTotal = calcularAportacionTotal()
  const aportacionPromedio = mesesConSDI.length > 0 ? aportacionTotal / mesesConSDI.length : 0

  // Calcular edad actual
  const calcularEdad = () => {
    if (!datosUsuario.birthDate) return 0
    const hoy = new Date()
    const fechaNac = datosUsuario.birthDate instanceof Date 
      ? datosUsuario.birthDate 
      : new Date(datosUsuario.birthDate)
    let edad = hoy.getFullYear() - fechaNac.getFullYear()
    const monthDiff = hoy.getMonth() - fechaNac.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--
    }
    return edad
  }

  const edadActual = calcularEdad()

  // Formatear fecha
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  const fechaInicioStr = `${monthNames[fechaInicioM40.mes - 1]} ${fechaInicioM40.año}`
  const fechaFinStr = `${monthNames[fechaFinM40.mes - 1]} ${fechaFinM40.año}`

  // Determinar tipo de estrategia
  const determinarEstrategia = () => {
    if (modoEntradaPagos === 'rango' && paymentMethod === 'uma') {
      return 'Estrategia Progresiva (UMA Fijo)'
    }
    return 'Estrategia Fija (Aportación Fija)'
  }

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
                      {determinarEstrategia()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Modalidad 40</div>
                  </div>

                  {/* Meses Pagados */}
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                    <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1 sm:mb-2">Meses Pagados</div>
                    <div className="text-lg sm:text-2xl font-bold text-blue-700">{mesesConSDI.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">En Modalidad 40</div>
                  </div>

                  {/* Período */}
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                    <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1 sm:mb-2">Período de Pagos</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">
                      {fechaInicioStr} - {fechaFinStr}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Inicio y fin</div>
                  </div>

                  {/* ROI */}
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-100">
                    <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1 sm:mb-2">Retorno de Inversión</div>
                    <div className="text-lg sm:text-2xl font-bold text-green-600">{(pensionActual.ROI || 0).toFixed(1)}%</div>
                    <div className="text-xs sm:text-sm text-gray-600">Rendimiento esperado</div>
                  </div>
                </div>

                {/* Información Financiera Destacada */}
                <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-200 text-center">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1">Pensión Mensual</div>
                    <div className="text-lg sm:text-2xl font-bold text-green-700">{formatCurrency(pensionActual.pensionMensual || 0)}</div>
                    <div className="text-xs text-green-600">Al jubilarse</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200 text-center">
                    <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Aportación Promedio</div>
                    <div className="text-lg sm:text-2xl font-bold text-blue-700">{formatCurrency(aportacionPromedio)}</div>
                    <div className="text-xs text-blue-600">Mensual</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-orange-200 text-center">
                    <div className="text-xs sm:text-sm text-orange-600 font-medium mb-1">Aportación Total</div>
                    <div className="text-2xl font-bold text-orange-700">{formatCurrency(aportacionTotal)}</div>
                    <div className="text-xs text-orange-600">Total pagado</div>
                  </div>
                </div>
              </div>

              {/* Información del Usuario */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  Datos del Usuario
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-100">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1 sm:mb-2">Nombre</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{datosUsuario.name}</div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-100">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1 sm:mb-2">Edad Actual</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{edadActual} años</div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-100">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1 sm:mb-2">Semanas Cotizadas</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{datosUsuario.totalWeeksContributed}</div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-100">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1 sm:mb-2">Edad Jubilación</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">{datosUsuario.retirementAge} años</div>
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
                    <div className="text-sm sm:text-lg font-bold text-gray-900 capitalize">{datosUsuario.civilStatus}</div>
                  </div>
                  
                  <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-purple-100">
                    <div className="text-xs sm:text-sm text-purple-600 font-medium mb-1 sm:mb-2">Modo de Entrada</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900">
                      {modoEntradaPagos === 'rango' ? 'Rango de Fechas' : 'Meses Manuales'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje según elegibilidad */}
              {!puedeMejorar && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Info className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-orange-900 text-sm sm:text-base mb-2">Información Importante</h4>
                      <p className="text-xs sm:text-sm text-orange-800 mb-2">
                        Tu estrategia ya no es elegible para mejoras (más de 12 meses sin pagar). Estás comprando un resumen completo de tu estrategia actual con todos los detalles y análisis.
                      </p>
                      <div className="bg-white rounded-lg p-3 mt-3">
                        <p className="text-xs sm:text-sm text-orange-700 font-semibold mb-1">Lo que incluye:</p>
                        <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
                          <li>Resumen completo de tu estrategia actual</li>
                          <li>Análisis detallado de pagos realizados</li>
                          <li>Cronograma visual de tu historial</li>
                          <li>Proyección de pensión</li>
                          <li>Guía de trámites</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {puedeMejorar && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-green-900 text-sm sm:text-base mb-2">¡Tu estrategia es elegible para mejorar!</h4>
                      <p className="text-xs sm:text-sm text-green-800 mb-2">
                        Con tu estrategia detallada podrás generar diferentes combinaciones y ver cómo puedes optimizar tu pensión. Accede a más de 2000 estrategias diferentes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información de compra */}
              {!isPremium && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold text-purple-900 text-sm sm:text-base mb-2">Información de Compra</h4>
                      <div className="space-y-2">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-lg sm:text-xl font-bold text-purple-700 mb-1">
                            Precio: $200 MXN
                          </p>
                          <div className="space-y-1 text-xs sm:text-sm text-purple-800">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Premium de por vida</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Acceso a más de 2000 estrategias diferentes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Estrategia detallada completa con análisis, cronograma y proyección</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advertencia sobre edad de jubilación */}
              <div className="bg-red-50 border-2 border-red-300 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-900 text-sm sm:text-base mb-2">Advertencia Importante</h4>
                    <p className="text-xs sm:text-sm text-red-800 mb-3">
                      La edad de jubilación objetivo ({datosUsuario.retirementAge} años) ya no se puede modificar para esta estrategia después de la compra.
                    </p>
                    <div className="bg-white rounded-lg p-3">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmRetirementAge}
                          onChange={(e) => setConfirmRetirementAge(e.target.checked)}
                          className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                        />
                        <span className="text-xs sm:text-sm text-red-700">
                          Confirmo que estoy seguro con la edad objetivo de {datosUsuario.retirementAge} años seleccionada actualmente.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advertencia general */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-xs sm:text-sm">⚠️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-800 text-xs sm:text-sm mb-1 sm:mb-2">Información Adicional</h4>
                    <div className="text-xs text-yellow-700 space-y-1">
                      <p>• Esta estrategia será guardada en tu cuenta y podrás acceder a ella desde "Mis Estrategias"</p>
                      <p>• Los cálculos están basados en la LEY 73 del IMSS y son precisos para tu perfil</p>
                      <p>• Una vez confirmada la compra, podrás ver todos los detalles y descargar el PDF</p>
                      {!isPremium && (
                        <p>• Si el pago no se completa, tu progreso se guardará como pendiente en tu dashboard</p>
                      )}
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
                    disabled={isLoading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={isLoading || mercadoPagoLoading || !confirmRetirementAge}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      {isLoading || mercadoPagoLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                      <span>
                        {isLoading || mercadoPagoLoading 
                          ? 'Procesando...' 
                          : isPremium 
                            ? 'Confirmar Compra (Gratis)' 
                            : 'Confirmar Compra - $200 MXN'}
                      </span>
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

