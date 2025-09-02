"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, DollarSign, Target, Shield, BarChart3, Zap, Calculator } from "lucide-react"
import { ajustarPensionConPMG, formatearPMG } from "@/lib/config/pensionMinima"

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

  const formatNumber = (num: number) => num.toLocaleString('es-MX')
  
  // Calcular pensión real sin M40 basada en SDI del usuario
  const calcularPensionSinM40 = () => {
    if (!datosUsuario?.sdiHistorico) return 5000 // Fallback si no hay datos
    
    // SDI diario del usuario
    const sdiDiario = datosUsuario.sdiHistorico
    const sdiMensual = sdiDiario * 30.4
    
    // Calcular pensión base según Ley 73 (sin M40)
    const semanasActuales = datosUsuario.semanasPrevias || 0
    const porcentajeBase = 35
    const incrementos = Math.floor((semanasActuales - 500) / 52) * 2
    const porcentajeTotal = Math.max(porcentajeBase + incrementos, 35)
    
    // Pensión base
    const pensionBase = (porcentajeTotal / 100) * sdiMensual
    
    // Aplicar factor de edad (asumiendo jubilación a 65)
    const factorEdad = 1.0 // 65 años = 100%
    
    // Pensión final sin M40
    const pensionFinal = pensionBase * factorEdad
    
    return Math.max(pensionFinal, 5000) // Mínimo 5000 como fallback
  }
  
  const pensionSinM40 = calcularPensionSinM40()

  const estrategias = [
    {
      id: "pension-alta",
      title: "Pensión más alta posible",
      subtitle: "Máximo beneficio",
      description: "Buscar la pensión mensual más alta, sin importar la inversión",
      pensionObjetivo: "premium",
      nivelUMA: "maximo",
      pensionMensual: Math.round(pensionSinM40 * 5),
      pagoMensual: "$12,000 - $25,000",
      rangoUMA: "18-25 UMA",
      ventajas: ["✅ Pensión máxima posible", "✅ Mejor calidad de vida", "✅ Retorno más alto"],
      consideraciones: ["💰 Inversión alta", "📊 Requiere buen ingreso"],
      icon: TrendingUp,
      color: "bg-purple-50 border-purple-200 hover:border-purple-400",
      badge: "Máximo beneficio"
    },
    {
      id: "inversion-baja",
      title: "Inversión más baja",
      subtitle: "Ahorro inteligente",
      description: "Minimizar la inversión total manteniendo una pensión decente",
      pensionObjetivo: "basica",
      nivelUMA: "conservador",
      pensionMensual: Math.round(pensionSinM40 * 2),
      pagoMensual: "$2,000 - $5,000",
      rangoUMA: "5-10 UMA",
      ventajas: ["✅ Inversión mínima", "✅ Fácil de sostener", "✅ Riesgo bajo"],
      consideraciones: ["📊 Pensión moderada", "⏱️ Más tiempo requerido"],
      icon: DollarSign,
      color: "bg-green-50 border-green-200 hover:border-green-400",
      badge: "Más económica"
    },
    {
      id: "equilibrio",
      title: "Equilibrio entre ambos",
      subtitle: "El punto dulce",
      description: "Balance entre pensión atractiva e inversión manejable",
      pensionObjetivo: "confortable",
      nivelUMA: "equilibrado",
      pensionMensual: Math.round(pensionSinM40 * 3.5),
      pagoMensual: "$5,000 - $12,000",
      rangoUMA: "12-18 UMA",
      ventajas: ["✅ Excelente relación costo-beneficio", "✅ Pensión atractiva", "✅ Pagos manejables"],
      consideraciones: ["📊 Requiere planificación", "⏱️ Compromiso financiero medio"],
      icon: Target,
      color: "bg-blue-50 border-blue-200 hover:border-blue-400",
      badge: "Más elegida"
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
        ¿Cuál es tu prioridad principal?
      </h2>
      <p className="text-gray-600 mb-6 text-sm">
        Elige qué es más importante para ti: obtener la pensión más alta, gastar lo menos posible, o encontrar un equilibrio entre ambos.
      </p>

             {/* Comparativo actual */}
       <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
         <h3 className="font-semibold text-red-700 mb-2">Tu situación actual (sin M40):</h3>
         <p className="text-lg font-bold text-red-600">
           ~${formatNumber(ajustarPensionConPMG(pensionSinM40))} pesos mensuales
         </p>
         <p className="text-sm text-red-500">
           {pensionSinM40 < 9724.48 
             ? `Con solo tus semanas actuales (incluye PMG: ${formatearPMG()})`
             : `Con solo tus semanas actuales (tu SDI es suficiente para superar la PMG)`
           }
         </p>
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
                        estrategia.badge.includes("económica") ? 'bg-green-100 text-green-700' :
                        estrategia.badge.includes("elegida") ? 'bg-blue-100 text-blue-700' :
                        estrategia.badge.includes("beneficio") ? 'bg-purple-100 text-purple-700' :
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
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
        <h4 className="font-semibold text-blue-800 mb-2">💡 ¿Cómo elegir tu prioridad?</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>¿Quieres la pensión más alta posible?</strong> → Pensión más alta</p>
          <p>• <strong>¿Quieres gastar lo menos posible?</strong> → Inversión más baja</p>
          <p>• <strong>¿Quieres un buen balance entre ambos?</strong> → Equilibrio entre ambos</p>
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
