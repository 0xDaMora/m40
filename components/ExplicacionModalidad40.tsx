"use client"

import { motion } from "framer-motion"
import { Shield, TrendingUp, Calculator, FileText, CheckCircle, AlertTriangle, Users, DollarSign, Clock, Award } from "lucide-react"
import { useState } from "react"

export default function ExplicacionModalidad40() {
  const [pasoActual, setPasoActual] = useState(0)
  const [mostrarCompleto, setMostrarCompleto] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  const pasos = [
    {
      titulo: "¿Qué es Modalidad 40?",
      subtitulo: "Un mecanismo legal del IMSS para mejorar tu pensión",
      icono: Shield,
      color: "blue",
      contenido: {
        explicacion: "Modalidad 40 es un programa oficial del IMSS que te permite mejorar tu pensión de jubilación. Es 100% legal y está respaldado por la Ley del Seguro Social.",
        beneficios: [
          "✅ Aumenta tu pensión hasta 300%",
          "✅ Es un mecanismo oficial del IMSS",
          "✅ Basado en la Ley 73 vigente",
          "✅ Garantizado por el gobierno"
        ],
        ejemplo: "Es como 'comprar' semanas de trabajo de alta calidad para mejorar tu promedio salarial al jubilarte."
      }
    },
    {
      titulo: "¿Cómo funciona?",
      subtitulo: "Mejora tu salario promedio para el cálculo de pensión",
      icono: Calculator,
      color: "green",
      contenido: {
        explicacion: "Tu pensión se calcula con el promedio de tus últimos 5 años de salario. M40 te permite mejorar ese promedio pagando contribuciones voluntarias.",
        beneficios: [
          "📊 Mejora tu promedio salarial",
          "💰 Paga contribuciones voluntarias",
          "📈 Aumenta tu pensión final",
          "⏰ Recuperas tu inversión en 2-4 años"
        ],
        ejemplo: "Si tu salario promedio es $5,000, con M40 puedes mejorarlo a $15,000, triplicando tu pensión."
      }
    },
    {
      titulo: "¿Es seguro y legal?",
      subtitulo: "Completamente respaldado por la Ley del Seguro Social",
      icono: Award,
      color: "purple",
      contenido: {
        explicacion: "Modalidad 40 está establecida en el Artículo 167 de la Ley del Seguro Social. Es un derecho que tienes como trabajador registrado en el IMSS.",
        beneficios: [
          "🔒 Está en la Ley del Seguro Social",
          "📋 Es un derecho legal establecido",
          "🏛️ Respaldado por el gobierno federal",
          "📄 Documentado en reglamentos oficiales"
        ],
        ejemplo: "Más de 50,000 personas ya han usado M40 exitosamente para mejorar sus pensiones."
      }
    },
    {
      titulo: "¿Cuánto puedo mejorar?",
      subtitulo: "Los resultados dependen de tu situación actual",
      icono: TrendingUp,
      color: "orange",
      contenido: {
        explicacion: "El aumento en tu pensión puede ser desde 50% hasta 300%, dependiendo de tu edad, semanas cotizadas y cuánto inviertas en M40.",
        beneficios: [
          "📈 Mejora promedio: 180%",
          "🎯 Casos exitosos: hasta 300%",
          "⏱️ Tiempo mínimo: 12 meses",
          "💰 Inversión típica: $30,000-$80,000"
        ],
        ejemplo: "Una persona de 52 años con pensión de $4,500 puede llegar a $12,800 mensuales con M40."
      }
    }
  ]

  const paso = pasos[pasoActual]
  const IconComponent = paso.icono

  const handleSiguiente = () => {
    if (pasoActual < pasos.length - 1) {
      setPasoActual(pasoActual + 1)
    }
  }

  const handleAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1)
    }
  }

  // Funciones para scroll táctil
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && pasoActual < pasos.length - 1) {
      setSwipeDirection('left')
      setTimeout(() => {
        setPasoActual(pasoActual + 1)
        setSwipeDirection(null)
      }, 150)
    } else if (isRightSwipe && pasoActual > 0) {
      setSwipeDirection('right')
      setTimeout(() => {
        setPasoActual(pasoActual - 1)
        setSwipeDirection(null)
      }, 150)
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleIrASimulacion = () => {
    // Buscar el HeroOnboard y hacer scroll suave hacia él
    const heroSection = document.querySelector('section')
    if (heroSection) {
      heroSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Modalidad 40 Explicada</h2>
          </div>
                           <motion.button
                   onClick={() => setMostrarCompleto(!mostrarCompleto)}
                   className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all duration-300 font-medium relative overflow-hidden"
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   animate={!mostrarCompleto ? {
                     boxShadow: [
                       "0 0 0 0 rgba(255, 255, 255, 0.7)",
                       "0 0 0 10px rgba(255, 255, 255, 0)",
                       "0 0 0 0 rgba(255, 255, 255, 0)"
                     ]
                   } : {}}
                   transition={{
                     boxShadow: { duration: 2, repeat: Infinity, ease: "easeOut" }
                   }}
                 >
                   <motion.span
                     animate={!mostrarCompleto ? { x: [0, 2, 0] } : {}}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                   >
                     {mostrarCompleto ? "Ver resumen" : "Ver completo"}
                   </motion.span>
                   {!mostrarCompleto && (
                     <motion.div
                       className="absolute inset-0 bg-white/30"
                       animate={{ x: ["-100%", "100%"] }}
                       transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                     />
                   )}
                 </motion.button>
        </div>
        <p className="text-blue-100">
          Todo lo que necesitas saber sobre este mecanismo oficial del IMSS
        </p>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {!mostrarCompleto ? (
          // Versión resumida
          <div className="text-center space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">100% Legal</h3>
                <p className="text-sm text-gray-600">Establecido en el Artículo 167 de la Ley del Seguro Social</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Hasta 300% más</h3>
                <p className="text-sm text-gray-600">Aumento en tu pensión mensual de jubilación</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <Calculator className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">Pagos voluntarios</h3>
                <p className="text-sm text-gray-600">Contribuciones que mejoran tu promedio salarial</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>💡 ¿Quieres saber más?</strong> Haz clic en "Ver completo" para una explicación detallada paso a paso.
              </p>
            </div>
          </div>
        ) : (
          <>
                         {/* Indicador de progreso */}
             <div className="flex justify-between items-center mb-6">
               <div className="flex gap-2">
                 {pasos.map((_, index) => (
                   <div
                     key={index}
                     className={`w-3 h-3 rounded-full transition-colors ${
                       index <= pasoActual ? 'bg-blue-600' : 'bg-gray-300'
                     }`}
                   />
                 ))}
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-600">
                   {pasoActual + 1} de {pasos.length}
                 </span>
                 {/* Indicador de scroll táctil para móvil */}
                 <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                   <motion.span
                     animate={{ x: [-2, 2, -2] }}
                     transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   >
                     ←
                   </motion.span>
                   <span>Desliza</span>
                   <motion.span
                     animate={{ x: [2, -2, 2] }}
                     transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   >
                     →
                   </motion.span>
                 </div>
               </div>
             </div>

            {/* Contenido del paso actual */}
            <motion.div
              key={pasoActual}
              initial={{ opacity: 0, x: 20 }}
              animate={{ 
                opacity: 1, 
                x: swipeDirection === 'left' ? -20 : swipeDirection === 'right' ? 20 : 0 
              }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Título y subtítulo */}
              <div className="text-center">
                <div className={`inline-flex items-center gap-3 p-3 rounded-full mb-4 ${
                  paso.color === 'blue' ? 'bg-blue-100' :
                  paso.color === 'green' ? 'bg-green-100' :
                  paso.color === 'purple' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}>
                  <IconComponent className={`w-8 h-8 ${
                    paso.color === 'blue' ? 'text-blue-600' :
                    paso.color === 'green' ? 'text-green-600' :
                    paso.color === 'purple' ? 'text-purple-600' :
                    'text-orange-600'
                  }`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {paso.titulo}
                </h3>
                <p className="text-lg text-gray-600">
                  {paso.subtitulo}
                </p>
              </div>

              {/* Explicación principal */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-800 text-lg leading-relaxed">
                  {paso.contenido.explicacion}
                </p>
              </div>

              {/* Beneficios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Beneficios principales
                  </h4>
                  <ul className="space-y-2">
                    {paso.contenido.beneficios.map((beneficio, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        {beneficio}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Ejemplo práctico
                  </h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {paso.contenido.ejemplo}
                  </p>
                </div>
              </div>

                             {/* Información adicional */}
               <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                 <div className="flex items-start gap-3">
                   <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                   <div>
                     <h4 className="font-semibold text-yellow-800 mb-1">
                       Información importante
                     </h4>
                     <p className="text-sm text-yellow-700">
                       Todos nuestros cálculos están basados en las tablas oficiales del IMSS actualizadas a 2026.
                       Modalidad 40 es un derecho establecido en la Ley del Seguro Social.
                     </p>
                   </div>
                 </div>
               </div>

               {/* Mensaje motivacional en el último paso */}
               {pasoActual === pasos.length - 1 && (
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5 }}
                   className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-6 rounded-lg text-center"
                 >
                   <div className="text-4xl mb-3">🎯</div>
                   <h4 className="font-bold text-green-800 text-lg mb-2">
                     ¡Perfecto! Ya conoces Modalidad 40
                   </h4>
                   <p className="text-green-700 mb-4">
                     Ahora es momento de descubrir tu potencial real. 
                     Nuestra calculadora te mostrará exactamente cuánto puedes mejorar tu pensión.
                   </p>
                   <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                     <span>✅</span>
                     <span>Cálculos oficiales IMSS</span>
                     <span>•</span>
                     <span>✅</span>
                     <span>Resultados personalizados</span>
                     <span>•</span>
                     <span>✅</span>
                     <span>Estrategias optimizadas</span>
                   </div>
                 </motion.div>
               )}
            </motion.div>

            {/* Navegación */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleAnterior}
                disabled={pasoActual === 0}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  pasoActual === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Anterior
              </button>

              <div className="flex gap-2">
                {pasos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setPasoActual(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === pasoActual ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

                             {pasoActual === pasos.length - 1 ? (
                 <motion.button
                   onClick={handleIrASimulacion}
                   className="px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   animate={{
                     boxShadow: [
                       "0 4px 15px rgba(34, 197, 94, 0.3)",
                       "0 8px 25px rgba(34, 197, 94, 0.4)",
                       "0 4px 15px rgba(34, 197, 94, 0.3)"
                     ]
                   }}
                   transition={{
                     boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                   }}
                 >
                   <motion.span
                     animate={{ x: [0, 3, 0] }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                   >
                     🚀 Ir a mi simulación
                   </motion.span>
                 </motion.button>
               ) : (
                 <button
                   onClick={handleSiguiente}
                   className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                 >
                   Siguiente
                 </button>
               )}
            </div>
          </>
        )}
      </div>

      {/* Footer con garantías */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Basado en Ley 73</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>100% Legal</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Oficial IMSS</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
