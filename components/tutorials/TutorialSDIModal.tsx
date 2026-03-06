"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  ExternalLink,
  X,
  Calculator,
  AlertCircle
} from "lucide-react"

interface TutorialSDIModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TutorialSDIModal({ isOpen, onClose }: TutorialSDIModalProps) {
  const [paginaActual, setPaginaActual] = useState(1)
  const totalPaginas = 4

  const siguientePagina = () => {
    if (paginaActual < totalPaginas) setPaginaActual(paginaActual + 1)
  }

  const paginaAnterior = () => {
    if (paginaActual > 1) setPaginaActual(paginaActual - 1)
  }

  const finalizarTutorial = () => {
    setPaginaActual(1)
    onClose()
  }

  const pasos = [
    {
      titulo: "¿Qué es el SDI?",
      contenido: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Salario Diario Integrado (SDI)</h4>
            <p className="text-blue-700 text-sm mb-3">
              El <strong>SDI</strong> es tu salario diario más las prestaciones de ley (aguinaldo, vacaciones, prima vacacional). 
              Es el salario con el que estás registrado ante el IMSS y con el que se calculan tus cotizaciones.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-800 mb-2">¿Por qué necesitamos el promedio?</h5>
            <p className="text-sm text-gray-600">
              El IMSS calcula tu pensión usando el <strong>promedio de los últimos 5 años (250 semanas)</strong> de tu SDI. 
              Si tu SDI varió durante tu vida laboral, el promedio refleja mejor tu situación real.
            </p>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700">
                <strong>Importante:</strong> El SDI NO es lo mismo que tu sueldo neto. Generalmente es mayor que tu salario base diario.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Obtener tu SDI del Portal IMSS",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Paso 1: Acceder al Portal</h4>
            <p className="text-green-700 text-sm mb-3">
              Ingresa al portal de Servicios Digitales del IMSS con tu CURP y contraseña.
            </p>
            <a 
              href="https://serviciosdigitales.imss.gob.mx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Ir al Portal IMSS
            </a>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-800 mb-3">Ruta en el portal:</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <span className="text-sm text-gray-700">Ingresa a <strong>"Servicios en Línea"</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <span className="text-sm text-gray-700">Busca <strong>"Constancia de Semanas Cotizadas"</strong> o <strong>"Historial Laboral"</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <span className="text-sm text-gray-700">Descarga el PDF — ahí aparece tu SDI por cada empleo</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Calcular tu Promedio SDI",
      contenido: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Paso 2: Promediar tus Salarios</h4>
            <p className="text-purple-700 text-sm mb-3">
              En tu constancia verás los SDI de cada empleo. Toma los <strong>últimos 5 años</strong> y promédialos.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-800 mb-2">Ejemplo de cálculo:</h5>
            <div className="bg-white p-4 rounded border border-gray-300 text-sm">
              <div className="space-y-1 mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Empleo 2020-2022:</span>
                  <span className="font-semibold">SDI $350/día</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Empleo 2022-2024:</span>
                  <span className="font-semibold">SDI $420/día</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Empleo 2024-actual:</span>
                  <span className="font-semibold">SDI $500/día</span>
                </div>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-blue-600">
                <span>Promedio SDI:</span>
                <span>(350 + 420 + 500) / 3 ≈ $423/día</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Calculator className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Si tuviste un solo empleo, usa directamente ese SDI. Si tuviste varios, pondera por el tiempo en cada empleo para mayor precisión.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Estimación Rápida sin Portal",
      contenido: (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">Alternativa: Estimar tu SDI</h4>
            <p className="text-orange-700 text-sm mb-3">
              Si no tienes acceso al portal, puedes estimar tu SDI a partir de tu sueldo mensual.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-800 mb-2">Fórmula aproximada:</h5>
            <div className="bg-white p-4 rounded border border-gray-300">
              <div className="text-center space-y-3">
                <div className="text-sm text-gray-600">
                  <strong>SDI diario</strong> ≈ (Sueldo mensual bruto / 30) × <strong>1.0493</strong>
                </div>
                <hr />
                <div className="text-sm">
                  <span className="text-gray-600">Ejemplo: Sueldo $15,000/mes</span>
                </div>
                <div className="text-sm">
                  SDI ≈ ($15,000 / 30) × 1.0493 = <span className="font-bold text-blue-600">$524.65/día</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-800 mb-2">Tabla de referencia rápida:</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-gray-500">$10,000/mes</div>
                <div className="font-bold text-gray-800">≈ $350 SDI</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-gray-500">$15,000/mes</div>
                <div className="font-bold text-gray-800">≈ $525 SDI</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-gray-500">$20,000/mes</div>
                <div className="font-bold text-gray-800">≈ $700 SDI</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-gray-500">$30,000/mes</div>
                <div className="font-bold text-gray-800">≈ $1,050 SDI</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700">
                <strong>Listo:</strong> Ingresa tu SDI estimado (diario) en el campo del simulador. No necesita ser exacto — puedes ajustarlo después cuando tengas tu constancia oficial.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-5 rounded-t-2xl sm:rounded-t-xl shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
              <h3 className="text-base sm:text-lg font-bold">Tutorial: Promedio SDI</h3>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-green-100 text-sm">
            Paso {paginaActual} de {totalPaginas}: {pasos[paginaActual - 1].titulo}
          </p>
          
          <div className="mt-3 bg-green-500 rounded-full h-2">
            <motion.div
              className="bg-white rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: `${(paginaActual / totalPaginas) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={paginaActual}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                {pasos[paginaActual - 1].titulo}
              </h4>
              {pasos[paginaActual - 1].contenido}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navegación */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-b-none sm:rounded-b-xl border-t border-gray-200 shrink-0 gap-3">
          <button
            onClick={paginaAnterior}
            disabled={paginaActual === 1}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
              paginaActual === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i + 1 === paginaActual ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {paginaActual < totalPaginas ? (
            <button
              onClick={siguientePagina}
              className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finalizarTutorial}
              className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              Entendido
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
