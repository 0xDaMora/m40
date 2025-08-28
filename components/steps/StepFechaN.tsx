"use client"
import { useState } from "react"
import { motion } from "framer-motion"

interface StepProps {
  onNext: (value: string) => void
  defaultValue?: string
}

export default function StepSDI({ onNext, defaultValue }: StepProps) {
  const [valor, setValor] = useState(defaultValue || "")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <label className="block text-2xl font-semibold mb-4 text-blue-700">
        ¿Cuál es tu Fecha de Nacimiento?
      </label>

      <input
        type="date"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-full border p-3 text-lg rounded-md focus:ring-2 focus:ring-blue-500"
        onKeyDown={(e) => {
          if (e.key === "Enter") onNext(valor)
        }}
      />

      

      <button
        className="mt-4 bg-blue-700 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-800"
        onClick={() => onNext(valor)}
      >
        Continuar
      </button>
    </motion.div>
  )
}