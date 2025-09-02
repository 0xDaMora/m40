import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Star, TrendingUp, Calendar, DollarSign, Target, Users, Shield, CheckCircle, ArrowRight, Info } from "lucide-react"
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
import { ajustarPensionConPMG } from "@/lib/config/pensionMinima"

interface ComparativoEstrategiasProps {
  data: any
  onReinicio: () => void
  datosUsuario: any
}

export default function ComparativoEstrategias({ data, onReinicio, datosUsuario }: ComparativoEstrategiasProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { currency: formatCurrency, percentage: formatPercentage } = useFormatters()
  const { procesarEstrategia, actualizarPlanUsuario, loading, isAuthenticated, isPremium } = useStrategy()
  
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

  const estrategias = (data?.estrategias || data?.escenarios || []).map((estrategia: any) => ({
    ...estrategia,
    pensionMensual: ajustarPensionConPMG(estrategia.pensionMensual)
  })).sort((a: any, b: any) => {
    // Ordenar por pensión mensual de mayor a menor
    return b.pensionMensual - a.pensionMensual
  })

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
    } else if (session.user?.subscription === 'premium') {
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
        // Flujo Premium: solo cambiar estatus del usuario
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
          // Recargar la página para actualizar el session
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } else {
          throw new Error('Error al actualizar el plan')
        }
        return
      }

      // Verificar sesión antes de crear familiar
      if (!session?.user?.id) {
        toast.error('Inicia sesión para guardar tu familiar')
        setShowQuickRegistration(true)
        return
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
        toast.success('¡Estrategia guardada exitosamente!')
        const url = `/estrategia/${strategyCode}`
        router.push(url)
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
    // Después de hacer clic en "Comprar" en DetallesPlan, mostrar el modal de confirmación
    setShowConfirmationModal(true)
    setConfirmationStrategy(estrategiaSeleccionada)
    setIsPremiumConfirmation(false)
    setModalAbierto(null)
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



  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
                     <h2 className="text-3xl font-bold text-gray-900 mb-3">
             🎯 Tus 5 Mejores Estrategias
           </h2>
           <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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

      {/* Estrategias con diseño mejorado */}
      <div className="grid gap-6">
        {estrategias.slice(0, 5).map((estrategia: any, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
          >
                         {/* Badge de ranking */}
             <div className="absolute top-4 left-4">
               <TooltipInteligente termino="Ranking de Estrategia">
                 <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold cursor-help">
                   #{index + 1} Mejor
                 </div>
               </TooltipInteligente>
             </div>

            {/* Header de la estrategia */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Estrategia {estrategia.estrategia === 'progresivo' ? 'Progresiva' : 'Fija'}
                    <TooltipInteligente termino={estrategia.estrategia === 'progresivo' ? 'Estrategia Progresiva' : 'Estrategia Fija'}>
                      <span className="text-blue-600">ℹ️</span>
                    </TooltipInteligente>
                  </h3>
                                     <p className="text-gray-600">
                     <Calendar className="w-4 h-4 inline mr-1" />
                     {estrategia.mesesM40} meses • {datosUsuario.edad || 65} años
                   </p>
                </div>
              </div>
              
                             <div className="text-right">
                                   <div className="text-3xl font-bold text-green-600 mb-1">
                    {formatCurrency(estrategia.pensionMensual)}
                  </div>
                 <TooltipInteligente termino="Pensión Mensual">
                   <div className="text-sm text-gray-500 bg-green-50 px-2 py-1 rounded-full cursor-help">
                     pensión mensual
                   </div>
                 </TooltipInteligente>
               </div>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-xl relative group">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {formatCurrency(estrategia.inversionTotal)}
                </div>
                <div className="text-xs text-gray-600 font-medium flex items-center justify-center gap-1">
                  Inversión total
                  <TooltipInteligente termino="Inversión Total">
                    <span>ℹ️</span>
                  </TooltipInteligente>
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl relative group">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {formatPercentage(estrategia.ROI)}
                </div>
                <div className="text-xs text-gray-600 font-medium flex items-center justify-center gap-1">
                  ROI
                  <TooltipInteligente termino="ROI">
                    <span>ℹ️</span>
                  </TooltipInteligente>
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl relative group">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {estrategia.umaElegida} UMA
                </div>
                <div className="text-xs text-gray-600 font-medium flex items-center justify-center gap-1">
                  Nivel UMA
                  <TooltipInteligente termino="UMA">
                    <span>ℹ️</span>
                  </TooltipInteligente>
                </div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-xl relative group">
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {  formatCurrency(Math.round(estrategia.inversionTotal / estrategia.mesesM40))}
                </div>
                <div className="text-xs text-gray-600 font-medium flex items-center justify-center gap-1">
                  Promedio mensual
                  <TooltipInteligente termino="Aportación Mensual Promedio">
                    <span>ℹ️</span>
                  </TooltipInteligente>
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl relative group">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {estrategia.mesesM40}
                </div>
                <div className="text-xs text-gray-600 font-medium flex items-center justify-center gap-1">
                  Duración (meses)
                  <TooltipInteligente termino="Duración">
                    <span>ℹ️</span>
                  </TooltipInteligente>
                </div>
              </div>
            </div>

                         {/* Botones de acción */}
             <div className="flex gap-4">
               {session?.user?.subscription === 'premium' ? (
                 // Usuario Premium - Guardar estrategia directamente
                 <TooltipInteligente termino="Guardar Estrategia">
                   <button
                     onClick={() => handlePurchaseFromHeroOnboard(estrategia)}
                     className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                   >
                     <Target size={18} />
                     Guardar Estrategia
                   </button>
                 </TooltipInteligente>
               ) : (
                 // Usuario no Premium - Comprar estrategia
                 <TooltipInteligente termino="Comprar Estrategia">
                   <button
                     onClick={() => handlePurchaseFromHeroOnboard(estrategia)}
                     className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                   >
                     <DollarSign size={18} />
                     Comprar $50
                   </button>
                 </TooltipInteligente>
               )}
              
              {session?.user?.subscription !== 'premium' && (
                <TooltipInteligente termino="Ver Detalles del Plan">
                  <button
                    onClick={() => {
                      setEstrategiaSeleccionada(estrategia)
                      setModalAbierto('basico')
                    }}
                    className="px-6 py-3 text-blue-600 border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <span className="text-lg">ℹ️</span>
                    ¿Qué incluye?
                  </button>
                </TooltipInteligente>
              )}
            </div>
          </motion.div>
        ))}
      </div>

                     {/* Promoción del Plan Premium - Solo para usuarios no Premium */}
        {session?.user?.subscription !== 'premium' && (
          <motion.div 
            className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-purple-800">¿Quieres ver TODAS tus opciones?</h3>
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-gray-700 mb-4">
              Con el <strong>Plan Premium</strong> accedes a <strong>más de 2,000 estrategias</strong> personalizadas, 
              PDFs ilimitados, y análisis completo de tu situación.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold text-purple-800">2,000+ Estrategias</div>
                <div className="text-sm text-gray-600">Todas las combinaciones posibles</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="text-2xl mb-2">📄</div>
                <div className="font-semibold text-purple-800">PDFs Ilimitados</div>
                <div className="text-sm text-gray-600">Descarga todas las que quieras</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-semibold text-purple-800">Análisis Completo</div>
                <div className="text-sm text-gray-600">Proyección de 20 años</div>
              </div>
            </div>
                        <button
               onClick={() => setShowPremiumModal(true)}
               className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto"
             >
               <TrendingUp size={18} />
               Ver Plan Premium
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
      <DetallesPlan
        isOpen={modalAbierto !== null}
        onClose={() => setModalAbierto(null)}
        planType={modalAbierto || 'basico'}
        estrategiaSeleccionada={estrategiaSeleccionada}
        todasLasEstrategias={estrategias}
        datosUsuario={datosUsuario}
        onPurchase={handleDetallesPlanPurchase}
      />

      <QuickRegistrationModal
        isOpen={showQuickRegistration}
        onClose={() => setShowQuickRegistration(false)}
        onSuccess={handleQuickRegistrationSuccess}
        strategyData={selectedStrategyForPurchase}
        userData={datosUsuario}
      />

                           <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={handleConfirmation}
          strategy={confirmationStrategy}
          userData={datosUsuario}
          isPremium={isPremiumConfirmation || session?.user?.subscription === 'premium'}
          isPremiumStrategy={session?.user?.subscription === 'premium' && !isPremiumConfirmation}
        />

        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />

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
        />
    </div>
  )
}