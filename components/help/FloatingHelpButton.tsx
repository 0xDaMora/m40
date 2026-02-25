"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { UserCheck, AlertTriangle, Crown } from "lucide-react"
import AdvisorRequestModal from "./AdvisorRequestModal"
import ErrorReportModal from "./ErrorReportModal"
import PremiumModal from "../PremiumModal"
import PremiumAdvisoryModal from "./PremiumAdvisoryModal"

export default function FloatingHelpButton() {
  const { data: session } = useSession()
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [isPremiumAdvisoryModalOpen, setIsPremiumAdvisoryModalOpen] = useState(false)

  const isPremium = (session?.user as any)?.subscription === 'premium'

  return (
    <>
      {/* Botón de reporte de error - Arriba */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          y: [0, -10, 0]
        }}
        transition={{ 
          scale: { delay: 0.1, type: "spring", stiffness: 300, damping: 20 },
          y: { 
            repeat: Infinity, 
            duration: 2,
            ease: "easeInOut",
            delay: 1
          }
        }}
        onClick={() => setIsErrorModalOpen(true)}
        className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group px-3 sm:px-4 py-2.5 sm:py-3 gap-2"
        aria-label="Reportar error o duda"
      >
        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-xs sm:text-sm font-medium">¿Encontraste un error en la página?</span>
      </motion.button>

      {/* Botón de asesor especializado / Asesorías Premium - Abajo */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          y: [0, -40, 0]
        }}
        transition={{ 
          scale: { delay: 0.15, type: "spring", stiffness: 300, damping: 20 },
          y: { 
            repeat: Infinity, 
            duration: 2.5,
            ease: "easeInOut",
            delay: 1.2
          }
        }}
        onClick={() => isPremium ? setIsPremiumAdvisoryModalOpen(true) : setIsAdvisorModalOpen(true)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group px-3 sm:px-4 py-2.5 sm:py-3 gap-2"
        aria-label={isPremium ? "Contactar con tu asesor" : "Solicitar asesor especializado"}
      >
        {isPremium ? (
          <>
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium">Ponte en contacto con tu asesor</span>
          </>
        ) : (
          <>
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium">¿Necesitas un asesor especializado?</span>
          </>
        )}
      </motion.button>

      <ErrorReportModal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)} />
      <AdvisorRequestModal 
        isOpen={isAdvisorModalOpen} 
        onClose={() => setIsAdvisorModalOpen(false)}
        onOpenPremiumModal={() => setIsPremiumModalOpen(true)}
      />
      <PremiumModal 
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
      <PremiumAdvisoryModal
        isOpen={isPremiumAdvisoryModalOpen}
        onClose={() => setIsPremiumAdvisoryModalOpen(false)}
      />
    </>
  )
}

