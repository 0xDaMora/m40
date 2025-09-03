"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Info, AlertCircle } from "lucide-react"

interface StepProps {
  onNext: (value: string) => void
  defaultValue?: string
}

export default function StepSDI({ onNext, defaultValue }: StepProps) {
  const [salario, setSalario] = useState(defaultValue || "")
  const [salarioFormateado, setSalarioFormateado] = useState("")
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(false)

  // 🔹 Función para limpiar y validar entrada del usuario
  const limpiarEntrada = (valor: string): string => {
    // Remover espacios, puntos y comas, mantener solo números y punto decimal
    return valor
      .replace(/[^\d.]/g, '') // Solo números y punto decimal
      .replace(/\.(?=.*\.)/g, '') // Solo un punto decimal
      .replace(/^\./, '') // No empezar con punto
  }

  // 🔹 Función para formatear salario en formato mexicano
  const formatearSalario = (valor: string): string => {
    if (!valor) return ""
    
    const numero = parseFloat(valor)
    if (isNaN(numero)) return valor
    
    // Formatear con comas para miles y punto para decimales
    return numero.toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  // 🔹 Función para validar el salario
  const validarSalario = (valor: string): boolean => {
    const numero = parseFloat(valor)
    
    if (isNaN(numero)) {
      setError("Por favor ingresa un número válido")
      return false
    }
    
    if (numero < 1000) {
      setError("El salario debe ser mayor a $1,000")
      return false
    }
    
    if (numero > 1000000) {
      setError("El salario no puede exceder $1,000,000")
      return false
    }
    
    setError("")
    return true
  }

  // 🔹 Función para calcular SDI aproximado
  const calcularSDI = (mensual: number) => {
    const diario = mensual / 30
    const factorIntegracion = 1.12 // estándar (aguinaldo + prima vacacional mínimas)
    return (diario * factorIntegracion).toFixed(2)
  }

  // 🔹 Manejar cambios en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value
    const valorLimpio = limpiarEntrada(valor)
    
    setSalario(valorLimpio)
    
    if (valorLimpio) {
      const formateado = formatearSalario(valorLimpio)
      setSalarioFormateado(formateado)
      
      const esValido = validarSalario(valorLimpio)
      setIsValid(esValido)
    } else {
      setSalarioFormateado("")
      setIsValid(false)
      setError("")
    }
  }

  // 🔹 Manejar continuar - MODIFICADO para pasar ambos valores
  const handleContinue = () => {
    if (!isValid || !salario) return
    
    const mensual = parseFloat(salario)
    const sdi = calcularSDI(mensual)
    
    // 🔹 Pasar tanto el SDI como el salario bruto original
    // El SDI se usa para cálculos internos, el salario bruto para mostrar al usuario
    onNext(JSON.stringify({
      sdi: sdi,
      salarioBruto: mensual
    }))
  }

  // 🔹 Actualizar estado cuando cambie el valor por defecto
  useEffect(() => {
    if (defaultValue) {
      setSalario(defaultValue)
      setSalarioFormateado(formatearSalario(defaultValue))
      setIsValid(validarSalario(defaultValue))
    }
  }, [defaultValue])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full max-w-md mx-auto"
    >
      <label className="block text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-blue-700 text-center sm:text-left">
        ¿Cuál es tu último salario mensual bruto?
      </label>

      <div className="relative mb-4 sm:mb-6">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
        <input
          type="text"
          placeholder="Ejemplo: 25,000"
          value={salarioFormateado}
          onChange={handleInputChange}
          className={`w-full border p-3 sm:p-4 pl-8 text-lg rounded-lg transition-all duration-200 ${
            error 
              ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValid) handleContinue()
          }}
        />
        
        {/* Indicador de validación */}
        {isValid && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Información del salario ingresado */}
      {isValid && salario && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-800">Salario confirmado:</span>
          </div>
          <p className="text-lg font-semibold text-green-700">
            ${parseFloat(salario).toLocaleString('es-MX')} MXN mensual
          </p>
        </div>
      )}

      {/* Información sobre SDI */}
      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
        <p className="text-sm text-blue-800 leading-relaxed">
          <span className="font-semibold">ℹ️ Información importante:</span><br />
          • Ingresa tu <b>salario mensual bruto</b> (antes de impuestos)<br />
          • Aceptamos formato mexicano: <b>25,000</b> o <b>25,000.50</b><br />
          • Calcularemos automáticamente tu <b>Salario Diario Integrado (SDI)</b><br />
          • El IMSS usa este valor para definir tu pensión
        </p>
      </div>

      <button
        className={`w-full px-6 py-3 sm:py-4 rounded-lg shadow-lg transition-all duration-200 font-semibold text-lg active:scale-95 touch-manipulation ${
          isValid 
            ? 'bg-blue-700 text-white hover:bg-blue-800 hover:shadow-xl' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        onClick={handleContinue}
        disabled={!isValid}
      >
        Continuar
      </button>
    </motion.div>
  )
}


