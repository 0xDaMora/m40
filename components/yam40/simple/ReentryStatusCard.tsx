"use client"

import { motion } from "framer-motion"
import { AlertCircle, CheckCircle, Clock, Calendar, Info } from "lucide-react"
import { calcularLimitantesM40 } from "@/lib/yam40/limitantesM40"
import { MesConSDI } from "@/types/yam40"
import { useFormatters } from "@/hooks/useFormatters"

interface ReentryStatusCardProps {
  mesesPagados: MesConSDI[]
  fechaActual?: Date
  fechaInicioPlanificacion?: Date
}

export default function ReentryStatusCard({
  mesesPagados,
  fechaActual = new Date(),
  fechaInicioPlanificacion
}: ReentryStatusCardProps) {
  const { currency: formatCurrency } = useFormatters()

  if (mesesPagados.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-6"
      >
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              Primer pago de Modalidad 40
            </h4>
            <p className="text-sm text-blue-800">
              Puedes comenzar a pagar Modalidad 40 en cualquier momento.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  const limitantes = calcularLimitantesM40(mesesPagados, fechaActual, fechaInicioPlanificacion)

  // Si no puede reingresar (baja definitiva)
  if (!limitantes.puedeReingresar) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 border-2 border-red-300 rounded-xl p-6"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-red-900 mb-2">
              No puedes reingresar a Modalidad 40
            </h4>
            <p className="text-sm text-red-800 mb-3">
              {limitantes.mensajeError || 
                `Tu último pago fue hace más de 12 meses. El límite de reingreso ya expiró.`}
            </p>
            {limitantes.ultimaFechaPagada && (
              <div className="bg-white rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Último pago: {limitantes.ultimaFechaPagada.toLocaleDateString('es-MX', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                {limitantes.fechaLimiteReingreso && (
                  <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Límite de reingreso: {limitantes.fechaLimiteReingreso.toLocaleDateString('es-MX', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // Si puede reingresar pero tiene meses retroactivos
  if (limitantes.mesesRetroactivos.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6"
      >
        <div className="flex items-start gap-3">
          <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-yellow-900 mb-2">
              Tienes meses sin pagar (retroactivos)
            </h4>
            <p className="text-sm text-yellow-800 mb-3">
              Tienes {limitantes.mesesRetroactivos.length} mes{limitantes.mesesRetroactivos.length > 1 ? 'es' : ''} sin pagar 
              que debes cubrir retroactivamente antes de continuar con nuevos pagos.
            </p>
            
            {limitantes.ultimaFechaPagada && (
              <div className="bg-white rounded-lg p-3 mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-yellow-700">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Último pago: {limitantes.ultimaFechaPagada.toLocaleDateString('es-MX', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="text-sm text-yellow-700">
                  <span className="font-semibold">Meses retroactivos:</span>{" "}
                  {limitantes.mesesRetroactivos.map((mes, index) => (
                    <span key={index}>
                      {new Date(mes.año, (mes.aportacionMensual || mes.mes) - 1).toLocaleDateString('es-MX', {
                        month: 'short',
                        year: 'numeric'
                      })}
                      {index < limitantes.mesesRetroactivos.length - 1 && ', '}
                    </span>
                  ))}
                </div>
                {limitantes.fechaLimiteReingreso && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 mt-2 pt-2 border-t border-yellow-200">
                    <Info className="w-4 h-4" />
                    <span>
                      Tienes hasta {limitantes.fechaLimiteReingreso.toLocaleDateString('es-MX', {
                        month: 'long',
                        year: 'numeric'
                      })} para reingresar
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  // Si puede reingresar sin problemas
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-50 border border-green-200 rounded-xl p-6"
    >
      <div className="flex items-start gap-3">
        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-green-900 mb-1">
            Puedes continuar pagando Modalidad 40
          </h4>
          <p className="text-sm text-green-800">
            No hay meses sin pagar. Puedes continuar con nuevos pagos normalmente.
          </p>
          {limitantes.ultimaFechaPagada && limitantes.fechaLimiteReingreso && (
            <div className="bg-white rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Calendar className="w-4 h-4" />
                <span>
                  Último pago: {limitantes.ultimaFechaPagada.toLocaleDateString('es-MX', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                <Clock className="w-4 h-4" />
                <span>
                  Puedes reingresar hasta: {limitantes.fechaLimiteReingreso.toLocaleDateString('es-MX', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

