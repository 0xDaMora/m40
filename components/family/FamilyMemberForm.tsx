"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Calendar, TrendingUp, DollarSign, Heart } from "lucide-react"
import toast from "react-hot-toast"
import { FamilyMember, CreateFamilyMemberData } from "@/types/family"

interface FamilyMemberFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  familyMember?: FamilyMember | null
}

export function FamilyMemberForm({ isOpen, onClose, onSuccess, familyMember }: FamilyMemberFormProps) {
  const [formData, setFormData] = useState<CreateFamilyMemberData>({
    name: '',
    birthDate: new Date(),
    weeksContributed: 500, // Valor mínimo válido por defecto
    lastGrossSalary: 0, // Mantenemos 0 pero cambiaremos el manejo
    civilStatus: 'soltero'
  })
  
  // Estados separados para mostrar campos vacíos en la UI
  const [displayValues, setDisplayValues] = useState({
    weeksContributed: '',
    lastGrossSalary: ''
  })
  const [loading, setLoading] = useState(false)

  // Cargar datos del familiar si estamos editando
  useEffect(() => {
    if (familyMember) {
      setFormData({
        name: familyMember.name,
        birthDate: new Date(familyMember.birthDate),
        weeksContributed: familyMember.weeksContributed,
        lastGrossSalary: familyMember.lastGrossSalary,
        civilStatus: familyMember.civilStatus
      })
      // Mostrar valores reales cuando editamos
      setDisplayValues({
        weeksContributed: familyMember.weeksContributed.toString(),
        lastGrossSalary: familyMember.lastGrossSalary > 0 ? familyMember.lastGrossSalary.toString() : ''
      })
    } else {
      // Resetear formulario para nuevo familiar
      setFormData({
        name: '',
        birthDate: new Date(),
        weeksContributed: 500, // Valor mínimo válido
        lastGrossSalary: 0,
        civilStatus: 'soltero'
      })
      // Campos vacíos para nuevo familiar
      setDisplayValues({
        weeksContributed: '',
        lastGrossSalary: ''
      })
    }
  }, [familyMember])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones mejoradas
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    
    if (!displayValues.weeksContributed || formData.weeksContributed < 500) {
      toast.error('Las semanas cotizadas deben ser al menos 500 según la LEY 73 del IMSS')
      return
    }
    
    if (!displayValues.lastGrossSalary || formData.lastGrossSalary <= 0) {
      toast.error('El salario bruto debe ser mayor a 0 pesos')
      return
    }
    
    if (formData.lastGrossSalary > 1000000) {
      toast.error('El salario bruto parece demasiado alto. Verifica el monto.')
      return
    }
    
    setLoading(true)

    try {
      const url = familyMember 
        ? `/api/family/${familyMember.id}`
        : '/api/family'
      
      const method = familyMember ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          familyMember 
            ? 'Familiar actualizado exitosamente' 
            : 'Familiar agregado exitosamente'
        )
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Error al guardar familiar')
      }
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateFamilyMemberData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Función específica para campos numéricos
  const handleNumericInputChange = (field: 'weeksContributed' | 'lastGrossSalary', value: string) => {
    // Actualizar valor de display (lo que ve el usuario)
    setDisplayValues(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Actualizar valor real (para envío)
    if (value === '') {
      // Campo vacío - usar valor por defecto según el campo
      const defaultValue = field === 'weeksContributed' ? 500 : 0
      setFormData(prev => ({
        ...prev,
        [field]: defaultValue
      }))
    } else {
      // Convertir a número
      const numericValue = field === 'weeksContributed' 
        ? parseInt(value) || 500
        : parseFloat(value) || 0
      
      setFormData(prev => ({
        ...prev,
        [field]: numericValue
      }))
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          key="family-member-form"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {familyMember ? 'Editar Familiar' : 'Agregar Familiar'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            {/* Fecha de nacimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={formData.birthDate.toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('birthDate', new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Semanas cotizadas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Semanas cotizadas
                </label>
                <input
                  type="number"
                  value={displayValues.weeksContributed}
                  onChange={(e) => handleNumericInputChange('weeksContributed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 800 (mínimo 500)"
                  min="500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Mínimo 500 semanas</strong> según LEY 73 del IMSS
                </p>
                {displayValues.weeksContributed && formData.weeksContributed < 500 && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ Debe ser al menos 500 semanas
                  </p>
                )}
              </div>

              {/* Último salario bruto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Último salario bruto (SDI)
                </label>
                <input
                  type="number"
                  value={displayValues.lastGrossSalary}
                  onChange={(e) => handleNumericInputChange('lastGrossSalary', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 15000.00"
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Salario bruto mensual o SDI (Salario Diario Integrado)
                </p>
                {displayValues.lastGrossSalary && formData.lastGrossSalary <= 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ El salario debe ser mayor a 0
                  </p>
                )}
                {formData.lastGrossSalary > 100000 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    💰 Salario alto - Verifica que sea correcto
                  </p>
                )}
              </div>
            </div>

                         {/* Estado civil */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 <Heart className="w-4 h-4 inline mr-2" />
                 Estado civil
               </label>
               <select
                 value={formData.civilStatus}
                 onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 required
               >
                 <option value="soltero">Soltero</option>
                 <option value="casado">Casado</option>
                 
               </select>
             </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Guardando...' : (familyMember ? 'Actualizar' : 'Agregar')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
