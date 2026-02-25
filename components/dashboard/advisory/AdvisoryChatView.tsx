"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  senderType: "user" | "admin"
  senderId: string | null
  message: string
  isRead: boolean
  createdAt: string
}

interface Advisory {
  id: string
  fullName: string
  status: string
  createdAt: string
  messages: Message[]
}

interface AdvisoryChatViewProps {
  advisoryId: string
  onBack: () => void
}

export function AdvisoryChatView({ advisoryId, onBack }: AdvisoryChatViewProps) {
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    loadAdvisory()
  }, [advisoryId])

  useEffect(() => {
    scrollToBottom()
  }, [advisory?.messages])

  const loadAdvisory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/premium-advisory/${advisoryId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar asesoría")
      }

      setAdvisory(data.advisory)
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Error al cargar asesoría")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || newMessage.trim().length < 10) {
      toast.error("El mensaje debe tener al menos 10 caracteres")
      return
    }

    if (advisory?.status === 'resolved') {
      toast.error("Esta asesoría ya está resuelta. Crea una nueva si necesitas más ayuda.")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch(`/api/premium-advisory/${advisoryId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: newMessage.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar mensaje")
      }

      setNewMessage("")
      toast.success("Mensaje enviado")
      await loadAdvisory()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Error al enviar mensaje")
    } finally {
      setIsSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
      in_progress: { label: "En Progreso", color: "bg-blue-100 text-blue-800" },
      resolved: { label: "Resuelta", color: "bg-green-100 text-green-800" }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando conversación...</p>
        </div>
      </div>
    )
  }

  if (!advisory) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">No se pudo cargar la asesoría</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
            >
              ← Volver a mis asesorías
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              Asesoría para {advisory.fullName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Creada el {formatDate(advisory.createdAt)}
            </p>
          </div>
          <div>
            {getStatusBadge(advisory.status)}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {advisory.messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                  message.senderType === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-75">
                    {message.senderType === 'user' ? 'Tú' : 'Asesor'}
                  </span>
                  <span className="text-xs opacity-60">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.message}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {advisory.status !== 'resolved' ? (
        <div className="px-6 py-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSending}
              maxLength={5000}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim() || newMessage.trim().length < 10}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Enviar</span>
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Mínimo 10 caracteres • {newMessage.length}/5000
          </p>
        </div>
      ) : (
        <div className="px-6 py-4 border-t border-gray-200 bg-green-50">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">
              Esta asesoría ha sido resuelta. Si necesitas más ayuda, crea una nueva solicitud.
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      {advisory.status === 'pending' && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <div className="flex items-start gap-2 text-blue-800">
            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              Tu solicitud está pendiente. Recibirás una respuesta en un máximo de <strong>24 horas</strong>. Te notificaremos por correo.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
