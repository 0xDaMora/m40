"use client"
import { useState } from "react"
import { motion } from "framer-motion"

interface StepProps {
  onNext: (value: string) => void
  defaultValue?: string
}

export default function StepSDI({ onNext, defaultValue }: StepProps) {
  const [salario, setSalario] = useState(defaultValue || "")

  // 🔹 Función para calcular SDI aproximado
  const calcularSDI = (mensual: number) => {
    const diario = mensual / 30
    const factorIntegracion = 1.12 // estándar (aguinaldo + prima vacacional mínimas)
    return (diario * factorIntegracion).toFixed(2)
  }

  const handleContinue = () => {
    if (!salario) return
    const mensual = parseFloat(salario)
    if (isNaN(mensual)) return
    const sdi = calcularSDI(mensual)
    onNext(sdi)
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
        ¿Cuál es tu ultimo salario mensual bruto?
      </label>

      <input
        type="number"
        placeholder="Ejemplo: 25000"
        value={salario}
        onChange={(e) => setSalario(e.target.value)}
        className="w-full border p-3 text-lg rounded-md focus:ring-2 focus:ring-blue-500"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleContinue()
        }}
      />

      <p className="text-sm text-gray-600 mt-3 leading-relaxed">
        ℹ️ Ingresa tu <b>salario mensual bruto</b> (antes de impuestos).  
        Con este valor calcularemos tu <b>Salario Diario Integrado (SDI)</b>, 
        que es el que el IMSS usa para definir tu pensión.
      </p>

      <button
        className="mt-5 w-full bg-blue-700 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-800"
        onClick={handleContinue}
      >
        Continuar
      </button>
    </motion.div>
  )
}


