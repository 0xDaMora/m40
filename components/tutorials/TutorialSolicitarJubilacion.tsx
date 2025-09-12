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
  AlertCircle,
  Clock,
  Award
} from "lucide-react"

interface TutorialSolicitarJubilacionProps {
  onClose: () => void
  formatDate: (date: Date) => string
  fechaJubilacion: Date
}

export default function TutorialSolicitarJubilacion({ 
  onClose, 
  formatDate,
  fechaJubilacion
}: TutorialSolicitarJubilacionProps) {
  const [paginaActual, setPaginaActual] = useState(1)
  const totalPaginas = 5

  const pasos = [
    {
      titulo: "Preparar Documentación",
      contenido: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Documentos Requeridos</h4>
            <p className="text-blue-700 text-sm mb-3">
              Antes de solicitar tu jubilación, asegúrate de tener toda la documentación necesaria.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">Documentos obligatorios:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Acta de nacimiento (original y copia)</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>CURP (original y copia)</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Comprobante de domicilio (no mayor a 3 meses)</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Identificación oficial vigente</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Comprobantes de pago M40</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 text-sm font-medium">Importante</p>
                  <p className="text-yellow-700 text-xs">
                    Todos los documentos deben estar en buen estado y ser legibles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Agendar Cita en el IMSS",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Proceso de Cita</h4>
            <p className="text-green-700 text-sm">
              Debes agendar una cita en la Subdelegación del IMSS más cercana a tu domicilio.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Fecha de jubilación</span>
              </div>
              <p className="text-blue-700 text-sm">
                Tu fecha programada: <strong>{formatDate(fechaJubilacion)}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Cómo agendar:</h5>
              <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                <li>Llama al 800-623-2323 (IMSS)</li>
                <li>Selecciona la opción de "Pensiones"</li>
                <li>Proporciona tu CURP y datos</li>
                <li>Elige fecha y horario disponible</li>
                <li>Anota tu número de folio</li>
              </ol>
            </div>
            
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 text-sm font-medium">Recomendación</p>
                  <p className="text-red-700 text-xs">
                    Agenda tu cita con al menos 15 días de anticipación a tu fecha de jubilación.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Asistir a la Cita",
      contenido: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Día de la Cita</h4>
            <p className="text-purple-700 text-sm">
              Llega puntual y con toda tu documentación para agilizar el proceso.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">Checklist del día:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Llegar 15 minutos antes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Llevar todos los documentos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Vestir ropa formal</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Llevar pluma y papel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Actitud positiva y paciente</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Durante la cita:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Revisión de documentos</li>
                <li>• Verificación de datos personales</li>
                <li>• Cálculo de pensión</li>
                <li>• Firma de documentos</li>
                <li>• Entrega de comprobante</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Proceso de Evaluación",
      contenido: (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">Revisión del IMSS</h4>
            <p className="text-orange-700 text-sm">
              El IMSS revisará tu caso y calculará tu pensión basándose en tu historial de cotizaciones.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Tiempo de procesamiento</span>
              </div>
              <p className="text-blue-700 text-sm">
                El proceso puede tomar entre 30 a 90 días hábiles.
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">¿Qué revisan?</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Historial de cotizaciones</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Pagos de Modalidad 40</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Edad y semanas cotizadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Documentación completa</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-800 text-sm font-medium">Resultado</p>
                  <p className="text-green-700 text-xs">
                    Recibirás una resolución con el monto de tu pensión mensual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Recibir tu Pensión",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">¡Felicidades!</h4>
            <p className="text-green-700 text-sm">
              Una vez aprobada tu pensión, comenzarás a recibir tus pagos mensuales.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Frecuencia de pagos</span>
              </div>
              <p className="text-blue-700 text-sm">
                Los pagos se realizan mensualmente, generalmente entre los días 1-5 de cada mes.
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Próximos pasos:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Recibir resolución de pensión</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Configurar cuenta bancaria</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Recibir primer pago</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Solicitar recursos de AFORE</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 text-sm font-medium">Recordatorio</p>
                  <p className="text-yellow-700 text-xs">
                    No olvides solicitar tus recursos de AFORE no utilizados 3 meses después 
                    de recibir tu pensión.
                  </p>
                </div>
              </div>
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
      <div className="bg-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Solicitar Jubilación</h3>
            <p className="text-purple-100 text-sm">
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
        <div className="mt-3 bg-purple-500 rounded-full h-2">
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
                i + 1 === paginaActual ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {paginaActual < totalPaginas ? (
          <button
            onClick={siguientePagina}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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
