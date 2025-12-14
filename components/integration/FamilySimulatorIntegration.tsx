"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { Users, Plus, Filter, Target, Calendar, DollarSign, TrendingUp, Eye, Download, ArrowUp, ArrowDown, Lock } from "lucide-react"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import { useFamilyManagement } from "./hooks/useFamilyManagement"
import { useModalManager } from "./hooks/useModalManager"
import { usePagination } from "./hooks/usePagination"
import { useStrategyCalculation } from "./hooks/useStrategyCalculation"
import { useStrategyFiltering } from "./hooks/useStrategyFiltering"
import { FamilySelector } from "./components/FamilySelector"
import { StrategyFiltersPanel } from "./components/StrategyFilters"
import { UserProfilePanel } from "./components/UserProfilePanel"
import { StrategyCard } from "./components/StrategyCard"
import { StrategyList } from "./components/StrategyList"
import { PaginationControls } from "./components/PaginationControls"
import StrategyPurchaseModal from "@/components/StrategyPurchaseModal"
import PremiumModal from "@/components/PremiumModal"
import { LoginModal } from "@/components/auth/LoginModal"
import { FamilyMember } from "@/types/family"
import { StrategyResult, IntegrationFilters, StrategyFilters } from "@/types/strategy"
import { FamilyMemberForm } from "@/components/family/FamilyMemberForm"
import { RangeSlider } from "@/components/ui/RangeSlider"
import { getMaxAportacion } from "@/lib/all/umaConverter"
import TooltipInteligente from "@/components/TooltipInteligente"
import { useSearchParams, useRouter } from "next/navigation"
import { useFormatters } from "@/hooks/useFormatters"
import { useStrategy } from "@/hooks/useStrategy"
import { calcularSDI, calculateAge } from "./utils/calculations"
import { generarCodigoEstrategia, construirDatosEstrategia, construirDatosUsuario } from "@/lib/utils/strategy"

export function FamilySimulatorIntegration() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Hook para manejo de familiares
  const {
    familyMembers,
    selectedFamilyMember,
    showFamilyForm,
    selectFamilyMember,
    openFamilyForm,
    closeFamilyForm,
    handleFamilyFormSuccess,
    setSelectedFamilyMember
  } = useFamilyManagement()

  // Hook para gestión de modales
  const {
    showStrategyPurchaseModal,
    selectedStrategyForPurchase,
    showPremiumModal,
    openStrategyPurchaseModal,
    closeStrategyPurchaseModal,
    openPremiumModal,
    closePremiumModal
  } = useModalManager()
  
  // Obtener el plan del usuario desde la sesión
  const userPlan = session?.user?.subscription || 'free'
  
  // Debug: mostrar el plan detectado
  console.log('Debug - Session:', session)
  console.log('Debug - User Plan:', userPlan)
  console.log('Debug - User Subscription:', session?.user?.subscription)
  // Hook para cálculo de estrategias
  const {
    strategies,
    loading,
    loadTime,
    calculateStrategies: performCalculateStrategies,
    resetStrategies,
    calcularSDI,
    setStrategies
  } = useStrategyCalculation()

  // Hook para filtrado de estrategias
  const { useFilteredStrategies } = useStrategyFiltering()
  const [filters, setFilters] = useState<IntegrationFilters>({
    familyMemberId: null,
    monthlyContributionRange: {
      min: 1000,
      max: 25000
    },
    months: 24,
    retirementAge: 65,
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear()
  })

  const [strategyFilters, setStrategyFilters] = useState<StrategyFilters>({
    monthsRange: { min: 1, max: 58 },
    sortBy: 'pension',
    sortOrder: 'desc',
    strategyType: 'all',
    umaRange: { min: 1, max: 25 },
    filterMode: 'contribution'
  })

  const currentYear = new Date().getFullYear()
  const maxAportacion = getMaxAportacion(currentYear)

  // El hook useFamilyManagement maneja la carga de familiares automáticamente

  // Procesar parámetros de URL cuando vienen del HeroOnboard
  useEffect(() => {
    const estrategia = searchParams.get('estrategia')
    const uma = searchParams.get('uma')
    const meses = searchParams.get('meses')
    const edad = searchParams.get('edad')
    const dependiente = searchParams.get('dependiente')
    const sdi = searchParams.get('sdi')
    const semanas = searchParams.get('semanas')
    const fecha = searchParams.get('fecha')

    if (estrategia && uma && meses) {
      // Viene del HeroOnboard con estrategia seleccionada
      console.log('🚀 Parámetros detectados del HeroOnboard:', { estrategia, uma, meses, edad, dependiente, sdi, semanas, fecha })
      
      // Configurar filtros con los datos recibidos
      setFilters(prev => ({
        ...prev,
        months: parseInt(meses) || 24,
        retirementAge: parseInt(edad || '65'),
        monthlyContributionRange: {
          min: 1000,
          max: 25000
        }
      }))

      // Configurar filtros de estrategia
      setStrategyFilters(prev => ({
        ...prev,
        monthsRange: { min: parseInt(meses), max: parseInt(meses) },
        umaRange: { min: parseInt(uma), max: parseInt(uma) },
        strategyType: estrategia === 'fijo' ? 'fijo' : 'progresivo'
      }))

      toast.success('¡Estrategia del HeroOnboard configurada!')
    }
  }, [searchParams])

  // Detectar datos de simulación rápida del HeroOnboard
  useEffect(() => {
    const quickData = localStorage.getItem('quickSimulation')
    if (quickData && !selectedFamilyMember) {
      try {
        const parsed = JSON.parse(quickData)
        if (parsed.source === 'heroOnboard') {
          // Crear familiar basado en los datos del HeroOnboard
          const heroFamilyMember: FamilyMember = {
            id: 'hero-simulation',
            userId: 'hero-user',
            name: parsed.familyMember.name,
            birthDate: new Date(parsed.familyMember.birthDate),
            weeksContributed: parsed.familyMember.weeksContributed,
            lastGrossSalary: parsed.familyMember.lastGrossSalary,
            civilStatus: parsed.familyMember.maritalStatus === 'Casado(a)' ? 'casado' : 'soltero',
            createdAt: new Date()
          }
          
          setSelectedFamilyMember(heroFamilyMember)
          
          // Mostrar banner de migración
          toast.success('¡Continuando con tu simulación rápida!', {
            duration: 4000,
            icon: '🚀'
          })
          
          // Limpiar datos del localStorage después de usarlos
          localStorage.removeItem('quickSimulation')
        }
      } catch (error) {
        console.error('Error parsing quick simulation data:', error)
      }
    }
  }, [selectedFamilyMember])

  // Debounce para el cálculo de estrategias
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Calcular estrategias cuando cambien los filtros principales (con debounce)
  useEffect(() => {
    if (selectedFamilyMember) {
      // Cancelar el timer anterior
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      
      // Crear nuevo timer
      const timer = setTimeout(() => {
        calculateStrategies()
      }, 500) // 500ms de delay
      
      setDebounceTimer(timer)
    }
    
    // Cleanup
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [filters, selectedFamilyMember])

  // La lógica de filtrado ahora está en el hook useStrategyFiltering

  // Filtrar estrategias usando el hook de filtrado
  const filteredStrategies = useFilteredStrategies(strategies, strategyFilters, selectedFamilyMember)

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

  // La lógica de paginación ahora está en el hook usePagination

  // Wrapper para el cálculo de estrategias usando el hook
  const calculateStrategies = async () => {
    await performCalculateStrategies(selectedFamilyMember, filters)
  }

  // Importar formatters del hook
  const { currency: formatCurrency } = useFormatters()

  // Ver estrategia detallada
  const viewStrategyDetails = async (strategy: any) => {
    if (!selectedFamilyMember) return



    // Si no está logueado, mostrar modal de login
    if (!session) {
      setShowLoginModal(true)
      return
    }

    // Verificar si el usuario tiene plan premium
    if (!userPlan || userPlan === 'free' || userPlan === 'basic') {
      openPremiumModal()
      return
    }

        // Plan premium - continuar con la lógica original
    // Usar el nuevo código de estrategia que incluye fecha de inicio
    const startMonth = filters.startMonth || new Date().getMonth() + 1
    const startYear = filters.startYear || new Date().getFullYear()
    const fechaInicio = new Date(startYear, startMonth, 1).toISOString().split('T')[0]
    
    const strategyCode = generarCodigoEstrategia('integration', {
      familyMemberId: selectedFamilyMember.id,
      estrategia: strategy.estrategia,
      umaElegida: strategy.umaElegida,
      mesesM40: strategy.mesesM40,
      edadJubilacion: filters.retirementAge,
      inicioM40: fechaInicio
    })
    
    const birthDate = selectedFamilyMember.birthDate instanceof Date 
      ? selectedFamilyMember.birthDate 
      : new Date(selectedFamilyMember.birthDate)
    
    // Construir datos de estrategia con la fecha de inicio específica
    const datosEstrategia = construirDatosEstrategia(strategy, {
      edad: filters.retirementAge,
      dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
      // Pasar SDI diario bruto (salario mensual / 30.4)
      sdiHistorico: selectedFamilyMember.lastGrossSalary / 30.4,
      semanasPrevias: selectedFamilyMember.weeksContributed,
      familyMemberId: selectedFamilyMember.id,
      inicioM40: fechaInicio
    }, fechaInicio)
    
    const datosUsuario = construirDatosUsuario({
      edad: filters.retirementAge,
      dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
      // SDI diario bruto
      sdiHistorico: selectedFamilyMember.lastGrossSalary / 30.4,
      semanasPrevias: selectedFamilyMember.weeksContributed,
      familyMemberId: selectedFamilyMember.id,
      fechaNacimiento: birthDate.toISOString().split('T')[0],
      inicioM40: fechaInicio
    }, strategy, selectedFamilyMember.name)
    

    
    try {


      const response = await fetch('/api/guardar-estrategia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debugCode: strategyCode,
          datosEstrategia,
          datosUsuario,
          familyMemberId: selectedFamilyMember.id
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
        // Error en el servidor, intentar abrir la estrategia con parámetros de URL como fallback
        console.error('Error al guardar estrategia:', response.status, response.statusText)
        const params = new URLSearchParams({
          edadJubilacion: filters.retirementAge.toString(),
          fechaNacimiento: birthDate.toISOString().split('T')[0],
          nombreFamiliar: selectedFamilyMember.name,
          edadActual: calculateAge(selectedFamilyMember.birthDate).toString(),
          semanasCotizadas: selectedFamilyMember.weeksContributed.toString(),
          sdiActual: calcularSDI(selectedFamilyMember.lastGrossSalary).toString(),
          salarioMensual: selectedFamilyMember.lastGrossSalary.toString(),
          estadoCivil: selectedFamilyMember.civilStatus,
          aportacionPromedio: (strategy.inversionTotal ? strategy.inversionTotal / strategy.mesesM40 : 0).toString(),
          // Datos básicos de la estrategia
          meses: strategy.mesesM40.toString(),
          estrategia: strategy.estrategia,
          uma: strategy.umaElegida.toString(),
          edad: filters.retirementAge.toString(),
          dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
          sdi: calcularSDI(selectedFamilyMember.lastGrossSalary).toString(),
          semanas: selectedFamilyMember.weeksContributed.toString(),
          fecha: fechaInicio,
          // Incluir fecha de inicio específica
          fechaInicio: fechaInicio
        })
        const url = `/estrategia/${strategyCode}?${params.toString()}`
        router.push(url)
      }
         } catch (error) {
       console.error('Error al guardar estrategia:', error)
             // En caso de error, intentar abrir la estrategia con parámetros de URL como fallback
      const params = new URLSearchParams({
        edadJubilacion: filters.retirementAge.toString(),
        fechaNacimiento: birthDate.toISOString().split('T')[0],
        nombreFamiliar: selectedFamilyMember.name,
        edadActual: calculateAge(selectedFamilyMember.birthDate).toString(),
        semanasCotizadas: selectedFamilyMember.weeksContributed.toString(),
        sdiActual: calcularSDI(selectedFamilyMember.lastGrossSalary).toString(),
        salarioMensual: selectedFamilyMember.lastGrossSalary.toString(),
        estadoCivil: selectedFamilyMember.civilStatus,
        aportacionPromedio: (strategy.inversionTotal ? strategy.inversionTotal / strategy.mesesM40 : 0).toString(),
        // Datos básicos de la estrategia
        meses: strategy.mesesM40.toString(),
        estrategia: strategy.estrategia,
        uma: strategy.umaElegida.toString(),
        edad: filters.retirementAge.toString(),
        dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
        sdi: calcularSDI(selectedFamilyMember.lastGrossSalary).toString(),
        semanas: selectedFamilyMember.weeksContributed.toString(),
        fecha: fechaInicio,
        // Incluir fecha de inicio específica
        fechaInicio: fechaInicio
      })
       const url = `/estrategia/${strategyCode}?${params.toString()}`
       router.push(url)
    }
  }

  // Descargar PDF de la estrategia
  const downloadStrategyPDF = (strategy: any) => {
    if (!selectedFamilyMember) return
    
    // Usar el nuevo código de estrategia que incluye fecha de inicio
    const startMonth = filters.startMonth || new Date().getMonth() + 1
    const startYear = filters.startYear || new Date().getFullYear()
    const fechaInicio = new Date(startYear, startMonth, 1).toISOString().split('T')[0]
    
    const strategyCode = generarCodigoEstrategia('integration', {
      familyMemberId: selectedFamilyMember.id,
      estrategia: strategy.estrategia,
      umaElegida: strategy.umaElegida,
      mesesM40: strategy.mesesM40,
      edadJubilacion: filters.retirementAge,
      inicioM40: fechaInicio
    })
    
    // Asegurar que birthDate sea una fecha válida
    const birthDate = selectedFamilyMember.birthDate instanceof Date 
      ? selectedFamilyMember.birthDate 
      : new Date(selectedFamilyMember.birthDate)
    
    // La función calcularSDI ahora viene de utils/calculations
    
    // Construir URL con todos los parámetros necesarios
    const params = new URLSearchParams({
      code: strategyCode,
      estrategia: strategy.estrategia,
      uma: strategy.umaElegida.toString(),
      meses: strategy.mesesM40.toString(),
      edad: filters.retirementAge.toString(),
      dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
      sdi: calcularSDI(selectedFamilyMember.lastGrossSalary).toString(),
      semanas: selectedFamilyMember.weeksContributed.toString(),
      fecha: fechaInicio,
      startMonth: startMonth.toString(),
      startYear: startYear.toString(),
      download: 'true', // Parámetro para indicar que queremos descargar PDF
      // Información personalizada
      nombreFamiliar: selectedFamilyMember.name,
      edadActual: calculateAge(selectedFamilyMember.birthDate).toString(),
      edadJubilacion: filters.retirementAge.toString(),
      fechaNacimiento: selectedFamilyMember.birthDate.toISOString().split('T')[0],
      semanasCotizadas: selectedFamilyMember.weeksContributed.toString(),
      sdiActual: calcularSDI(selectedFamilyMember.lastGrossSalary).toString(),
      salarioMensual: selectedFamilyMember.lastGrossSalary.toString(),
      estadoCivil: selectedFamilyMember.civilStatus,
      aportacionPromedio: (strategy.inversionTotal ? strategy.inversionTotal / strategy.mesesM40 : 0).toString(),
      // Incluir fecha de inicio específica
      fechaInicio: fechaInicio
    })
    
    const url = `/estrategia/${strategyCode}?${params.toString()}`
    console.log('Descargando PDF de estrategia:', url) // Debug
    window.open(url, '_blank')
  }


  // Función para confirmar la compra de una estrategia
  const handleConfirmStrategyPurchase = async (strategy: any, familyMember: FamilyMember) => {
    if (!session) {
      toast.error('Debes iniciar sesión para comprar estrategias')
      return
    }

    try {
      // Generar código de estrategia
      const startMonth = filters.startMonth || new Date().getMonth() + 1
      const startYear = filters.startYear || new Date().getFullYear()
      const fechaInicio = new Date(startYear, startMonth, 1).toISOString().split('T')[0]
      
      const strategyCode = generarCodigoEstrategia('integration', {
        familyMemberId: familyMember.id,
        estrategia: strategy.estrategia,
        umaElegida: strategy.umaElegida,
        mesesM40: strategy.mesesM40,
        edadJubilacion: filters.retirementAge,
        inicioM40: fechaInicio
      })

      // Guardar la estrategia
      const response = await fetch('/api/guardar-estrategia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debugCode: strategyCode,
          datosEstrategia: construirDatosEstrategia(strategy, {
            edad: filters.retirementAge,
            dependiente: familyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
            sdiHistorico: familyMember.lastGrossSalary / 30.4,
            semanasPrevias: familyMember.weeksContributed,
            familyMemberId: familyMember.id,
            inicioM40: fechaInicio
          }, fechaInicio),
          datosUsuario: construirDatosUsuario({
            edad: filters.retirementAge,
            dependiente: familyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
            sdiHistorico: familyMember.lastGrossSalary / 30.4,
            semanasPrevias: familyMember.weeksContributed,
            familyMemberId: familyMember.id,
            fechaNacimiento: familyMember.birthDate.toISOString().split('T')[0],
            inicioM40: fechaInicio
          }, strategy, familyMember.name),
          familyMemberId: familyMember.id
        }),
      })

      if (response.ok) {
        toast.success('¡Estrategia comprada y guardada exitosamente!')
        // Redirigir a la estrategia guardada
        router.push(`/estrategia/${strategyCode}`)
      } else {
        toast.error('Error al guardar la estrategia')
      }
    } catch (error) {
      console.error('Error al comprar estrategia:', error)
      toast.error('Error inesperado al comprar la estrategia')
    }
  }

  return (
    <div className="w-full max-w-full sm:max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-3 md:px-4 lg:px-6">
      {/* Banner de migración desde HeroOnboard */}
      {selectedFamilyMember?.id === 'hero-simulation' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6 rounded-xl"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-green-600 text-xl">🚀</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 text-lg mb-1">¡Continuando con tu simulación rápida!</h3>
              <p className="text-green-700">
                Tus datos han sido transferidos automáticamente desde el simulador rápido. 
                Ahora puedes explorar más de <strong>2,000 estrategias personalizadas</strong> con análisis detallado.
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Header Profesional Mejorado */}
       <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-2 sm:p-4 lg:p-6 xl:p-8 text-white shadow-2xl">
                   {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
         
         <div className="relative z-10">
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
             <div className="mb-6 lg:mb-0">
               {/* Título principal con iconos */}
               <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                 <div className="relative self-start sm:self-center">
                   <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-3 sm:p-4 rounded-2xl shadow-lg">
                     <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                   </div>
                   <div className="absolute -top-1 -right-1 bg-green-400 w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse"></div>
                 </div>
                 <div>
                   <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                     Simulador Modalidad 40
                   </h1>
                   <p className="text-blue-100 text-base sm:text-lg lg:text-xl mt-2 font-medium">
                     Herramienta profesional de planificación previsional
                   </p>
                   <div className="flex items-center gap-2 mt-2 sm:mt-3">
                     <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                     <span className="text-xs sm:text-sm text-blue-200">Cálculos en tiempo real</span>
                   </div>
                 </div>
               </div>
               
               {/* Características destacadas */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                 <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                     <div className="font-semibold">Cálculos precisos</div>
                   </div>
                   <div className="text-blue-100">Basados en LEY 73 IMSS</div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                     <div className="font-semibold">Análisis personalizado</div>
                   </div>
                   <div className="text-blue-100">Por familiar y perfil</div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                     <div className="font-semibold">Estrategias optimizadas</div>
                   </div>
                   <div className="text-blue-100">ROI y rentabilidad</div>
                 </div>
               </div>
             </div>
             
             {/* Indicador de plan */}
             {session && (
               <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-white/20 text-center hover:bg-white/20 transition-all duration-300">
                 <div className="text-xs sm:text-sm text-blue-200 mb-2 font-medium">Plan actual</div>
                 <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                   {userPlan === 'premium' ? 'Premium' : userPlan === 'basic' ? 'Básico' : 'Gratuito'}
                 </div>
                 <div className="mt-2 text-xs text-blue-300">
                   {userPlan === 'premium' ? 'Acceso completo' : userPlan === 'basic' ? 'Estrategias limitadas' : 'Solo simulación'}
                 </div>
               </div>
             )}
           </div>
         </div>
         
         {/* Línea decorativa inferior */}
         <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400"></div>
       </div>

             {/* Selección de Familiar - Componente Extraído */}
       <FamilySelector
         familyMembers={familyMembers}
         selectedFamilyMember={selectedFamilyMember}
         onSelectFamilyMember={selectFamilyMember}
         onOpenFamilyForm={openFamilyForm}
         onOptimalDateChange={(month, year) => {
           setFilters(prev => ({
             ...prev,
             startMonth: month,
             startYear: year
           }))
         }}
         session={session}
         onOpenLoginModal={() => setShowLoginModal(true)}
       />

       {/* Perfil de Usuario - Nueva sección arriba */}
       {selectedFamilyMember && (
         <UserProfilePanel
           selectedFamilyMember={selectedFamilyMember}
           filters={filters}
         />
       )}

             {/* Configuración de Estrategia - Componente Extraído */}
       {selectedFamilyMember && (
         <StrategyFiltersPanel
           selectedFamilyMember={selectedFamilyMember}
           filters={filters}
           onFiltersChange={setFilters}
           maxAportacion={maxAportacion}
         />
       )}

      {/* Estrategias Calculadas */}
      {selectedFamilyMember && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-3 px-0 sm:p-4 lg:p-6 rounded-xl border border-gray-200 -mx-2 sm:mx-0 sm:px-3 md:px-4 lg:px-6"
        >
                     <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
             <div className="flex items-center gap-2">
               <TrendingUp className="w-5 h-5" />
               <h3 className="text-lg font-semibold text-gray-900">
                 Estrategias Disponibles
               </h3>
             </div>
             
             <TooltipInteligente termino="Modalidad 40">
               <span className="text-sm text-blue-600 font-medium">ℹ️ Toca los elementos para más información</span>
             </TooltipInteligente>
             
             {/* Contador de estrategias con paginación y tiempo de carga */}
             {!loading && totalStrategies > 0 && (
               <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
                 <span className="text-sm text-gray-600">
                   Mostrando {displayedStrategies.length} de {totalStrategies} estrategias
                 </span>
                 {loadTime && (
                   <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                     ⚡ {loadTime}ms
                   </span>
                 )}
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
               </div>
             )}
             
             {(loading || debounceTimer) && (
               <div className="flex items-center gap-2 text-sm text-blue-600 mt-2 sm:mt-0 sm:ml-auto">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                 <span className="hidden sm:inline">
                   {debounceTimer && !loading ? 'Actualizando...' : 'Calculando...'}
                 </span>
                 <span className="sm:hidden">
                   {debounceTimer && !loading ? 'Actualizando' : 'Calculando'}
                 </span>
               </div>
             )}
           </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Calculando estrategias...</p>
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
                onStrategyPurchase={openStrategyPurchaseModal}
                onPremiumModalOpen={openPremiumModal}
                onViewDetails={viewStrategyDetails}
                onDownloadPDF={downloadStrategyPDF}
              />

              {/* Controles de Paginación - Solo mostrar si hay estrategias */}
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
        </motion.div>
      )}

      {/* Modal del formulario de familiar */}
      <FamilyMemberForm
        isOpen={showFamilyForm}
        onClose={closeFamilyForm}
        onSuccess={handleFamilyFormSuccess}
        familyMember={null}
      />


               {/* Modal de confirmación de compra de estrategia */}
        <StrategyPurchaseModal
          isOpen={showStrategyPurchaseModal}
          onClose={closeStrategyPurchaseModal}
          strategy={selectedStrategyForPurchase}
          familyMember={selectedFamilyMember}
          onConfirmPurchase={handleConfirmStrategyPurchase}
          filters={filters}
          router={router}
          onOpenPremiumModal={openPremiumModal}
        />

        {/* Modal Premium */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={closePremiumModal}
        />

        {/* Modal de Login */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      </div>
    )
  }
