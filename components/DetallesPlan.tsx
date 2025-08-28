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
  datosUsuario?: any // Datos del usuario del simulador
}

export default function DetallesPlan({ isOpen, onClose, planType, estrategiaSeleccionada, todasLasEstrategias, datosUsuario }: DetallesPlanProps) {
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
    precio: "$200 MXN",
    precioOriginal: "$250 MXN",
    descripcion: "Acceso completo de por vida + todas las estrategias",
    incluye: [
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
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{plan.precio}</span>
              {planType === 'premium' && plan.precioOriginal && (
                <span className="text-lg line-through opacity-60">{plan.precioOriginal}</span>
              )}
              <span className="text-sm opacity-80">pago único</span>
            </div>
            {planType === 'premium' && (
              <p className="text-purple-200 text-sm mt-1">
                Descuento especial por usar nuestra calculadora
              </p>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Esto es exactamente lo que recibes:
          </h3>
          
          <div className="space-y-3 mb-6">
            {plan.incluye.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </motion.div>
            ))}
          </div>

          {/* Garantías */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Garantías incluidas:
            </h4>
            <div className="space-y-1 text-sm text-green-700">
              <div>✅ Garantía de satisfacción 30 días</div>
              <div>✅ Soporte por WhatsApp incluido</div>
              <div>✅ Cálculos verificados con IMSS</div>
              <div>✅ Documentos actualizados a 2024</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-3">
            <button
              onClick={async () => {
                // Cambiar texto del botón durante el proceso
                const button = event?.target as HTMLButtonElement
                const originalText = button.innerHTML
                button.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Procesando pago...'
                button.disabled = true
                
                try {
                  // Simular proceso de pago
                  console.log('💳 Simulando pago...')
                  
                  // Generar debug-code único para la estrategia
                  const debugCode = `compra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                  
                  // Preparar datos para el backend
                  const datosCompra = {
                    planType,
                    precio: planType === 'basico' ? 50 : 200,
                    estrategiaSeleccionada: planType === 'basico' ? estrategiaSeleccionada : null,
                    todasLasEstrategias: planType === 'premium' ? todasLasEstrategias : null,
                    debugCode,
                    timestamp: new Date().toISOString()
                  }
                  
                  console.log('📤 Enviando datos de compra:', datosCompra)
                  
                  // Simular pago exitoso (en producción esto sería la pasarela real)
                  await new Promise(resolve => setTimeout(resolve, 2000)) // Simular delay de pago
                  
                  // Guardar debug-code en localStorage para acceso posterior
                  localStorage.setItem('debugCodeCompra', debugCode)
                  localStorage.setItem('planTypeCompra', planType)
                  
                  // Redirigir a la interfaz detallada
                  if (planType === 'basico' && estrategiaSeleccionada) {
                    // Para plan básico, ir directamente a la estrategia detallada
                    const params = new URLSearchParams({
                      code: debugCode,
                      estrategia: estrategiaSeleccionada.estrategia,
                      uma: estrategiaSeleccionada.umaElegida.toString(),
                      meses: estrategiaSeleccionada.mesesM40.toString(),
                      edad: datosUsuario?.edad?.toString() || '58',
                      dependiente: datosUsuario?.dependiente || 'conyuge',
                      sdi: datosUsuario?.sdiHistorico?.toString() || '150',
                      semanas: datosUsuario?.semanasPrevias?.toString() || '500',
                      fecha: datosUsuario?.inicioM40 || '2024-02-01'
                    })
                    window.location.href = `/debug-estrategia?${params.toString()}`
                  } else {
                    // Para plan premium, ir a la página de debug con acceso a todas las estrategias
                    const params = new URLSearchParams({
                      code: debugCode,
                      premium: 'true',
                      edad: datosUsuario?.edad?.toString() || '58',
                      dependiente: datosUsuario?.dependiente || 'conyuge',
                      sdi: datosUsuario?.sdiHistorico?.toString() || '150',
                      semanas: datosUsuario?.semanasPrevias?.toString() || '500',
                      fecha: datosUsuario?.inicioM40 || '2024-02-01'
                    })
                    window.location.href = `/debug-estrategia?${params.toString()}`
                  }
                  
                } catch (error: any) {
                  console.error('❌ Error en compra:', error)
                  alert(`Error: ${error?.message || 'Error desconocido'}. Por favor intenta de nuevo.`)
                } finally {
                  // Restaurar botón
                  if (button) {
                    button.innerHTML = originalText
                    button.disabled = false
                  }
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