"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  ExternalLink,
  X,
  FileText,
  AlertCircle
} from "lucide-react"

interface TutorialSemanasModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TutorialSemanasModal({ isOpen, onClose }: TutorialSemanasModalProps) {
  const [paginaActual, setPaginaActual] = useState(1)
  const totalPaginas = 3

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
      titulo: "Acceder al Portal del IMSS",
      contenido: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Paso 1: Ingresar al Portal</h4>
            <p className="text-blue-700 text-sm mb-3">
              Ingresa al portal de Servicios Digitales del IMSS con tu CURP y contraseña.
            </p>
            <a 
              href="https://serviciosdigitales.imss.gob.mx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Ir al Portal IMSS
            </a>
          </div>
          
          <div className="space-y-2">
            <h5 className="font-medium text-gray-800">Requisitos:</h5>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Tener tu CURP a la mano
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Contraseña del portal IMSS
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                También puedes llamar al INFONAVIT: 800 008 3900
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      titulo: "Buscar tu Constancia de Semanas",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Paso 2: Descargar Constancia</h4>
            <p className="text-green-700 text-sm mb-3">
              Dentro del portal, busca la opción <strong>"Constancia de Semanas Cotizadas"</strong> o <strong>"Semanas Reconocidas"</strong>.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-800 mb-3">Ruta en el portal:</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <span className="text-sm text-gray-700">Ingresa a <strong>"Mi Cuenta"</strong> o <strong>"Servicios en Línea"</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <span className="text-sm text-gray-700">Selecciona <strong>"Constancia de Semanas Cotizadas"</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <span className="text-sm text-gray-700">Se generará un PDF con tus semanas reconocidas</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700">
                El documento muestra las <strong>semanas reconocidas al día</strong>. Si estás cotizando actualmente, se siguen sumando semanas cada bimestre.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Leer tu Constancia",
      contenido: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Paso 3: Ubicar el Dato</h4>
            <p className="text-purple-700 text-sm mb-3">
              En el PDF descargado, busca el campo que dice <strong>"Total de Semanas Cotizadas"</strong> o <strong>"Semanas Reconocidas"</strong>.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-medium text-gray-800 mb-2">Ejemplo de constancia:</h5>
            <div className="bg-white p-4 rounded border border-gray-300 font-mono text-sm">
              <div className="text-gray-500 mb-2">─── Constancia de Semanas Cotizadas ───</div>
              <div className="space-y-1">
                <div>CURP: <span className="text-gray-600">XXXX000000XXXXXX00</span></div>
                <div>NSS: <span className="text-gray-600">0000000000</span></div>
                <div className="bg-yellow-100 px-2 py-1 rounded font-bold text-gray-900">
                  Total de Semanas Cotizadas: <span className="text-blue-600">847</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-green-700">
                <strong>Ese es el número que necesitas.</strong> Ingresa ese valor en el campo "Semanas Cotizadas" del simulador. Si no tienes acceso al portal, puedes estimar: cada año trabajado equivale a ~52 semanas.
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-5 rounded-t-2xl sm:rounded-t-xl shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              <h3 className="text-base sm:text-lg font-bold">Tutorial: Semanas Cotizadas</h3>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100 text-sm">
            Paso {paginaActual} de {totalPaginas}: {pasos[paginaActual - 1].titulo}
          </p>
          
          <div className="mt-3 bg-blue-500 rounded-full h-2">
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
                  i + 1 === paginaActual ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {paginaActual < totalPaginas ? (
            <button
              onClick={siguientePagina}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
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
