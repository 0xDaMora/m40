"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { ArrowLeft, CheckCircle, Calculator, Info, CreditCard } from "lucide-react"
import UserProfileCard from "./UserProfileCard"
import SimpleDateSelector from "./simple/SimpleDateSelector"
import PaymentMethodSelector from "./simple/PaymentMethodSelector"
import PaymentModeSelector from "./simple/PaymentModeSelector"
import SimplePensionCard from "./simple/SimplePensionCard"
import ReentryStatusCard from "./simple/ReentryStatusCard"
import { MesManual } from "@/types/yam40"
import { convertirAportacionesManuales } from "@/lib/yam40/convertirAportacionesManuales"
import { YaM40State, MesConSDI } from "@/types/yam40"
import { StrategyResult } from "@/types/strategy"
import { calcularEscenarioYam40Recrear } from "@/lib/yam40/calculatorYam40Recrear"
import { getMaxAportacionPorAño } from "@/lib/all/umaConverter"
import { calcularSDI } from "@/lib/all/utils"
import { getUMA, getTasaM40 } from "@/lib/all/constants"

type Step = 'profile' | 'payments' | 'result'

export default function YaM40FlowSimplified() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('profile')
  
  const [state, setState] = useState<YaM40State>({
    profile: {
      name: '',
      birthDate: null,
      retirementAge: 65,
      totalWeeksContributed: 0,
      civilStatus: 'soltero'
    },
    sdiHistorico: {
      value: 0,
      isDirectSDI: false
    },
    mesesPagados: [],
    mesesConSDI: [],
    modoEntradaPagos: 'rango',
    mesesManuales: []
  })
  
  const [pensionActual, setPensionActual] = useState<StrategyResult | null>(null)
  const [loadingPension, setLoadingPension] = useState(false)
  
  // Fechas de inicio y fin M40
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [fechaInicioM40, setFechaInicioM40] = useState({ mes: currentMonth, año: currentYear })
  const [fechaFinM40, setFechaFinM40] = useState({ mes: currentMonth, año: currentYear })
  
  // Método de pago: aportación fija o UMA fijo
  const [paymentMethod, setPaymentMethod] = useState<'aportacion' | 'uma'>('aportacion')
  const [paymentValue, setPaymentValue] = useState(5000) // Valor en aportación o UMA según método
  
  // Modo de entrada de pagos
  const modoEntradaPagos = state.modoEntradaPagos || 'rango'
  const mesesManuales = state.mesesManuales || []
  
  // Calcular meses pagados desde fechas
  const calcularMesesDesdeFechas = () => {
    // Validar que las fechas sean válidas
    if (!fechaInicioM40 || !fechaFinM40) return 0
    if (fechaInicioM40.año === 0 || fechaFinM40.año === 0) return 0
    if (!fechaInicioM40.mes || !fechaFinM40.mes) return 0
    
    const inicio = fechaInicioM40.año * 12 + fechaInicioM40.mes
    const fin = fechaFinM40.año * 12 + fechaFinM40.mes
    if (fin < inicio) return 0
    return Math.max(0, fin - inicio + 1)
  }
  
  const mesesPagadosCount = modoEntradaPagos === 'rango' ? calcularMesesDesdeFechas() : 0

  // Calcular pensión cuando hay datos suficientes
  useEffect(() => {
    const tieneDatosBasicos = state.profile.birthDate && 
      state.sdiHistorico.value > 0 && 
      state.profile.totalWeeksContributed > 0
    
    if (!tieneDatosBasicos) return

    if (modoEntradaPagos === 'rango') {
      // Modo rango: validar fechas y valor de pago
      // Solo ejecutar si tenemos datos válidos del modo rango
      if (mesesPagadosCount > 0 && paymentValue > 0 && fechaInicioM40.año > 0 && fechaFinM40.año > 0) {
        calcularPensionDesdeDatos()
      }
    } else {
      // Modo manual: validar que haya meses con aportación
      // NO usar datos del modo rango (paymentValue, paymentMethod, fechaInicioM40, fechaFinM40)
      const mesesConAportacion = mesesManuales.filter(m => m.aportacion !== null && m.aportacion > 0)
      if (mesesConAportacion.length > 0) {
        calcularPensionDesdeDatos()
      }
    }
  }, [
    state.profile.birthDate,
    state.sdiHistorico.value,
    state.profile.totalWeeksContributed,
    state.profile.retirementAge,
    state.profile.civilStatus,
    modoEntradaPagos,
    // Solo incluir dependencias del modo rango cuando estamos en modo rango
    ...(modoEntradaPagos === 'rango' ? [mesesPagadosCount, paymentValue, paymentMethod, fechaInicioM40, fechaFinM40] : []),
    // Solo incluir dependencias del modo manual cuando estamos en modo manual
    ...(modoEntradaPagos === 'manual' ? [mesesManuales] : [])
  ])

  const calcularPensionDesdeDatos = async () => {
    setLoadingPension(true)
    try {
      // Validar que tenemos todos los datos necesarios
      if (!state.profile.birthDate) {
        toast.error('Por favor ingresa tu fecha de nacimiento')
        setLoadingPension(false)
        return
      }

      let listaSDI: any[] = []
      let fechaInicioCalculo: { mes: number, año: number }
      let fechaFinCalculo: { mes: number, año: number }

      if (modoEntradaPagos === 'rango') {
        // Modo rango: validar y generar lista SDI como antes
        if (mesesPagadosCount < 1) {
          toast.error('Por favor selecciona al menos un mes de pago')
          setLoadingPension(false)
          return
        }

        // Validar límite 25 UMA para el año inicial
        if (paymentMethod === 'uma' && paymentValue > 25) {
          toast.error(`El número de UMA no puede exceder 25. Máximo permitido: 25 UMA`)
          setLoadingPension(false)
          return
        }

        // Validar aportación máxima para el año inicial
        if (paymentMethod === 'aportacion') {
          const maxAportacion = getMaxAportacionPorAño(fechaInicioM40.año)
          if (paymentValue > maxAportacion) {
            toast.error(`La aportación excede el límite de 25 UMA para ${fechaInicioM40.año}. Máximo permitido: $${maxAportacion.toLocaleString()}`)
            setLoadingPension(false)
            return
          }
        }

        fechaInicioCalculo = fechaInicioM40
        fechaFinCalculo = fechaFinM40

        // Generar lista SDI usando API
        try {
          const listaSDIResponse = await fetch('/api/lista-sdi-yam40', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fechaInicioM40: fechaInicioM40,
              fechaFinM40: fechaFinM40,
              tipoEstrategia: paymentMethod === 'aportacion' ? 'fija' : 'progresiva',
              valorInicial: paymentValue
            })
          })

          if (listaSDIResponse.ok) {
            const listaSDIData = await listaSDIResponse.json()
            listaSDI = listaSDIData.listaSDI || []
          } else {
            const errorData = await listaSDIResponse.json()
            console.error('❌ Error en lista-sdi-yam40:', errorData.error)
            toast.error('Error al generar lista de pagos')
            setLoadingPension(false)
            return
          }
        } catch (error) {
          console.error('❌ Error llamando lista-sdi-yam40:', error)
          toast.error('Error al generar lista de pagos')
          setLoadingPension(false)
          return
        }
      } else {
        // Modo manual: convertir meses manuales a lista SDI
        const mesesConAportacion = mesesManuales.filter(m => m.aportacion !== null && m.aportacion > 0)
        if (mesesConAportacion.length === 0) {
          toast.error('Por favor agrega al menos un mes con aportación')
          setLoadingPension(false)
          return
        }

        const conversionResult = convertirAportacionesManuales(mesesConAportacion)
        
        if (conversionResult.errores.length > 0) {
          toast.error(`Error en algunos meses: ${conversionResult.errores[0].error}`)
          setLoadingPension(false)
          return
        }

        listaSDI = conversionResult.listaSDI

        // Calcular fechas inicio y fin desde meses manuales
        const fechasOrdenadas = mesesConAportacion.sort((a, b) => {
          const fechaA = a.año * 12 + a.mes
          const fechaB = b.año * 12 + b.mes
          return fechaA - fechaB
        })

        fechaInicioCalculo = { mes: fechasOrdenadas[0].mes, año: fechasOrdenadas[0].año }
        fechaFinCalculo = { mes: fechasOrdenadas[fechasOrdenadas.length - 1].mes, año: fechasOrdenadas[fechasOrdenadas.length - 1].año }
      }

      // Parámetros para el calculator
      const paramsParaCalculator = {
        fechaNacimiento: state.profile.birthDate,
        semanasPrevias: state.profile.totalWeeksContributed,
        sdiHistorico: state.sdiHistorico.value, // Salario mensual bruto
        fechaInicioM40: fechaInicioCalculo,
        fechaFinM40: fechaFinCalculo,
        tipoPago: modoEntradaPagos === 'rango' ? paymentMethod : 'aportacion',
        valorInicial: modoEntradaPagos === 'rango' ? paymentValue : (listaSDI.length > 0 ? listaSDI[0].aportacionMensual : 1000), // En modo manual usar primera aportación o valor por defecto
        edadJubilacion: state.profile.retirementAge,
        dependiente: state.profile.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
        listaSDI: listaSDI
      }

      // Calcular pensión usando el nuevo calculator que reconstruye desde datos reales
      const resultado = calcularEscenarioYam40Recrear(paramsParaCalculator)
      
      // 🔍 LOG: Resultado del calculator
      console.log('🟢 ====== YAM40FLOW - RESULTADO DEL CALCULATOR ======')
      console.log('🟢 Resultado completo:', JSON.stringify(resultado, null, 2))
      console.log('🟢 Meses M40:', resultado.mesesM40)
      console.log('🟢 Estrategia:', resultado.estrategia)
      console.log('🟢 UMA elegida:', resultado.umaElegida)
      console.log('🟢 Inversión total:', resultado.inversionTotal)
      console.log('🟢 Pensión mensual:', resultado.pensionMensual)
      console.log('🟢 Pensión con aguinaldo:', resultado.pensionConAguinaldo)
      console.log('🟢 ROI:', resultado.ROI)
      console.log('🟢 Recuperación (meses):', resultado.recuperacionMeses)
      console.log('🟢 Semanas totales:', resultado.semanasTotales)
      console.log('🟢 SDI promedio:', resultado.sdiPromedio)
      console.log('🟢 Porcentaje pensión:', resultado.porcentajePension)
      if (resultado.error) {
        console.error('🟢 ERROR:', resultado.error)
      }

      // Si hay error en el resultado, mostrarlo
      if (resultado.error) {
        toast.error(resultado.error)
        setLoadingPension(false)
        return
      }

      // Generar meses pagados para compatibilidad con el estado (solo para visualización)
      const mesesPagados: MesConSDI[] = []
      
      if (modoEntradaPagos === 'rango') {
        // Modo rango: generar meses desde fechas y valores del modo rango
        let mesActual = fechaInicioM40.mes
        let añoActual = fechaInicioM40.año

        for (let i = 0; i < mesesPagadosCount; i++) {
          let umaParaMes: number
          if (paymentMethod === 'uma') {
            umaParaMes = paymentValue
          } else {
            // Para aportación fija, calcular UMA equivalente del año actual
            const tasaAño = getTasaM40(añoActual)
            const tasaInicial = getTasaM40(fechaInicioM40.año)
            const aportacionAño = paymentValue * (tasaAño / tasaInicial)
            const umaValue = getUMA(añoActual)
            umaParaMes = aportacionAño / (umaValue * tasaAño * 30.4)
          }

          const sdiMensual = calcularSDI(umaParaMes, añoActual)
          const sdiDiario = sdiMensual / 30.4

          mesesPagados.push({
            mes: i + 1,
            año: añoActual,
            sdi: sdiDiario,
            uma: umaParaMes,
            yaPagado: true,
            aportacionMensual: mesActual
          })

          // Avanzar al siguiente mes
          mesActual++
          if (mesActual > 12) {
            mesActual = 1
            añoActual++
          }

          // Si llegamos a la fecha fin, detener
          if (añoActual > fechaFinM40.año || (añoActual === fechaFinM40.año && mesActual > fechaFinM40.mes)) {
            break
          }
        }
      } else {
        // Modo manual: generar meses desde listaSDI
        // El campo 'mes' en MesConSDI es el número de mes en el calendario (1-58)
        // El campo 'aportacionMensual' es el mes del año (1-12)
        listaSDI.forEach((mesSDI, index) => {
          mesesPagados.push({
            mes: index + 1, // Número de mes en el calendario (1-58)
            año: mesSDI.año,
            sdi: mesSDI.sdiDiario,
            uma: mesSDI.uma,
            yaPagado: true,
            aportacionMensual: mesSDI.mes // Mes del año (1-12)
          })
        })
      }

      setState(prev => ({ ...prev, mesesConSDI: mesesPagados }))
      setPensionActual(resultado) // Establecer el resultado para mostrarlo en la UI
    } catch (error: any) {
      console.error('Error calculando pensión:', error)
      toast.error(error?.message || 'Error al calcular la pensión. Verifica los datos ingresados.')
      setPensionActual(null) // Limpiar resultado en caso de error
    } finally {
      setLoadingPension(false)
    }
  }

  const handleProfileChange = (profile: YaM40State['profile']) => {
    setState(prev => ({ ...prev, profile }))
  }

  const handlePaymentChange = (value: number, method: 'aportacion' | 'uma') => {
    setPaymentValue(value)
    setPaymentMethod(method)
  }

  const handleModoEntradaChange = (modo: 'rango' | 'manual') => {
    setState(prev => ({ ...prev, modoEntradaPagos: modo }))
  }

  const handleMesesManualesChange = (meses: MesManual[]) => {
    setState(prev => ({ ...prev, mesesManuales: meses }))
  }
  
  const handleFechaInicioChange = (value: { mes: number; año: number }) => {
    setFechaInicioM40(value)
    // Si fecha fin es anterior a fecha inicio, actualizar fecha fin
    const inicio = value.año * 12 + value.mes
    const fin = fechaFinM40.año * 12 + fechaFinM40.mes
    if (fin < inicio) {
      setFechaFinM40(value)
    }
  }
  
  const handleFechaFinChange = (value: { mes: number; año: number }) => {
    // Validar que fecha fin >= fecha inicio
    const inicio = fechaInicioM40.año * 12 + fechaInicioM40.mes
    const fin = value.año * 12 + value.mes
    if (fin >= inicio) {
      setFechaFinM40(value)
    } else {
      toast.error('La fecha de fin debe ser posterior o igual a la fecha de inicio')
    }
  }

  const canProceedToPayments = () => {
    return !!(
      state.profile.name &&
      state.profile.birthDate &&
      state.profile.totalWeeksContributed > 0 &&
      state.sdiHistorico.value > 0
    )
  }

  const canProceedToResult = () => {
    if (!canProceedToPayments()) {
      console.log('❌ canProceedToResult: canProceedToPayments() falló', {
        name: !!state.profile.name,
        birthDate: !!state.profile.birthDate,
        totalWeeksContributed: state.profile.totalWeeksContributed,
        sdiHistorico: state.sdiHistorico.value
      })
      return false
    }
    
    if (modoEntradaPagos === 'rango') {
      // Validar que las fechas sean válidas y que haya al menos un mes
      const mesesCount = calcularMesesDesdeFechas()
      const isValid = mesesCount > 0 && 
        paymentValue > 0 && 
        fechaInicioM40 && fechaInicioM40.año >= 2020 && 
        fechaFinM40 && fechaFinM40.año >= fechaInicioM40.año
      
      if (!isValid) {
        console.log('❌ canProceedToResult (rango):', {
          mesesCount,
          paymentValue,
          fechaInicioM40,
          fechaFinM40,
          validaciones: {
            mesesCount: mesesCount > 0,
            paymentValue: paymentValue > 0,
            añoInicio: fechaInicioM40?.año >= 2020,
            añoFin: fechaFinM40?.año >= fechaInicioM40?.año
          }
        })
      }
      
      return isValid
    } else {
      // Modo manual: validar que haya meses con aportación
      const mesesConAportacion = mesesManuales.filter(m => m.aportacion !== null && m.aportacion > 0)
      const isValid = mesesConAportacion.length > 0
      
      if (!isValid) {
        console.log('❌ canProceedToResult (manual):', {
          mesesManuales: mesesManuales.length,
          mesesConAportacion: mesesConAportacion.length,
          mesesManualesDetalle: mesesManuales.map(m => ({ mes: m.mes, año: m.año, aportacion: m.aportacion }))
        })
      }
      
      return isValid
    }
  }
  
  // Calcular año promedio para validaciones (solo para modo rango)
  const añoPromedio = modoEntradaPagos === 'rango' 
    ? Math.floor((fechaInicioM40.año + fechaFinM40.año) / 2)
    : (mesesManuales.length > 0 
        ? Math.floor(mesesManuales.reduce((sum, m) => sum + m.año, 0) / mesesManuales.length)
        : new Date().getFullYear())
  const maxAportacion = getMaxAportacionPorAño(añoPromedio)


  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al inicio</span>
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Ya estoy en Modalidad 40
        </h1>
        <p className="text-gray-600">
          Descubre con cuánto te vas a jubilar y cómo puedes mejorarlo
        </p>
      </div>

      {/* Indicador de pasos */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { id: 'profile', label: 'Datos', icon: CheckCircle },
            { id: 'payments', label: 'Pagos', icon: CreditCard },
            { id: 'result', label: 'Resultado', icon: Calculator }
          ].map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            // Un paso está completado si ya pasamos por él (estamos en un paso posterior)
            const stepOrder = ['profile', 'payments', 'result']
            const currentStepIndex = stepOrder.indexOf(currentStep)
            const stepIndex = stepOrder.indexOf(step.id)
            const isCompleted = stepIndex < currentStepIndex

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                    ${isActive 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                    }
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {index < 3 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Contenido según paso */}
      <AnimatePresence mode="wait">
        {currentStep === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <UserProfileCard
              profile={state.profile}
              onProfileChange={handleProfileChange}
            />

            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Tu último salario mensual bruto antes de Modalidad 40
                <div className="group relative inline-block ml-2">
                  <Info className="w-4 h-4 text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                    <p className="font-semibold mb-2">💰 ¿Qué es el salario mensual bruto?</p>
                    <p className="mb-2">Es el salario que recibías mensualmente en tu último trabajo <strong>antes</strong> de iniciar Modalidad 40.</p>
                    <p className="mb-2 font-semibold text-yellow-300">⚠️ IMPORTANTE:</p>
                    <p className="mb-2">Ingresa el salario <strong>bruto</strong> (antes de descuentos), no el neto. Este dato se convertirá automáticamente a SDI diario para calcular tu pensión.</p>
                    <p className="mt-2 text-green-300">💡 Ejemplo: Si ganabas $15,000 pesos mensuales brutos, ingresa 15000</p>
                  </div>
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                <input
                  type="text"
                  value={state.sdiHistorico.value ? state.sdiHistorico.value.toString().replace(/,/g, '') : ''}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[, ]/g, '')
                    const value = parseFloat(cleaned)
                    setState(prev => ({
                      ...prev,
                      sdiHistorico: {
                        value: isNaN(value) ? 0 : value,
                        isDirectSDI: false
                      }
                    }))
                  }}
                  placeholder="Ej: 15000"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              {state.sdiHistorico.value > 0 && (
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  💡 SDI diario calculado: ${((state.sdiHistorico.value / 30.4)).toFixed(2)} (${state.sdiHistorico.value.toLocaleString()} ÷ 30.4)
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (canProceedToPayments()) {
                    setCurrentStep('payments')
                  } else {
                    toast.error('Completa todos los campos para continuar')
                  }
                }}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                Continuar a Pagos →
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Información de tus pagos
              </h3>
              
              <PaymentModeSelector
                modo={modoEntradaPagos}
                onModoChange={handleModoEntradaChange}
                fechaInicioM40={fechaInicioM40}
                fechaFinM40={fechaFinM40}
                onFechaInicioChange={handleFechaInicioChange}
                onFechaFinChange={handleFechaFinChange}
                paymentMethod={paymentMethod}
                paymentValue={paymentValue}
                onPaymentChange={handlePaymentChange}
                mesesManuales={mesesManuales}
                onMesesManualesChange={handleMesesManualesChange}
                currentYear={currentYear}
              />
            </div>
            
            {/* Estado de reingreso */}
            {(modoEntradaPagos === 'rango' ? mesesPagadosCount > 0 : mesesManuales.filter(m => m.aportacion !== null && m.aportacion > 0).length > 0) && (
              <ReentryStatusCard
                mesesPagados={state.mesesConSDI}
                fechaActual={new Date()}
              />
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep('profile')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ← Volver
              </button>
              <button
                onClick={() => {
                  if (canProceedToResult()) {
                    setCurrentStep('result')
                  } else {
                    toast.error('Completa la información de pagos para continuar')
                  }
                }}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                Ver mi pensión →
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <SimplePensionCard
              pensionActual={pensionActual}
              loading={loadingPension}
              mesesPagados={modoEntradaPagos === 'rango' ? mesesPagadosCount : mesesManuales.filter(m => m.aportacion !== null && m.aportacion > 0).length}
              mesesConSDI={state.mesesConSDI}
              fechaInicioM40={modoEntradaPagos === 'rango' ? fechaInicioM40 : (mesesManuales.length > 0 ? (() => {
                const ordenados = [...mesesManuales].sort((a, b) => (a.año * 12 + a.mes) - (b.año * 12 + b.mes))
                return ordenados.length > 0 ? { mes: ordenados[0].mes, año: ordenados[0].año } : fechaInicioM40
              })() : fechaInicioM40)}
              fechaFinM40={modoEntradaPagos === 'rango' ? fechaFinM40 : (mesesManuales.length > 0 ? (() => {
                const ordenados = [...mesesManuales].sort((a, b) => (b.año * 12 + b.mes) - (a.año * 12 + a.mes))
                return ordenados.length > 0 ? { mes: ordenados[0].mes, año: ordenados[0].año } : fechaFinM40
              })() : fechaFinM40)}
              birthDate={state.profile.birthDate}
              retirementAge={state.profile.retirementAge}
              semanasAntesM40={state.profile.totalWeeksContributed}
              sdiHistorico={state.sdiHistorico.value}
              userName={state.profile.name}
              civilStatus={state.profile.civilStatus}
              modoEntradaPagos={modoEntradaPagos}
              paymentMethod={paymentMethod}
              paymentValue={paymentValue}
              mesesManuales={mesesManuales}
              onRetirementAgeChange={(age) => {
                setState(prev => ({
                  ...prev,
                  profile: { ...prev.profile, retirementAge: age }
                }))
              }}
            />

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep('payments')}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                ← Atrás
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
