"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import {
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  ReferenceLine
} from "recharts"
import { motion } from "framer-motion"
import {
  generarTimelineCompleta,
  formatearFechaTimeline,
  obtenerColorPago,
} from "@/lib/utils/timelineUtils"

const diffCalendarMonths = (from: Date, to: Date) =>
  (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())

interface TimelineChartProps {
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
  onTramiteClick: (tramiteId: string) => void
  formatCurrency: (amount: number) => string
}

export default function TimelineChart({
  fechaInicio,
  fechaJubilacion,
  mesesM40,
  registros,
  esProgresivo,
  onTramiteClick,
  formatCurrency
}: TimelineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)

  // detecta móvil
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mm = window.matchMedia("(max-width: 640px)")
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setHoveredPoint(null)
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches)
    }
    onChange(mm as unknown as MediaQueryList)
    mm.addEventListener("change", onChange as any)
    return () => mm.removeEventListener("change", onChange as any)
  }, [])

  const timelineData = useMemo(() => {
    const { pagos, tramites, bajasMora } = generarTimelineCompleta(
      fechaInicio,
      fechaJubilacion,
      mesesM40,
      registros,
      esProgresivo
    )

    const maxMesTramites = Math.max(0, ...tramites.map(t => diffCalendarMonths(fechaInicio, t.fecha)))
    const mesesExtendidos = Math.max(mesesM40, maxMesTramites + 1)

    const allEvents = [
      ...pagos.map((pago, index) => ({
        ...pago,
        x: index,
        y: 1,
        tipo: "pago",
        id: `pago_${index}`,
        titulo: `Pago ${index + 1}`,
        color: obtenerColorPago(pago.tipo),
      })),
      ...tramites.map((tramite) => {
        let x = Math.max(0, diffCalendarMonths(fechaInicio, tramite.fecha))
        let y = 2.5
        if (tramite.id === "darse_alta") { x = 0; y = 2.5 }
        else if (tramite.id === "fin_m40") { x = Math.max(0, mesesM40 - 1); y = 2.5 }
        else if (tramite.id === "solicitar_jubilacion") { y = 2.2 }
        else if (tramite.id === "solicitar_afore") { y = 2.8 }

        return { ...tramite, x, y, tipo: "tramite", color: tramite.color }
      }),
    ]

    return {
      allEvents: allEvents.filter(e => e.x >= 0),
      mesesExtendidos,
    }
  }, [fechaInicio, fechaJubilacion, mesesM40, registros, esProgresivo])

  // scroll horizontal + hints
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const updateHints = () => {
    const el = scrollRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 8)
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }
  useEffect(() => {
    updateHints()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateHints, { passive: true })
    window.addEventListener("resize", updateHints)
    return () => {
      el.removeEventListener("scroll", updateHints)
      window.removeEventListener("resize", updateHints)
    }
  }, [timelineData.mesesExtendidos, isMobile])

  const pxPerMonth = isMobile ? 48 : 28
  const chartWidth = Math.max(360, pxPerMonth * timelineData.mesesExtendidos)
  const chartHeightClass = isMobile ? "h-80" : "h-72 md:h-80"
  const labelStep = isMobile ? 4 : 3

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-2 sm:p-3 border border-gray-200 rounded-md shadow-md max-w-[220px] sm:max-w-xs">
          <p className="font-semibold text-gray-900 text-sm sm:text-base">{data.titulo}</p>
          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">{data.descripcion}</p>
          {data.tipo === "pago" && (
            <p className="text-xs sm:text-sm font-medium text-green-600">{formatCurrency(data.cuotaMensual)}</p>
          )}
          <p className="text-[10px] sm:text-xs text-gray-500">{formatearFechaTimeline(data.fecha)}</p>
          {data.tipo === "tramite" && (
            <p className="text-[10px] sm:text-xs text-blue-600 mt-1">Haz clic para ver tutorial</p>
          )}
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    const hovered = hoveredPoint === payload.id
    const base = isMobile ? 8 : 6
    const hover = isMobile ? 10 : 8
    return (
      <motion.circle
        cx={cx}
        cy={cy}
        r={hovered ? hover : base}
        fill={payload.color}
        stroke={hovered ? "#374151" : "white"}
        strokeWidth={hovered ? 3 : 2}
        className={payload.tipo === "tramite" && payload.id !== "fin_m40" ? "cursor-pointer" : "cursor-default"}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { 
          if (payload.tipo === "tramite" && payload.id !== "fin_m40") {
            onTramiteClick(payload.id)
          }
        }}
        onMouseEnter={() => setHoveredPoint(payload.id)}
        onMouseLeave={() => setHoveredPoint(null)}
      />
    )
  }

  return (
    <div className="w-full">
      {/* Leyenda compacta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span>Pagos normales</span></div>
        {esProgresivo && (
          <>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full" /><span>No pagar (Dic/Ene)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded-full" /><span>Reingreso (Feb)</span></div>
          </>
        )}
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span>Trámites</span></div>
      </div>

      {/* Contenedor scrollable */}
      <div className="relative">
        <div ref={scrollRef} className="overflow-x-auto">
          <div style={{ width: chartWidth }} className={chartHeightClass}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 24, left: 12, bottom: isMobile ? 36 : 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  dataKey="x"
                  xAxisId="x"
                  domain={[0, timelineData.mesesExtendidos - 1]}
                  allowDataOverflow={false}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  tickLine={{ stroke: '#9CA3AF' }}
                  axisLine={{ stroke: '#9CA3AF' }}
                  interval={0}
                  tickFormatter={(value: number) => {
                    if (value % labelStep === 0 || value === 0 || value === timelineData.mesesExtendidos - 1) {
                      const f = new Date(fechaInicio); f.setMonth(f.getMonth() + value)
                      return f.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
                    }
                    return ''
                  }}
                />
                <YAxis type="number" yAxisId="y" domain={[0, 4]} tick={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter
                  data={timelineData.allEvents}
                  dataKey="y"
                  xAxisId="x"
                  yAxisId="y"
                  shape={<CustomDot />}
                  isAnimationActive={false}
                  fill="#8884d8"
                />
                <ReferenceLine xAxisId="x" x={0} stroke="#3B82F6" strokeDasharray="3 3" strokeWidth={2} />
                <ReferenceLine xAxisId="x" x={mesesM40 - 1} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={2} />
                <ReferenceLine xAxisId="x" x={timelineData.mesesExtendidos - 1} stroke="#9CA3AF" strokeDasharray="2 2" strokeWidth={1} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* pistas de scroll */}
        {showLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" />
        )}
        {showRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
        )}
        {showRight && isMobile && (
          <motion.div
            className="pointer-events-none absolute bottom-2 right-3 text-xs text-gray-600 bg-white/80 rounded-full px-2 py-1"
            animate={{ x: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
          >
            Desliza →
          </motion.div>
        )}
      </div>

      {/* Notas compactas */}
      <div className="mt-3 text-center text-xs sm:text-sm text-gray-600">
        <p>Haz clic en los puntos azules para ver los tutoriales de trámites</p>
        {esProgresivo && <p className="mt-1 text-[11px] sm:text-xs">Estrategia progresiva: no pagar Dic/Ene para optimizar UMA</p>}
        <div className="mt-2 text-[11px] sm:text-xs text-gray-500">
          <p>Eje X: Meses desde el inicio • Eje Y: Niveles de eventos</p>
        </div>
      </div>
    </div>
  )
}

