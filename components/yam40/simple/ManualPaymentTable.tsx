"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, AlertCircle } from "lucide-react"
import { MesManual } from "@/types/yam40"
import SimpleDateSelector from "./SimpleDateSelector"
import { useFormatters } from "@/hooks/useFormatters"
import { getMaxAportacionPorAño } from "@/lib/all/umaConverter"

interface ManualPaymentTableProps {
  meses: MesManual[]
  onChange: (meses: MesManual[]) => void
  currentYear?: number
}

export default function ManualPaymentTable({
  meses,
  onChange,
  currentYear = new Date().getFullYear()
}: ManualPaymentTableProps) {
  const { currency: formatCurrency } = useFormatters()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMes, setNewMes] = useState({ mes: 1, año: currentYear })
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)

  // Ordenar meses por fecha (más antiguo primero)
  const mesesOrdenados = [...meses].sort((a, b) => {
    const fechaA = a.año * 12 + a.mes
    const fechaB = b.año * 12 + b.mes
    return fechaA - fechaB
  })

  // Detectar cambios en orden para animar
  useEffect(() => {
    if (mesesOrdenados.length > 0) {
      // Encontrar el índice del mes más reciente agregado
      const lastIndex = mesesOrdenados.length - 1
      setHighlightedIndex(lastIndex)
      const timer = setTimeout(() => setHighlightedIndex(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [meses.length])

  const handleAddMes = () => {
    // Verificar si el mes ya existe
    const existe = meses.some(
      m => m.mes === newMes.mes && m.año === newMes.año
    )
    
    if (existe) {
      alert('Este mes ya está agregado')
      return
    }

    // Agregar mes sin aportación (null)
    const nuevoMes: MesManual = {
      mes: newMes.mes,
      año: newMes.año,
      aportacion: null
    }

    onChange([...meses, nuevoMes])
    setShowAddModal(false)
    setNewMes({ mes: 1, año: currentYear })
  }

  const handleRemoveMes = (index: number) => {
    const mesToRemove = mesesOrdenados[index]
    onChange(meses.filter(
      m => !(m.mes === mesToRemove.mes && m.año === mesToRemove.año)
    ))
  }

  const handleAportacionChange = (index: number, value: string) => {
    const mesToUpdate = mesesOrdenados[index]
    // Solo permitir números enteros (sin comas, puntos decimales, espacios)
    const cleaned = value.replace(/[^0-9]/g, '')
    const numericValue = cleaned === '' ? null : parseInt(cleaned, 10)
    
    const updated = meses.map(m => {
      if (m.mes === mesToUpdate.mes && m.año === mesToUpdate.año) {
        return { ...m, aportacion: isNaN(numericValue as number) ? null : numericValue }
      }
      return m
    })

    onChange(updated)
  }

  const getMaxAportacion = (año: number) => {
    return getMaxAportacionPorAño(año)
  }

  // Calcular el próximo mes consecutivo desde el último mes pagado
  const getNextMonth = (): { mes: number; año: number } | null => {
    if (mesesOrdenados.length === 0) {
      return null
    }

    // Obtener el último mes ordenado
    const ultimoMes = mesesOrdenados[mesesOrdenados.length - 1]
    let siguienteMes = ultimoMes.mes + 1
    let siguienteAño = ultimoMes.año

    // Si pasamos de diciembre, avanzar al siguiente año
    if (siguienteMes > 12) {
      siguienteMes = 1
      siguienteAño++
    }

    // Validar que no exceda el año/mes actual
    const currentMonth = new Date().getMonth() + 1
    if (siguienteAño > currentYear || (siguienteAño === currentYear && siguienteMes > currentMonth)) {
      return null
    }

    // Verificar que el mes no exista ya en la lista
    const existe = meses.some(
      m => m.mes === siguienteMes && m.año === siguienteAño
    )

    if (existe) {
      return null
    }

    return { mes: siguienteMes, año: siguienteAño }
  }

  // Agregar el próximo mes sin abrir el modal
  const handleAddNextMonth = () => {
    const proximoMes = getNextMonth()
    
    if (!proximoMes) {
      // No hay próximo mes válido (ya existe, excede límites, etc.)
      return
    }

    // Agregar mes sin aportación (null)
    const nuevoMes: MesManual = {
      mes: proximoMes.mes,
      año: proximoMes.año,
      aportacion: null
    }

    onChange([...meses, nuevoMes])
  }

  const mesesSinAportacion = mesesOrdenados.filter(m => m.aportacion === null || m.aportacion === 0)
  
  // Calcular si hay un próximo mes válido para mostrar el botón
  const proximoMesValido = getNextMonth()

  const nombresMeses = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ]

  return (
    <div className="space-y-4">
      {/* Botón agregar mes */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">
          Meses pagados ({mesesOrdenados.length})
        </h4>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar mes</span>
        </button>
      </div>

      {/* Advertencia si hay meses sin aportación */}
      {mesesSinAportacion.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold mb-1">
              {mesesSinAportacion.length} mes{mesesSinAportacion.length > 1 ? 'es' : ''} sin aportación
            </p>
            <p>
              Por favor agrega la aportación para cada mes marcado en rojo.
            </p>
          </div>
        </div>
      )}

      {/* Tabla de meses */}
      {mesesOrdenados.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          <p>No hay meses agregados aún.</p>
          <p className="text-sm mt-1">Haz clic en "Agregar mes" para comenzar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Mes/Año
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Aportación
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase w-16">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {mesesOrdenados.map((mes, index) => {
                  const faltaAportacion = mes.aportacion === null || mes.aportacion === 0
                  const maxAportacion = getMaxAportacion(mes.año)
                  const isHighlighted = highlightedIndex === index

                  return (
                    <motion.tr
                      key={`${mes.año}-${mes.mes}`}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                      }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className={`border-b border-gray-200 ${
                        faltaAportacion ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {nombresMeses[mes.mes - 1]} {mes.año}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                              $
                            </span>
                            <input
                              type="text"
                              value={mes.aportacion === null ? '' : mes.aportacion.toString()}
                              onChange={(e) => handleAportacionChange(index, e.target.value)}
                              placeholder="0"
                              className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                faltaAportacion 
                                  ? 'border-red-300 bg-red-50' 
                                  : mes.aportacion !== null && mes.aportacion > 0 && mes.aportacion <= maxAportacion
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-300'
                              }`}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            {faltaAportacion ? (
                              <p className="text-xs text-red-600">
                                Falta agregar aportación
                              </p>
                            ) : mes.aportacion !== null && mes.aportacion > 0 && mes.aportacion <= maxAportacion ? (
                              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Mes completo
                              </p>
                            ) : mes.aportacion !== null && mes.aportacion > maxAportacion ? (
                              <p className="text-xs text-red-600">
                                Excede el máximo
                              </p>
                            ) : null}
                            <p className="text-xs text-gray-500">
                              Máx: {formatCurrency(maxAportacion)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMes(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar mes"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Botón agregar próximo mes */}
      {mesesOrdenados.length > 0 && proximoMesValido && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleAddNextMonth}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar próximo mes</span>
          </button>
        </div>
      )}

      {/* Modal agregar mes */}
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Agregar mes pagado
            </h3>
            <div className="space-y-4">
              <SimpleDateSelector
                label="Mes y año del pago"
                value={newMes}
                onChange={setNewMes}
                minYear={2020}
                maxYear={currentYear}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddMes}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

