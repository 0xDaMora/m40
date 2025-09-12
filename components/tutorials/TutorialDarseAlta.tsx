"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  ExternalLink,
  X,
  Calendar,
  FileText,
  AlertCircle
} from "lucide-react"

interface TutorialDarseAltaProps {
  onClose: () => void
  fechaInicio: Date
  formatDate: (date: Date) => string
}

export default function TutorialDarseAlta({ 
  onClose, 
  fechaInicio, 
  formatDate 
}: TutorialDarseAltaProps) {
  const [paginaActual, setPaginaActual] = useState(1)
  const totalPaginas = 4

  const pasos = [
    {
      titulo: "Acceder a la Plataforma IMSS",
      contenido: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Paso 1: Ingresar al Portal</h4>
            <p className="text-blue-700 text-sm mb-3">
              Ve al portal oficial del IMSS y accede con tu CURP y contraseña.
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
            <h5 className="font-medium text-gray-800">Requisitos previos:</h5>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Tener CURP activa
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Contraseña del IMSS
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Conexión a internet estable
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      titulo: "Navegar a Modalidad 40",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Paso 2: Buscar la Sección</h4>
            <p className="text-green-700 text-sm">
              Una vez dentro del portal, busca la sección "Modalidad 40" o "Pagos Voluntarios".
            </p>
          </div>
          
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800">Ubicación en el menú:</h5>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Ruta:</strong> Servicios → Pensiones → Modalidad 40 → Inscripción
              </p>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 text-sm font-medium">Importante</p>
                  <p className="text-yellow-700 text-xs">
                    Si no encuentras la opción, verifica que tu cuenta esté activa y actualizada.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Completar el Formulario",
      contenido: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Paso 3: Llenar Datos</h4>
            <p className="text-purple-700 text-sm">
              Completa todos los campos requeridos con información verídica y actualizada.
            </p>
          </div>
          
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800">Datos requeridos:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Fecha de nacimiento',
                'Domicilio actual',
                'Teléfono de contacto',
                'Correo electrónico',
                'Número de semanas cotizadas',
                'Último salario registrado'
              ].map((campo) => (
                <div key={campo} className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{campo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Confirmar Inscripción",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Paso 4: Finalizar</h4>
            <p className="text-green-700 text-sm">
              Revisa toda la información y confirma tu inscripción en Modalidad 40.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Fecha de inicio</span>
              </div>
              <p className="text-blue-700 text-sm">
                Tu Modalidad 40 comenzará el: <strong>{formatDate(fechaInicio)}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Próximos pasos:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Recibirás confirmación por email
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Generarás tu línea de captura mensual
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Comenzarás a realizar pagos voluntarios
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ]

  const siguientePagina = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1)
    }
  }

  const paginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1)
    }
  }

  const finalizarTutorial = () => {
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Darse de Alta en Modalidad 40</h3>
            <p className="text-blue-100 text-sm">
              Tutorial paso a paso - Página {paginaActual} de {totalPaginas}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Barra de progreso */}
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
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={paginaActual}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="text-xl font-bold text-gray-900 mb-4">
              {pasos[paginaActual - 1].titulo}
            </h4>
            {pasos[paginaActual - 1].contenido}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegación */}
      <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
        <button
          onClick={paginaAnterior}
          disabled={paginaActual === 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
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
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={finalizarTutorial}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Finalizar
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
