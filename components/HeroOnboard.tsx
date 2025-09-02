"use client"

import { useState, useEffect, useRef } from "react"
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
import { ChevronLeft, ChevronRight, Calculator, TrendingUp, Users, Shield, CheckCircle, ArrowRight, Calendar, DollarSign, Target, Clock } from "lucide-react"
import { toast } from "react-hot-toast"
import ComparativoEstrategias from "./results/ComparativoEstrategias"
import ComparativaImpacto from "./ComparativaImpacto"
import SidebarTips from "./SidebarTips"
import TooltipInteligente from "./TooltipInteligente"
import { useSimulator } from "./SimulatorContext"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

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

  const handleNext = async (valor?: string | [string, string]) => {
    let newRespuestas = { ...respuestas }
    
    if (valor !== undefined) {
      if (Array.isArray(valor)) {
        // Caso del nuevo componente StepEstrategiaPersonalizada
        const [pensionObjetivo, nivelUMA] = valor
        newRespuestas = { 
          ...newRespuestas, 
          "Pension Objetivo": pensionObjetivo,
          "Nivel UMA": nivelUMA
        }
      } else {
        // Caso normal de otros componentes
        newRespuestas = { ...newRespuestas, [preguntas[step].id]: valor }
      }
    }
    
    setRespuestas(newRespuestas)
    const nextStep = step + 1
    setStep(nextStep)
    
    // Si es la última pregunta, calcular automáticamente con los datos actualizados
    if (nextStep === preguntas.length) {
      // Usar los datos actualizados directamente
      setTimeout(() => {
        handleCalcularWithData(newRespuestas)
      }, 100)
    }
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
    await handleCalcularWithData(respuestas)
  }

  const handleCalcularWithData = async (datos: any) => {
    setLoading(true)
    try {
      console.log("📤 Datos originales:", datos)

             // Transformar datos de HeroOnboard al formato esperado por /api/calculate-strategies
       const familyData = {
         id: "hero-onboard",
         name: "Usuario",
         birthDate: new Date(datos.Nacimiento),
         weeksContributed: parseInt(datos.Semanas),
         lastGrossSalary: parseFloat(datos.sdi) * 30.4, // Convertir SDI diario a mensual
         civilStatus: datos["Estado Civil"] === "conyuge" ? "casado" : "soltero"
       }

             // Calcular rango de aportación basado en el nivel UMA seleccionado por el usuario
       const nivelUMA = datos["Nivel UMA"] || "equilibrado"
       const pensionObjetivo = datos["Pension Objetivo"] || "equilibrada"
       
       console.log("🎯 Preferencias del usuario:", { nivelUMA, pensionObjetivo })
       
       let monthlyContributionRange = { min: 5000, max: 15000 } // Default
       
       switch (nivelUMA) {
         case "conservador":
           monthlyContributionRange = { min: 2000, max: 8000 }
           break
         case "equilibrado":
           monthlyContributionRange = { min: 5000, max: 15000 }
           break
         case "maximo":
           monthlyContributionRange = { min: 10000, max: 25000 }
           break
       }

      const filters = {
        familyMemberId: null,
        monthlyContributionRange,
        months: 58, // Default para HeroOnboard
        retirementAge: parseInt(datos["Edad de Jubilacion"])
      }

      // Incluir las preferencias del usuario
      const userPreferences = {
        nivelUMA: nivelUMA,
        pensionObjetivo: pensionObjetivo
      }
      
      const requestData = { familyData, filters, userPreferences }
      console.log("📤 Datos transformados:", requestData)
      console.log("🎯 Preferencias del usuario incluidas:", userPreferences)

      const res = await fetch("/api/calculate-strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
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
      
      // Transformar la respuesta al formato esperado por ComparativoEstrategias
      const transformedResult = {
        estrategias: json.strategies || [],
        datosUsuario: {
          edad: parseInt(datos["Edad de Jubilacion"]),
          // StepEstadoCivil guarda "conyuge" | "ninguno"
          dependiente: datos["Estado Civil"] === "conyuge" ? "conyuge" : "ninguno",
          estadoCivil: datos["Estado Civil"] === "conyuge" ? "casado" : "soltero",
          sdiHistorico: parseFloat(datos.sdi),
          semanasPrevias: parseInt(datos.Semanas),
          fechaNacimiento: datos.Nacimiento,
          inicioM40: new Date().toISOString().split('T')[0]
        }
      }
      
      setResultado(transformedResult)
      
      // Mostrar primero la comparativa de impacto
      setMostrarComparativa(true)
    } catch (error) {
      console.error("❌ Error en cálculo:", error)
      alert(`Hubo un error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const CurrentStep = preguntas[step]?.component
  const total = preguntas.length
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
          transition={{ 
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-80 h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] rounded-full border-4 md:border-6 lg:border-8"
          style={{
            scale: animationScale,
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
                    Cálculos verificados con tablas oficiales IMSS 2025
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
                    <div className="text-gray-600">Con tablas oficiales 2025</div>
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
                         step === preguntas.length - 1
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
                       Paso {step + 1} de {total} • Calculadora oficial IMSS
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
                        {typeof v === 'string' && v.length > 50 ? `${v.substring(0, 50)}...` : String(v)}
                      </div>
                    ))}
                  </div>

                  {/* Pregunta actual */}
                  <AnimatePresence mode="wait">
                    {step < preguntas.length && CurrentStep && (
                      <CurrentStep
                        key={`step-${step}`}
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

                                     {/* Loading state cuando se está calculando automáticamente */}
                   {step === preguntas.length && loading && (
                     <motion.div
                       key="calculando"
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
                       
                       <div className="flex items-center justify-center gap-3">
                         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                         <span className="text-blue-600">Calculando estrategias...</span>
                       </div>
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
             {resultado && mostrarComparativa && !loading && resultado.estrategias && resultado.estrategias.length > 0 && (
               <ComparativaImpacto
                 pensionSinM40={(() => {
                   // Calcular pensión real sin M40 basada en SDI del usuario
                   const sdiDiario = parseFloat(respuestas["sdi"]) || 100
                   const sdiMensual = sdiDiario * 30.4
                   const semanasActuales = parseInt(respuestas["Semanas"]) || 500
                   
                   // Calcular según Ley 73 (sin M40)
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
                 })()}
                 pensionConM40={resultado.estrategias[0]?.pensionMensual || 8000}
                 inversionTotal={resultado.estrategias[0]?.inversionTotal || 50000}
                 mesesRecuperacion={resultado.estrategias[0]?.recuperacionMeses || 24}
                 onContinuar={() => setMostrarComparativa(false)}
               />
             )}

                                      {/* Mostrar estrategias después de la comparativa */}
             {resultado && !mostrarComparativa && resultado.estrategias && resultado.estrategias.length > 0 && (
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
                   dependiente: respuestas["Estado Civil"] === "conyuge" ? "conyuge" : "ninguno",
                   estadoCivil: respuestas["Estado Civil"] === "conyuge" ? "casado" : "soltero",
                   sdiHistorico: parseFloat(respuestas["sdi"]) || 100,
                   semanasPrevias: parseInt(respuestas["Semanas"]) || 500,
                   inicioM40: resultado.datosUsuario?.inicioM40 || "2024-02-01",
                   fechaNacimiento: respuestas["Nacimiento"],
                   // Datos completos del HeroOnboard para el modal de registro
                   ...respuestas
                 }}
               />
             )}

             {/* Mostrar mensaje si no se encontraron estrategias */}
             {resultado && !mostrarComparativa && (!resultado.estrategias || resultado.estrategias.length === 0) && (
               <div className="text-center py-12">
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                   <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                     No se encontraron estrategias válidas
                   </h3>
                   <p className="text-yellow-700 mb-4">
                     Con los datos proporcionados, no se encontraron estrategias de Modalidad 40 que cumplan con los requisitos.
                   </p>
                   <button
                     onClick={() => {
                       setResultado(null)
                       setRespuestas({})
                       setStep(0)
                       setStarted(false)
                       setMostrarComparativa(false)
                     }}
                     className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                   >
                     Intentar de nuevo
                   </button>
                 </div>
               </div>
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