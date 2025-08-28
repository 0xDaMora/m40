"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, DollarSign, Target } from "lucide-react"

interface StepPensionObjetivoProps {
  onNext: (valor: string) => void
  defaultValue?: string
  datosUsuario?: {
    edadJubilacion: number
    semanasPrevias: number
    sdiHistorico: number
  }
}

export default function StepPensionObjetivo({ onNext, defaultValue, datosUsuario }: StepPensionObjetivoProps) {
  const [pensionObjetivo, setPensionObjetivo] = useState(defaultValue || "")
  const [custom, setCustom] = useState("")
  const [pensionMaxima, setPensionMaxima] = useState(0)

  useEffect(() => {
    if (datosUsuario) {
      // Calcular pensión máxima teórica (25 UMA, estrategia óptima)
      // Esto es una estimación simplificada
      const { edadJubilacion, semanasPrevias } = datosUsuario
      
      // UMA proyectada al año de jubilación (aprox)
      const añosHastaJubilacion = Math.max(0, edadJubilacion - 55) // Asumiendo que puede empezar M40 a los 55
      const umaFutura = 113.07 * Math.pow(1.05, añosHastaJubilacion) // 5% anual
      
      // SDI máximo (25 UMA)
      const sdiMaximo = 25 * umaFutura * 30.4
      
      // Estimación de porcentaje Ley 73 (simplificado)
      const semanasConM40 = semanasPrevias + (58 * 4.33) // Máximo M40
      const porcentajeBase = 35 // Porcentaje base aproximado
      const incrementos = Math.floor((semanasConM40 - 500) / 52) * 2 // 2% por año adicional
      const porcentajeTotal = Math.min(porcentajeBase + incrementos, 100)
      
      // Pensión base
      const pensionBase = (porcentajeTotal / 100) * sdiMaximo
      
      // Aplicar factores
      const factorEdad = edadJubilacion === 60 ? 0.75 : edadJubilacion === 65 ? 1.0 : 0.95
      const pensionFinal = pensionBase * factorEdad * 1.11 // Ley Fox
      
      setPensionMaxima(Math.round(pensionFinal))
    }
  }, [datosUsuario])

  const pensionSinM40 = 5000 // Estimación básica sin M40
  const formatNumber = (num: number) => num.toLocaleString('es-MX')

  const opciones = [
    {
      value: "basica",
      pensionMensual: Math.round(pensionSinM40 * 2),
      title: "Jubilación básica mejorada",
      description: "Duplicar tu pensión actual",
      icon: DollarSign,
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
      esfuerzo: "Bajo esfuerzo"
    },
    {
      value: "buena",
      pensionMensual: Math.round(pensionSinM40 * 3.5),
      title: "Jubilación cómoda",
      description: "Una pensión que te permita vivir bien",
      icon: Target,
      color: "bg-green-50 border-green-200 hover:border-green-400",
      esfuerzo: "Esfuerzo moderado"
    },
    {
      value: "premium",
      pensionMensual: Math.round(pensionSinM40 * 5),
      title: "Jubilación premium",
      description: "Para mantener tu estilo de vida actual",
      icon: TrendingUp,
      color: "bg-purple-50 border-purple-200 hover:border-purple-400",
      esfuerzo: "Alto esfuerzo"
    },
    {
      value: "maxima",
      pensionMensual: pensionMaxima > 0 ? pensionMaxima : 50000,
      title: "Pensión máxima posible",
      description: "El límite absoluto con 25 UMA",
      icon: TrendingUp,
      color: "bg-yellow-50 border-yellow-200 hover:border-yellow-400",
      esfuerzo: "Máximo esfuerzo"
    }
  ]

  const handleSelect = (value: string, pension: number) => {
    setPensionObjetivo(value)
    setTimeout(() => onNext(`${value}:${pension}`), 150)
  }

  const handleCustomSubmit = () => {
    if (custom && parseInt(custom) > 0) {
      onNext(`custom:${custom}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold text-blue-700 mb-4">
        ¿Con cuánto quieres jubilarte?
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Esto nos ayuda a encontrar las estrategias que te lleven a tu pensión objetivo.
      </p>

      {/* Comparativo actual */}
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-700 mb-2">Tu situación actual (sin M40):</h3>
        <p className="text-lg font-bold text-red-600">~${formatNumber(pensionSinM40)} pesos mensuales</p>
        <p className="text-sm text-red-500">Con solo tus semanas actuales</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        {opciones.map((opcion) => {
          const IconComponent = opcion.icon
          const mejora = Math.round(opcion.pensionMensual / pensionSinM40 * 10) / 10
          
          return (
            <motion.button
              key={opcion.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                pensionObjetivo === opcion.value
                  ? "border-blue-500 bg-blue-50"
                  : opcion.color
              }`}
              onClick={() => handleSelect(opcion.value, opcion.pensionMensual)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {opcion.title}
                    </h3>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ${formatNumber(opcion.pensionMensual)}
                      </p>
                      <p className="text-xs text-green-500">
                        +{mejora}x más
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {opcion.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {opcion.esfuerzo}
                    </span>
                    <span className="text-xs text-blue-600">
                      vs ${formatNumber(pensionSinM40)} actual
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Opción personalizada */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-700 mb-3">¿Tienes otro objetivo en mente?</h4>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Ej: 35000"
              min={pensionSinM40}
              max={pensionMaxima > 0 ? pensionMaxima : 100000}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleCustomSubmit()}
            />
          </div>
          <button
            onClick={handleCustomSubmit}
            disabled={!custom || parseInt(custom) <= pensionSinM40}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            OK
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Entre ${formatNumber(pensionSinM40)} y ${formatNumber(pensionMaxima > 0 ? pensionMaxima : 100000)} pesos
        </p>
      </div>

      {pensionMaxima > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Tu máximo teórico:</strong> ${formatNumber(pensionMaxima)} con 25 UMA y estrategia óptima
          </p>
        </div>
      )}
    </motion.div>
  )
}