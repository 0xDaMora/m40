# 📋 Resumen Completo del Proyecto - Modalidad 40 Simulator

## 🎯 Visión General

Sistema completo de simulación y cálculo de estrategias de **Modalidad 40** del IMSS (Instituto Mexicano del Seguro Social). Permite a los usuarios calcular, comparar, guardar y compartir estrategias personalizadas de ahorro voluntario para mejorar su pensión de jubilación.

---

## 🏗️ Arquitectura del Proyecto

### **Stack Tecnológico**
- **Frontend**: Next.js 14+ (App Router), React, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: PostgreSQL (Supabase/PostgreSQL)
- **Autenticación**: NextAuth.js (Email/Password + Google OAuth)
- **Pagos**: MercadoPago Integration
- **Estado**: React Hooks, Context API

### **Estructura de Carpetas**
```
m40/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticación
│   │   ├── calculate-strategies/ # Cálculo de estrategias
│   │   ├── guardar-estrategia/  # Guardar estrategias
│   │   ├── family/               # Gestión de familiares
│   │   ├── mercadopago/          # Integración MercadoPago
│   │   └── orders/               # Sistema de órdenes
│   ├── dashboard/                # Dashboard de usuario
│   ├── simulador/                # Simulador principal
│   ├── estrategia/[code]/        # Vista de estrategia detallada
│   └── mis-estrategias/          # Estrategias guardadas
├── components/                   # Componentes React
│   ├── integration/              # Componentes del simulador integrado
│   │   ├── components/           # Componentes UI
│   │   ├── hooks/               # Hooks personalizados
│   │   └── utils/                # Utilidades
│   ├── auth/                     # Componentes de autenticación
│   ├── family/                   # Gestión de familiares
│   ├── results/                  # Vistas de resultados
│   └── steps/                    # Pasos del wizard
├── lib/                          # Lógica de negocio
│   ├── all/                      # Cálculos de Modalidad 40
│   ├── auth/                     # Configuración NextAuth
│   ├── db/                       # Cliente Prisma
│   └── utils/                    # Utilidades generales
├── types/                        # Definiciones TypeScript
├── hooks/                        # Hooks globales
└── prisma/                       # Schema y migraciones
```

---

## 🎨 Componentes Principales

### **1. HeroOnboard.tsx** ⭐
**Ubicación**: `components/HeroOnboard.tsx`

**Propósito**: Simulador rápido de entrada que permite a usuarios no registrados calcular estrategias básicas.

**Flujo**:
1. Usuario ingresa datos básicos (5 pasos):
   - Fecha de nacimiento (`StepFechaN`)
   - Edad de jubilación (`StepJubi`)
   - Semanas cotizadas (`StepSemanas`)
   - SDI/Salario (`StepSDI`)
   - Estado civil (`StepEstadoCivil`)
2. Al completar, calcula automáticamente estrategias
3. Muestra resultados en `HeroOnboardStrategiesView`
4. Opción de migrar a simulador completo (`FamilySimulatorIntegration`)

**Características**:
- ✅ Sin registro requerido
- ✅ Cálculo automático al completar formulario
- ✅ Migración de datos al simulador completo
- ✅ Sidebar con tips contextuales

---

### **2. FamilySimulatorIntegration.tsx** ⭐⭐⭐
**Ubicación**: `components/integration/FamilySimulatorIntegration.tsx`

**Propósito**: Simulador completo y profesional con gestión de familiares, filtros avanzados y análisis detallado.

**Arquitectura Modular**:
- **Hooks personalizados**:
  - `useFamilyManagement`: Gestión de familiares (CRUD)
  - `useStrategyCalculation`: Cálculo de estrategias con debounce
  - `useStrategyFiltering`: Filtrado y ordenamiento
  - `usePagination`: Paginación de resultados
  - `useModalManager`: Gestión de modales

- **Componentes hijos**:
  - `FamilySelector`: Selector de familiar con formulario
  - `StrategyFiltersPanel`: Panel de filtros principales
  - `StrategyList`: Lista de estrategias con filtros avanzados
  - `PaginationControls`: Controles de paginación
  - `StrategyCard/StrategyRow`: Tarjetas individuales

**Flujo Completo**:
1. **Selección de Familiar**:
   - Cargar familiares desde BD (si está logueado) o localStorage
   - Crear nuevo familiar con formulario modal
   - Seleccionar familiar activo

2. **Configuración de Filtros**:
   - Rango de aportación mensual (min-max)
   - Meses en Modalidad 40
   - Edad de jubilación (60-65)
   - Fecha de inicio personalizada

3. **Cálculo de Estrategias**:
   - Trigger automático con debounce (500ms)
   - Llamada a `/api/calculate-strategies`
   - Generación de múltiples estrategias (modo `scan` o `fixed`)
   - Validación de datos del familiar

4. **Visualización y Filtrado**:
   - Filtros por tipo (fijo/progresivo)
   - Filtros por rango UMA (1-25)
   - Filtros por meses (1-58)
   - Ordenamiento (ROI, pensión, inversión, meses)
   - Paginación con carga progresiva

5. **Acciones sobre Estrategias**:
   - **Ver Detalles**: Abre `EstrategiaDetallada` (requiere premium)
   - **Descargar PDF**: Genera PDF de la estrategia
   - **Comprar**: Abre modal de compra con MercadoPago
   - **Guardar**: Guarda estrategia (1 gratis, luego requiere premium)

**Características Clave**:
- ✅ Gestión completa de familiares
- ✅ Cálculo en tiempo real con optimizaciones
- ✅ Filtrado inteligente basado en SDI del familiar
- ✅ Sistema de paginación eficiente
- ✅ Integración con sistema de pagos
- ✅ Control de acceso por plan (free/basic/premium)

---

### **3. EstrategiaDetallada.tsx** ⭐⭐⭐
**Ubicación**: `components/EstrategiaDetallada.tsx`

**Propósito**: Vista detallada completa de una estrategia con análisis profundo, cronograma, trámites y proyecciones.

**Estructura de Tabs**:
1. **📊 Resumen**: 
   - Desglose de pensión (base, factor edad, Ley Fox, dependientes)
   - Cálculo de ISR (bruto, neto, umbral exento)
   - Métricas clave (ROI, recuperación, pensión con aguinaldo)

2. **💰 Pagos Mensuales**:
   - Tabla completa de todos los pagos
   - Fecha, UMA, tasa M40, SDI mensual, cuota, acumulado
   - Scroll horizontal en móvil

3. **📅 Cronograma**:
   - Timeline visual con fechas clave:
     - Inicio Modalidad 40
     - Período de pagos
     - Finalización M40
     - Inicio de trámites (1 mes antes)
     - Fecha de jubilación
   - Cálculo basado en fecha de nacimiento + edad objetivo

4. **📈 Proyección 20 Años**:
   - Tabla anual con incrementos del 5% cada febrero
   - Pensión bruta, neta, ISR, incrementos acumulados
   - Cálculo desde año de jubilación

5. **📋 Trámites**:
   - Componente `EstrategiaDetalladaTramites`
   - Pasos detallados para:
     - Darse de alta en Modalidad 40
     - Realizar pagos
     - Solicitar AFORE
     - Solicitar jubilación
   - Formatos oficiales y documentos requeridos

6. **🛡️ Pensión Viudez**:
   - Cálculo del 90% de la pensión del titular
   - Información sobre requisitos y beneficios

**Funcionalidades**:
- ✅ **Guardar Estrategia**: Guarda en BD (1 gratis, luego premium)
- ✅ **Compartir**: Web Share API + fallbacks para iOS/Android
- ✅ **Descargar PDF**: Generación completa con html2canvas + jsPDF
  - Manejo especial para iOS
  - Incluye todos los datos y tablas
- ✅ **Información Personalizada**: Muestra datos del familiar si están disponibles

**Cálculos Incluidos**:
- ISR sobre pensión (`calcularISRPension`)
- Proyección con incrementos (`calcularProyeccionPension`)
- Pensión de viudez (`calcularPensionViudez`)
- Factor de edad
- Ley Fox (11%)
- Asignaciones familiares

---

## 🔄 Flujos de Usuario Principales

### **Flujo 1: Usuario No Registrado (HeroOnboard)**
```
1. Landing Page → HeroOnboard
2. Completar 5 pasos del formulario
3. Cálculo automático de estrategias
4. Ver top 5 estrategias
5. Opciones:
   - Migrar a simulador completo (guarda datos en localStorage)
   - Registrarse para guardar estrategias
   - Compartir estrategia (sin guardar)
```

### **Flujo 2: Usuario Registrado (Simulador Completo)**
```
1. Login/Registro
2. Dashboard → Simulador
3. Agregar/Crear Familiar
4. Seleccionar Familiar
5. Configurar Filtros
6. Ver Estrategias Calculadas
7. Filtrar y Ordenar
8. Acciones:
   a) Ver Detalles (requiere premium)
   b) Descargar PDF
   c) Comprar Estrategia (MercadoPago)
   d) Guardar (1 gratis, luego premium)
```

### **Flujo 3: Compra de Estrategia**
```
1. Usuario selecciona estrategia
2. Click en "Comprar" o "Ver Detalles" (si no es premium)
3. Modal de compra (StrategyPurchaseModal)
4. Selección de plan (Basic/Premium)
5. Crear Orden en BD (/api/orders)
6. Crear Preferencia MercadoPago (/api/mercadopago/preference)
7. Redirección a MercadoPago
8. Pago completado → Webhook (/api/webhooks/mercadopago)
9. Actualizar orden → Crear estrategia guardada
10. Redirección a estrategia detallada
```

### **Flujo 4: Guardar Estrategia Gratis**
```
1. Usuario premium ve estrategia
2. Click en "Guardar"
3. POST /api/guardar-estrategia
4. Verificar hasUsedFreeStrategy
5. Si es false:
   - Guardar estrategia
   - Marcar hasUsedFreeStrategy = true
   - Retornar éxito
6. Si es true:
   - Retornar error 403 (requiere premium)
7. Redirección a estrategia guardada
```

---

## 🗄️ Base de Datos (Prisma Schema)

### **Modelos Principales**

#### **User**
```prisma
- id: String (cuid)
- email: String (unique)
- name: String?
- password: String? (hasheado)
- authProvider: String (email/google)
- subscription: String (free/basic/premium)
- hasUsedFreeStrategy: Boolean (default: false)
- createdAt: DateTime
```

#### **FamilyMember**
```prisma
- id: String
- userId: String (FK)
- name: String
- birthDate: DateTime
- weeksContributed: Int
- lastGrossSalary: Float
- civilStatus: String
- createdAt: DateTime
```

#### **EstrategiaGuardada**
```prisma
- id: String
- userId: String (FK)
- familyMemberId: String? (FK)
- debugCode: String (unique) // Código único de estrategia
- datosEstrategia: Json // Datos completos de la estrategia
- datosUsuario: Json // Datos del usuario/familiar
- activa: Boolean
- visualizaciones: Int
- createdAt: DateTime
- updatedAt: DateTime
```

#### **Order** (Sistema MercadoPago)
```prisma
- id: String
- userId: String (FK)
- orderNumber: String (unique) // ORD-2024-001
- status: String (pending/paid/failed/cancelled/expired)
- planType: String (basic/premium)
- amount: Decimal
- currency: String (MXN)
- mercadopagoId: String? // Preference ID
- paymentId: String? // Payment ID
- externalReference: String? // Para webhooks
- strategyData: Json?
- strategyCode: String?
- userData: Json?
- createdAt: DateTime
- expiresAt: DateTime (24 horas)
```

---

## 🔌 APIs Principales

### **1. `/api/calculate-strategies`** (POST)
**Propósito**: Calcular múltiples estrategias basadas en datos del familiar y filtros.

**Input**:
```typescript
{
  familyData: {
    id, name, birthDate, weeksContributed, 
    lastGrossSalary, civilStatus
  },
  filters: {
    monthlyContributionRange: { min, max },
    months: number,
    retirementAge: number,
    startMonth?: number,
    startYear?: number,
    monthsMode?: 'fixed' | 'scan'
  }
}
```

**Proceso**:
1. Validar datos de entrada
2. Convertir rango de aportación a UMA (`getUMARange`)
3. Calcular estrategias con `allStrats()`:
   - Genera todas las combinaciones posibles
   - UMA: umaMin a umaMax
   - Meses: según `monthsMode` (fixed o scan 1-58)
   - Tipos: fijo y progresivo
4. Filtrar estrategias válidas
5. Retornar array de `StrategyResult`

**Output**:
```typescript
{
  strategies: StrategyResult[],
  count: number,
  familyData,
  filters
}
```

---

### **2. `/api/guardar-estrategia`** (POST)
**Propósito**: Guardar estrategia en BD. Controla estrategia gratis única.

**Input**:
```typescript
{
  debugCode: string,
  datosEstrategia: Json,
  datosUsuario: Json,
  familyMemberId?: string
}
```

**Proceso**:
1. Verificar autenticación
2. Verificar si estrategia ya existe (por `debugCode`)
3. Verificar `hasUsedFreeStrategy`:
   - Si es `false` → Permitir guardar gratis
   - Si es `true` → Verificar plan premium
4. Transacción:
   - Crear `EstrategiaGuardada`
   - Si es gratis → Actualizar `User.hasUsedFreeStrategy = true`
5. Retornar éxito o error

**Respuestas**:
- `200`: Estrategia guardada exitosamente
- `409`: Estrategia ya existe
- `403`: Usuario ya usó estrategia gratis (requiere premium)
- `401`: No autenticado

---

### **3. `/api/family`** (GET/POST)
**GET**: Listar familiares del usuario autenticado
**POST**: Crear nuevo familiar

**POST Input**:
```typescript
{
  name: string,
  birthDate: Date,
  weeksContributed: number,
  lastGrossSalary: number,
  civilStatus: 'soltero' | 'casado' | 'divorciado' | 'viudo'
}
```

---

### **4. `/api/orders`** (POST)
**Propósito**: Crear orden de compra para MercadoPago.

**Input**:
```typescript
{
  planType: 'basic' | 'premium',
  amount: number,
  strategyData?: Json,
  userData?: Json
}
```

**Proceso**:
1. Generar número de orden único (`ORD-YYYY-XXX`)
2. Crear `Order` con status `pending`
3. Calcular `expiresAt` (24 horas)
4. Retornar orden creada

---

### **5. `/api/mercadopago/preference`** (POST)
**Propósito**: Crear preferencia de pago en MercadoPago.

**Input**:
```typescript
{
  orderId: string,
  amount: number,
  strategyData?: Json,
  userData?: Json
}
```

**Proceso**:
1. Buscar orden por ID
2. Crear preferencia en MercadoPago SDK
3. Configurar:
   - Monto, moneda (MXN)
   - External reference (order ID)
   - Back URLs (success, failure, pending)
   - Items (plan básico/premium)
4. Actualizar orden con `mercadopagoId`
5. Retornar `init_point` (URL de pago)

---

### **6. `/api/webhooks/mercadopago`** (POST)
**Propósito**: Recibir notificaciones de pago de MercadoPago.

**Proceso**:
1. Validar firma de MercadoPago
2. Buscar orden por `external_reference`
3. Obtener información del pago desde MercadoPago
4. Si pago aprobado:
   - Actualizar orden a `paid`
   - Si es plan básico → Crear `EstrategiaGuardada`
   - Si es plan premium → Actualizar `User.subscription`
5. Retornar 200 OK

---

### **7. `/api/estrategia-compartible`** (POST)
**Propósito**: Obtener estrategia guardada por código para compartir.

**Input**:
```typescript
{
  code: string // debugCode de la estrategia
}
```

**Proceso**:
1. Buscar `EstrategiaGuardada` por `debugCode`
2. Incrementar `visualizaciones`
3. Retornar datos completos de estrategia y usuario

---

## 🧮 Lógica de Cálculo (lib/all/)

### **allStrats.ts**
Función principal que genera todas las estrategias posibles.

**Parámetros**:
- `fechaNacimiento`: Fecha de nacimiento
- `edadJubilacion`: 60-65 años
- `semanasPrevias`: Semanas cotizadas actuales
- `dependiente`: "conyuge" | "ninguno"
- `umaMin`, `umaMax`: Rango de UMA (1-25)
- `sdiHistorico`: SDI diario histórico
- `fechaInicio`: Fecha de inicio personalizada (opcional)
- `monthsMode`: 'fixed' (solo meses especificados) | 'scan' (1-58)

**Proceso**:
1. Validar parámetros de entrada
2. Calcular edad actual y fecha límite (53 años)
3. Determinar meses disponibles según edad
4. Generar combinaciones:
   - Para cada UMA (umaMin a umaMax)
   - Para cada tipo (fijo, progresivo)
   - Para cada mes disponible (según `monthsMode`)
5. Calcular cada estrategia con `calcularEscenario()`
6. Filtrar estrategias válidas (con pensión > 0)
7. Retornar array de resultados

**Resultado**:
```typescript
{
  estrategia: 'fijo' | 'progresivo',
  umaElegida: number,
  mesesM40: number,
  pensionMensual: number | null,
  ROI: number | null,
  inversionTotal: number | null,
  error?: string
}
```

---

### **calculator.ts / calculatorDetailed.ts**
Funciones de cálculo detallado que implementan la Ley 73 del IMSS:
- Cálculo de SDI mensual
- Cálculo de cuotas mensuales
- Cálculo de pensión base
- Aplicación de factores (edad, Ley Fox, dependientes)
- Cálculo de ROI
- Generación de registros mensuales

---

### **umaConverter.ts**
Conversión entre aportaciones monetarias y niveles UMA:
- `getUMARange(minAportacion, maxAportacion, año)`: Convierte rango de aportación a rango UMA
- `getMaxAportacion(año)`: Obtiene aportación máxima del año
- UMA 2025: $113.07 MXN

---

## 🔐 Sistema de Autenticación

### **NextAuth.js Configuración**
- **Providers**: Email/Password, Google OAuth
- **Session**: JWT (JSON Web Tokens)
- **Callbacks**: Personalizados para incluir `subscription` y `hasUsedFreeStrategy`

### **Rutas Protegidas**:
- `/dashboard`: Requiere autenticación
- `/mis-estrategias`: Requiere autenticación
- Guardar estrategias: Requiere autenticación

### **Planes de Usuario**:
- **free**: Solo simulación, 1 estrategia gratis
- **basic**: Estrategias ilimitadas (compra única)
- **premium**: Acceso completo + ver detalles

---

## 💳 Sistema de Pagos (MercadoPago)

### **Flujo Completo**:
1. Usuario selecciona estrategia → Click "Comprar"
2. `StrategyPurchaseModal` → Selección de plan
3. Crear `Order` en BD (`/api/orders`)
4. Crear preferencia MercadoPago (`/api/mercadopago/preference`)
5. Redirección a MercadoPago
6. Usuario paga
7. Webhook recibe notificación (`/api/webhooks/mercadopago`)
8. Actualizar orden y crear estrategia guardada
9. Redirección a página de éxito → Estrategia detallada

### **Estados de Orden**:
- `pending`: Creada, esperando pago
- `paid`: Pagada exitosamente
- `failed`: Pago fallido
- `cancelled`: Cancelada por usuario
- `expired`: Expirada (24 horas)

---

## 🎨 Componentes UI Clave

### **StrategyList.tsx**
Lista de estrategias con:
- Filtros avanzados (tipo, UMA, meses)
- Ordenamiento (ROI, pensión, inversión, meses)
- Paginación
- Acciones por estrategia (ver, descargar, comprar)

### **StrategyCard/StrategyRow.tsx**
Tarjeta individual de estrategia mostrando:
- Tipo (fijo/progresivo)
- UMA y meses
- Pensión mensual
- ROI
- Inversión total
- Botones de acción

### **FamilySelector.tsx**
Selector de familiar con:
- Lista de familiares
- Botón para agregar nuevo
- Formulario modal
- Integración con `useFamilyManagement`

### **PaginationControls.tsx**
Controles de paginación:
- Mostrar X de Y estrategias
- Botón "Cargar más"
- Estrategias por página configurables

---

## 🔧 Hooks Personalizados

### **useFamilyManagement**
- `loadFamilyMembers()`: Cargar desde BD o localStorage
- `selectFamilyMember()`: Seleccionar familiar activo
- `openFamilyForm()` / `closeFamilyForm()`: Control de modal
- `handleFamilyFormSuccess()`: Callback después de crear

### **useStrategyCalculation**
- `calculateStrategies()`: Calcular con validaciones
- Estados: `strategies`, `loading`, `loadTime`
- Validación de datos del familiar
- Optimización de filtros según SDI

### **useStrategyFiltering**
- `filterStrategies()`: Filtrado inteligente
- `useFilteredStrategies()`: Hook memoizado
- Filtro automático por SDI del familiar
- Ordenamiento eficiente

### **usePagination**
- `displayedStrategies`: Estrategias visibles
- `loadMoreStrategies()`: Cargar más
- `hasMoreStrategies`: Indicador de más resultados
- `strategiesPerPage`: Configurable

### **useModalManager**
- Gestión centralizada de modales:
  - `showStrategyPurchaseModal`
  - `showPremiumModal`
  - Funciones de apertura/cierre

---

## 📱 Responsive Design

### **Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### **Adaptaciones Móviles**:
- Tabs horizontales con scroll en `EstrategiaDetallada`
- Tablas con scroll horizontal
- Modales fullscreen en móvil
- Botones adaptativos (texto/iconos)
- Grids responsivos (1-2-3-4 columnas)

---

## 🚀 Optimizaciones Implementadas

1. **Debounce en cálculos**: 500ms para evitar cálculos excesivos
2. **Memoización**: `useMemo` en filtros y cálculos
3. **Paginación**: Carga progresiva de estrategias
4. **Filtrado inteligente**: Pre-filtrado por SDI del familiar
5. **Lazy loading**: Componentes pesados cargados bajo demanda
6. **Códigos de estrategia**: Incluyen fecha de inicio para diferenciación

---

## 🔄 Migración de Datos

### **HeroOnboard → FamilySimulatorIntegration**:
1. Datos guardados en `localStorage` con clave `quickSimulation`
2. Al entrar al simulador completo, detecta datos
3. Crea `FamilyMember` temporal con ID `hero-simulation`
4. Muestra banner de migración
5. Usuario puede guardar como familiar real

---

## 📊 Métricas y Analytics

### **Tracking Implementado**:
- Visualizaciones de estrategias (`visualizaciones` en BD)
- Tiempo de carga de cálculos (`loadTime`)
- Contador de estrategias calculadas
- Estados de órdenes y pagos

---

## 🛡️ Validaciones y Seguridad

### **Validaciones Frontend**:
- Datos del familiar (edad mínima, semanas mínimas)
- Rangos de filtros (UMA 1-25, meses 1-58)
- Fechas válidas
- Montos positivos

### **Validaciones Backend**:
- Autenticación en endpoints protegidos
- Validación de datos de entrada
- Verificación de permisos (plan premium)
- Validación de firma MercadoPago en webhooks

---

## 📝 Códigos de Estrategia

### **Formato de Códigos**:
- `compra_[timestamp]_[random]`: Estrategias de compra directa
- `integration_[familyMemberId]_[estrategia]_[uma]_[meses]_[edad]_[mesAño]`: Estrategias del simulador
- `premium_[timestamp]_[random]`: Estrategias premium

**Ejemplo**: `integration_abc123_fijo_15_36_65_022025`

---

## 🎯 Funcionalidades Estrella

### **1. Cálculo Masivo de Estrategias**
- Genera miles de combinaciones posibles
- Modo `scan`: Explora todas las opciones (1-58 meses)
- Modo `fixed`: Solo meses específicos
- Optimizado para rendimiento

### **2. Filtrado Inteligente**
- Pre-filtrado automático por SDI del familiar
- Solo muestra estrategias válidas (UMA >= SDI actual)
- Filtros múltiples combinables
- Ordenamiento dinámico

### **3. Vista Detallada Completa**
- 6 tabs con información exhaustiva
- Cálculos de ISR, proyecciones, viudez
- Cronograma visual con timeline
- Guía de trámites paso a paso
- PDF exportable completo

### **4. Sistema de Pagos Integrado**
- MercadoPago completo
- Órdenes rastreables
- Webhooks confiables
- Manejo de estados completo

### **5. Gestión de Familiares**
- CRUD completo
- Persistencia en BD
- Soporte para múltiples familiares
- Datos personalizados por familiar

---

## 🔮 Extensiones Futuras Preparadas

1. **Sistema de comparativas**: Comparar múltiples estrategias
2. **Notificaciones**: Recordatorios de pagos y fechas importantes
3. **Exportación avanzada**: Excel, CSV de estrategias
4. **Dashboard analítico**: Gráficas y estadísticas
5. **API pública**: Para integraciones externas
6. **Modo offline**: PWA con service workers

---

## 📚 Documentación Adicional

- `MAPA_COMPONENTES.md`: Mapa de componentes del proyecto
- `MERCADOPAGO_INTEGRATION_FLOW.md`: Flujo detallado de pagos
- `AUTH_SETUP.md`: Configuración de autenticación
- `SETUP_INSTRUCTIONS.md`: Instrucciones de setup

---

## 🎓 Conceptos Clave de Modalidad 40

### **¿Qué es Modalidad 40?**
Programa del IMSS que permite realizar aportaciones voluntarias para mejorar el promedio salarial y aumentar la pensión de jubilación.

### **Parámetros Importantes**:
- **UMA (Unidad de Medida y Actualización)**: Unidad de referencia para aportaciones (2025: $113.07)
- **SDI (Salario Diario Integrado)**: Base para cálculo de pensión
- **Factor de Edad**: Multiplicador según edad de jubilación
- **Ley Fox**: Incremento del 11% adicional
- **Asignaciones Familiares**: Bonificación por cónyuge

### **Restricciones**:
- Edad mínima: 53 años para iniciar
- Máximo: 58 meses de aportaciones
- UMA mínima: 1, máxima: 25
- Edad de jubilación: 60-65 años

---

## ✅ Checklist de Funcionalidades

- [x] Simulador rápido (HeroOnboard)
- [x] Simulador completo (FamilySimulatorIntegration)
- [x] Gestión de familiares
- [x] Cálculo masivo de estrategias
- [x] Filtrado y ordenamiento avanzado
- [x] Vista detallada de estrategias
- [x] Sistema de guardado (1 gratis + premium)
- [x] Sistema de pagos (MercadoPago)
- [x] Generación de PDF
- [x] Compartir estrategias
- [x] Autenticación completa
- [x] Dashboard de usuario
- [x] Responsive design
- [x] Optimizaciones de rendimiento

---

**Última actualización**: 2025-01-27
**Versión del documento**: 1.0

