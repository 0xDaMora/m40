"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Info } from "lucide-react"

interface StepProps {
  onNext: (value: string) => void
  defaultValue?: string
}

export default function StepFechaN({ onNext, defaultValue }: StepProps) {
  const [valor, setValor] = useState(defaultValue || "")
  const [error, setError] = useState("")

  // Calcular límites de fecha para Ley 73
  const fechaMinima = "1959-01-01" // Nacidos desde 1959
  const fechaMaxima = "1979-12-31" // Nacidos hasta 1979
  
  // Fecha por defecto inteligente (1969 - mitad del rango)
  const fechaDefecto = "1969-01-01"

  useEffect(() => {
    // Si no hay valor por defecto, establecer uno inteligente
    if (!defaultValue && !valor) {
      setValor(fechaDefecto)
    }
  }, [defaultValue, valor, fechaDefecto])

  const validarFecha = (fecha: string) => {
    if (!fecha) {
      setError("Por favor selecciona tu fecha de nacimiento")
      return false
    }

    const fechaSeleccionada = new Date(fecha)
    const fechaMin = new Date(fechaMinima)
    const fechaMax = new Date(fechaMaxima)

    if (fechaSeleccionada < fechaMin || fechaSeleccionada > fechaMax) {
      setError("La fecha debe estar entre 1959 y 1979 para aplicar a Ley 73")
      return false
    }

    setError("")
    return true
  }

  const handleContinuar = () => {
    if (validarFecha(valor)) {
      onNext(valor)
    }
  }

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mesActual = hoy.getMonth()
    const mesNacimiento = nacimiento.getMonth()
    
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  const edad = calcularEdad(valor)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <label className="block text-2xl font-semibold mb-2 text-blue-700">
          ¿Cuál es tu Fecha de Nacimiento?
        </label>
        <p className="text-sm text-gray-600">
          Solo personas nacidas entre 1959 y 1979 califican para Ley 73
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <input
            type="date"
            value={valor}
            min={fechaMinima}
            max={fechaMaxima}
            onChange={(e) => {
              setValor(e.target.value)
              setError("")
            }}
            className={`w-full border p-3 text-lg rounded-md focus:ring-2 focus:ring-blue-500 transition-colors ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleContinuar()
            }}
          />
          
          {error && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {error}
            </p>
          )}
          
          {edad && !error && (
            <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
              ✅ Edad actual: {edad} años - Califica para Ley 73
            </p>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-semibold mb-1">¿Por qué estas fechas?</p>
              <p>La Ley 73 del IMSS aplica solo para personas nacidas entre 1959-1979. Si naciste antes o después, tienes diferente régimen pensional.</p>
            </div>
          </div>
        </div>

        {/* Botones de fecha rápida */}
       
      </div>

      <button
        className={`mt-6 w-full px-6 py-3 rounded-lg shadow font-semibold transition-all ${
          valor && !error
            ? 'bg-blue-700 text-white hover:bg-blue-800 transform hover:scale-105'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        onClick={handleContinuar}
        disabled={!valor || !!error}
      >
        Continuar
      </button>
    </motion.div>
  )
}