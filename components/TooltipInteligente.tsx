"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Info, X, Calculator, TrendingUp, Clock, DollarSign, Shield, Users, FileText, Zap, Calendar } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"

interface TooltipInteligenteProps {
  termino: string
  children: React.ReactNode
  tipo?: "concepto" | "estrategia" | "numero" | "beneficio"
  posicion?: "top" | "bottom" | "left" | "right"
}

const explicaciones = {
  "UMA Fijo": {
    titulo: "UMA Fijo",
    subtitulo: "Estrategia de pago constante",
    explicacion: "Con UMA Fijo, pagas la misma cantidad todos los meses durante todo el tiempo que estés en Modalidad 40. El monto se calcula al inicio y no cambia.",
    ejemplo: "Si eliges 15 UMA fijo, pagarás $8,500 mensuales durante 36 meses, sin importar si la UMA sube o baja.",
    ventajas: [
      "✅ Pagos predecibles y estables",
      "✅ Fácil de planificar en tu presupuesto",
      "✅ No te afectan los cambios en la UMA"
    ],
    consideraciones: [
      "⚠️ Si la UMA sube, podrías pagar menos de lo óptimo",
      "⚠️ Si la UMA baja, podrías pagar más de lo necesario"
    ],
    icono: Shield,
    color: "blue"
  },
  "UMA Progresivo": {
    titulo: "UMA Progresivo",
    subtitulo: "Estrategia de pago variable",
    explicacion: "Con UMA Progresivo, tu pago mensual cambia cada año según la UMA oficial. Si la UMA sube, tu pago sube; si baja, tu pago baja.",
    ejemplo: "Si eliges 15 UMA progresivo, pagarás $8,500 en 2024, pero si la UMA sube 5% en 2025, pagarás $8,925.",
    ventajas: [
      "✅ Siempre pagas el valor actual de la UMA",
      "✅ Aprovechas si la UMA sube más de lo esperado",
      "✅ Pagos más eficientes a largo plazo"
    ],
    consideraciones: [
      "⚠️ Pagos variables que pueden cambiar",
      "⚠️ Requiere más flexibilidad en tu presupuesto"
    ],
    icono: TrendingUp,
    color: "green"
  },
  "Nivel UMA": {
    titulo: "Nivel UMA",
    subtitulo: "Multiplicador de tu base salarial",
    explicacion: "El nivel UMA determina cuántas veces el salario mínimo (UMA) usarás como base para calcular tu pensión. Más UMA = mayor pensión, pero también mayores pagos.",
    ejemplo: "15 UMA significa que tu base salarial será 15 veces el salario mínimo diario ($108.57 en 2024) = $1,628 diarios.",
    ventajas: [
      "✅ Más UMA = mayor pensión final",
      "✅ Puedes elegir entre 1 y 25 UMA",
      "✅ Se adapta a tu capacidad de pago"
    ],
    consideraciones: [
      "⚠️ Más UMA = pagos mensuales más altos",
      "⚠️ El límite legal es 25 UMA"
    ],
    icono: Calculator,
    color: "purple"
  },
  "ROI": {
    titulo: "ROI (Retorno de Inversión)",
    subtitulo: "Cuánto ganas por cada peso invertido",
    explicacion: "El ROI te dice cuántas veces recuperarás tu inversión en M40. Por ejemplo, un ROI de 15x significa que por cada peso que inviertas, ganarás 15 pesos en tu pensión.",
    ejemplo: "Si inviertes $50,000 y tu ROI es 15x, ganarás $750,000 adicionales en tu pensión durante tu jubilación.",
    ventajas: [
      "✅ Te ayuda a comparar estrategias",
      "✅ Muestra la eficiencia de tu inversión",
      "✅ Considera 20 años de pensión"
    ],
    consideraciones: [
      "⚠️ Es una proyección a largo plazo",
      "⚠️ No incluye inflación"
    ],
    icono: TrendingUp,
    color: "orange"
  },
  "Meses en M40": {
    titulo: "Meses en M40",
    subtitulo: "Tiempo de aportación voluntaria",
    explicacion: "Son los meses que pagarás contribuciones voluntarias en Modalidad 40. Puedes elegir entre 1 y 58 meses (máximo legal).",
    ejemplo: "36 meses significa que pagarás contribuciones voluntarias durante 3 años, mejorando tu promedio salarial para el cálculo de pensión.",
    ventajas: [
      "✅ Más meses = mejor promedio salarial",
      "✅ Puedes elegir el tiempo que prefieras",
      "✅ Mínimo 12 meses recomendado"
    ],
    consideraciones: [
      "⚠️ Más meses = mayor inversión total",
      "⚠️ Máximo legal: 58 meses"
    ],
    icono: Clock,
    color: "blue"
  },
  "Recuperación": {
    titulo: "Tiempo de Recuperación",
    subtitulo: "Cuándo recuperas tu inversión",
    explicacion: "Es el número de meses que tardarás en recuperar tu inversión total en M40 a través de la mejora en tu pensión mensual.",
    ejemplo: "Si inviertes $60,000 y tu pensión mejora $3,000 mensual, recuperarás tu inversión en 20 meses ($60,000 ÷ $3,000 = 20).",
    ventajas: [
      "✅ Te dice cuándo empezarás a ganar",
      "✅ Ayuda a evaluar la estrategia",
      "✅ Considera solo la mejora en pensión"
    ],
    consideraciones: [
      "⚠️ Es una estimación",
      "⚠️ No incluye inflación"
    ],
    icono: DollarSign,
    color: "green"
  },
  "Aguinaldo": {
    titulo: "Aguinaldo Anual",
    subtitulo: "Pago extra en noviembre",
    explicacion: "El aguinaldo es un pago extra que recibes en noviembre. Es igual a tu pensión mensual y se suma a tus ingresos anuales.",
    ejemplo: "Si tu pensión es $12,000 mensual, recibirás $12,000 extra en noviembre como aguinaldo.",
    ventajas: [
      "✅ Pago garantizado por ley",
      "✅ Se suma a tu pensión mensual",
      "✅ Mejora con M40"
    ],
    consideraciones: [
      "⚠️ Se paga una vez al año",
      "⚠️ Está sujeto a impuestos"
    ],
    icono: DollarSign,
    color: "purple"
  },
  "Modalidad 40": {
    titulo: "Modalidad 40",
    subtitulo: "Mecanismo oficial del IMSS",
    explicacion: "Modalidad 40 es un programa oficial del IMSS que te permite mejorar tu pensión pagando contribuciones voluntarias. Está establecido en el Artículo 167 de la Ley del Seguro Social.",
    ejemplo: "Es como 'comprar' semanas de trabajo de alta calidad para mejorar tu promedio salarial al jubilarte.",
    ventajas: [
      "✅ 100% legal y oficial",
      "✅ Aumenta tu pensión hasta 300%",
      "✅ Garantizado por el gobierno"
    ],
    consideraciones: [
      "⚠️ Requiere inversión inicial",
      "⚠️ Tiempo mínimo 12 meses"
    ],
    icono: Shield,
    color: "blue"
  },
  "Intensivo": {
    titulo: "Estrategia Intensiva",
    subtitulo: "Pagos altos por poco tiempo",
    explicacion: "Una estrategia intensiva significa que pagarás montos altos mensualmente pero por un período corto (24 meses o menos). Es ideal si tienes buena capacidad de pago.",
    ejemplo: "Pagar $15,000 mensuales por 24 meses en lugar de $8,000 por 48 meses.",
    ventajas: [
      "✅ Terminas rápido (1-2 años)",
      "✅ Menos riesgo de cambios de ley",
      "✅ Recuperas inversión pronto"
    ],
    consideraciones: [
      "⚠️ Pagos mensuales altos",
      "⚠️ Mayor impacto en presupuesto"
    ],
    icono: Zap,
    color: "red"
  },
           "Alto ROI": {
           titulo: "Alto Retorno de Inversión",
           subtitulo: "Excelente relación costo-beneficio",
           explicacion: "Un ROI alto (15x o más) significa que por cada peso que inviertas, ganarás 15 o más pesos en tu pensión. Es una de las mejores estrategias disponibles.",
           ejemplo: "Invertir $40,000 para ganar $600,000 adicionales en tu pensión (ROI 15x).",
           ventajas: [
             "✅ Máxima eficiencia de inversión",
             "✅ Mejor relación costo-beneficio",
             "✅ Recuperación rápida"
           ],
           consideraciones: [
             "⚠️ Puede requerir pagos altos",
             "⚠️ Necesita estabilidad financiera"
           ],
           icono: TrendingUp,
           color: "yellow"
         },
         "Inversión estimada": {
           titulo: "Inversión Estimada",
           subtitulo: "Total de contribuciones voluntarias",
           explicacion: "Es el monto total que pagarás en contribuciones voluntarias durante todo el tiempo que estés en Modalidad 40. Se calcula multiplicando tu pago mensual por los meses de duración.",
           ejemplo: "Si pagas $8,000 mensuales por 36 meses, tu inversión total será $288,000.",
           ventajas: [
             "✅ Te permite planificar tu presupuesto",
             "✅ Conoces el costo total de antemano",
             "✅ Puedes ajustar la estrategia"
           ],
           consideraciones: [
             "⚠️ Es una inversión significativa",
             "⚠️ Requiere compromiso financiero"
           ],
           icono: DollarSign,
           color: "blue"
         },
         "Factor edad": {
           titulo: "Factor edad",
           subtitulo: "Ajuste por edad de jubilación",
           explicacion: "El factor edad ajusta tu pensión según la edad a la que te jubiles. Jubilarse a los 65 años te da el 100% de la pensión base.",
           ejemplo: "Si te jubilas a los 60 años, tu pensión será 75% de la base. A los 65 años será 100%.",
           ventajas: [
             "✅ Jubilación tardía = mayor pensión",
             "✅ Factor oficial del IMSS",
             "✅ Aplicado automáticamente"
           ],
           consideraciones: [
             "⚠️ Jubilación temprana reduce pensión",
             "⚠️ Planificar edad de jubilación"
           ],
           icono: Calendar,
           color: "blue"
         },
         "Factor Fox": {
           titulo: "Factor Fox (11%)",
           subtitulo: "Incremento por Ley Fox",
           explicacion: "La Ley Fox otorga un incremento del 11% a todas las pensiones del IMSS. Es un beneficio adicional garantizado por ley.",
           ejemplo: "Si tu pensión base es $10,000, con el Factor Fox recibirás $11,100 mensuales.",
           ventajas: [
             "✅ Incremento garantizado por ley",
             "✅ Se aplica automáticamente",
             "✅ Beneficio permanente"
           ],
           consideraciones: [
             "⚠️ Solo aplica a pensiones IMSS",
             "⚠️ No afecta otros ingresos"
           ],
           icono: TrendingUp,
           color: "green"
         },
         "Asignaciones familiares": {
           titulo: "Asignaciones familiares",
           subtitulo: "Beneficio por dependientes",
           explicacion: "Si tienes cónyuge, recibes un incremento del 15% en tu pensión. Es un beneficio adicional por tener dependientes económicos.",
           ejemplo: "Con pensión de $10,000 y cónyuge, recibirás $11,500 mensuales.",
           ventajas: [
             "✅ Protección familiar",
             "✅ Incremento automático",
             "✅ Beneficio permanente"
           ],
           consideraciones: [
             "⚠️ Solo aplica si tienes cónyuge",
             "⚠️ Requiere matrimonio vigente"
           ],
           icono: Users,
           color: "purple"
         },
         "Umbral exento": {
           titulo: "Umbral exento ISR",
           subtitulo: "Límite libre de impuestos",
           explicacion: "Las pensiones del IMSS están exentas de ISR hasta cierto límite mensual. Solo se paga impuestos sobre el excedente.",
           ejemplo: "Con umbral de $15,000, si tu pensión es $20,000, solo pagas ISR sobre $5,000.",
           ventajas: [
             "✅ Beneficio fiscal",
             "✅ Pensión neta mayor",
             "✅ Ahorro en impuestos"
           ],
           consideraciones: [
             "⚠️ Límite puede cambiar",
             "⚠️ Consultar con contador"
           ],
           icono: Shield,
           color: "green"
         },
         "Base gravable": {
           titulo: "Base gravable",
           subtitulo: "Monto sujeto a ISR",
           explicacion: "Es la parte de tu pensión que excede el umbral exento y sobre la cual debes pagar impuestos.",
           ejemplo: "Pensión $20,000 - Umbral $15,000 = Base gravable $5,000.",
           ventajas: [
             "✅ Cálculo transparente",
             "✅ Solo sobre excedente",
             "✅ Tasa progresiva"
           ],
           consideraciones: [
             "⚠️ Varía según pensión",
             "⚠️ Consultar tabla ISR"
           ],
           icono: Calculator,
           color: "orange"
         },
         "Pensión de viudez": {
           titulo: "Pensión de viudez",
           subtitulo: "Protección familiar",
           explicacion: "Tu cónyuge recibirá el 90% de tu pensión si falleces. Es una protección financiera para tu familia.",
           ejemplo: "Si tu pensión es $15,000, tu cónyuge recibirá $13,500 mensuales.",
           ventajas: [
             "✅ Protección familiar",
             "✅ 90% de tu pensión",
             "✅ Beneficio permanente"
           ],
           consideraciones: [
             "⚠️ Solo para cónyuge",
             "⚠️ Requiere matrimonio vigente"
           ],
           icono: Shield,
           color: "purple"
         }
}

export default function TooltipInteligente({ 
  termino, 
  children, 
  tipo = "concepto",
  posicion = "top" 
}: TooltipInteligenteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, placement: 'bottom' })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const explicacion = explicaciones[termino as keyof typeof explicaciones]

  if (!explicacion) {
    return <span>{children}</span>
  }

  const IconComponent = explicacion.icono

  // Calcular posición dinámica
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      const tooltipWidth = 320
      const tooltipHeight = 280 // Reducido para ser más compacto
      
      const spaceTop = rect.top
      const spaceBottom = viewportHeight - rect.bottom
      const spaceLeft = rect.left
      const spaceRight = viewportWidth - rect.right
      
      let placement = 'bottom'
      let x = rect.left + rect.width / 2
      let y = rect.bottom + 8
      
             // Determinar la mejor posición
       if (spaceBottom >= tooltipHeight + 20) {
         placement = 'bottom'
         y = rect.bottom + 8
       } else if (spaceTop >= tooltipHeight + 20) {
         placement = 'top'
         y = rect.top - tooltipHeight - 8
       } else if (spaceRight >= tooltipWidth + 20) {
         placement = 'right'
         x = rect.right + 8
         y = rect.top + rect.height / 2 - tooltipHeight / 2
       } else if (spaceLeft >= tooltipWidth + 20) {
         placement = 'left'
         x = rect.left - tooltipWidth - 8
         y = rect.top + rect.height / 2 - tooltipHeight / 2
       } else {
         // Centrar en la pantalla si no hay espacio, evitando el navbar
         placement = 'center'
         x = viewportWidth / 2 - tooltipWidth / 2
         y = Math.max(80, viewportHeight / 2 - tooltipHeight / 2) // Evitar navbar
       }
       
       // Asegurar que no se salga de los bordes
       x = Math.max(10, Math.min(x, viewportWidth - tooltipWidth - 10))
       y = Math.max(10, Math.min(y, viewportHeight - tooltipHeight - 10))
      
      setTooltipPosition({ x, y, placement })
    }
  }, [isOpen])

  // Cerrar tooltip al hacer scroll
  useEffect(() => {
    const handleScroll = () => setIsOpen(false)
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [])

  return (
    <>
      <button
        ref={triggerRef}
        data-tooltip-trigger
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer group relative"
      >
        {children}
        <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
        {/* Indicador para móvil */}
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse sm:hidden"></span>
      </button>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999]"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
          >
            {/* Tooltip content - Versión más compacta */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-72 max-w-[90vw] sm:w-80">
              {/* Header compacto */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${
                    explicacion.color === 'blue' ? 'bg-blue-100' :
                    explicacion.color === 'green' ? 'bg-green-100' :
                    explicacion.color === 'purple' ? 'bg-purple-100' :
                    'bg-orange-100'
                  }`}>
                    <IconComponent className={`w-3 h-3 ${
                      explicacion.color === 'blue' ? 'text-blue-600' :
                      explicacion.color === 'green' ? 'text-green-600' :
                      explicacion.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-xs">
                      {explicacion.titulo}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {explicacion.subtitulo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Explicación compacta */}
              <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                {explicacion.explicacion}
              </p>

              {/* Ejemplo compacto - oculto en móvil */}
              <div className="hidden sm:block bg-blue-50 border border-blue-200 p-2 rounded mb-2">
                <p className="text-xs text-blue-800 font-medium mb-1">Ejemplo:</p>
                <p className="text-xs text-blue-700">
                  {explicacion.ejemplo}
                </p>
              </div>

              {/* Ventajas y consideraciones compactas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <h5 className="text-xs font-semibold text-green-600 mb-1">VENTAJAS:</h5>
                  <ul className="space-y-0.5">
                    {explicacion.ventajas.slice(0, window.innerWidth < 640 ? 1 : 2).map((ventaja, index) => (
                      <li key={index} className="text-xs text-green-700 flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        {ventaja}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hidden sm:block">
                  <h5 className="text-xs font-semibold text-orange-600 mb-1">CONSIDERACIONES:</h5>
                  <ul className="space-y-0.5">
                    {explicacion.consideraciones.slice(0, 2).map((consideracion, index) => (
                      <li key={index} className="text-xs text-orange-700 flex items-start gap-1">
                        <span className="text-orange-500 mt-0.5">•</span>
                        {consideracion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer compacto */}
              <div className="mt-2 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText className="w-2 h-2" />
                    <span>Ley 73</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-2 h-2" />
                    <span>Oficial</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Overlay para cerrar al hacer clic fuera */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />,
        document.body
      )}
    </>
  )
}
