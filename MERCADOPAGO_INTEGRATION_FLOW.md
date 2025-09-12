# 🚀 Flujo de Integración MercadoPago - Modalidad 40

## 📋 Resumen Ejecutivo

Este documento describe el flujo completo de integración de MercadoPago para la aplicación Modalidad 40, incluyendo la gestión de órdenes, pagos y estrategias.

## 🎯 Objetivo

Implementar un sistema robusto de pagos que permita:
- Crear órdenes antes del pago
- Procesar pagos a través de MercadoPago
- Confirmar pagos via webhooks
- Gestionar estados de órdenes en tiempo real
- Proporcionar transparencia total al usuario

## 🏗️ Arquitectura del Sistema

### Componentes Principales:
1. **Frontend** - Dashboard y flujo de compra
2. **Backend API** - Gestión de órdenes y webhooks
3. **Base de Datos** - Órdenes y estrategias
4. **MercadoPago** - Pasarela de pagos
5. **Webhooks** - Confirmación de pagos

## 📊 Estructura de Base de Datos

### Tabla: `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  order_number VARCHAR UNIQUE, -- ORD-2024-001
  status VARCHAR NOT NULL, -- pending, paid, failed, cancelled, expired
  plan_type VARCHAR NOT NULL, -- basic, premium
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'MXN',
  
  -- Datos de MercadoPago
  mercadopago_id VARCHAR,
  external_reference VARCHAR,
  payment_method VARCHAR,
  
  -- Datos de la estrategia (si aplica)
  strategy_data JSONB,
  strategy_code VARCHAR,
  user_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  expires_at TIMESTAMP, -- 24 horas después de creación
  
  -- Metadatos
  metadata JSONB
);
```

### Tabla: `order_items`
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  item_type VARCHAR NOT NULL, -- strategy, premium
  item_id VARCHAR, -- ID de la estrategia o 'premium'
  item_name VARCHAR NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Flujo Completo de Pago

### 1. Usuario Inicia Compra
```javascript
// Frontend: Usuario hace clic en "Comprar"
const handlePurchase = async (estrategia) => {
  try {
    // 1. Crear orden en DB
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planType: 'basic',
        strategyData: estrategia,
        userData: datosUsuario,
        amount: 50
      })
    })
    
    const { order } = await orderResponse.json()
    
    // 2. Crear preferencia de MercadoPago
    const preferenceResponse = await fetch('/api/mercadopago/preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        amount: 50,
        strategyData: estrategia,
        userData: datosUsuario
      })
    })
    
    const { preference } = await preferenceResponse.json()
    
    // 3. Redireccionar a MercadoPago
    window.location.href = preference.init_point
    
  } catch (error) {
    console.error('Error en compra:', error)
    toast.error('Error al procesar la compra')
  }
}
```

### 2. Crear Orden (API)
```javascript
// API: /api/orders
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { planType, strategyData, userData, amount } = await req.json()
    
    // Validar datos
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount inválido' }, { status: 400 })
    }
    
    // Generar número de orden único
    const orderNumber = await generateOrderNumber()
    
    // Crear orden
    const order = await prisma.order.create({
      data: {
        user_id: session.user.id,
        order_number: orderNumber,
        status: 'pending',
        plan_type: planType,
        amount: amount,
        strategy_data: strategyData,
        user_data: userData,
        external_reference: `order_${orderNumber}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    })
    
    // Log
    console.log(`[ORDER_CREATED] Order ID: ${order.id}, Number: ${orderNumber}`)
    
    return NextResponse.json({ order })
    
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

### 3. Crear Preferencia MercadoPago
```javascript
// API: /api/mercadopago/preference
export async function POST(req: Request) {
  try {
    const { orderId, amount, strategyData, userData } = await req.json()
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }
    
    // Configurar preferencia
    const preference = {
      items: [{
        title: order.plan_type === 'premium' ? 'Plan Premium Modalidad 40' : 'Estrategia Modalidad 40',
        quantity: 1,
        unit_price: amount
      }],
      external_reference: order.external_reference,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/pago-exitoso`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/pago-pendiente`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pago-error`
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`
    }
    
    // Crear preferencia en MercadoPago
    const response = await mercadopago.preferences.create(preference)
    
    return NextResponse.json({ 
      preference: response.body,
      init_point: response.body.init_point 
    })
    
  } catch (error) {
    console.error('Error creating preference:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

### 4. Webhook de MercadoPago
```javascript
// API: /api/webhooks/mercadopago
export async function POST(req: Request) {
  try {
    // 1. Validar webhook
    const signature = req.headers.get('x-signature')
    const payload = await req.text()
    
    if (!validateWebhookSignature(signature, payload)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    const data = JSON.parse(payload)
    
    if (data.type === 'payment') {
      // 2. Verificar idempotencia
      const existingPayment = await prisma.payment.findUnique({
        where: { mercadopago_id: data.data.id }
      })
      
      if (existingPayment) {
        return NextResponse.json({ message: 'Already processed' })
      }
      
      // 3. Obtener detalles del pago
      const payment = await mercadopago.payments.findById(data.data.id)
      
      // 4. Buscar orden
      const order = await prisma.order.findFirst({
        where: { external_reference: payment.external_reference }
      })
      
      if (!order) {
        console.error(`Order not found for external_reference: ${payment.external_reference}`)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }
      
      // 5. Procesar según estado del pago
      await prisma.$transaction(async (tx) => {
        if (payment.status === 'approved') {
          await processApprovedPayment(tx, order, payment)
        } else if (payment.status === 'rejected') {
          await processRejectedPayment(tx, order, payment)
        }
      })
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 5. Procesar Pago Aprobado
```javascript
const processApprovedPayment = async (tx, order, payment) => {
  // 1. Actualizar orden
  await tx.order.update({
    where: { id: order.id },
    data: {
      status: 'paid',
      mercadopago_id: payment.id,
      payment_method: payment.payment_method_id,
      paid_at: new Date()
    }
  })
  
  // 2. Crear estrategia guardada (si es plan básico)
  if (order.plan_type === 'basic') {
    const strategyCode = generateStrategyCode(order.strategy_data, order.user_data)
    
    await tx.estrategiaGuardada.create({
      data: {
        userId: order.user_id,
        debugCode: strategyCode,
        datosEstrategia: order.strategy_data,
        datosUsuario: order.user_data,
        activa: true
      }
    })
    
    // 3. Actualizar orden con código de estrategia
    await tx.order.update({
      where: { id: order.id },
      data: { strategy_code: strategyCode }
    })
  }
  
  // 4. Actualizar usuario a premium (si es plan premium)
  if (order.plan_type === 'premium') {
    await tx.user.update({
      where: { id: order.user_id },
      data: { subscription: 'premium' }
    })
  }
  
  // 5. Enviar notificaciones
  await sendPaymentConfirmationEmail(order.user_id, order)
  await broadcastPaymentUpdate(order.user_id, order)
  
  console.log(`[PAYMENT_APPROVED] Order: ${order.id}, Payment: ${payment.id}`)
}
```

### 6. Procesar Pago Rechazado
```javascript
const processRejectedPayment = async (tx, order, payment) => {
  await tx.order.update({
    where: { id: order.id },
    data: {
      status: 'failed',
      mercadopago_id: payment.id,
      payment_method: payment.payment_method_id
    }
  })
  
  await sendPaymentFailureEmail(order.user_id, order)
  
  console.log(`[PAYMENT_REJECTED] Order: ${order.id}, Payment: ${payment.id}`)
}
```

## 🎨 Frontend - Dashboard de Órdenes

### Componente de Órdenes
```jsx
// components/dashboard/OrdersList.tsx
export function OrdersList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await fetch('/api/orders')
        const data = await response.json()
        setOrders(data.orders)
      } catch (error) {
        console.error('Error loading orders:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadOrders()
    
    // Polling para órdenes pendientes
    const interval = setInterval(() => {
      const hasPendingOrders = orders.some(order => order.status === 'pending')
      if (hasPendingOrders) {
        loadOrders()
      }
    }, 30000) // Cada 30 segundos
    
    return () => clearInterval(interval)
  }, [orders])
  
  if (loading) {
    return <div className="animate-pulse">Cargando órdenes...</div>
  }
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Mis Órdenes</h3>
        <button 
          onClick={() => router.push('/mis-ordenes')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Ver todas →
        </button>
      </div>
      
      <div className="space-y-4">
        {orders.slice(0, 3).map(order => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}
```

### Tarjeta de Orden
```jsx
function OrderCard({ order }) {
  const getStatusConfig = (status) => {
    switch(status) {
      case 'paid':
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          text: 'Pagado',
          message: 'Tu estrategia está lista'
        }
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          text: 'Pendiente',
          message: 'Procesando pago...'
        }
      case 'failed':
        return {
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
          text: 'Fallido',
          message: 'Pago no procesado'
        }
      case 'expired':
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          text: 'Expirado',
          message: 'Tiempo agotado'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: HelpCircle,
          text: 'Desconocido',
          message: 'Estado no definido'
        }
    }
  }
  
  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">
            #{order.order_number}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3 inline mr-1" />
            {statusConfig.text}
          </span>
        </div>
        <span className="font-semibold text-gray-900">
          ${order.amount} MXN
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        {order.plan_type === 'premium' ? 'Plan Premium' : 'Estrategia Básica'}
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        {statusConfig.message}
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(order.created_at)}</span>
        <div className="flex gap-2">
          {order.status === 'paid' && order.strategy_code && (
            <button 
              onClick={() => window.open(`/estrategia/${order.strategy_code}`, '_blank')}
              className="text-blue-600 hover:text-blue-700"
            >
              Ver Estrategia
            </button>
          )}
          {order.status === 'failed' && (
            <button 
              onClick={() => retryPayment(order.id)}
              className="text-green-600 hover:text-green-700"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

## 🔧 Funciones de Utilidad

### Generar Número de Orden
```javascript
const generateOrderNumber = async () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  
  // Contar órdenes del día
  const count = await prisma.order.count({
    where: {
      created_at: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    }
  })
  
  const sequence = String(count + 1).padStart(3, '0')
  return `ORD-${year}${month}-${sequence}`
}
```

### Validar Webhook
```javascript
const validateWebhookSignature = (signature, payload) => {
  // Implementar validación de firma de MercadoPago
  // Esto depende de la configuración específica de tu cuenta
  return true // Placeholder
}
```

### Enviar Emails
```javascript
const sendPaymentConfirmationEmail = async (userId, order) => {
  // Implementar envío de email
  console.log(`Sending confirmation email to user ${userId} for order ${order.id}`)
}

const sendPaymentFailureEmail = async (userId, order) => {
  // Implementar envío de email de fallo
  console.log(`Sending failure email to user ${userId} for order ${order.id}`)
}
```

### Broadcast de Actualizaciones
```javascript
const broadcastPaymentUpdate = async (userId, order) => {
  // Implementar WebSocket o Server-Sent Events
  console.log(`Broadcasting payment update to user ${userId}`)
}
```

## 📱 Páginas de Redirección

### Pago Exitoso
```jsx
// app/pago-exitoso/page.tsx
export default function PagoExitosoPage() {
  const router = useRouter()
  const [order, setOrder] = useState(null)
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentId = urlParams.get('payment_id')
    
    if (paymentId) {
      // Buscar orden por payment_id
      fetchOrderByPaymentId(paymentId).then(setOrder)
    }
  }, [])
  
  if (order?.status === 'paid' && order.strategy_code) {
    // Redirección automática a estrategia
    useEffect(() => {
      setTimeout(() => {
        router.push(`/estrategia/${order.strategy_code}`)
      }, 3000)
    }, [order])
  }
  
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-green-800 mb-2">
          ¡Pago Confirmado!
        </h1>
        <p className="text-green-700 mb-4">
          Tu estrategia está siendo procesada...
        </p>
        {order?.strategy_code && (
          <p className="text-sm text-green-600">
            Redirigiendo a tu estrategia en 3 segundos...
          </p>
        )}
      </div>
    </div>
  )
}
```

### Pago Pendiente
```jsx
// app/pago-pendiente/page.tsx
export default function PagoPendientePage() {
  const router = useRouter()
  const [order, setOrder] = useState(null)
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentId = urlParams.get('payment_id')
    
    if (paymentId) {
      fetchOrderByPaymentId(paymentId).then(setOrder)
    }
  }, [])
  
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-yellow-800 mb-2">
          Pago Pendiente
        </h1>
        <p className="text-yellow-700 mb-4">
          Tu pago está siendo procesado. Te notificaremos cuando se confirme.
        </p>
        <div className="bg-white p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-600">
            Número de orden: <strong>#{order?.order_number}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Monto: <strong>${order?.amount} MXN</strong>
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
        >
          Ir al Dashboard
        </button>
      </div>
    </div>
  )
}
```

### Pago Error
```jsx
// app/pago-error/page.tsx
export default function PagoErrorPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-red-800 mb-2">
          Pago Fallido
        </h1>
        <p className="text-red-700 mb-4">
          No se pudo procesar tu pago. Por favor, intenta nuevamente.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            Ir al Dashboard
          </button>
          <button
            onClick={() => router.push('/simulador')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Intentar Nuevamente
          </button>
        </div>
      </div>
    </div>
  )
}
```

## 🔒 Seguridad y Validaciones

### Validaciones de Entrada
```javascript
const validateOrderData = (data) => {
  const errors = []
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount debe ser mayor a 0')
  }
  
  if (!data.planType || !['basic', 'premium'].includes(data.planType)) {
    errors.push('Plan type inválido')
  }
  
  if (data.planType === 'basic' && !data.strategyData) {
    errors.push('Strategy data es requerido para plan básico')
  }
  
  return errors
}
```

### Rate Limiting
```javascript
import rateLimit from 'express-rate-limit'

const orderRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 órdenes por IP cada 15 minutos
  message: 'Demasiadas órdenes, intenta más tarde'
})

// Aplicar a endpoint de creación de órdenes
app.post('/api/orders', orderRateLimit, createOrder)
```

### Logging y Monitoreo
```javascript
const logPaymentEvent = (event, data) => {
  console.log(`[PAYMENT_EVENT] ${event}:`, {
    timestamp: new Date().toISOString(),
    orderId: data.orderId,
    paymentId: data.paymentId,
    status: data.status,
    userId: data.userId
  })
  
  // Enviar a servicio de logging (ej: Sentry, LogRocket)
  // logService.captureMessage(event, { extra: data })
}
```

## 🚀 Implementación por Fases

### Fase 1: Flujo Básico (Semana 1-2)
- [ ] Crear tablas de base de datos
- [ ] API de creación de órdenes
- [ ] API de preferencias MercadoPago
- [ ] Webhook básico
- [ ] Páginas de redirección

### Fase 2: Validaciones y Seguridad (Semana 3)
- [ ] Validación de webhooks
- [ ] Rate limiting
- [ ] Validaciones de entrada
- [ ] Logging detallado

### Fase 3: UX Mejorada (Semana 4)
- [ ] Dashboard de órdenes
- [ ] Notificaciones en tiempo real
- [ ] Emails de confirmación
- [ ] WebSocket para updates

### Fase 4: Monitoreo y Optimización (Semana 5)
- [ ] Métricas de conversión
- [ ] Alertas de errores
- [ ] Optimización de performance
- [ ] Testing completo

## 📊 Métricas a Monitorear

### Conversión
- Tasa de conversión: Órdenes creadas → Pagos exitosos
- Tiempo promedio de procesamiento
- Tasa de abandono en checkout

### Errores
- Webhooks fallidos
- Órdenes expiradas
- Pagos rechazados

### Performance
- Tiempo de respuesta de APIs
- Tiempo de procesamiento de webhooks
- Disponibilidad del sistema

## 🔧 Configuración de MercadoPago

### Variables de Entorno
```env
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_PUBLIC_KEY=your_public_key
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Configuración de Webhooks
- URL: `https://yourdomain.com/api/webhooks/mercadopago`
- Eventos: `payment`
- Versión: `v1`

## 📝 Notas Importantes

1. **Idempotencia**: Siempre verificar si un pago ya fue procesado
2. **Transacciones**: Usar transacciones de DB para operaciones críticas
3. **Timeouts**: Implementar timeouts para operaciones externas
4. **Retry Logic**: Implementar reintentos para webhooks fallidos
5. **Logging**: Log detallado para debugging
6. **Testing**: Probar todos los flujos con sandbox de MercadoPago

## 🆘 Troubleshooting

### Problemas Comunes
1. **Webhook no llega**: Verificar URL y configuración
2. **Pago duplicado**: Implementar idempotencia
3. **Orden no encontrada**: Verificar external_reference
4. **Estrategia no creada**: Verificar transacciones de DB

### Logs a Revisar
- `[ORDER_CREATED]`
- `[PAYMENT_APPROVED]`
- `[PAYMENT_REJECTED]`
- `[WEBHOOK_ERROR]`

---

**Fecha de creación**: $(date)
**Versión**: 1.0
**Autor**: Equipo de Desarrollo Modalidad 40
