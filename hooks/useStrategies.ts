/**
 * Hook personalizado para manejo de estrategias
 */

import { useState, useCallback, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { StrategyResult, IntegrationFilters, StrategyFilters } from '@/types/strategy'
import { FamilyMember } from '@/types/family'

export const useStrategies = () => {
  const [strategies, setStrategies] = useState<StrategyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadTime, setLoadTime] = useState<number | null>(null)

  // Estados para paginación
  const [displayedStrategies, setDisplayedStrategies] = useState<StrategyResult[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [strategiesPerPage] = useState(50)
  const [hasMoreStrategies, setHasMoreStrategies] = useState(true)

  // Calcular estrategias
  const calculateStrategies = useCallback(async (
    familyData: any,
    filters: IntegrationFilters
  ) => {
    const startTime = performance.now()
    setLoading(true)
    
    try {
      const response = await fetch('/api/calculate-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyData, filters })
      })

      if (response.ok) {
        const data = await response.json()
        setStrategies(data.strategies)
        
        if (data.strategies.length === 0) {
          toast.error('No se encontraron estrategias válidas con los filtros actuales')
        } else {
          const endTime = performance.now()
          const loadTimeMs = Math.round(endTime - startTime)
          setLoadTime(loadTimeMs)
          console.log(`Se calcularon ${data.strategies.length} estrategias en ${loadTimeMs}ms`)
        }
        
        return data.strategies
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Error al calcular estrategias')
        return []
      }
    } catch (error) {
      console.error('Error al calcular estrategias:', error)
      toast.error('Error inesperado al calcular estrategias')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrar estrategias
  const filterStrategies = useCallback((
    strategiesToFilter: StrategyResult[],
    filters: StrategyFilters,
    familyMember: FamilyMember | null
  ) => {
    let filtered = strategiesToFilter

    // Filtro inteligente por SDI
    if (familyMember) {
      const { calcularSDI } = require('@/lib/utils/calculations')
      const sdiFamiliar = calcularSDI(familyMember.lastGrossSalary)
      const uma2025 = 113.07
      const sdiEnUMAs = sdiFamiliar / uma2025
      const umaMinima = Math.ceil(sdiEnUMAs)
      
      filtered = filtered.filter(s => s.umaElegida >= umaMinima)
      
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

    // Ordenar
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

  // Cargar más estrategias
  const loadMoreStrategies = useCallback(() => {
    setCurrentPage(prev => prev + 1)
  }, [])

  // Resetear paginación
  const resetPagination = useCallback(() => {
    setCurrentPage(1)
    setDisplayedStrategies([])
    setHasMoreStrategies(true)
  }, [])

  return {
    strategies,
    displayedStrategies,
    loading,
    loadTime,
    currentPage,
    hasMoreStrategies,
    calculateStrategies,
    filterStrategies,
    loadMoreStrategies,
    resetPagination,
    setDisplayedStrategies,
    setHasMoreStrategies
  }
}
