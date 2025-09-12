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
  DollarSign,
  TrendingUp
} from "lucide-react"

interface TutorialSolicitarAforeProps {
  onClose: () => void
  formatDate: (date: Date) => string
  fechaAfore: Date
}

export default function TutorialSolicitarAfore({ 
  onClose, 
  formatDate,
  fechaAfore
}: TutorialSolicitarAforeProps) {
  const [paginaActual, setPaginaActual] = useState(1)
  const totalPaginas = 5

  const pasos = [
    {
      titulo: "¿Qué es el AFORE?",
      contenido: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Administradora de Fondos para el Retiro</h4>
            <p className="text-blue-700 text-sm mb-3">
              El AFORE es tu cuenta individual donde se acumulan tus ahorros para el retiro, 
              incluyendo las aportaciones de tu empleador y las tuyas voluntarias.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">¿Qué contiene tu AFORE?</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span>Aportaciones patronales (6.5% del salario)</span>
                </li>
                <li className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span>Aportaciones obrero-patronales (1.125%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span>Cuota social del gobierno</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Rendimientos generados</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 text-sm font-medium">Importante</p>
                  <p className="text-yellow-700 text-xs">
                    Solo puedes retirar estos recursos 3 meses después de recibir tu pensión del IMSS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Identificar tu AFORE",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">¿Cuál es tu AFORE?</h4>
            <p className="text-green-700 text-sm">
              Primero necesitas identificar en qué AFORE tienes tus recursos acumulados.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Fecha de solicitud</span>
              </div>
              <p className="text-blue-700 text-sm">
                Puedes solicitar desde: <strong>{formatDate(fechaAfore)}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Cómo identificar tu AFORE:</h5>
              <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                <li>Revisa tu último estado de cuenta</li>
                <li>Consulta en el portal del CONSAR</li>
                <li>Llama al 800-900-4000 (CONSAR)</li>
                <li>Visita la página web de tu AFORE</li>
                <li>Revisa tu historial laboral</li>
              </ol>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">AFORES principales:</h5>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>• Sura</div>
                <div>• Profuturo</div>
                <div>• Coppel</div>
                <div>• Principal</div>
                <div>• XXI Banorte</div>
                <div>• Inbursa</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Preparar Documentación",
      contenido: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Documentos Necesarios</h4>
            <p className="text-purple-700 text-sm">
              Reúne toda la documentación requerida para agilizar el proceso de retiro.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">Documentos obligatorios:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Identificación oficial vigente</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>CURP (original y copia)</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Comprobante de pensión IMSS</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Comprobante de domicilio</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Estado de cuenta AFORE</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-800 text-sm font-medium">Documentos adicionales</p>
                  <p className="text-green-700 text-xs">
                    Pueden solicitar comprobantes de ingresos o declaraciones fiscales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Solicitar el Retiro",
      contenido: (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">Proceso de Solicitud</h4>
            <p className="text-orange-700 text-sm">
              Puedes solicitar tu retiro de AFORE de forma presencial o en línea.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">Presencial</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Visitar sucursal de tu AFORE</li>
                <li>• Llenar formulario de solicitud</li>
                <li>• Entregar documentación</li>
                <li>• Recibir comprobante</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">En Línea</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Acceder al portal de tu AFORE</li>
                <li>• Completar solicitud digital</li>
                <li>• Subir documentos escaneados</li>
                <li>• Recibir confirmación</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Tiempo de procesamiento</span>
            </div>
            <p className="text-blue-700 text-sm">
              El retiro se procesa entre 5 a 15 días hábiles después de la solicitud.
            </p>
          </div>
        </div>
      )
    },
    {
      titulo: "Recibir tus Recursos",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">¡Recursos Disponibles!</h4>
            <p className="text-green-700 text-sm">
              Una vez procesada tu solicitud, recibirás el total de tus recursos acumulados.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">Formas de recibir el dinero:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Transferencia bancaria</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Cheque certificado</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Depósito en cuenta</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Consideraciones importantes:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>El retiro es definitivo</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>Puede tener implicaciones fiscales</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>Consulta con un contador</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>Invierte sabiamente</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-800 text-sm font-medium">Recomendación</p>
                  <p className="text-blue-700 text-xs">
                    Considera invertir estos recursos en instrumentos que te generen ingresos 
                    adicionales para tu retiro.
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
      <div className="bg-orange-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Solicitar Recursos de AFORE</h3>
            <p className="text-orange-100 text-sm">
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
        <div className="mt-3 bg-orange-500 rounded-full h-2">
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
                i + 1 === paginaActual ? 'bg-orange-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {paginaActual < totalPaginas ? (
          <button
            onClick={siguientePagina}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
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
