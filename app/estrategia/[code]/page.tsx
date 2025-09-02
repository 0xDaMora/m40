"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, AlertCircle, CheckCircle, Share2 } from "lucide-react"
import EstrategiaDetallada from "@/components/EstrategiaDetallada"

export default function EstrategiaCompartiblePage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const code = params.code as string
    
    if (!code) {
      setError("Código de estrategia no válido")
      setLoading(false)
      return
    }

    // Verificar si el código es válido (empieza con compra_, integration_ o premium_)
    if (!code.startsWith("compra_") && !code.startsWith("integration_") && !code.startsWith("premium_")) {
      setError("Código de estrategia no válido")
      setLoading(false)
      return
    }

    setIsValid(true)
    cargarEstrategia(code)
  }, [params.code])

  const cargarEstrategia = async (code: string) => {
    setLoading(true)
    setError("")

    // Si es una estrategia Premium, intentar cargarla desde localStorage
    if (code.startsWith("premium_")) {
      console.log('Intentando cargar estrategia Premium:', code)
      try {
        const estrategiaData = localStorage.getItem('estrategiaPremium')
        console.log('Datos encontrados en localStorage:', estrategiaData)
                 if (estrategiaData) {
           const data = JSON.parse(estrategiaData)
           console.log('Datos parseados:', data)
           console.log('🔍 Comparación de datos en estrategia detallada:', {
             localStorage: {
               pensionMensual: data.pensionMensual,
               inversionTotal: data.inversionTotal,
               mesesM40: data.mesesM40,
               umaElegida: data.umaElegida,
               ROI: data.ROI,
               pensionConAguinaldo: data.pensionConAguinaldo,
               puntaje: data.puntaje,
               ranking: data.ranking
             },
             strategyCode: data.strategyCode,
             code: code
           })
           if (data.strategyCode === code) {
                          // Usar los datos del localStorage - SIN TRANSFORMACIONES
             setData({
               estrategia: {
                 ...data, // Usar TODOS los campos originales sin modificar
                 // Solo asegurar que el campo estrategia esté presente
                 estrategia: data.estrategia || (data.progresivo ? 'progresivo' : 'fijo')
               },
              datosUsuario: {
                ...data.datosUsuario,
                nombreFamiliar: data.familyMemberName
              },
              infoCompartida: {
                creadoPor: "Usuario Premium",
                familiar: data.familyMemberName,
                fechaCreacion: new Date(),
                visualizaciones: 1
              }
            })
            setLoading(false)
            return
          }
        }
      } catch (error) {
        console.error('Error cargando estrategia Premium desde localStorage:', error)
      }
    }

    try {
      const response = await fetch("/api/estrategia-compartible", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Si la estrategia no existe en la base de datos, intentar calcularla desde los parámetros de URL
        if (response.status === 404) {
          console.log('Estrategia no encontrada en BD, intentando calcular desde URL...')
          const urlParams = new URLSearchParams(window.location.search)
          const code = params.code as string
          
          // Extraer parámetros de la URL si están disponibles
          if (urlParams.has('edadJubilacion') && urlParams.get('fechaNacimiento')) {
            // Reconstruir datos desde URL
            const datosUsuario = {
              // Priorizar fechaInicio si está disponible, sino usar fecha como fallback
              inicioM40: urlParams.get('fechaInicio') || urlParams.get('fecha') || "2024-02-01",
              edad: parseInt(urlParams.get('edad') || "58"),
              dependiente: urlParams.get('dependiente') || "conyuge",
              sdiHistorico: parseFloat(urlParams.get('sdi') || "150"),
              semanasPrevias: parseInt(urlParams.get('semanas') || "500"),
              nombreFamiliar: urlParams.get('nombreFamiliar') || "No especificado",
              edadActual: parseInt(urlParams.get('edadActual') || "0"),
              semanasCotizadas: parseInt(urlParams.get('semanasCotizadas') || "500"),
              sdiActual: parseFloat(urlParams.get('sdiActual') || "150"),
              salarioMensual: parseFloat(urlParams.get('salarioMensual') || "0"),
              estadoCivil: urlParams.get('estadoCivil') || "soltero",
              fechaNacimiento: urlParams.get('fechaNacimiento'),
              edadJubilacion: parseInt(urlParams.get('edadJubilacion') || "58"),
              aportacionPromedio: parseFloat(urlParams.get('aportacionPromedio') || "0")
            }
            
            // Calcular estrategia
            const params = {
              mesesM40: parseInt(urlParams.get('meses') || "36"),
              estrategia: urlParams.get('estrategia') || "fijo",
              umaElegida: parseInt(urlParams.get('uma') || "15"),
              edad: parseInt(urlParams.get('edad') || "58"),
              dependiente: urlParams.get('dependiente') || "conyuge",
              sdiHistorico: parseFloat(urlParams.get('sdi') || "150"),
              semanasPrevias: parseInt(urlParams.get('semanas') || "500"),
              // Priorizar fechaInicio si está disponible, sino usar fecha como fallback
              inicioM40: new Date(urlParams.get('fechaInicio') || urlParams.get('fecha') || "2024-02-01")
            }
            
            // Importar y usar el calculador
            const { calcularEscenarioDetallado } = await import('@/lib/all/calculatorDetailed')
            const resultado = calcularEscenarioDetallado(params)
            
            setData({
              estrategia: {
                mesesM40: resultado.mesesM40,
                estrategia: resultado.estrategia,
                umaElegida: resultado.umaElegida,
                inversionTotal: resultado.inversionTotal,
                pensionMensual: resultado.pensionMensual,
                pensionConAguinaldo: resultado.pensionConAguinaldo,
                ROI: resultado.ROI,
                recuperacionMeses: resultado.recuperacionMeses,
                factorEdad: resultado.factorEdad,
                conFactorEdad: resultado.conFactorEdad,
                conLeyFox: resultado.conLeyFox,
                conDependiente: resultado.conDependiente,
                registros: resultado.registros || []
              },
              datosUsuario,
              infoCompartida: {
                creadoPor: "Usuario",
                familiar: datosUsuario.nombreFamiliar,
                fechaCreacion: new Date(),
                visualizaciones: 1
              }
            })
            return
          }
        }
        throw new Error(result.error || "Error al cargar la estrategia")
      }

      setData(result)
    } catch (err: any) {
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const compartirEstrategia = () => {
    const url = window.location.href
    const mensaje = `¡Mira mi estrategia de Modalidad 40! ${url}`
    
    if (navigator.share) {
      navigator.share({
        title: "Mi Estrategia Modalidad 40",
        text: mensaje,
        url: url
      })
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(url).then(() => {
        alert("Link copiado al portapapeles")
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estrategia...</p>
        </div>
      </div>
    )
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Estrategia no encontrada
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "El código de estrategia no es válido o ha expirado."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 mx-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Estrategia Compartida
                  </h1>
                  <p className="text-sm text-gray-500">
                    Estrategia de Modalidad 40
                  </p>
                </div>
              </div>
              
              <button
                onClick={compartirEstrategia}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="py-8">
          <EstrategiaDetallada
            estrategia={data.estrategia}
            datosUsuario={data.datosUsuario}
            onVolver={() => window.history.back()}
          />
        </div>
      </div>
    )
  }

  return null
}
