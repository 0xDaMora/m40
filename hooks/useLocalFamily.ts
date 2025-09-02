import { useState, useEffect } from 'react'
import { FamilyMemberData } from '@/types/strategy'

const LOCAL_FAMILY_KEY = 'm40_local_family_members'

export function useLocalFamily() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberData[]>([])

  // Cargar familiares del localStorage al inicializar
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_FAMILY_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convertir las fechas de string a Date
        const withDates = parsed.map((member: any) => ({
          ...member,
          birthDate: new Date(member.birthDate)
        }))
        setFamilyMembers(withDates)
      } catch (error) {
        console.error('Error al cargar familiares locales:', error)
      }
    }
  }, [])

  // Guardar familiares en localStorage
  const saveFamilyMembers = (members: FamilyMemberData[]) => {
    setFamilyMembers(members)
    localStorage.setItem(LOCAL_FAMILY_KEY, JSON.stringify(members))
  }

  // Agregar familiar
  const addFamilyMember = (member: FamilyMemberData) => {
    const newMembers = [...familyMembers, { ...member, id: Date.now().toString() }]
    saveFamilyMembers(newMembers)
  }

  // Actualizar familiar
  const updateFamilyMember = (id: string, updates: Partial<FamilyMemberData>) => {
    const newMembers = familyMembers.map(member => 
      member.id === id ? { ...member, ...updates } : member
    )
    saveFamilyMembers(newMembers)
  }

  // Eliminar familiar
  const deleteFamilyMember = (id: string) => {
    const newMembers = familyMembers.filter(member => member.id !== id)
    saveFamilyMembers(newMembers)
  }

  // Obtener familiar por ID
  const getFamilyMember = (id: string) => {
    return familyMembers.find(member => member.id === id)
  }

  return {
    familyMembers,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    getFamilyMember,
    saveFamilyMembers
  }
}
