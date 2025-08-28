"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import StepSDI from "./steps/StepSDI"
import StepMesesM40 from "./steps/StepMesesM40"
import StepFechaN from "./steps/StepFechaN"
import StepSemanas from "./steps/StepSemanas"
import StepJubi from "./steps/StepJubi"
import StepEstadoCivil from "./steps/StepEstadoCivil"
// 🆕 Nuevos imports
import StepPensionObjetivo from "./steps/StepPensionObjetivo"
import StepRitmoPago from "./steps/StepRitmoPago"
import StepNivelUMA from "./steps/StepNivelUMA"
import StepEstrategiaPersonalizada from "./steps/StepEstrategiaPersonalizada"
import ComparativoEstrategias from "./results/ComparativoEstrategias"
import ComparativaImpacto from "./ComparativaImpacto"
import SidebarTips from "./SidebarTips"
import TooltipInteligente from "./TooltipInteligente"
import { useSimulator } from "./SimulatorContext"

const preguntas = [
  { id: "Nacimiento", component: StepFechaN },
  { id: "Edad de Jubilacion", component: StepJubi },
  { id: "Semanas", component: StepSemanas },
  { id: "sdi", component: StepSDI },
  { id: "Estado Civil", component: StepEstadoCivil },
  // 🆕 NUEVA PREGUNTA COMBINADA
  { id: "Estrategia Personalizada", component: StepEstrategiaPersonalizada },
]

export default function HeroOnboard() {
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [respuestas, setRespuestas] = useState<any>({})
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mostrarComparativa, setMostrarComparativa] = useState(false)

  // Estados para el scroll tracking
  const [scrollProgress, setScrollProgress] = useState(0)
  const [hasScrolled, setHasScrolled] = useState(false)

  // Contexto del simulador
  const { setIsSimulatorActive } = useSimulator()

  // Trackear el scroll - solo la primera vez
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (!hasScrolled && currentScrollY > 100) {
        setHasScrolled(true)
      }
      
      // Solo actualizar si no hemos alcanzado el estado final
      if (currentScrollY <= 800) {
        const progress = Math.min(currentScrollY / 800, 1)
        setScrollProgress(progress)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasScrolled])

  // Actualizar estado del simulador cuando started cambie
  useEffect(() => {
    setIsSimulatorActive(started)
  }, [started, setIsSimulatorActive])

  // Calcular opacidad y escala basado en progreso
  const animationOpacity = 0.05 + (1 - scrollProgress) * 0.15 // De 0.2 a 0.05
  const animationScale = 0.5 + (1 - scrollProgress) * 0.5 // De 1 a 0.5

  const handleNext = (valor?: string | [string, string]) => {
    if (valor !== undefined) {
      if (Array.isArray(valor)) {
        // Caso del nuevo componente StepEstrategiaPersonalizada
        const [pensionObjetivo, nivelUMA] = valor
        setRespuestas({ 
          ...respuestas, 
          "Pension Objetivo": pensionObjetivo,
          "Nivel UMA": nivelUMA
        })
      } else {
        // Caso normal de otros componentes
        setRespuestas({ ...respuestas, [preguntas[step].id]: valor })
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) {
      const prevId = preguntas[step - 1]?.id
      const newRespuestas = { ...respuestas }
      if (prevId) delete newRespuestas[prevId]

      setRespuestas(newRespuestas)
      setStep(step - 1)
    }
  }

  const handleCalcular = async () => {
    setLoading(true)
    try {
      console.log("📤 Enviando datos:", respuestas)

      const res = await fetch("/api/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(respuestas),
      })

      console.log("🔍 Response status:", res.status)
      console.log("🔍 Response headers:", Object.fromEntries(res.headers.entries()))

      const textResponse = await res.text()
      console.log("🔍 Raw response:", textResponse)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${textResponse}`)
      }

      let json
      try {
        json = JSON.parse(textResponse)
      } catch (parseError) {
        console.error("❌ Error parsing JSON:", parseError)
        console.error("❌ Raw response was:", textResponse)
        throw new Error(`Error parsing response: ${textResponse.substring(0, 200)}...`)
      }

      console.log("📊 Resultado Backend:", json)
      setResultado(json)
      
      // Mostrar primero la comparativa de impacto
      setMostrarComparativa(true)
    } catch (error) {
      console.error("❌ Error en cálculo:", error)
      alert(`Hubo un error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const CurrentStep = preguntas[step]?.component
  const total = preguntas.length + 1
  const progreso = Math.round(((step + 1) / total) * 100)

  // Determinar si estamos en la fase de preferencias personales
  const enPreferenciasPersonales = step >= 5 // Después de las 5 preguntas básicas

  return (
    <>
      {/* Anillo animado que sigue el scroll - fixed position */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
        animate={{ opacity: animationOpacity }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.05, 1]
          }}
          style={{ scale: animationScale }}
          transition={{ 
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-80 h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] rounded-full border-4 md:border-6 lg:border-8"
          style={{
            borderImage: 'linear-gradient(45deg, #3b82f6, #10b981, #8b5cf6, #f59e0b) 1',
            background: 'transparent'
          }}
        />
      </motion.div>

      <section className="flex flex-col items-center justify-center min-h-screen px-4 pt-20 relative z-10">
        <div className="w-full max-w-7xl mx-auto">
          {/* Layout responsivo: mobile = stack, desktop = side by side */}
          <div className="lg:flex lg:gap-8 lg:items-center lg:justify-center">
          {/* Contenido principal */}
          <div className="flex-1 max-w-4xl mx-auto text-center lg:text-left">
            {!started && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center relative"
              >
                {/* Contenido principal con z-index */}
                <div className="relative z-10">
                  {/* Badge de confianza */}
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Cálculos verificados con tablas oficiales IMSS 2024
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    ¿Cuánto podrías aumentar tu pensión?
                  </h1>
                  <p className="text-xl text-gray-700 mb-3">
                    Calculadora oficial de <TooltipInteligente termino="Modalidad 40"><strong>Modalidad 40</strong></TooltipInteligente>
                  </p>
                  <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
                    Descubre tu estrategia personalizada en <strong>3 minutos</strong>. 
                    Compara tu pensión actual vs. optimizada con M40.
                  </p>
                </div>

                {/* Beneficios rápidos */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-sm">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="font-semibold text-gray-800">100% Legal y Oficial</div>
                    <div className="text-gray-600">Basado en Ley 73 del IMSS</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl mb-2">🛡️</div>
                    <div className="font-semibold text-gray-800">Cálculos verificados</div>
                    <div className="text-gray-600">Con tablas oficiales 2024</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl mb-2">📈</div>
                    <div className="font-semibold text-gray-800">Hasta 300% más</div>
                    <div className="text-gray-600">De pensión mensual</div>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative z-10 py-8">
                    <motion.button
                      className="bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:bg-blue-800 transition-all duration-300 w-full sm:w-auto min-w-[280px] transform hover:scale-105 hover:shadow-xl"
                      onClick={() => setStarted(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      animate={{ 
                        boxShadow: [
                          "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
                          "0 15px 35px -5px rgba(59, 130, 246, 0.4)", 
                          "0 10px 25px -5px rgba(59, 130, 246, 0.3)"
                        ]
                      }}
                      transition={{ 
                        boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        Calcular mi pensión ahora →
                      </motion.span>
                    </motion.button>
                  </div>
                </div>
                
                <motion.p 
                  className="relative z-10 text-sm text-gray-500 mt-3"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  Gratuito • Sin registro • Resultados inmediatos
                </motion.p>

                
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {started && !resultado && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Barra de progreso con indicador de fase */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <motion.div
                      className={`h-3 rounded-full ${
                        step + 1 === total 
                          ? "bg-green-600" 
                          : enPreferenciasPersonales 
                          ? "bg-purple-600" 
                          : "bg-blue-600"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progreso}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      Paso {Math.min(step + 1, total)} de {total} • Calculadora oficial IMSS
                    </p>
                    {enPreferenciasPersonales && step < preguntas.length && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        Optimización personalizada
                      </span>
                    )}
                  </div>

                  {/* Respuestas archivadas */}
                  <div className="space-y-3 mb-6">
                    {Object.entries(respuestas).map(([k, v]) => (
                      <div key={k} className="bg-gray-100 p-3 rounded-lg shadow-sm text-sm sm:text-base">
                        <b className="capitalize">{k.replace('sdi', 'SDI').replace('Edad de Jubilacion', 'Edad de Jubilación').replace('Estado Civil', 'Estado Civil').replace('Nacimiento', 'Fecha de Nacimiento')}: </b> 
                        {typeof v === 'string' && v.length > 50 ? `${v.substring(0, 50)}...` : v}
                      </div>
                    ))}
                  </div>

                  {/* Pregunta actual */}
                  <AnimatePresence mode="wait">
                    {step < preguntas.length && CurrentStep && (
                      <CurrentStep
                        onNext={handleNext}
                        defaultValue={respuestas[preguntas[step].id]}
                        // Pasar datos del usuario para StepEstrategiaPersonalizada
                        datosUsuario={step === 5 ? {
                          edadJubilacion: parseInt(respuestas["Edad de Jubilacion"]) || 65,
                          semanasPrevias: parseInt(respuestas["Semanas"]) || 500,
                          sdiHistorico: parseFloat(respuestas["sdi"]) || 100
                        } : undefined}
                      />
                    )}
                  </AnimatePresence>

                  {/* Confirmación */}
                  {step === preguntas.length && (
                    <motion.div
                      key="confirmacion"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white p-6 rounded-lg shadow-md text-center"
                    >
                      <h2 className="text-2xl font-bold text-blue-700 mb-4">
                        Calculando tu estrategia personalizada
                      </h2>
                      <p className="text-gray-700 mb-6 text-base">
                        Analizando <strong>más de 2,000 escenarios</strong> con tablas oficiales del IMSS 
                        para encontrar las <strong>5 mejores opciones</strong> según tu situación.
                      </p>
                      <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <p className="text-blue-800 text-sm">
                          <strong>📋 Incluiremos:</strong> Cronograma de pagos, trámites paso a paso, 
                          formatos oficiales y proyección completa hasta tu jubilación.
                        </p>
                      </div>
                      
                      {loading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-blue-600">Calculando estrategias...</span>
                        </div>
                      ) : (
                        <button
                          className="w-full bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700"
                          onClick={handleCalcular}
                        >
                          Calcular mis mejores estrategias
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Botón atrás */}
                  <div className="flex justify-between mt-6">
                    {step > 0 && !loading && (
                      <button
                        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 w-full sm:w-auto"
                        onClick={handleBack}
                      >
                        Atrás
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mostrar comparativa de impacto primero */}
            {resultado && mostrarComparativa && !loading && (
              <ComparativaImpacto
                pensionSinM40={3500} // TODO: calcular real basado en datos usuario
                pensionConM40={resultado.escenarios[0]?.pensionMensual || 8000}
                inversionTotal={resultado.escenarios[0]?.inversionTotal || 50000}
                mesesRecuperacion={resultado.escenarios[0]?.recuperacionMeses || 24}
                onContinuar={() => setMostrarComparativa(false)}
              />
            )}

            {/* Mostrar estrategias después de la comparativa */}
            {resultado && !mostrarComparativa && (
              <ComparativoEstrategias 
                data={resultado} 
                onReinicio={() => {
                  setResultado(null)
                  setRespuestas({})
                  setStep(0)
                  setStarted(false)
                  setMostrarComparativa(false)
                }}
                datosUsuario={{
                  edad: parseInt(respuestas["Edad de Jubilacion"]) || 65,
                  dependiente: respuestas["Estado Civil"] === "Casado(a)" ? "conyuge" : "ninguno",
                  sdiHistorico: parseFloat(respuestas["sdi"]) || 100,
                  semanasPrevias: parseInt(respuestas["Semanas"]) || 500,
                  inicioM40: resultado.metadatos?.inicioM40 || "2024-02-01"
                }}
              />
            )}
          </div>

          {/* Sidebar con tips - visible en mobile y desktop */}
          {started && !resultado && (
            <div className="lg:w-80 mt-6 lg:mt-0">
              <SidebarTips 
                currentStep={preguntas[step]?.id || ""}
                isVisible={step < preguntas.length}
              />
            </div>
          )}
          </div>
        </div>
      </section>
    </>
  )
}