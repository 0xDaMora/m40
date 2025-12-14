"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { TrendingUp, Info, Calculator, DollarSign, Calendar, AlertCircle, X, CheckCircle, FileDown } from "lucide-react"
import { StrategyResult } from "@/types/strategy"
import { useFormatters } from "@/hooks/useFormatters"
import { calcularEscenarioYam40Recrear } from "@/lib/yam40/calculatorYam40Recrear"
import { SDIMensual, calcularSDIDesdeAportacion, calcularUMADesdeAportacion, calcularAportacionDesdeSDI } from "@/lib/yam40/listaSDIyam40"
import { getMaxAportacionPorAño } from "@/lib/all/umaConverter"
import { getTasaM40, getUMA } from "@/lib/all/constants"
import { calcularLimitantesM40 } from "@/lib/yam40/limitantesM40"
import { MesConSDI } from "@/types/yam40"
import TooltipInteligente from "@/components/TooltipInteligente"
import SimpleDateSelector from "./simple/SimpleDateSelector"
import PaymentMethodSelector from "./simple/PaymentMethodSelector"
import { construirDatosYam40ParaGuardar } from "@/lib/yam40/construirDatosYam40ParaGuardar"
import { generarCodigoEstrategia } from "@/lib/utils/strategy"
import { toast } from "react-hot-toast"

interface Yam40MejorasEstrategiaProps {
  estrategiaActual: {
    mesesM40: number
    pensionMensual: number
    inversionTotal?: number
    ROI?: number
    registros?: Array<{
      fecha: string
      uma: number
      tasaM40?: number
      sdiMensual: number
      cuotaMensual: number
      acumulado: number
    }>
    tipoPago?: 'aportacion' | 'uma'
    fechaInicioM40?: string
    fechaFinM40?: string
    modoEntradaPagos?: 'rango' | 'manual'
  }
  datosUsuario: {
    fechaNacimiento?: string
    edadJubilacion?: string | number
    semanasPrevias?: number
    dependiente?: string
  }
  fechaInicioM40: Date
  fechaFinM40: Date
  tipoPago: 'aportacion' | 'uma'
  valorInicial: number
  sdiHistorico: number // SDI diario histórico
  semanasPrevias: number
  edadJubilacion: number
  dependiente: 'conyuge' | 'ninguno'
  listaSDI?: SDIMensual[] // Lista SDI guardada (si modo manual)
}

interface MesMejora {
  numero: number // 1, 2, 3... (número de mes adicional)
  mes: number // 1-12 (mes del año)
  año: number
  esRetroactivo: boolean
  aportacion: number
}

export default function Yam40MejorasEstrategia({
  estrategiaActual,
  datosUsuario,
  fechaInicioM40,
  fechaFinM40,
  tipoPago,
  valorInicial,
  sdiHistorico,
  semanasPrevias,
  edadJubilacion,
  dependiente,
  listaSDI
}: Yam40MejorasEstrategiaProps) {
  const { currency: formatCurrency } = useFormatters()
  const router = useRouter()
  const fechaActual = new Date()
  const [generandoPDF, setGenerandoPDF] = useState(false)
  
  // Convertir registros a MesConSDI para calcular limitantes
  const mesesPagados: MesConSDI[] = useMemo(() => {
    if (estrategiaActual.registros && estrategiaActual.registros.length > 0) {
      return estrategiaActual.registros.map((reg, index) => {
        const fecha = new Date(reg.fecha)
        return {
          mes: index + 1, // Número de mes en el calendario (1-58)
          año: fecha.getFullYear(),
          sdi: reg.sdiMensual / 30.4, // Convertir a diario
          uma: reg.uma,
          yaPagado: true,
          aportacionMensual: fecha.getMonth() + 1 // Mes del año (1-12)
        }
      })
    }
    return []
  }, [estrategiaActual.registros])

  // Calcular limitantes M40 - usar stringify para dependencia estable
  const mesesPagadosString = JSON.stringify(mesesPagados)
  const limitantes = useMemo(() => {
    return calcularLimitantesM40(mesesPagados, fechaActual)
  }, [mesesPagadosString])

  // Calcular último pago - usar stringify para dependencia estable
  const registrosString = JSON.stringify(estrategiaActual.registros)
  const ultimoPago = useMemo(() => {
    if (estrategiaActual.registros && estrategiaActual.registros.length > 0) {
      const ultimoRegistro = estrategiaActual.registros[estrategiaActual.registros.length - 1]
      return {
        fecha: new Date(ultimoRegistro.fecha),
        aportacion: ultimoRegistro.cuotaMensual,
        año: new Date(ultimoRegistro.fecha).getFullYear()
      }
    }
    return null
  }, [registrosString])

  // Calcular aportación promedio actual
  const calcularAportacionPromedio = useCallback(() => {
    if (estrategiaActual.registros && estrategiaActual.registros.length > 0) {
      const total = estrategiaActual.registros.reduce((sum, r) => sum + r.cuotaMensual, 0)
      return total / estrategiaActual.registros.length
    }
    if (estrategiaActual.inversionTotal && estrategiaActual.mesesM40 > 0) {
      return estrategiaActual.inversionTotal / estrategiaActual.mesesM40
    }
    return valorInicial
  }, [estrategiaActual, valorInicial])

  const aportacionPromedioActual = calcularAportacionPromedio()
  const mesesDisponibles = 58 - estrategiaActual.mesesM40

  // Estados
  const [fechaContinuacion, setFechaContinuacion] = useState<{ mes: number; año: number }>(() => {
    // Por defecto: mes siguiente al último pago o mes actual
    if (ultimoPago) {
      const siguienteMes = new Date(ultimoPago.fecha)
      siguienteMes.setMonth(siguienteMes.getMonth() + 1)
      return {
        mes: siguienteMes.getMonth() + 1,
        año: siguienteMes.getFullYear()
      }
    }
    return {
      mes: fechaActual.getMonth() + 1,
      año: fechaActual.getFullYear()
    }
  })
  const [fechaContinuacionConfirmada, setFechaContinuacionConfirmada] = useState(false)
  const [mesesAdicionales, setMesesAdicionales] = useState(0) // Iniciar en 0, solo cuenta meses futuros
  const [mesesMejora, setMesesMejora] = useState<MesMejora[]>([])
  const mesesMejoraRef = useRef<MesMejora[]>([])
  const [estrategiaMejorada, setEstrategiaMejorada] = useState<StrategyResult | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [error, setError] = useState<string>("")
  
  // Estados para aportación futura
  const [aportacionFutura, setAportacionFutura] = useState<number>(() => {
    // Inicializar con último pago o aportación promedio
    if (ultimoPago) {
      return ultimoPago.aportacion
    }
    return aportacionPromedioActual
  })
  const [metodoPagoFuturo, setMetodoPagoFuturo] = useState<'aportacion' | 'uma'>('aportacion')
  const [valorAportacionConfirmado, setValorAportacionConfirmado] = useState(false)

  // Inicializar aportacionFutura cuando cambia ultimoPago o hay meses retroactivos
  useEffect(() => {
    if (ultimoPago && fechaContinuacionConfirmada) {
      // Si hay meses retroactivos, usar el último retroactivo, sino usar último pago
      const mesesRetroactivos = mesesMejora.filter(m => m.esRetroactivo)
      if (mesesRetroactivos.length > 0) {
        const ultimoRetroactivo = mesesRetroactivos[mesesRetroactivos.length - 1]
        if (aportacionFutura < ultimoRetroactivo.aportacion && !valorAportacionConfirmado) {
          setAportacionFutura(ultimoRetroactivo.aportacion)
        }
      } else if (aportacionFutura < ultimoPago.aportacion && !valorAportacionConfirmado) {
        setAportacionFutura(ultimoPago.aportacion)
      }
    }
  }, [ultimoPago, mesesMejora, fechaContinuacionConfirmada, valorAportacionConfirmado])

  // Confirmar valor cuando se agregan meses adicionales
  useEffect(() => {
    if (mesesAdicionales > 0 && !valorAportacionConfirmado) {
      setValorAportacionConfirmado(true)
    } else if (mesesAdicionales === 0 && mesesMejora.filter(m => !m.esRetroactivo).length === 0) {
      // Permitir cambiar el valor solo si no hay meses futuros
      setValorAportacionConfirmado(false)
    }
  }, [mesesAdicionales, mesesMejora])

  // Calcular meses de mejora cuando cambia fecha de continuación o cantidad (solo si está confirmada)
  useEffect(() => {
    if (!ultimoPago || !limitantes.puedeReingresar || !fechaContinuacionConfirmada) {
      // Solo actualizar si hay cambios para evitar loops infinitos
      if (mesesMejoraRef.current.length > 0) {
        mesesMejoraRef.current = []
        setMesesMejora([])
      }
      return
    }

    const meses: MesMejora[] = []
    const mesesRetroactivos: MesMejora[] = []
    let numeroMes = 1

    // Calcular meses retroactivos desde el último pago hasta la fecha de continuación
    const ultimoPagoDate = new Date(ultimoPago.fecha)
    const fechaContinuacionDate = new Date(fechaContinuacion.año, fechaContinuacion.mes - 1, 1)
    
    // Si la fecha de continuación es posterior al último pago, calcular meses retroactivos
    if (fechaContinuacionDate > ultimoPagoDate) {
      let mesActual = ultimoPagoDate.getMonth() + 1
      let añoActual = ultimoPagoDate.getFullYear()
      
      // Avanzar al mes siguiente al último pago
      mesActual++
      if (mesActual > 12) {
        mesActual = 1
        añoActual++
      }
      
      // Calcular meses retroactivos hasta el mes anterior a la fecha de continuación
      while (añoActual < fechaContinuacion.año || (añoActual === fechaContinuacion.año && mesActual < fechaContinuacion.mes)) {
        // Calcular aportación: igual al último pago, actualizada según tasa del año
        let aportacion = ultimoPago.aportacion
        if (añoActual > ultimoPago.año) {
          const tasaUltimoAño = getTasaM40(ultimoPago.año)
          const tasaNuevoAño = getTasaM40(añoActual)
          aportacion = aportacion * (tasaNuevoAño / tasaUltimoAño)
        }

        mesesRetroactivos.push({
          numero: numeroMes++,
          mes: mesActual,
          año: añoActual,
          esRetroactivo: true,
          aportacion
        })

        // Avanzar al siguiente mes
        mesActual++
        if (mesActual > 12) {
          mesActual = 1
          añoActual++
        }
      }
    }

    // Agregar meses retroactivos al array principal
    meses.push(...mesesRetroactivos)

    // Calcular meses futuros adicionales desde la fecha de continuación
    // IMPORTANTE: mesesAdicionales ahora solo cuenta meses futuros, no retroactivos
    let mesActual = fechaContinuacion.mes
    let añoActual = fechaContinuacion.año
    
    // Obtener año base para actualización de aportación futura
    const añoBaseAportacionFutura = fechaContinuacion.año
    const tasaBaseAportacionFutura = getTasaM40(añoBaseAportacionFutura)
    
    for (let i = 0; i < mesesAdicionales; i++) {
      // Calcular aportación: usar aportacionFutura, actualizada según tasa del año si es aportación fija
      let aportacion: number
      if (metodoPagoFuturo === 'aportacion') {
        // Aportación fija: actualizar según tasa M40 del año
        if (añoActual === añoBaseAportacionFutura) {
          aportacion = aportacionFutura
        } else {
          const tasaAñoActual = getTasaM40(añoActual)
          aportacion = aportacionFutura * (tasaAñoActual / tasaBaseAportacionFutura)
        }
      } else {
        // UMA: mantener UMA constante, calcular aportación según año
        const uma = aportacionFutura // En este caso aportacionFutura contiene el valor UMA
        const valorUMA = getUMA(añoActual)
        const tasaM40 = getTasaM40(añoActual)
        aportacion = uma * valorUMA * tasaM40 * 30.4
      }

      meses.push({
        numero: numeroMes++,
        mes: mesActual,
        año: añoActual,
        esRetroactivo: false,
        aportacion
      })

      // Avanzar al siguiente mes
      mesActual++
      if (mesActual > 12) {
        mesActual = 1
        añoActual++
      }
    }

    // Solo actualizar si hay cambios para evitar loops infinitos
    const mesesString = JSON.stringify(meses.map(m => ({ numero: m.numero, mes: m.mes, año: m.año, esRetroactivo: m.esRetroactivo, aportacion: m.aportacion })))
    const mesesMejoraString = JSON.stringify(mesesMejoraRef.current.map(m => ({ numero: m.numero, mes: m.mes, año: m.año, esRetroactivo: m.esRetroactivo, aportacion: m.aportacion })))
    if (mesesString !== mesesMejoraString) {
      mesesMejoraRef.current = meses
      setMesesMejora(meses)
    }
  }, [fechaContinuacion.mes, fechaContinuacion.año, mesesAdicionales, limitantes.puedeReingresar, limitantes.fechaLimiteReingreso?.getTime(), ultimoPago?.fecha.getTime(), ultimoPago?.aportacion, fechaContinuacionConfirmada, aportacionFutura, metodoPagoFuturo])

  // Validar fecha de continuación (máximo 12 meses desde último pago)
  useEffect(() => {
    if (!ultimoPago || !limitantes.puedeReingresar) {
      if (error) setError("")
      return
    }

    const fechaContinuacionDate = new Date(fechaContinuacion.año, fechaContinuacion.mes - 1, 1)
    const fechaLimite = limitantes.fechaLimiteReingreso

    if (fechaLimite && fechaContinuacionDate > fechaLimite) {
      const nuevoError = `La fecha de continuación no puede ser posterior a ${fechaLimite.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })} (12 meses desde tu último pago)`
      if (error !== nuevoError) {
        setError(nuevoError)
      }
    } else {
      if (error) setError("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaContinuacion.mes, fechaContinuacion.año, ultimoPago?.fecha.getTime(), limitantes.puedeReingresar, limitantes.fechaLimiteReingreso?.getTime()])

  // Calcular estrategia mejorada en tiempo real
  useEffect(() => {
    if (error || !limitantes.puedeReingresar || mesesMejora.length === 0 || !fechaContinuacionConfirmada) {
      setEstrategiaMejorada(null)
      return
    }

    const timer = setTimeout(async () => {
      setCalculando(true)
      try {
        const fechaNacimiento = datosUsuario.fechaNacimiento 
          ? new Date(datosUsuario.fechaNacimiento)
          : new Date('1970-01-01')

        // Calcular nueva fecha fin extendiendo con meses adicionales
        const ultimoMesMejora = mesesMejora[mesesMejora.length - 1]
        const nuevaFechaFinM40 = new Date(ultimoMesMejora.año, ultimoMesMejora.mes - 1, 1)
        
        const nuevaFechaFinM40Obj = {
          mes: nuevaFechaFinM40.getMonth() + 1,
          año: nuevaFechaFinM40.getFullYear()
        }

        const fechaInicioM40Obj = {
          mes: fechaInicioM40.getMonth() + 1,
          año: fechaInicioM40.getFullYear()
        }

        // Construir listaSDI original desde registros si no existe
        // Esto es CRÍTICO: si no hay listaSDI, debemos construirla desde los registros
        // para preservar los meses originales y solo agregar los meses de mejora
        let listaSDIOriginal: SDIMensual[] = []
        
        if (listaSDI && listaSDI.length > 0) {
          // Si ya hay listaSDI (modo manual), usarla directamente
          listaSDIOriginal = [...listaSDI]
          console.log('🔵 [Mejoras] Usando listaSDI original (modo manual):', listaSDIOriginal.length, 'meses')
        } else if (estrategiaActual.registros && estrategiaActual.registros.length > 0) {
          // Si no hay listaSDI pero hay registros (modo rango), construirla desde los registros
          console.log('🔵 [Mejoras] Construyendo listaSDI desde registros (modo rango):', estrategiaActual.registros.length, 'registros')
          
          // Ordenar registros por fecha antes de procesar (CRÍTICO para orden correcto)
          const registrosOrdenados = [...estrategiaActual.registros].sort((a, b) => {
            return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          })
          
          registrosOrdenados.forEach((reg) => {
            const fecha = new Date(reg.fecha)
            const año = fecha.getFullYear()
            const mes = fecha.getMonth() + 1
            
            // Calcular SDI diario desde SDI mensual
            const sdiDiario = reg.sdiMensual / 30.4
            const uma = reg.uma
            const tasaM40 = getTasaM40(año)
            const valorUMA = getUMA(año)
            
            listaSDIOriginal.push({
              mes,
              año,
              aportacionMensual: reg.cuotaMensual,
              sdiMensual: reg.sdiMensual,
              sdiDiario,
              uma,
              tasaM40,
              valorUMA
            })
          })
          console.log('🔵 [Mejoras] ListaSDI original construida:', listaSDIOriginal.length, 'meses')
        } else {
          console.warn('⚠️ [Mejoras] No hay listaSDI ni registros disponibles. Esto puede causar problemas.')
        }

        // Extender listaSDI original con meses de mejora
        let nuevaListaSDI: SDIMensual[] | undefined = undefined
        if (listaSDIOriginal.length > 0) {
          nuevaListaSDI = [...listaSDIOriginal]
          console.log('🔵 [Mejoras] Agregando', mesesMejora.length, 'meses de mejora a', listaSDIOriginal.length, 'meses originales')
          mesesMejora.forEach((mesMejora) => {
            const sdiMensual = calcularSDIDesdeAportacion(mesMejora.aportacion, mesMejora.año)
            const sdiDiario = sdiMensual / 30.4
            const uma = calcularUMADesdeAportacion(mesMejora.aportacion, mesMejora.año)
            const tasaM40 = getTasaM40(mesMejora.año)
            const valorUMA = getUMA(mesMejora.año)
            
            nuevaListaSDI!.push({
              mes: mesMejora.mes,
              año: mesMejora.año,
              aportacionMensual: mesMejora.aportacion,
              sdiMensual,
              sdiDiario,
              uma,
              tasaM40,
              valorUMA
            })
          })
          
          // Ordenar listaSDI final cronológicamente (CRÍTICO para cálculo correcto)
          nuevaListaSDI = nuevaListaSDI.sort((a, b) => {
            const fechaA = a.año * 12 + a.mes
            const fechaB = b.año * 12 + b.mes
            return fechaA - fechaB
          })
          
          console.log('🔵 [Mejoras] ListaSDI final ordenada:', nuevaListaSDI.length, 'meses totales (', listaSDIOriginal.length, 'originales +', mesesMejora.length, 'mejora)')
          
          // Validar límite de 58 meses antes de calcular (CRÍTICO)
          const totalMeses = nuevaListaSDI.length
          if (totalMeses > 58) {
            const errorMsg = `El total de meses (${listaSDIOriginal.length} originales + ${mesesMejora.length} mejora = ${totalMeses}) excede el límite de 58 meses permitidos en Modalidad 40.`
            console.error('❌ [Mejoras]', errorMsg)
            setError(errorMsg)
            setEstrategiaMejorada(null)
            setCalculando(false)
            return
          }
        } else {
          console.warn('⚠️ [Mejoras] No se puede extender listaSDI: no hay meses originales')
        }

        // Calcular valorInicial: usar el primer registro original si existe, sino el primer mes de mejora
        const valorInicialCalculado = listaSDIOriginal.length > 0 
          ? listaSDIOriginal[0].aportacionMensual 
          : (mesesMejora[0]?.aportacion || aportacionPromedioActual)
        console.log('🔵 [Mejoras] Valor inicial calculado:', valorInicialCalculado, '(desde', listaSDIOriginal.length > 0 ? 'primer registro original' : 'primer mes mejora', ')')

        // Calcular estrategia mejorada
        const resultado = calcularEscenarioYam40Recrear({
          fechaNacimiento,
          semanasPrevias,
          sdiHistorico,
          fechaInicioM40: fechaInicioM40Obj,
          fechaFinM40: nuevaFechaFinM40Obj,
          tipoPago: 'aportacion',
          valorInicial: valorInicialCalculado,
          edadJubilacion,
          dependiente,
          listaSDI: nuevaListaSDI
        })

        if (resultado.error) {
          setError(resultado.error)
          setEstrategiaMejorada(null)
        } else {
          setEstrategiaMejorada(resultado)
        }
      } catch (err: any) {
        console.error('Error calculando mejora:', err)
        setError(err?.message || 'Error al calcular la mejora')
        setEstrategiaMejorada(null)
      } finally {
        setCalculando(false)
      }
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timer)
  }, [mesesMejora, error, limitantes, datosUsuario, fechaInicioM40, sdiHistorico, semanasPrevias, edadJubilacion, dependiente, listaSDI, aportacionPromedioActual, fechaContinuacionConfirmada, aportacionFutura, metodoPagoFuturo, estrategiaActual.registros])

  // Calcular diferencias
  const pensionActual = estrategiaActual.pensionMensual || 0
  const pensionMejorada = estrategiaMejorada?.pensionMensual || 0
  const diferenciaPension = pensionMejorada - pensionActual
  const porcentajeMejora = pensionActual > 0 
    ? ((diferenciaPension / pensionActual) * 100).toFixed(1)
    : '0'

  const inversionAdicional = mesesMejora.reduce((sum, m) => sum + m.aportacion, 0)
  const inversionTotalMejorada = (estrategiaActual.inversionTotal || 0) + inversionAdicional

  // Función para generar PDF de la mejora
  const handleGenerarPDFMejora = async () => {
    if (!estrategiaMejorada || !mesesMejora.length || generandoPDF) return

    setGenerandoPDF(true)
    try {
      // 1. Convertir registros actuales a MesConSDI
      const mesesActuales: MesConSDI[] = []
      if (estrategiaActual.registros && estrategiaActual.registros.length > 0) {
        estrategiaActual.registros.forEach((reg) => {
          const fecha = new Date(reg.fecha)
          mesesActuales.push({
            mes: fecha.getMonth() + 1,
            año: fecha.getFullYear(),
            sdi: reg.sdiMensual / 30.4, // Convertir a diario
            uma: reg.uma,
            yaPagado: true,
            aportacionMensual: fecha.getMonth() + 1
          })
        })
      }

      // 2. Convertir mesesMejora a MesConSDI
      const mesesNuevos: MesConSDI[] = mesesMejora.map((mesMejora) => {
        const sdiMensual = calcularSDIDesdeAportacion(mesMejora.aportacion, mesMejora.año)
        const sdiDiario = sdiMensual / 30.4
        const uma = calcularUMADesdeAportacion(mesMejora.aportacion, mesMejora.año)
        
        return {
          mes: mesMejora.mes,
          año: mesMejora.año,
          sdi: sdiDiario,
          uma: uma,
          yaPagado: false,
          aportacionMensual: mesMejora.mes
        }
      })

      // 3. Combinar meses actuales + meses nuevos
      const mesesCombinados = [...mesesActuales, ...mesesNuevos].sort((a, b) => {
        const fechaA = a.año * 12 + a.mes
        const fechaB = b.año * 12 + b.mes
        return fechaA - fechaB
      })

      // 4. Calcular nueva fechaFinM40 (último mes de mejora)
      const ultimoMesMejora = mesesMejora[mesesMejora.length - 1]
      const nuevaFechaFinM40 = {
        mes: ultimoMesMejora.mes,
        año: ultimoMesMejora.año
      }

      // 5. Obtener fecha de nacimiento
      const fechaNacimiento = datosUsuario.fechaNacimiento 
        ? new Date(datosUsuario.fechaNacimiento)
        : null

      if (!fechaNacimiento) {
        toast.error('Fecha de nacimiento no disponible')
        return
      }

      // 6. Construir datos para guardar
      const fechaInicioM40Obj = {
        mes: fechaInicioM40.getMonth() + 1,
        año: fechaInicioM40.getFullYear()
      }

      const { datosEstrategia, datosUsuario: datosUsuarioBD } = construirDatosYam40ParaGuardar({
        pensionActual: estrategiaMejorada,
        mesesConSDI: mesesCombinados,
        fechaInicioM40: fechaInicioM40Obj,
        fechaFinM40: nuevaFechaFinM40,
        modoEntradaPagos: 'manual',
        datosUsuario: {
          name: datosUsuario.nombreFamiliar || 'Usuario',
          birthDate: fechaNacimiento,
          retirementAge: edadJubilacion,
          totalWeeksContributed: semanasPrevias,
          civilStatus: dependiente === 'conyuge' ? 'casado' : 'soltero',
          sdiHistorico: sdiHistorico
        }
      })

      // 7. Generar código único con sufijo _mejora_
      const strategyCode = generarCodigoEstrategia('yam40', {
        mesesM40: mesesCombinados.length,
        fechaInicioM40: datosEstrategia.fechaInicioM40,
        fechaFinM40: datosEstrategia.fechaFinM40
      }).replace('yam40_', 'yam40_mejora_')

      // 8. Guardar estrategia (gratis, sin verificación de pago)
      const response = await fetch('/api/guardar-estrategia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          debugCode: strategyCode,
          datosEstrategia: {
            ...datosEstrategia,
            esMejora: true // Marcar como mejora
          },
          datosUsuario: datosUsuarioBD,
          esMejora: true // Flag para saltar verificación de pago
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar la estrategia')
      }

      const result = await response.json()
      toast.success('Estrategia mejorada guardada exitosamente')

      // 9. Redirigir a la nueva estrategia detallada
      router.push(`/yam40-estrategia/${strategyCode}`)
    } catch (error: any) {
      console.error('Error generando PDF de mejora:', error)
      toast.error(error.message || 'Error al generar la estrategia mejorada')
    } finally {
      setGenerandoPDF(false)
    }
  }

  // Si no puede reingresar (baja definitiva)
  if (!limitantes.puedeReingresar) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-2">
                Baja Definitiva - No es posible reingresar
              </h3>
              <p className="text-sm text-red-800 mb-3">
                {limitantes.mensajeError || 
                  `Tu último pago fue hace más de 12 meses. El límite de reingreso ya expiró y no es posible reingresar a Modalidad 40.`}
              </p>
              {limitantes.ultimaFechaPagada && (
                <div className="bg-white rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-red-700 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">
                      Último pago: {limitantes.ultimaFechaPagada.toLocaleDateString('es-MX', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {limitantes.fechaLimiteReingreso && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <Info className="w-5 h-5" />
                      <span>
                        Límite de reingreso expirado: {limitantes.fechaLimiteReingreso.toLocaleDateString('es-MX', {
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
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Mejorar tu Estrategia</h2>
        </div>
        <p className="text-blue-100">
          Agrega meses adicionales para mejorar tu pensión proyectada
        </p>
      </div>

      {/* Información Actual */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Tu Estrategia Actual
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Meses Pagados</div>
            <div className="text-xl font-bold text-gray-900">{estrategiaActual.mesesM40}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Aportación Promedio</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(aportacionPromedioActual)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Pensión Mensual</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(pensionActual)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Inversión Total</div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(estrategiaActual.inversionTotal || 0)}</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>Edad de jubilación: {edadJubilacion} años (no modificable)</p>
          {ultimoPago && (
            <p>Último pago: {ultimoPago.fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })} - {formatCurrency(ultimoPago.aportacion)}</p>
          )}
        </div>
      </div>

      {/* Controles de Mejora */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Configura Tu Mejora
        </h3>

        <div className="space-y-6">
          {/* Pregunta: ¿Cuándo deseas continuar? */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Cuándo deseas continuar?
              <TooltipInteligente texto="Selecciona el mes y año desde el cual deseas continuar pagando. El límite es 12 meses desde tu último pago." />
            </label>
            <SimpleDateSelector
              label=""
              value={fechaContinuacion}
              onChange={(value) => {
                setFechaContinuacion(value)
                setFechaContinuacionConfirmada(false) // Resetear confirmación si cambia la fecha
              }}
              minYear={ultimoPago ? ultimoPago.fecha.getFullYear() : fechaActual.getFullYear()}
              minMonth={ultimoPago ? ultimoPago.fecha.getMonth() + 2 : fechaActual.getMonth() + 1} // Mes siguiente al último pago
              maxYear={limitantes.fechaLimiteReingreso ? limitantes.fechaLimiteReingreso.getFullYear() : undefined}
              maxMonth={limitantes.fechaLimiteReingreso ? limitantes.fechaLimiteReingreso.getMonth() + 1 : undefined}
            />
            {limitantes.fechaLimiteReingreso && (
              <p className="mt-2 text-xs text-gray-500">
                Límite: {limitantes.fechaLimiteReingreso.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
              </p>
            )}
            
            {/* Botón de confirmación */}
            {!fechaContinuacionConfirmada && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  // Validar fecha antes de confirmar
                  if (ultimoPago && limitantes.fechaLimiteReingreso) {
                    const fechaContinuacionDate = new Date(fechaContinuacion.año, fechaContinuacion.mes - 1, 1)
                    if (fechaContinuacionDate > limitantes.fechaLimiteReingreso) {
                      setError(`La fecha de continuación no puede ser posterior a ${limitantes.fechaLimiteReingreso.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`)
                      return
                    }
                  }
                  setError("")
                  setFechaContinuacionConfirmada(true)
                }}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Confirmar fecha de continuación
              </motion.button>
            )}
            
            {/* Checkbox de confirmación (alternativa) */}
            {fechaContinuacionConfirmada && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  Fecha confirmada: {new Date(fechaContinuacion.año, fechaContinuacion.mes - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    setFechaContinuacionConfirmada(false)
                    setMesesMejora([])
                    setEstrategiaMejorada(null)
                  }}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Cambiar
                </button>
              </motion.div>
            )}
          </div>

          {/* Meses Adicionales - Solo mostrar si la fecha está confirmada */}
          {fechaContinuacionConfirmada && (() => {
            const mesesRetroactivosCount = mesesMejora.filter(m => m.esRetroactivo).length
            const mesesFuturosCount = mesesMejora.filter(m => !m.esRetroactivo).length
            const totalMeses = estrategiaActual.mesesM40 + mesesRetroactivosCount + mesesFuturosCount
            const maxMesesFuturos = Math.max(0, mesesDisponibles - mesesRetroactivosCount)
            
            // Calcular último pago retroactivo para validación
            const mesesRetroactivos = mesesMejora.filter(m => m.esRetroactivo)
            const ultimoPagoRetroactivo = mesesRetroactivos.length > 0 
              ? mesesRetroactivos[mesesRetroactivos.length - 1]
              : ultimoPago
            const aportacionMinima = ultimoPagoRetroactivo?.aportacion || ultimoPago?.aportacion || aportacionPromedioActual
            const añoAportacionFutura = fechaContinuacion.año
            const maxAportacion = getMaxAportacionPorAño(añoAportacionFutura)
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Informativo de meses retroactivos vs adicionales */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Resumen de meses a pagar
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-purple-700">{mesesRetroactivosCount}</span>
                          <span className="text-gray-600">meses retroactivos</span>
                          <TooltipInteligente 
                            texto="Los meses retroactivos son los recargos de tu Modalidad 40 que debes pagar. Actualmente estás en baja por mora, pero si los pagas retomarás M40. Estos meses se calculan automáticamente desde tu último pago hasta la fecha de continuación que seleccionaste." 
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-700">{mesesFuturosCount}</span>
                          <span className="text-gray-600">meses adicionales</span>
                          <TooltipInteligente 
                            texto="Los meses adicionales son los nuevos meses con los que te darás de alta una vez pagues los retroactivos. Estos son los meses futuros que agregarás a partir de la fecha de continuación." 
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Total: {totalMeses} de 58 meses (incluyendo tus {estrategiaActual.mesesM40} meses ya pagados)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meses adicionales y aportación futura en la misma línea */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Meses adicionales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meses adicionales a pagar (solo futuros)
                      <TooltipInteligente texto="Estos son los meses futuros que agregarás después de pagar los retroactivos. Los meses retroactivos se calculan automáticamente y no se cuentan aquí." />
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setMesesAdicionales(Math.max(0, mesesAdicionales - 1))}
                        disabled={mesesAdicionales <= 0}
                        className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={maxMesesFuturos}
                        value={mesesAdicionales}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          setMesesAdicionales(Math.max(0, Math.min(maxMesesFuturos, value)))
                        }}
                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => setMesesAdicionales(Math.min(maxMesesFuturos, mesesAdicionales + 1))}
                        disabled={mesesAdicionales >= maxMesesFuturos}
                        className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg"
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-600">
                        Máximo: {maxMesesFuturos}
                      </span>
                    </div>
                  </div>

                  {/* Aportación futura */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuánto vas a pagar en los próximos meses?
                      <TooltipInteligente texto={`Debe ser igual o mayor a tu último pago retroactivo (${formatCurrency(aportacionMinima)}). El límite máximo es 25 UMA (${formatCurrency(maxAportacion)} para ${añoAportacionFutura}).`} />
                    </label>
                    {valorAportacionConfirmado && (mesesAdicionales > 0 || mesesMejora.filter(m => !m.esRetroactivo).length > 0) ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">
                              Valor confirmado: <span className="font-bold">
                                {metodoPagoFuturo === 'aportacion' 
                                  ? formatCurrency(aportacionFutura)
                                  : `${aportacionFutura.toFixed(2)} UMA`
                                }
                              </span>
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              El valor está bloqueado porque ya agregaste meses. Cambia la cantidad de meses a 0 para modificar el valor.
                            </p>
                          </div>
                        </div>
                        <PaymentMethodSelector
                          value={aportacionFutura}
                          method={metodoPagoFuturo}
                          onChange={(value, method) => {
                            // No permitir cambios si ya hay meses
                            if (mesesAdicionales === 0 && mesesMejora.filter(m => !m.esRetroactivo).length === 0) {
                              setAportacionFutura(value)
                              setMetodoPagoFuturo(method)
                            }
                          }}
                          year={añoAportacionFutura}
                          min={aportacionMinima}
                          max={maxAportacion}
                          label=""
                          helperText={`Mínimo: ${formatCurrency(aportacionMinima)} (último pago retroactivo). Máximo: ${formatCurrency(maxAportacion)} (25 UMA)`}
                          disabled={true}
                        />
                      </div>
                    ) : (
                      <PaymentMethodSelector
                        value={aportacionFutura}
                        method={metodoPagoFuturo}
                        onChange={(value, method) => {
                          setAportacionFutura(value)
                          setMetodoPagoFuturo(method)
                          // Confirmar valor cuando se agregan meses
                          if (mesesAdicionales > 0) {
                            setValorAportacionConfirmado(true)
                          }
                        }}
                        year={añoAportacionFutura}
                        min={aportacionMinima}
                        max={maxAportacion}
                        label=""
                        helperText={`Mínimo: ${formatCurrency(aportacionMinima)} (último pago retroactivo). Máximo: ${formatCurrency(maxAportacion)} (25 UMA)`}
                      />
                    )}
                  </div>
                </div>

                {/* Visualización de Meses como Cuadrados */}
                {mesesMejora.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Meses a pagar
                    </label>
                    <div className="grid grid-cols-6 md:grid-cols-10 gap-1.5">
                      {mesesMejora.map((mes) => (
                        <motion.div
                          key={mes.numero}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`
                            relative aspect-square rounded border-2 flex flex-col items-center justify-center p-0.5
                            ${mes.esRetroactivo 
                              ? 'bg-purple-100 border-purple-400' 
                              : 'bg-blue-50 border-blue-300'
                            }
                          `}
                        >
                          {/* Número del mes */}
                          <div className="text-base md:text-lg font-bold text-gray-900 leading-none">{mes.numero}</div>
                          
                          {/* Leyenda retroactivo */}
                          {mes.esRetroactivo && (
                            <div className="absolute -top-0.5 -right-0.5 bg-purple-600 text-white text-[8px] px-0.5 py-0 rounded-full font-semibold leading-none">
                              R
                            </div>
                          )}
                          
                          {/* Saldo a pagar */}
                          <div className="text-xs md:text-sm font-semibold text-gray-700 mt-0.5 text-center leading-tight line-clamp-1">
                            {formatCurrency(mes.aportacion).replace(/\s/g, '')}
                          </div>
                          
                          {/* Fecha */}
                          <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 text-center leading-tight line-clamp-1">
                            {new Date(mes.año, mes.mes - 1).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </motion.div>
            )
          })()}
        </div>
      </div>

      {/* Comparación de Resultados */}
      {calculando && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Calculando mejora...</p>
        </div>
      )}

      {estrategiaMejorada && !calculando && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Comparación: Actual vs Mejorado
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Actual */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Estrategia Actual</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(pensionActual)}</div>
              <div className="text-xs text-gray-500">Pensión mensual</div>
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                <div className="text-xs text-gray-600">Meses: {estrategiaActual.mesesM40}</div>
                <div className="text-xs text-gray-600">Inversión: {formatCurrency(estrategiaActual.inversionTotal || 0)}</div>
              </div>
            </div>

            {/* Mejorado */}
            <div className="bg-white rounded-lg p-4 border-2 border-green-500">
              <div className="text-sm text-gray-600 mb-2">Estrategia Mejorada</div>
              <div className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(pensionMejorada)}</div>
              <div className="text-xs text-gray-500">Pensión mensual</div>
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                <div className="text-xs text-gray-600">
                  Total meses: <span className="font-semibold">{estrategiaActual.mesesM40 + mesesMejora.length}</span>
                  {mesesMejora.filter(m => m.esRetroactivo).length > 0 && (
                    <span className="ml-2 text-purple-600 font-semibold">
                      ({mesesMejora.filter(m => m.esRetroactivo).length} retroactivos)
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  Meses nuevos: <span className="font-semibold">{mesesMejora.length}</span>
                  {mesesMejora.filter(m => m.esRetroactivo).length > 0 && (
                    <span className="ml-2 text-purple-600">
                      ({mesesMejora.filter(m => m.esRetroactivo).length} retroactivos + {mesesMejora.filter(m => !m.esRetroactivo).length} futuros)
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">Inversión: {formatCurrency(inversionTotalMejorada)}</div>
              </div>
            </div>
          </div>

          {/* Diferencia */}
          <div className="bg-white rounded-lg p-4 border border-green-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Mejora en pensión:</span>
              <span className="text-xl font-bold text-green-600">
                +{formatCurrency(diferenciaPension)} ({porcentajeMejora}%)
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Meses adicionales:</span>
              <span className="text-lg font-semibold text-gray-900">
                {mesesMejora.length} meses
                {mesesMejora.filter(m => m.esRetroactivo).length > 0 && (
                  <span className="ml-2 text-purple-600 font-semibold">
                    ({mesesMejora.filter(m => m.esRetroactivo).length} retroactivos)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Inversión adicional total:</span>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(inversionAdicional)}</span>
            </div>
          </div>

          {/* Botón Generar PDF de la mejora */}
          <div className="mt-6">
            <motion.button
              onClick={handleGenerarPDFMejora}
              disabled={generandoPDF}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {generandoPDF ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generando estrategia...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  <span>Generar PDF de la mejora</span>
                </>
              )}
            </motion.button>
          </div>

        </motion.div>
      )}
    </motion.div>
  )
}
