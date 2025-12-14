"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"

interface SimpleDateSelectorProps {
  label?: string
  value: { mes: number; año: number }
  onChange: (value: { mes: number; año: number }) => void
  minYear?: number
  minMonth?: number
  maxYear?: number
  maxMonth?: number
  error?: string
}

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export default function SimpleDateSelector({
  label,
  value,
  onChange,
  minYear = 2020,
  minMonth = 1,
  maxYear,
  maxMonth,
  error
}: SimpleDateSelectorProps) {
  const currentYear = maxYear || new Date().getFullYear()
  const currentMonth = maxMonth || new Date().getMonth() + 1
  
  // Filtrar años permitidos
  const añosPermitidos = Array.from({ length: currentYear - minYear + 1 }, (_, i) => minYear + i)
    .filter(año => {
      if (maxYear && año > maxYear) return false
      return true
    })

  // Obtener meses permitidos para un año específico
  const getMesesPermitidos = (año: number) => {
    return meses.map((_, index) => {
      const mesNum = index + 1
      // Validar límites
      if (año === minYear && mesNum < minMonth) {
        return null
      }
      if (maxYear && año === maxYear && maxMonth && mesNum > maxMonth) {
        return null
      }
      if (año === currentYear && mesNum > currentMonth) {
        return null
      }
      return { mesNum, nombre: meses[index] }
    }).filter(m => m !== null) as Array<{ mesNum: number; nombre: string }>
  }

  const handleMesChange = (mes: number) => {
    // Validar límites
    if (value.año === minYear && mes < minMonth) {
      return
    }
    if (maxYear && value.año === maxYear && maxMonth && mes > maxMonth) {
      return
    }
    if (value.año === currentYear && mes > currentMonth) {
      return
    }
    onChange({ ...value, mes })
  }

  const handleAñoChange = (año: number) => {
    let mes = value.mes
    const mesesPermitidos = getMesesPermitidos(año)
    
    // Si el mes actual no está permitido, usar el primer mes permitido
    if (!mesesPermitidos.find(m => m.mesNum === mes)) {
      mes = mesesPermitidos[0]?.mesNum || minMonth
    }
    
    onChange({ mes, año })
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{label}</span>
        </div>
      </label>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Selector de Mes */}
        <div>
          <select
            value={value.mes}
            onChange={(e) => handleMesChange(Number(e.target.value))}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {getMesesPermitidos(value.año).map(({ mesNum, nombre }) => (
              <option key={mesNum} value={mesNum}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Año */}
        <div>
          <select
            value={value.año}
            onChange={(e) => handleAñoChange(Number(e.target.value))}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {añosPermitidos.map((año) => (
              <option key={año} value={año}>
                {año}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}

      {/* Mostrar fecha seleccionada */}
      <div className="text-sm text-gray-600 mt-2">
        Seleccionado: {meses[value.mes - 1]} {value.año}
      </div>
    </div>
  )
}

