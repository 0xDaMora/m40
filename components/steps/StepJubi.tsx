"use client"
import { useState } from "react"
import { motion } from "framer-motion"

interface StepProps {
  onNext: (value: string) => void
  defaultValue?: string
}

const porcentajes: Record<number, number> = {
  60: 75,
  61: 80,
  62: 85,
  63: 90,
  64: 95,
  65: 100,
}

export default function StepJubi({ onNext, defaultValue }: StepProps) {
  const [edad, setEdad] = useState<number | null>(defaultValue ? parseInt(defaultValue) : null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <label className="block text-2xl font-semibold mb-6 text-blue-700 text-center">
        ¿A qué edad deseas jubilarte?
      </label>

      {/* Botones de edad */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Object.keys(porcentajes).map((age) => (
          <button
            key={age}
            onClick={() => setEdad(parseInt(age))}
            className={`p-4 rounded-lg text-lg font-bold shadow-md transition-all ${
              edad === parseInt(age)
                ? "bg-blue-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {age}
          </button>
        ))}
      </div>

      {/* Texto explicativo */}
      {edad && (
        <motion.div
          key={edad}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p className="text-lg font-semibold text-blue-800">
            Si te jubilas a los {edad} años recibirás el {porcentajes[edad]}% de tu pensión.
          </p>
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            Este porcentaje se llama <b>“Cuantía Básica Reducida”</b>.  
            Mientras más tardes en jubilarte, mayor será tu pensión mensual, 
            ya que a los 65 años se alcanza el <b>100%</b>.
          </p>
        </motion.div>
      )}

      {/* Botón continuar */}
      <div className="mt-6 text-center">
        <button
          disabled={!edad}
          onClick={() => edad && onNext(String(edad))}
          className={`px-6 py-3 rounded-lg text-white font-semibold shadow-md transition-colors ${
            edad
              ? "bg-blue-700 hover:bg-blue-800"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Continuar
        </button>
      </div>
    </motion.div>
  )
}
