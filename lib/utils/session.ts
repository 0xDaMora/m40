import { getSession } from 'next-auth/react'

/**
 * Actualiza la sesión del usuario y espera a que se complete
 */
export async function refreshSession() {
  try {
    // En NextAuth v4, simplemente obtenemos la sesión actualizada
    // La sesión se actualiza automáticamente después de login/registro
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Verificar que la sesión se actualizó correctamente
    const session = await getSession()
    console.log('Sesión actualizada:', session?.user?.subscription)
    return session
  } catch (error) {
    console.error('Error actualizando sesión:', error)
    throw error
  }
}

/**
 * Actualiza la sesión y recarga la página si es necesario
 */
export async function refreshSessionAndReload() {
  try {
    await refreshSession()
    
    // Recargar la página después de un breve delay
    setTimeout(() => {
      window.location.reload()
    }, 500)
  } catch (error) {
    console.error('Error en refreshSessionAndReload:', error)
    // Fallback: recargar la página directamente
    window.location.reload()
  }
}

/**
 * Actualiza la sesión con múltiples intentos
 */
export async function refreshSessionWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const session = await refreshSession()
      if (session?.user?.subscription) {
        console.log(`Sesión actualizada exitosamente en intento ${i + 1}`)
        return session
      }
      
      // Si no hay subscription, esperar un poco más y reintentar
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      console.error(`Error en intento ${i + 1}:`, error)
      if (i === maxRetries - 1) throw error
    }
  }
  
  throw new Error('No se pudo actualizar la sesión después de múltiples intentos')
}
