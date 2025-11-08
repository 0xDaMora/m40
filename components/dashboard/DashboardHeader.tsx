"use client"

import { useSession, signOut } from "next-auth/react"
import { User, ArrowLeft, LogOut } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export function DashboardHeader() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            title="Volver atrás"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido, {session?.user?.name || session?.user?.email?.split('@')[0]}
              {session?.user?.email && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {session.user.email}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Gestiona tus estrategias de pensión y familiares
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              signOut({ callbackUrl: window.location.origin })
              toast.success('Sesión cerrada exitosamente')
            }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg border border-transparent hover:border-red-200 group"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 group-hover:text-red-600 transition-colors" />
            <span className="text-sm font-medium group-hover:text-red-600 transition-colors">
              Salir
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
