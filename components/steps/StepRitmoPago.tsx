"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, Clock, Gauge } from "lucide-react"

interface StepRitmoPagoProps {
  onNext: (valor: string) => void
  defaultValue?: string
}

export default function StepRitmoPago({ onNext, defaultValue }: StepRitmoPagoProps) {
  const [ritmo, setRitmo] = useState(defaultValue || "")

  const opciones = [
    {
      value: "intensivo",
      title: "Pagos grandes, tiempo corto",
      description: "Quiero terminar rápido aunque pague más cada mes",
      ejemplo: "Ejemplo: $15,000/mes por 24 meses",
      ventajas: ["✅ Terminas rápido", "✅ Menos riesgo de cambios de ley", "✅ Recuperas inversión pronto"],
      desventajas: ["❌ Pagos mensuales altos", "❌ Mayor impacto en presupuesto"],
      icon: Zap,
      color: "bg-red-50 border-red-200 hover:border-red-400",
      tiempo: "1-3 años",
      pago: "Alto"
    },
    {
      value: "equilibrado",
      title: "Balance entre tiempo y pago",
      description: "Un punto medio que me permita manejar bien mis finanzas",
      ejemplo: "Ejemplo: $8,000/mes por 48 meses",
      ventajas: ["✅ Pagos manejables", "✅ Tiempo razonable", "✅ Flexibilidad"],
      desventajas: ["❌ Tiempo medio", "❌ Exposición media a cambios"],
      icon: Gauge,
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
      tiempo: "3-5 años",
      pago: "Moderado"
    },
    {
      value: "relajado",
      title: "Pagos pequeños, tiempo largo",
      description: "Prefiero pagar poco cada mes aunque tarde más tiempo",
      ejemplo: "Ejemplo: $4,000/mes por 58 meses",
      ventajas: ["✅ Pagos muy bajos", "✅ Menor impacto financiero", "✅ Más tiempo para ahorrar"],
      desventajas: ["❌ Proceso muy largo", "❌ Mayor riesgo de cambios", "❌ Recuperación más lenta"],
      icon: Clock,
      color: "bg-green-50 border-green-200 hover:border-green-400",
      tiempo: "4-5 años",
      pago: "Bajo"
    }
  ]

  const handleSelect = (value: string) => {
    setRitmo(value)
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
        ¿Cómo prefieres hacer los pagos?
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Esto determina si verás estrategias de pagos altos por poco tiempo o pagos bajos por más tiempo.
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
                ritmo === opcion.value
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
                    <div className="text-right">
                      <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {opcion.tiempo}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">
                    {opcion.description}
                  </p>
                  
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <p className="text-sm font-medium text-blue-700">
                      {opcion.ejemplo}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <h5 className="text-xs font-semibold text-green-600 mb-1">VENTAJAS:</h5>
                      <ul className="text-xs text-green-600 space-y-1">
                        {opcion.ventajas.map((ventaja, i) => (
                          <li key={i}>{ventaja}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-red-600 mb-1">CONSIDERACIONES:</h5>
                      <ul className="text-xs text-red-600 space-y-1">
                        {opcion.desventajas.map((desventaja, i) => (
                          <li key={i}>{desventaja}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Pago mensual:</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      opcion.pago === 'Alto' ? 'bg-red-100 text-red-600' :
                      opcion.pago === 'Moderado' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {opcion.pago}
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-700">
          💡 <strong>Recomendación:</strong> Si tienes estabilidad financiera, los pagos intensivos suelen ser más eficientes. 
          Si prefieres flexibilidad, los pagos relajados te dan más margen de maniobra.
        </p>
      </div>
    </motion.div>
  )
}