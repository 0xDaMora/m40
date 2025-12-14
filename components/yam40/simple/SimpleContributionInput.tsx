"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DollarSign, Info } from "lucide-react"
import { getUMARange, getMaxAportacion, getMaxAportacionPorAño, aportacionToUMA } from "@/lib/all/umaConverter"
import { getUMA, getTasaM40 } from "@/lib/all/constants"
import { useFormatters } from "@/hooks/useFormatters"
import TooltipInteligente from "@/components/TooltipInteligente"

interface SimpleContributionInputProps {
  value: number // Aportación mensual en pesos
  onChange: (value: number) => void
  year?: number // Año para cálculos (default: año actual)
  label?: string
  helperText?: string
  min?: number
  max?: number
}

export default function SimpleContributionInput({
  value,
  onChange,
  year,
  label = "¿Cuánto pagas al mes?",
  helperText,
  min,
  max,
  ...props
}: SimpleContributionInputProps) {
  const { currency: formatCurrency } = useFormatters()
  const currentYear = year || new Date().getFullYear()
  const [localValue, setLocalValue] = useState(value.toString().replace(/,/g, ''))
  const [umaEquivalente, setUmaEquivalente] = useState<number | null>(null)
  const [error, setError] = useState<string>("")

  // Calcular máximo permitido si no se especifica (usar límite estricto de 25 UMA)
  const maxAportacionLegal = getMaxAportacionPorAño(currentYear)
  const maxAportacion = max || maxAportacionLegal
  const minAportacion = min || 1000

  // Calcular UMA equivalente y validar límite cuando cambia el valor
  useEffect(() => {
    // Remover comas y espacios del valor local
    const cleanedValue = localValue.replace(/[, ]/g, '')
    const numericValue = parseFloat(cleanedValue)
    
    if (!isNaN(numericValue) && numericValue > 0) {
      // Convertir aportación a UMA
      const umaCalculada = aportacionToUMA(numericValue, currentYear)
      setUmaEquivalente(Math.round(umaCalculada * 10) / 10) // Redondear a 1 decimal
      
      // Validar límite de 25 UMA
      if (umaCalculada > 25) {
        setError(`El máximo permitido es 25 UMA (${formatCurrency(maxAportacionLegal)} este año)`)
      } else if (numericValue > maxAportacion) {
        setError(`El máximo permitido es ${formatCurrency(maxAportacion)}`)
      } else if (numericValue < minAportacion) {
        setError(`El mínimo permitido es ${formatCurrency(minAportacion)}`)
      } else {
        setError("")
      }
    } else {
      setUmaEquivalente(null)
      setError("")
    }
  }, [localValue, currentYear, maxAportacion, maxAportacionLegal, minAportacion, formatCurrency])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    
    // Remover comas y espacios, permitir solo números y un punto decimal
    newValue = newValue.replace(/[, ]/g, '')
    
    // Validar que solo contenga números y un punto decimal opcional
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      setLocalValue(newValue)
      
      const numericValue = parseFloat(newValue)
      if (!isNaN(numericValue) && numericValue > 0) {
        // Validar límite de 25 UMA primero
        const umaCalculada = aportacionToUMA(numericValue, currentYear)
        if (umaCalculada <= 25 && numericValue >= minAportacion && numericValue <= maxAportacion) {
          onChange(numericValue)
        }
      } else if (newValue === '') {
        onChange(0)
      }
    }
  }

  const handleBlur = () => {
    const cleanedValue = localValue.replace(/[, ]/g, '')
    const numericValue = parseFloat(cleanedValue)
    
    if (isNaN(numericValue) || numericValue < minAportacion) {
      setLocalValue(minAportacion.toString())
      onChange(minAportacion)
    } else {
      // Validar límite de 25 UMA
      const umaCalculada = aportacionToUMA(numericValue, currentYear)
      if (umaCalculada > 25) {
        setLocalValue(maxAportacionLegal.toString())
        onChange(maxAportacionLegal)
      } else if (numericValue > maxAportacion) {
        setLocalValue(maxAportacion.toString())
        onChange(maxAportacion)
      } else {
        setLocalValue(numericValue.toString())
        onChange(numericValue)
      }
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span className="text-lg font-semibold text-gray-900">{label}</span>
          <TooltipInteligente termino="Aportación mensual">
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
          </TooltipInteligente>
        </div>
        {helperText && (
          <p className="text-sm text-gray-600 mb-3">{helperText}</p>
        )}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
          $
        </div>
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full pl-8 pr-4 py-4 text-2xl font-bold border-2 rounded-xl focus:ring-2 transition-all ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
          }`}
          placeholder="0"
          {...props}
        />
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 px-4 py-3 rounded-lg border border-red-200"
        >
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Información adicional */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {umaEquivalente !== null && umaEquivalente > 0 && !error && (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
            <span className="text-gray-600">Equivale a:</span>
            <span className="font-semibold text-blue-700">
              {umaEquivalente.toFixed(1)} UMA
            </span>
            <TooltipInteligente termino="UMA">
              <Info className="w-4 h-4 text-blue-500 cursor-help" />
            </TooltipInteligente>
          </div>
        )}
        
        <div className="text-gray-500">
          Rango: {formatCurrency(minAportacion)} - {formatCurrency(maxAportacion)}
        </div>
      </div>

      {/* Barra de rango visual */}
      <div className="relative">
        <input
          type="range"
          min={minAportacion}
          max={maxAportacion}
          step="100"
          value={parseFloat(localValue) || minAportacion}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            setLocalValue(val.toString())
            onChange(val)
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatCurrency(minAportacion)}</span>
          <span>{formatCurrency(maxAportacion)}</span>
        </div>
      </div>
    </div>
  )
}

