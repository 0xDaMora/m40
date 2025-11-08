"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { HelpCircle } from "lucide-react"
import HelpModal from "./HelpModal"

export default function FloatingHelpButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        aria-label="Solicitar ayuda"
      >
        <HelpCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </motion.button>

      <HelpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

