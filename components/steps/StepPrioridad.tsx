import { useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, DollarSign, Scale, Clock } from "lucide-react"

interface StepPrioridadProps {
  onNext: (valor: string) => void
  defaultValue?: string
}

export default function StepPrioridad({ onNext, defaultValue }: StepPrioridadProps) {
  const [prioridad, setPrioridad] = useState(defaultValue || "")

  const opciones = [
    {
      value: "pension_maxima",
      title: "Maximizar mi pensión",
      description: "Quiero la pensión mensual más alta posible",
      icon: TrendingUp,
      color: "bg-green-50 border-green-200 hover:border-green-400"
    },
    {
      value: "inversion_minima",
      title: "Minimizar mi inversión",
      description: "Quiero invertir lo menos posible",
      icon: DollarSign,
      color: "bg-blue-50 border-blue-200 hover:border-blue-400"
    },
    {
      value: "balance",
      title: "Balance entre ambos",
      description: "Una buena pensión sin invertir demasiado",
      icon: Scale,
      color: "bg-purple-50 border-purple-200 hover:border-purple-400"
    },
    {
      value: "recuperacion_rapida",
      title: "Recuperar inversión rápido",
      description: "Priorizo recuperar mi dinero en pocos años",
      icon: Clock,
      color: "bg-orange-50 border-orange-200 hover:border-orange-400"
    }
  ]

  const handleSelect = (value: string) => {
    setPrioridad(value)
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
        ¿Cuál es tu prioridad principal?
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Esto nos ayuda a ordenar las mejores estrategias según lo que más te importa.
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
                prioridad === opcion.value
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
                  <p className="text-sm text-gray-600">
                    {opcion.description}
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