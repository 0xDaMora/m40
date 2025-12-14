"use client"

import { motion } from "framer-motion"
import { Calendar, AlertTriangle, CheckCircle, Info, ArrowRight } from "lucide-react"
import { useFormatters } from "@/hooks/useFormatters"

interface MetaDerechosProps {
  birthDate: Date | null
  retirementAge: number
  semanasAntesM40: number
  mesesPagadosM40: number
  fechaFinM40: { mes: number; año: number }
}

export default function MetaDerechos({
  birthDate,
  retirementAge,
  semanasAntesM40,
  mesesPagadosM40,
  fechaFinM40
}: MetaDerechosProps) {
  const { currency: formatCurrency } = useFormatters()

  if (!birthDate) {
    return null
  }

  // Calcular semanas totales
  const semanasM40 = Math.floor(mesesPagadosM40 * 4.33)
  const semanasTotales = semanasAntesM40 + semanasM40

  // Calcular años de conservación (preservación de derechos)
  // Fórmula: Años de conservación = Semanas cotizadas totales / 208 semanas
  const añosConservacion = semanasTotales / 208

  // Calcular fecha objetivo de jubilación
  const fechaNacimiento = new Date(birthDate)
  const añoJubilacion = fechaNacimiento.getFullYear() + retirementAge
  const mesJubilacion = fechaNacimiento.getMonth() + 1 // Mes de cumpleaños

  // Calcular fecha del último pago M40
  const fechaUltimoPago = new Date(fechaFinM40.año, fechaFinM40.mes - 1, 1)
  const fechaObjetivoJubilacion = new Date(añoJubilacion, mesJubilacion - 1, 1)

  // Calcular años de espera desde último pago hasta jubilación
  const diferenciaMeses = (fechaObjetivoJubilacion.getFullYear() - fechaUltimoPago.getFullYear()) * 12 +
                          (fechaObjetivoJubilacion.getMonth() - fechaUltimoPago.getMonth())
  const añosEspera = diferenciaMeses / 12

  // Verificar si puede preservar derechos
  const puedePreservar = añosEspera <= añosConservacion

  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ]

  // Calcular edad mínima de jubilación posible (60 años)
  const edadMinimaJubilacion = 60
  const añoMinimoJubilacion = fechaNacimiento.getFullYear() + edadMinimaJubilacion
  const fechaMinimaJubilacion = new Date(añoMinimoJubilacion, mesJubilacion - 1, 1)
  const diferenciaMesesMinima = (fechaMinimaJubilacion.getFullYear() - fechaUltimoPago.getFullYear()) * 12 +
                                (fechaMinimaJubilacion.getMonth() - fechaUltimoPago.getMonth())
  const añosEsperaMinima = diferenciaMesesMinima / 12
  const puedePreservarMinima = añosEsperaMinima <= añosConservacion

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Esto jubilándote a {retirementAge} años
        </h3>
        
        {/* Información de espera */}
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-100 mb-3">
            Si hoy te das de baja ({meses[fechaFinM40.mes - 1]} {fechaFinM40.año}) y esperas hasta{" "}
            <span className="font-semibold text-white">
              {meses[mesJubilacion - 1]} {añoJubilacion}
            </span>{" "}
            cuando cumples {retirementAge} años, te jubilarías ya con esta cantidad.
          </p>
          
          <div className="pt-3 border-t border-white/20">
            <p className="text-sm font-semibold text-white mb-2">
              Tiempo de espera: {Math.round(añosEspera * 12)} mes{Math.round(añosEspera * 12) !== 1 ? 'es' : ''}
            </p>
            {añosEspera > 0 && (
              <p className="text-xs text-blue-100">
                Aproximadamente {Math.floor(añosEspera)} año{Math.floor(añosEspera) !== 1 ? 's' : ''} y {Math.round((añosEspera % 1) * 12)} mes{Math.round((añosEspera % 1) * 12) !== 1 ? 'es' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Preservación de Derechos */}
        <div className={`rounded-lg p-4 ${
          puedePreservar ? 'bg-green-500/20 border border-green-400/30' : 'bg-red-500/20 border border-red-400/30'
        }`}>
          <div className="flex items-start gap-3 mb-3">
            {puedePreservar ? (
              <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-bold mb-2 ${
                puedePreservar ? 'text-green-200' : 'text-red-200'
              }`}>
                {puedePreservar 
                  ? '✅ Puedes preservar tus derechos de jubilación'
                  : '⚠️ No puedes preservar tus derechos de jubilación'}
              </h4>
              
              <div className="space-y-2 text-sm text-blue-100 mb-4">
                <div className="flex justify-between">
                  <span>Semanas cotizadas totales:</span>
                  <span className="font-semibold text-white">{semanasTotales} semanas</span>
                </div>
                <div className="flex justify-between">
                  <span>Años de conservación disponibles:</span>
                  <span className="font-semibold text-white">{añosConservacion.toFixed(1)} años</span>
                </div>
                <div className="flex justify-between">
                  <span>Años de espera hasta jubilación:</span>
                  <span className="font-semibold text-white">{añosEspera.toFixed(1)} años</span>
                </div>
              </div>

              {!puedePreservar && (
                <div className="bg-white/10 rounded-lg p-4 mt-4">
                  <p className="text-sm font-semibold text-red-200 mb-3">
                    ⚠️ Problema detectado:
                  </p>
                  <p className="text-sm text-blue-100 mb-4">
                    Tus años de conservación ({añosConservacion.toFixed(1)} años) no son suficientes 
                    para cubrir el tiempo de espera hasta tu jubilación ({añosEspera.toFixed(1)} años). 
                    Necesitas {Math.ceil(añosEspera - añosConservacion)} año{Math.ceil(añosEspera - añosConservacion) !== 1 ? 's' : ''} adicional{Math.ceil(añosEspera - añosConservacion) !== 1 ? 'es' : ''} de conservación.
                  </p>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-white">
                      Opciones recomendadas:
                    </p>
                    
                    {/* Opción 1: Reincorporarse a M40 */}
                    <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                      <div className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-200 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-200 mb-1">
                            Opción 1: Reincorporarte a Modalidad 40
                          </p>
                          <p className="text-xs text-blue-100">
                            Continúa pagando M40 para aumentar tus semanas cotizadas y así aumentar 
                            tus años de conservación.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Opción 2: Jubilarse antes */}
                    {retirementAge > 60 && puedePreservarMinima && (
                      <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-400/30">
                        <div className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-yellow-200 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-yellow-200 mb-1">
                              Opción 2: Jubilarte a los 60 años
                            </p>
                            <p className="text-xs text-yellow-100">
                              Si te jubilas a los 60 años en lugar de {retirementAge}, tendrías 
                              {añosEsperaMinima.toFixed(1)} años de espera, lo cual SÍ está dentro 
                              de tus {añosConservacion.toFixed(1)} años de conservación disponibles.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {retirementAge > 60 && !puedePreservarMinima && (
                      <div className="bg-gray-500/20 rounded-lg p-3 border border-gray-400/30">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-gray-200 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-200 mb-1">
                              Nota: Jubilarte antes tampoco es suficiente
                            </p>
                            <p className="text-xs text-gray-100">
                              Incluso jubilándote a los 60 años, necesitarías {añosEsperaMinima.toFixed(1)} años 
                              de conservación, pero solo tienes {añosConservacion.toFixed(1)} años disponibles. 
                              La mejor opción es reincorporarte a M40.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {puedePreservar && (
                <div className="bg-green-500/20 rounded-lg p-3 mt-4">
                  <p className="text-sm text-green-200">
                    ✅ Tus {añosConservacion.toFixed(1)} años de conservación son suficientes para 
                    cubrir los {añosEspera.toFixed(1)} años de espera hasta tu jubilación. 
                    Puedes dejar de pagar M40 ahora y tus derechos estarán preservados.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

