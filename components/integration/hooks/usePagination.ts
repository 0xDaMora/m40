import { useState, useEffect, useMemo } from "react"
import { StrategyResult, StrategyFilters } from "@/types/strategy"

interface UsePaginationProps {
  strategies: StrategyResult[]
  strategiesPerPage?: number
}

export function usePagination({ strategies, strategiesPerPage = 50 }: UsePaginationProps) {
  // Estados para paginación
  const [displayedStrategies, setDisplayedStrategies] = useState<StrategyResult[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMoreStrategies, setHasMoreStrategies] = useState(true)

  // Calcular estrategias paginadas
  const paginatedStrategies = useMemo(() => {
    const startIndex = 0
    const endIndex = currentPage * strategiesPerPage

    return strategies.slice(startIndex, endIndex)
  }, [strategies, currentPage, strategiesPerPage])

  // Actualizar estrategias mostradas cuando cambien las filtradas
  useEffect(() => {
    setDisplayedStrategies(paginatedStrategies)
    setHasMoreStrategies(paginatedStrategies.length < strategies.length)
  }, [paginatedStrategies, strategies.length])

  // Resetear página cuando cambien las estrategias base
  useEffect(() => {
    setCurrentPage(1)
  }, [strategies])

  // Función para cargar más estrategias
  const loadMoreStrategies = () => {
    setCurrentPage(prev => prev + 1)
  }

  // Resetear paginación
  const resetPagination = () => {
    setCurrentPage(1)
    setDisplayedStrategies([])
    setHasMoreStrategies(true)
  }

  return {
    // Estados
    displayedStrategies,
    currentPage,
    hasMoreStrategies,
    strategiesPerPage,

    // Acciones
    loadMoreStrategies,
    resetPagination,

    // Información derivada
    totalStrategies: strategies.length,
    remainingStrategies: strategies.length - displayedStrategies.length
  }
}

