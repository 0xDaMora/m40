"use client"

import { useState, useEffect } from "react"
import { Users, FileText, TrendingUp, Calendar } from "lucide-react"
import { motion } from "framer-motion"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  description?: string
}

function StatCard({ title, value, icon, color, description }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

export function DashboardStats() {
  const [stats, setStats] = useState([
    {
      title: "Familiares",
      value: "0",
      icon: <Users className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-100",
      description: "Miembros registrados"
    },
    {
      title: "Estrategias",
      value: "0",
      icon: <FileText className="w-6 h-6 text-green-600" />,
      color: "bg-green-100",
      description: "Estrategias guardadas"
    },
    {
      title: "Última Simulación",
      value: "Nunca",
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      color: "bg-purple-100",
      description: "Modalidad 40"
    },
    {
      title: "Próximo Vencimiento",
      value: "30 días",
      icon: <Calendar className="w-6 h-6 text-orange-600" />,
      color: "bg-orange-100",
      description: "Plan Premium"
    }
  ])

  // Cargar estadísticas reales
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Cargar familiares
        const familyResponse = await fetch('/api/family')
        if (familyResponse.ok) {
          const familyMembers = await familyResponse.json()
          setStats(prev => prev.map(stat => 
            stat.title === "Familiares" 
              ? { ...stat, value: familyMembers.length.toString() }
              : stat
          ))
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          description={stat.description}
        />
      ))}
    </div>
  )
}
