"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Plus, Minus, Info } from "lucide-react"
import TooltipInteligente from "@/components/TooltipInteligente"

interface SimpleMonthsSelectorProps {
  value: number // Número de meses seleccionados (1-58)
  onChange: (value: number) => void
  mesesPagados?: number // Meses ya pagados (para mostrar progreso)
  maxMeses?: number // Máximo de meses disponibles (default: 58)
  label?: string
  disabled?: boolean
}

export default function SimpleMonthsSelector({
  value,
  onChange,
  mesesPagados = 0,
  maxMeses = 58,
  label = "¿Cuántos meses has pagado?",
  disabled = false
}: SimpleMonthsSelectorProps) {
  const [localValue, setLocalValue] = useState(value.toString())

  const mesesDisponibles = maxMeses - mesesPagados
  const mesesRestantes = maxMeses - value

  const handleIncrement = () => {
    const newValue = Math.min(value + 1, maxMeses)
    setLocalValue(newValue.toString())
    onChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max(1, value - 1)
    setLocalValue(newValue.toString())
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    
    const numericValue = parseInt(newValue)
    if (!isNaN(numericValue)) {
      if (numericValue >= 1 && numericValue <= maxMeses) {
        onChange(numericValue)
      } else if (numericValue > maxMeses) {
        onChange(maxMeses)
        setLocalValue(maxMeses.toString())
      } else if (numericValue < 1 && numericValue > 0) {
        onChange(1)
        setLocalValue('1')
      }
    }
  }

  const handleInputBlur = () => {
    const numericValue = parseInt(localValue)
    if (isNaN(numericValue) || numericValue < 1) {
      setLocalValue('1')
      onChange(1)
    } else if (numericValue > maxMeses) {
      setLocalValue(maxMeses.toString())
      onChange(maxMeses)
    } else {
      setLocalValue(numericValue.toString())
      onChange(numericValue)
    }
  }

  const porcentajeCompletado = (value / maxMeses) * 100

  return (
    <div className="space-y-4">
      <label className="block">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-lg font-semibold text-gray-900">{label}</span>
          <TooltipInteligente termino="Meses Modalidad 40">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
          </TooltipInteligente>
        </div>
      </label>

      {/* Selector con botones */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= 1}
          className="w-12 h-12 rounded-xl border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex-1 text-center">
          <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={1}
            max={maxMeses}
            disabled={disabled}
            className="text-4xl font-bold text-center border-none focus:outline-none disabled:opacity-50 w-full bg-transparent"
          />
          <div className="text-sm text-gray-500 mt-1">
            de {maxMeses} meses
          </div>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= maxMeses}
          className="w-12 h-12 rounded-xl border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Barra de progreso visual */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progreso</span>
          <span className="font-semibold text-gray-900">
            {value} de {maxMeses} meses ({Math.round(porcentajeCompletado)}%)
          </span>
        </div>
        
        <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          {/* Meses pagados (si existen) */}
          {mesesPagados > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(mesesPagados / maxMeses) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="absolute left-0 top-0 h-full bg-green-500"
              title={`${mesesPagados} meses ya pagados`}
            />
          )}
          
          {/* Meses seleccionados */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${porcentajeCompletado}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full ${mesesPagados > 0 ? 'bg-blue-500' : 'bg-blue-600'} rounded-full`}
            style={{
              marginLeft: mesesPagados > 0 ? `${(mesesPagados / maxMeses) * 100}%` : '0%'
            }}
          />
        </div>

        {/* Información adicional */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {mesesPagados > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>{mesesPagados} meses ya pagados</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>{value - mesesPagados} meses seleccionados</span>
          </div>
          {mesesRestantes > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>{mesesRestantes} meses restantes</span>
            </div>
          )}
        </div>
      </div>

      {/* Información contextual */}
      {mesesPagados > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Ya tienes {mesesPagados} meses pagados</p>
              <p>
                Puedes agregar hasta {mesesDisponibles} meses más para completar los 58 meses de Modalidad 40.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advertencia si está cerca del límite */}
      {value >= maxMeses && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold">Has alcanzado el máximo</p>
              <p>El límite legal de Modalidad 40 es de {maxMeses} meses (250 semanas).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

