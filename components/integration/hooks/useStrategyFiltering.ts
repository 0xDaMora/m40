import { useCallback, useMemo } from "react"
import { FamilyMember } from "@/types/family"
import { StrategyResult, StrategyFilters } from "@/types/strategy"

export function useStrategyFiltering() {

  // Función auxiliar para calcular SDI
  const calcularSDI = (salarioMensual: number): number => {
    const diario = salarioMensual / 30
    const factorIntegracion = 1.12 // estándar (aguinaldo + prima vacacional mínimas)
    return diario * factorIntegracion
  }

  // Función de filtrado optimizada con filtros inteligentes
  const filterStrategies = useCallback((
    strategiesToFilter: StrategyResult[], 
    filters: StrategyFilters, 
    familyMember?: FamilyMember | null
  ) => {
    if (!strategiesToFilter.length) return []

    let filtered = strategiesToFilter

    // Filtro inteligente por SDI: si el SDI del familiar es alto, solo mostrar UMAs mayores
    if (familyMember) {
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

    // Filtrar por rango de UMA o Aportación Mensual usando SOLO valores reales
    if (filters.filterMode === 'contribution' && filters.contributionRange) {
      // Filtrar por aportación mensual usando solo valores reales
      filtered = filtered.filter(s => {
        // Usar solo el valor real de inversiónTotal / mesesM40
        if (s.inversionTotal && s.mesesM40) {
          const aportacionEstrategia = s.inversionTotal / s.mesesM40
          return aportacionEstrategia >= filters.contributionRange!.min && 
                 aportacionEstrategia <= filters.contributionRange!.max
        }
        // Si no hay inversión total, excluir la estrategia del filtro
        return false
      })
    } else {
      // Filtrar por rango de UMA (modo por defecto)
      filtered = filtered.filter(s => 
        s.umaElegida >= filters.umaRange.min && 
        s.umaElegida <= filters.umaRange.max
      )
    }

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

  // Hook para aplicar filtros a estrategias
  const useFilteredStrategies = (
    strategies: StrategyResult[], 
    strategyFilters: StrategyFilters, 
    selectedFamilyMember: FamilyMember | null
  ) => {
    return useMemo(() => {
      return filterStrategies(strategies, strategyFilters, selectedFamilyMember)
    }, [strategies, strategyFilters, selectedFamilyMember, filterStrategies])
  }

  return {
    filterStrategies,
    useFilteredStrategies,
    calcularSDI
  }
}

