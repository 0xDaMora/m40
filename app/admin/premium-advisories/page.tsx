"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { 
  MessageSquare, Calendar, Clock, CheckCircle, AlertCircle, 
  Filter, Send, Crown, Mail, Phone, User, X 
} from "lucide-react"
import { toast } from "react-hot-toast"

interface Advisory {
  id: string
  fullName: string
  birthDate: string
  weeksContributed: number
  lastSalary: number
  contactMethod: string
  phoneNumber: string | null
  status: string
  createdAt: string
  updatedAt: string
  user: {
    email: string
    name: string | null
  }
  messageCount: number
  lastMessage: {
    message: string
    senderType: string
    createdAt: string
  } | null
}

interface Message {
  id: string
  senderType: "user" | "admin"
  senderId: string | null
  message: string
  isRead: boolean
  createdAt: string
}

interface AdvisoryDetail extends Advisory {
  messages: Message[]
}

export default function PremiumAdvisoriesAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const hasRedirected = useRef(false)
  const [advisories, setAdvisories] = useState<Advisory[]>([])
  const [selectedAdvisory, setSelectedAdvisory] = useState<AdvisoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [replyMessage, setReplyMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated" && !hasRedirected.current) {
      hasRedirected.current = true
      router.replace("/")
      return
    }

    if (status === "authenticated" && session?.user) {
      checkAdminAccess()
    }
  }, [status, session, router])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin/premium-advisories?limit=1")
      if (response.status === 403 || response.status === 401) {
        toast.error("No tienes permisos para acceder a esta página")
        router.replace("/dashboard")
      } else {
        loadAdvisories()
      }
    } catch (error) {
      console.error("Error verificando acceso:", error)
    }
  }

  const loadAdvisories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: filterStatus === "all" ? "" : filterStatus,
        limit: "100"
      })

      const response = await fetch(`/api/admin/premium-advisories?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Error al cargar asesorías")
      }

      const data = await response.json()
      setAdvisories(data.data || [])
    } catch (error: any) {
      console.error("Error:", error)
      toast.error("Error al cargar asesorías")
    } finally {
      setLoading(false)
    }
  }

  const loadAdvisoryDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/premium-advisories/${id}`)
      
      if (!response.ok) {
        throw new Error("Error al cargar detalles")
      }

      const data = await response.json()
      setSelectedAdvisory(data.advisory)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (error: any) {
      console.error("Error:", error)
      toast.error("Error al cargar detalles de asesoría")
    }
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!replyMessage.trim() || replyMessage.trim().length < 10) {
      toast.error("El mensaje debe tener al menos 10 caracteres")
      return
    }

    if (!selectedAdvisory) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/admin/premium-advisories/${selectedAdvisory.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: replyMessage.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar respuesta")
      }

      setReplyMessage("")
      toast.success("Respuesta enviada exitosamente")
      await loadAdvisoryDetail(selectedAdvisory.id)
      await loadAdvisories()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Error al enviar respuesta")
    } finally {
      setIsSending(false)
    }
  }

  const handleChangeStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/premium-advisories/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error("Error al cambiar estado")
      }

      toast.success("Estado actualizado")
      await loadAdvisories()
      if (selectedAdvisory?.id === id) {
        await loadAdvisoryDetail(id)
      }
    } catch (error: any) {
      console.error("Error:", error)
      toast.error("Error al cambiar estado")
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      in_progress: { label: "En Progreso", color: "bg-blue-100 text-blue-800", icon: MessageSquare },
      resolved: { label: "Resuelta", color: "bg-green-100 text-green-800", icon: CheckCircle }
    }
    const config = configs[status as keyof typeof configs] || configs.pending
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    loadAdvisories()
  }, [filterStatus])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de asesorías...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Crown className="w-8 h-8 text-purple-600" />
                Asesorías Premium
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona las solicitudes de asesoría de usuarios Premium
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/advisor-requests")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Volver al Panel Admin
            </button>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex gap-2">
              {["all", "pending", "in_progress", "resolved"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status === "all" ? "Todas" : status === "pending" ? "Pendientes" : status === "in_progress" ? "En Progreso" : "Resueltas"}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-gray-600">
              Total: <strong>{advisories.length}</strong>
            </div>
          </div>
        </div>

        {/* Grid: Lista y Detalle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Asesorías */}
          <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {advisories.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No hay asesorías {filterStatus !== "all" ? "con este estado" : ""}</p>
              </div>
            ) : (
              advisories.map((advisory) => (
                <motion.button
                  key={advisory.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => loadAdvisoryDetail(advisory.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAdvisory?.id === advisory.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{advisory.fullName}</h3>
                      <p className="text-sm text-gray-600">{advisory.user.email}</p>
                    </div>
                    {getStatusBadge(advisory.status)}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mb-2">
                    <Calendar className="w-3 h-3" />
                    {formatDate(advisory.createdAt)}
                  </div>
                  {advisory.lastMessage && (
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {advisory.lastMessage.senderType === "user" ? "Usuario: " : "Tú: "}
                      {advisory.lastMessage.message}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {advisory.messageCount} mensaje{advisory.messageCount !== 1 ? "s" : ""}
                  </div>
                </motion.button>
              ))
            )}
          </div>

          {/* Detalle de Asesoría */}
          <div className="lg:col-span-2">
            {!selectedAdvisory ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Selecciona una asesoría para ver los detalles</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                {/* Header del detalle */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedAdvisory.fullName}</h2>
                      <p className="text-gray-600">{selectedAdvisory.user.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedAdvisory(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Información del usuario */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Fecha de Nacimiento</div>
                      <div className="font-medium">{new Date(selectedAdvisory.birthDate).toLocaleDateString('es-MX')}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Semanas Cotizadas</div>
                      <div className="font-medium">{selectedAdvisory.weeksContributed}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Último Salario</div>
                      <div className="font-medium">${selectedAdvisory.lastSalary.toLocaleString('es-MX')}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                        {selectedAdvisory.contactMethod === "whatsapp" ? <Phone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        Contacto Preferido
                      </div>
                      <div className="font-medium">
                        {selectedAdvisory.contactMethod === "whatsapp" ? `WhatsApp: ${selectedAdvisory.phoneNumber}` : "Email"}
                      </div>
                    </div>
                  </div>

                  {/* Estado y acciones */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Estado:</span>
                    {getStatusBadge(selectedAdvisory.status)}
                    <select
                      value={selectedAdvisory.status}
                      onChange={(e) => handleChangeStatus(selectedAdvisory.id, e.target.value)}
                      className="ml-auto px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="resolved">Resuelta</option>
                    </select>
                  </div>
                </div>

                {/* Mensajes */}
                <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
                  {selectedAdvisory.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === "admin" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          message.senderType === "admin"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium opacity-75">
                            {message.senderType === "admin" ? "Tú (Admin)" : "Usuario"}
                          </span>
                          <span className="text-xs opacity-60">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de respuesta */}
                {selectedAdvisory.status !== "resolved" && (
                  <div className="p-6 border-t border-gray-200">
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSending}
                        maxLength={5000}
                      />
                      <button
                        type="submit"
                        disabled={isSending || !replyMessage.trim() || replyMessage.trim().length < 10}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            <span>Enviar</span>
                          </>
                        )}
                      </button>
                    </form>
                    <p className="text-xs text-gray-500 mt-2">
                      Mínimo 10 caracteres • {replyMessage.length}/5000
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
