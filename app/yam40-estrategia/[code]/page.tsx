"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, AlertCircle } from "lucide-react"
import EstrategiaDetalladaYam40 from "@/components/yam40/EstrategiaDetalladaYam40"

export default function Yam40EstrategiaPage() {
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

    // Verificar si el código es válido (debe empezar con yam40_)
    if (!code.startsWith("yam40_")) {
      setError("Código de estrategia no válido - Solo se aceptan códigos yam40_")
      setLoading(false)
      return
    }

    setIsValid(true)
    cargarEstrategia(code)
  }, [params.code])

  const cargarEstrategia = async (code: string) => {
    setLoading(true)
    setError("")

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
        // Si la estrategia no existe en la base de datos, intentar desde parámetros de URL
        if (response.status === 404) {
          console.log('Estrategia yam40 no encontrada en BD, intentando desde URL...')
          const urlParams = new URLSearchParams(window.location.search)
          
          // Extraer parámetros de la URL si están disponibles
          if (urlParams.has('edadJubilacion') && urlParams.get('fechaNacimiento')) {
            const datosUsuario = {
              inicioM40: urlParams.get('fechaInicio') || urlParams.get('fecha') || new Date().toISOString().split('T')[0],
              edad: parseInt(urlParams.get('edad') || "58"),
              dependiente: urlParams.get('dependiente') || "ninguno",
              sdiHistorico: parseFloat(urlParams.get('sdi') || "150"),
              semanasPrevias: parseInt(urlParams.get('semanas') || "500"),
              nombreFamiliar: urlParams.get('nombreFamiliar') || "Usuario",
              edadActual: parseInt(urlParams.get('edadActual') || "0"),
              semanasCotizadas: parseInt(urlParams.get('semanasCotizadas') || "500"),
              sdiActual: parseFloat(urlParams.get('sdiActual') || "150"),
              salarioMensual: parseFloat(urlParams.get('salarioMensual') || "0"),
              estadoCivil: urlParams.get('estadoCivil') || "soltero",
              fechaNacimiento: urlParams.get('fechaNacimiento'),
              edadJubilacion: parseInt(urlParams.get('edadJubilacion') || "65"),
              aportacionPromedio: parseFloat(urlParams.get('aportacionPromedio') || "0")
            }

            const estrategia = {
              mesesM40: parseInt(urlParams.get('meses') || "0"),
              estrategia: urlParams.get('estrategia') || "fijo",
              umaElegida: parseFloat(urlParams.get('uma') || "15"),
              inversionTotal: parseInt(urlParams.get('inversionTotal') || "0"),
              pensionMensual: parseInt(urlParams.get('pensionMensual') || "0"),
              pensionConAguinaldo: parseInt(urlParams.get('pensionConAguinaldo') || "0"),
              ROI: parseFloat(urlParams.get('ROI') || "0"),
              recuperacionMeses: parseInt(urlParams.get('recuperacionMeses') || "0"),
              factorEdad: parseFloat(urlParams.get('factorEdad') || "1"),
              conFactorEdad: parseInt(urlParams.get('conFactorEdad') || "0"),
              conLeyFox: parseInt(urlParams.get('conLeyFox') || "0"),
              conDependiente: parseInt(urlParams.get('conDependiente') || "0"),
              registros: [],
              tipo: 'yam40',
              fechaInicioM40: urlParams.get('fechaInicioM40'),
              fechaFinM40: urlParams.get('fechaFinM40'),
              tipoPago: urlParams.get('tipoPago') as 'aportacion' | 'uma' | undefined,
              modoEntradaPagos: urlParams.get('modoEntradaPagos') as 'rango' | 'manual' | undefined
            }

            setData({
              estrategia,
              datosUsuario,
              infoCompartida: {
                creadoPor: "Usuario",
                familiar: datosUsuario.nombreFamiliar,
                fechaCreacion: new Date(),
                visualizaciones: 1
              }
            })
            setLoading(false)
            return
          }
        }
        throw new Error(result.error || "Error al cargar la estrategia")
      }

      setData(result)
    } catch (err: any) {
      console.error('Error cargando estrategia yam40:', err)
      setError(err.message || "Error desconocido")
    } finally {
      setLoading(false)
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
        <div className="py-8">
          <EstrategiaDetalladaYam40
            estrategia={{
              ...data.estrategia,
              esMejora: (params.code as string)?.includes('_mejora_') || data.estrategia?.esMejora
            }}
            datosUsuario={data.datosUsuario}
            onVolver={() => window.history.back()}
            debugCode={params.code as string}
            familyMemberId={data.familyMemberId}
          />
        </div>
      </div>
    )
  }

  return null
}

