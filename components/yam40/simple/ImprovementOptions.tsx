"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, ArrowRight, Info } from "lucide-react"
import { StrategyResult } from "@/types/strategy"
import { useFormatters } from "@/hooks/useFormatters"
import SimpleContributionInput from "./SimpleContributionInput"
import SimpleMonthsSelector from "./SimpleMonthsSelector"
import TooltipInteligente from "@/components/TooltipInteligente"

interface ImprovementOptionsProps {
  pensionActual: StrategyResult | null
  mesesPagados: number
  mesesDisponibles: number
  aportacionActual?: number // Aportación actual del usuario
  onCalculate: (aportacionMensual: number, mesesAdicionales: number) => Promise<StrategyResult | null>
  loading?: boolean
}

export default function ImprovementOptions({
  pensionActual,
  mesesPagados,
  mesesDisponibles,
  aportacionActual = 0,
  onCalculate,
  loading = false
}: ImprovementOptionsProps) {
  const { currency: formatCurrency } = useFormatters()
  
  // Inicializar con aportación actual o un valor por defecto
  const [aportacionMensual, setAportacionMensual] = useState(Math.max(aportacionActual || 5000, 5000))
  const [mesesAdicionales, setMesesAdicionales] = useState(1)
  const [estrategiaMejorada, setEstrategiaMejorada] = useState<StrategyResult | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [errorAportacion, setErrorAportacion] = useState<string>("")

  // Validar aportación mínima
  useEffect(() => {
    if (aportacionActual > 0 && aportacionMensual < aportacionActual) {
      setErrorAportacion(`La aportación debe ser mayor o igual a tu aportación actual (${formatCurrency(aportacionActual)})`)
    } else {
      setErrorAportacion("")
    }
  }, [aportacionMensual, aportacionActual, formatCurrency])

  // Calcular estrategia mejorada cuando cambian los valores
  useEffect(() => {
    if (
      aportacionMensual > 0 && 
      mesesAdicionales > 0 && 
      mesesAdicionales <= mesesDisponibles &&
      (!aportacionActual || aportacionMensual >= aportacionActual)
    ) {
      const timer = setTimeout(async () => {
        setCalculando(true)
        try {
          const resultado = await onCalculate(aportacionMensual, mesesAdicionales)
          setEstrategiaMejorada(resultado)
        } catch (error) {
          console.error('Error calculando mejora:', error)
          setEstrategiaMejorada(null)
        } finally {
          setCalculando(false)
        }
      }, 500) // Debounce de 500ms

      return () => clearTimeout(timer)
    } else {
      setEstrategiaMejorada(null)
    }
  }, [aportacionMensual, mesesAdicionales, mesesDisponibles, aportacionActual, onCalculate])

  const pensionActualValue = pensionActual?.pensionMensual || 0
  const pensionMejoradaValue = estrategiaMejorada?.pensionMensual || 0
  const diferencia = pensionMejoradaValue - pensionActualValue
  const porcentajeMejora = pensionActualValue > 0 
    ? ((diferencia / pensionActualValue) * 100).toFixed(1)
    : '0'

  const inversionAdicional = estrategiaMejorada?.inversionTotal 
    ? estrategiaMejorada.inversionTotal - (pensionActual?.inversionTotal || 0)
    : 0

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Cómo aumentar tu pensión?
        </h3>
        <p className="text-gray-600">
          Ajusta cuánto más quieres pagar y por cuántos meses para ver cómo mejora tu pensión
        </p>
      </div>

      {/* Controles */}
      <div className="space-y-6 bg-white rounded-xl p-6 shadow-lg">
        <SimpleContributionInput
          value={aportacionMensual}
          onChange={setAportacionMensual}
          label="¿Cuánto más quieres pagar al mes?"
          helperText={
            aportacionActual > 0 
              ? `Esta será tu aportación mensual adicional (mínimo: ${formatCurrency(aportacionActual)})`
              : "Esta será tu aportación mensual adicional"
          }
          min={Math.max(aportacionActual || 1000, 1000)}
        />
        
        {errorAportacion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 px-4 py-3 rounded-lg border border-red-200"
          >
            <p className="text-sm text-red-600">{errorAportacion}</p>
          </motion.div>
        )}

        <SimpleMonthsSelector
          value={mesesAdicionales}
          onChange={setMesesAdicionales}
          mesesPagados={mesesPagados}
          maxMeses={mesesDisponibles}
          label="¿Por cuántos meses más?"
          disabled={loading || calculando}
        />
      </div>

      {/* Comparación Antes/Después */}
      {(calculando || estrategiaMejorada) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border-2 border-green-200"
        >
          {calculando ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Calculando tu nueva pensión...</p>
            </div>
          ) : estrategiaMejorada && estrategiaMejorada.pensionMensual ? (
            <>
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-1">
                  Tu pensión mejoraría a:
                </h4>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pensionMejoradaValue}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl font-bold text-green-600"
                  >
                    {formatCurrency(pensionMejoradaValue)}
                  </motion.div>
                </AnimatePresence>
                <p className="text-sm text-gray-600 mt-1">al mes</p>
              </div>

              {/* Comparación visual */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Pensión actual</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {formatCurrency(pensionActualValue)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-green-500">
                  <div className="text-sm text-gray-600 mb-1">Pensión mejorada</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(pensionMejoradaValue)}
                  </div>
                </div>
              </div>

              {/* Mejora */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${diferencia}-${porcentajeMejora}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-lg p-4 mb-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-gray-900">Mejora mensual</span>
                    </div>
                    <div className="text-right">
                      <motion.div
                        key={diferencia}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-2xl font-bold text-green-600"
                      >
                        +{formatCurrency(diferencia)}
                      </motion.div>
                      <div className="text-sm text-gray-600">
                        {porcentajeMejora}% más
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Inversión adicional */}
              {inversionAdicional > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Inversión adicional requerida</p>
                      <p className="text-lg font-bold">{formatCurrency(inversionAdicional)}</p>
                      <p className="mt-1">
                        Distribuida en {mesesAdicionales} meses ({formatCurrency(aportacionMensual)} al mes)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Métricas adicionales */}
              {estrategiaMejorada.ROI && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-gray-600 mb-1">ROI en 20 años</div>
                    <div className="text-lg font-bold text-gray-900">
                      {estrategiaMejorada.ROI}%
                    </div>
                  </div>
                  {estrategiaMejorada.recuperacionMeses && (
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-gray-600 mb-1">Recuperación</div>
                      <div className="text-lg font-bold text-gray-900">
                        {estrategiaMejorada.recuperacionMeses} meses
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline simple */}
              <div className="mt-6 pt-6 border-t border-green-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center flex-1">
                    <div className="font-semibold text-gray-900">Ahora</div>
                    <div className="text-gray-600">{mesesPagados} meses pagados</div>
                    <div className="text-lg font-bold text-gray-700 mt-1">
                      {formatCurrency(pensionActualValue)}
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-green-600 mx-4" />
                  <div className="text-center flex-1">
                    <div className="font-semibold text-gray-900">Después</div>
                    <div className="text-gray-600">{mesesPagados + mesesAdicionales} meses totales</div>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      {formatCurrency(pensionMejoradaValue)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-600">
              <p>No se pudo calcular la mejora. Verifica los datos ingresados.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Recuerda:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Los últimos 58 meses son los que cuentan para calcular tu pensión</li>
              <li>Puedes pagar hasta {mesesDisponibles} meses más</li>
              <li>Tu pensión aumentará 5% cada febrero por ley</li>
              <li>Esta es una proyección basada en los datos proporcionados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

