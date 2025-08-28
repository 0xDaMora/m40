import { motion } from "framer-motion"
import { TrendingUp, DollarSign, Calendar, Shield, Zap, Target, Award, Clock, ArrowRight, Download, Star, CheckCircle, CreditCard, FileText, Users, Info } from "lucide-react"
import { useState } from "react"
import DetallesPlan from "../DetallesPlan"
import TooltipInteligente from "../TooltipInteligente"

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

interface ComparativoProps {
  data: {
    escenarios: Estrategia[]
    metadatos?: any
  }
  onReinicio: () => void
  datosUsuario?: any // Datos del usuario del simulador
}

export default function ComparativoEstrategias({ data, onReinicio, datosUsuario }: ComparativoProps) {
  const estrategias = data.escenarios || []
  const metadatos = data.metadatos || {}
  const [modalAbierto, setModalAbierto] = useState<'basico' | 'premium' | null>(null)
  const [estrategiaSeleccionada, setEstrategiaSeleccionada] = useState<Estrategia | null>(null)

  // Calcular jubilación sin M40 (estimación básica con 500 semanas mínimas)
  const jubilacionSinM40 = {
    pension: 3500, // UMA mínima aproximada
    aguinaldo: Math.round(3500 * 13 / 12),
    mensaje: "Con las semanas que ya tienes cotizadas"
  }

  const formatNumber = (num: number) => num?.toLocaleString('es-MX') || '0'

  const getIconoCategoria = (categoria: string) => {
    switch (categoria?.toLowerCase()) {
      case 'alto rendimiento': return <TrendingUp className="w-5 h-5" />
      case 'económica': return <DollarSign className="w-5 h-5" />
      case 'recuperación rápida': return <Clock className="w-5 h-5" />
      case 'pensión premium': return <Award className="w-5 h-5" />
      case 'equilibrada': return <Target className="w-5 h-5" />
      default: return <Shield className="w-5 h-5" />
    }
  }

  const getColorCategoria = (categoria: string) => {
    switch (categoria?.toLowerCase()) {
      case 'alto rendimiento': return 'from-green-500 to-emerald-600'
      case 'económica': return 'from-blue-500 to-blue-600' 
      case 'recuperación rápida': return 'from-orange-500 to-red-500'
      case 'pensión premium': return 'from-purple-500 to-indigo-600'
      case 'equilibrada': return 'from-gray-500 to-gray-600'
      default: return 'from-slate-500 to-slate-600'
    }
  }

  const getDescripcionEstrategia = (estrategia: Estrategia, index: number) => {
    const esIntensiva = estrategia.mesesM40 <= 24 && estrategia.umaElegida >= 20
    const esConservadora = estrategia.mesesM40 >= 48 && estrategia.umaElegida <= 10
    const esEquilibrada = estrategia.mesesM40 >= 24 && estrategia.mesesM40 <= 48

    if (index === 0) return "🏆 Tu mejor opción según tus preferencias"
    if (esIntensiva) return "⚡ Estrategia intensiva: Poco tiempo, alta inversión"
    if (esConservadora) return "🛡️ Estrategia conservadora: Inversión gradual y segura"  
    if (esEquilibrada) return "⚖️ Estrategia equilibrada: Balance tiempo-inversión"
    return "📊 Alternativa sólida para considerar"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-6xl mx-auto p-6 space-y-8"
    >
      {/* Modal de detalles del plan */}
      <DetallesPlan 
        isOpen={modalAbierto !== null} 
        onClose={() => {
          setModalAbierto(null)
          setEstrategiaSeleccionada(null)
        }}
        planType={modalAbierto || 'basico'}
        estrategiaSeleccionada={estrategiaSeleccionada}
        todasLasEstrategias={estrategias}
        datosUsuario={datosUsuario}
      />
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Star className="w-4 h-4" />
          Análisis completado exitosamente
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Tus 5 mejores estrategias de Modalidad 40
        </h1>
        <p className="text-lg text-gray-700 mb-2">
          Analizamos <strong>{metadatos.totalCalculadas || 2000}+ escenarios</strong> y encontramos las opciones perfectas para ti
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-yellow-800 text-sm font-medium">
            💡 <strong>¿Por qué necesitas el plan completo?</strong> Cada estrategia incluye cronograma detallado mes a mes, 
            trámites paso a paso, y documentos listos para el IMSS.
          </p>
        </div>
      </div>


      {/* Estrategias Recomendadas */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Tus 5 mejores estrategias con Modalidad 40
          </h2>
        </div>

        <div className="space-y-6">
          {estrategias.slice(0, 5).map((estrategia, index) => {
            const mejoraTimes = Math.round((estrategia.pensionMensual / 3500) * 10) / 10 // 3500 = pension sin M40
            const inversionMensual = estrategia.inversionMensualPromedio || Math.round(estrategia.inversionTotal / estrategia.mesesM40)
            const cumpleObjetivo = estrategia.porcentajeCumplimiento || Math.round((estrategia.pensionMensual / 15000) * 100) // 15k default objetivo
            const esEstrategia1 = index === 0
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ 
                  y: -8,
                  boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.15)"
                }}
                className={`bg-white rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                  esEstrategia1 
                    ? 'border-yellow-400 shadow-xl scale-105 hover:scale-110' 
                    : 'border-gray-200 shadow-lg hover:border-blue-300'
                }`}
              >
                {/* Badge de más popular */}
                {esEstrategia1 && (
                  <div className="bg-yellow-400 text-yellow-900 text-center py-2 font-bold text-sm">
                    ⭐ MÁS POPULAR - MEJOR ROI
                  </div>
                )}

                {/* Header de la tarjeta */}
                <div className={`bg-gradient-to-r ${getColorCategoria(estrategia.categoria || '')} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        {getIconoCategoria(estrategia.categoria || '')}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          Estrategia #{index + 1}
                          {esEstrategia1 && <span className="ml-2 text-yellow-300">👑</span>}
                        </h3>
                        <p className="text-sm opacity-90">
                          {estrategia.categoria || 'Recomendada'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        +{mejoraTimes}x
                      </div>
                      <div className="text-xs opacity-90">
                        más pensión
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-6">
                  {/* Descripción y resumen */}
                  <div className="mb-6">
                    <p className="text-gray-700 font-medium mb-2">
                      {getDescripcionEstrategia(estrategia, index)}
                    </p>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        <strong>Pagas ${formatNumber(inversionMensual)} mensuales</strong> por {estrategia.mesesM40} meses
                        y obtienes <strong>${formatNumber(estrategia.pensionMensual)} de por vida</strong>
                      </p>
                    </div>
                  </div>

                  {/* Métricas principales */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600 mb-1">Tu pensión mensual</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatNumber(estrategia.pensionMensual)} MXN
                      </p>
                      <TooltipInteligente termino="Aguinaldo">
                        <p className="text-xs text-green-600">+ aguinaldo anual</p>
                      </TooltipInteligente>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-600 mb-1">Inversión requerida</p>
                      <p className="text-xl font-bold text-orange-700">
                        {formatNumber(estrategia.inversionTotal)} MXN
                      </p>
                      <p className="text-xs text-orange-600">Se recupera en {estrategia.recuperacionMeses} meses</p>
                    </div>
                  </div>

                  {/* ROI y beneficios */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Retorno de inversión (20 años)</p>
                        <TooltipInteligente termino="ROI">
                          <p className="text-lg font-bold text-purple-700">{estrategia.ROI}x tu dinero</p>
                        </TooltipInteligente>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Ganancia de por vida</p>
                        <p className="text-lg font-bold text-green-600">
                          +{formatNumber((estrategia.pensionMensual - 3500) * 12 * 20)} MXN
                        </p>
                        <p className="text-xs text-gray-500">en 20 años</p>
                      </div>
                    </div>
                  </div>

                  {/* Detalles de la estrategia */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Tiempo en M40</p>
                        <TooltipInteligente termino="Meses en M40">
                          <p className="font-semibold">{estrategia.mesesM40} meses</p>
                        </TooltipInteligente>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Pago mensual</p>
                        <p className="font-semibold">${formatNumber(inversionMensual)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Nivel UMA</p>
                        <TooltipInteligente termino="Nivel UMA">
                          <p className="font-semibold">{estrategia.umaElegida} UMA</p>
                        </TooltipInteligente>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Recuperación</p>
                        <TooltipInteligente termino="Recuperación">
                          <p className="font-semibold">{estrategia.recuperacionMeses} meses</p>
                        </TooltipInteligente>
                      </div>
                    </div>
                  </div>

                  {/* Etiquetas de estrategia */}
                  <div className="flex gap-2 mt-4 flex-wrap mb-6">
                    <TooltipInteligente termino={estrategia.estrategia === 'fijo' ? 'UMA Fijo' : 'UMA Progresivo'}>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        estrategia.estrategia === 'fijo' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {estrategia.estrategia === 'fijo' ? '🔒 UMA Fijo' : '📈 UMA Progresivo'}
                      </span>
                    </TooltipInteligente>
                    
                    {estrategia.mesesM40 <= 24 && (
                      <TooltipInteligente termino="Intensivo">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          ⚡ Intensivo
                        </span>
                      </TooltipInteligente>
                    )}
                    
                    {estrategia.ROI && estrategia.ROI >= 15 && (
                      <TooltipInteligente termino="Alto ROI">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          🚀 Alto ROI
                        </span>
                      </TooltipInteligente>
                    )}
                  </div>

                  {/* Sección de pricing y beneficios */}
                  <div className="border-t pt-6">
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-bold text-gray-800 mb-2">
                        Obtén tu plan detallado de esta estrategia
                      </h4>
                      <p className="text-sm text-gray-600">
                        Incluye cronograma mes a mes, trámites y documentos oficiales
                      </p>
                    </div>

                    {/* Qué incluye - versión compacta */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Cronograma mes a mes
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Formatos oficiales IMSS
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Instructivo de trámites
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Cálculo de ISR y viudez
                        </div>
                      </div>
                    </div>

                    {/* Precio y CTAs */}
                    <div className="space-y-3">
                      {/* Plan básico */}
                      <div className="flex items-center justify-between bg-white border-2 border-blue-200 rounded-lg p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-bold text-blue-700">$50 MXN</span>
                            {esEstrategia1 && (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium">
                                MEJOR OPCIÓN
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Plan Básico • Esta estrategia únicamente</p>
                          <button 
                            onClick={() => setModalAbierto('basico')}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                          >
                            <Info className="w-3 h-3" />
                            Ver qué incluye
                          </button>
                        </div>
                        <button 
                          onClick={() => {
                            setEstrategiaSeleccionada(estrategia)
                            setModalAbierto('basico')
                          }}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 transform hover:scale-105 hover:shadow-lg ${
                            esEstrategia1
                              ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-600'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          Comprar $50
                        </button>
                      </div>

                      {/* Opción premium individual */}
                      {esEstrategia1 && (
                        <div className="text-center py-2">
                          <p className="text-sm text-gray-600">
                            ¿Te gustó? También tienes el{" "}
                            <button 
                              onClick={() => setModalAbierto('premium')}
                              className="text-purple-600 font-medium hover:text-purple-800"
                            >
                              Plan Premium por $200 MXN
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Plan Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-xl p-8 mb-8"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-3">
            <Star className="w-4 h-4" />
            OFERTA ESPECIAL
          </div>
          <h3 className="text-2xl font-bold mb-2">¿Quieres acceso completo?</h3>
          <p className="text-purple-100 text-lg">
            Obtén <strong>todas las estrategias</strong> y herramienta de por vida
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Beneficios del plan premium */}
          <div>
            <h4 className="font-bold text-lg mb-4">Plan Premium incluye:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                Acceso a los +2,000 escenarios
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                Herramienta web de por vida
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                PDFs ilimitados
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                Acceso para familiares
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                Actualizaciones automáticas
              </div>
            </div>
          </div>

          {/* Pricing premium */}
          <div className="bg-white/10 p-6 rounded-lg">
            <div className="text-center">
              <div className="mb-2">
                <span className="text-3xl font-bold">$200 MXN</span>
                <span className="text-purple-200 text-lg line-through ml-2">$250</span>
              </div>
              <p className="text-purple-200 text-sm mb-4">
                Descuento por haber calculado • Solo hoy
              </p>
              <div className="space-y-2">
                <button 
                  onClick={() => setModalAbierto('premium')}
                  className="w-full bg-white/20 text-white py-2 px-4 rounded-lg hover:bg-white/30 transition-colors text-sm flex items-center justify-center gap-2 mb-2"
                >
                  <Info className="w-4 h-4" />
                  Ver qué incluye el Premium
                </button>
                
                <button 
                  onClick={() => {
                    setEstrategiaSeleccionada(estrategias[0]) // La primera estrategia es la mejor
                    setModalAbierto('premium')
                  }}
                  className="w-full bg-yellow-400 text-yellow-900 py-3 px-6 rounded-lg font-bold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Obtener Plan Premium
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-purple-200 text-sm">
          <p>⚡ <strong>Acceso inmediato</strong> • 💰 <strong>Garantía de 30 días</strong> • 🔒 <strong>Pago seguro</strong></p>
        </div>
      </motion.div>

      {/* Acciones */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="flex flex-col sm:flex-row gap-4 pt-6"
      >
        <button 
          onClick={onReinicio}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Hacer nueva simulación
        </button>
      </motion.div>

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500 mt-6">
        <p>💡 Los cálculos están basados en la Ley del Seguro Social vigente y proyecciones de UMA al 5% anual</p>
      </div>
    </motion.div>
  )
}