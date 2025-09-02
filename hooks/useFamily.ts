/**
 * Hook personalizado para manejo de familiares
 */

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { useLocalFamily } from './useLocalFamily'
import { FamilyMember } from '@/types/family'

export const useFamily = () => {
  const { data: session } = useSession()
  const { familyMembers: localFamilyMembers, addFamilyMember: addLocalFamilyMember } = useLocalFamily()
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar familiares
  const loadFamilyMembers = useCallback(async () => {
    if (session) {
      // Usuario logueado - cargar desde la base de datos
      setLoading(true)
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
          // Reintento simple
          await new Promise(r => setTimeout(r, 700))
          const again = await fetchOnce()
          const data = again.ok ? await again.json() : []
          setFamilyMembers(Array.isArray(data) ? data : [])
        } else {
          toast.error('Error al cargar familiares')
        }
      } catch (error) {
        console.error('Error al cargar familiares:', error)
        toast.error('Error al cargar familiares')
      } finally {
        setLoading(false)
      }
    } else {
      // Usuario no logueado - usar familiares locales
      setFamilyMembers([])
    }
  }, [session])

  // Agregar familiar
  const addFamilyMember = useCallback(async (member: Omit<FamilyMember, 'id'>) => {
    if (session) {
      // Usuario logueado - guardar en base de datos
      setLoading(true)
      try {
        const response = await fetch('/api/family', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(member)
        })

        if (response.ok) {
          const newMember = await response.json()
          setFamilyMembers(prev => [...prev, newMember])
          toast.success('Familiar agregado exitosamente')
          return newMember
        } else {
          const error = await response.json()
          toast.error(error.message || 'Error al agregar familiar')
          return null
        }
      } catch (error) {
        console.error('Error al agregar familiar:', error)
        toast.error('Error al agregar familiar')
        return null
      } finally {
        setLoading(false)
      }
    } else {
      // Usuario no logueado - guardar localmente
      const newMember = { ...member, id: Date.now().toString() }
      addLocalFamilyMember(newMember)
      setFamilyMembers(prev => [...prev, newMember])
      toast.success('Familiar agregado exitosamente')
      return newMember
    }
  }, [session, addLocalFamilyMember])

  // Actualizar familiar
  const updateFamilyMember = useCallback(async (id: string, updates: Partial<FamilyMember>) => {
    if (session) {
      // Usuario logueado - actualizar en base de datos
      setLoading(true)
      try {
        const response = await fetch(`/api/family/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        })

        if (response.ok) {
          const updatedMember = await response.json()
          setFamilyMembers(prev => prev.map(member => 
            member.id === id ? updatedMember : member
          ))
          toast.success('Familiar actualizado exitosamente')
          return updatedMember
        } else {
          const error = await response.json()
          toast.error(error.message || 'Error al actualizar familiar')
          return null
        }
      } catch (error) {
        console.error('Error al actualizar familiar:', error)
        toast.error('Error al actualizar familiar')
        return null
      } finally {
        setLoading(false)
      }
    } else {
      // Usuario no logueado - actualizar localmente
      setFamilyMembers(prev => prev.map(member => 
        member.id === id ? { ...member, ...updates } : member
      ))
      toast.success('Familiar actualizado exitosamente')
      return { ...familyMembers.find(m => m.id === id)!, ...updates }
    }
  }, [session, familyMembers])

  // Eliminar familiar
  const deleteFamilyMember = useCallback(async (id: string) => {
    if (session) {
      // Usuario logueado - eliminar de base de datos
      setLoading(true)
      try {
        const response = await fetch(`/api/family/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setFamilyMembers(prev => prev.filter(member => member.id !== id))
          toast.success('Familiar eliminado exitosamente')
          return true
        } else {
          const error = await response.json()
          toast.error(error.message || 'Error al eliminar familiar')
          return false
        }
      } catch (error) {
        console.error('Error al eliminar familiar:', error)
        toast.error('Error al eliminar familiar')
        return false
      } finally {
        setLoading(false)
      }
    } else {
      // Usuario no logueado - eliminar localmente
      setFamilyMembers(prev => prev.filter(member => member.id !== id))
      toast.success('Familiar eliminado exitosamente')
      return true
    }
  }, [session])

  // Cargar familiares al inicializar
  useEffect(() => {
    loadFamilyMembers()
  }, [loadFamilyMembers])

  return {
    familyMembers,
    loading,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    loadFamilyMembers
  }
}
