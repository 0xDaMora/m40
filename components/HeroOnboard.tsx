"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Info, AlertCircle, HelpCircle, X, User } from "lucide-react"
import { toast } from "react-hot-toast"
import HeroOnboardStrategiesView from "./results/HeroOnboardStrategiesView"
import TooltipInteligente from "./TooltipInteligente"
import { useSimulator } from "./SimulatorContext"
import { useRouter } from "next/navigation"
import TutorialSemanasModal from "./tutorials/TutorialSemanasModal"
import TutorialSDIModal from "./tutorials/TutorialSDIModal"

// Porcentajes por edad de jubilación (Ley 73)
const porcentajesJubilacion: Record<number, number> = {
  60: 75, 61: 80, 62: 85, 63: 90, 64: 95, 65: 100,
}


export default function HeroOnboard() {
  const [started, setStarted] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showSDITutorial, setShowSDITutorial] = useState(false)
  const [showSemanasTutorial, setShowSemanasTutorial] = useState(false)
  const resultadoRef = useRef<HTMLDivElement>(null)
  const formularioRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Campos del formulario
  const [nombre, setNombre] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("1969-01-01")
  const [errorFecha, setErrorFecha] = useState("")
  const [edadJubilacion, setEdadJubilacion] = useState<number | null>(null)
  const [semanas, setSemanas] = useState("")
  const [sdiPromedio, setSdiPromedio] = useState("")
  const [sdiFormateado, setSdiFormateado] = useState("")
  const [errorSDI, setErrorSDI] = useState("")
  const [estadoCivil, setEstadoCivil] = useState<string | null>(null)
  const [cotizandoActivamente, setCotizandoActivamente] = useState<boolean | null>(null)

  // Contexto del simulador
  const { setIsSimulatorActive } = useSimulator()

  useEffect(() => {
    setIsSimulatorActive(started)
  }, [started, setIsSimulatorActive])

  // Scroll to results when they appear
  useEffect(() => {
    if (resultado && resultadoRef.current) {
      resultadoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [resultado])

  useEffect(() => {
    if (started && formularioRef.current) {
      requestAnimationFrame(() => {
        formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [started])

  // Validaciones
  const fechaMinima = "1959-01-01"
  const fechaMaxima = "1979-12-31"

  const calcularEdad = (fecha: string) => {
    if (!fecha) return null
    const hoy = new Date()
    const nac = new Date(fecha)
    let edad = hoy.getFullYear() - nac.getFullYear()
    const m = hoy.getMonth() - nac.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
    return edad
  }

  const validarFecha = (fecha: string) => {
    if (!fecha) { setErrorFecha("Selecciona tu fecha de nacimiento"); return false }
    const f = new Date(fecha)
    if (f < new Date(fechaMinima) || f > new Date(fechaMaxima)) {
      setErrorFecha("Debe ser entre 1959 y 1979 para aplicar a Ley 73")
      return false
    }
    setErrorFecha("")
    return true
  }

  // Semanas helper - integers only
  const handleSemanasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limpio = e.target.value.replace(/[^\d]/g, '')
    setSemanas(limpio)
  }

  // SDI helpers - integers only
  const validarSDI = (v: string) => {
    const n = parseInt(v)
    if (isNaN(n)) { setErrorSDI("Ingresa un número válido"); return false }
    if (n < 30) { setErrorSDI("El SDI debe ser mayor a $30 diarios"); return false }
    if (n > 6000) { setErrorSDI("El SDI no puede exceder $6,000 diarios"); return false }
    setErrorSDI("")
    return true
  }
  const handleSDIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limpio = e.target.value.replace(/[^\d]/g, '')
    setSdiPromedio(limpio)
    setSdiFormateado(limpio ? parseInt(limpio).toLocaleString('es-MX') : "")
    if (limpio) {
      validarSDI(limpio)
    } else {
      setErrorSDI("")
    }
  }

  // Verificar si el formulario es válido
  const edadActual = calcularEdad(fechaNacimiento)
  const sdiValido = sdiPromedio && !errorSDI && parseInt(sdiPromedio) >= 30
  const formularioValido = 
    fechaNacimiento && !errorFecha &&
    edadJubilacion !== null &&
    semanas && parseInt(semanas) >= 250 &&
    sdiValido &&
    estadoCivil !== null &&
    cotizandoActivamente !== null

  const handleCalcular = async () => {
    if (!formularioValido) {
      toast.error("Por favor completa todos los campos correctamente")
      return
    }

    // Validar fecha una vez más
    if (!validarFecha(fechaNacimiento)) return

    setLoading(true)
    try {
      const sdiValue = parseInt(sdiPromedio)

      const transformedResult = {
        datosUsuario: {
          edad: edadJubilacion,
          dependiente: estadoCivil === "conyuge" ? "conyuge" : "ninguno",
          estadoCivil: estadoCivil === "conyuge" ? "casado" : "soltero",
          sdiHistorico: sdiValue,
          semanasPrevias: parseInt(semanas),
          fechaNacimiento: fechaNacimiento,
          inicioM40: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
          isCurrentlyContributing: cotizandoActivamente === true,
          salarioBruto: sdiValue * 30.4,
          nombre: nombre.trim() || undefined,
          "Edad de Jubilacion": String(edadJubilacion),
          "Semanas": semanas,
          "Nacimiento": fechaNacimiento,
          "sdi": sdiValue.toString(),
          "Estado Civil": estadoCivil,
        }
      }

      setResultado(transformedResult)
    } catch (error) {
      console.error("Error en cálculo:", error)
      toast.error("Hubo un error al calcular. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex flex-col items-center justify-center min-h-screen px-3 sm:px-4 pt-20 relative z-10">
      <div className="w-full max-w-6xl mx-auto">
        {/* HERO INTRO - Antes de presionar "Calcular" */}
        {!started && !resultado && (
          <div className="text-center">
            {/* Badge */}
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

            {/* Beneficios */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-sm">
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

            {/* Botones */}
            <div className="py-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <motion.button
                  className="bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:bg-blue-800 transition-all duration-300 w-full sm:w-auto min-w-[280px]"
                  onClick={() => setStarted(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Calcular mi pensión ahora →
                </motion.button>

                <motion.button
                  className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:bg-green-700 transition-all duration-300 w-full sm:w-auto min-w-[280px]"
                  onClick={() => router.push('/yam40')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ya estoy en modalidad 40
                </motion.button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600 max-w-4xl mx-auto">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                  <div>
                    <span className="font-semibold text-gray-700">Calcular mi pensión ahora:</span>
                    <span className="text-gray-600"> Para usuarios que aún no están en Modalidad 40.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5"></div>
                  <div>
                    <span className="font-semibold text-gray-700">Ya estoy en modalidad 40:</span>
                    <span className="text-gray-600"> Si ya llevas tiempo pagando, calcula tu pensión actual.</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-3">
              Gratuito • Sin registro • Resultados inmediatos
            </p>
          </div>
        )}

        {/* FORMULARIO - Formato amplio tipo generador de gráficas */}
        {started && (
          <div ref={formularioRef}>
            {/* Header del formulario */}
            <div className="text-center mb-5 sm:mb-6 scroll-mt-24">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Calculadora de Pensión Modalidad 40
              </h2>
              <p className="text-gray-600">
                Completa tus datos para calcular tu mejor estrategia de pensión
              </p>
            </div>

            {/* Grid layout amplio - 2 columnas en desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
              {/* Nombre (opcional) */}
              <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <User className="w-4 h-4 inline mr-1.5 text-blue-600" />
                  Tu nombre <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full border border-gray-300 p-2.5 text-base rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Fecha de Nacimiento */}
              <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1.5 text-blue-600" />
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  min={fechaMinima}
                  max={fechaMaxima}
                  onChange={(e) => { setFechaNacimiento(e.target.value); setErrorFecha("") }}
                  className={`w-full border p-2.5 text-base rounded-lg focus:ring-2 focus:ring-blue-500 ${errorFecha ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errorFecha && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errorFecha}
                  </p>
                )}
                {edadActual && !errorFecha && (
                  <p className="text-green-600 text-xs mt-1">
                    {edadActual} años — Ley 73
                  </p>
                )}
              </div>

              {/* Edad de Jubilación */}
              <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  ¿A qué edad deseas jubilarte?
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {Object.keys(porcentajesJubilacion).map((age) => (
                    <button
                      key={age}
                      onClick={() => setEdadJubilacion(parseInt(age))}
                      className={`p-2 rounded-lg text-sm font-bold transition-all ${
                        edadJubilacion === parseInt(age)
                          ? "bg-blue-700 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
                {edadJubilacion && (
                  <p className="text-xs text-blue-700 mt-2">
                    A los {edadJubilacion} años → <strong>{porcentajesJubilacion[edadJubilacion]}%</strong> de pensión
                  </p>
                )}
              </div>

              {/* Semanas Cotizadas */}
              <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Semanas cotizadas
                  </label>
                  <button
                    onClick={() => setShowSemanasTutorial(true)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Tutorial
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={semanas}
                  onChange={handleSemanasChange}
                  placeholder="Ej: 1200 (mínimo 250)"
                  className="w-full border border-gray-300 p-2.5 text-base rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {semanas && parseInt(semanas) < 250 && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Mínimo 250 semanas
                  </p>
                )}
              </div>

              {/* Promedio SDI */}
              <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-800">
                    Promedio SDI (diario)
                  </label>
                  <button
                    onClick={() => setShowSDITutorial(true)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Tutorial
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    placeholder="Ej: 500"
                    value={sdiFormateado}
                    onChange={handleSDIChange}
                    className={`w-full border p-2.5 pl-7 text-base rounded-lg focus:ring-2 focus:ring-blue-500 ${errorSDI ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {sdiValido && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    </div>
                  )}
                </div>
                {errorSDI && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errorSDI}
                  </p>
                )}
                {sdiValido && (
                  <p className="text-green-600 text-xs mt-1">
                    SDI: ${parseInt(sdiPromedio).toLocaleString('es-MX')} /día → ~${Math.round(parseInt(sdiPromedio) * 30.4).toLocaleString('es-MX')} /mes
                  </p>
                )}
              </div>

              {/* Estado Civil */}
              <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  ¿Casado(a) o en concubinato?
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEstadoCivil("conyuge")}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      estadoCivil === "conyuge" ? "bg-blue-700 text-white shadow-md" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setEstadoCivil("ninguno")}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      estadoCivil === "ninguno" ? "bg-blue-700 text-white shadow-md" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    No
                  </button>
                </div>
                {estadoCivil === "conyuge" && (
                  <p className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                    +15% pensión por asignación familiar
                  </p>
                )}
              </div>

              {/* ¿Cotizando activamente? */}
              <div className="bg-white p-3.5 sm:p-5 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  ¿Cotizando actualmente en el IMSS?
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCotizandoActivamente(true)}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      cotizandoActivamente === true ? "bg-blue-700 text-white shadow-md" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    Sí, cotizando
                  </button>
                  <button
                    onClick={() => setCotizandoActivamente(false)}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                      cotizandoActivamente === false ? "bg-blue-700 text-white shadow-md" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    No
                  </button>
                </div>
                {cotizandoActivamente === true && (
                  <p className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                    Las semanas adicionales se sumarán al cálculo
                  </p>
                )}
              </div>
            </div>

            {/* Botón de calcular - full width debajo del grid */}
            <div className="mt-5 sm:mt-6 mb-4">
              <button
                onClick={handleCalcular}
                disabled={!formularioValido || loading}
                className={`w-full py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg ${
                  formularioValido && !loading
                    ? 'bg-blue-700 text-white hover:bg-blue-800 hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Calculando estrategias...
                  </span>
                ) : (
                  'Calcular mi pensión'
                )}
              </button>

              {!formularioValido && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  Completa todos los campos para continuar
                </p>
              )}

              {/* Botón volver - solo si no hay resultados */}
              {!resultado && (
                <button
                  onClick={() => { setStarted(false); setResultado(null) }}
                  className="w-full mt-2 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 transition-all text-sm font-medium"
                >
                  ← Volver al inicio
                </button>
              )}
            </div>

            {/* RESULTADOS - Misma página, debajo del formulario */}
            {resultado && resultado.datosUsuario && (
              <div ref={resultadoRef} className="mt-6 sm:mt-8 border-t-2 border-blue-200 pt-6 sm:pt-8">
                <HeroOnboardStrategiesView
                  datosUsuario={resultado.datosUsuario}
                  initialFilters={{
                    familyMemberId: null,
                    monthlyContributionRange: { min: 1000, max: 25000 },
                    months: 58,
                    retirementAge: resultado.datosUsuario.edad || 65,
                    startMonth: (() => {
                      const fechaInicio = new Date(resultado.datosUsuario.inicioM40)
                      return fechaInicio.getMonth() + 1
                    })(),
                    startYear: (() => {
                      const fechaInicio = new Date(resultado.datosUsuario.inicioM40)
                      return fechaInicio.getFullYear()
                    })(),
                    monthsMode: 'scan'
                  }}
                  onReinicio={() => {
                    setResultado(null)
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Modales tutorial */}
        <TutorialSDIModal isOpen={showSDITutorial} onClose={() => setShowSDITutorial(false)} />
        <TutorialSemanasModal isOpen={showSemanasTutorial} onClose={() => setShowSemanasTutorial(false)} />
      </div>
    </section>
  )
}