"use client"
import { motion } from "framer-motion"
import { useState } from "react"

interface StepProps {
  onNext: (value: string) => void
  defaultValue?: string
}

export default function StepMesesM40({ onNext, defaultValue }: StepProps) {
  const [meses, setMeses] = useState(parseInt(defaultValue || "12"))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <label className="block text-2xl font-semibold mb-4 text-blue-700">
        ¿Cuántos meses quieres pagar en Modalidad 40?
      </label>
      <input
        type="range"
        min={1}
        max={60}
        value={meses}
        onChange={(e) => setMeses(parseInt(e.target.value))}
        className="w-full"
      />
      <p className="mt-2 text-lg font-bold text-blue-800 text-center">{meses} meses</p>
      <button
        className="mt-4 bg-blue-700 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-800"
        onClick={() => onNext(String(meses))}
      >
        Continuar
      </button>
    </motion.div>
  )
}
