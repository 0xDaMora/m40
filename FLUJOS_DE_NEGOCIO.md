# Flujos de Negocio - Modalidad 40

## 📋 Tabla de Contenidos

1. [Flujo Completo: Usuario Nuevo](#flujo-completo-usuario-nuevo)
2. [Flujo Completo: Ya estoy en M40](#flujo-completo-ya-estoy-en-m40)
3. [Flujo de Compra y Pagos](#flujo-de-compra-y-pagos)
4. [Planes de Usuario](#planes-de-usuario)
5. [Journey del Usuario](#journey-del-usuario)

---

## 🎯 Flujo Completo: Usuario Nuevo

### Fase 1: Landing y Captura (HeroOnboard)

**Página**: `/` (Landing)

```
1. Usuario llega al sitio
   ↓
2. Ve HeroOnboard (simulador rápido)
   ↓
3. Hace clic en "Comenzar simulación"
   ↓
4. Completa 5 pasos:
   • Fecha de nacimiento
   • Edad de jubilación deseada (60-65)
   • Semanas cotizadas actuales (min 500)
   • Salario mensual bruto
   • Estado civil
   ↓
5. Sistema calcula automáticamente:
   • Convierte salario bruto → SDI diario
   • Determina fecha óptima de inicio M40
   • Genera top 5 estrategias
   ↓
6. Usuario ve resultados:
   • Top 5 estrategias ordenadas por ROI
   • Comparativa de pensiones
   • Inversión vs retorno
   ↓
7. Dos opciones:
   A. Ver más estrategias → Migra a simulador completo
   B. Crear cuenta → Registro
```

**Datos Guardados en localStorage**:
```javascript
{
  quickSimulation: {
    fechaNacimiento: "1970-01-15",
    edadJubilacion: 65,
    semanasCotizadas: 800,
    salarioBruto: 15000,
    sdiHistorico: 492.76,
    estadoCivil: "casado",
    estrategiasCalculadas: [...]
  }
}
```

### Fase 2: Simulador Completo

**Página**: `/simulador`

```
1. Usuario migra desde HeroOnboard
   ↓
2. Datos precargados desde localStorage
   ↓
3. Sistema crea familiar temporal
   ↓
4. Usuario puede:
   • Ajustar filtros:
     - Rango de aportación mensual
     - Meses en M40
     - Fecha de inicio
   • Ver TODAS las estrategias (2000+)
   • Filtrar por tipo (fijo/progresivo)
   • Ordenar por ROI, pensión, inversión
   ↓
5. Acciones sobre estrategia:
   
   A. Ver Detalles (requiere Premium):
      ├─ Si NO es premium → Modal Premium
      └─ Si ES premium → Redirige a /estrategia/[code]
   
   B. Descargar PDF (requiere Premium):
      ├─ Si NO es premium → Modal Premium
      └─ Si ES premium → Descarga PDF
   
   C. Comprar Estrategia ($299):
      ├─ Si NO está autenticado → Modal Login
      ├─ Si está autenticado:
      │   ├─ Crea orden
      │   ├─ Redirige a MercadoPago
      │   └─ Al pagar → Guarda estrategia
      └─ Redirige a /estrategia/[code]
```

### Fase 3: Registro y Autenticación

**Modal de Registro**:
```
1. Usuario hace clic en "Crear cuenta"
   ↓
2. Opciones:
   A. Email/Contraseña
   B. Google OAuth
   ↓
3. POST /api/auth/register
   ↓
4. Usuario creado:
   • subscription: 'free'
   • hasUsedFreeStrategy: false
   ↓
5. Auto-login con NextAuth
   ↓
6. Redirige a /dashboard
```

### Fase 4: Dashboard y Gestión

**Página**: `/dashboard`

```
Dashboard del Usuario
├─ Resumen de cuenta
│  ├─ Plan actual (Free/Premium)
│  ├─ Estrategias guardadas
│  └─ Familiares registrados
│
├─ Familiares
│  ├─ Listar familiares
│  ├─ Agregar familiar
│  ├─ Editar familiar
│  └─ Eliminar familiar
│
├─ Estrategias guardadas
│  ├─ Ver estrategias
│  ├─ Descargar PDF (premium)
│  └─ Compartir link
│
├─ Órdenes
│  ├─ Historial de compras
│  └─ Estado de pagos
│
└─ Acciones rápidas
   ├─ Nueva simulación → /simulador
   ├─ Agregar familiar
   └─ Ver historial
```

### Fase 5: Guardar Estrategia

**Flujo Gratis (1 estrategia)**:
```
1. Usuario selecciona "Guardar estrategia"
   ↓
2. Validaciones:
   • ¿Está autenticado? → Si NO: Modal Login
   • ¿Ya usó estrategia gratis? → Si SÍ: Modal Premium/Compra
   ↓
3. POST /api/guardar-estrategia
   ↓
4. Sistema:
   • Genera código único (debugCode)
   • Guarda en BD (EstrategiaGuardada)
   • Marca hasUsedFreeStrategy = true
   ↓
5. Retorna link compartible:
   • /estrategia/integration_clx456_fijo_15_36_65_032025
   ↓
6. Usuario redirigido a vista detallada
```

### Fase 6: Vista Detallada de Estrategia

**Página**: `/estrategia/[code]`

```
Estrategia Detallada
├─ Tab: Resumen
│  ├─ Pensión desglosada:
│  │  • Base
│  │  • Factor de edad
│  │  • Ley Fox
│  │  • Asignaciones
│  ├─ ISR calculado
│  └─ Pensión neta
│
├─ Tab: Pagos Mensuales
│  ├─ Tabla detallada:
│  │  • Fecha (mes/año)
│  │  • UMA del año
│  │  • SDI mensual
│  │  • Cuota mensual
│  │  • Acumulado
│  └─ Total de inversión
│
├─ Tab: Cronograma
│  ├─ Timeline visual:
│  │  • Inicio M40
│  │  • Fin M40
│  │  • Inicio trámites
│  │  • Fecha de jubilación
│  └─ Hitos importantes
│
├─ Tab: Proyección 20 Años
│  ├─ Gráfica de crecimiento
│  ├─ Incremento 5% anual (febrero)
│  └─ Total acumulado 20 años
│
├─ Tab: Trámites
│  ├─ Guía paso a paso
│  ├─ Formatos oficiales
│  └─ Documentos requeridos
│
└─ Tab: Pensión Viudez
   ├─ Cálculo del 90%
   └─ Condiciones
```

**Acciones en Estrategia**:
```
• Guardar (si no guardada)
• Compartir (Web Share API)
• Descargar PDF (Premium)
• Volver a simulador
```

---

## 🔄 Flujo Completo: Ya estoy en M40

### Fase 1: Entrada al Flujo YAM40

**Página**: `/yam40`

```
1. Usuario que YA paga M40 llega a la página
   ↓
2. Ve explicación del flujo:
   • "Calcula tu pensión ACTUAL"
   • "Conoce cuánto recibirás"
   • "Opciones de mejora"
   ↓
3. Hace clic en "Comenzar"
   ↓
4. Inicia YaM40FlowSimplified (3 pasos)
```

### Paso 1: Perfil del Usuario

```
Datos solicitados:
├─ Nombre completo
├─ Fecha de nacimiento
├─ Edad de jubilación deseada (60-65)
├─ Semanas cotizadas ANTES de M40
├─ Estado civil
└─ Salario mensual bruto ANTES de M40
   • Ayuda: "Tu último salario antes de entrar a M40"
   • Convierte automáticamente a SDI
```

**Validaciones**:
- Edad >= 40 años
- Semanas >= 500
- Salario > 0

### Paso 2: Información de Pagos

**Opción A: Modo Rango** (recomendado)
```
Datos:
├─ Fecha inicio M40: { mes: 2, año: 2024 }
├─ Fecha fin M40 (o actual): { mes: 12, año: 2025 }
└─ Método de pago:
   A. Aportación Fija
      └─ Monto: $5,000 MXN/mes
   B. UMA Fijo
      └─ Nivel: 15 UMA

Sistema calcula:
• Lista de SDI para cada mes
• Convierte según tasa M40 del año
• Genera array de meses con SDI
```

**Opción B: Modo Manual**
```
Usuario ingresa mes por mes:
• Mes: Febrero 2024
• Aportación: $5,200 MXN
• [Agregar mes]

Permite:
• Meses discontinuos
• Aportaciones variables
• Meses sin pago (gaps)
```

**Generación de Lista SDI**:
```
POST /api/lista-sdi-yam40
↓
Para cada mes:
  1. Obtener UMA del año
  2. Obtener tasa M40 del año
  3. Calcular SDI:
     • Si aportación fija: SDI = (aportación / 30.4) / tasa
     • Si UMA fijo: SDI = UMA_nivel × UMA_año
  4. Guardar { mes, año, sdi, uma, aportacion }
↓
Retornar lista completa
```

### Paso 3: Resultado y Pensión Actual

```
Sistema calcula:
├─ 1. Construye array 250 semanas
│  ├─ Semanas históricas: SDI antes de M40
│  └─ Semanas M40: SDI real de cada mes pagado
│
├─ 2. Calcula SDI promedio de 250 semanas
│
├─ 3. Aplica Ley 73:
│  ├─ Cuantía básica (Art. 167)
│  ├─ Incrementos anuales
│  ├─ Factor de edad
│  ├─ Ley Fox (+11%)
│  └─ Asignaciones familiares
│
└─ 4. Retorna:
   ├─ Pensión mensual actual
   ├─ ROI de la inversión
   ├─ Meses de recuperación
   └─ Total invertido
```

**Vista de Resultado**:
```
┌─────────────────────────────────────┐
│  Tu Pensión Actual                  │
├─────────────────────────────────────┤
│  💰 $12,500 MXN/mes                 │
│  📊 ROI: 245%                       │
│  📅 Recuperas en: 18 meses          │
│  💵 Total invertido: $90,000        │
└─────────────────────────────────────┘

Acciones:
• Ver desglose detallado
• Calcular mejoras
• Guardar estrategia
• Compartir
```

### Fase 2: Calcular Mejoras

**Componente**: Yam40MejorasEstrategia

```
1. Usuario hace clic en "Calcular mejoras"
   ↓
2. Sistema valida limitantes:
   
   A. Limitante de Reingreso (12 meses):
      • Última fecha de pago: Julio 2025
      • Fecha actual: Febrero 2026
      • Meses transcurridos: 7 meses
      • Faltantes: 5 meses
      → NO puede reingresar aún
   
   B. Limitante de Retroactivos (6 meses):
      • Puede pagar retroactivos hasta Agosto 2025
      • Meses retroactivos disponibles: 6
   ↓
3. Si puede mejorar:
   • Calcula meses disponibles hasta jubilación
   • Genera estrategias de mejora
   • Muestra comparativa:
     - Pensión actual: $12,500
     - Mejora con 20 meses UMA 18: $15,800 (+26%)
     - Inversión adicional: $110,000
     - Nuevo ROI: 215%
```

**Algoritmo de Mejoras**:
```javascript
function calcularMejoras(estadoActual) {
  // 1. Recalcular SDI histórico nuevo
  const nuevoSDIHistorico = calcularNuevoSDIHistorico(
    estadoActual.sdiHistoricoOriginal,
    estadoActual.mesesPagados
  )
  
  // 2. Calcular meses disponibles
  const mesesDisponibles = calcularMesesHastaJubilacion(
    estadoActual.fechaNacimiento,
    estadoActual.edadJubilacion,
    estadoActual.mesesPagados
  )
  
  // 3. Validar limitantes
  const { puedeReingresar, mesesFaltantes } = 
    validarLimitanteReingreso(estadoActual.ultimaFechaPago)
  
  if (!puedeReingresar) {
    return { 
      error: `Debes esperar ${mesesFaltantes} meses más` 
    }
  }
  
  // 4. Generar estrategias futuras
  const mejoras = []
  for (const mesesFuturos of [12, 24, 36]) {
    for (const uma of [15, 18, 20, 25]) {
      const nuevaPension = calcularPensionConMejora(
        nuevoSDIHistorico,
        estadoActual.mesesPagados,
        mesesFuturos,
        uma
      )
      
      mejoras.push({
        mesesAdicionales: mesesFuturos,
        umaFutura: uma,
        pensionMejorada: nuevaPension,
        incremento: nuevaPension - estadoActual.pensionActual,
        porcentajeIncremento: ((nuevaPension - estadoActual.pensionActual) / estadoActual.pensionActual) * 100
      })
    }
  }
  
  return mejoras.sort((a, b) => b.incremento - a.incremento)
}
```

### Fase 3: Guardar Estrategia YAM40

```
POST /api/guardar-estrategia
Body: {
  debugCode: "yam40_fijo_15_18_1709567890123",
  datosEstrategia: {
    pensionMensual: 12500,
    ROI: 245,
    mesesM40: 18,
    inversionTotal: 90000,
    registros: [...]
  },
  datosUsuario: {
    nombreFamiliar: "Juan Pérez",
    mesesPagados: [...],
    pensionActual: 12500
  }
}
↓
Guarda en BD
↓
Redirige a /yam40-estrategia/yam40_fijo_15_18_1709567890123
```

---

## 💳 Flujo de Compra y Pagos

### Flujo Completo de Compra

```
┌─────────────────────────────────────────────────────────────┐
│                    INICIO                                    │
│  Usuario selecciona plan/estrategia                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────────┐
│  ¿Está autenticado?                                         │
├─────────────────┬──────────────────┬────────────────────────┤
│     NO          │                  │      SÍ                │
│  Modal Login    │                  │   Continúa             │
└─────────────────┘                  └────────┬───────────────┘
                                               │
                                               ↓
┌─────────────────────────────────────────────────────────────┐
│  POST /api/orders                                           │
│  • Crea orden en BD (status: pending)                      │
│  • Genera orderNumber: "ORD-2025-001"                      │
│  • Expira en 24 horas                                       │
└─────────────────────────────────────────────┬───────────────┘
                                               │
                                               ↓
┌─────────────────────────────────────────────────────────────┐
│  POST /api/mercadopago/preference                          │
│  • Crea preferencia en MercadoPago                         │
│  • Configura back_urls (producción)                        │
│  • Configura webhook                                        │
│  • Guarda preference_id en orden                           │
└─────────────────────────────────────────────┬───────────────┘
                                               │
                                               ↓
┌─────────────────────────────────────────────────────────────┐
│  Redirección a MercadoPago Checkout                        │
│  • Usuario completa datos de pago                          │
│  • Selecciona método (tarjeta, OXXO, etc.)                │
│  • Confirma pago                                            │
└─────────────────────────────────────────────┬───────────────┘
                                               │
                                               ↓
┌─────────────────────────────────────────────────────────────┐
│  MercadoPago procesa pago                                   │
└────────┬──────────────────┬─────────────────┬───────────────┘
         │                  │                 │
         ↓                  ↓                 ↓
    APROBADO          RECHAZADO         PENDIENTE
         │                  │                 │
         │                  │                 │
         ↓                  ↓                 ↓
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│  Webhook    │   │   Webhook    │   │   Webhook    │
│  payment    │   │   payment    │   │   payment    │
│  approved   │   │   rejected   │   │   pending    │
└──────┬──────┘   └──────┬───────┘   └──────┬───────┘
       │                 │                  │
       ↓                 ↓                  ↓
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ Actualizar  │   │  Actualizar  │   │  Esperar     │
│ orden:      │   │  orden:      │   │  confirmación│
│ paid        │   │  failed      │   │              │
└──────┬──────┘   └──────────────┘   └──────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────────────┐
│  Procesar compra exitosa                                    │
├─────────────────────────────────────────────────────────────┤
│  Si planType = 'basic':                                     │
│    • Crear EstrategiaGuardada                              │
│    • Asociar con orden                                      │
│                                                              │
│  Si planType = 'premium':                                   │
│    • Actualizar User.subscription = 'premium'              │
│    • Marcar hasUsedFreeStrategy = false (resetear)         │
└─────────────────────────────────────────────┬───────────────┘
                                               │
                                               ↓
┌─────────────────────────────────────────────────────────────┐
│  Redirección a página de éxito                             │
│  • /pago-exitoso?order=ORD-2025-001                        │
│  • Mostrar estrategia guardada                             │
│  • Link para ver detalles                                  │
└─────────────────────────────────────────────────────────────┘
```

### Webhook Handler (Detalle)

```javascript
// POST /api/webhooks/mercadopago

async function handleWebhook(payload, query) {
  // 1. Identificar tipo de webhook
  const type = payload.type || query.get('type')
  
  if (type === 'payment') {
    // 2. Obtener detalles del pago
    const paymentId = payload.data.id
    const paymentDetails = await mercadopago.payment.get(paymentId)
    
    // 3. Buscar orden por external_reference
    const order = await prisma.order.findFirst({
      where: { 
        externalReference: paymentDetails.external_reference 
      }
    })
    
    if (!order) {
      // Log y retornar 200 (confirmar recepción)
      return { status: 200, message: 'Order not found' }
    }
    
    // 4. Verificar idempotencia
    if (order.status === 'paid') {
      return { status: 200, message: 'Already processed' }
    }
    
    // 5. Procesar según estado
    if (paymentDetails.status === 'approved') {
      await processApprovedPayment(order, paymentDetails)
    } else if (paymentDetails.status === 'rejected') {
      await processRejectedPayment(order, paymentDetails)
    }
    
    // 6. Siempre retornar 200
    return { status: 200, success: true }
  }
  
  if (type === 'merchant_order') {
    // Similar pero obtiene pagos desde merchant_order
    // ...
  }
}

async function processApprovedPayment(order, payment) {
  // Transacción atómica
  await prisma.$transaction(async (tx) => {
    // 1. Actualizar orden
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        paymentId: payment.id.toString(),
        updatedAt: new Date()
      }
    })
    
    // 2. Procesar según plan
    if (order.planType === 'basic') {
      // Guardar estrategia
      const strategyData = order.strategyData
      await tx.estrategiaGuardada.create({
        data: {
          userId: order.userId,
          debugCode: strategyData.debugCode,
          datosEstrategia: strategyData,
          datosUsuario: order.userData,
          activa: true,
          visualizaciones: 0
        }
      })
    } else if (order.planType === 'premium') {
      // Actualizar usuario a premium
      await tx.user.update({
        where: { id: order.userId },
        data: {
          subscription: 'premium',
          hasUsedFreeStrategy: false
        }
      })
    }
  })
  
  console.log(`✅ Payment approved: Order ${order.id}`)
}
```

---

## 📊 Planes de Usuario

### Free (Gratuito)

**Características**:
- ✅ Simulador básico (HeroOnboard)
- ✅ Simulador completo con filtros
- ✅ Ver estrategias calculadas
- ✅ **1 estrategia gratis para guardar**
- ❌ Ver detalles completos
- ❌ Descargar PDF
- ❌ Estrategias ilimitadas

**Restricciones**:
```javascript
if (userPlan === 'free' && hasUsedFreeStrategy) {
  // Mostrar modal: Compra estrategia o suscríbete a Premium
  openPremiumModal()
}
```

### Basic (Compra Única - $299 MXN)

**Características**:
- ✅ 1 estrategia específica guardada
- ✅ Ver detalles completos de ESA estrategia
- ✅ Descargar PDF de ESA estrategia
- ✅ Compartir estrategia
- ❌ Estrategias adicionales (requiere nueva compra)
- ❌ Acceso ilimitado

**Uso**:
- Para usuarios que solo necesitan 1 estrategia
- Compra puntual sin suscripción

### Premium (De por vida - $999 MXN)

**Características**:
- ✅ Estrategias ilimitadas
- ✅ Ver detalles de TODAS las estrategias
- ✅ Descargar PDF de TODAS
- ✅ Gestión de familiares ilimitada
- ✅ Soporte prioritario
- ✅ Acceso de por vida (no suscripción)

**Ideal para**:
- Asesores financieros
- Usuarios con múltiples familiares
- Usuarios que quieren explorar muchas opciones

---

## 🗺️ Journey del Usuario

### Usuario Tipo A: "Explorador" (No registrado)

```
Día 1:
  09:00 → Llega por Google a landing
  09:05 → Completa HeroOnboard
  09:10 → Ve top 5 estrategias
  09:15 → Sale sin registrarse

Día 3:
  15:00 → Regresa por email marketing
  15:05 → Va directo a /simulador
  15:10 → Ajusta filtros, ve más estrategias
  15:20 → Encuentra estrategia ideal
  15:22 → Se registra para guardarla
  15:25 → Guarda estrategia (gratis)
  15:30 → Descarga y revisa detalles
  
Día 7:
  10:00 → Regresa al dashboard
  10:05 → Agrega familiar (madre)
  10:10 → Calcula estrategias para madre
  10:15 → Intenta guardar 2da estrategia
  10:16 → Ve modal: "Ya usaste tu estrategia gratis"
  10:18 → Compra plan Premium ($999)
  10:20 → Guarda estrategias ilimitadas
```

### Usuario Tipo B: "Ya en M40" (Urgente)

```
Día 1:
  08:00 → Llega por anuncio Facebook
  08:02 → Lee landing, ve sección "Ya estoy en M40"
  08:05 → Entra a /yam40
  08:10 → Completa paso 1 (perfil)
  08:20 → Completa paso 2 (pagos - 18 meses)
  08:25 → Ve pensión actual: $12,500
  08:30 → Calcula mejoras
  08:35 → Ve que puede subir a $15,800
  08:40 → Se registra
  08:42 → Guarda estrategia actual (gratis)
  08:45 → Compra plan Premium para explorar mejoras
  08:50 → Guarda 3 estrategias de mejora
  09:00 → Descarga PDFs para llevar al IMSS
```

### Usuario Tipo C: "Asesor Financiero" (Premium directo)

```
Día 1:
  10:00 → Llega por recomendación
  10:05 → Explora simulador
  10:10 → Ve potencial para clientes
  10:15 → Compra Premium directamente ($999)
  10:20 → Agrega 5 clientes como familiares
  10:30 → Calcula estrategias para cada uno
  11:00 → Descarga 15 PDFs diferentes
  11:30 → Comparte links con clientes
  
Día 30:
  → Ha generado 50+ estrategias
  → ROI del Premium: Cobró $500 por asesoría × 10 clientes = $5,000
  → Recuperó inversión 5x
```

---

## 🎯 KPIs y Métricas

### Métricas de Conversión

```
Funnel Principal:
├─ Landing (100%)
│  ↓ 40% completan HeroOnboard
├─ HeroOnboard Completado (40%)
│  ↓ 25% migran a simulador
├─ Simulador Completo (10%)
│  ↓ 50% se registran
├─ Usuarios Registrados (5%)
│  ↓ 80% guardan estrategia gratis
├─ Estrategia Guardada (4%)
│  ↓ 30% consideran Premium
└─ Conversión Premium (1.2%)
```

### Métricas de Negocio

**Por Usuario**:
- Lifetime Value (Free): $0
- Lifetime Value (Basic): $299
- Lifetime Value (Premium): $999
- Costo de Adquisición Target: $50-100

**Por Estrategia**:
- Tiempo promedio cálculo: 3-8 segundos
- Estrategias generadas por sesión: 500-2000
- Descarga PDF (Premium): 60% de estrategias guardadas

### Métricas Técnicas

**Performance**:
- Tiempo de carga landing: <1.5s
- Tiempo de cálculo HeroOnboard: <2s
- Tiempo de cálculo simulador completo: <8s
- Tiempo de generación PDF: <5s

**Disponibilidad**:
- Uptime objetivo: 99.9%
- Timeout de webhooks: 30s
- Retry de webhooks: 3 intentos

---

**Última actualización**: Febrero 2025
