"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DollarSign, TrendingUp, Info } from "lucide-react"
import { aportacionToUMA, umaToAportacion, getMaxAportacionPorAño } from "@/lib/all/umaConverter"
import { useFormatters } from "@/hooks/useFormatters"
import TooltipInteligente from "@/components/TooltipInteligente"

type PaymentMethod = 'aportacion' | 'uma'

interface PaymentMethodSelectorProps {
  value: number // Valor en aportación o UMA según el método
  method: PaymentMethod
  onChange: (value: number, method: PaymentMethod) => void
  year: number // Año para cálculos
  min?: number
  max?: number
  label?: string
  helperText?: string
  disableMethodChange?: boolean // Si es true, deshabilita el cambio de método
  disabled?: boolean // Si es true, deshabilita completamente el input
}

export default function PaymentMethodSelector({
  value,
  method: initialMethod,
  onChange,
  year,
  min,
  max,
  label = "Método de pago",
  helperText,
  disableMethodChange = false,
  disabled = false
}: PaymentMethodSelectorProps) {
  const { currency: formatCurrency } = useFormatters()
  const [method, setMethod] = useState<PaymentMethod>(initialMethod)
  const [localValue, setLocalValue] = useState(value.toString())
  const [error, setError] = useState<string>("")

  // Sincronizar localValue con el prop value cuando cambia desde el padre
  // Solo actualizar si el valor realmente cambió para evitar loops
  useEffect(() => {
    const currentNumeric = parseFloat(localValue)
    const propNumeric = value
    // Solo actualizar si hay una diferencia significativa (más de 0.01 para evitar problemas de precisión)
    if (Math.abs(currentNumeric - propNumeric) > 0.01) {
      setLocalValue(value.toString())
    }
  }, [value])

  // Sincronizar method con el prop initialMethod cuando cambia desde el padre
  useEffect(() => {
    if (initialMethod !== method) {
      // Si el método cambió desde el padre, necesitamos convertir el valor actual
      const numericValue = parseFloat(localValue)
      if (!isNaN(numericValue) && numericValue > 0) {
        let convertedValue: number
        if (method === 'aportacion' && initialMethod === 'uma') {
          // Convertir aportación a UMA
          convertedValue = aportacionToUMA(numericValue, year)
        } else if (method === 'uma' && initialMethod === 'aportacion') {
          // Convertir UMA a aportación
          convertedValue = umaToAportacion(numericValue, year)
        } else {
          convertedValue = numericValue
        }
        
        // Redondear según el método
        if (initialMethod === 'aportacion') {
          convertedValue = Math.round(convertedValue)
        } else {
          convertedValue = Math.round(convertedValue * 100) / 100
        }
        
        setLocalValue(convertedValue.toString())
        setMethod(initialMethod)
        // No llamar onChange aquí para evitar loops, el padre ya sabe el cambio
      } else {
        setMethod(initialMethod)
      }
    }
  }, [initialMethod, method, localValue, year])

  // Calcular conversión cuando cambia el método o valor
  useEffect(() => {
    const numericValue = parseFloat(localValue)
    if (isNaN(numericValue) || numericValue <= 0) {
      setError("")
      return
    }

    if (method === 'aportacion') {
      // Validar aportación contra el máximo permitido
      // Usar getMaxAportacionPorAño para consistencia y evitar problemas de precisión
      const maxAportacion = getMaxAportacionPorAño(year)
      
      // Validar directamente contra el máximo (con pequeña tolerancia para errores de redondeo)
      // Permitir hasta 1 peso más para compensar errores de redondeo
      if (numericValue > maxAportacion + 1) {
        setError(`El máximo permitido es 25 UMA (${formatCurrency(maxAportacion)} para ${year})`)
        return
      }
      
      // Validar también contra el prop max si es razonable (mayor a 1000)
      if (max && max > 1000 && numericValue > max + 1) {
        setError(`El máximo permitido es ${formatCurrency(max)}`)
        return
      }
      if (min && numericValue < min) {
        setError(`El mínimo permitido es ${formatCurrency(min)}`)
        return
      }
    } else {
      // Validar UMA
      if (numericValue > 25) {
        setError("El máximo permitido es 25 UMA")
        return
      }
      if (numericValue < 1) {
        setError("El mínimo permitido es 1 UMA")
        return
      }
    }

    setError("")
  }, [localValue, method, year, min, max, formatCurrency])

  const handleMethodChange = (newMethod: PaymentMethod) => {
    const numericValue = parseFloat(localValue)
    if (isNaN(numericValue) || numericValue <= 0) {
      setMethod(newMethod)
      return
    }

    let convertedValue: number
    if (method === 'aportacion' && newMethod === 'uma') {
      // Convertir aportación a UMA
      convertedValue = aportacionToUMA(numericValue, year)
      console.log(`[PaymentMethodSelector] Conversión: ${numericValue} aportación → ${convertedValue} UMA (año: ${year})`)
      // Redondear a 2 decimales para UMA
      convertedValue = Math.round(convertedValue * 100) / 100
    } else if (method === 'uma' && newMethod === 'aportacion') {
      // Convertir UMA a aportación
      convertedValue = umaToAportacion(numericValue, year)
      console.log(`[PaymentMethodSelector] Conversión: ${numericValue} UMA → ${convertedValue} aportación (año: ${year})`)
      // Redondear a entero para aportación
      convertedValue = Math.round(convertedValue)
    } else {
      convertedValue = numericValue
    }

    // Actualizar el valor local y el método
    const formattedValue = newMethod === 'aportacion' 
      ? Math.round(convertedValue).toString()
      : convertedValue.toFixed(2)
    
    setLocalValue(formattedValue)
    setMethod(newMethod)
    onChange(convertedValue, newMethod)
  }

  const handleValueChange = (newValue: string) => {
    // Remover comas y espacios
    const cleaned = newValue.replace(/[, ]/g, '')
    setLocalValue(cleaned)
    
    const numericValue = parseFloat(cleaned)
    if (!isNaN(numericValue) && numericValue > 0) {
      onChange(numericValue, method)
    }
  }

  const getConvertedValue = () => {
    const numericValue = parseFloat(localValue)
    if (isNaN(numericValue) || numericValue <= 0) return null

    if (method === 'aportacion') {
      const uma = aportacionToUMA(numericValue, year)
      return { type: 'uma', value: uma }
    } else {
      const aportacion = umaToAportacion(numericValue, year)
      return { type: 'aportacion', value: aportacion }
    }
  }

  const converted = getConvertedValue()

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        {helperText && (
          <p className="text-sm text-gray-600 mb-3">{helperText}</p>
        )}
      </div>

      {/* Tabs para seleccionar método */}
      {!disableMethodChange && !disabled && (
        <div className="flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => handleMethodChange('aportacion')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              method === 'aportacion'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Aportación fija</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange('uma')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              method === 'uma'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>UMA fijo</span>
              <TooltipInteligente termino="UMA" asSpan={true}>
                <Info className="w-3 h-3 text-gray-400" />
              </TooltipInteligente>
            </div>
          </button>
        </div>
      )}
      {(disableMethodChange || disabled) && (
        <div className="mb-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg ${
            disabled 
              ? 'bg-gray-50 border-gray-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <span className={`text-sm font-medium ${
              disabled ? 'text-gray-600' : 'text-blue-700'
            }`}>
              {method === 'aportacion' ? 'Aportación Fija' : 'UMA Fijo'}
            </span>
          </div>
        </div>
      )}

      {/* Input según método seleccionado */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
          {method === 'aportacion' ? '$' : ''}
        </div>
        <input
          type="text"
          value={localValue}
          onChange={(e) => !disabled && handleValueChange(e.target.value)}
          onBlur={() => {
            if (!disabled) {
              const numericValue = parseFloat(localValue)
              if (isNaN(numericValue) || numericValue <= 0) {
                setLocalValue(value.toString())
              }
            }
          }}
          disabled={disabled}
          readOnly={disabled}
          className={`w-full pl-8 pr-4 py-4 text-2xl font-bold border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
          placeholder={method === 'aportacion' ? "0" : "1"}
        />
        {method === 'uma' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
            UMA
          </div>
        )}
      </div>

      {/* Mostrar conversión */}
      {converted && !error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 px-4 py-3 rounded-lg"
        >
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700">
              Equivale a:{" "}
              <span className="font-semibold text-blue-700">
                {converted.type === 'uma'
                  ? `${converted.value.toFixed(1)} UMA`
                  : formatCurrency(converted.value)}
              </span>
            </span>
          </div>
        </motion.div>
      )}

      {/* Mostrar error */}
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
      {method === 'uma' && (
        <div className="bg-gray-50 px-4 py-3 rounded-lg">
          <p className="text-xs text-gray-600">
            Con UMA fijo, tu aportación aumentará cada año según el crecimiento del UMA (5% anual).
            Esto es una estrategia progresiva.
          </p>
        </div>
      )}
    </div>
  )
}

