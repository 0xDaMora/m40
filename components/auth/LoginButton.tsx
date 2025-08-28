"use client"

import { useAuth } from "@/lib/auth/useAuth"
import { LoginModal } from "./LoginModal"
import { User, LogOut } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import toast from "react-hot-toast"

export function LoginButton() {
  const { 
    isAuthenticated, 
    isLoading, 
    session, 
    isLoginModalOpen, 
    openLoginModal, 
    closeLoginModal, 
    logout 
  } = useAuth()

  if (isLoading) {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
                       <Link href="/dashboard">
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                 >
                   {session?.user?.image ? (
                     <img 
                       src={session.user.image} 
                       alt="Avatar" 
                       className="w-4 h-4 rounded-full"
                     />
                   ) : (
                     <User className="w-4 h-4" />
                   )}
                   <span className="text-sm font-medium">
                     {session?.user?.name || session?.user?.email?.split('@')[0]}
                   </span>
                 </motion.div>
               </Link>
        <button
          onClick={() => {
            logout()
            toast.success('Sesión cerrada exitosamente')
          }}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <>
      <motion.button
        onClick={openLoginModal}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <User className="w-4 h-4" />
        Iniciar Sesión
      </motion.button>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal}
        onSuccess={() => {
          closeLoginModal()
          // Aquí podríamos mostrar un toast de éxito
        }}
      />
    </>
  )
}
