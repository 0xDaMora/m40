'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  amount: number
  planType: string
  strategyCode?: string
}

export default function PagoExitosoPage() {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(5)
  const [hasRedirected, setHasRedirected] = useState(false)
  
  useEffect(() => {
    // Verificar si ya se redirigió para evitar redirección infinita
    const redirected = sessionStorage.getItem('pago-exitoso-redirected')
    if (redirected) {
      setHasRedirected(true)
      setLoading(false)
      
      // Si el usuario regresa a esta página, redirigir al inicio
      const handlePopState = () => {
        router.push('/')
      }
      
      window.addEventListener('popstate', handlePopState)
      
      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }
    
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search)
    const paymentId = urlParams.get('payment_id')
    const externalRef = urlParams.get('external_reference')
    
    if (externalRef) {
      // Buscar orden por external_reference
      fetchOrderByExternalRef(externalRef)
    } else if (paymentId) {
      // Buscar orden por payment_id
      fetchOrderByPaymentId(paymentId)
    } else {
      setLoading(false)
    }
  }, [router])
  
  const fetchOrderByExternalRef = async (externalRef: string) => {
    try {
      const response = await fetch(`/api/orders/external/${externalRef}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchOrderByPaymentId = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/orders/payment/${paymentId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Redirección automática si hay estrategia (solo una vez)
  useEffect(() => {
    if (order?.status === 'paid' && order.strategyCode && !hasRedirected) {
      // Marcar que se va a redirigir
      sessionStorage.setItem('pago-exitoso-redirected', 'true')
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Detectar si es estrategia yam40 y redirigir a la ruta correcta
            const route = order.strategyCode.startsWith('yam40_') 
              ? `/yam40-estrategia/${order.strategyCode}`
              : `/estrategia/${order.strategyCode}`
            router.push(route)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [order, router, hasRedirected])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700">Verificando pago...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-green-800 mb-4">
          ¡Pago Confirmado!
        </h1>
        
        <p className="text-green-700 mb-6">
          Tu {order?.planType === 'premium' ? 'Plan Premium' : 'estrategia'} está siendo procesada...
        </p>
        
        {order && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="font-medium">Orden:</span> #{order.orderNumber}
              </p>
              <p>
                <span className="font-medium">Monto:</span> ${order.amount} MXN
              </p>
              <p>
                <span className="font-medium">Plan:</span> {
                  order.planType === 'premium' ? 'Premium' : 'Básico'
                }
              </p>
            </div>
          </div>
        )}
        
        {order?.strategyCode && (
          <div className="mb-6">
            <p className="text-sm text-green-600 mb-2">
              Redirigiendo a tu estrategia en {countdown} segundos...
            </p>
            <button
              onClick={() => router.push(`/estrategia/${order.strategyCode}`)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ver Mi Estrategia
            </button>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => {
              sessionStorage.removeItem('pago-exitoso-redirected')
              router.push('/')
            }}
            className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Ir al Inicio
          </button>
          
          {order?.planType === 'premium' && (
            <button
              onClick={() => {
                sessionStorage.removeItem('pago-exitoso-redirected')
                router.push('/mis-estrategias')
              }}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Mis Estrategias
            </button>
          )}
          
          {hasRedirected && (
            <button
              onClick={() => {
                sessionStorage.removeItem('pago-exitoso-redirected')
                window.location.reload()
              }}
              className="w-full bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Ver Detalles del Pago
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
