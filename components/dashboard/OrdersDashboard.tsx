"use client"

import { useState, useEffect, useRef } from "react"
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  User, 
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
  Eye,
  ExternalLink,
  AlertTriangle,
  Timer
} from "lucide-react"
import { toast } from "react-hot-toast"

interface Order {
  id: string
  orderNumber: string
  status: string
  planType: string
  amount: number
  currency: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  expiresAt: string
  strategyData?: any
  userData?: any
  strategyCode?: string
}

interface OrdersDashboardProps {
  onOrderClick?: (order: Order) => void
}

// Componente de temporizador
interface TimerProps {
  expiresAt: string
  onExpired?: () => void
}

function OrderTimer({ expiresAt, onExpired }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const onExpiredRef = useRef(onExpired)

  // Actualizar ref cuando cambia onExpired
  useEffect(() => {
    onExpiredRef.current = onExpired
  }, [onExpired])

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft('Expirado')
        onExpiredRef.current?.()
        return
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const isUrgent = () => {
    const now = new Date().getTime()
    const expiry = new Date(expiresAt).getTime()
    const difference = expiry - now
    return difference <= 30 * 60 * 1000 // 30 minutos
  }

  if (isExpired) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-medium">Expirado</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${isUrgent() ? 'text-orange-600' : 'text-blue-600'}`}>
      <Timer className="w-4 h-4" />
      <span className="text-sm font-medium">{timeLeft}</span>
    </div>
  )
}

export function OrdersDashboard({ onOrderClick }: OrdersDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [completingPayment, setCompletingPayment] = useState<string | null>(null)
  const [showAllOrders, setShowAllOrders] = useState(false)

  // Cargar órdenes del usuario
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch('/api/orders', {
          credentials: 'include',
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          setOrders(data.orders || [])
        } else {
          console.error('Error loading orders:', response.statusText)
        }
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  // Completar pago pendiente
  const handleCompletePayment = async (order: Order) => {
    setCompletingPayment(order.id)
    
    try {
      // Crear nueva preferencia para la orden pendiente
      const response = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          amount: order.amount,
          strategyData: order.strategyData,
          userData: order.userData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la preferencia')
      }

      const { init_point } = await response.json()
      
      if (init_point) {
        toast.success('Redirigiendo a MercadoPago...')
        window.location.href = init_point
      }
    } catch (error) {
      console.error('Error completing payment:', error)
      toast.error('Error al completar el pago')
    } finally {
      setCompletingPayment(null)
    }
  }

  // Procesar orden pendiente manualmente (para desarrollo)
  const handleProcessOrder = async (order: Order) => {
    setCompletingPayment(order.id)
    
    try {
      const response = await fetch(`/api/orders/${order.id}/process`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al procesar la orden')
      }

      const result = await response.json()
      toast.success('Orden procesada exitosamente')
      
      // Recargar órdenes sin recargar toda la página
      const loadOrders = async () => {
        try {
          const response = await fetch('/api/orders', {
            credentials: 'include',
            cache: 'no-store'
          })
          
          if (response.ok) {
            const data = await response.json()
            setOrders(data.orders || [])
          }
        } catch (error) {
          console.error('Error reloading orders:', error)
        }
      }
      loadOrders()
      
    } catch (error) {
      console.error('Error processing order:', error)
      toast.error('Error al procesar la orden')
    } finally {
      setCompletingPayment(null)
    }
  }

  // Ver estrategia guardada
  const handleViewStrategy = (order: Order) => {
    if (order.strategyCode) {
      // Navegar a la página de estrategia
      window.open(`/estrategia/${order.strategyCode}`, '_blank')
    } else {
      toast.error('Estrategia no disponible aún')
    }
  }


  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  // Obtener estado de la orden con icono y color
  const getOrderStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'paid':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Aprobado',
          color: 'text-green-600 bg-green-100',
          bgColor: 'bg-green-50 border-green-200'
        }
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          text: 'Pendiente',
          color: 'text-yellow-600 bg-yellow-100',
          bgColor: 'bg-yellow-50 border-yellow-200'
        }
      case 'rejected':
        return {
          icon: <XCircle className="w-4 h-4" />,
          text: 'Rechazado',
          color: 'text-red-600 bg-red-100',
          bgColor: 'bg-red-50 border-red-200'
        }
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          text: status,
          color: 'text-gray-600 bg-gray-100',
          bgColor: 'bg-gray-50 border-gray-200'
        }
    }
  }

  // Obtener información del plan
  const getPlanInfo = (planType: string, strategyData?: any) => {
    const isYam40 = strategyData?.tipo === 'yam40' || strategyData?.strategyCode?.startsWith('yam40_')
    
    switch (planType.toLowerCase()) {
      case 'basic':
        return {
          name: 'Estrategia Básica',
          description: 'Estrategia personalizada'
        }
      case 'premium':
        if (isYam40) {
          return {
            name: 'Premium + Estrategia YaM40',
            description: 'Plan Premium de por vida + Estrategia detallada YaM40'
          }
        }
        return {
          name: 'Plan Premium',
          description: 'Acceso completo de por vida'
        }
      default:
        return {
          name: planType,
          description: 'Plan personalizado'
        }
    }
  }

  // Obtener información del familiar
  const getFamilyMemberInfo = (userData: any) => {
    if (!userData?.familyMemberName) return null
    
    return {
      name: userData.familyMemberName,
      age: userData.edad || 'N/A',
      weeks: userData.semanasPrevias || 'N/A'
    }
  }

  // Obtener información de la estrategia
  const getStrategyInfo = (strategyData: any) => {
    if (!strategyData) return null
    
    return {
      type: strategyData.estrategia || 'N/A',
      uma: strategyData.umaElegida || 'N/A',
      months: strategyData.mesesM40 || 'N/A'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Órdenes
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-lg p-4 h-24"></div>
          ))}
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Órdenes
          </h3>
        </div>
        <div className="text-center py-8">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tienes órdenes aún</p>
          <p className="text-sm text-gray-400 mt-1">
            Tus compras aparecerán aquí
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Historial de Órdenes
            </h3>
            <p className="text-sm text-gray-500">
              Gestiona tus compras y pagos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {orders.length} orden{orders.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {(showAllOrders ? orders : orders.slice(0, 4)).map((order, index) => {
          const status = getOrderStatus(order.status)
          const planInfo = getPlanInfo(order.planType, order.strategyData)
          const familyInfo = getFamilyMemberInfo(order.userData)
          const strategyInfo = getStrategyInfo(order.strategyData)
          const isPending = order.status.toLowerCase() === 'pending'
          const isApproved = order.status.toLowerCase() === 'approved' || order.status.toLowerCase() === 'paid'
          

          return (
            <div
              key={order.id}
              className={`bg-white rounded-xl border ${status.bgColor} hover:shadow-lg transition-all duration-200 cursor-pointer group`}
              onClick={() => onOrderClick?.(order)}
            >
              <div className="p-5">
                {/* Header de la orden */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${status.color} group-hover:scale-110 transition-transform`}>
                      {status.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-lg">
                          {order.orderNumber}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </p>
                      {/* Temporizador para órdenes pendientes */}
                      {isPending && (
                        <div className="mt-2">
                          <OrderTimer 
                            expiresAt={order.expiresAt} 
                            onExpired={() => {
                              // Recargar órdenes sin recargar toda la página
                              const loadOrders = async () => {
                                try {
                                  const response = await fetch('/api/orders', {
                                    credentials: 'include',
                                    cache: 'no-store'
                                  })
                                  
                                  if (response.ok) {
                                    const data = await response.json()
                                    setOrders(data.orders || [])
                                  }
                                } catch (error) {
                                  console.error('Error reloading orders:', error)
                                }
                              }
                              loadOrders()
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-xl">
                      {formatCurrency(order.amount)}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      {planInfo.name}
                    </p>
                  </div>
                </div>

                {/* Información del plan y estrategia */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{planInfo.name}</p>
                          <p className="text-sm text-gray-600">{planInfo.description}</p>
                        </div>
                      </div>
                      
                      {strategyInfo && (
                        <div className="ml-10 space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">Tipo:</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {strategyInfo.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">UMA:</span>
                            <span className="font-semibold text-gray-900">{strategyInfo.uma}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">Duración:</span>
                            <span className="font-semibold text-gray-900">{strategyInfo.months} meses</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {familyInfo && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{familyInfo.name}</p>
                            <p className="text-sm text-gray-600">Familiar registrado</p>
                          </div>
                        </div>
                        <div className="ml-10 space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">Edad:</span>
                            <span className="font-semibold text-gray-900">{familyInfo.age} años</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-gray-700">Semanas:</span>
                            <span className="font-semibold text-gray-900">{familyInfo.weeks}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        {isPending && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCompletePayment(order)
                            }}
                            disabled={completingPayment === order.id}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-sm hover:shadow-md"
                          >
                            {completingPayment === order.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                Completar Pago
                              </>
                            )}
                          </button>
                        )}
                  
                  {isApproved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewStrategy(order)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Estrategia
                    </button>
                  )}
                  
                  {order.status.toLowerCase() === 'rejected' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCompletePayment(order)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md"
                    >
                      <CreditCard className="w-4 h-4" />
                      Reintentar Pago
                    </button>
                  )}
                </div>

                {/* Información adicional para órdenes aprobadas */}
                {isApproved && order.strategyCode && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Estrategia guardada exitosamente
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1 ml-6">
                      Código: {order.strategyCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Botón para expandir/contraer */}
      {orders.length > 4 && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowAllOrders(!showAllOrders)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            {showAllOrders ? (
              <>
                <span>Ver menos</span>
                <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : (
              <>
                <span>Ver todas ({orders.length - 4} más)</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
