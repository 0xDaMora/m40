import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { FamilyMember } from "@/types/family"
import { useLocalFamily } from "@/hooks/useLocalFamily"

export function useFamilyManagement() {
  const { data: session } = useSession()
  const { familyMembers: localFamilyMembers, addFamilyMember: addLocalFamilyMember } = useLocalFamily()
  
  // Estados
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null)
  const [showFamilyForm, setShowFamilyForm] = useState(false)

  // Cargar familiares
  const loadFamilyMembers = async () => {
    if (session) {
      // Usuario logueado - cargar desde la base de datos
      try {
        const response = await fetch('/api/family')
        if (response.ok) {
          const data = await response.json()
          setFamilyMembers(data)
        }
      } catch (error) {
        toast.error('Error al cargar familiares')
      }
    } else {
      // Usuario no logueado - usar familiares locales
      setFamilyMembers([])
    }
  }

  // Seleccionar familiar
  const selectFamilyMember = (member: FamilyMember) => {
    setSelectedFamilyMember(member)
  }

  // Abrir formulario de familiar
  const openFamilyForm = () => {
    setShowFamilyForm(true)
  }

  // Cerrar formulario de familiar
  const closeFamilyForm = () => {
    setShowFamilyForm(false)
  }

  // Manejar éxito del formulario
  const handleFamilyFormSuccess = () => {
    loadFamilyMembers()
    setShowFamilyForm(false)
  }

  // Resetear selección
  const resetSelection = () => {
    setSelectedFamilyMember(null)
  }

  // Cargar familiares cuando cambie la sesión
  useEffect(() => {
    loadFamilyMembers()
  }, [session])

  return {
    // Estados
    familyMembers,
    selectedFamilyMember,
    showFamilyForm,
    
    // Acciones
    loadFamilyMembers,
    selectFamilyMember,
    openFamilyForm,
    closeFamilyForm,
    handleFamilyFormSuccess,
    resetSelection,
    setSelectedFamilyMember, // Para casos especiales donde se necesite setear directamente
    
    // Estados auxiliares
    localFamilyMembers,
    addLocalFamilyMember
  }
}

