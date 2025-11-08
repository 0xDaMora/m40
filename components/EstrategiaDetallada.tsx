"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Shield,
  Calculator,
  Users,
  CheckCircle,
  Info,
  Download,
  Share2,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import TooltipInteligente from "./TooltipInteligente"
import EstrategiaDetalladaTramites from "./EstrategiaDetalladaTramites"
import PremiumUpsellSection from "./PremiumUpsellSection/index"
import { calcularISRPension, calcularProyeccionPension, calcularPensionViudez } from "@/lib/all/calcularISR"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useSession } from "next-auth/react"

interface EstrategiaDetalladaProps {
  estrategia: {
    estrategia: string
    umaElegida: number
    mesesM40: number
    pensionMensual: number
    inversionTotal?: number
    ROI?: number
    factorEdad?: number
    conFactorEdad?: number
    conLeyFox?: number
    conDependiente?: number
    registros?: Array<{
      fecha: string
      uma: number
      tasaM40?: number
      sdiMensual: number
      cuotaMensual: number
      acumulado: number
    }>
  }
  datosUsuario: {
    inicioM40?: string
    fechaNacimiento?: string
    edadJubilacion?: string | number
    nombreFamiliar?: string
    edadActual?: number
    semanasCotizadas?: number
    semanasPrevias?: number
  }
  onVolver: () => void
  debugCode?: string
  familyMemberId?: string
}

const tabs = [
  { id: "resumen", label: "📊 Resumen", icon: Calculator },
  { id: "pagos", label: "💰 Pagos Mensuales", icon: DollarSign },
  { id: "cronograma", label: "📅 Cronograma", icon: Calendar },
  { id: "proyeccion", label: "📈 Proyección 20 Años", icon: TrendingUp },
  { id: "tramites", label: "📋 Trámites", icon: FileText },
  { id: "viudez", label: "🛡️ Pensión Viudez", icon: Shield }
]

export default function EstrategiaDetallada({ estrategia, datosUsuario, onVolver, debugCode, familyMemberId }: EstrategiaDetalladaProps) {
  const { data: session, update } = useSession()
  const [tabActivo, setTabActivo] = useState("resumen")
  const [guardando, setGuardando] = useState(false)
  const [guardada, setGuardada] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  // Calcular ISR
  const isr = calcularISRPension({
    pensionMensual: estrategia.pensionMensual,
    pensionAnual: estrategia.pensionMensual * 12,
    aguinaldo: estrategia.pensionMensual,
    año: 2024
  })

  // Calcular pensión de viudez
  const pensionViudez = calcularPensionViudez(estrategia.pensionMensual)

  // Fechas importantes
  const fechaInicioM40 = new Date(datosUsuario.inicioM40 || "2024-02-01")
  const fechaFinM40 = new Date(fechaInicioM40)
  fechaFinM40.setMonth(fechaFinM40.getMonth() + estrategia.mesesM40)
  
  // Calcular fecha de jubilación objetivo (edad de jubilación)
  let fechaJubilacion: Date
  let fechaTramite: Date
  
  // Siempre intentar usar fecha de nacimiento + edad de jubilación
  if (datosUsuario.fechaNacimiento && datosUsuario.edadJubilacion) {
    // Calcular fecha exacta de jubilación basada en fecha de nacimiento + edad objetivo
    const fechaNacimiento = new Date(datosUsuario.fechaNacimiento || '')
    const edadJubilacion = parseInt(String(datosUsuario.edadJubilacion))
    
    fechaJubilacion = new Date(fechaNacimiento)
    fechaJubilacion.setFullYear(fechaNacimiento.getFullYear() + edadJubilacion)
    
    // El inicio de trámites es 1 mes antes de la fecha de jubilación objetivo
    fechaTramite = new Date(fechaJubilacion)
    fechaTramite.setMonth(fechaTramite.getMonth() - 1)
  } else {
    // Solo usar fallback si realmente no hay datos de fecha de nacimiento
    // Fallback: usar fecha de fin M40 + 1 mes para trámites, y + 2 meses para jubilación
    fechaTramite = new Date(fechaFinM40)
    fechaTramite.setMonth(fechaTramite.getMonth() + 1)
    
    fechaJubilacion = new Date(fechaTramite)
    fechaJubilacion.setMonth(fechaJubilacion.getMonth() + 1)
  }
  
  // Calcular año de jubilación para la proyección
  const añoJubilacion = fechaJubilacion.getFullYear()
  
  // Calcular proyección 20 años desde el año de jubilación
  const proyeccion = calcularProyeccionPension({
    pensionInicial: estrategia.pensionMensual,
    años: 20,
    incrementoAnual: 5,
    añoInicio: añoJubilacion // Agregar año de inicio
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Función para calcular edad
  const calculateAge = (birthDate: string | Date) => {
    const today = new Date()
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const [generandoPDF, setGenerandoPDF] = useState(false)

  const guardarEstrategia = async () => {
    if (!debugCode || guardando || guardada) return
    
    setGuardando(true)
    try {
      const response = await fetch('/api/guardar-estrategia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debugCode,
          datosEstrategia: estrategia,
          datosUsuario,
          familyMemberId
        }),
      })

      if (response.ok) {
        setGuardada(true)
        console.log('Estrategia guardada exitosamente')
        // Refrescar la sesión para actualizar hasUsedFreeStrategy
        if (update) {
          await update()
        }
      } else if (response.status === 409) {
        // La estrategia ya existe
        setGuardada(true)
        console.log('Estrategia ya estaba guardada')
      } else if (response.status === 403) {
        // Usuario ya usó su estrategia gratis
        const errorData = await response.json()
        alert(errorData.error || 'Ya has usado tu estrategia gratis')
      } else {
        throw new Error('Error al guardar estrategia')
      }
    } catch (error) {
      console.error('Error guardando estrategia:', error)
    } finally {
      setGuardando(false)
    }
  }

  const compartirEstrategia = async () => {
    const url = window.location.href
    const titulo = `Estrategia ${estrategia.estrategia === "fijo" ? "UMA Fijo" : "UMA Progresivo"} - ${estrategia.umaElegida} UMA - ${estrategia.mesesM40} meses`
    
    // Detección robusta de iOS y Android
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                 (navigator.vendor && navigator.vendor.indexOf('Apple') > -1)
    
    const esAndroid = /Android/.test(navigator.userAgent)
    const esMovil = esIOS || esAndroid || /Mobile/.test(navigator.userAgent)
    
    console.log('🔍 Detección de dispositivo:', {
      esIOS,
      esAndroid,
      esMovil,
      userAgent: navigator.userAgent,
      hasShare: !!navigator.share,
      isSecureContext: window.isSecureContext
    })
    
    // Intentar Web Share API primero - SIN restricciones excesivas como la versión antigua
    if (navigator.share) {
      try {
        console.log('🔄 Intentando Web Share API (como versión antigua)...')
        await navigator.share({
          title: titulo,
          text: titulo,
          url: url
        })
        console.log('✅ Web Share API exitoso')
        mostrarNotificacion('✅ Contenido compartido exitosamente', 'success')
        return
      } catch (error: any) {
        console.log('❌ Error con Web Share API:', error)
        // Si el usuario cancela, no mostrar error
        if (error.name === 'AbortError') {
          console.log('🚫 Usuario canceló compartir')
          return
        }
        // Para otros errores, continuar con métodos alternativos
        console.log('🔄 Fallback a métodos alternativos (error real)...')
      }
    } else {
      console.log('⚠️ Web Share API no disponible (navigator.share no existe)')
    }
    
    if (esIOS) {
      // Para iOS, mostrar opciones de compartir específicas
      await compartirEnIOS(url, titulo)
    } else if (esAndroid) {
      // Para Android, mostrar opciones específicas
      await compartirEnAndroid(url, titulo)
    } else {
      // Para escritorio y otros dispositivos
      await copiarPortapapeles(url)
    }
  }

  const copiarPortapapeles = async (texto: string) => {
    try {
      // Intentar usar la API moderna del portapapeles
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto)
        mostrarNotificacion('✅ Enlace copiado al portapapeles', 'success')
      } else {
        // Fallback manual para navegadores que no soportan clipboard API
        await fallbackPortapapeles(texto)
      }
    } catch (error) {
      console.error('Error con clipboard API:', error)
      // Fallback manual
      await fallbackPortapapeles(texto)
    }
  }

  const fallbackPortapapeles = async (texto: string) => {
    try {
      // Crear elemento temporal para copiar
      const textArea = document.createElement('textarea')
      textArea.value = texto
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      // Intentar copiar
      const exitoso = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (exitoso) {
        mostrarNotificacion('✅ Enlace copiado al portapapeles', 'success')
      } else {
        throw new Error('execCommand falló')
      }
    } catch (error) {
      console.error('Error con fallback manual:', error)
      mostrarNotificacion('❌ No se pudo copiar el enlace', 'error')
    }
  }

  const mostrarNotificacion = (mensaje: string, tipo: 'success' | 'error') => {
    // Crear notificación temporal
    const notificacion = document.createElement('div')
    notificacion.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 ${
      tipo === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`
    notificacion.textContent = mensaje
    
    document.body.appendChild(notificacion)
    
    // Remover después de 3 segundos
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion)
      }
    }, 3000)
  }

  const compartirEnAndroid = async (url: string, titulo: string) => {
    try {
      console.log('🤖 Iniciando compartir para Android...')
      // Mostrar opciones de compartir manuales para Android
      mostrarOpcionesCompartirAndroid(url, titulo)
    } catch (error) {
      console.error('Error en compartir Android:', error)
      // Fallback a copiar portapapeles
      await copiarPortapapeles(url)
    }
  }

  const mostrarOpcionesCompartirAndroid = (url: string, titulo: string) => {
    // Crear modal de opciones para Android
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'
    
    const contenido = document.createElement('div')
    contenido.className = 'bg-white rounded-lg p-6 max-w-sm w-full'
    contenido.innerHTML = `
      <h3 class="text-lg font-bold text-gray-900 mb-4">🤖 Compartir Estrategia</h3>
      <p class="text-gray-600 mb-4 text-sm">Elige cómo quieres compartir tu estrategia:</p>
      <div class="space-y-3">
        <button id="btn-whatsapp-android" class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
          <span>📱</span> WhatsApp
        </button>
        <button id="btn-telegram-android" class="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
          <span>✈️</span> Telegram
        </button>
        <button id="btn-email-android" class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
          <span>📧</span> Email
        </button>
        <button id="btn-sms-android" class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
          <span>💬</span> SMS
        </button>
        <button id="btn-copiar-android" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
          <span>📋</span> Copiar Enlace
        </button>
        <button id="btn-cancelar-android" class="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors">
          ❌ Cancelar
        </button>
      </div>
    `
    
    modal.appendChild(contenido)
    document.body.appendChild(modal)
    
    const mensaje = `${titulo} ${url}`
    
    // Event listeners
    document.getElementById('btn-whatsapp-android')?.addEventListener('click', () => {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
      window.open(whatsappUrl, '_blank')
      document.body.removeChild(modal)
      mostrarNotificacion('✅ Abriendo WhatsApp...', 'success')
    })
    
    document.getElementById('btn-telegram-android')?.addEventListener('click', () => {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(titulo)}`
      window.open(telegramUrl, '_blank')
      document.body.removeChild(modal)
      mostrarNotificacion('✅ Abriendo Telegram...', 'success')
    })
    
    document.getElementById('btn-email-android')?.addEventListener('click', () => {
      const emailUrl = `mailto:?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(`Te comparto mi estrategia de Modalidad 40:\n\n${titulo}\n\n${url}`)}`
      window.open(emailUrl, '_blank')
      document.body.removeChild(modal)
      mostrarNotificacion('✅ Abriendo cliente de email...', 'success')
    })
    
    document.getElementById('btn-sms-android')?.addEventListener('click', () => {
      const smsUrl = `sms:?body=${encodeURIComponent(mensaje)}`
      window.open(smsUrl, '_blank')
      document.body.removeChild(modal)
      mostrarNotificacion('✅ Abriendo SMS...', 'success')
    })
    
    document.getElementById('btn-copiar-android')?.addEventListener('click', async () => {
      await copiarPortapapeles(url)
      document.body.removeChild(modal)
    })
    
    document.getElementById('btn-cancelar-android')?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    // Cerrar al hacer click fuera del modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  const compartirEnIOS = async (url: string, titulo: string) => {
    try {
      // Crear un elemento de enlace temporal
      const enlaceCompartir = document.createElement('a')
      enlaceCompartir.href = url
      enlaceCompartir.textContent = titulo
      enlaceCompartir.style.position = 'fixed'
      enlaceCompartir.style.left = '-9999px'
      enlaceCompartir.style.top = '-9999px'
      
      // Agregar atributos para iOS
      enlaceCompartir.setAttribute('data-url', url)
      enlaceCompartir.setAttribute('data-title', titulo)
      
      document.body.appendChild(enlaceCompartir)
      
      // Intentar usar la API de compartir nativa de iOS
      if (navigator.share) {
        try {
          await navigator.share({
            title: titulo,
            text: titulo,
            url: url
          })
        } catch (shareError) {
          // Si falla, mostrar opciones manuales
          mostrarOpcionesCompartirIOS(url, titulo)
        }
      } else {
        // Mostrar opciones manuales
        mostrarOpcionesCompartirIOS(url, titulo)
      }
      
      // Limpiar
      document.body.removeChild(enlaceCompartir)
      
    } catch (error) {
      console.error('Error en compartir iOS:', error)
      // Fallback a copiar portapapeles
      await copiarPortapapeles(url)
    }
  }

  const mostrarOpcionesCompartirIOS = (url: string, titulo: string) => {
    // Crear modal de opciones para iOS
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'
    
    const contenido = document.createElement('div')
    contenido.className = 'bg-white rounded-lg p-6 max-w-sm w-full'
    contenido.innerHTML = `
      <h3 class="text-lg font-bold text-gray-900 mb-4">Compartir Estrategia</h3>
      <div class="space-y-3">
        <button id="btn-copiar" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          📋 Copiar Enlace
        </button>
        <button id="btn-whatsapp" class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
          📱 WhatsApp
        </button>
        <button id="btn-email" class="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors">
          📧 Email
        </button>
        <button id="btn-cancelar" class="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors">
          ❌ Cancelar
        </button>
      </div>
    `
    
    modal.appendChild(contenido)
    document.body.appendChild(modal)
    
    // Event listeners
    document.getElementById('btn-copiar')?.addEventListener('click', async () => {
      await copiarPortapapeles(url)
      document.body.removeChild(modal)
    })
    
    document.getElementById('btn-whatsapp')?.addEventListener('click', () => {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(titulo + ' ' + url)}`
      window.open(whatsappUrl, '_blank')
      document.body.removeChild(modal)
    })
    
    document.getElementById('btn-email')?.addEventListener('click', () => {
      const emailUrl = `mailto:?subject=${encodeURIComponent(titulo)}&body=${encodeURIComponent(url)}`
      window.open(emailUrl, '_blank')
      document.body.removeChild(modal)
    })
    
    document.getElementById('btn-cancelar')?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    // Cerrar al hacer click fuera del modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  const descargarPDFiOS = async (pdf: any, nombreArchivo: string) => {
    try {
      // Generar blob del PDF
      const pdfBlob = pdf.output('blob')
      
      // Crear URL del blob  
      const blobUrl = URL.createObjectURL(pdfBlob)
      
      // Detección más robusta de iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      
      if (isIOS) {
        // Método 1: Intentar abrir PDF en nueva ventana (Safari iOS)
        try {
          const nuevaVentana = window.open(blobUrl, '_blank')
          if (nuevaVentana) {
            // Si se abre la ventana, mostrar instrucciones
            mostrarInstruccionesDescargaIOS(nombreArchivo, blobUrl)
            
            // Limpiar después de 30 segundos
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl)
            }, 30000)
            
            return
          }
        } catch (error) {
          console.log('Error abriendo en nueva ventana:', error)
        }
        
        // Método 2: Crear enlace visible con instrucciones detalladas
        const contenedorDescarga = document.createElement('div')
        contenedorDescarga.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4'
        contenedorDescarga.innerHTML = `
          <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
            <div class="text-6xl mb-4">📱</div>
            <h3 class="text-xl font-bold text-gray-900 mb-4">PDF Generado para iOS</h3>
            <p class="text-gray-700 mb-6">Tu PDF está listo. Usa uno de estos métodos:</p>
            
            <div class="space-y-3 mb-6">
              <a href="${blobUrl}" target="_blank" class="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-decoration-none">
                📱 Abrir PDF en Safari
              </a>
              <button id="btn-compartir-ios" class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                📤 Compartir PDF
              </button>
            </div>
            
            <div class="bg-blue-50 p-3 rounded-lg mb-4 text-left">
              <p class="text-sm text-blue-800 mb-2"><strong>Instrucciones:</strong></p>
              <ul class="text-xs text-blue-700 space-y-1">
                <li>• Toca "Abrir PDF en Safari"</li>
                <li>• En Safari, toca el ícono "Compartir" (📤)</li>
                <li>• Selecciona "Guardar en Archivos"</li>
                <li>• O envía por AirDrop/WhatsApp</li>
              </ul>
            </div>
            
            <button id="btn-cerrar-descarga" class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
              Cerrar
            </button>
          </div>
        `
        
        document.body.appendChild(contenedorDescarga)
        
        // Event listeners
        document.getElementById('btn-compartir-ios')?.addEventListener('click', async () => {
          if (navigator.share) {
            try {
              // Convertir blob a File para compartir
              const file = new File([pdfBlob], nombreArchivo, { type: 'application/pdf' })
              await navigator.share({
                title: nombreArchivo,
                files: [file]
              })
            } catch (shareError) {
              console.log('Error compartiendo:', shareError)
              // Fallback: abrir en nueva ventana
              window.open(blobUrl, '_blank')
            }
          } else {
            // Fallback: abrir en nueva ventana
            window.open(blobUrl, '_blank')
          }
        })
        
        document.getElementById('btn-cerrar-descarga')?.addEventListener('click', () => {
          document.body.removeChild(contenedorDescarga)
          URL.revokeObjectURL(blobUrl)
        })
        
        // Cerrar al hacer click fuera
        contenedorDescarga.addEventListener('click', (e) => {
          if (e.target === contenedorDescarga) {
            document.body.removeChild(contenedorDescarga)
            URL.revokeObjectURL(blobUrl)
          }
        })
        
      } else {
        // Para otros dispositivos, usar método estándar
        const enlaceDescarga = document.createElement('a')
        enlaceDescarga.href = blobUrl
        enlaceDescarga.download = nombreArchivo
        enlaceDescarga.style.display = 'none'
        
        document.body.appendChild(enlaceDescarga)
        enlaceDescarga.click()
        
        setTimeout(() => {
          document.body.removeChild(enlaceDescarga)
          URL.revokeObjectURL(blobUrl)
        }, 1000)
        
        mostrarNotificacion('✅ PDF descargado exitosamente', 'success')
      }
      
    } catch (error) {
      console.error('Error descargando PDF en iOS:', error)
      mostrarNotificacion('❌ Error al descargar PDF', 'error')
      
      // Fallback: intentar método estándar
      try {
        pdf.save(nombreArchivo)
        mostrarNotificacion('✅ PDF descargado usando método alternativo', 'success')
      } catch (fallbackError) {
        console.error('Fallback también falló:', fallbackError)
        mostrarNotificacion('❌ No se pudo descargar el PDF', 'error')
      }
    }
  }

  const mostrarInstruccionesDescargaIOS = (nombreArchivo: string, blobUrl: string) => {
    mostrarNotificacion('✅ PDF abierto en Safari. Usa "Compartir" para guardar.', 'success')
  }

  const mostrarInstruccionesIOS = (nombreArchivo: string) => {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'
    
    const contenido = document.createElement('div')
    contenido.className = 'bg-white rounded-lg p-6 max-w-md w-full mx-4'
    contenido.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4">📱</div>
        <h3 class="text-xl font-bold text-gray-900 mb-4">Descargar PDF en iOS</h3>
        <div class="text-left space-y-3 text-gray-700 mb-6">
          <div class="flex items-start gap-3">
            <span class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <span>Mantén presionado el botón azul "Descargar PDF" que aparece arriba</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <span>Selecciona "Abrir en..." o "Compartir..."</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
            <span>Elige "Guardar en Archivos" o "Airdrop"</span>
          </div>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p class="text-sm text-yellow-800">
            <strong>Nota:</strong> En iOS, los PDFs se abren en el navegador por defecto. 
            Usa el botón azul arriba para descargar.
          </p>
        </div>
        <button id="btn-cerrar-ios" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          Entendido
        </button>
      </div>
    `
    
    modal.appendChild(contenido)
    document.body.appendChild(modal)
    
    document.getElementById('btn-cerrar-ios')?.addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    })
  }

  const generarPDF = async () => {
    setGenerandoPDF(true)
    
    try {
      console.log('📝 Iniciando generación de PDF...')
      
      // Crear un iframe aislado para evitar estilos conflictivos
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-9999px'
      iframe.style.width = '850px'
      iframe.style.height = '1100px'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)
      
      // Esperar a que el iframe esté listo
      await new Promise(resolve => {
        iframe.onload = resolve
        iframe.src = 'about:blank'
      })
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) throw new Error('No se pudo acceder al iframe')
      
      // Escribir contenido HTML puro en el iframe
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              background: white; 
              color: black;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          <div id="pdf-content" style="width: 800px; background: white; padding: 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: #f0f4f8; border-radius: 8px;">
              <h1 style="color: #1a56db; font-size: 24px; margin: 0 0 10px 0;">
                ${estrategia.estrategia === "fijo" ? "Estrategia UMA Fijo" : "Estrategia UMA Progresivo"}
              </h1>
              <p style="color: #4b5563; font-size: 16px; margin: 5px 0;">
                Nivel UMA: ${estrategia.umaElegida} • ${estrategia.mesesM40} meses en M40
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                Generado el ${new Date().toLocaleDateString('es-MX')}
              </p>
            </div>

            ${datosUsuario.nombreFamiliar ? `
            <!-- Información Personal -->
            <div style="margin-bottom: 30px; padding: 20px; background: #e0f2fe; border-radius: 8px;">
              <h2 style="color: #1a56db; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #3b82f6;">
                Información Personalizada
              </h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; width: 50%;">
                    <strong style="color: #3b82f6;">Nombre:</strong> ${datosUsuario.nombreFamiliar}
                  </td>
                  <td style="padding: 8px;">
                    <strong style="color: #3b82f6;">Edad Actual:</strong> ${datosUsuario.edadActual || (datosUsuario.fechaNacimiento ? calculateAge(datosUsuario.fechaNacimiento) : 'N/A')} años
                  </td>
                </tr>
                ${datosUsuario.edadJubilacion ? `
                <tr>
                  <td style="padding: 8px;">
                    <strong style="color: #3b82f6;">Edad Jubilación:</strong> ${datosUsuario.edadJubilacion} años
                  </td>
                  <td style="padding: 8px;">
                    <strong style="color: #3b82f6;">Semanas Cotizadas:</strong> ${datosUsuario.semanasCotizadas || datosUsuario.semanasPrevias || 'N/A'}
                  </td>
                </tr>
                ` : ''}
              </table>
            </div>
            ` : ''}

                         <!-- Métricas principales -->
             <div style="margin-bottom: 30px;">
               <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Resumen de Pensión</h2>
               <table style="width: 100%; border-collapse: collapse;">
                 <tr>
                   <td style="background: #f3f4f6; padding: 15px; text-align: center; width: 50%; border: 1px solid #e5e7eb;">
                     <div style="font-size: 20px; font-weight: bold; color: #1a56db;">${formatCurrency(estrategia.pensionMensual)}</div>
                     <div style="font-size: 14px; color: #4b5563; margin-top: 5px;">Pensión mensual</div>
                   </td>
                   <td style="background: #f3f4f6; padding: 15px; text-align: center; border: 1px solid #e5e7eb;">
                     <div style="font-size: 20px; font-weight: bold; color: #059669;">${formatCurrency(isr.pensionNeta)}</div>
                     <div style="font-size: 14px; color: #4b5563; margin-top: 5px;">Pensión neta (después ISR)</div>
                   </td>
                 </tr>
                 <tr>
                   <td style="background: #f3f4f6; padding: 15px; text-align: center; border: 1px solid #e5e7eb;">
                     <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${formatCurrency(estrategia.inversionTotal || 0)}</div>
                     <div style="font-size: 14px; color: #4b5563; margin-top: 5px;">Inversión total</div>
                   </td>
                   <td style="background: #f3f4f6; padding: 15px; text-align: center; border: 1px solid #e5e7eb;">
                     <div style="font-size: 20px; font-weight: bold; color: #7c3aed;">${estrategia.ROI}%</div>
                     <div style="font-size: 14px; color: #4b5563; margin-top: 5px;">ROI en 20 años</div>
                   </td>
                 </tr>
               </table>
             </div>

             <!-- Tabla de Pagos Mensuales -->
             <div style="margin-bottom: 30px;">
               <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Pagos Mensuales</h2>
               <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                 <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                   <thead>
                     <tr style="background: #f3f4f6;">
                       <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Mes</th>
                       <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Fecha</th>
                       <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">UMA</th>
                       <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Tasa M40</th>
                       <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">SDI Mensual</th>
                       <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Cuota</th>
                       <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db; font-weight: bold;">Acumulado</th>
                     </tr>
                   </thead>
                   <tbody>
                     ${estrategia.registros?.map((registro: any, index: number) => `
                       <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                         <td style="padding: 6px; border: 1px solid #e5e7eb;">${index + 1}</td>
                         <td style="padding: 6px; border: 1px solid #e5e7eb;">${registro.fecha}</td>
                         <td style="padding: 6px; border: 1px solid #e5e7eb;">${registro.uma}</td>
                         <td style="padding: 6px; border: 1px solid #e5e7eb;">${registro.tasaM40 ? registro.tasaM40.toFixed(2) + '%' : 'N/A'}</td>
                         <td style="padding: 6px; border: 1px solid #e5e7eb;">${formatCurrency(registro.sdiMensual)}</td>
                         <td style="padding: 6px; border: 1px solid #e5e7eb; font-weight: bold;">${formatCurrency(registro.cuotaMensual)}</td>
                         <td style="padding: 6px; border: 1px solid #e5e7eb; font-weight: bold;">${formatCurrency(registro.acumulado)}</td>
                       </tr>
                     `).join('') || 'No hay registros disponibles'}
                   </tbody>
                 </table>
               </div>
               <p style="margin-top: 10px; font-size: 12px; color: #6b7280; text-align: center;">
                 Total de ${estrategia.mesesM40} meses de contribuciones
               </p>
             </div>

            <!-- Desglose de pensión -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Desglose de Pensión</h2>
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px;">Pensión base:</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(estrategia.pensionMensual)}</td>
                  </tr>
                  ${estrategia.factorEdad ? `
                  <tr>
                    <td style="padding: 8px;">Factor edad (${estrategia.factorEdad}):</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(estrategia.conFactorEdad || 0)}</td>
                  </tr>
                  ` : ''}
                  ${estrategia.conLeyFox ? `
                  <tr>
                    <td style="padding: 8px;">Factor Fox (11%):</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(estrategia.conLeyFox)}</td>
                  </tr>
                  ` : ''}
                  ${estrategia.conDependiente ? `
                  <tr>
                    <td style="padding: 8px;">Asignaciones familiares:</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(estrategia.conDependiente)}</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 2px solid #d1d5db;">
                    <td style="padding: 8px; font-size: 16px; font-weight: bold;">Pensión final:</td>
                    <td style="padding: 8px; text-align: right; font-size: 16px; font-weight: bold; color: #059669;">${formatCurrency(estrategia.pensionMensual)}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Cálculo de ISR -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Cálculo de ISR</h2>
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fecaca;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px;">Pensión bruta:</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(isr.pensionBruta)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px;">Umbral exento:</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(isr.umbralExento)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px;">Base gravable:</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(isr.baseGravable)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px;">ISR mensual:</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold; color: #dc2626;">-${formatCurrency(isr.isrMensual)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #d1d5db;">
                    <td style="padding: 8px; font-size: 16px; font-weight: bold;">Pensión neta:</td>
                    <td style="padding: 8px; text-align: right; font-size: 16px; font-weight: bold; color: #059669;">${formatCurrency(isr.pensionNeta)}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Cronograma -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Cronograma</h2>
              <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="margin-bottom: 12px;">
                  <strong style="color: #1a56db;">Inicio de Modalidad 40:</strong> ${formatDate(fechaInicioM40)}
                </div>
                <div style="margin-bottom: 12px;">
                  <strong style="color: #059669;">Finalización M40:</strong> ${formatDate(fechaFinM40)}
                </div>
                <div style="margin-bottom: 12px;">
                  <strong style="color: #ea580c;">Inicio de Trámites:</strong> ${formatDate(fechaTramite)}
                </div>
                <div>
                  <strong style="color: #dc2626;">Fecha de Jubilación:</strong> ${formatDate(fechaJubilacion)}
                </div>
              </div>
            </div>

            <!-- Pensión de viudez -->
            <div style="margin-bottom: 30px;">
              <h2 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Pensión de Viudez</h2>
              <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e9d5ff;">
                <div style="font-size: 24px; font-weight: bold; color: #7c3aed; margin-bottom: 10px;">
                  ${formatCurrency(pensionViudez)}
                </div>
                <div style="color: #6b21a8;">mensuales (90% de la pensión del titular)</div>
                <div style="font-size: 14px; color: #4b5563; margin-top: 10px;">
                  Protección familiar garantizada
                </div>
              </div>
            </div>

            <!-- Nota importante -->
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <div style="font-weight: bold; color: #78350f; margin-bottom: 8px;">Información importante</div>
              <div style="font-size: 14px; color: #78350f; line-height: 1.6;">
                • Los pagos mensuales se realizan durante ${estrategia.mesesM40} meses<br>
                • Tu pensión aumentará 5% cada febrero<br>
                • Esta proyección incluye el cálculo de ISR actualizado
              </div>
            </div>
          </div>
        </body>
        </html>
      `)
      iframeDoc.close()
      
      // Esperar un momento para que se renderice
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const contentElement = iframeDoc.getElementById('pdf-content')
      if (!contentElement) throw new Error('No se encontró el elemento de contenido')
      
      console.log('📸 Capturando con html2canvas...')
      
      // Capturar usando html2canvas desde el iframe
      // Excluir elementos con clase "no-pdf" (aunque no debería ser necesario porque el PDF se genera desde HTML manual)
      const canvas = await html2canvas(contentElement, {
        scale: 2,
        useCORS: false,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          // Excluir elementos con clase "no-pdf" por si acaso
          return element.classList?.contains('no-pdf') || false
        }
      })
      
      console.log('✅ Canvas generado exitosamente')
      
      // Remover iframe
      document.body.removeChild(iframe)
      
      // Generar PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      const pageHeight = 277
      let heightLeft = imgHeight
      let position = 10
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      const nombreArchivo = `Estrategia_${estrategia.estrategia}_${estrategia.umaElegida}UMA_${new Date().toISOString().split('T')[0]}.pdf`
      
      // Detectar si es iOS de manera más robusta
      const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                   (navigator.vendor && navigator.vendor.indexOf('Apple') > -1)
      
      if (esIOS) {
        // Para iOS, usar método especializado
        await descargarPDFiOS(pdf, nombreArchivo)
      } else {
        // Para Android y PC, usar el método estándar
        try {
          pdf.save(nombreArchivo)
          mostrarNotificacion('✅ PDF descargado exitosamente', 'success')
        } catch (error) {
          console.error('Error con método estándar:', error)
          // Fallback para otros dispositivos
          const pdfBlob = pdf.output('blob')
          const blobUrl = URL.createObjectURL(pdfBlob)
          const enlaceDescarga = document.createElement('a')
          enlaceDescarga.href = blobUrl
          enlaceDescarga.download = nombreArchivo
          enlaceDescarga.style.display = 'none'
          
          document.body.appendChild(enlaceDescarga)
          enlaceDescarga.click()
          
          setTimeout(() => {
            document.body.removeChild(enlaceDescarga)
            URL.revokeObjectURL(blobUrl)
          }, 1000)
          
          mostrarNotificacion('✅ PDF descargado usando método alternativo', 'success')
        }
      }
      
      console.log('🎉 PDF generado exitosamente')
      
    } catch (error: any) {
      console.error('❌ Error generando PDF:', error)
      console.error('📝 Detalles del error:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })
      alert('Error al generar el PDF. Por favor, intenta nuevamente.')
    } finally {
      setGenerandoPDF(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header de la estrategia - MEJORADO PARA MÓVIL */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6">
        <div className="flex flex-col space-y-4">
          {/* Título y botón volver */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-xl md:text-3xl font-bold mb-2">
                🎯 {estrategia.estrategia === "fijo" ? "UMA Fijo" : "UMA Progresivo"}
              </h1>
              <p className="text-sm md:text-base text-blue-100">
                {estrategia.umaElegida} UMA • {estrategia.mesesM40} meses
              </p>
            </div>
            <button
              onClick={onVolver}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
          </div>

          {/* Botones de acción - REORGANIZADOS PARA MÓVIL */}
          <div className="flex flex-wrap gap-2">
            {debugCode && (
              <button
                onClick={guardarEstrategia}
                disabled={guardando || guardada}
                className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                  guardada 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                } ${guardando ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Guardando...</span>
                  </>
                ) : (
                  <>
                    <Star className={`w-4 h-4 ${guardada ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{guardada ? 'Guardada' : 'Guardar'}</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={compartirEstrategia}
              className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir</span>
            </button>
            <button
              onClick={generarPDF}
              disabled={generandoPDF}
              className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 disabled:bg-gray-400 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
            >
              {generandoPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Métricas principales - MEJORADO PARA MÓVIL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/10 p-3 md:p-4 rounded-lg">
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(estrategia.pensionMensual)}</div>
            <div className="text-xs md:text-sm text-blue-100">
              <TooltipInteligente termino="Pensión mensual" colorTexto="text-white hover:text-blue-100">
                Pensión mensual
              </TooltipInteligente>
            </div>
          </div>
          <div className="bg-white/10 p-3 md:p-4 rounded-lg">
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(isr.pensionNeta)}</div>
            <div className="text-xs md:text-sm text-blue-100">
              <TooltipInteligente termino="Pensión neta" colorTexto="text-white hover:text-blue-100">
                Neta (después ISR)
              </TooltipInteligente>
            </div>
          </div>
          <div className="bg-white/10 p-3 md:p-4 rounded-lg">
            <div className="text-lg md:text-2xl font-bold">{formatCurrency(estrategia.inversionTotal || 0)}</div>
            <div className="text-xs md:text-sm text-blue-100">
              <TooltipInteligente termino="Inversión total" colorTexto="text-white hover:text-blue-100">
                Inversión total
              </TooltipInteligente>
            </div>
          </div>
          <div className="bg-white/10 p-3 md:p-4 rounded-lg">
            <div className="text-lg md:text-2xl font-bold">{estrategia.ROI}%</div>
            <div className="text-xs md:text-sm text-blue-100">
              <TooltipInteligente termino="ROI" colorTexto="text-white hover:text-blue-100">
                ROI 20 años
              </TooltipInteligente>
            </div>
          </div>
        </div>
      </div>

      {/* Información personalizada del familiar */}
      {(datosUsuario.nombreFamiliar || datosUsuario.edadActual || datosUsuario.edadJubilacion) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Información Personalizada
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {datosUsuario.nombreFamiliar && (
              <div className="bg-white p-3 md:p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-xs md:text-sm text-blue-600 font-medium mb-1">👤 Nombre</div>
                <div className="text-sm md:text-base font-semibold text-gray-900">{datosUsuario.nombreFamiliar}</div>
              </div>
            )}
            {(datosUsuario.edadActual || datosUsuario.fechaNacimiento) && (
              <div className="bg-white p-3 md:p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-xs md:text-sm text-blue-600 font-medium mb-1">📅 Edad Actual</div>
                <div className="text-sm md:text-base font-semibold text-gray-900">{datosUsuario.edadActual || (datosUsuario.fechaNacimiento ? calculateAge(datosUsuario.fechaNacimiento) : 'N/A')} años</div>
              </div>
            )}
            {datosUsuario.edadJubilacion && (
              <div className="bg-white p-3 md:p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-xs md:text-sm text-blue-600 font-medium mb-1">🎯 Jubilación</div>
                <div className="text-sm md:text-base font-semibold text-gray-900">{datosUsuario.edadJubilacion} años</div>
              </div>
            )}
            {(datosUsuario.semanasCotizadas || datosUsuario.semanasPrevias) && (
              <div className="bg-white p-3 md:p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-xs md:text-sm text-blue-600 font-medium mb-1">📊 Semanas</div>
                <div className="text-sm md:text-base font-semibold text-gray-900">{datosUsuario.semanasCotizadas || datosUsuario.semanasPrevias}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABS DE NAVEGACIÓN MEJORADO PARA MÓVIL */}
      <div className="border-b border-gray-200 bg-gray-50">
        {/* Indicador de scroll para móvil */}
        <div className="md:hidden bg-blue-100 text-blue-800 px-4 py-2 text-xs flex items-center justify-center gap-2">
          <ChevronLeft className="w-3 h-3 animate-pulse" />
          <span>Desliza para ver más opciones</span>
          <ChevronRight className="w-3 h-3 animate-pulse" />
        </div>
        
        {/* Tabs con scroll horizontal mejorado */}
        <div className="relative">
          <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActivo(tab.id)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 font-medium transition-colors whitespace-nowrap snap-center min-w-fit ${
                    tabActivo === tab.id
                      ? "text-blue-600 border-b-3 border-blue-600 bg-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm md:text-base">{tab.label.replace(/^[^\s]+ /, '')}</span>
                </button>
              )
            })}
          </div>
          
          {/* Gradientes indicadores de scroll en los bordes */}
          <div className="md:hidden absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none"></div>
          <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
        </div>
      </div>

      {/* Selector de tabs tipo dropdown para móvil (alternativa) */}
      <div className="md:hidden border-b border-gray-200 bg-white">
        <button
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-medium text-gray-900 flex items-center gap-2">
            {tabs.find(t => t.id === tabActivo)?.icon && (
              <>{React.createElement(tabs.find(t => t.id === tabActivo)!.icon, { className: "w-5 h-5 text-blue-600" })}</>
            )}
            {tabs.find(t => t.id === tabActivo)?.label}
          </span>
          <ChevronRight className={`w-5 h-5 transform transition-transform ${menuMovilAbierto ? 'rotate-90' : ''}`} />
        </button>
        
        {menuMovilAbierto && (
          <div className="absolute z-10 w-full bg-white shadow-lg rounded-b-lg">
            {tabs.filter(t => t.id !== tabActivo).map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setTabActivo(tab.id)
                    setMenuMovilAbierto(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <IconComponent className="w-5 h-5 text-gray-600" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Contenido de los tabs - Con padding responsive */}
      <div className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          {tabActivo === "resumen" && (
            <TabResumen 
              key="tab-resumen"
              estrategia={estrategia} 
              isr={isr} 
              datosUsuario={datosUsuario}
              formatCurrency={formatCurrency}
            />
          )}
          {tabActivo === "pagos" && (
            <TabPagos 
              key="tab-pagos"
              estrategia={estrategia}
              formatCurrency={formatCurrency}
            />
          )}
          {tabActivo === "cronograma" && (
            <TabCronograma
              key="tab-cronograma"
              fechaInicioM40={fechaInicioM40}
              fechaFinM40={fechaFinM40}
              fechaTramite={fechaTramite}
              fechaJubilacion={fechaJubilacion}
              mesesM40={estrategia.mesesM40}
              formatDate={formatDate}
              datosUsuario={datosUsuario}
            />
          )}
          {tabActivo === "proyeccion" && (
            <TabProyeccion 
              key="tab-proyeccion"
              proyeccion={proyeccion}
              formatCurrency={formatCurrency}
              datosUsuario={datosUsuario}
            />
          )}
          {tabActivo === "tramites" && (
            <EstrategiaDetalladaTramites 
              key="tab-tramites"
              fechaTramite={fechaTramite}
              formatDate={formatDate}
              fechaInicio={fechaInicioM40}
              fechaJubilacion={fechaJubilacion}
              mesesM40={estrategia.mesesM40}
              registros={estrategia.registros || []}
              esProgresivo={estrategia.estrategia === "progresivo"}
              formatCurrency={formatCurrency}
            />
          )}
          {tabActivo === "viudez" && (
            <TabViudez 
              key="tab-viudez"
              pensionViudez={pensionViudez}
              formatCurrency={formatCurrency}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Componente de Upsell Premium - No aparece en PDF (clase no-pdf) */}
      <PremiumUpsellSection 
        estrategiaActual={estrategia}
        datosUsuario={datosUsuario}
      />

      {/* Estilos para ocultar scrollbar pero mantener funcionalidad */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.div>
  )
}

// Componentes de cada tab - MEJORADOS PARA MÓVIL
function TabResumen({ estrategia, isr, datosUsuario, formatCurrency }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 md:space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Desglose de pensión */}
        <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
          <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
            <Calculator className="w-4 md:w-5 h-4 md:h-5 text-blue-600" />
            Desglose de Pensión
          </h3>
          <div className="space-y-2 md:space-y-3">
            <div className="flex justify-between text-sm md:text-base">
              <span>Pensión base:</span>
              <span className="font-semibold">{formatCurrency(estrategia.pensionMensual)}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span>
                <TooltipInteligente termino="Factor edad">
                  Factor edad ({estrategia.factorEdad})
                </TooltipInteligente>:
              </span>
              <span className="font-semibold">{formatCurrency(estrategia.conFactorEdad)}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span>
                <TooltipInteligente termino="Factor Fox">
                  Factor Fox (11%)
                </TooltipInteligente>:
              </span>
              <span className="font-semibold">{formatCurrency(estrategia.conLeyFox)}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span>
                <TooltipInteligente termino="Asignaciones familiares">
                  Asignaciones familiares
                </TooltipInteligente>:
              </span>
              <span className="font-semibold">{formatCurrency(estrategia.conDependiente)}</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-base md:text-lg font-bold">
              <span>Pensión final:</span>
              <span className="text-green-600">{formatCurrency(estrategia.pensionMensual)}</span>
            </div>
          </div>
        </div>

        {/* Cálculo de ISR */}
        <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
          <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
            <Calculator className="w-4 md:w-5 h-4 md:h-5 text-red-600" />
            Cálculo de ISR
          </h3>
          <div className="space-y-2 md:space-y-3">
            <div className="flex justify-between text-sm md:text-base">
              <span>Pensión bruta:</span>
              <span className="font-semibold">{formatCurrency(isr.pensionBruta)}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span>
                <TooltipInteligente termino="Umbral exento">
                  Umbral exento
                </TooltipInteligente>:
              </span>
              <span className="font-semibold">{formatCurrency(isr.umbralExento)}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span>
                <TooltipInteligente termino="Base gravable">
                  Base gravable
                </TooltipInteligente>:
              </span>
              <span className="font-semibold">{formatCurrency(isr.baseGravable)}</span>
            </div>
            <div className="flex justify-between text-sm md:text-base">
              <span>ISR mensual:</span>
              <span className="font-semibold text-red-600">-{formatCurrency(isr.isrMensual)}</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-base md:text-lg font-bold">
              <span>Pensión neta:</span>
              <span className="text-green-600">{formatCurrency(isr.pensionNeta)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-blue-50 p-3 md:p-4 rounded-lg text-center">
          <div className="text-xl md:text-2xl font-bold text-blue-600">{estrategia.recuperacionMeses}</div>
          <div className="text-xs md:text-sm text-blue-700">Meses para recuperar inversión</div>
        </div>
        <div className="bg-green-50 p-3 md:p-4 rounded-lg text-center">
          <div className="text-xl md:text-2xl font-bold text-green-600">{estrategia.ROI}%</div>
          <div className="text-xs md:text-sm text-green-700">ROI en 20 años</div>
        </div>
        <div className="bg-purple-50 p-3 md:p-4 rounded-lg text-center">
          <div className="text-xl md:text-2xl font-bold text-purple-600">{formatCurrency(estrategia.pensionConAguinaldo)}</div>
          <div className="text-xs md:text-sm text-purple-700">Pensión con aguinaldo</div>
        </div>
      </div>
    </motion.div>
  )
}

function TabPagos({ estrategia, formatCurrency }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 md:space-y-6"
    >
      <div className="bg-yellow-50 border border-yellow-200 p-3 md:p-4 rounded-lg">
        <div className="flex items-start gap-2 md:gap-3">
          <Info className="w-4 md:w-5 h-4 md:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1 text-sm md:text-base">
              Información importante
            </h4>
            <p className="text-xs md:text-sm text-yellow-700">
              Los pagos mensuales se realizan durante {estrategia.mesesM40} meses. 
              Cada pago mejora tu promedio salarial para el cálculo final de pensión.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full align-middle px-4 md:px-0">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900">Mes</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900">Fecha</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900 hidden sm:table-cell">UMA</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900 hidden md:table-cell">Tasa M40</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900 hidden lg:table-cell">SDI Mensual</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900">Cuota</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900">Acumulado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estrategia.registros?.slice(0, 12).map((registro: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900">{index + 1}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900">{registro.fecha}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900 hidden sm:table-cell">{registro.uma}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900 hidden md:table-cell">{registro.tasaM40 ? `${registro.tasaM40.toFixed(2)}%` : 'N/A'}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900 hidden lg:table-cell">{formatCurrency(registro.sdiMensual)}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900 font-medium">{formatCurrency(registro.cuotaMensual)}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900 font-medium">{formatCurrency(registro.acumulado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-center text-xs md:text-sm text-gray-600">
        Mostrando los primeros 12 meses. Total de {estrategia.mesesM40} meses.
      </div>
    </motion.div>
  )
}

function TabCronograma({ fechaInicioM40, fechaFinM40, fechaTramite, fechaJubilacion, mesesM40, formatDate, datosUsuario }: any) {
  const calcularEdadEnFecha = (fecha: Date) => {
    if (!datosUsuario.fechaNacimiento) return null
    const fechaNacimiento = new Date(datosUsuario.fechaNacimiento)
    let edad = fecha.getFullYear() - fechaNacimiento.getFullYear()
    const monthDiff = fecha.getMonth() - fechaNacimiento.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && fecha.getDate() < fechaNacimiento.getDate())) {
      edad--
    }
    return edad
  }

  const formatDateMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long'
    })
  }

  const edadInicioM40 = calcularEdadEnFecha(fechaInicioM40)
  const edadFinM40 = calcularEdadEnFecha(fechaFinM40)
  const edadTramite = calcularEdadEnFecha(fechaTramite)
  const edadJubilacion = calcularEdadEnFecha(fechaJubilacion)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 md:space-y-6"
    >
      <div className="bg-blue-50 border border-blue-200 p-3 md:p-4 rounded-lg">
        <div className="flex items-start gap-2 md:gap-3">
          <Info className="w-4 md:w-5 h-4 md:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-1 text-sm md:text-base">
              Cronograma Personalizado
            </h4>
            <p className="text-xs md:text-sm text-blue-700">
              Basado en tu fecha de nacimiento y edad objetivo de jubilación ({datosUsuario.edadJubilacion || datosUsuario.edad} años).
            </p>
          </div>
        </div>
      </div>

      <div className="relative pl-8 md:pl-10">
        <div className="absolute left-4 md:left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
        
        <div className="space-y-6 md:space-y-8">
          {/* Timeline items con diseño responsive */}
          {[
            { num: 1, color: 'blue', title: 'Inicio de Modalidad 40', fecha: fechaInicioM40, edad: edadInicioM40, desc: 'Comienzas a realizar pagos voluntarios.' },
            { num: 2, color: 'green', title: 'Período de Pagos', desc: `${mesesM40} meses de contribuciones` },
            { num: 3, color: 'purple', title: 'Finalización M40', fecha: fechaFinM40, edad: edadFinM40, desc: 'Completas tu período de Modalidad 40.' },
            { num: 4, color: 'orange', title: 'Inicio de Trámites', fecha: fechaTramite, edad: edadTramite, desc: 'Comienzas el proceso de trámites.' },
            { num: 5, color: 'red', title: 'Fecha de Jubilación', fecha: fechaJubilacion, edad: edadJubilacion, desc: 'Comienzas a recibir tu pensión mensual.' }
          ].map((item) => (
            <div key={item.num} className="flex items-start gap-3 md:gap-4">
              <div className={`w-7 h-7 md:w-8 md:h-8 bg-${item.color}-600 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm z-10 flex-shrink-0`}>
                {item.num}
              </div>
              <div className={`flex-1 bg-${item.color}-50 p-3 md:p-4 rounded-lg`}>
                <h4 className={`font-bold text-${item.color}-800 mb-1 md:mb-2 text-sm md:text-base`}>{item.title}</h4>
                {item.fecha && (
                  <p className={`text-${item.color}-700 mb-1 md:mb-2 font-semibold text-sm md:text-base`}>
                    {formatDateMonthYear(item.fecha)}
                  </p>
                )}
                {item.edad && (
                  <p className={`text-${item.color}-600 mb-1 md:mb-2 text-xs md:text-sm`}>
                    <span className="font-semibold">Edad:</span> {item.edad} años
                  </p>
                )}
                <p className={`text-xs md:text-sm text-${item.color}-600`}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function TabProyeccion({ proyeccion, formatCurrency, datosUsuario }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 md:space-y-6"
    >
      <div className="bg-blue-50 border border-blue-200 p-3 md:p-4 rounded-lg">
        <div className="flex items-start gap-2 md:gap-3">
          <Info className="w-4 md:w-5 h-4 md:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-1 text-sm md:text-base">
              Proyección con Incrementos
            </h4>
            <p className="text-xs md:text-sm text-blue-700">
              Tu pensión aumentará 5% cada febrero. Proyección desde {proyeccion[0]?.año || 'N/A'}.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full align-middle px-4 md:px-0">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900">Año</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900">P. Bruta</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900">P. Neta</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900 hidden sm:table-cell">ISR</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900 hidden md:table-cell">Incr.</th>
                  <th className="px-2 md:px-3 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-900 hidden lg:table-cell">Acum.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {proyeccion.slice(0, 10).map((item: any) => (
                  <tr key={item.año} className="hover:bg-gray-50">
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-900">{item.año}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900">{formatCurrency(item.pensionBruta)}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900 font-medium">{formatCurrency(item.pensionNeta)}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900 hidden sm:table-cell">{formatCurrency(item.isrMensual)}</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900 hidden md:table-cell">+{item.incremento}%</td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm text-gray-900 hidden lg:table-cell">+{item.acumulado}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-center text-xs md:text-sm text-gray-600">
        Mostrando los primeros 10 años de 20.
      </div>
    </motion.div>
  )
}


function TabViudez({ pensionViudez, formatCurrency }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 md:space-y-6"
    >
      <div className="bg-purple-50 border border-purple-200 p-4 md:p-6 rounded-lg text-center">
        <Shield className="w-12 md:w-16 h-12 md:h-16 text-purple-600 mx-auto mb-3 md:mb-4" />
        <h3 className="text-xl md:text-2xl font-bold text-purple-800 mb-2">
          Protección Familiar
        </h3>
        <p className="text-purple-700 mb-3 md:mb-4 text-sm md:text-base">
          Tu cónyuge recibirá el 90% de tu pensión en caso de fallecimiento
        </p>
        <div className="text-2xl md:text-3xl font-bold text-purple-600">
          {formatCurrency(pensionViudez)}
        </div>
        <div className="text-xs md:text-sm text-purple-600 mt-2">mensuales</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg border">
          <h4 className="font-bold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">Beneficios</h4>
          <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-600">
            <li>• 90% de la pensión del titular</li>
            <li>• Pago mensual garantizado</li>
            <li>• Incrementos anuales del 5%</li>
            <li>• Protección financiera familiar</li>
            <li>• Sin límite de edad para el cónyuge</li>
          </ul>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg border">
          <h4 className="font-bold text-gray-800 mb-3 md:mb-4 text-sm md:text-base">Requisitos</h4>
          <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-600">
            <li>• Matrimonio vigente al fallecimiento</li>
            <li>• Mínimo 5 años de matrimonio</li>
            
            <li>• Presentar documentación de matrimonio</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
