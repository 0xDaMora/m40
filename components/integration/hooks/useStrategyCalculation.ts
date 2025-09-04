import { useState } from "react"
import toast from "react-hot-toast"
import { FamilyMember } from "@/types/family"
import { StrategyResult, FamilyMemberData, IntegrationFilters } from "@/types/strategy"
import { calcularSDI, calcularSDIEnUMAs, validateFamilyMember } from "../utils/calculations"

export function useStrategyCalculation() {
  // Estados
  const [strategies, setStrategies] = useState<StrategyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadTime, setLoadTime] = useState<number | null>(null)

  // Validar familiar antes del cálculo con mensajes de error
  const validateFamilyMemberWithToast = (familyMember: FamilyMember): boolean => {
    if (!validateFamilyMember(familyMember)) {
      if (familyMember.weeksContributed < 500) {
        toast.error('El familiar debe tener al menos 500 semanas cotizadas según la LEY 73 del IMSS')
      } else if (familyMember.lastGrossSalary <= 0) {
        toast.error('El salario bruto debe ser mayor a 0')
      } else {
        toast.error('El SDI no puede ser mayor a 25 UMAs según la ley')
      }
      return false
    }
    return true
  }

  // Calcular estrategias con validaciones y optimizaciones
  const calculateStrategies = async (
    selectedFamilyMember: FamilyMember | null, 
    filters: IntegrationFilters
  ) => {
    if (!selectedFamilyMember) return

    // Validaciones previas
    if (!validateFamilyMemberWithToast(selectedFamilyMember)) {
      return
    }

    const sdi = calcularSDI(selectedFamilyMember.lastGrossSalary)
    const sdiEnUMAs = calcularSDIEnUMAs(selectedFamilyMember.lastGrossSalary)

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

  // Resetear estrategias
  const resetStrategies = () => {
    setStrategies([])
    setLoadTime(null)
  }

  return {
    // Estados
    strategies,
    loading,
    loadTime,

    // Acciones
    calculateStrategies,
    resetStrategies,
    calcularSDI,
    validateFamilyMember: validateFamilyMemberWithToast,

    // Setters para casos especiales
    setStrategies,
    setLoading,
    setLoadTime
  }
}

