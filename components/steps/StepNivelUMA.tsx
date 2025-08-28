"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, BarChart3, TrendingUp } from "lucide-react"

interface StepNivelUMAProps {
  onNext: (valor: string) => void
  defaultValue?: string
}

export default function StepNivelUMA({ onNext, defaultValue }: StepNivelUMAProps) {
  const [nivelUMA, setNivelUMA] = useState(defaultValue || "")

  const opciones = [
    {
      value: "conservador",
      title: "Nivel conservador (1-10 UMA)",
      description: "Estrategias seguras con pagos menores y riesgo mínimo",
      rangoUMA: "1-10 UMA",
      pagoEjemplo: "$2,000 - $7,000/mes",
      ventajas: ["✅ Pagos muy manejables", "✅ Riesgo mínimo", "✅ Fácil de sostener"],
      consideraciones: ["📊 Pensión moderada", "⏱️ Puede requerir más tiempo"],
      icon: Shield,
      color: "bg-green-50 border-green-200 hover:border-green-400",
      riesgo: "Muy bajo"
    },
    {
      value: "equilibrado",
      title: "Nivel equilibrado (10-18 UMA)",
      description: "El punto dulce entre beneficios y pagos razonables",
      rangoUMA: "10-18 UMA",
      pagoEjemplo: "$7,000 - $12,000/mes",
      ventajas: ["✅ Buena relación costo-beneficio", "✅ Pagos manejables", "✅ Pensión atractiva"],
      consideraciones: ["📊 Requiere planificación", "⏱️ Compromiso financiero medio"],
      icon: BarChart3,
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
      riesgo: "Moderado"
    },
    {
      value: "maximo",
      title: "Máximo posible (18-25 UMA)",
      description: "Estrategias para maximizar tu pensión al límite legal",
      rangoUMA: "18-25 UMA",
      pagoEjemplo: "$12,000 - $18,000/mes",
      ventajas: ["✅ Pensión máxima posible", "✅ Mayor ROI a largo plazo", "✅ Aprovecha límites legales"],
      consideraciones: ["💰 Pagos altos", "⚠️ Mayor compromiso financiero", "📈 Requiere estabilidad"],
      icon: TrendingUp,
      color: "bg-purple-50 border-purple-200 hover:border-purple-400",
      riesgo: "Alto compromiso"
    }
  ]

  const handleSelect = (value: string) => {
    setNivelUMA(value)
    setTimeout(() => onNext(value), 150)
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
        ¿Qué nivel de UMA buscas?
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        La UMA determina tu base salarial en M40. Más UMA = mayor pensión, pero también mayores pagos mensuales.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {opciones.map((opcion) => {
          const IconComponent = opcion.icon
          
          return (
            <motion.button
              key={opcion.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-5 rounded-lg border-2 text-left transition-all ${
                nivelUMA === opcion.value
                  ? "border-blue-500 bg-blue-50"
                  : opcion.color
              }`}
              onClick={() => handleSelect(opcion.value)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <IconComponent className="w-7 h-7 text-blue-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {opcion.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      opcion.riesgo === 'Muy bajo' ? 'bg-green-100 text-green-700' :
                      opcion.riesgo === 'Moderado' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {opcion.riesgo}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">
                    {opcion.description}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Rango UMA:</p>
                      <p className="font-semibold text-gray-800">{opcion.rangoUMA}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Pago estimado:</p>
                      <p className="font-semibold text-gray-800">{opcion.pagoEjemplo}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <h5 className="text-xs font-semibold text-green-600 mb-2">VENTAJAS:</h5>
                      <ul className="text-xs text-green-600 space-y-1">
                        {opcion.ventajas.map((ventaja, i) => (
                          <li key={i}>{ventaja}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-blue-600 mb-2">A CONSIDERAR:</h5>
                      <ul className="text-xs text-blue-600 space-y-1">
                        {opcion.consideraciones.map((consideracion, i) => (
                          <li key={i}>{consideracion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💡 ¿Cómo elegir?</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>¿Primera vez en M40?</strong> Empieza con nivel equilibrado</p>
          <p>• <strong>¿Ingresos variables?</strong> Mejor nivel conservador</p>
          <p>• <strong>¿Ingresos altos y estables?</strong> Considera el máximo posible</p>
          <p>• <strong>¿Cerca de los 60?</strong> Evalúa nivel equilibrado o máximo</p>
        </div>
      </div>
    </motion.div>
  )
}