"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Edit3 } from "lucide-react"
import SimpleDateSelector from "./SimpleDateSelector"
import PaymentMethodSelector from "./PaymentMethodSelector"
import ManualPaymentTable from "./ManualPaymentTable"
import { MesManual } from "@/types/yam40"
import { getMaxAportacionPorAño } from "@/lib/all/umaConverter"

interface PaymentModeSelectorProps {
  modo: 'rango' | 'manual'
  onModoChange: (modo: 'rango' | 'manual') => void
  
  // Props para modo rango
  fechaInicioM40: { mes: number, año: number }
  fechaFinM40: { mes: number, año: number }
  onFechaInicioChange: (fecha: { mes: number, año: number }) => void
  onFechaFinChange: (fecha: { mes: number, año: number }) => void
  paymentMethod: 'aportacion' | 'uma'
  paymentValue: number
  onPaymentChange: (method: 'aportacion' | 'uma', value: number) => void
  
  // Props para modo manual
  mesesManuales: MesManual[]
  onMesesManualesChange: (meses: MesManual[]) => void
  
  currentYear?: number
}

export default function PaymentModeSelector({
  modo,
  onModoChange,
  fechaInicioM40,
  fechaFinM40,
  onFechaInicioChange,
  onFechaFinChange,
  paymentMethod,
  paymentValue,
  onPaymentChange,
  mesesManuales,
  onMesesManualesChange,
  currentYear = new Date().getFullYear()
}: PaymentModeSelectorProps) {
  // Calcular año para validaciones (usar año de inicio para consistencia)
  // Asegurar que las fechas sean válidas antes de calcular
  const añoInicio = fechaInicioM40.año > 0 ? fechaInicioM40.año : currentYear
  const añoFin = fechaFinM40.año > 0 ? fechaFinM40.año : currentYear
  // Usar año de inicio para cálculos de máximo (más preciso que promedio)
  const añoParaCalculos = añoInicio
  const maxAportacion = getMaxAportacionPorAño(añoParaCalculos)
  
  // Debug: verificar que maxAportacion sea razonable
  if (maxAportacion < 1000) {
    console.warn('⚠️ maxAportacion parece incorrecto:', { maxAportacion, añoParaCalculos, añoInicio, añoFin })
  }

  return (
    <div className="space-y-6">
      {/* Tabs para seleccionar modo */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => onModoChange('rango')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            modo === 'rango'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Por rango</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onModoChange('manual')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            modo === 'manual'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            <span>Mes por mes</span>
          </div>
        </button>
      </div>

      {/* Contenido según modo */}
      <AnimatePresence mode="wait">
        {modo === 'rango' ? (
          <motion.div
            key="rango"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Fechas de inicio y fin */}
            <div className="grid md:grid-cols-2 gap-4">
              <SimpleDateSelector
                label="Primer pago (mes/año)"
                value={fechaInicioM40}
                onChange={onFechaInicioChange}
                minYear={2020}
                maxYear={currentYear}
              />
              <SimpleDateSelector
                label="Último pago (mes/año)"
                value={fechaFinM40}
                onChange={onFechaFinChange}
                minYear={2020}
                maxYear={currentYear}
              />
            </div>

            {/* Método de pago */}
            <PaymentMethodSelector
              value={paymentValue}
              method={paymentMethod}
              onChange={onPaymentChange}
              year={añoParaCalculos}
              min={paymentMethod === 'aportacion' ? 1000 : 1}
              max={paymentMethod === 'aportacion' ? maxAportacion : 25}
              label="¿Cómo pagaste?"
              helperText="Selecciona si pagaste una aportación fija mensual o mantuviste un UMA fijo (estrategia progresiva)"
            />
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Modo manual:</strong> Agrega cada mes que pagaste y especifica la aportación exacta de ese mes.
                Puedes agregar meses no continuos sin problema.
              </p>
            </div>
            <ManualPaymentTable
              meses={mesesManuales}
              onChange={onMesesManualesChange}
              currentYear={currentYear}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

