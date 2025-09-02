"use client"

import { motion } from "framer-motion"
import { CheckCircle, FileText, Calendar, CreditCard, Users, Download, Shield, Phone, X } from "lucide-react"

interface Estrategia {
  mesesM40: number
  estrategia: "fijo" | "progresivo" 
  umaElegida: number
  inversionTotal: number
  pensionMensual: number
  pensionConAguinaldo: number
  ROI: number
  recuperacionMeses: number
  ranking?: number
  categoria?: string
  puntaje?: number
}

interface DetallesPlanProps {
  isOpen: boolean
  onClose: () => void
  planType: 'basico' | 'premium'
  estrategiaSeleccionada?: Estrategia | null
  todasLasEstrategias?: Estrategia[]
  datosUsuario?: any
  onPurchase?: () => void
}

export default function DetallesPlan({ isOpen, onClose, planType, estrategiaSeleccionada, todasLasEstrategias, datosUsuario, onPurchase }: DetallesPlanProps) {
  if (!isOpen) return null

  const planBasico = {
    titulo: "Plan Básico",
    precio: "$50 MXN",
    precioOriginal: undefined,
    descripcion: "Tu estrategia elegida con todo lo necesario para implementarla",
    incluye: [
      "📋 Escenario detallado de tu estrategia elegida",
      "💳 Cronograma de pagos mes a mes al IMSS",
      "📄 Formato de Baja del IMSS (listo para usar)",
      "📝 Formato de Inscripción a Modalidad 40",
      "📂 Lista completa de papelería requerida",
      "📅 Fechas exactas de inscripción y baja",
      "🏛️ Documentos necesarios para pensión",
      "⏰ Fecha óptima para tramitar pensión",
      "💼 Instructivo completo para trámite AFORE",
      "🎄 Cálculo exacto de tu aguinaldo anual",
      "👥 Pensión por viudez (90% del monto)",
      "💰 Cálculo de ISR si aplica",
      "⏱️ Tiempo exacto de recuperación de inversión"
    ]
  }

  const planPremium = {
    titulo: "Plan Premium",
    precio: "$999 MXN",
    precioOriginal: undefined,
    descripcion: "Acceso completo de por vida + todas las estrategias",
    incluye: [
      "🌟 TODO lo del Plan Básico para TODAS las estrategias",
      "🔓 Acceso a los +2,000 escenarios calculados",
      "♾️ Herramienta web de por vida (sin renovaciones)",
      "📊 PDFs ilimitados de cualquier estrategia",
      "👨‍👩‍👧‍👦 Acceso para cónyuge e hijos (hasta 10 usuarios)",
      "🔄 Recalcular cuando cambien las UMAs",
      "📈 Actualizaciones automáticas de ley IMSS",
      "📞 Soporte prioritario por WhatsApp",
      "💾 Historial completo de tus cálculos",
      "🎯 Recomendaciones personalizadas",
      "⚡ Simulador avanzado con 'qué pasaría si...'",
      "🏆 Comparador de estrategias en tiempo real"
    ]
  }

  const plan = planType === 'basico' ? planBasico : planPremium

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className={`${
          planType === 'premium' 
            ? 'bg-gradient-to-r from-purple-600 to-indigo-700' 
            : 'bg-gradient-to-r from-blue-600 to-blue-700'
        } text-white p-6`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{plan.titulo}</h2>
              <p className="text-lg opacity-90">{plan.descripcion}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Precio */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {plan.precio}
            </div>
            {plan.precioOriginal && (
              <div className="text-lg text-gray-500 line-through">
                {plan.precioOriginal}
              </div>
            )}
          </div>

          {/* Lista de beneficios */}
          <div className="space-y-3 mb-6">
            {plan.incluye.map((beneficio, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{beneficio}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (onPurchase) {
                  onPurchase()
                }
              }}
              className={`flex-1 py-3 px-6 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                planType === 'premium'
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Comprar ahora {plan.precio}
            </button>
            
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            Pago seguro • Descarga inmediata • Sin suscripciones
          </p>
        </div>
      </motion.div>
    </div>
  )
}