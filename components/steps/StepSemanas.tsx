"use client"
import { useState } from "react"
import { motion } from "framer-motion"

interface StepProps {
  onNext: (value: string) => void
  defaultValue?: string
}

export default function StepSemanas({ onNext, defaultValue }: StepProps) {
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
        ¿Cuantas Semanas Cotizadas tienes?
      </label>

      <input
        type="number"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-full border p-3 text-lg rounded-md focus:ring-2 focus:ring-blue-500"
        onKeyDown={(e) => {
          if (e.key === "Enter") onNext(valor)
        }}
      />

<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-gray-700 leading-relaxed">
    <span className="font-semibold text-blue-700">ℹ️ Semanas Cotizadas:</span> 
    Este dato aparece en el <b>PDF oficial de semanas</b> que emite el IMSS. 
    Si aún no lo tienes, puedes solicitarlo en línea de manera rápida y gratuita en el siguiente enlace:
  </p>
  <a
    href="https://serviciosdigitales.imss.gob.mx/semanascotizadas-web/usuarios/IngresoAsegurado"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block mt-3 text-blue-600 font-medium hover:underline"
  >
    👉 Solicitar mi reporte de semanas en el IMSS
  </a>
</div>

      

      <button
        className="mt-4 bg-blue-700 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-800"
        onClick={() => onNext(valor)}
      >
        Continuar
      </button>
    </motion.div>
  )
}