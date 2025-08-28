import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, BarChart3, TrendingUp } from "lucide-react"

interface StepToleranciaProps {
  onNext: (valor: string) => void
  defaultValue?: string
}

export default function StepTolerancia({ onNext, defaultValue }: StepToleranciaProps) {
  const [tolerancia, setTolerancia] = useState(defaultValue || "")

  const opciones = [
    {
      value: "conservador",
      title: "Conservador",
      description: "Prefiero estrategias seguras con UMA fijo y montos menores",
      details: "Estrategias fijas, UMA bajos a medios",
      icon: Shield,
      color: "bg-green-50 border-green-200 hover:border-green-400"
    },
    {
      value: "moderado",
      title: "Moderado",
      description: "Acepto algo de variabilidad por mejores resultados",
      details: "Mix de estrategias fijas y progresivas",
      icon: BarChart3,
      color: "bg-blue-50 border-blue-200 hover:border-blue-400"
    },
    {
      value: "agresivo",
      title: "Agresivo",
      description: "Busco maximizar rendimientos con estrategias de UMA alto",
      details: "Estrategias progresivas, UMA altos",
      icon: TrendingUp,
      color: "bg-red-50 border-red-200 hover:border-red-400"
    }
  ]

  const handleSelect = (value: string) => {
    setTolerancia(value)
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
        ¿Cuál es tu perfil de riesgo?
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        El UMA puede cambiar año con año. ¿Qué tanto riesgo estás dispuesto a tomar?
      </p>

      <div className="grid grid-cols-1 gap-4">
        {opciones.map((opcion) => {
          const IconComponent = opcion.icon
          return (
            <motion.button
              key={opcion.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                tolerancia === opcion.value
                  ? "border-blue-500 bg-blue-50"
                  : opcion.color
              }`}
              onClick={() => handleSelect(opcion.value)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {opcion.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {opcion.description}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    {opcion.details}
                  </p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}