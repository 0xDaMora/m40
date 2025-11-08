"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Mail, Copy, Check, HelpCircle } from "lucide-react"
import { toast } from "react-hot-toast"

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const SUPPORT_EMAIL = "soporte@m40.mx"

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      toast.success("Correo copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("No se pudo copiar el correo")
    }
  }

  const handleMailto = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}`
  }

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 relative">
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Contenido */}
              <div className="text-center">
                {/* Icono */}
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <HelpCircle className="w-8 h-8 text-blue-600" />
                </div>

                {/* Título */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  ¿Necesitas ayuda?
                </h2>

                {/* Mensaje */}
                <p className="text-base md:text-lg text-gray-600 mb-6">
                  Envíanos un correo para ayudarte con cualquier inconveniente que tengas
                </p>

                {/* Correo electrónico */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-500">Correo de soporte</span>
                  </div>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="text-lg md:text-xl font-semibold text-blue-600 hover:text-blue-700 transition-colors break-all"
                    onClick={handleMailto}
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleCopyEmail}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 text-green-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>Copiar correo</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleMailto}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Abrir correo</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

