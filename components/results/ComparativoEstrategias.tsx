import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Star, TrendingUp, Calendar, DollarSign, Target, Users, Shield, CheckCircle, ArrowRight, Info, Crown } from "lucide-react"
import { toast } from "react-hot-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DetallesPlan from "../DetallesPlan"
import QuickRegistrationModal from "../QuickRegistrationModal"
import ConfirmationModal from "../ConfirmationModal"
import TooltipInteligente from "../TooltipInteligente"
import PremiumModal from "../PremiumModal"
import ToolAccessModal from "../ToolAccessModal"
import { useFormatters } from "@/hooks/useFormatters"
import { useStrategy } from "@/hooks/useStrategy"
import { useMercadoPago } from "@/hooks/useMercadoPago"
import { ajustarPensionConPMG } from "@/lib/config/pensionMinima"
import { createPortal } from "react-dom"
import { useEffect } from "react"

interface ComparativoEstrategiasProps {
  data: any
  onReinicio: () => void
  datosUsuario: any
}

export default function ComparativoEstrategias({ data, onReinicio, datosUsuario }: ComparativoEstrategiasProps) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { currency: formatCurrency, percentage: formatPercentage } = useFormatters()
  const { procesarEstrategia, actualizarPlanUsuario, loading, isAuthenticated, isPremium } = useStrategy()
  const { processPurchase: processMercadoPagoPurchase, loading: mercadoPagoLoading } = useMercadoPago()
  
  // 📋 Sistema de Códigos de Estrategias (UNIFICADO):
  // - integration_[familiarId]_[estrategia]_[uma]_[meses]_[edad] - TODOS los flujos
  //   * FamilySimulator: usa ID real del familiar existente
  //   * HeroOnboard: crea familiar real y usa su ID
  
  const [modalAbierto, setModalAbierto] = useState<'basico' | 'premium' | null>(null)
  const [estrategiaSeleccionada, setEstrategiaSeleccionada] = useState<any>(null)
  const [showQuickRegistration, setShowQuickRegistration] = useState(false)
  const [selectedStrategyForPurchase, setSelectedStrategyForPurchase] = useState<any>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [confirmationStrategy, setConfirmationStrategy] = useState<any>(null)
  const [isPremiumConfirmation, setIsPremiumConfirmation] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showToolAccessModal, setShowToolAccessModal] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const estrategias = (data?.estrategias || data?.escenarios || []).map((estrategia: any) => ({
    ...estrategia,
    pensionMensual: ajustarPensionConPMG(estrategia.pensionMensual)
  })).sort((a: any, b: any) => {
    // Ordenar por pensión mensual de mayor a menor
    return b.pensionMensual - a.pensionMensual
  })

  // Mostrar solo 2 estrategias: la de mayor pensión (índice 0) y la segunda mejor si existe
  // Si solo hay 1 estrategia, mostrar solo esa
  const estrategiasAMostrar = estrategias.length >= 2 
    ? [estrategias[0], estrategias[1]] // Primera (mayor pensión) y segunda mejor
    : estrategias.slice(0, 1)
  
  // Etiquetas para las estrategias
  const etiquetasEstrategias = estrategias.length >= 2
    ? ['Tu Estrategia Recomendada', 'Mayor Pensión Posible']
    : ['Tu Estrategia Recomendada']

  const handlePurchaseFromHeroOnboard = (estrategia: any) => {
    console.log('🔍 Estrategia seleccionada para compra:', estrategia)
    console.log('🔍 Datos clave de la estrategia:', {
      pensionMensual: estrategia.pensionMensual,
      inversionTotal: estrategia.inversionTotal,
      mesesM40: estrategia.mesesM40,
      umaElegida: estrategia.umaElegida,
      ROI: estrategia.ROI,
      progresivo: estrategia.progresivo
    })
    
    if (!session) {
      // Usuario no logueado - mostrar modal de registro rápido
      setSelectedStrategyForPurchase(estrategia)
      setShowQuickRegistration(true)
    } else if ((session.user as any)?.subscription === 'premium') {
      // Usuario Premium - mostrar modal de confirmación para guardar familiar
      setShowConfirmationModal(true)
      setConfirmationStrategy(estrategia)
      setIsPremiumConfirmation(false)
    } else {
      // Usuario logueado pero no Premium - mostrar modal de detalles del plan
      setEstrategiaSeleccionada(estrategia)
      setModalAbierto('basico')
    }
  }

  // Nueva función para manejar compras con MercadoPago
  const handleMercadoPagoPurchase = async (estrategia: any) => {
    if (!(session?.user as any)?.id) {
      toast.error('Debes iniciar sesión para continuar')
      return
    }

    try {
      // Preparar datos para MercadoPago
      const orderData = {
        planType: 'basic' as const,
        strategyData: estrategia,
        userData: datosUsuario,
        amount: 50 // Monto fijo para estrategias básicas
      }

      // Procesar compra con MercadoPago
      const success = await processMercadoPagoPurchase(orderData)
      
      if (success) {
        console.log('✅ Compra iniciada exitosamente con MercadoPago')
        // La redirección a MercadoPago ya se maneja en el hook
      } else {
        console.error('❌ Error al procesar la compra con MercadoPago')
      }
    } catch (error) {
      console.error('❌ Error en handleMercadoPagoPurchase:', error)
      toast.error('Error al procesar la compra')
    }
  }

  const handleQuickRegistrationSuccess = async (userData: any) => {
    // Refrescar sesión antes de continuar
    try {
      await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' })
      await new Promise(r => setTimeout(r, 300))
    } catch {}
    // Después del registro exitoso, mostrar el modal de confirmación
    setShowConfirmationModal(true)
    setConfirmationStrategy(selectedStrategyForPurchase)
  }

  const handleConfirmation = async (familyMemberName: string) => {
    try {
      if (isPremiumConfirmation) {
        // Flujo Premium: usar MercadoPago para la compra
        await handleMercadoPagoPremiumPurchase()
        return
      }

      // Verificar sesión antes de crear familiar
      if (!(session?.user as any)?.id) {
        toast.error('Inicia sesión para guardar tu familiar')
        setShowQuickRegistration(true)
        return
      }

      // Para usuarios NO Premium: verificar si pueden guardar gratis
      if ((session?.user as any)?.subscription !== 'premium') {
        const hasUsedFree = (session?.user as any)?.hasUsedFreeStrategy
        if (hasUsedFree) {
          // Ya usó su estrategia gratis, invitar a Premium
          toast.error('Ya has usado tu estrategia gratis. Actualiza a Premium para guardar más estrategias.')
          setShowPremiumModal(true)
          return
        }
        // Aún no ha usado su estrategia gratis, continuar con el flujo normal (guardar gratis)
      }

      // Derivar estado civil de forma robusta
      const normalize = (s: any) => (s ? s.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') : '')
      const rawEstado = normalize((datosUsuario as any).estadoCivil || (datosUsuario as any).civilStatus || (datosUsuario as any)["Estado Civil"]) 
      const rawDep = normalize((datosUsuario as any).dependiente)
      const civilStatusValue = (rawEstado.includes('casad') || rawDep.includes('cony')) ? 'casado' : 'soltero'

      // 🎯 SISTEMA UNIFICADO: Crear familiar real en la base de datos
      // Primero crear el familiar que estaba elaborando en HeroOnboard
      const crearFamiliarResponse = await fetch('/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: familyMemberName,
          birthDate: datosUsuario.fechaNacimiento || new Date().toISOString().split('T')[0],
          weeksContributed: datosUsuario.semanasPrevias,
          lastGrossSalary: datosUsuario.sdiHistorico * 30.4,
          civilStatus: civilStatusValue
        }),
      })

      if (crearFamiliarResponse.status === 401) {
        // refrescar sesión y reintentar una vez
        await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' })
        await new Promise(r => setTimeout(r, 300))
        const crearFamiliarResponse = await fetch('/api/family', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: familyMemberName,
            birthDate: datosUsuario.fechaNacimiento || new Date().toISOString().split('T')[0],
            weeksContributed: datosUsuario.semanasPrevias,
            lastGrossSalary: datosUsuario.sdiHistorico * 30.4,
            civilStatus: civilStatusValue
          }),
        })
      }

      if (!crearFamiliarResponse.ok) {
        throw new Error('Error al crear el familiar')
      }

      const familiarCreado = await crearFamiliarResponse.json()
      const familyMemberId = familiarCreado.id

      // Crear código de estrategia unificado con ID real del familiar
      const strategyCode = `integration_${familyMemberId}_${confirmationStrategy.estrategia}_${confirmationStrategy.umaElegida}_${confirmationStrategy.mesesM40}_${datosUsuario.edad}`

      console.log('🔍 Sistema Unificado - Datos originales:', confirmationStrategy)
      console.log('🔍 ID Familiar creado:', familyMemberId)

      // Construir datos de estrategia (usar SDI diario bruto ya capturado)
      const datosEstrategia = {
        mesesM40: confirmationStrategy.mesesM40,
        estrategia: confirmationStrategy.estrategia,
        umaElegida: confirmationStrategy.umaElegida,
        edad: datosUsuario.edad,
        dependiente: datosUsuario.dependiente,
        sdiHistorico: datosUsuario.sdiHistorico,
        semanasPrevias: datosUsuario.semanasPrevias,
        inicioM40: datosUsuario.inicioM40 || "2024-02-01",
        // Incluir todos los campos calculados para mantener consistencia
        inversionTotal: confirmationStrategy.inversionTotal,
        pensionMensual: confirmationStrategy.pensionMensual,
        pensionConAguinaldo: confirmationStrategy.pensionConAguinaldo,
        ROI: confirmationStrategy.ROI,
        recuperacionMeses: confirmationStrategy.recuperacionMeses,
        puntaje: confirmationStrategy.puntaje,
        ranking: confirmationStrategy.ranking
      }

      // Calcular edad actual a partir de fecha de nacimiento
      const edadActualCalculada = (() => {
        try {
          if (!datosUsuario.fechaNacimiento) return undefined as unknown as number
          const hoy = new Date()
          const nac = new Date(datosUsuario.fechaNacimiento)
          let edad = hoy.getFullYear() - nac.getFullYear()
          const m = hoy.getMonth() - nac.getMonth()
          if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
          return edad
        } catch {
          return undefined as unknown as number
        }
      })()

      // Construir datos completos del usuario (alineado con FamilySimulatorIntegration)
      const datosUsuarioCompletos = {
        inicioM40: datosUsuario.inicioM40 || "2024-02-01",
        edad: datosUsuario.edad, // edad objetivo de jubilación
        dependiente: datosUsuario.dependiente,
        sdiHistorico: datosUsuario.sdiHistorico,
        semanasPrevias: datosUsuario.semanasPrevias,
        // Información personalizada del familiar
        nombreFamiliar: familyMemberName,
        edadActual: edadActualCalculada,
        semanasCotizadas: datosUsuario.semanasPrevias,
        sdiActual: datosUsuario.sdiHistorico,
        salarioMensual: Math.round(datosUsuario.sdiHistorico * 30.4),
        estadoCivil: civilStatusValue,
        fechaNacimiento: datosUsuario.fechaNacimiento,
        edadJubilacion: Number(datosUsuario.edad),
        aportacionPromedio: Math.round(confirmationStrategy.inversionTotal / confirmationStrategy.mesesM40)
      }

      console.log('🔍 Datos preparados para API (Sistema Unificado):', { datosEstrategia, datosUsuarioCompletos })

      // Usar la API de guardar-estrategia (igual que FamilySimulatorIntegration)
      const response = await fetch('/api/guardar-estrategia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          debugCode: strategyCode,
          datosEstrategia,
          datosUsuario: datosUsuarioCompletos,
          familyMemberId: familyMemberId // Incluir ID del familiar
        }),
      })

      if (response.ok) {
        console.log('✅ Estrategia guardada exitosamente (Sistema Unificado)')
        const responseData = await response.json()
        // Verificar si fue guardada gratis
        const wasFree = !(session?.user as any)?.hasUsedFreeStrategy && (session?.user as any)?.subscription !== 'premium'
        toast.success(wasFree ? '¡Estrategia guardada gratis exitosamente! 🎉' : '¡Estrategia guardada exitosamente!')
        // Refrescar la sesión para actualizar hasUsedFreeStrategy
        if (update) {
          await update()
        }
        const url = `/estrategia/${strategyCode}`
        router.push(url)
      } else if (response.status === 403) {
        // Usuario ya usó su estrategia gratis
        const errorData = await response.json()
        toast.error(errorData.error || 'Ya has usado tu estrategia gratis')
        setShowPremiumModal(true)
        return
      } else if (response.status === 409) {
        // La estrategia ya existe, abrir directamente
        console.log('✅ Estrategia ya existe, abriendo directamente')
        const url = `/estrategia/${strategyCode}`
        router.push(url)
      } else {
        // Error en el servidor, usar fallback con parámetros de URL (igual que FamilySimulatorIntegration)
        console.error('❌ Error al guardar estrategia:', response.status, response.statusText)
        
        // Fallback: construir URL con parámetros (igual que FamilySimulatorIntegration)
        const params = new URLSearchParams({
          edadJubilacion: datosUsuario.edad.toString(),
          fechaNacimiento: datosUsuario.fechaNacimiento || new Date().toISOString().split('T')[0],
          nombreFamiliar: familyMemberName,
          edadActual: datosUsuario.edad.toString(),
          semanasCotizadas: datosUsuario.semanasPrevias.toString(),
          sdiActual: datosUsuario.sdiHistorico.toString(),
          salarioMensual: Math.round(datosUsuario.sdiHistorico * 30.4).toString(),
          estadoCivil: civilStatusValue,
          aportacionPromedio: Math.round(confirmationStrategy.inversionTotal / confirmationStrategy.mesesM40).toString(),
          // Datos básicos de la estrategia
          meses: confirmationStrategy.mesesM40.toString(),
          estrategia: confirmationStrategy.estrategia,
          uma: confirmationStrategy.umaElegida.toString(),
          edad: datosUsuario.edad.toString(),
          dependiente: datosUsuario.dependiente,
          sdi: datosUsuario.sdiHistorico.toString(),
          semanas: datosUsuario.semanasPrevias.toString(),
          fecha: datosUsuario.inicioM40 || "2024-02-01"
        })
        
        const url = `/estrategia/${strategyCode}?${params.toString()}`
        console.log('🔄 Usando fallback con parámetros de URL:', url)
        router.push(url)
      }
    } catch (error) {
      console.error('❌ Error general:', error)
      toast.error('Error al procesar la compra')
      
      // Fallback final: intentar abrir con parámetros básicos
      if (!isPremiumConfirmation) {
        const fallbackFamilyId = `fallback_${Date.now()}`
        const strategyCode = `integration_${fallbackFamilyId}_fallback`
        const url = `/estrategia/${strategyCode}`
        console.log('🔄 Fallback final:', url)
        router.push(url)
      }
    }
  }

  const handleDetallesPlanPurchase = () => {
    // Cerrar el modal de detalles primero
    setModalAbierto(null)
    
    if (estrategiaSeleccionada) {
      if ((session?.user as any)?.id) {
        // Usuario logueado - mostrar modal de confirmación
        setShowConfirmationModal(true)
        setConfirmationStrategy(estrategiaSeleccionada)
        setIsPremiumConfirmation(false)
      } else {
        // Usuario no logueado - usar flujo existente
        handlePurchaseFromHeroOnboard(estrategiaSeleccionada)
      }
    }
  }

  const handlePremiumPurchase = () => {
    // Flujo específico para Premium
    if (!session) {
      // Usuario no logueado - mostrar modal de registro rápido
      setShowQuickRegistration(true)
    } else {
      // Usuario logueado - mostrar modal de confirmación Premium
      setShowConfirmationModal(true)
      setIsPremiumConfirmation(true)
      setConfirmationStrategy(null)
    }
  }

  // Nueva función para manejar compras Premium con MercadoPago
  const handleMercadoPagoPremiumPurchase = async () => {
    if (!(session?.user as any)?.id) {
      toast.error('Debes iniciar sesión para continuar')
      return
    }

    try {
      // Preparar datos para MercadoPago Premium
      const orderData = {
        planType: 'premium' as const,
        strategyData: null, // Premium no tiene estrategia específica
        userData: datosUsuario,
        amount: 200 // Monto fijo para plan Premium (200MXN de por vida)
      }

      // Procesar compra con MercadoPago
      const success = await processMercadoPagoPurchase(orderData)
      
      if (success) {
        console.log('✅ Compra Premium iniciada exitosamente con MercadoPago')
        // La redirección a MercadoPago ya se maneja en el hook
      } else {
        console.error('❌ Error al procesar la compra Premium con MercadoPago')
      }
    } catch (error) {
      console.error('❌ Error en handleMercadoPagoPremiumPurchase:', error)
      toast.error('Error al procesar la compra Premium')
    }
  }




  return (
    <div className="space-y-10 md:space-y-12">
      {/* Header mejorado */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
                     <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-center">
             🎯 Tus Mejores Estrategias
           </h2>
           <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto text-center px-4">
             Basadas en tu perfil y optimizadas para maximizar tu pensión con <TooltipInteligente termino="Modalidad 40"><strong>Modalidad 40</strong></TooltipInteligente>
           </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                         <div className="flex items-center gap-1">
               <CheckCircle className="w-4 h-4 text-green-500" />
               <TooltipInteligente termino="Cálculos Verificados">
                 <span className="cursor-help">Cálculos verificados</span>
               </TooltipInteligente>
             </div>
                         <div className="flex items-center gap-1">
               <Shield className="w-4 h-4 text-blue-500" />
               <TooltipInteligente termino="100% Legal">
                 <span className="cursor-help">100% Legal</span>
               </TooltipInteligente>
             </div>
                         <div className="flex items-center gap-1">
               <TrendingUp className="w-4 h-4 text-purple-500" />
               <TooltipInteligente termino="Estrategias Optimizadas">
                 <span className="cursor-help">Optimizadas</span>
               </TooltipInteligente>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Estrategias con diseño mejorado - Solo 2 estrategias para gente mayor y móvil */}
      <div className="grid gap-6 md:gap-8 px-4">
        {estrategiasAMostrar.map((estrategia: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className="bg-white rounded-2xl border-2 border-gray-200 p-6 md:p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Badge de ranking - Rediseñado sin sobreposición */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-5 py-3 rounded-full text-lg md:text-xl font-bold inline-block">
                {etiquetasEstrategias[index] || `Estrategia ${index + 1}`}
              </div>
            </div>

            {/* Header de la estrategia - Mejorado para móvil y gente mayor */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-10 h-10 md:w-12 md:h-12 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    Estrategia {estrategia.estrategia === 'progresivo' ? 'Progresiva' : 'Fija'}
                    <TooltipInteligente termino={estrategia.estrategia === 'progresivo' ? 'Estrategia Progresiva' : 'Estrategia Fija'}>
                      <span className="text-blue-600 ml-2 text-lg">ℹ️</span>
                    </TooltipInteligente>
                  </h3>
                  <p className="text-base md:text-lg text-gray-700">
                    <Calendar className="w-5 h-5 inline mr-2" />
                    {estrategia.mesesM40} meses • {datosUsuario.edad || 65} años
                  </p>
                </div>
              </div>
              
              <div className="text-left md:text-right w-full md:w-auto">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {formatCurrency(estrategia.pensionMensual)}
                </div>
                <TooltipInteligente termino="Pensión Mensual">
                  <div className="text-base md:text-lg text-gray-700 bg-green-50 px-4 py-2 rounded-full cursor-help inline-block font-medium">
                    pensión mensual
                  </div>
                </TooltipInteligente>
              </div>
            </div>

            {/* Métricas principales - Optimizado para móvil y gente mayor (solo 4 métricas principales) */}
            <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
              <div className="text-center p-5 md:p-6 bg-blue-50 rounded-xl md:rounded-2xl relative group">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-3">
                  {formatCurrency(estrategia.inversionTotal)}
                </div>
                <div className="text-base md:text-lg text-gray-700 font-medium flex items-center justify-center gap-2">
                  Inversión total
                  <TooltipInteligente termino="Inversión Total">
                    <span className="text-blue-500 hover:text-blue-700 transition-colors cursor-help text-lg">ℹ️</span>
                  </TooltipInteligente>
                </div>
              </div>
              <div className="text-center p-5 md:p-6 bg-purple-50 rounded-xl md:rounded-2xl relative group">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-3">
                  {formatPercentage(estrategia.ROI)}
                </div>
                <div className="text-base md:text-lg text-gray-700 font-medium flex items-center justify-center gap-2">
                  ROI
                  <TooltipInteligente termino="ROI">
                    <span className="text-purple-500 hover:text-purple-700 transition-colors cursor-help text-lg">ℹ️</span>
                  </TooltipInteligente>
                </div>
              </div>
              <div className="text-center p-5 md:p-6 bg-orange-50 rounded-xl md:rounded-2xl relative group">
                <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-3">
                  {estrategia.umaElegida} UMA
                </div>
                <div className="text-base md:text-lg text-gray-700 font-medium flex items-center justify-center gap-2">
                  Nivel UMA
                  <TooltipInteligente termino="UMA">
                    <span className="text-orange-500 hover:text-orange-700 transition-colors cursor-help text-lg">ℹ️</span>
                  </TooltipInteligente>
                </div>
              </div>
              <div className="text-center p-5 md:p-6 bg-indigo-50 rounded-xl md:rounded-2xl relative group">
                <div className="text-2xl md:text-3xl font-bold text-indigo-600 mb-3">
                  {formatCurrency(Math.round(estrategia.inversionTotal / estrategia.mesesM40))}
                </div>
                <div className="text-base md:text-lg text-gray-700 font-medium flex items-center justify-center gap-2">
                  Promedio mensual
                  <TooltipInteligente termino="Aportación Mensual Promedio">
                    <span className="text-indigo-500 hover:text-indigo-700 transition-colors cursor-help text-lg">ℹ️</span>
                  </TooltipInteligente>
                </div>
              </div>
            </div>

            {/* Botones de acción - Mejorados para móvil y gente mayor */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
              {!session ? (
                // Usuario no logueado - Invitar a registrarse para obtener estrategia gratis
                <button
                  onClick={() => handlePurchaseFromHeroOnboard(estrategia)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-5 md:py-4 rounded-xl text-lg md:text-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 min-h-[64px]"
                >
                  <Target size={24} />
                  <span>Registrarse y Obtener Gratis</span>
                </button>
              ) : (session?.user as any)?.subscription === 'premium' ? (
                // Usuario Premium - Guardar estrategia directamente
                <button
                  onClick={() => handlePurchaseFromHeroOnboard(estrategia)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-5 md:py-4 rounded-xl text-lg md:text-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 min-h-[64px]"
                >
                  <Target size={24} />
                  <span>Guardar Estrategia</span>
                </button>
              ) : (
                // Usuario logueado pero no premium - Verificar si ya usó su estrategia gratis
                <button
                  onClick={() => {
                    // Verificar si ya usó su estrategia gratis
                    const hasUsedFree = (session?.user as any)?.hasUsedFreeStrategy
                    if (hasUsedFree) {
                      // Ya usó su estrategia gratis, invitar a Premium
                      setShowPremiumModal(true)
                    } else {
                      // Aún no ha usado su estrategia gratis, permitir guardar gratis
                      setShowConfirmationModal(true)
                      setConfirmationStrategy(estrategia)
                      setIsPremiumConfirmation(false)
                    }
                  }}
                  disabled={mercadoPagoLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-5 md:py-4 rounded-xl text-lg md:text-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed min-h-[64px]"
                >
                  {mercadoPagoLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Target size={24} />
                      <span>Obtener Estrategia Gratis</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

                     {/* Promoción del Plan Premium - Solo para usuarios no Premium */}
        {(session?.user as any)?.subscription !== 'premium' && (
          <motion.div 
            className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 md:p-8 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
              <Star className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
              <h3 className="text-xl md:text-2xl font-bold text-purple-800">¿Quieres ver TODAS tus opciones?</h3>
              <Star className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
            </div>
            <p className="text-base md:text-lg text-gray-700 mb-4 md:mb-6 px-4">
              Con el <strong>Plan Premium</strong> accedes a <strong>más de 2,000 estrategias</strong> personalizadas, 
              PDFs ilimitados, y análisis completo de tu situación por solo <strong className="text-purple-600">$200 MXN de por vida</strong>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-white p-4 md:p-5 rounded-lg border-2 border-purple-200">
                <div className="text-3xl md:text-4xl mb-2">📊</div>
                <div className="font-semibold text-purple-800 text-base md:text-lg">2,000+ Estrategias</div>
                <div className="text-sm md:text-base text-gray-600">Todas las combinaciones posibles</div>
              </div>
              <div className="bg-white p-4 md:p-5 rounded-lg border-2 border-purple-200">
                <div className="text-3xl md:text-4xl mb-2">📄</div>
                <div className="font-semibold text-purple-800 text-base md:text-lg">PDFs Ilimitados</div>
                <div className="text-sm md:text-base text-gray-600">Descarga todas las que quieras</div>
              </div>
              <div className="bg-white p-4 md:p-5 rounded-lg border-2 border-purple-200">
                <div className="text-3xl md:text-4xl mb-2">🎯</div>
                <div className="font-semibold text-purple-800 text-base md:text-lg">Análisis Completo</div>
                <div className="text-sm md:text-base text-gray-600">Proyección de 20 años</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 md:p-6 mb-6 border-2 border-purple-200">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">$200 MXN</div>
              <div className="text-base md:text-lg text-gray-700 mb-4">Pago único de por vida</div>
            </div>
                        <button
               onClick={() => setShowPremiumModal(true)}
               className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 md:py-5 rounded-xl text-lg md:text-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-3 mx-auto min-h-[64px] w-full sm:w-auto sm:min-w-[300px]"
             >
               <Crown className="w-6 h-6 md:w-7 md:h-7" />
               <span>Ver Plan Premium</span>
               <ArrowRight className="w-6 h-6 md:w-7 md:h-7" />
             </button>
          </div>
        </motion.div>
        )}

        {/* Incentivo para usar FamilySimulatorIntegration */}
        <motion.div 
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Target className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-blue-800">¿Quieres cálculos más precisos?</h3>
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-700 mb-4">
              Usa nuestra <strong>herramienta avanzada</strong> para elegir cuándo iniciar, 
              cuántos meses estar en M40, o con cuánto específicamente quieres pensionarte.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="text-2xl mb-2">📅</div>
                <div className="font-semibold text-blue-800">Fecha de Inicio</div>
                <div className="text-sm text-gray-600">Elige cuándo comenzar</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-semibold text-blue-800">Pensión Objetivo</div>
                <div className="text-sm text-gray-600">Define tu meta específica</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="font-semibold text-blue-800">Duración Personalizada</div>
                <div className="text-sm text-gray-600">Meses exactos en M40</div>
              </div>
            </div>
                         <button
               onClick={() => setShowToolAccessModal(true)}
               className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto"
             >
               <Target size={18} />
               Acceder a Herramienta Avanzada
             </button>
          </div>
        </motion.div>

       {/* Botón de reinicio mejorado */}
       <motion.div 
         className="text-center pt-8"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 1.0 }}
       >
                  <TooltipInteligente termino="Nueva Simulación">
            <button
              onClick={onReinicio}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium group cursor-help"
            >
              <ArrowRight className="w-4 h-4 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
              Hacer otra simulación
            </button>
          </TooltipInteligente>
         <p className="text-sm text-gray-400 mt-2">
           ¿Quieres probar con diferentes parámetros?
         </p>
       </motion.div>

      {/* Modales */}
      {isMounted && (
        <>
          {createPortal(
            <DetallesPlan
              isOpen={modalAbierto !== null}
              onClose={() => setModalAbierto(null)}
              planType={modalAbierto || 'basico'}
              estrategiaSeleccionada={estrategiaSeleccionada}
              todasLasEstrategias={estrategias}
              datosUsuario={datosUsuario}
              onPurchase={handleDetallesPlanPurchase}
            />,
            document.body
          )}

          {createPortal(
            <QuickRegistrationModal
              isOpen={showQuickRegistration}
              onClose={() => setShowQuickRegistration(false)}
              onSuccess={handleQuickRegistrationSuccess}
              strategyData={selectedStrategyForPurchase}
              userData={datosUsuario}
            />,
            document.body
          )}

          {createPortal(
            <ConfirmationModal
              isOpen={showConfirmationModal}
              onClose={() => setShowConfirmationModal(false)}
              onConfirm={handleConfirmation}
              strategy={confirmationStrategy}
              userData={datosUsuario}
              isPremium={isPremiumConfirmation || (session?.user as any)?.subscription === 'premium'}
              isPremiumStrategy={(session?.user as any)?.subscription === 'premium' && !isPremiumConfirmation}
            />,
            document.body
          )}

          {createPortal(
            <PremiumModal
              isOpen={showPremiumModal}
              onClose={() => setShowPremiumModal(false)}
            />,
            document.body
          )}

          {createPortal(
            <ToolAccessModal
              isOpen={showToolAccessModal}
              onClose={() => setShowToolAccessModal(false)}
              heroOnboardData={{
                name: datosUsuario?.nombre || "Usuario",
                birthDate: datosUsuario?.fechaNacimiento,
                weeksContributed: datosUsuario?.semanasPrevias || 0,
                lastGrossSalary: datosUsuario?.sdiHistorico ? datosUsuario.sdiHistorico * 30.4 : 0,
                civilStatus: datosUsuario?.estadoCivil || 'soltero'
              }}
            />,
            document.body
          )}
        </>
      )}
    </div>
  )
}