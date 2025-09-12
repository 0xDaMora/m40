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
  AlertTriangle,
  AlertCircle,
  TrendingUp
} from "lucide-react"

interface TutorialBajaMoraProps {
  onClose: () => void
  formatDate: (date: Date) => string
}

export default function TutorialBajaMora({ 
  onClose, 
  formatDate
}: TutorialBajaMoraProps) {
  const [paginaActual, setPaginaActual] = useState(1)
  const totalPaginas = 5

  const pasos = [
    {
      titulo: "¿Qué es la Baja por Mora?",
      contenido: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-800 mb-2">Concepto</h4>
            <p className="text-red-700 text-sm mb-3">
              La baja por mora es un proceso automático que ocurre cuando no realizas 
              tus pagos mensuales en tiempo y forma.
            </p>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-xs">
                <strong>Importante:</strong> En estrategias progresivas, esto se usa 
                estratégicamente para optimizar el UMA.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h5 className="font-medium text-gray-800">¿Cuándo ocurre?</h5>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-red-500" />
                No pagar durante 2 meses consecutivos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-red-500" />
                El sistema te da de baja automáticamente
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-red-500" />
                Pierdes el derecho a continuar en M40
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      titulo: "Estrategia Progresiva: No Pagar Dic/Ene",
      contenido: (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Patrón Estratégico</h4>
            <p className="text-yellow-700 text-sm">
              En estrategias progresivas, se usa la baja por mora de forma calculada 
              para aprovechar el nuevo UMA de febrero.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-red-100 p-3 rounded-lg border border-red-300">
              <h5 className="font-medium text-red-800 mb-2">Diciembre - No Pagar</h5>
              <p className="text-red-700 text-sm">
                Intencionalmente no realizas el pago de diciembre para iniciar 
                el proceso de baja por mora.
              </p>
            </div>
            
            <div className="bg-red-100 p-3 rounded-lg border border-red-300">
              <h5 className="font-medium text-red-800 mb-2">Enero - No Pagar</h5>
              <p className="text-red-700 text-sm">
                Tampoco pagas enero, completando los 2 meses requeridos para 
                la baja automática.
              </p>
            </div>
            
            <div className="bg-green-100 p-3 rounded-lg border border-green-300">
              <h5 className="font-medium text-green-800 mb-2">Febrero - Reingreso</h5>
              <p className="text-green-700 text-sm">
                Te das de alta nuevamente con el nuevo UMA vigente y un salario más alto.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Proceso de Baja Automática",
      contenido: (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">¿Qué sucede?</h4>
            <p className="text-orange-700 text-sm">
              El sistema del IMSS procesa automáticamente tu baja por mora.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Cronología del proceso:</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-sm text-gray-700">Día 17 de enero: Vence el pago</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span className="text-sm text-gray-700">Sistema detecta mora de 2 meses</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-sm text-gray-700">Baja automática procesada</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <span className="text-sm text-gray-700">Notificación de baja enviada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Reingreso en Febrero",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Nueva Inscripción</h4>
            <p className="text-green-700 text-sm">
              Una vez que tienes la baja, te das de alta nuevamente con mejores condiciones.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Ventajas del reingreso</span>
              </div>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Nuevo UMA vigente (mayor valor)</li>
                <li>• Salario base más alto</li>
                <li>• Mejor cálculo de pensión</li>
                <li>• Reinicio del período de cotización</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Proceso de reingreso:</h5>
              <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                <li>Acceder al portal del IMSS</li>
                <li>Nueva inscripción en Modalidad 40</li>
                <li>Actualizar datos con nuevo salario</li>
                <li>Pagar los 2 meses de retardo (Dic/Ene)</li>
                <li>Continuar con pagos normales</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Consideraciones Importantes",
      contenido: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Riesgos y Beneficios</h4>
            <p className="text-purple-700 text-sm">
              Esta estrategia tiene ventajas pero también requiere consideraciones especiales.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-medium text-green-800 mb-2">✅ Beneficios</h5>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Mayor UMA base</li>
                <li>• Salario más alto</li>
                <li>• Mejor pensión final</li>
                <li>• Optimización fiscal</li>
              </ul>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h5 className="font-medium text-red-800 mb-2">⚠️ Consideraciones</h5>
              <ul className="space-y-1 text-sm text-red-700">
                <li>• Interrupción temporal</li>
                <li>• Pago de meses atrasados</li>
                <li>• Complejidad del proceso</li>
                <li>• Requiere planificación</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 text-sm font-medium">Recomendación</p>
                <p className="text-yellow-700 text-xs">
                  Esta estrategia solo debe usarse si tienes una estrategia progresiva 
                  y entiendes completamente los riesgos y beneficios.
                </p>
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
      <div className="bg-red-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Baja por Mora - Estrategia Progresiva</h3>
            <p className="text-red-100 text-sm">
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
        <div className="mt-3 bg-red-500 rounded-full h-2">
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
                i + 1 === paginaActual ? 'bg-red-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {paginaActual < totalPaginas ? (
          <button
            onClick={siguientePagina}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
