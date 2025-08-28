"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, DollarSign, Target, Shield, BarChart3, Zap, Calculator } from "lucide-react"

interface StepEstrategiaPersonalizadaProps {
  onNext: (valores: [string, string]) => void
  defaultValue?: string
  datosUsuario?: {
    edadJubilacion: number
    semanasPrevias: number
    sdiHistorico: number
  }
}

export default function StepEstrategiaPersonalizada({ 
  onNext, 
  defaultValue,
  datosUsuario 
}: StepEstrategiaPersonalizadaProps) {
  const [estrategiaSeleccionada, setEstrategiaSeleccionada] = useState("")
  const [pensionMaxima, setPensionMaxima] = useState(0)

  useEffect(() => {
    if (datosUsuario) {
      // Calcular pensión máxima teórica (25 UMA, estrategia óptima)
      const { edadJubilacion, semanasPrevias } = datosUsuario
      
      // UMA proyectada al año de jubilación (aprox)
      const añosHastaJubilacion = Math.max(0, edadJubilacion - 55)
      const umaFutura = 113.07 * Math.pow(1.05, añosHastaJubilacion)
      
      // SDI máximo (25 UMA)
      const sdiMaximo = 25 * umaFutura * 30.4
      
      // Estimación de porcentaje Ley 73
      const semanasConM40 = semanasPrevias + (58 * 4.33)
      const porcentajeBase = 35
      const incrementos = Math.floor((semanasConM40 - 500) / 52) * 2
      const porcentajeTotal = Math.min(porcentajeBase + incrementos, 100)
      
      // Pensión base
      const pensionBase = (porcentajeTotal / 100) * sdiMaximo
      
      // Aplicar factores
      const factorEdad = edadJubilacion === 60 ? 0.75 : edadJubilacion === 65 ? 1.0 : 0.95
      const pensionFinal = pensionBase * factorEdad * 1.11
      
      setPensionMaxima(Math.round(pensionFinal))
    }
  }, [datosUsuario])

  const pensionSinM40 = 5000 // Estimación básica sin M40
  const formatNumber = (num: number) => num.toLocaleString('es-MX')

  const estrategias = [
    {
      id: "conservadora",
      title: "Estrategia Conservadora",
      subtitle: "Segura y manejable",
      description: "Ideal para empezar en M40 o ingresos variables",
      pensionObjetivo: "basica",
      nivelUMA: "conservador",
      pensionMensual: Math.round(pensionSinM40 * 2.5),
      pagoMensual: "$3,000 - $6,000",
      rangoUMA: "5-10 UMA",
      tiempo: "36-48 meses",
      ventajas: ["✅ Pagos muy manejables", "✅ Riesgo mínimo", "✅ Fácil de sostener"],
      consideraciones: ["📊 Pensión moderada", "⏱️ Puede requerir más tiempo"],
      icon: Shield,
      color: "bg-green-50 border-green-200 hover:border-green-400",
      badge: "Recomendada para principiantes"
    },
    {
      id: "equilibrada",
      title: "Estrategia Equilibrada",
      subtitle: "El punto dulce",
      description: "La opción más popular - buena relación costo-beneficio",
      pensionObjetivo: "buena",
      nivelUMA: "equilibrado",
      pensionMensual: Math.round(pensionSinM40 * 4),
      pagoMensual: "$7,000 - $12,000",
      rangoUMA: "12-18 UMA",
      tiempo: "30-42 meses",
      ventajas: ["✅ Excelente relación costo-beneficio", "✅ Pensión atractiva", "✅ Pagos manejables"],
      consideraciones: ["📊 Requiere planificación", "⏱️ Compromiso financiero medio"],
      icon: BarChart3,
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
      badge: "Más elegida"
    },
    {
      id: "agresiva",
      title: "Estrategia Agresiva",
      subtitle: "Máximo beneficio",
      description: "Para quienes buscan la pensión más alta posible",
      pensionObjetivo: "premium",
      nivelUMA: "maximo",
      pensionMensual: Math.round(pensionSinM40 * 6),
      pagoMensual: "$12,000 - $18,000",
      rangoUMA: "18-25 UMA",
      tiempo: "24-36 meses",
      ventajas: ["✅ Pensión máxima posible", "✅ Mayor ROI a largo plazo", "✅ Terminas más rápido"],
      consideraciones: ["💰 Pagos altos", "⚠️ Mayor compromiso financiero", "📈 Requiere estabilidad"],
      icon: TrendingUp,
      color: "bg-purple-50 border-purple-200 hover:border-purple-400",
      badge: "Máximo rendimiento"
    },
    {
      id: "intensiva",
      title: "Estrategia Intensiva",
      subtitle: "Termina rápido",
      description: "Pagos altos por poco tiempo - ideal si tienes buena capacidad de pago",
      pensionObjetivo: "maxima",
      nivelUMA: "maximo",
      pensionMensual: pensionMaxima > 0 ? pensionMaxima : 50000,
      pagoMensual: "$15,000 - $25,000",
      rangoUMA: "20-25 UMA",
      tiempo: "18-24 meses",
      ventajas: ["⚡ Terminas en 1-2 años", "🚀 Máximo ROI", "🛡️ Menos riesgo de cambios"],
      consideraciones: ["💰 Pagos muy altos", "⚠️ Requiere excelente estabilidad", "📊 Máximo esfuerzo"],
      icon: Zap,
      color: "bg-yellow-50 border-yellow-200 hover:border-yellow-400",
      badge: "Para expertos"
    }
  ]

  const handleSelect = (estrategia: any) => {
    setEstrategiaSeleccionada(estrategia.id)
    setTimeout(() => {
      onNext([estrategia.pensionObjetivo, estrategia.nivelUMA])
    }, 150)
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
        ¿Qué tipo de estrategia buscas?
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Elige la estrategia que mejor se adapte a tu situación financiera y objetivos de pensión.
      </p>

      {/* Comparativo actual */}
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-700 mb-2">Tu situación actual (sin M40):</h3>
        <p className="text-lg font-bold text-red-600">~${formatNumber(pensionSinM40)} pesos mensuales</p>
        <p className="text-sm text-red-500">Con solo tus semanas actuales</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        {estrategias.map((estrategia) => {
          const IconComponent = estrategia.icon
          const mejora = Math.round(estrategia.pensionMensual / pensionSinM40 * 10) / 10
          
          return (
            <motion.button
              key={estrategia.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-5 rounded-lg border-2 text-left transition-all ${
                estrategiaSeleccionada === estrategia.id
                  ? "border-blue-500 bg-blue-50"
                  : estrategia.color
              }`}
              onClick={() => handleSelect(estrategia)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <IconComponent className="w-7 h-7 text-blue-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        {estrategia.title}
                      </h3>
                      <p className="text-sm text-gray-600">{estrategia.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        estrategia.badge.includes("principiantes") ? 'bg-green-100 text-green-700' :
                        estrategia.badge.includes("elegida") ? 'bg-blue-100 text-blue-700' :
                        estrategia.badge.includes("rendimiento") ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {estrategia.badge}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">
                    {estrategia.description}
                  </p>
                  
                  {/* Resultados esperados */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Pensión objetivo:</p>
                      <p className="font-bold text-green-600">${formatNumber(estrategia.pensionMensual)}</p>
                      <p className="text-xs text-green-500">+{mejora}x más</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Pago mensual:</p>
                      <p className="font-semibold text-gray-800">{estrategia.pagoMensual}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Rango UMA:</p>
                      <p className="font-semibold text-gray-800">{estrategia.rangoUMA}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Duración:</p>
                      <p className="font-semibold text-gray-800">{estrategia.tiempo}</p>
                    </div>
                  </div>
                  
                  {/* Ventajas y consideraciones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <h5 className="text-xs font-semibold text-green-600 mb-2">VENTAJAS:</h5>
                      <ul className="text-xs text-green-600 space-y-1">
                        {estrategia.ventajas.map((ventaja, i) => (
                          <li key={i}>{ventaja}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-blue-600 mb-2">A CONSIDERAR:</h5>
                      <ul className="text-xs text-blue-600 space-y-1">
                        {estrategia.consideraciones.map((consideracion, i) => (
                          <li key={i}>{consideracion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Guía de selección */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💡 ¿Cómo elegir tu estrategia?</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>¿Primera vez en M40?</strong> → Estrategia Conservadora</p>
          <p>• <strong>¿Ingresos estables y quieres buen balance?</strong> → Estrategia Equilibrada</p>
          <p>• <strong>¿Quieres la pensión más alta posible?</strong> → Estrategia Agresiva</p>
          <p>• <strong>¿Tienes excelente capacidad de pago?</strong> → Estrategia Intensiva</p>
        </div>
      </div>

      {pensionMaxima > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700">
            💡 <strong>Tu máximo teórico:</strong> ${formatNumber(pensionMaxima)} con 25 UMA y estrategia óptima
          </p>
        </div>
      )}
    </motion.div>
  )
}
