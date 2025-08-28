import { useState } from "react"
import { motion } from "framer-motion"

interface StepPresupuestoProps {
  onNext: (valor: string) => void
  defaultValue?: string
}

export default function StepPresupuesto({ onNext, defaultValue }: StepPresupuestoProps) {
  const [presupuesto, setPresupuesto] = useState(defaultValue || "")
  const [custom, setCustom] = useState("")

  const opciones = [
    { value: "5000", label: "Hasta $5,000 pesos" },
    { value: "10000", label: "Hasta $10,000 pesos" },
    { value: "20000", label: "Hasta $20,000 pesos" },
    { value: "30000", label: "Hasta $30,000 pesos" },
    { value: "50000", label: "Hasta $50,000 pesos" },
    { value: "custom", label: "Otro monto" },
  ]

  const handleSelect = (value: string) => {
    if (value === "custom") {
      setPresupuesto("custom")
      return
    }
    setPresupuesto(value)
    setTimeout(() => onNext(value), 150)
  }

  const handleCustomSubmit = () => {
    if (custom && parseInt(custom) > 0) {
      onNext(custom)
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
        ¿Cuánto puedes invertir mensualmente?
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Esto nos ayuda a mostrarte solo las estrategias que estén dentro de tu presupuesto.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {opciones.map((opcion) => (
          <motion.button
            key={opcion.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              presupuesto === opcion.value
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => handleSelect(opcion.value)}
          >
            <span className="font-medium">{opcion.label}</span>
            {opcion.value !== "custom" && (
              <span className="text-sm text-gray-500 block">
                Modalidad 40 con {opcion.value === "5000" ? "1-3" : opcion.value === "10000" ? "4-7" : opcion.value === "20000" ? "8-15" : opcion.value === "30000" ? "16-20" : "20-25"} UMA
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {presupuesto === "custom" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 p-4 bg-gray-50 rounded-lg"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto mensual disponible:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleCustomSubmit()}
              />
            </div>
            <button
              onClick={handleCustomSubmit}
              disabled={!custom || parseInt(custom) <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              OK
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}