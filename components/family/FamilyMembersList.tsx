"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Edit, Trash2, Plus, Calendar, TrendingUp, DollarSign, Heart } from "lucide-react"
import toast from "react-hot-toast"
import { FamilyMember } from "@/types/family"
import { FamilyMemberForm } from "./FamilyMemberForm"

export function FamilyMembersList() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)

  // Cargar familiares
  const loadFamilyMembers = async () => {
    try {
      const fetchOnce = async () => fetch('/api/family', { credentials: 'include', cache: 'no-store' })
      let response = await fetchOnce()
      if (response.status === 401) {
        await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
        await new Promise(r => setTimeout(r, 300))
        response = await fetchOnce()
      }
      if (response.ok) {
        const data = await response.json()
        setFamilyMembers(Array.isArray(data) ? data : [])
      } else if (response.status === 503) {
        await new Promise(r => setTimeout(r, 700))
        const again = await fetchOnce()
        const data = again.ok ? await again.json() : []
        setFamilyMembers(Array.isArray(data) ? data : [])
      } else {
        toast.error('Error al cargar familiares')
      }
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFamilyMembers()
  }, [])

  // Eliminar familiar
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este familiar?')) {
      return
    }

    try {
      const response = await fetch(`/api/family/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Familiar eliminado exitosamente')
        loadFamilyMembers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al eliminar familiar')
      }
    } catch (error) {
      toast.error('Error inesperado')
    }
  }

  // Editar familiar
  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member)
    setShowForm(true)
  }

  // Calcular edad
  const calculateAge = (birthDate: Date) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Formatear salario
  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(salary)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Familiares ({familyMembers.length}/10)
        </h3>
        <button
          onClick={() => {
            setEditingMember(null)
            setShowForm(true)
          }}
          disabled={familyMembers.length >= 10}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Familiar
        </button>
      </div>

      {/* Lista de familiares */}
      {familyMembers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <User className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-600 mb-4">
            No tienes familiares registrados aún
          </p>
          <button
            onClick={() => {
              setEditingMember(null)
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Agregar tu primer familiar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Header con nombre y acciones */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600">
                    {calculateAge(member.birthDate)} años
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Información del familiar */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(member.birthDate)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>{member.weeksContributed} semanas cotizadas</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatSalary(member.lastGrossSalary)}</span>
                </div>
                
                                 <div className="flex items-center gap-2 text-gray-600">
                   <Heart className="w-4 h-4" />
                   <span className="capitalize">{member.civilStatus}</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal del formulario */}
      <FamilyMemberForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingMember(null)
        }}
        onSuccess={loadFamilyMembers}
        familyMember={editingMember}
      />
    </div>
  )
}
