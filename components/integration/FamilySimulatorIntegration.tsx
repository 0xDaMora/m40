"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Plus, Filter, Target, Calendar, DollarSign, TrendingUp, Eye, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import toast from "react-hot-toast"
import { FamilyMember } from "@/types/family"
import { Strategy, IntegrationFilters, FamilyMemberData, StrategyFilters } from "@/types/strategy"
import { FamilyMemberForm } from "@/components/family/FamilyMemberForm"
import { RangeSlider } from "@/components/ui/RangeSlider"
import { getMaxAportacion } from "@/lib/all/umaConverter"

export function FamilySimulatorIntegration() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null)
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<IntegrationFilters>({
    familyMemberId: null,
    monthlyContributionRange: {
      min: 1000,
      max: 15000
    },
    months: 24,
    retirementAge: 65,
    startMonth: new Date().getMonth() + 1, // Se actualizará cuando se seleccione un familiar
    startYear: new Date().getFullYear() // Se actualizará cuando se seleccione un familiar
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
    try {
      const response = await fetch('/api/family')
      if (response.ok) {
        const data = await response.json()
        setFamilyMembers(data)
      }
    } catch (error) {
      toast.error('Error al cargar familiares')
    }
  }

  useEffect(() => {
    loadFamilyMembers()
  }, [])

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

  // Función de filtrado optimizada
  const filterStrategies = useCallback((strategiesToFilter: Strategy[], filters: StrategyFilters) => {
    if (!strategiesToFilter.length) return []

    let filtered = strategiesToFilter

    // Filtrar por tipo de estrategia
    if (filters.strategyType !== 'all') {
      filtered = filtered.filter(s => s.estrategia === filters.strategyType)
    }

    // Filtrar por rango de meses
    filtered = filtered.filter(s => 
      s.mesesM40 >= filters.monthsRange.min && 
      s.mesesM40 <= filters.monthsRange.max
    )

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: number, bValue: number

      switch (filters.sortBy) {
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

      return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue
    })

    return filtered
  }, [])

  // Filtrar estrategias cuando cambien los filtros de estrategia
  const filteredStrategies = useMemo(() => {
    return filterStrategies(strategies, strategyFilters)
  }, [strategies, strategyFilters, filterStrategies])

  // Calcular estrategias
  const calculateStrategies = async () => {
    if (!selectedFamilyMember) return

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

      const response = await fetch('/api/calculate-strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyData,
          filters
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setStrategies(data.strategies)
      } else {
        toast.error('Error al calcular estrategias')
      }
    } catch (error) {
      toast.error('Error inesperado')
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
      return {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        message: "Puedes iniciar trámites inmediatamente (ya tienes 55+ años)",
        details: "Fecha sugerida para darte de baja en IMSS y alta en Modalidad 40"
      }
    } else {
      const optimalDate = new Date(birthDateObj)
      optimalDate.setFullYear(birthDateObj.getFullYear() + 55)
      
      // Mes siguiente al cumpleaños
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
    
    // Crear un código único para la estrategia
    const strategyCode = `integration_${strategy.estrategia}_${strategy.umaElegida}_${strategy.mesesM40}_${filters.retirementAge}`
    
    // Asegurar que birthDate sea una fecha válida
    const birthDate = selectedFamilyMember.birthDate instanceof Date 
      ? selectedFamilyMember.birthDate 
      : new Date(selectedFamilyMember.birthDate)
    
    // Preparar datos para guardar la estrategia
    const datosEstrategia = {
      mesesM40: strategy.mesesM40,
      estrategia: strategy.estrategia,
      umaElegida: strategy.umaElegida,
      edad: filters.retirementAge,
      dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
      sdiHistorico: selectedFamilyMember.lastGrossSalary / 30.4,
      semanasPrevias: selectedFamilyMember.weeksContributed,
      inicioM40: new Date(filters.startYear, filters.startMonth - 1, 1).toISOString()
    }
    
    const datosUsuario = {
      inicioM40: new Date(filters.startYear, filters.startMonth - 1, 1).toISOString().split('T')[0],
      edad: filters.retirementAge,
      dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
      sdiHistorico: selectedFamilyMember.lastGrossSalary / 30.4,
      semanasPrevias: selectedFamilyMember.weeksContributed,
      familyMemberId: selectedFamilyMember.id
    }
    
    try {
      // Guardar la estrategia automáticamente
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
        // Si se guardó correctamente, abrir la página compartible
        const url = `/estrategia/${strategyCode}`
        window.open(url, '_blank')
      } else if (response.status === 409) {
        // Si ya existe, abrir directamente
        const url = `/estrategia/${strategyCode}`
        window.open(url, '_blank')
      } else {
        // Si hay error, usar la página de debug como fallback
        const params = new URLSearchParams({
          code: strategyCode,
          estrategia: strategy.estrategia,
          uma: strategy.umaElegida.toString(),
          meses: strategy.mesesM40.toString(),
          edad: filters.retirementAge.toString(),
          dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
          sdi: (selectedFamilyMember.lastGrossSalary / 30.4).toString(),
          semanas: selectedFamilyMember.weeksContributed.toString(),
          fecha: birthDate.toISOString().split('T')[0],
          startMonth: filters.startMonth.toString(),
          startYear: filters.startYear.toString(),
          familyMemberId: selectedFamilyMember.id.toString()
        })
        const url = `/debug-estrategia?${params.toString()}`
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Error al guardar estrategia:', error)
      // Fallback a debug-estrategia
      const params = new URLSearchParams({
        code: strategyCode,
        estrategia: strategy.estrategia,
        uma: strategy.umaElegida.toString(),
        meses: strategy.mesesM40.toString(),
        edad: filters.retirementAge.toString(),
        dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
        sdi: (selectedFamilyMember.lastGrossSalary / 30.4).toString(),
        semanas: selectedFamilyMember.weeksContributed.toString(),
        fecha: birthDate.toISOString().split('T')[0],
        startMonth: filters.startMonth.toString(),
        startYear: filters.startYear.toString(),
        familyMemberId: selectedFamilyMember.id.toString()
      })
      const url = `/debug-estrategia?${params.toString()}`
      window.open(url, '_blank')
    }
  }

  // Descargar PDF de la estrategia
  const downloadStrategyPDF = (strategy: any) => {
    if (!selectedFamilyMember) return
    
    // Crear un código único para la estrategia
    const strategyCode = `integration_${strategy.estrategia}_${strategy.umaElegida}_${strategy.mesesM40}_${filters.retirementAge}`
    
    // Asegurar que birthDate sea una fecha válida
    const birthDate = selectedFamilyMember.birthDate instanceof Date 
      ? selectedFamilyMember.birthDate 
      : new Date(selectedFamilyMember.birthDate)
    
    // Construir URL con todos los parámetros necesarios
    const params = new URLSearchParams({
      code: strategyCode,
      estrategia: strategy.estrategia,
      uma: strategy.umaElegida.toString(),
      meses: strategy.mesesM40.toString(),
      edad: filters.retirementAge.toString(),
      dependiente: selectedFamilyMember.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
      sdi: (selectedFamilyMember.lastGrossSalary / 30.4).toString(),
      semanas: selectedFamilyMember.weeksContributed.toString(),
      fecha: birthDate.toISOString().split('T')[0],
      startMonth: filters.startMonth.toString(),
      startYear: filters.startYear.toString(),
      download: 'true' // Parámetro para indicar que queremos descargar PDF
    })
    
    const url = `/estrategia/${strategyCode}?${params.toString()}`
    console.log('Descargando PDF de estrategia:', url) // Debug
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Simulador de Estrategias por Familiar
        </h2>
      </div>

      {/* Selección de Familiar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Seleccionar Familiar
          </h3>
          <button
            onClick={() => setShowFamilyForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Familiar
          </button>
        </div>

        {familyMembers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">
              No tienes familiares registrados
            </p>
            <button
              onClick={() => setShowFamilyForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Agregar tu primer familiar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedFamilyMember?.id === member.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{member.name}</h4>
                  {selectedFamilyMember?.id === member.id && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {calculateAge(member.birthDate)} años • {member.weeksContributed} semanas
                </p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(member.lastGrossSalary)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros de Estrategia */}
      {selectedFamilyMember && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl border border-gray-200"
        >
                     <div className="flex items-center gap-2 mb-4">
             <Filter className="w-5 h-5" />
             <h3 className="text-lg font-semibold text-gray-900">
               Configurar Estrategia de Modalidad 40
             </h3>
           </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Rango de Aportación Mensual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Rango de Aportación Mensual
              </label>
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
              <div className="mt-1 text-xs text-gray-500">
                ${filters.monthlyContributionRange.min.toLocaleString()} - ${filters.monthlyContributionRange.max.toLocaleString()} mensuales
              </div>
            </div>

            {/* Edad de Jubilación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Edad de Jubilación
              </label>
              <select
                value={filters.retirementAge}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  retirementAge: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={60}>60 años</option>
                <option value={61}>61 años</option>
                <option value={62}>62 años</option>
                <option value={63}>63 años</option>
                <option value={64}>64 años</option>
                <option value={65}>65 años</option>
              </select>
            </div>

                         {/* Fecha de Inicio M40 */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 <Calendar className="w-4 h-4 inline mr-1" />
                 Fecha de Inicio Modalidad 40
               </label>
               {selectedFamilyMember && (
                 <div className="mb-3 space-y-2">
                   <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                     <div className="text-sm font-medium text-blue-800 mb-1">
                       📅 Fecha Recomendada
                     </div>
                     <div className="text-xs text-blue-700">
                       {getOptimalStartDate(selectedFamilyMember.birthDate).message}
                     </div>
                     <div className="text-xs text-blue-600 mt-1">
                       {getOptimalStartDate(selectedFamilyMember.birthDate).details}
                     </div>
                   </div>
                   <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                     <strong>⚠️ Importante:</strong> Esta fecha es para iniciar trámites (baja IMSS + alta M40). 
                     Puedes posponerla según tus necesidades.
                   </div>
                 </div>
               )}
               <div className="space-y-2">
                 <div className="flex gap-2">
                   <select
                     value={filters.startMonth}
                     onChange={(e) => setFilters(prev => ({
                       ...prev,
                       startMonth: parseInt(e.target.value)
                     }))}
                     className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                     className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Año"
                     min={new Date().getFullYear()}
                     max={new Date().getFullYear() + 15}
                   />
                 </div>
                 <div className="text-xs text-gray-600 space-y-1">
                   <div>🗓️ <strong>Fecha personalizada:</strong> Elige cuándo quieres iniciar trámites</div>
                   <div>📊 <strong>Los cálculos se ajustarán automáticamente</strong> a tu fecha elegida</div>
                 </div>
               </div>
             </div>
          </div>

                     {/* Información del Familiar */}
           <div className="mt-4 bg-gray-50 p-4 rounded-lg">
             <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
               👤 {selectedFamilyMember.name}
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
               <div>
                 <div className="text-gray-600 mb-1">📅 Edad actual</div>
                 <div className="font-medium">{calculateAge(selectedFamilyMember.birthDate)} años</div>
               </div>
               <div>
                 <div className="text-gray-600 mb-1">📊 Semanas cotizadas</div>
                 <div className="font-medium">{selectedFamilyMember.weeksContributed} semanas</div>
               </div>
               <div>
                 <div className="text-gray-600 mb-1">💰 Salario mensual</div>
                 <div className="font-medium">{formatCurrency(selectedFamilyMember.lastGrossSalary)}</div>
               </div>
               <div>
                 <div className="text-gray-600 mb-1">🎯 Edad de jubilación</div>
                 <div className="font-medium">{filters.retirementAge} años</div>
               </div>
             </div>
             <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
               <strong>💡 Nota:</strong> Los cálculos consideran tu edad actual, semanas cotizadas y la fecha de inicio personalizada que elijas.
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
             {(loading || debounceTimer) && (
               <div className="flex items-center gap-2 text-sm text-blue-600">
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
                     ) : filteredStrategies.length === 0 ? (
             <div className="text-center py-8">
               <p className="text-gray-600">
                 No se encontraron estrategias con los filtros actuales
               </p>
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

                   {/* Contador */}
                   <div className="flex items-end">
                     <div className="text-sm text-gray-600">
                       {filteredStrategies.length} estrategias encontradas
                     </div>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {filteredStrategies.map((strategy, index) => (
                                 <motion.div
                   key={`${strategy.estrategia}_${strategy.umaElegida}_${strategy.mesesM40}_${index}`}
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                 >
                   <div className="flex justify-between items-start mb-3">
                     <h4 className="font-semibold text-gray-900">
                       {strategy.estrategia === 'fijo' ? 'Estrategia Fija' : 'Estrategia Progresiva'}
                     </h4>
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                       strategy.estrategia === 'progresivo' 
                         ? 'bg-purple-100 text-purple-800' 
                         : 'bg-green-100 text-green-800'
                     }`}>
                       {strategy.estrategia === 'progresivo' ? 'Progresiva' : 'Fija'}
                     </span>
                   </div>

                   <div className="space-y-2 text-sm">
                     <div className="flex justify-between">
                       <span className="text-gray-600">UMA:</span>
                       <span className="font-medium">{strategy.umaElegida}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Duración:</span>
                       <span className="font-medium">{strategy.mesesM40} meses</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Pensión mensual:</span>
                       <span className="font-medium text-green-600">{formatCurrency(strategy.pensionMensual || 0)}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">ROI:</span>
                       <span className="font-medium text-blue-600">{(strategy.ROI || 0).toFixed(1)}%</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Inversión total:</span>
                       <span className="font-medium">{formatCurrency(strategy.inversionTotal || 0)}</span>
                     </div>
                   </div>

                   <div className="flex gap-2 mt-4">
                     <button
                       onClick={() => viewStrategyDetails(strategy)}
                       className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                     >
                       <Eye className="w-4 h-4" />
                       Ver Detalles
                     </button>
                     <button
                       onClick={() => downloadStrategyPDF(strategy)}
                       className="flex items-center justify-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                       title="Descargar PDF"
                     >
                       <Download className="w-4 h-4" />
                     </button>
                   </div>
                 </motion.div>
               ))}
             </div>
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
    </div>
  )
}
