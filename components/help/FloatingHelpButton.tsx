"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { UserCheck, AlertTriangle } from "lucide-react"
import AdvisorRequestModal from "./AdvisorRequestModal"
import ErrorReportModal from "./ErrorReportModal"

export default function FloatingHelpButton() {
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)

  return (
    <>
      {/* Botón de reporte de error - Arriba */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
        onClick={() => setIsErrorModalOpen(true)}
        className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group px-3 sm:px-4 py-2.5 sm:py-3 gap-2"
        aria-label="Reportar error o duda"
      >
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-xs sm:text-sm font-medium">¿Encontraste un error en la página?</span>
      </motion.button>

      {/* Botón de asesor especializado - Abajo */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
        onClick={() => setIsAdvisorModalOpen(true)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group px-3 sm:px-4 py-2.5 sm:py-3 gap-2"
        aria-label="Solicitar asesor especializado"
      >
        <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
        <span className="text-xs sm:text-sm font-medium">¿Necesitas un asesor especializado?</span>
      </motion.button>

      <ErrorReportModal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)} />
      <AdvisorRequestModal isOpen={isAdvisorModalOpen} onClose={() => setIsAdvisorModalOpen(false)} />
    </>
  )
}

