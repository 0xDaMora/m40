"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Send, CheckCircle, AlertCircle, UserCheck } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "react-hot-toast"

interface AdvisorRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

const MAX_DESCRIPTION_LENGTH = 5000 // Límite de seguridad
const MIN_DESCRIPTION_LENGTH = 50 // Mínimo para una descripción útil

export default function AdvisorRequestModal({ isOpen, onClose }: AdvisorRequestModalProps) {
  const { data: session } = useSession()
  const [email, setEmail] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Auto-completar email si el usuario está logueado
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email)
    }
  }, [session])

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setEmail(session?.user?.email || "")
      setDescription("")
      setIsSubmitted(false)
      setIsSubmitting(false)
    }
  }, [isOpen, session])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 255
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones de seguridad
    if (!email || !email.trim()) {
      toast.error("Por favor ingresa tu correo electrónico")
      return
    }

    if (!validateEmail(email)) {
      toast.error("Por favor ingresa un correo electrónico válido")
      return
    }

    if (email.length > 255) {
      toast.error("El correo electrónico es demasiado largo")
      return
    }

    if (!description || !description.trim()) {
      toast.error("Por favor describe tu necesidad o duda")
      return
    }

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      toast.error(`Por favor proporciona más detalles (mínimo ${MIN_DESCRIPTION_LENGTH} caracteres)`)
      return
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(`La descripción es demasiado larga (máximo ${MAX_DESCRIPTION_LENGTH} caracteres)`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/advisor-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          description: description.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar la solicitud")
      }

      setIsSubmitted(true)
      toast.success("¡Solicitud enviada exitosamente!")
    } catch (error: any) {
      console.error("Error al enviar solicitud:", error)
      toast.error(error.message || "Error al enviar la solicitud. Por favor intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingChars = MAX_DESCRIPTION_LENGTH - description.length
  const isDescriptionValid = description.trim().length >= MIN_DESCRIPTION_LENGTH && description.length <= MAX_DESCRIPTION_LENGTH

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto relative">
              {/* Botón cerrar - Sticky para que siempre esté visible */}
              <div className="sticky top-0 z-20 flex justify-end bg-white pb-2 pt-4 pr-4">
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 pt-4 md:pt-8">
                  {/* Header */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                      Solicita una Cotización con un Asesor Especializado
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">
                      Completa el siguiente formulario para recibir una cotización personalizada de un asesor especializado en Modalidad 40. Recibirás la respuesta por correo electrónico con tu cotización y los datos del asesor que te atenderá.
                    </p>
                  </div>

                  {/* Mensaje importante */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mb-4 sm:mb-6 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-2">💡 Es importante que en la descripción incluyas datos relevantes como:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Nombre completo</li>
                          <li>Fecha de nacimiento</li>
                          <li>Semanas cotizadas</li>
                          <li>Último salario bruto mensual</li>
                          <li>Tu duda específica o lo que deseas que el asesor te ayude</li>
                        </ul>
                        <p className="mt-2">
                          Esto nos permitirá ayudarte de manera más rápida y precisa. Recuerda que esta es una cotización para tu caso específico.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Campo de email */}
                  <div className="mb-4 sm:mb-6">
                    <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value.length <= 255) {
                            setEmail(value)
                          }
                        }}
                        disabled={!!session?.user?.email}
                        className={`w-full pl-10 pr-4 py-2 sm:py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base ${
                          session?.user?.email
                            ? "bg-gray-100 cursor-not-allowed"
                            : "bg-white border-gray-300"
                        }`}
                        placeholder="tu@email.com"
                        required
                        maxLength={255}
                      />
                    </div>
                    {session?.user?.email && (
                      <p className="mt-1 text-xs text-gray-500">Tu correo se ha completado automáticamente</p>
                    )}
                  </div>

                  {/* Campo de descripción */}
                  <div className="mb-4 sm:mb-6">
                    <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Descripción de tu necesidad o duda <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value.length <= MAX_DESCRIPTION_LENGTH) {
                          setDescription(value)
                        }
                      }}
                      rows={6}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm sm:text-base"
                      placeholder="Describe tu situación, incluye tus datos relevantes (nombre, fecha de nacimiento, semanas cotizadas, último salario) y explica qué necesitas que el asesor te ayude..."
                      required
                      maxLength={MAX_DESCRIPTION_LENGTH}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={`${!isDescriptionValid && description.length > 0 ? "text-red-500" : "text-gray-500"}`}>
                        {description.trim().length < MIN_DESCRIPTION_LENGTH && description.length > 0
                          ? `Mínimo ${MIN_DESCRIPTION_LENGTH} caracteres (faltan ${MIN_DESCRIPTION_LENGTH - description.trim().length})`
                          : `${description.length} / ${MAX_DESCRIPTION_LENGTH} caracteres`}
                      </span>
                      {remainingChars < 100 && (
                        <span className={remainingChars < 0 ? "text-red-500" : "text-orange-500"}>
                          {remainingChars} caracteres restantes
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón de enviar */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !isDescriptionValid || !validateEmail(email)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Enviar Solicitud</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Mensaje de confirmación */
                <div className="p-4 sm:p-6 md:p-8 pt-4 md:pt-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      ¡Solicitud Enviada Exitosamente!
                    </h2>
                    <p className="text-base text-gray-600 mb-6">
                      Hemos recibido tu solicitud de cotización. Un asesor especializado revisará tu caso y te contactará por correo electrónico en breve con tu cotización personalizada y los datos del asesor que te atenderá.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Cerrar
                    </button>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

