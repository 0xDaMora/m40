"use client"

import { MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

interface Advisory {
  id: string
  fullName: string
  status: string
  createdAt: string
  updatedAt: string
  unreadCount: number
  lastMessage: {
    message: string
    senderType: string
    createdAt: string
  } | null
}

interface AdvisoryListProps {
  advisories: Advisory[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function AdvisoryList({ advisories, selectedId, onSelect }: AdvisoryListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) {
      return "Hace menos de 1 hora"
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
    } else {
      return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'in_progress':
        return <MessageSquare className="w-4 h-4 text-blue-600" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendiente",
      in_progress: "En progreso",
      resolved: "Resuelta"
    }
    return labels[status as keyof typeof labels] || status
  }

  if (advisories.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No tienes asesorías activas</p>
        <p className="text-sm text-gray-500 mt-2">
          Crea una nueva solicitud para comenzar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {advisories.map((advisory, index) => (
        <motion.button
          key={advisory.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(advisory.id)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
            selectedId === advisory.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(advisory.status)}
              <h3 className="font-semibold text-gray-900">{advisory.fullName}</h3>
            </div>
            {advisory.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {advisory.unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <span className="font-medium">{getStatusLabel(advisory.status)}</span>
            <span>•</span>
            <span>{formatDate(advisory.lastMessage?.createdAt || advisory.createdAt)}</span>
          </div>

          {advisory.lastMessage && (
            <p className="text-sm text-gray-700 line-clamp-2">
              <span className="font-medium">
                {advisory.lastMessage.senderType === 'admin' ? 'Asesor: ' : 'Tú: '}
              </span>
              {advisory.lastMessage.message}
            </p>
          )}
        </motion.button>
      ))}
    </div>
  )
}
