"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"

interface ComparativaImpactoProps {
  pensionSinM40: number
  pensionConM40: number
  inversionTotal: number
  mesesRecuperacion: number
  onContinuar: () => void
}

export default function ComparativaImpacto({ 
  pensionSinM40, 
  pensionConM40, 
  inversionTotal, 
  mesesRecuperacion, 
  onContinuar 
}: ComparativaImpactoProps) {
  const [countdown, setCountdown] = useState(8)
  const [autoAdvance, setAutoAdvance] = useState(true)
  
  const diferenciaMensual = pensionConM40 - pensionSinM40
  const diferenciaAnual = diferenciaMensual * 12
  const porcentajeMejora = Math.round((diferenciaMensual / pensionSinM40) * 100)
  
  // Auto-advance después de 8 segundos
  useEffect(() => {
    if (!autoAdvance) return
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onContinuar()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [autoAdvance, onContinuar])
  
  const handleManualContinue = () => {
    setAutoAdvance(false)
    onContinuar()
  }
  
  const formatPesos = (cantidad: number) => 
    new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(cantidad)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Header impactante */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-4"
        >
          <AlertTriangle className="w-4 h-4" />
          ¡Mira la diferencia en tu pensión!
        </motion.div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Tu situación actual vs. con Modalidad 40
        </h2>
        <p className="text-gray-600">
          Basado en tus datos reales del IMSS
        </p>
      </div>

      {/* Comparativa visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Sin Modalidad 40 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800">SIN Modalidad 40</h3>
              <p className="text-red-600 text-sm">Con tus semanas actuales</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white/80 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pensión mensual</p>
              <p className="text-2xl font-bold text-red-700">{formatPesos(pensionSinM40)}</p>
            </div>
            <div className="bg-white/80 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Ingreso anual</p>
              <p className="text-xl font-bold text-red-700">{formatPesos(pensionSinM40 * 12)}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-100 rounded-lg">
            <p className="text-red-800 text-sm font-medium">
              ⚠️ Pensión mínima garantizada
            </p>
          </div>
        </motion.div>

        {/* Con Modalidad 40 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 relative overflow-hidden"
        >
          {/* Badge de recomendado */}
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
            ⭐ RECOMENDADO
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800">CON Modalidad 40</h3>
              <p className="text-green-600 text-sm">Tu mejor estrategia</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white/80 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Pensión mensual</p>
              <p className="text-2xl font-bold text-green-700">{formatPesos(pensionConM40)}</p>
            </div>
            <div className="bg-white/80 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Ingreso anual</p>
              <p className="text-xl font-bold text-green-700">{formatPesos(pensionConM40 * 12)}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-green-800 text-sm font-medium">
              ✅ +{porcentajeMejora}% más pensión de por vida
            </p>
          </div>
        </motion.div>
      </div>

      {/* Impacto financiero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border-2 border-blue-200 rounded-xl p-6 mb-8"
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">El impacto en números</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Ganas mensualmente</p>
              <p className="text-2xl font-bold text-blue-700">+{formatPesos(diferenciaMensual)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Ganas por año</p>
              <p className="text-2xl font-bold text-blue-700">+{formatPesos(diferenciaAnual)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Inversión total</p>
              <p className="text-xl font-bold text-blue-700">{formatPesos(inversionTotal)}</p>
              <p className="text-xs text-blue-600 mt-1">Se recupera en {mesesRecuperacion} meses</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA para ver estrategias */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <p className="text-lg text-gray-700 mb-4">
          <strong>Esta mejora es impresionante.</strong> Ahora te mostraremos exactamente cómo lograrlo
        </p>
        
        {autoAdvance && countdown > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
            <p className="text-blue-800 mb-3">
              Cargando tus <strong>5 mejores estrategias personalizadas</strong>...
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 font-medium">
                Automático en {countdown} segundos
              </span>
            </div>
          </div>
        ) : null}
        
        <button
          onClick={handleManualContinue}
          className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
        >
          <CheckCircle className="w-5 h-5" />
          {autoAdvance ? 'Ver estrategias ahora' : 'Ver mis estrategias completas'}
        </button>
        <p className="text-sm text-gray-500 mt-3">
          Te mostraremos 5 estrategias optimizadas con cronogramas detallados
        </p>
      </motion.div>
    </motion.div>
  )
}