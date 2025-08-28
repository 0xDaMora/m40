"use client"
import { useState } from "react"
import { motion } from "framer-motion"

interface StepProps {
  onNext: (value: string) => void
  defaultValue?: string
}

export default function StepEstadoCivil({ onNext, defaultValue }: StepProps) {
  const [estado, setEstado] = useState(defaultValue || "")

  const seleccionar = (op: string) => {
    setEstado(op)
    onNext(op)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <label className="block text-2xl font-semibold mb-4 text-blue-700">
        ¿Estás casado(a) o en concubinato?
      </label>

      <div className="flex gap-4">
        <button
          onClick={() => seleccionar("conyuge")}
          className={`px-6 py-3 rounded-lg shadow-md font-medium transition ${
            estado === "conyuge"
              ? "bg-blue-700 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Sí
        </button>
        <button
          onClick={() => seleccionar("ninguno")}
          className={`px-6 py-3 rounded-lg shadow-md font-medium transition ${
            estado === "ninguno"
              ? "bg-blue-700 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          No
        </button>
      </div>

      <p className="mt-3 text-sm text-gray-600">
        ℹ️ Según la Ley 73 (Art. 164), si tienes cónyuge o concubina/o tu pensión se incrementa 
        en un <b>15%</b> por concepto de <b>asignación familiar</b>.
      </p>
    </motion.div>
  )
}


