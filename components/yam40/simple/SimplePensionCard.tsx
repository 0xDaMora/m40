"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, Info, ArrowRight, DollarSign, Gift, Download, FileText, Star, CheckCircle, Crown, Sparkles, AlertTriangle } from "lucide-react"
import { StrategyResult } from "@/types/strategy"
import { useFormatters } from "@/hooks/useFormatters"
import { MesConSDI, MesManual } from "@/types/yam40"
import { getTasaM40 } from "@/lib/all/constants"
import MetaDerechos from "./MetaDerechos"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import QuickRegistrationModal from "@/components/QuickRegistrationModal"
import Yam40StrategyPurchaseModal from "../Yam40StrategyPurchaseModal"
import { calcularLimitantesM40 } from "@/lib/yam40/limitantesM40"
import { construirDatosYam40ParaGuardar } from "@/lib/yam40/construirDatosYam40ParaGuardar"
import { generarCodigoEstrategia } from "@/lib/utils/strategy"

interface SimplePensionCardProps {
  pensionActual: StrategyResult | null
  loading?: boolean
  mesesPagados: number
  mesesConSDI: MesConSDI[]
  fechaInicioM40: { mes: number; año: number }
  fechaFinM40: { mes: number; año: number }
  birthDate: Date | null
  retirementAge: number
  semanasAntesM40: number
  sdiHistorico: number
  userName: string
  civilStatus: 'soltero' | 'casado'
  modoEntradaPagos?: 'rango' | 'manual'
  paymentMethod?: 'aportacion' | 'uma'
  paymentValue?: number
  mesesManuales?: MesManual[]
  onRetirementAgeChange?: (age: number) => void
  onOpenPremiumModal?: () => void
}

export default function SimplePensionCard({
  pensionActual,
  loading = false,
  mesesPagados,
  mesesConSDI,
  fechaInicioM40,
  fechaFinM40,
  birthDate,
  retirementAge,
  semanasAntesM40,
  sdiHistorico,
  userName,
  civilStatus,
  modoEntradaPagos = 'rango',
  paymentMethod,
  paymentValue,
  mesesManuales,
  onRetirementAgeChange,
  onOpenPremiumModal
}: SimplePensionCardProps) {
  const { currency: formatCurrency } = useFormatters()
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedRetirementAge, setSelectedRetirementAge] = useState(retirementAge)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [processingPDF, setProcessingPDF] = useState(false)

  // Calcular elegibilidad para mejorar
  const limitantes = useMemo(() => {
    if (mesesConSDI.length === 0) return null
    return calcularLimitantesM40(mesesConSDI, new Date())
  }, [mesesConSDI])

  const puedeMejorar = limitantes?.puedeReingresar ?? true
  const isPremium = (session?.user as any)?.subscription === 'premium'

  // Calcular si puede preservar derechos (para mensaje contextual)
  const puedePreservarDerechos = useMemo(() => {
    if (!birthDate || mesesPagados === 0) return null
    
    const semanasM40 = Math.floor(mesesPagados * 4.33)
    const semanasTotales = semanasAntesM40 + semanasM40
    const añosConservacion = semanasTotales / 208
    
    const fechaNacimiento = new Date(birthDate)
    const añoJubilacion = fechaNacimiento.getFullYear() + selectedRetirementAge
    const mesJubilacion = fechaNacimiento.getMonth() + 1
    
    const fechaUltimoPago = new Date(fechaFinM40.año, fechaFinM40.mes - 1, 1)
    const fechaObjetivoJubilacion = new Date(añoJubilacion, mesJubilacion - 1, 1)
    
    const diferenciaMeses = (fechaObjetivoJubilacion.getFullYear() - fechaUltimoPago.getFullYear()) * 12 +
                            (fechaObjetivoJubilacion.getMonth() - fechaUltimoPago.getMonth())
    const añosEspera = diferenciaMeses / 12
    
    return añosEspera <= añosConservacion
  }, [birthDate, mesesPagados, semanasAntesM40, selectedRetirementAge, fechaFinM40])

  // Calcular aportación total actual
  const calcularAportacionTotal = () => {
    if (mesesConSDI.length === 0) return 0
    let total = 0
    mesesConSDI.forEach(mes => {
      // Calcular aportación mensual desde SDI diario
      const sdiMensual = mes.sdi * 30.4
      const tasa = getTasaM40(mes.año)
      const aportacionMensual = sdiMensual * tasa
      total += aportacionMensual
    })
    return total
  }

  const aportacionTotal = calcularAportacionTotal()

  // Sincronizar selectedRetirementAge con retirementAge prop cuando cambia externamente
  useEffect(() => {
    if (retirementAge !== selectedRetirementAge) {
      setSelectedRetirementAge(retirementAge)
    }
  }, [retirementAge])

  // Solo llamar al callback cuando el usuario cambia la edad manualmente, no en el efecto inicial
  const handleRetirementAgeChange = (age: number) => {
    setSelectedRetirementAge(age)
    if (onRetirementAgeChange) {
      onRetirementAgeChange(age)
    }
  }

  // Función para manejar descarga de PDF - ahora abre el modal o redirige directamente si es premium
  const handleDownloadPDF = async () => {
    if (!pensionActual || !birthDate || mesesConSDI.length === 0) {
      toast.error('No hay datos suficientes para generar el PDF')
      return
    }

    // Si no está autenticado, mostrar modal de registro
    if (!session) {
      setShowRegistrationModal(true)
      return
    }

    // Si es premium, generar estrategia directamente y redirigir
    if (isPremium) {
      try {
        setProcessingPDF(true)
        
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
          datosUsuario: {
            name: userName,
            birthDate,
            retirementAge: selectedRetirementAge,
            totalWeeksContributed: semanasAntesM40,
            civilStatus,
            sdiHistorico
          }
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
                  name: userName,
                  birthDate: birthDate.toISOString().split('T')[0],
                  weeksContributed: semanasAntesM40,
                  lastGrossSalary: sdiHistorico, // sdiHistorico ya es salario mensual bruto en el flujo de yam40
                  civilStatus: civilStatus
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

        // Guardar la estrategia
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
          // Redirigir a la página de estrategia yam40
          router.push(`/yam40-estrategia/${strategyCode}`)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al guardar la estrategia')
        }
      } catch (error: any) {
        console.error('Error al generar estrategia:', error)
        toast.error(error?.message || 'Error al generar tu estrategia detallada')
      } finally {
        setProcessingPDF(false)
      }
      return
    }

    // Si NO es premium, abrir modal de compra
    setShowPurchaseModal(true)
  }

  // Manejar registro exitoso
  const handleRegistrationSuccess = async (userData: any) => {
    setShowRegistrationModal(false)
    
    // Crear familiar automáticamente después del registro
    try {
      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          birthDate: birthDate?.toISOString().split('T')[0],
          weeksContributed: semanasAntesM40,
          lastGrossSalary: sdiHistorico, // sdiHistorico ya es salario mensual bruto en el flujo de yam40
          civilStatus: civilStatus
        })
      })
    } catch (error) {
      console.warn('Error al crear familiar después del registro:', error)
    }

    // Esperar a que la sesión se actualice después del registro
    // Refrescar la sesión antes de continuar
    try {
      await fetch('/api/auth/session', { 
        cache: 'no-store', 
        credentials: 'include' 
      })
      // Dar tiempo para que NextAuth actualice la sesión
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.warn('Error al refrescar sesión:', error)
    }

    // Abrir directamente el modal de compra en lugar de llamar a handleDownloadPDF
    // porque handleDownloadPDF verifica la sesión y podría volver a abrir el modal de registro
    setTimeout(() => {
      setShowPurchaseModal(true)
    }, 300)
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </motion.div>
    )
  }

  if (!pensionActual || pensionActual.pensionMensual === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center text-white">
          <Info className="w-12 h-12 mx-auto mb-4 opacity-75" />
          <h3 className="text-xl font-bold mb-2">No se pudo calcular tu pensión</h3>
          <p className="text-gray-200">
            {pensionActual?.error || "Completa todos los datos para calcular tu pensión"}
          </p>
        </div>
      </motion.div>
    )
  }

  const pensionMensual = pensionActual.pensionMensual || 0
  // Aguinaldo es exactamente igual a la pensión mensual (sin cálculos adicionales)
  const aguinaldo = pensionMensual

  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 shadow-2xl text-white"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
          Tu pensión proyectada
        </h2>
        
        {/* Mensajes contextuales según elegibilidad */}
        {pensionActual && pensionActual.pensionMensual !== null && (
          <div className="mb-4 space-y-3">
            {/* Mensaje si puede mejorar */}
            {puedeMejorar && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/20 border border-green-400/30 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-200 mb-1">
                      Tu estrategia es elegible para mejorar
                    </p>
                    <p className="text-xs text-green-100">
                      Genera diferentes combinaciones y ve cómo puedes optimizar tu pensión con nuestra estrategia detallada.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mensaje si NO puede mejorar */}
            {!puedeMejorar && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-200 mb-1">
                      Información importante
                    </p>
                    <p className="text-xs text-orange-100">
                      Tu estrategia ya no es elegible para mejoras (más de 12 meses sin pagar). Estás comprando un resumen completo de tu estrategia actual con todos los detalles y análisis.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mensaje sobre preservar derechos */}
            {puedePreservarDerechos === false && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-200 mb-1">
                      Puedes mantener tus derechos de jubilación
                    </p>
                    <p className="text-xs text-blue-100">
                      Puedes mantener tus derechos y jubilarte a la edad deseada si te reincorporas a M40 o continúas. Nuestra estrategia detallada te ayuda a planificar esto.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Botón CTA para obtener estrategia detallada */}
        {pensionActual && pensionActual.pensionMensual !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <motion.button
              onClick={handleDownloadPDF}
              disabled={processingPDF}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full font-bold px-6 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                isPremium 
                  ? 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white'
                  : 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-gray-900'
              }`}
            >
              <div className="relative z-10 flex flex-col items-center gap-2">
                {processingPDF ? (
                  <>
                    <div className={`w-6 h-6 border-[3px] ${isPremium ? 'border-white' : 'border-gray-900'} border-t-transparent rounded-full animate-spin`}></div>
                    <span className="text-lg">Generando tu estrategia detallada...</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {isPremium ? (
                        <>
                          <Crown className="w-6 h-6" />
                          <span className="text-xl">Ver tu Estrategia Detallada</span>
                          <Crown className="w-6 h-6" />
                        </>
                      ) : (
                        <>
                          <Star className="w-6 h-6 fill-current" />
                          <span className="text-xl">Obtén tu Estrategia Detallada Completa</span>
                          <Star className="w-6 h-6 fill-current" />
                        </>
                      )}
                    </div>
                    {!isPremium && (
                      <>
                        <p className="text-sm font-medium text-gray-800">
                          Por solo $200 MXN - Premium de por vida + acceso a más de 2000 estrategias
                        </p>
                        <p className="text-xs font-medium text-gray-700">
                          Con análisis completo, cronograma, proyección 20 años y guía de trámites
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>
              {/* Efecto de brillo animado */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r from-transparent ${isPremium ? 'via-white/20' : 'via-white/20'} to-transparent`}
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              />
            </motion.button>
            
            {/* Lista de beneficios */}
            {!isPremium && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs md:text-sm">
                <div className="flex items-center gap-1.5 text-blue-100">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Premium de por vida</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-100">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>2000+ estrategias</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-100">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Resumen completo</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-100">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Pagos detallados</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-100">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Cronograma visual</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-100">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Proyección 20 años</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Información Principal */}
      <div className="space-y-4 mb-6">
        {/* Pensión Mensual */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-blue-100 text-sm md:text-base">Pensión mensual</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={pensionMensual}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2"
            >
              {formatCurrency(pensionMensual)}
            </motion.div>
          </AnimatePresence>
          <p className="text-blue-100 text-xs md:text-sm">al mes</p>
        </div>

        {/* Grid con Aportación Total y Aguinaldo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-100" />
              <div className="text-xs md:text-sm text-blue-100">Aportación total actual</div>
            </div>
            <div className="text-lg md:text-xl font-bold">{formatCurrency(aportacionTotal)}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-blue-100" />
              <div className="text-xs md:text-sm text-blue-100">Aguinaldo cada diciembre</div>
            </div>
            <div className="text-lg md:text-xl font-bold">{formatCurrency(aguinaldo)}</div>
          </div>
        </div>
      </div>

      {/* Progreso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-blue-100">Progreso en Modalidad 40</span>
          <span className="font-semibold">{mesesPagados} de 58 meses</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(mesesPagados / 58) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-full h-3"
          />
        </div>
      </div>

      {/* Selector de edad de jubilación */}
      {birthDate && (
        <div className="mb-6">
          <label className="block text-sm text-blue-100 mb-3">
            Cambiar edad de jubilación:
          </label>
          <div className="flex flex-wrap gap-2">
            {[60, 61, 62, 63, 64, 65].map(edad => (
              <button
                key={edad}
                onClick={() => handleRetirementAgeChange(edad)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedRetirementAge === edad
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {edad} años
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Componente MetaDerechos - Preservación de Derechos */}
      {birthDate && (
        <MetaDerechos
          birthDate={birthDate}
          retirementAge={selectedRetirementAge}
          semanasAntesM40={semanasAntesM40}
          mesesPagadosM40={mesesPagados}
          fechaFinM40={fechaFinM40}
        />
      )}

      {/* Nota Informativa */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-100 flex-shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-blue-100">
            <p className="font-semibold mb-1">Información importante:</p>
            <p>
              Esta es una proyección basada en lo que ya pagaste. Tu pensión aumentará 5% cada febrero por ley.
              {mesesPagados < 58 && (
                <> Puedes aumentar tu pensión completando los {58 - mesesPagados} meses restantes.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Registro */}
      <QuickRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={handleRegistrationSuccess}
        strategyData={null}
        userData={{
          Nacimiento: birthDate?.toISOString().split('T')[0],
          fechaNacimiento: birthDate?.toISOString().split('T')[0],
          nombre: userName,
          Semanas: semanasAntesM40.toString(),
          semanasPrevias: semanasAntesM40,
          sdi: (sdiHistorico).toString(),
          sdiHistorico: sdiHistorico,
          "Estado Civil": civilStatus === 'casado' ? 'Casado(a)' : 'Soltero(a)',
          estadoCivil: civilStatus,
          edad: birthDate ? Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
          dependiente: civilStatus === 'casado' ? 'conyuge' : 'ninguno'
        }}
      />

      {/* Modal de compra de estrategia */}
      <Yam40StrategyPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        pensionActual={pensionActual}
        mesesConSDI={mesesConSDI}
        fechaInicioM40={fechaInicioM40}
        fechaFinM40={fechaFinM40}
        modoEntradaPagos={modoEntradaPagos || 'rango'}
        paymentMethod={paymentMethod}
        paymentValue={paymentValue}
        mesesManuales={mesesManuales}
        datosUsuario={{
          name: userName,
          birthDate,
          retirementAge: selectedRetirementAge,
          totalWeeksContributed: semanasAntesM40,
          civilStatus,
          sdiHistorico
        }}
        onOpenPremiumModal={onOpenPremiumModal}
      />
    </motion.div>
  )
}
