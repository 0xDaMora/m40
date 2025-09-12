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
  CreditCard,
  AlertCircle,
  Clock
} from "lucide-react"

interface TutorialRealizarPagosProps {
  onClose: () => void
  formatCurrency: (amount: number) => string
  cuotaMensual: number
}

export default function TutorialRealizarPagos({ 
  onClose, 
  formatCurrency,
  cuotaMensual
}: TutorialRealizarPagosProps) {
  const [paginaActual, setPaginaActual] = useState(1)
  const totalPaginas = 5

  const pasos = [
    {
      titulo: "Generar Línea de Captura",
      contenido: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Paso 1: Acceder al Portal</h4>
            <p className="text-blue-700 text-sm mb-3">
              Ingresa al portal del IMSS y ve a la sección de Modalidad 40.
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
            <h5 className="font-medium text-gray-800">Proceso de generación:</h5>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Selecciona "Generar línea de captura"
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Elige el mes correspondiente
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Confirma el monto: {formatCurrency(cuotaMensual)}
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      titulo: "Métodos de Pago Disponibles",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Paso 2: Elegir Forma de Pago</h4>
            <p className="text-green-700 text-sm">
              Tienes varias opciones para realizar tu pago mensual.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h5 className="font-medium text-gray-800">En Línea</h5>
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Transferencia bancaria</li>
                <li>• Tarjeta de débito/crédito</li>
                <li>• SPEI</li>
                <li>• Pago en tiendas de conveniencia</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-5 h-5 text-green-600" />
                <h5 className="font-medium text-gray-800">Presencial</h5>
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Ventanillas bancarias</li>
                <li>• OXXO, 7-Eleven</li>
                <li>• Farmacias Guadalajara</li>
                <li>• Supermercados</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Realizar el Pago",
      contenido: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Paso 3: Procesar Pago</h4>
            <p className="text-purple-700 text-sm">
              Una vez que tengas tu línea de captura, procede con el pago.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-800 text-sm font-medium">Importante</p>
                  <p className="text-yellow-700 text-xs">
                    Realiza el pago antes del día 17 de cada mes para evitar recargos.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Instrucciones:</h5>
              <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
                <li>Ingresa los datos de tu línea de captura</li>
                <li>Verifica que el monto sea correcto</li>
                <li>Confirma los datos del beneficiario</li>
                <li>Realiza el pago</li>
                <li>Guarda tu comprobante</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Verificar Pago Aplicado",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Paso 4: Confirmación</h4>
            <p className="text-green-700 text-sm">
              Verifica que tu pago se haya aplicado correctamente en el sistema.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Tiempo de procesamiento</span>
              </div>
              <p className="text-blue-700 text-sm">
                Los pagos se reflejan en el sistema entre 24-48 horas hábiles.
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Cómo verificar:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Revisa tu historial de pagos en el portal
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Verifica tu saldo acumulado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Confirma la fecha de aplicación
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      titulo: "Mantener el Ritmo",
      contenido: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Paso 5: Continuidad</h4>
            <p className="text-green-700 text-sm">
              Mantén la constancia en tus pagos para maximizar tu pensión.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Recordatorios</span>
              </div>
              <p className="text-blue-700 text-sm">
                Programa recordatorios para no olvidar tus pagos mensuales.
              </p>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-800">Consejos importantes:</h5>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Paga siempre antes del día 17
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Guarda todos tus comprobantes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Revisa mensualmente tu saldo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Mantén actualizados tus datos
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
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Realizar Pagos Mensuales</h3>
            <p className="text-green-100 text-sm">
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
                i + 1 === paginaActual ? 'bg-green-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {paginaActual < totalPaginas ? (
          <button
            onClick={siguientePagina}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Siguiente
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={finalizarTutorial}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Finalizar
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
