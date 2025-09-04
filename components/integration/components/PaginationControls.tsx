import { motion } from "framer-motion"

interface PaginationControlsProps {
  displayedCount: number
  totalCount: number
  hasMore: boolean
  onLoadMore: () => void
  remainingCount: number
  strategiesPerPage: number
}

export function PaginationControls({
  displayedCount,
  totalCount,
  hasMore,
  onLoadMore,
  remainingCount,
  strategiesPerPage
}: PaginationControlsProps) {
  if (!hasMore || displayedCount === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 text-center"
    >
      {/* Contador de estrategias */}
      <div className="mb-4">
        <div className="text-sm text-gray-600">
          {displayedCount} de {totalCount} estrategias
        </div>
      </div>

      {/* Botón "Cargar más" */}
      <button
        onClick={onLoadMore}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-2">
          <span>Cargar más estrategias</span>
          <span className="text-sm opacity-75">
            ({remainingCount} restantes)
          </span>
        </div>
      </button>
      
      {/* Información de paginación */}
      <p className="text-xs text-gray-500 mt-2">
        Cargando {strategiesPerPage} estrategias por vez para mejor rendimiento
      </p>
    </motion.div>
  )
}
