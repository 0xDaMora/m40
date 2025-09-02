"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Plus, Filter, Target, Calendar, DollarSign, TrendingUp, Eye, Download, ArrowUpDown, ArrowUp, ArrowDown, Lock } from "lucide-react"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"
import { useLocalFamily } from "@/hooks/useLocalFamily"
import PurchaseModal from "@/components/PurchaseModal"
import StrategyPurchaseModal from "@/components/StrategyPurchaseModal"
import PremiumModal from "@/components/PremiumModal"
import { FamilyMember } from "@/types/family"
import { Strategy, StrategyResult, IntegrationFilters, FamilyMemberData, StrategyFilters } from "@/types/strategy"
import { FamilyMemberForm } from "@/components/family/FamilyMemberForm"
import { RangeSlider } from "@/components/ui/RangeSlider"
import { getMaxAportacion } from "@/lib/all/umaConverter"
import TooltipInteligente from "@/components/TooltipInteligente"
import { useSearchParams, useRouter } from "next/navigation"
import { useFormatters } from "@/hooks/useFormatters"
import { useStrategy } from "@/hooks/useStrategy"
import { calcularSDI, calcularAportacionPromedio } from "@/lib/utils/calculations"
import { generarCodigoEstrategia, construirDatosEstrategia, construirDatosUsuario, guardarEstrategiaConFallback } from "@/lib/utils/strategy"

export function FamilySimulatorIntegration() {
  const { data: session } = useSession()
  const { familyMembers: localFamilyMembers, addFamilyMember: addLocalFamilyMember } = useLocalFamily()
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Obtener el plan del usuario desde la sesión
  const userPlan = session?.user?.subscription || 'free'
  
  // Debug: mostrar el plan detectado
  console.log('Debug - Session:', session)
  console.log('Debug - User Plan:', userPlan)
  console.log('Debug - User Subscription:', session?.user?.subscription)
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null)
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [strategies, setStrategies] = useState<StrategyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showStrategyPurchaseModal, setShowStrategyPurchaseModal] = useState(false)
  const [selectedStrategyForPurchase, setSelectedStrategyForPurchase] = useState<any>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  
  // Estados para paginación
  const [displayedStrategies, setDisplayedStrategies] = useState<StrategyResult[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [strategiesPerPage] = useState(50)
  const [hasMoreStrategies, setHasMoreStrategies] = useState(true)
  const [loadTime, setLoadTime] = useState<number | null>(null)
  const [filters, setFilters] = useState<IntegrationFilters>({
    familyMemberId: null,
    monthlyContributionRange: {
      min: 1000,
      max: 15000
    },
    months: 24,
    retirementAge: 65,
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear()
  })

  const [strategyFilters, setStrategyFilters] = useState<StrategyFilters>({
    monthsRange: { min: 1, max: 58 },
    sortBy: 'roi',
    sortOrder: 'desc',
    strategyType: 'all',
    umaRange: { min: 1, max: 25 }
  })

  const currentYear = new Date().getFullYear()
  const maxAportacion = getMaxAportacion(currentYear)

  // Cargar familiares
  const loadFamilyMembers = async () => {
    if (session) {
      // Usuario logueado - cargar desde la base de datos
      try {
        const response = await fetch('/api/family')
        if (response.ok) {
          const data = await response.json()
          setFamilyMembers(data)
        }
      } catch (error) {
        toast.error('Error al cargar familiares')
      }
    } else {
      // Usuario no logueado - usar familiares locales
      setFamilyMembers([])
    }
  }

  useEffect(() => {
    loadFamilyMembers()
  }, [session])

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
          max: 15000
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

  // Función de filtrado optimizada con filtros inteligentes
  const filterStrategies = useCallback((strategiesToFilter: StrategyResult[], filters: StrategyFilters, familyMember?: FamilyMember | null) => {
    if (!strategiesToFilter.length) return []

    let filtered = strategiesToFilter

    // Filtro inteligente por SDI: si el SDI del familiar es alto, solo mostrar UMAs mayores
    if (familyMember) {
      // Calcular SDI correctamente
      const calcularSDI = (salarioMensual: number) => {
        const diario = salarioMensual / 30
        const factorIntegracion = 1.12 // estándar (aguinaldo + prima vacacional mínimas)
        return diario * factorIntegracion
      }
      
      const sdiFamiliar = calcularSDI(familyMember.lastGrossSalary)
      const uma2025 = 113.07
      const sdiEnUMAs = sdiFamiliar / uma2025
      const umaMinima = Math.ceil(sdiEnUMAs)
      
      // Solo mostrar estrategias con UMA mayor o igual al SDI del familiar
      filtered = filtered.filter(s => s.umaElegida >= umaMinima)
      
      // Si no hay estrategias válidas, mostrar un mensaje
      if (filtered.length === 0) {
        console.warn(`No hay estrategias válidas para SDI ${sdiFamiliar.toFixed(2)} (${sdiEnUMAs.toFixed(2)} UMAs). UMA mínima requerida: ${umaMinima}`)
        return []
      }
    }

    // Filtrar por tipo de estrategia
    if (filters.strategyType !== 'all') {
      filtered = filtered.filter(s => s.estrategia === filters.strategyType)
    }

    // Filtrar por rango de meses
    filtered = filtered.filter(s => 
      s.mesesM40 >= filters.monthsRange.min && 
      s.mesesM40 <= filters.monthsRange.max
    )

    // Filtrar por rango de UMA
    filtered = filtered.filter(s => 
      s.umaElegida >= filters.umaRange.min && 
      s.umaElegida <= filters.umaRange.max
    )

    // Ordenar de manera más eficiente
    const sortKey = filters.sortBy
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1

    filtered.sort((a, b) => {
      let aValue = 0, bValue = 0

      switch (sortKey) {
        case 'roi':
          aValue = a.ROI || 0
          bValue = b.ROI || 0
          break
        case 'pension':
          aValue = a.pensionMensual || 0
          bValue = b.pensionMensual || 0
          break
        case 'investment':
          aValue = a.inversionTotal || 0
          bValue = b.inversionTotal || 0
          break
        case 'months':
          aValue = a.mesesM40 || 0
          bValue = b.mesesM40 || 0
          break
        default:
          aValue = a.ROI || 0
          bValue = b.ROI || 0
      }

      return (aValue - bValue) * sortOrder
    })

    return filtered
  }, [])

  // Filtrar estrategias cuando cambien los filtros de estrategia
  const filteredStrategies = useMemo(() => {
    return filterStrategies(strategies, strategyFilters, selectedFamilyMember)
  }, [strategies, strategyFilters, filterStrategies, selectedFamilyMember])

  // Paginar estrategias filtradas
  const paginatedStrategies = useMemo(() => {
    const startIndex = 0
    const endIndex = currentPage * strategiesPerPage
    return filteredStrategies.slice(startIndex, endIndex)
  }, [filteredStrategies, currentPage, strategiesPerPage])

  // Actualizar estrategias mostradas cuando cambien las filtradas
  useEffect(() => {
    setDisplayedStrategies(paginatedStrategies)
    setHasMoreStrategies(paginatedStrategies.length < filteredStrategies.length)
  }, [paginatedStrategies, filteredStrategies.length])

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [strategyFilters])

  // Función para cargar más estrategias
  const loadMoreStrategies = () => {
    setCurrentPage(prev => prev + 1)
  }

  // Calcular estrategias con validaciones y optimizaciones
  const calculateStrategies = async () => {
    if (!selectedFamilyMember) return

    // Validaciones previas
    if (selectedFamilyMember.weeksContributed < 500) {
      toast.error('El familiar debe tener al menos 500 semanas cotizadas según la LEY 73 del IMSS')
      return
    }

    if (selectedFamilyMember.lastGrossSalary <= 0) {
      toast.error('El salario bruto debe ser mayor a 0')
      return
    }

    // Calcular SDI correctamente (salario diario integrado)
    const calcularSDI = (salarioMensual: number) => {
      const diario = salarioMensual / 30
      const factorIntegracion = 1.12 // estándar (aguinaldo + prima vacacional mínimas)
      return diario * factorIntegracion
    }
    
    const sdi = calcularSDI(selectedFamilyMember.lastGrossSalary)
    
    // Convertir SDI a UMAs para validación (UMA 2025 = $113.07)
    const uma2025 = 113.07
    const sdiEnUMAs = sdi / uma2025
    
    if (sdiEnUMAs > 25) {
      toast.error('El SDI no puede ser mayor a 25 UMAs según la ley')
      return
    }

    const startTime = performance.now()
    setLoading(true)
    try {
      const familyData: FamilyMemberData = {
        id: selectedFamilyMember.id,
        name: selectedFamilyMember.name,
        birthDate: new Date(selectedFamilyMember.birthDate),
        weeksContributed: selectedFamilyMember.weeksContributed,
        lastGrossSalary: selectedFamilyMember.lastGrossSalary,
        civilStatus: selectedFamilyMember.civilStatus
      }

      // Configurar filtros para generar todas las estrategias posibles
      const optimizedFilters = {
        ...filters,
        // Ajustar el rango de UMA basado en el SDI del familiar
        umaMin: Math.max(1, Math.floor(sdiEnUMAs)),
        umaMax: Math.min(25, Math.ceil(sdiEnUMAs * 1.5)), // Máximo 1.5x el SDI actual
        // Agregar monthsMode: 'scan' para generar todas las estrategias posibles
        monthsMode: 'scan'
      }

      console.log('🔍 DEBUG - Enviando filtros a la API:', optimizedFilters)
      
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
        setStrategies(data.strategies)
        
        // Mostrar información sobre el filtrado
        if (data.strategies.length === 0) {
          toast.error('No se encontraron estrategias válidas con los filtros actuales')
        } else {
          const endTime = performance.now()
          const loadTimeMs = Math.round(endTime - startTime)
          setLoadTime(loadTimeMs)
          console.log(`Se calcularon ${data.strategies.length} estrategias para SDI ${sdi.toFixed(2)} (${sdiEnUMAs.toFixed(2)} UMAs) en ${loadTimeMs}ms`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Error al calcular estrategias')
      }
    } catch (error) {
      console.error('Error al calcular estrategias:', error)
      toast.error('Error inesperado al calcular estrategias')
    } finally {
      setLoading(false)
    }
  }

  // Calcular edad
  const calculateAge = (birthDate: Date | string) => {
    const today = new Date()
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // Calcular mejor momento para iniciar M40
  const getOptimalStartDate = (birthDate: Date | string) => {
    // Asegurar que birthDate sea un objeto Date
    const birthDateObj = birthDate instanceof Date ? birthDate : new Date(birthDate)
    const age = calculateAge(birthDateObj)
    const today = new Date()
    
    if (age >= 55) {
      // Si ya tiene 55+ años, usar el mes siguiente al actual como mínimo
      const nextMonth = today.getMonth() + 2 // +2 para el mes siguiente
      const nextMonthYear = nextMonth > 12 ? today.getFullYear() + 1 : today.getFullYear()
      const finalMonth = nextMonth > 12 ? nextMonth - 12 : nextMonth
      
      return {
        month: finalMonth,
        year: nextMonthYear,
        message: "Puedes iniciar trámites (ya tienes 55+ años)",
        details: "Fecha sugerida: mes siguiente al actual para darte de baja en IMSS y alta en Modalidad 40"
      }
    } else {
      const optimalDate = new Date(birthDateObj)
      optimalDate.setFullYear(birthDateObj.getFullYear() + 55)
      
      // Mes siguiente al cumpleaños (mínimo requerido)
      const startMonth = optimalDate.getMonth() + 2 // +2 porque queremos el mes siguiente
      const startYear = startMonth > 12 ? optimalDate.getFullYear() + 1 : optimalDate.getFullYear()
      const finalMonth = startMonth > 12 ? startMonth - 12 : startMonth
      
      return {
        month: finalMonth,
        year: startYear,
        message: `Recomendado: mes siguiente a cumplir 55 años (${optimalDate.getFullYear()})`,
        details: `Fecha sugerida para trámites: darte de baja en IMSS y alta en Modalidad 40`
      }
    }
  }

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  // Ver estrategia detallada
  const viewStrategyDetails = async (strategy: any) => {
    if (!selectedFamilyMember) return



    // Si no está logueado, mostrar modal de compra
    if (!session) {
      setShowPurchaseModal(true)
      return
    }

    // Verificar si el usuario tiene plan premium
    if (!userPlan || userPlan === 'free' || userPlan === 'basic') {
      setShowPurchaseModal(true)
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
    
    // Calcular SDI correctamente para la función de descarga
    const calcularSDI = (salarioMensual: number) => {
      const diario = salarioMensual / 30
      const factorIntegracion = 1.12 // estándar (aguinaldo + prima vacacional mínimas)
      return diario * factorIntegracion
    }
    
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

  // Función para manejar la compra
  const handlePurchase = async (plan: 'basic' | 'premium') => {
    setShowPurchaseModal(false)
    
    if (!session) {
      // Redirigir a login si no está logueado
      toast.error('Debes iniciar sesión para realizar la compra')
      // Aquí podrías redirigir a login
      return
    }

    // TODO: Implementar lógica de compra real
    toast.success(`Plan ${plan} seleccionado. Redirigiendo a pago...`)
    console.log('Comprando plan:', plan)
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
    <div className="max-w-7xl mx-auto space-y-8">
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
       <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl">
                   {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
         
         <div className="relative z-10">
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
             <div className="mb-6 lg:mb-0">
               {/* Título principal con iconos */}
               <div className="flex items-center gap-4 mb-6">
                 <div className="relative">
                   <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-4 rounded-2xl shadow-lg">
                     <TrendingUp className="w-10 h-10 text-white" />
                   </div>
                   <div className="absolute -top-1 -right-1 bg-green-400 w-4 h-4 rounded-full animate-pulse"></div>
                 </div>
                 <div>
                   <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                     Simulador Modalidad 40
                   </h1>
                   <p className="text-blue-100 text-xl mt-2 font-medium">
                     Herramienta profesional de planificación previsional
                   </p>
                   <div className="flex items-center gap-2 mt-3">
                     <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                     <span className="text-sm text-blue-200">Cálculos en tiempo real</span>
                   </div>
                 </div>
               </div>
               
               {/* Características destacadas */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
               <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center hover:bg-white/20 transition-all duration-300">
                 <div className="text-sm text-blue-200 mb-2 font-medium">Plan actual</div>
                 <div className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
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

             {/* Selección de Familiar - Diseño Profesional */}
       <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
         <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
             <div className="mb-4 lg:mb-0">
               <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                 <div className="bg-blue-600 p-2 rounded-lg">
                   <Users className="w-6 h-6 text-white" />
                 </div>
                 Perfil del Familiar
               </h3>
               <p className="text-gray-600 mt-2">Selecciona o registra los datos del familiar para calcular estrategias personalizadas</p>
             </div>
             <button
               onClick={() => setShowFamilyForm(true)}
               className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
             >
               <Plus className="w-5 h-5" />
               Registrar Familiar
             </button>
           </div>
         </div>

                 {familyMembers.length === 0 ? (
           <div className="p-12 text-center">
             <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
               <Users className="w-10 h-10 text-blue-600" />
             </div>
             <h4 className="text-xl font-semibold text-gray-900 mb-3">
               Comienza registrando un familiar
             </h4>
             <p className="text-gray-600 mb-6 max-w-md mx-auto">
               Para calcular estrategias personalizadas de Modalidad 40, necesitamos los datos del familiar que desea jubilarse
             </p>
             <button
               onClick={() => setShowFamilyForm(true)}
               className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
             >
               Registrar Primer Familiar
             </button>
           </div>
        ) : (
                     <div className="p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {familyMembers.map((member) => (
                 <motion.div
                   key={member.id}
                   onClick={() => {
                     setSelectedFamilyMember(member)
                     // Actualizar fecha de inicio óptima cuando se selecciona un familiar
                     const optimalDate = getOptimalStartDate(member.birthDate)
                     setFilters(prev => ({
                       ...prev,
                       startMonth: optimalDate.month,
                       startYear: optimalDate.year
                     }))
                   }}
                   className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                     selectedFamilyMember?.id === member.id
                       ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                       : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                   }`}
                 >
                   {selectedFamilyMember?.id === member.id && (
                     <div className="absolute -top-2 -right-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                       ✓
                     </div>
                   )}
                   <div className="flex items-start justify-between mb-4">
                     <div className="bg-blue-100 p-3 rounded-xl">
                       <Users className="w-6 h-6 text-blue-600" />
                     </div>
                     <div className="text-right">
                       <div className="text-sm text-gray-500">Edad</div>
                       <div className="font-bold text-gray-900">{calculateAge(member.birthDate)} años</div>
                     </div>
                   </div>
                   <h4 className="text-xl font-bold text-gray-900 mb-3">{member.name}</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between items-center py-2 border-b border-gray-100">
                       <span className="text-gray-600">Semanas cotizadas</span>
                       <span className="font-semibold text-gray-900">{member.weeksContributed}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-gray-600">Salario mensual</span>
                       <span className="font-semibold text-gray-900">{formatCurrency(member.lastGrossSalary)}</span>
                     </div>
                   </div>
                   <div className="mt-4 pt-3 border-t border-gray-100">
                     <div className="text-xs text-gray-500">
                       {selectedFamilyMember?.id === member.id ? 'Seleccionado' : 'Haz clic para seleccionar'}
                     </div>
                   </div>
                 </motion.div>
               ))}
             </div>
           </div>
        )}
      </div>

             {/* Configuración de Estrategia - Diseño Profesional */}
       {selectedFamilyMember && (
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
         >
           <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-200">
             <div className="flex items-center gap-3">
               <div className="bg-green-600 p-2 rounded-lg">
                 <Filter className="w-6 h-6 text-white" />
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-gray-900">
                   Configuración de Estrategia
                 </h3>
                 <p className="text-gray-600">Personaliza los parámetros para optimizar tu plan de Modalidad 40</p>
               </div>
             </div>
           </div>

                     <div className="p-8">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Rango de Aportación Mensual */}
               <div className="bg-gray-50 p-6 rounded-xl">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="bg-blue-100 p-2 rounded-lg">
                     <DollarSign className="w-5 h-5 text-blue-600" />
                   </div>
                   <div>
                     <label className="block text-lg font-semibold text-gray-900">
                       Aportación Mensual
                     </label>
                     <p className="text-sm text-gray-600">Define tu capacidad de inversión</p>
                   </div>
                 </div>
                 <RangeSlider
                   min={1000}
                   max={maxAportacion}
                   value={filters.monthlyContributionRange}
                   onChange={(value) => setFilters(prev => ({
                     ...prev,
                     monthlyContributionRange: value
                   }))}
                   step={1000}
                   formatValue={(val) => `$${val.toLocaleString()}`}
                 />
                 <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-blue-600">
                       ${filters.monthlyContributionRange.min.toLocaleString()} - ${filters.monthlyContributionRange.max.toLocaleString()}
                     </div>
                                        <div className="text-sm text-gray-600">Rango mensual</div>
                 </div>
                 
                 {/* Explicación contextual */}
                 <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                   <div className="flex items-start gap-3">
                     <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                       <DollarSign className="w-3 h-3 text-blue-600" />
                     </div>
                     <div>
                       <h4 className="font-medium text-blue-800 text-sm mb-2">¿Cómo influye la aportación mensual?</h4>
                       <div className="text-xs text-blue-700 space-y-2">
                         <p>• <strong>Mayor aportación = Mejor pensión:</strong> Cada peso adicional en M40 se multiplica por el factor de edad y semanas.</p>
                         <p>• <strong>Rango recomendado:</strong> $5,000 - $15,000 mensuales para obtener pensiones significativamente mejores.</p>
                         <p>• <strong>Recuperación:</strong> La inversión se recupera en 18-36 meses dependiendo de tu edad y SDI actual.</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               </div>

                           {/* Edad de Jubilación */}
               <div className="bg-gray-50 p-6 rounded-xl">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="bg-green-100 p-2 rounded-lg">
                     <Target className="w-5 h-5 text-green-600" />
                   </div>
                   <div>
                     <label className="block text-lg font-semibold text-gray-900">
                       Edad de Jubilación
                     </label>
                     <p className="text-sm text-gray-600">Define tu objetivo de retiro</p>
                   </div>
                 </div>
                 <select
                   value={filters.retirementAge}
                   onChange={(e) => setFilters(prev => ({
                     ...prev,
                     retirementAge: parseInt(e.target.value)
                   }))}
                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-medium"
                 >
                   <option value={60}>60 años</option>
                   <option value={61}>61 años</option>
                   <option value={62}>62 años</option>
                   <option value={63}>63 años</option>
                   <option value={64}>64 años</option>
                   <option value={65}>65 años</option>
                 </select>
                 <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-green-600">
                       {filters.retirementAge} años
                     </div>
                                        <div className="text-sm text-gray-600">Objetivo de jubilación</div>
                 </div>
                 
                 {/* Explicación contextual */}
                 <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                   <div className="flex items-start gap-3">
                     <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                       <Target className="w-3 h-3 text-green-600" />
                     </div>
                     <div>
                       <h4 className="font-medium text-green-800 text-sm mb-2">¿Cómo influye la edad de jubilación?</h4>
                       <div className="text-xs text-green-700 space-y-2">
                         <p>• <strong>Factor de edad:</strong> Jubilarse a los 65 años maximiza tu pensión (factor 1.0). Cada año antes reduce ~5%.</p>
                         <p>• <strong>Rango óptimo:</strong> 60-65 años. Antes de 60 años la reducción es significativa.</p>
                         <p>• <strong>Estrategia M40:</strong> Te permite jubilarte más joven manteniendo una pensión alta.</p>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               </div>

                           {/* Fecha de Inicio M40 */}
               <div className="bg-gray-50 p-6 rounded-xl">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="bg-purple-100 p-2 rounded-lg">
                     <Calendar className="w-5 h-5 text-purple-600" />
                   </div>
                   <div>
                     <label className="block text-lg font-semibold text-gray-900">
                       Fecha de Inicio M40
                     </label>
                     <p className="text-sm text-gray-600">Cuándo iniciar trámites</p>
                   </div>
                 </div>
              {selectedFamilyMember && (
                <div className="mb-4 space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-sm font-semibold text-blue-800 mb-2">
                      📅 Fecha Recomendada
                    </div>
                    <div className="text-sm text-blue-700">
                      {getOptimalStartDate(selectedFamilyMember.birthDate).message}
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      {getOptimalStartDate(selectedFamilyMember.birthDate).details}
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
                    <strong>⚠️ Importante:</strong> Esta fecha es para iniciar trámites (baja IMSS + alta M40). 
                    Puedes posponerla según tus necesidades.
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <select
                    value={filters.startMonth}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      startMonth: parseInt(e.target.value)
                    }))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium"
                  >
                    <option value={1}>Enero</option>
                    <option value={2}>Febrero</option>
                    <option value={3}>Marzo</option>
                    <option value={4}>Abril</option>
                    <option value={5}>Mayo</option>
                    <option value={6}>Junio</option>
                    <option value={7}>Julio</option>
                    <option value={8}>Agosto</option>
                    <option value={9}>Septiembre</option>
                    <option value={10}>Octubre</option>
                    <option value={11}>Noviembre</option>
                    <option value={12}>Diciembre</option>
                  </select>
                  <input
                    type="number"
                    value={filters.startYear}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      startYear: parseInt(e.target.value)
                    }))}
                    className="w-24 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium text-center"
                    placeholder="Año"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 15}
                  />
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>🗓️ <strong>Fecha personalizada:</strong> Elige cuándo quieres iniciar trámites</div>
                  <div>📊 <strong>Los cálculos se ajustarán automáticamente</strong> a tu fecha elegida</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {filters.startMonth === 1 ? 'Enero' : 
                     filters.startMonth === 2 ? 'Febrero' : 
                     filters.startMonth === 3 ? 'Marzo' : 
                     filters.startMonth === 4 ? 'Abril' : 
                     filters.startMonth === 5 ? 'Mayo' : 
                     filters.startMonth === 6 ? 'Junio' : 
                     filters.startMonth === 7 ? 'Julio' : 
                     filters.startMonth === 8 ? 'Agosto' : 
                     filters.startMonth === 9 ? 'Septiembre' : 
                     filters.startMonth === 10 ? 'Octubre' : 
                     filters.startMonth === 11 ? 'Noviembre' : 'Diciembre'} {filters.startYear}
                  </div>
                  <div className="text-sm text-gray-600">Fecha de inicio</div>
                </div>
              </div>
            </div>
          </div>
        </div>

                     {/* Información del Familiar - Diseño Profesional */}
           <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
             <div className="flex items-center gap-3 mb-6">
               <div className="bg-blue-600 p-3 rounded-xl">
                 <Users className="w-6 h-6 text-white" />
               </div>
               <div>
                                    <h4 className="text-xl font-bold text-gray-900">
                     Perfil de {selectedFamilyMember?.name}
                   </h4>
                   <p className="text-gray-600">Información personalizada para cálculos precisos</p>
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="bg-white p-4 rounded-xl border border-gray-200">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="bg-blue-100 p-1 rounded">
                     <span className="text-blue-600 text-sm">📅</span>
                   </div>
                   <div className="text-sm text-gray-600">Edad actual</div>
                 </div>
                 <div className="text-2xl font-bold text-gray-900">{calculateAge(selectedFamilyMember?.birthDate || new Date())} años</div>
               </div>
               <div className="bg-white p-4 rounded-xl border border-gray-200">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="bg-green-100 p-1 rounded">
                     <span className="text-green-600 text-sm">📊</span>
                   </div>
                   <div className="text-sm text-gray-600">Semanas cotizadas</div>
                 </div>
                 <div className="text-2xl font-bold text-gray-900">{selectedFamilyMember?.weeksContributed || 0}</div>
               </div>
               <div className="bg-white p-4 rounded-xl border border-gray-200">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="bg-yellow-100 p-1 rounded">
                     <span className="text-yellow-600 text-sm">💰</span>
                   </div>
                   <div className="text-sm text-gray-600">Salario mensual</div>
                 </div>
                 <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedFamilyMember.lastGrossSalary)}</div>
               </div>
               <div className="bg-white p-4 rounded-xl border border-gray-200">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="bg-purple-100 p-1 rounded">
                     <span className="text-purple-600 text-sm">🎯</span>
                   </div>
                   <div className="text-sm text-gray-600">Edad de jubilación</div>
                 </div>
                 <div className="text-2xl font-bold text-gray-900">{filters.retirementAge} años</div>
               </div>
             </div>
                          
             {/* Información de SDI y filtros inteligentes - Diseño Profesional */}
             <div className="mt-6 space-y-4">
               {(() => {
                 // Calcular SDI correctamente
                 const calcularSDI = (salarioMensual: number) => {
                   const diario = salarioMensual / 30
                   const factorIntegracion = 1.12 // estándar (aguinaldo + prima vacacional mínimas)
                   return diario * factorIntegracion
                 }
                 
                 const sdi = calcularSDI(selectedFamilyMember.lastGrossSalary)
                 const uma2025 = 113.07
                 const sdiEnUMAs = sdi / uma2025
                 
                 return (
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="bg-green-600 p-2 rounded-lg">
                           <span className="text-white text-sm font-bold">📊</span>
                         </div>
                         <div className="text-sm font-semibold text-green-800">SDI Calculado</div>
                       </div>
                       <div className="text-lg font-bold text-green-700">${sdi.toFixed(2)} diario</div>
                       <div className="text-sm text-green-600">({sdiEnUMAs.toFixed(2)} UMAs)</div>
                     </div>
                     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="bg-blue-600 p-2 rounded-lg">
                           <span className="text-white text-sm font-bold">🎯</span>
                         </div>
                         <div className="text-sm font-semibold text-blue-800">Filtro Inteligente</div>
                       </div>
                       <div className="text-lg font-bold text-blue-700">UMA ≥ {Math.ceil(sdiEnUMAs)}</div>
                       <div className="text-sm text-blue-600">Estrategias optimizadas</div>
                     </div>

                   </div>
                 )
               })()}
             </div>
           </div>
        </motion.div>
      )}

      {/* Estrategias Calculadas */}
      {selectedFamilyMember && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl border border-gray-200"
        >
                     <div className="flex items-center gap-2 mb-4">
             <TrendingUp className="w-5 h-5" />
             <h3 className="text-lg font-semibold text-gray-900">
               Estrategias Disponibles
             </h3>
             <TooltipInteligente termino="Modalidad 40">
               <span className="text-sm text-blue-600 font-medium">ℹ️ Toca los elementos para más información</span>
             </TooltipInteligente>
             
                           {/* Contador de estrategias con paginación y tiempo de carga */}
              {!loading && filteredStrategies.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Mostrando {displayedStrategies.length} de {filteredStrategies.length} estrategias
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
               <div className="ml-auto flex items-center gap-2 text-sm text-blue-600">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                 {debounceTimer && !loading ? 'Actualizando...' : 'Calculando...'}
               </div>
             )}
           </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Calculando estrategias...</p>
            </div>
                     ) : displayedStrategies.length === 0 ? (
             <div className="text-center py-8">
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                 <div className="text-yellow-600 mb-2">
                   <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                   </svg>
                 </div>
                                   <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No se encontraron estrategias válidas
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Esto puede deberse a:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1 text-left">
                    <li>• El SDI del familiar es muy alto para las UMAs disponibles</li>
                    <li>• Los filtros aplicados son muy restrictivos</li>
                    <li>• El rango de aportación mensual es muy limitado</li>
                  </ul>
                  <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    <strong>💡 Sugerencia:</strong> Intenta ajustar el rango de aportación mensual o la edad de jubilación.
                  </div>
                  {filteredStrategies.length > 0 && (
                    <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                      <strong>⚡ Optimización:</strong> Se encontraron {filteredStrategies.length} estrategias, pero se están cargando por lotes para mejor rendimiento.
                    </div>
                  )}
               </div>
             </div>
          ) : (
            <>
              {/* Filtros de Estrategias */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tipo de Estrategia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Estrategia
                    </label>
                    <select
                      value={strategyFilters.strategyType}
                      onChange={(e) => setStrategyFilters(prev => ({
                        ...prev,
                        strategyType: e.target.value as any
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">Todas</option>
                      <option value="fijo">Fijo</option>
                      <option value="progresivo">Progresivo</option>
                    </select>
                  </div>

                  {/* Rango de Meses */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meses en M40
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={strategyFilters.monthsRange.min}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1
                          const clampedValue = Math.max(1, Math.min(58, value))
                          setStrategyFilters(prev => ({
                            ...prev,
                            monthsRange: {
                              ...prev.monthsRange,
                              min: clampedValue,
                              max: Math.max(clampedValue, prev.monthsRange.max)
                            }
                          }))
                        }}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Min"
                        min="1"
                        max="58"
                      />
                      <input
                        type="number"
                        value={strategyFilters.monthsRange.max}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 58
                          const clampedValue = Math.max(1, Math.min(58, value))
                          setStrategyFilters(prev => ({
                            ...prev,
                            monthsRange: {
                              ...prev.monthsRange,
                              max: clampedValue,
                              min: Math.min(clampedValue, prev.monthsRange.min)
                            }
                          }))
                        }}
                        className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Max"
                        min="1"
                        max="58"
                      />
                    </div>
                  </div>

                  {/* Ordenar por */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordenar por
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={strategyFilters.sortBy}
                        onChange={(e) => setStrategyFilters(prev => ({
                          ...prev,
                          sortBy: e.target.value as any
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="roi">ROI</option>
                        <option value="pension">Pensión</option>
                        <option value="investment">Inversión</option>
                        <option value="months">Meses</option>
                      </select>
                      <button
                        onClick={() => setStrategyFilters(prev => ({
                          ...prev,
                          sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc'
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {strategyFilters.sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                                     {/* Contador con paginación */}
                   <div className="flex items-end">
                     <div className="text-sm text-gray-600">
                       {displayedStrategies.length} de {filteredStrategies.length} estrategias
                     </div>
                   </div>
                </div>
              </div>

                                                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedStrategies.map((strategy, index) => {
                   // Calcular aportación mensual promedio
                   const aportacionPromedio = strategy.inversionTotal ? strategy.inversionTotal / strategy.mesesM40 : 0
                   
                   return (
                     <motion.div
                       key={`${strategy.estrategia}_${strategy.umaElegida}_${strategy.mesesM40}_${index}`}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.1 }}
                       className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
                     >
                       {/* Header con gradiente */}
                       <div className={`relative h-24 bg-gradient-to-r ${
                         strategy.estrategia === 'progresivo' 
                           ? 'from-purple-500 to-purple-600' 
                           : 'from-green-500 to-green-600'
                       }`}>
                         <div className="absolute inset-0 bg-black/10"></div>
                         <div className="relative p-4 text-white">
                           <div className="flex justify-between items-start">
                             <div>
                               <h3 className="text-lg font-bold">
                                 {strategy.estrategia === 'fijo' ? 'Estrategia Fija' : 'Estrategia Progresiva'}
                               </h3>
                               <p className="text-sm opacity-90">Modalidad 40</p>
                             </div>
                                                           <TooltipInteligente termino={strategy.estrategia === 'fijo' ? 'UMA Fijo' : 'UMA Progresivo'}>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  strategy.estrategia === 'progresivo' 
                                    ? 'bg-purple-400/20 text-white' 
                                    : 'bg-green-400/20 text-white'
                                }`}>
                                  {strategy.estrategia === 'progresivo' ? 'Progresiva' : 'Fija'}
                                </div>
                              </TooltipInteligente>
                           </div>
                         </div>
                       </div>

                       {/* Contenido principal */}
                       <div className="p-6">
                         {/* Información destacada */}
                         <div className="space-y-4 mb-6">
                                                       {/* Aportación mensual promedio - LO MÁS IMPORTANTE */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                              <div className="text-center">
                                <TooltipInteligente termino="Aportación mensual promedio">
                                  <p className="text-sm text-blue-600 font-medium mb-1">Aportación Mensual Promedio</p>
                                </TooltipInteligente>
                                <p className="text-2xl font-bold text-blue-700">{formatCurrency(aportacionPromedio)}</p>
                                <p className="text-xs text-blue-500 mt-1">Durante {strategy.mesesM40} meses</p>
                              </div>
                            </div>

                                                       {/* Pensión mensual - SEGUNDO MÁS IMPORTANTE */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                              <div className="text-center">
                                <TooltipInteligente termino="Pensión mensual">
                                  <p className="text-sm text-green-600 font-medium mb-1">Pensión Mensual</p>
                                </TooltipInteligente>
                                <p className="text-2xl font-bold text-green-700">{formatCurrency(strategy.pensionMensual || 0)}</p>
                                <p className="text-xs text-green-500 mt-1">Al jubilarse</p>
                              </div>
                            </div>

                                                       {/* ROI destacado */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-100">
                              <div className="text-center">
                                <TooltipInteligente termino="ROI">
                                  <p className="text-sm text-orange-600 font-medium">Retorno de Inversión</p>
                                </TooltipInteligente>
                                <p className="text-xl font-bold text-orange-700">{(strategy.ROI || 0).toFixed(1)}%</p>
                              </div>
                            </div>
                         </div>

                                                   {/* Detalles técnicos */}
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <TooltipInteligente termino="Nivel UMA">
                                <span className="text-gray-600">UMA elegida:</span>
                              </TooltipInteligente>
                              <span className="font-semibold text-gray-900">{strategy.umaElegida}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <TooltipInteligente termino="Meses en M40">
                                <span className="text-gray-600">Duración:</span>
                              </TooltipInteligente>
                              <span className="font-semibold text-gray-900">{strategy.mesesM40} meses</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <TooltipInteligente termino="Inversión estimada">
                                <span className="text-gray-600">Inversión total:</span>
                              </TooltipInteligente>
                              <span className="font-semibold text-gray-900">{formatCurrency(strategy.inversionTotal || 0)}</span>
                            </div>
                          </div>

                                                   {/* Botón de acción */}
                          <div className="mt-6">
                                                         {(!session || userPlan === 'free' || userPlan === 'basic') ? (
                               <div className="space-y-3">
                                 <button
                                   onClick={() => {
                                     setSelectedStrategyForPurchase(strategy)
                                     setShowStrategyPurchaseModal(true)
                                   }}
                                   className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                 >
                                   <div className="flex items-center justify-center gap-2">
                                     <Lock className="w-5 h-5" />
                                     <span>Comprar Estrategia</span>
                                   </div>
                                 </button>
                                                                   <button
                                    onClick={() => setShowPremiumModal(true)}
                                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="text-lg">🚀</span>
                                      <span>Desbloquear todas las estrategias con Premium</span>
                                    </div>
                                  </button>
                               </div>
                             ) : (
                              <div className="space-y-3">
                                <button
                                  onClick={() => viewStrategyDetails(strategy)}
                                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <Eye className="w-5 h-5" />
                                    <span>Ver Detalles</span>
                                  </div>
                                </button>
                                <button
                                  onClick={() => downloadStrategyPDF(strategy)}
                                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                  title="Descargar PDF"
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    <span>Descargar PDF</span>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                       </div>

                                               {/* Badge de popularidad si es el mejor ROI */}
                        {index === 0 && (
                          <div className="absolute top-4 right-4">
                            <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                              ⭐ Mejor ROI
                            </div>
                          </div>
                                                 )}
                       </motion.div>
                     )
                   })}
                 </div>
                 
                 {/* Botón "Cargar más" */}
                 {hasMoreStrategies && displayedStrategies.length > 0 && (
                   <div className="mt-8 text-center">
                     <button
                       onClick={loadMoreStrategies}
                       className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                     >
                       <div className="flex items-center gap-2">
                         <span>Cargar más estrategias</span>
                         <span className="text-sm opacity-75">
                           ({filteredStrategies.length - displayedStrategies.length} restantes)
                         </span>
                       </div>
                     </button>
                     <p className="text-xs text-gray-500 mt-2">
                       Cargando {strategiesPerPage} estrategias por vez para mejor rendimiento
                     </p>
                   </div>
                 )}
            </>
          )}
        </motion.div>
      )}

      {/* Modal del formulario de familiar */}
      <FamilyMemberForm
        isOpen={showFamilyForm}
        onClose={() => {
          setShowFamilyForm(false)
        }}
        onSuccess={() => {
          loadFamilyMembers()
          setShowFamilyForm(false)
        }}
        familyMember={null}
      />

             {/* Modal de compra */}
       <PurchaseModal
         isOpen={showPurchaseModal}
         onClose={() => setShowPurchaseModal(false)}
         onPurchase={handlePurchase}
       />

               {/* Modal de confirmación de compra de estrategia */}
        <StrategyPurchaseModal
          isOpen={showStrategyPurchaseModal}
          onClose={() => {
            setShowStrategyPurchaseModal(false)
            setSelectedStrategyForPurchase(null)
          }}
          strategy={selectedStrategyForPurchase}
          familyMember={selectedFamilyMember}
          onConfirmPurchase={handleConfirmStrategyPurchase}
          filters={filters}
          router={router}
        />

        {/* Modal Premium */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />
      </div>
    )
  }
