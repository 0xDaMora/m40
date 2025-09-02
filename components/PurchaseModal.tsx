"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Star, Zap, Shield, FileText, Users, Download, Share2, Clock, Calculator, TrendingUp, DollarSign, Calendar, Target } from "lucide-react"

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onPurchase: (plan: 'basic' | 'premium') => void
}

export default function PurchaseModal({ isOpen, onClose, onPurchase }: PurchaseModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('premium')
  const [showDetails, setShowDetails] = useState(false)

  const plans = {
    basic: {
      name: "Plan Básico",
      price: "$50 MXN",
      priceOriginal: undefined,
      period: "pago único",
      subtitle: "Tu estrategia elegida con todo lo necesario",
      description: "Tu estrategia elegida con todo lo necesario para implementarla",
      features: [
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
      ],
      limitations: [
        "Solo 1 estrategia por compra",
        "No puedes comparar múltiples escenarios",
        "Sin acceso a familiares adicionales",
        "Sin actualizaciones futuras"
      ],
      benefits: undefined,
      icon: Shield,
      color: "blue",
      gradient: "from-blue-500 to-blue-600"
    },
    premium: {
      name: "Plan Premium",
      price: "$200 MXN",
      priceOriginal: "$250 MXN",
      period: "pago único",
      subtitle: "Acceso completo de por vida + todas las estrategias",
      description: "Acceso completo de por vida + todas las estrategias",
      features: [
        "🌟 TODO lo del Plan Básico para TODAS las estrategias",
        "🔓 Acceso a los +2,000 escenarios calculados",
        "♾️ Herramienta web de por vida (sin renovaciones)",
        "📊 PDFs ilimitados de cualquier estrategia",
        "👨‍👩‍👧‍👦 Acceso para cónyuge e hijos (hasta 5 usuarios)",
        "🔄 Recalcular cuando cambien las UMAs",
        "📈 Actualizaciones automáticas de ley IMSS",
        "📞 Soporte prioritario por WhatsApp",
        "💾 Historial completo de tus cálculos",
        "🎯 Recomendaciones personalizadas",
        "⚡ Simulador avanzado con 'qué pasaría si...'",
        "🏆 Comparador de estrategias en tiempo real"
      ],
      limitations: undefined,
      benefits: [
        "Ahorra miles en asesorías financieras",
        "Optimiza tu estrategia al máximo",
        "Planifica para toda tu familia",
        "Acceso a nuevas funcionalidades"
      ],
      icon: Star,
      color: "purple",
      gradient: "from-purple-500 to-purple-600"
    }
  }

  const selectedPlanData = plans[selectedPlan]

  // Ejemplo de estrategia detallada
  const exampleStrategy = {
    name: "Ejemplo: Estrategia Máxima",
    scenario: "25 UMAs • 1,500 semanas • 65 años",
    details: {
      aportacionMensual: "$25,000",
      duracion: "36 meses",
      pensionMensual: "$45,000",
      roi: "180%",
      inversionTotal: "$900,000"
    },
    deliverables: [
      "📊 Cronograma detallado de 36 pagos mensuales",
      "📈 Proyección de pensión a 20 años",
      "💰 Cálculo completo de ISR",
      "👥 Pensión de viudez (90% del total)",
      "📅 Fechas exactas de trámites y jubilación",
      "📋 PDF profesional descargable",
      "🔄 Comparación con otras estrategias"
    ]
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="purchase-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Desbloquea tu Futuro Financiero
                </h2>
                <p className="text-gray-600 mt-2 text-lg">
                  Elige el plan que mejor se adapte a tus necesidades de planificación
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Plan Selection */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {Object.entries(plans).map(([key, plan]) => {
                  const IconComponent = plan.icon
                  const isSelected = selectedPlan === key
                  
                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPlan(key as 'basic' | 'premium')}
                      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? `border-${plan.color}-500 bg-${plan.color}-50` 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className={`absolute -top-3 -right-3 w-8 h-8 bg-${plan.color}-500 rounded-full flex items-center justify-center`}>
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-lg bg-${plan.color}-100`}>
                          <IconComponent className={`w-8 h-8 text-${plan.color}-600`} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-gray-600">{plan.subtitle}</p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-4xl font-bold text-gray-900">
                              {plan.price}
                            </span>
                            {plan.priceOriginal && (
                              <span className="text-lg line-through text-gray-400">{plan.priceOriginal}</span>
                            )}
                            <span className="text-gray-500">
                              {plan.period}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{plan.description}</p>

                      <div className="space-y-3 mb-4">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {plan.limitations && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="text-sm font-semibold text-red-800 mb-2">Limitaciones:</h4>
                          <ul className="space-y-1">
                            {plan.limitations.map((limitation, index) => (
                              <li key={index} className="text-xs text-red-700 flex items-center gap-2">
                                <span>⚠️</span>
                                {limitation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.benefits && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="text-sm font-semibold text-green-800 mb-2">Beneficios adicionales:</h4>
                          <ul className="space-y-1">
                            {plan.benefits.map((benefit, index) => (
                              <li key={index} className="text-xs text-green-700 flex items-center gap-2">
                                <span>✅</span>
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Example Strategy Section */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-600" />
                    ¿Qué incluye tu estrategia detallada?
                  </h3>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showDetails ? 'Ocultar detalles' : 'Ver ejemplo completo'}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Example Strategy Card */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">{exampleStrategy.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{exampleStrategy.scenario}</p>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-blue-600 font-medium">Aportación</div>
                        <div className="font-bold">{exampleStrategy.details.aportacionMensual}</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="text-green-600 font-medium">Pensión</div>
                        <div className="font-bold">{exampleStrategy.details.pensionMensual}</div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <div className="text-orange-600 font-medium">ROI</div>
                        <div className="font-bold">{exampleStrategy.details.roi}</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <div className="text-purple-600 font-medium">Duración</div>
                        <div className="font-bold">{exampleStrategy.details.duracion}</div>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Entregables incluidos:</h4>
                    <div className="space-y-2">
                      {exampleStrategy.deliverables.map((deliverable, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-lg">{deliverable.split(' ')[0]}</span>
                          <span>{deliverable.split(' ').slice(1).join(' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detailed Example */}
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      key="purchase-details"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-4">Ejemplo detallado de estrategia:</h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">📊 Cronograma de Pagos</h5>
                            <p className="text-gray-600">36 pagos mensuales de $25,000 cada uno, con fechas exactas y cálculos de ISR incluidos.</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">📈 Proyección 20 Años</h5>
                            <p className="text-gray-600">Tu pensión crecerá de $45,000 a $120,000 en 20 años, considerando aumentos anuales del 5%.</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">💰 Retorno de Inversión</h5>
                            <p className="text-gray-600">Inviertes $900,000 y recibirás $2,520,000 en 20 años. ROI del 180%.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>



              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onPurchase(selectedPlan)}
                  className={`flex-1 bg-gradient-to-r ${selectedPlanData.gradient} hover:from-${selectedPlanData.color}-600 hover:to-${selectedPlanData.color}-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Shield className="w-6 h-6" />
                    <span>Comprar {selectedPlanData.name} - {selectedPlanData.price}</span>
                  </div>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-8 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>

              {/* Security and Trust */}
              <div className="mt-6 text-center space-y-2">
                <p className="text-xs text-gray-500">
                  🔒 Pago seguro procesado por Stripe. Tus datos están protegidos.
                </p>
                <p className="text-xs text-gray-500">
                  💳 Pago único sin suscripciones recurrentes. Acceso inmediato.
                </p>
                <p className="text-xs text-gray-500">
                  ⭐ Más de 1,000 usuarios confían en nuestro simulador.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
