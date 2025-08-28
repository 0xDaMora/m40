"use client"

import { useSession } from "next-auth/react"
import { User, Settings, LogOut } from "lucide-react"
import { motion } from "framer-motion"

export function DashboardHeader() {
  const { data: session } = useSession()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido, {session?.user?.name || session?.user?.email?.split('@')[0]}
            </h1>
            <p className="text-gray-600">
              Gestiona tus estrategias de pensión y familiares
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
