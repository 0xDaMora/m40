"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { createPortal } from "react-dom"
import { TrendingUp, ArrowRight } from "lucide-react"

// Componentes de integración
import { StrategyFiltersPanel } from "@/components/integration/components/StrategyFilters"
import { UserProfilePanel } from "@/components/integration/components/UserProfilePanel"
import { StrategyList } from "@/components/integration/components/StrategyList"
import { PaginationControls } from "@/components/integration/components/PaginationControls"

// Modales
import QuickRegistrationModal from "../QuickRegistrationModal"
import ConfirmationModal from "../ConfirmationModal"
import PremiumModal from "../PremiumModal"
import StrategyPurchaseModal from "../StrategyPurchaseModal"
import TooltipInteligente from "../TooltipInteligente"

// Hooks
import { useStrategyFiltering } from "@/components/integration/hooks/useStrategyFiltering"
import { usePagination } from "@/components/integration/hooks/usePagination"
import { useFormatters } from "@/hooks/useFormatters"
import { getMaxAportacion } from "@/lib/all/umaConverter"
import { calculateAge } from "@/components/integration/utils/calculations"

// Types
import { StrategyResult, IntegrationFilters, StrategyFilters, FamilyMemberData } from "@/types/strategy"
import { FamilyMember } from "@/types/family"

interface HeroOnboardStrategiesViewProps {
  datosUsuario: {
    edad?: number
    edadJubilacion?: string | number
    fechaNacimiento?: string
    semanasPrevias?: number
    semanasCotizadas?: number
    sdiHistorico?: number
    dependiente?: string
    estadoCivil?: string
    inicioM40?: string
    [key: string]: any // Para otros campos del HeroOnboard
  }
  initialFilters: IntegrationFilters
  onReinicio: () => void
}

export default function HeroOnboardStrategiesView({ 
  datosUsuario, 
  initialFilters,
  onReinicio 
}: HeroOnboardStrategiesViewProps) {
  const { data: session, update } = useSession()
  const router = useRouter()
  const { currency: formatCurrency } = useFormatters()
  const [isMounted, setIsMounted] = useState(false)
  
  // Estados para estrategias
  const [strategies, setStrategies] = useState<StrategyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadTime, setLoadTime] = useState<number | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Estados para filtros
  const [filters, setFilters] = useState<IntegrationFilters>(initialFilters)
  const [strategyFilters, setStrategyFilters] = useState<StrategyFilters>({
    monthsRange: { min: 1, max: 58 },
    sortBy: 'pension',
    sortOrder: 'desc',
    strategyType: 'all',
    umaRange: { min: 1, max: 25 },
    filterMode: 'contribution'
  })
  
  // Estados para modales
  const [showQuickRegistration, setShowQuickRegistration] = useState(false)
  const [selectedStrategyForPurchase, setSelectedStrategyForPurchase] = useState<StrategyResult | null>(null)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [confirmationStrategy, setConfirmationStrategy] = useState<StrategyResult | null>(null)
  const [isPremiumConfirmation, setIsPremiumConfirmation] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showStrategyPurchaseModal, setShowStrategyPurchaseModal] = useState(false)
  const [purchaseFamilyMember, setPurchaseFamilyMember] = useState<FamilyMember | null>(null)
  const [isIndividualPurchase, setIsIndividualPurchase] = useState(false) // Flag para compra individual
  
  // Obtener plan del usuario
  const userPlan = session?.user?.subscription || 'free'
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Construir familyData desde datosUsuario (igual que PremiumUpsellSection)
  const familyData = useMemo<FamilyMemberData | null>(() => {
    if (!datosUsuario.fechaNacimiento) return null

    const birthDate = new Date(datosUsuario.fechaNacimiento)
    const weeksContributed = datosUsuario.semanasPrevias || datosUsuario.semanasCotizadas || 0
    const sdiHistorico = datosUsuario.sdiHistorico || 0
    // Usar salarioBruto directamente si está disponible (del HeroOnboard), sino calcular desde SDI
    const lastGrossSalary = datosUsuario.salarioBruto || (sdiHistorico * 30.4)
    
    // Determinar estado civil
    let civilStatus = 'soltero'
    if (datosUsuario.dependiente === 'conyuge' || datosUsuario.estadoCivil === 'casado') {
      civilStatus = 'casado'
    }

    return {
      id: 'hero-onboard-user',
      name: 'Usuario',
      birthDate,
      weeksContributed,
      lastGrossSalary,
      civilStatus: civilStatus as 'casado' | 'soltero'
    }
  }, [datosUsuario])
  
  // Crear FamilyMember para usar con los hooks (necesario para useStrategyFiltering)
  const familyMemberForHooks = useMemo<FamilyMember | null>(() => {
    if (!familyData) return null
    
    return {
      id: familyData.id,
      userId: 'hero-user',
      name: familyData.name,
      birthDate: familyData.birthDate,
      weeksContributed: familyData.weeksContributed,
      lastGrossSalary: familyData.lastGrossSalary,
      civilStatus: familyData.civilStatus as 'casado' | 'soltero',
      createdAt: new Date()
    }
  }, [familyData])
  
  // Calcular estrategias cuando cambien los filtros (con debounce como FamilySimulatorIntegration)
  useEffect(() => {
    if (!familyData) return

    // Cancelar el timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Crear nuevo timer
    const timer = setTimeout(() => {
      const calculateStrategies = async () => {
        const startTime = performance.now()
        setLoading(true)
        
        try {
          // Configurar filtros optimizados para generar todas las estrategias posibles
          const optimizedFilters = {
            ...filters,
            monthsMode: 'scan' as const // CRÍTICO: generar todas las estrategias posibles
          }
          
          console.log('🔍 DEBUG - Enviando filtros a la API:', optimizedFilters)
          console.log('🔍 DEBUG - FamilyData:', familyData)
          
          const response = await fetch('/api/calculate-strategies', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              familyData,
              filters: optimizedFilters
            }),
          })

          if (response.ok) {
            const data = await response.json()
            const calculatedStrategies = data.strategies || []
            
            console.log('🔍 DEBUG - Estrategias recibidas:', calculatedStrategies.length)
            
            setStrategies(calculatedStrategies)
            
            // Calcular tiempo de carga
            const endTime = performance.now()
            const loadTimeMs = Math.round(endTime - startTime)
            setLoadTime(loadTimeMs)
            
            if (calculatedStrategies.length === 0) {
              toast.error('No se encontraron estrategias válidas con los filtros actuales')
            } else {
              console.log(`✅ Se calcularon ${calculatedStrategies.length} estrategias en ${loadTimeMs}ms`)
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.error('❌ Error en respuesta:', errorData)
            toast.error(errorData.error || 'Error al calcular estrategias')
            setStrategies([])
          }
        } catch (error) {
          console.error('❌ Error al calcular estrategias:', error)
          toast.error('Error inesperado al calcular estrategias')
          setStrategies([])
        } finally {
          setLoading(false)
        }
      }

      calculateStrategies()
    }, 500) // 500ms de debounce

    debounceTimerRef.current = timer

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [familyData, filters])
  
  // Hook para filtrado de estrategias
  const { useFilteredStrategies } = useStrategyFiltering()
  const filteredStrategies = useFilteredStrategies(strategies, strategyFilters, familyMemberForHooks)
  
  // Hook para paginación
  const {
    displayedStrategies,
    currentPage,
    hasMoreStrategies,
    strategiesPerPage,
    loadMoreStrategies,
    remainingStrategies,
    totalStrategies
  } = usePagination({ strategies: filteredStrategies })
  
  // Máxima aportación para filtros
  const currentYear = new Date().getFullYear()
  const maxAportacion = getMaxAportacion(currentYear)
  
  // Funciones de compra/registro (copiadas de ComparativoEstrategias.tsx)
  const handlePurchaseFromHeroOnboard = async (strategy: StrategyResult) => {
    console.log('🔍 Estrategia seleccionada para compra:', strategy)
    
    if (!session) {
      // Usuario no logueado - mostrar modal de registro rápido
      setSelectedStrategyForPurchase(strategy)
      setShowQuickRegistration(true)
    } else if ((session.user as any)?.subscription === 'premium') {
      // Usuario Premium - mostrar modal de confirmación para guardar familiar
      setShowConfirmationModal(true)
      setConfirmationStrategy(strategy)
      setIsPremiumConfirmation(false)
    } else {
      // Usuario logueado pero no Premium - verificar si puede guardar gratis
      const hasUsedFree = (session.user as any)?.hasUsedFreeStrategy
      if (hasUsedFree) {
        // Ya usó su estrategia gratis, pedir nombre del familiar antes de mostrar modal de compra individual (50 MXN)
        setSelectedStrategyForPurchase(strategy)
        setConfirmationStrategy(strategy)
        setIsIndividualPurchase(true) // Marcar que es compra individual
        setIsPremiumConfirmation(false)
        setShowConfirmationModal(true) // Mostrar modal para pedir nombre del familiar
      } else {
        // Aún no ha usado su estrategia gratis, permitir guardar gratis
        setShowConfirmationModal(true)
        setConfirmationStrategy(strategy)
        setIsPremiumConfirmation(false)
        setIsIndividualPurchase(false)
      }
    }
  }
  
  // Crear familiar antes de abrir modal de compra individual
  const createFamilyMemberForPurchase = async (strategy: StrategyResult, familyMemberName: string) => {
    try {
      // Determinar estado civil
      const civilStatusValue = (datosUsuario.estadoCivil === 'casado' || datosUsuario.dependiente === 'conyuge') ? 'casado' : 'soltero'
      
      // Crear familiar en la base de datos
      const crearFamiliarResponse = await fetch('/api/family', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: familyMemberName,
          birthDate: datosUsuario.fechaNacimiento || new Date().toISOString().split('T')[0],
          weeksContributed: datosUsuario.semanasPrevias || datosUsuario.semanasCotizadas || 0,
          lastGrossSalary: datosUsuario.sdiHistorico ? datosUsuario.sdiHistorico * 30.4 : 0,
          civilStatus: civilStatusValue
        }),
      })
      
      if (crearFamiliarResponse.ok) {
        const familiarCreado = await crearFamiliarResponse.json()
        const familyMemberId = familiarCreado.id
        
        // Convertir el familiar creado a FamilyMember
        const familyMember: FamilyMember = {
          id: familyMemberId,
          userId: session?.user?.id || '',
          name: familyMemberName,
          birthDate: new Date(datosUsuario.fechaNacimiento || new Date()),
          weeksContributed: datosUsuario.semanasPrevias || datosUsuario.semanasCotizadas || 0,
          lastGrossSalary: datosUsuario.sdiHistorico ? datosUsuario.sdiHistorico * 30.4 : 0,
          civilStatus: civilStatusValue,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        // Guardar el familiar y abrir modal de compra
        setPurchaseFamilyMember(familyMember)
        setSelectedStrategyForPurchase(strategy)
        setShowStrategyPurchaseModal(true)
        setShowConfirmationModal(false) // Cerrar modal de confirmación
        setIsIndividualPurchase(false) // Resetear flag
      } else {
        // Error al crear familiar
        toast.error('Error al crear el familiar. Por favor, intenta de nuevo.')
        console.error('Error al crear familiar:', crearFamiliarResponse.status, crearFamiliarResponse.statusText)
      }
    } catch (error) {
      console.error('Error al crear familiar para compra:', error)
      toast.error('Error al procesar la compra')
    }
  }
  
  // Handler para confirmar compra individual desde StrategyPurchaseModal
  const handleConfirmIndividualPurchase = async (strategy: StrategyResult, familyMember: FamilyMember) => {
    // Esta función se llamará desde StrategyPurchaseModal cuando se confirme la compra
    // El modal manejará toda la lógica de MercadoPago
    // Solo necesitamos cerrar el modal cuando termine
    console.log('Compra individual confirmada:', strategy, familyMember)
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

      // Si es compra individual (usuario ya usó su estrategia gratis), crear familiar y abrir modal de compra
      if (isIndividualPurchase && confirmationStrategy) {
        await createFamilyMemberForPurchase(confirmationStrategy, familyMemberName)
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
          lastGrossSalary: datosUsuario.sdiHistorico ? datosUsuario.sdiHistorico * 30.4 : 0,
          civilStatus: civilStatusValue
        }),
      })

      if (crearFamiliarResponse.status === 401) {
        // refrescar sesión y reintentar una vez
        await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' })
        await new Promise(r => setTimeout(r, 300))
        const retryResponse = await fetch('/api/family', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: familyMemberName,
            birthDate: datosUsuario.fechaNacimiento || new Date().toISOString().split('T')[0],
            weeksContributed: datosUsuario.semanasPrevias,
            lastGrossSalary: datosUsuario.sdiHistorico ? datosUsuario.sdiHistorico * 30.4 : 0,
            civilStatus: civilStatusValue
          }),
        })
        
        if (!retryResponse.ok) {
          throw new Error('Error al crear el familiar')
        }
        
        const familiarCreado = await retryResponse.json()
        const familyMemberId = familiarCreado.id
        await processStrategySave(familyMemberId, familyMemberName, civilStatusValue)
      } else if (!crearFamiliarResponse.ok) {
        throw new Error('Error al crear el familiar')
      } else {
        const familiarCreado = await crearFamiliarResponse.json()
        const familyMemberId = familiarCreado.id
        await processStrategySave(familyMemberId, familyMemberName, civilStatusValue)
      }
    } catch (error) {
      console.error('❌ Error general:', error)
      toast.error('Error al procesar la compra')
    }
  }
  
  const processStrategySave = async (familyMemberId: string, familyMemberName: string, civilStatusValue: string) => {
    if (!confirmationStrategy) return
    
    // Crear código de estrategia unificado con ID real del familiar
    const strategyCode = `integration_${familyMemberId}_${confirmationStrategy.estrategia}_${confirmationStrategy.umaElegida}_${confirmationStrategy.mesesM40}_${datosUsuario.edad || 65}`

    console.log('🔍 Sistema Unificado - Datos originales:', confirmationStrategy)
    console.log('🔍 ID Familiar creado:', familyMemberId)

    // Construir datos de estrategia
    const datosEstrategia = {
      mesesM40: confirmationStrategy.mesesM40,
      estrategia: confirmationStrategy.estrategia,
      umaElegida: confirmationStrategy.umaElegida,
      edad: datosUsuario.edad || 65,
      dependiente: datosUsuario.dependiente || 'ninguno',
      sdiHistorico: datosUsuario.sdiHistorico || 0,
      semanasPrevias: datosUsuario.semanasPrevias || 0,
      inicioM40: datosUsuario.inicioM40 || new Date().toISOString().split('T')[0],
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

    // Construir datos completos del usuario
    const datosUsuarioCompletos = {
      inicioM40: datosUsuario.inicioM40 || new Date().toISOString().split('T')[0],
      edad: datosUsuario.edad || 65,
      dependiente: datosUsuario.dependiente || 'ninguno',
      sdiHistorico: datosUsuario.sdiHistorico || 0,
      semanasPrevias: datosUsuario.semanasPrevias || 0,
      nombreFamiliar: familyMemberName,
      edadActual: edadActualCalculada,
      semanasCotizadas: datosUsuario.semanasPrevias || 0,
      sdiActual: datosUsuario.sdiHistorico || 0,
      salarioMensual: Math.round((datosUsuario.sdiHistorico || 0) * 30.4),
      estadoCivil: civilStatusValue,
      fechaNacimiento: datosUsuario.fechaNacimiento,
      edadJubilacion: Number(datosUsuario.edad || 65),
      aportacionPromedio: confirmationStrategy.inversionTotal && confirmationStrategy.mesesM40 
        ? Math.round(confirmationStrategy.inversionTotal / confirmationStrategy.mesesM40) 
        : 0
    }

    console.log('🔍 Datos preparados para API (Sistema Unificado):', { datosEstrategia, datosUsuarioCompletos })

    // Usar la API de guardar-estrategia
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
        familyMemberId: familyMemberId
      }),
    })

    if (response.ok) {
      console.log('✅ Estrategia guardada exitosamente (Sistema Unificado)')
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
      // Error en el servidor, usar fallback con parámetros de URL
      console.error('❌ Error al guardar estrategia:', response.status, response.statusText)
      
      const params = new URLSearchParams({
        edadJubilacion: (datosUsuario.edad || 65).toString(),
        fechaNacimiento: datosUsuario.fechaNacimiento || new Date().toISOString().split('T')[0],
        nombreFamiliar: familyMemberName,
        edadActual: edadActualCalculada?.toString() || (datosUsuario.edad || 65).toString(),
        semanasCotizadas: (datosUsuario.semanasPrevias || 0).toString(),
        sdiActual: (datosUsuario.sdiHistorico || 0).toString(),
        salarioMensual: Math.round((datosUsuario.sdiHistorico || 0) * 30.4).toString(),
        estadoCivil: civilStatusValue,
        aportacionPromedio: confirmationStrategy.inversionTotal && confirmationStrategy.mesesM40 
          ? Math.round(confirmationStrategy.inversionTotal / confirmationStrategy.mesesM40).toString() 
          : '0',
        meses: confirmationStrategy.mesesM40.toString(),
        estrategia: confirmationStrategy.estrategia,
        uma: confirmationStrategy.umaElegida.toString(),
        edad: (datosUsuario.edad || 65).toString(),
        dependiente: datosUsuario.dependiente || 'ninguno',
        sdi: (datosUsuario.sdiHistorico || 0).toString(),
        semanas: (datosUsuario.semanasPrevias || 0).toString(),
        fecha: datosUsuario.inicioM40 || new Date().toISOString().split('T')[0]
      })
      
      const url = `/estrategia/${strategyCode}?${params.toString()}`
      console.log('🔄 Usando fallback con parámetros de URL:', url)
      router.push(url)
    }
  }
  
  const handleMercadoPagoPremiumPurchase = async () => {
    // Implementación de compra Premium con MercadoPago (si es necesario)
    toast.info('Funcionalidad de compra Premium pendiente de implementar')
  }
  
  // Handlers para StrategyRow
  const handleStrategyPurchase = (strategy: StrategyResult) => {
    handlePurchaseFromHeroOnboard(strategy)
  }
  
  const handlePremiumModalOpen = () => {
    setShowPremiumModal(true)
  }
  
  const handleViewDetails = async (strategy: StrategyResult) => {
    // Para usuarios no premium, mostrar modal de premium
    if (!session || (session.user as any)?.subscription !== 'premium') {
      setShowPremiumModal(true)
      return
    }
    
    // Para usuarios premium, permitir ver detalles (similar a FamilySimulatorIntegration)
    handlePurchaseFromHeroOnboard(strategy)
  }
  
  const handleDownloadPDF = (strategy: StrategyResult) => {
    // Implementación de descarga PDF (si es necesario)
    toast.info('Funcionalidad de descarga PDF pendiente de implementar')
  }
  
  // Si no hay datos de usuario, mostrar mensaje
  if (!familyData) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Datos incompletos
          </h3>
          <p className="text-yellow-700 mb-4">
            No se pudieron cargar los datos del usuario. Por favor, intenta de nuevo.
          </p>
          <button
            onClick={onReinicio}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            🎯 Todas tus Estrategias Disponibles
          </h2>
          <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto px-4">
            Explora todas las estrategias personalizadas basadas en tu perfil y optimizadas para maximizar tu pensión con <TooltipInteligente termino="Modalidad 40"><strong>Modalidad 40</strong></TooltipInteligente>
          </p>
          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Calculando estrategias...</span>
            </div>
          )}
          {loadTime && !loading && (
            <div className="mt-2 text-sm text-gray-500">
              ⚡ Calculadas en {loadTime}ms
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Perfil de Usuario */}
      {familyMemberForHooks && (
        <UserProfilePanel
          selectedFamilyMember={familyMemberForHooks}
          filters={filters}
        />
      )}

      {/* Filtros de estrategia */}
      {familyMemberForHooks && (
        <StrategyFiltersPanel
          selectedFamilyMember={familyMemberForHooks}
          filters={filters}
          onFiltersChange={setFilters}
          maxAportacion={maxAportacion}
        />
      )}
      
      {/* Lista de estrategias */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Calculando estrategias...</p>
        </div>
      ) : (
        <>
          {/* Lista de Estrategias con Filtros - Siempre visible para que los filtros estén disponibles */}
          <StrategyList
            strategies={displayedStrategies}
            strategyFilters={strategyFilters}
            onStrategyFiltersChange={setStrategyFilters}
            session={session}
            userPlan={userPlan}
            hasUsedFreeStrategy={(session?.user as any)?.hasUsedFreeStrategy || false}
            onStrategyPurchase={handleStrategyPurchase}
            onPremiumModalOpen={handlePremiumModalOpen}
            onViewDetails={handleViewDetails}
            onDownloadPDF={handleDownloadPDF}
          />
          
          {/* Controles de paginación - Solo mostrar si hay estrategias */}
          {displayedStrategies.length > 0 && (
            <PaginationControls
              displayedCount={displayedStrategies.length}
              totalCount={totalStrategies}
              hasMore={hasMoreStrategies}
              onLoadMore={loadMoreStrategies}
              remainingCount={remainingStrategies}
              strategiesPerPage={strategiesPerPage}
            />
          )}
          
          {/* Mensaje adicional cuando no hay estrategias pero sí hay estrategias totales (filtradas) */}
          {displayedStrategies.length === 0 && totalStrategies > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
              <strong>⚡ Optimización:</strong> Se encontraron {totalStrategies} estrategias en total, pero no coinciden con los filtros actuales. Ajusta los filtros arriba para ver más resultados.
            </div>
          )}
        </>
      )}
      
      {/* Modales */}
      {isMounted && (
        <>
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
              onClose={() => {
                setShowConfirmationModal(false)
                setIsIndividualPurchase(false)
              }}
              onConfirm={handleConfirmation}
              strategy={confirmationStrategy}
              userData={datosUsuario}
              isPremium={isPremiumConfirmation || (session?.user as any)?.subscription === 'premium'}
              isPremiumStrategy={(session?.user as any)?.subscription === 'premium' && !isPremiumConfirmation}
              isIndividualPurchase={isIndividualPurchase}
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
            showStrategyPurchaseModal && selectedStrategyForPurchase && purchaseFamilyMember ? (
              <StrategyPurchaseModal
                isOpen={showStrategyPurchaseModal}
                onClose={() => {
                  setShowStrategyPurchaseModal(false)
                  setSelectedStrategyForPurchase(null)
                  setPurchaseFamilyMember(null)
                }}
                strategy={selectedStrategyForPurchase}
                familyMember={purchaseFamilyMember}
                onConfirmPurchase={handleConfirmIndividualPurchase}
                filters={filters}
                router={router}
                onOpenPremiumModal={() => {
                  setShowStrategyPurchaseModal(false)
                  setShowPremiumModal(true)
                }}
              />
            ) : null,
            document.body
          )}
        </>
      )}
    </div>
  )
}
