"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Calendar, Clock } from "lucide-react"
import TimelineChart from "./TimelineChart"
import TutorialDarseAlta from "./tutorials/TutorialDarseAlta"
import TutorialRealizarPagos from "./tutorials/TutorialRealizarPagos"
import TutorialBajaMora from "./tutorials/TutorialBajaMora"
import TutorialSolicitarJubilacion from "./tutorials/TutorialSolicitarJubilacion"
import TutorialSolicitarAfore from "./tutorials/TutorialSolicitarAfore"

interface EstrategiaDetalladaTramitesProps {
  fechaTramite: Date
  formatDate: (date: Date) => string
  // Datos de la estrategia para la línea de tiempo
  fechaInicio: Date
  fechaJubilacion: Date
  mesesM40: number
  registros: Array<{
    fecha: string
    uma: number
    tasaM40?: number
    sdiMensual: number
    cuotaMensual: number
    acumulado: number
  }>
  esProgresivo: boolean
  formatCurrency: (amount: number) => string
}

export default function EstrategiaDetalladaTramites({ 
  fechaTramite, 
  formatDate,
  fechaInicio,
  fechaJubilacion,
  mesesM40,
  registros,
  esProgresivo,
  formatCurrency
}: EstrategiaDetalladaTramitesProps) {
  const [tutorialAbierto, setTutorialAbierto] = useState<string | null>(null)

  const abrirTutorial = (tutorialId: string) => {
    setTutorialAbierto(tutorialId)
  }

  const cerrarTutorial = () => {
    setTutorialAbierto(null)
  }

  const tramites = [
    {
      id: 'darse_alta',
      num: '1',
      title: 'Darse de alta en Modalidad 40',
      desc: 'Ingresa a la plataforma y date de alta en Modalidad 40',
      fecha: fechaInicio,
      color: 'blue'
    },
    {
      id: 'realizar_pagos',
      num: '2',
      title: 'Realizar pagos mensuales',
      desc: 'Revisa las líneas de captura y realiza tus pagos a tiempo',
      fecha: null, // Se muestra en la línea de tiempo
      color: 'green'
    },
    {
      id: 'solicitar_jubilacion',
      num: '3',
      title: 'Solicitar jubilación',
      desc: 'Acude a ventanilla y solicita tu jubilación',
      fecha: fechaJubilacion,
      color: 'purple'
    },
    {
      id: 'solicitar_afore',
      num: '4',
      title: 'Solicitar recursos de AFORE',
      desc: 'Una vez tengas tu visto bueno de pensión, solicita tus recursos de AFORE no utilizados',
      fecha: new Date(fechaJubilacion.getTime() + 90 * 24 * 60 * 60 * 1000), // +3 meses
      color: 'orange'
    }
  ]

  // Agregar trámite de baja por mora si es progresivo
  if (esProgresivo) {
    tramites.splice(2, 0, {
      id: 'baja_mora',
      num: '2.5',
      title: 'Baja por mora (Dic/Ene)',
      desc: 'No pagar Diciembre y Enero para optimizar UMA',
      fecha: null,
      color: 'red'
    })
  }
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        {/* Header con fecha recomendada */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-green-800 mb-1">
                Línea de Tiempo de Trámites
              </h4>
              <p className="text-sm text-green-700">
                Inicio recomendado: {formatDate(fechaTramite)}
              </p>
            </div>
          </div>
        </div>

        {/* Línea de Tiempo */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Cronología de Pagos y Trámites
          </h3>
          <TimelineChart
            fechaInicio={fechaInicio}
            fechaJubilacion={fechaJubilacion}
            mesesM40={mesesM40}
            registros={registros}
            esProgresivo={esProgresivo}
            onTramiteClick={abrirTutorial}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Lista de Trámites con Tutoriales */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Trámites y Tutoriales
          </h3>
          <div className="space-y-4">
            {tramites.map((tramite) => (
              <div key={tramite.id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        tramite.color === 'blue' ? 'bg-blue-600' :
                        tramite.color === 'green' ? 'bg-green-600' :
                        tramite.color === 'red' ? 'bg-red-600' :
                        tramite.color === 'purple' ? 'bg-purple-600' :
                        'bg-orange-600'
                      }`}>
                        {tramite.num}
                      </div>
                      <h4 className="font-semibold text-gray-800">
                        {tramite.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {tramite.desc}
                    </p>
                    {tramite.fecha && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Fecha: {formatDate(tramite.fecha)}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => abrirTutorial(tramite.id)}
                    className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                      tramite.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      tramite.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                      tramite.color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                      tramite.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    Ver Tutorial
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentos Requeridos */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Documentos Requeridos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {[
                'Identificación oficial vigente',
                'Comprobante de domicilio',
                'Acta de nacimiento',
                'Constancia de semanas cotizadas',
                'Comprobantes de pagos M40'
              ].map((doc) => (
                <div key={doc} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{doc}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                'CURP (original y copia)',
                'Comprobante de pensión IMSS',
                'Estado de cuenta AFORE',
                'Comprobantes de ingresos',
                'Declaraciones fiscales'
              ].map((doc) => (
                <div key={doc} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modales de Tutoriales */}
      <AnimatePresence>
        {tutorialAbierto && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {tutorialAbierto === 'darse_alta' && (
                <TutorialDarseAlta
                  onClose={cerrarTutorial}
                  fechaInicio={fechaInicio}
                  formatDate={formatDate}
                />
              )}
              {tutorialAbierto === 'realizar_pagos' && (
                <TutorialRealizarPagos
                  onClose={cerrarTutorial}
                  formatCurrency={formatCurrency}
                  cuotaMensual={registros[0]?.cuotaMensual || 0}
                />
              )}
              {tutorialAbierto === 'baja_mora' && (
                <TutorialBajaMora
                  onClose={cerrarTutorial}
                  formatDate={formatDate}
                />
              )}
              {tutorialAbierto === 'solicitar_jubilacion' && (
                <TutorialSolicitarJubilacion
                  onClose={cerrarTutorial}
                  formatDate={formatDate}
                  fechaJubilacion={fechaJubilacion}
                />
              )}
              {tutorialAbierto === 'solicitar_afore' && (
                <TutorialSolicitarAfore
                  onClose={cerrarTutorial}
                  formatDate={formatDate}
                  fechaAfore={new Date(fechaJubilacion.getTime() + 90 * 24 * 60 * 60 * 1000)}
                />
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
