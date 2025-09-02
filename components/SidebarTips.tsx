"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Info, HelpCircle, Calculator, Calendar, DollarSign, Shield, TrendingUp, Users } from "lucide-react"
import { ReactNode } from "react"

interface TipItem {
  title: string
  content: string | ReactNode
  icon: any
  color: string
}

const tipsPorPaso: Record<string, TipItem[]> = {
  "Nacimiento": [
    {
      title: "¿Por qué necesitamos tu fecha de nacimiento?",
      content: "Calculamos cuántos años te quedan para jubilarte y optimizamos el tiempo de aportación en Modalidad 40.",
      icon: Calendar,
      color: "blue"
    },
    {
      title: "Dato curioso",
      content: "Personas nacidas entre 1965-1975 obtienen los mejores beneficios de M40 por la transición de leyes del IMSS.",
      icon: TrendingUp,
      color: "green"
    }
  ],
  "Edad de Jubilacion": [
    {
      title: "Edad óptima de jubilación",
      content: "Entre los 60-65 años es el rango ideal. Jubilarte antes reduce tu pensión, después la puede aumentar hasta 5% por año.",
      icon: Calculator,
      color: "blue"
    },
    {
      title: "Ley 73 vs Ley 97",
      content: "Si cotizaste antes de 1997, puedes elegir entre ambas leyes. Generalmente la Ley 73 da mejores pensiones.",
      icon: Shield,
      color: "purple"
    }
  ],
  "Semanas": [
    {
      title: "Semanas mínimas requeridas",
      content: "Necesitas mínimo 500 semanas cotizadas para pensionarte. Con M40 puedes agregar las que te falten.",
      icon: Calendar,
      color: "orange"
    },
    {
      title: "Cada semana cuenta",
      content: "Más semanas = mejor pensión. Las primeras 500 son básicas, después cada 52 semanas aumentan tu pensión ~1.5%.",
      icon: TrendingUp,
      color: "green"
    }
  ],
  "sdi": [
    {
      title: "¿Qué es el SDI?",
      content: "Es el Salario Diario Integrado promedio de tus últimos 5 años trabajados. Aparece en tu estado de cuenta IMSS.",
      icon: DollarSign,
      color: "blue"
    },
    {
      title: "Impacto en tu pensión",
      content: "Tu SDI es la base del cálculo. Un SDI más alto = pensión más alta. M40 te permite mejorarlo artificialmente.",
      icon: Calculator,
      color: "green"
    }
  ],
  "Estado Civil": [
    {
      title: "Beneficios familiares",
      content: "El estado civil afecta los porcentajes de asignaciones familiares que se suman a tu pensión base.",
      icon: Users,
      color: "purple"
    },
    {
      title: "Pensión de viudez",
      content: "Tu cónyuge recibirá el 90% de tu pensión si falleces. Con M40 también proteges a tu familia.",
      icon: Shield,
      color: "blue"
    }
  ],
  "Pension Objetivo": [
    {
      title: "Pensión realista",
      content: "Considera tus gastos actuales. Una buena pensión debe cubrir al menos el 70-80% de tus ingresos actuales.",
      icon: Calculator,
      color: "green"
    }
  ],
  "Nivel UMA": [
    {
      title: "¿Qué es UMA?",
      content: "Unidad de Medida y Actualización. Es el nuevo salario mínimo de referencia para el IMSS. En 2025 = $113.14 diarios.",
      icon: Info,
      color: "blue"
    }
  ]
}

const ejemplosComunes = [
  { perfil: "Perfil A (54 años)", antes: 4500, despues: 12800, tiempo: "32 meses" },
  { perfil: "Perfil B (49 años)", antes: 5200, despues: 11400, tiempo: "28 meses" },
  { perfil: "Perfil C (52 años)", antes: 3800, despues: 9600, tiempo: "36 meses" }
]

interface SidebarTipsProps {
  currentStep: string
  isVisible: boolean
}

export default function SidebarTips({ currentStep, isVisible }: SidebarTipsProps) {
  const tips = tipsPorPaso[currentStep] || []
  const ejemploAleatorio = ejemplosComunes[Math.floor(Math.random() * ejemplosComunes.length)]

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        key="sidebar-tips"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full lg:w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6 space-y-4 lg:space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Información útil</h3>
        </div>

        {/* Tips contextuales */}
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border-l-4 ${
                tip.color === 'blue' ? 'bg-blue-50 border-blue-400' :
                tip.color === 'green' ? 'bg-green-50 border-green-400' :
                tip.color === 'purple' ? 'bg-purple-50 border-purple-400' :
                'bg-orange-50 border-orange-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  tip.color === 'blue' ? 'bg-blue-100' :
                  tip.color === 'green' ? 'bg-green-100' :
                  tip.color === 'purple' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}>
                  <tip.icon className={`w-3 h-3 ${
                    tip.color === 'blue' ? 'text-blue-600' :
                    tip.color === 'green' ? 'text-green-600' :
                    tip.color === 'purple' ? 'text-purple-600' :
                    'text-orange-600'
                  }`} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{tip.title}</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">{tip.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ejemplo ilustrativo mini */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 text-sm mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Ejemplo ilustrativo
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div><strong>{ejemploAleatorio.perfil}</strong></div>
            <div>Antes: ${ejemploAleatorio.antes.toLocaleString()} → Después: ${ejemploAleatorio.despues.toLocaleString()}</div>
            <div>Tiempo en M40: {ejemploAleatorio.tiempo}</div>
            <div className="text-blue-600 font-medium">
              Mejora: +{Math.round(((ejemploAleatorio.despues - ejemploAleatorio.antes) / ejemploAleatorio.antes) * 100)}%
            </div>
          </div>
        </div>

        {/* FAQ rápido */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 text-sm mb-2">¿Tienes dudas?</h4>
          <p className="text-xs text-gray-600 mb-3">
            Nuestros cálculos están basados en las tablas oficiales del IMSS actualizadas a 2025.
          </p>
          
        </div>
      </motion.div>
    </AnimatePresence>
  )
}