# Modalidad 40 - Simulador de Pensiones IMSS

> Sistema completo para simular, calcular y optimizar estrategias de pensión bajo Modalidad 40 del IMSS (Ley 73)

## 🎯 Descripción del Proyecto

Aplicación web que permite a usuarios calcular y optimizar su pensión de jubilación mediante el programa Modalidad 40 del IMSS. El sistema ofrece dos flujos principales:

1. **Simulador para nuevos usuarios** - Calcular estrategias desde cero para quienes AÚN NO están en Modalidad 40
2. **Ya estoy en Modalidad 40 (YAM40)** - Calcular pensión actual y estrategias futuras para usuarios que YA están pagando

## 📊 Stack Tecnológico

### Frontend
- **Framework**: Next.js 15.5.9 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 4
- **Animaciones**: Framer Motion 12.23.12
- **Iconos**: Lucide React 0.540.0
- **Gráficas**: Recharts 3.2.0
- **PDF**: jsPDF 3.0.2 + html2canvas 1.4.1
- **Notificaciones**: React Hot Toast 2.6.0

### Backend & Database
- **ORM**: Prisma 6.15.0
- **Database**: PostgreSQL (Supabase)
- **Autenticación**: NextAuth.js 4.24.11
- **Adapter**: @auth/prisma-adapter 2.10.0
- **Encriptación**: bcryptjs 3.0.2

### Pagos
- **Proveedor**: MercadoPago 2.9.0
- **Sistema**: Webhooks + Preferences API

### Analytics
- **Vercel Analytics**: 1.6.1

## 🏗️ Arquitectura del Proyecto

```
m40/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                # Autenticación (NextAuth)
│   │   ├── calculate-strategies/ # Cálculo de estrategias
│   │   ├── family/              # Gestión de familiares
│   │   ├── guardar-estrategia/  # Guardar estrategias
│   │   ├── lista-sdi-yam40/     # Lista SDI para YAM40
│   │   ├── mercadopago/         # Integración MercadoPago
│   │   ├── orders/              # Sistema de órdenes
│   │   ├── webhooks/            # Webhooks MercadoPago
│   │   └── ...
│   ├── admin/                   # Panel administrativo
│   ├── auth/                    # Páginas de autenticación
│   ├── dashboard/               # Dashboard de usuario
│   ├── estrategia/[code]/       # Vista detallada de estrategia
│   ├── mis-estrategias/         # Estrategias guardadas
│   ├── simulador/               # Simulador principal
│   ├── yam40/                   # Flujo "Ya estoy en M40"
│   ├── yam40-estrategia/[code]/ # Vista detallada YAM40
│   └── page.tsx                 # Landing page
│
├── components/                   # Componentes React
│   ├── auth/                    # Login, registro, recuperación
│   ├── dashboard/               # Componentes del dashboard
│   ├── family/                  # Gestión de familiares
│   ├── help/                    # Sistema de ayuda y tooltips
│   ├── integration/             # Simulador completo
│   │   ├── components/          # Componentes del simulador
│   │   ├── hooks/               # Hooks personalizados
│   │   └── utils/               # Utilidades
│   ├── layout/                  # Navbar, Footer
│   ├── results/                 # Vista de resultados
│   ├── steps/                   # Pasos del wizard
│   ├── tutorials/               # Tutoriales y onboarding
│   ├── ui/                      # Componentes UI base
│   ├── yam40/                   # Componentes YAM40
│   │   ├── simple/              # Componentes simplificados
│   │   ├── EstrategiaDetalladaYam40.tsx
│   │   ├── UserProfileCard.tsx
│   │   ├── YaM40FlowSimplified.tsx
│   │   └── Yam40MejorasEstrategia.tsx
│   ├── EstrategiaDetallada.tsx  # Vista detallada de estrategia
│   ├── HeroOnboard.tsx          # Simulador rápido landing
│   └── ...
│
├── lib/                          # Lógica de negocio
│   ├── all/                     # Cálculos Modalidad 40
│   │   ├── allStrats.ts         # Generador de estrategias
│   │   ├── calculator.ts        # Calculadora base
│   │   ├── calculatorDetailed.ts # Calculadora detallada
│   │   ├── constants.ts         # Constantes (UMA, tasas, factores)
│   │   ├── calcularISR.ts       # Cálculo ISR
│   │   ├── smartFilter.ts       # Filtros inteligentes
│   │   ├── umaConverter.ts      # Conversión UMA
│   │   └── utils.ts
│   ├── auth/                    # Configuración NextAuth
│   ├── db/                      # Cliente Prisma
│   ├── mercadopago/             # Cliente y utilidades MP
│   ├── pensiones/               # Cálculos de pensión
│   ├── utils/                   # Utilidades generales
│   └── yam40/                   # Lógica YAM40
│       ├── adaptarEstrategiaYam40.ts
│       ├── calcularEdadEnMes.ts
│       ├── calcularNuevoSDIHistorico.ts
│       ├── calcularPensionActual.ts
│       ├── calcularSDIPromedio250Semanas.ts
│       ├── calculatorYam40Recrear.ts
│       ├── construirArray250Semanas.ts
│       ├── construirDatosYam40ParaGuardar.ts
│       ├── convertirAportacionesManuales.ts
│       ├── limitantesM40.ts
│       └── listaSDIyam40.ts
│
├── hooks/                        # Hooks globales
│   ├── useFamily.ts
│   ├── useFormatters.ts
│   ├── useLocalFamily.ts
│   ├── useMercadoPago.ts
│   ├── useMounted.ts
│   ├── useStrategies.ts
│   └── useStrategy.ts
│
├── types/                        # Definiciones TypeScript
│   ├── family.ts                # Tipos de familiares
│   ├── mercadopago.ts           # Tipos MercadoPago
│   ├── next-auth.d.ts           # Extensión NextAuth
│   ├── strategy.ts              # Tipos de estrategias
│   └── yam40.ts                 # Tipos YAM40
│
├── prisma/                       # Base de datos
│   └── schema.prisma            # Schema Prisma
│
└── public/                       # Archivos estáticos
```

## 🎨 Flujos Principales del Sistema

### 1️⃣ Flujo: Usuario Nuevo (Sin Modalidad 40)

**Página**: `/` (Landing) → HeroOnboard → `/simulador`

#### HeroOnboard - Simulador Rápido (Landing)
- **Componente**: `HeroOnboard.tsx`
- **Pasos**: 5 preguntas básicas
  1. Fecha de nacimiento
  2. Edad de jubilación deseada (60-65)
  3. Semanas cotizadas actuales
  4. Salario mensual bruto
  5. Estado civil
- **Resultado**: Top 5 estrategias calculadas automáticamente
- **Acción**: Migración a simulador completo con datos precargados

#### FamilySimulatorIntegration - Simulador Completo
- **Componente**: `FamilySimulatorIntegration.tsx`
- **Características**:
  - Gestión de múltiples familiares
  - Filtros avanzados (aportación, meses, edad jubilación)
  - Cálculo masivo de estrategias (hasta 2000+ combinaciones)
  - Sistema de paginación
  - Ordenamiento por ROI, pensión, inversión
  - **Modos de cálculo**:
    - `fixed`: Calcula solo con meses específicos
    - `scan`: Genera estrategias para 1-58 meses

### 2️⃣ Flujo: Ya Estoy en Modalidad 40 (YAM40)

**Página**: `/yam40`

#### YaM40FlowSimplified
- **Componente**: `YaM40FlowSimplified.tsx`
- **Flujo**: 3 pasos
  1. **Datos de perfil**: Nombre, fecha nacimiento, edad jubilación, semanas cotizadas, salario histórico
  2. **Información de pagos**: 
     - Modo Rango: Fecha inicio/fin + aportación fija o UMA fijo
     - Modo Manual: Meses individuales con aportaciones específicas
  3. **Resultado**: Pensión actual + opciones de mejora

#### Cálculo de Pensión Actual
- **Lógica**: `calculatorYam40Recrear.ts`
- **Proceso**:
  1. Obtener meses pagados reales (con SDI histórico)
  2. Construir array de 250 semanas
  3. Calcular SDI promedio
  4. Aplicar Ley 73 (Art. 167, factores de edad, Ley Fox, asignaciones)
  5. Retornar pensión mensual, ROI, recuperación

#### Mejoras de Estrategia
- **Componente**: `Yam40MejorasEstrategia.tsx`
- **Función**: Calcular estrategias futuras para incrementar pensión
- **Validación**: Limitantes de reingreso (12 meses) y retroactivos (6 meses)

### 3️⃣ Flujo: Ver Estrategia Detallada

**Páginas**: `/estrategia/[code]` o `/yam40-estrategia/[code]`

#### EstrategiaDetallada
- **Componente**: `EstrategiaDetallada.tsx` o `EstrategiaDetalladaYam40.tsx`
- **Tabs**:
  1. **📊 Resumen**: Pensión desglosada (base, factor edad, Ley Fox, dependientes), ISR
  2. **💰 Pagos Mensuales**: Tabla completa con fechas, UMA, SDI, cuota
  3. **📅 Cronograma**: Timeline visual con fechas clave
  4. **📈 Proyección 20 Años**: Incremento 5% anual (febrero)
  5. **📋 Trámites**: Guía paso a paso con formatos oficiales
  6. **🛡️ Pensión Viudez**: Cálculo del 90%
- **Acciones**:
  - Guardar estrategia (1 gratis, luego requiere premium)
  - Compartir (Web Share API)
  - Descargar PDF (html2canvas + jsPDF)

### 4️⃣ Flujo: Sistema de Pagos (MercadoPago)

#### Proceso de Compra
1. Usuario selecciona plan (Basic o Premium)
2. **POST `/api/orders`**: Crear orden en BD
3. **POST `/api/mercadopago/preference`**: Crear preferencia MP
4. Redirección a checkout de MercadoPago
5. Usuario completa pago
6. **Webhook `/api/webhooks/mercadopago`**: Procesar notificación
7. Si aprobado:
   - Actualizar orden a `paid`
   - Si Basic: Crear `EstrategiaGuardada`
   - Si Premium: Actualizar `User.subscription = 'premium'`
8. Redirección a página de éxito con estrategia

#### Planes Disponibles
- **Free**: Solo simulación, 1 estrategia gratis para guardar
- **Basic**: Compra única de estrategia ($XX MXN)
- **Premium**: Acceso ilimitado de por vida, ver detalles, estrategias ilimitadas

## 🗄️ Base de Datos (Prisma)

### Modelos Principales

#### User
```prisma
- id: String (cuid)
- email: String (unique)
- name: String?
- password: String? (bcrypt)
- authProvider: 'email' | 'google'
- image: String?
- subscription: 'free' | 'basic' | 'premium'
- hasUsedFreeStrategy: Boolean
- createdAt: DateTime
```

#### FamilyMember
```prisma
- id: String
- userId: String (FK User)
- name: String
- birthDate: DateTime
- weeksContributed: Int
- lastGrossSalary: Float (salario bruto mensual)
- civilStatus: 'soltero' | 'casado' | 'divorciado' | 'viudo'
- createdAt: DateTime
```

#### EstrategiaGuardada
```prisma
- id: String
- userId: String (FK User)
- familyMemberId: String? (FK FamilyMember)
- debugCode: String (unique) - Código de estrategia
- datosEstrategia: Json
- datosUsuario: Json
- activa: Boolean
- visualizaciones: Int
- createdAt/updatedAt: DateTime
```

#### Order (Sistema MercadoPago)
```prisma
- id: String
- userId: String (FK User)
- orderNumber: String (unique) - 'ORD-YYYY-XXX'
- status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired'
- planType: 'basic' | 'premium'
- amount: Decimal
- mercadopagoId: String? (Preference ID)
- paymentId: String? (Payment ID)
- externalReference: String?
- strategyData: Json?
- userData: Json?
- expiresAt: DateTime (24 horas)
- createdAt/updatedAt: DateTime
```

## 🔧 APIs Principales

### Autenticación
- **POST** `/api/auth/[...nextauth]` - NextAuth endpoints
- **POST** `/api/auth/register` - Registro de usuario
- **POST** `/api/auth/forgot-password` - Recuperación de contraseña
- **POST** `/api/auth/reset-password` - Resetear contraseña

### Estrategias
- **POST** `/api/calculate-strategies` - Calcular estrategias
  - Input: `{ familyData, filters, userPreferences? }`
  - Output: Array de estrategias ordenadas por ROI
- **POST** `/api/guardar-estrategia` - Guardar estrategia
  - Controla estrategia gratis única por usuario
- **POST** `/api/estrategia-compartible` - Obtener estrategia por código

### Familiares
- **GET** `/api/family` - Listar familiares del usuario
- **POST** `/api/family` - Crear familiar
- **PUT** `/api/family/[id]` - Actualizar familiar
- **DELETE** `/api/family/[id]` - Eliminar familiar

### YAM40
- **POST** `/api/lista-sdi-yam40` - Generar lista de SDI para YAM40
  - Input: `{ fechaInicioM40, fechaFinM40, tipoEstrategia, valorInicial }`
  - Output: Array de meses con SDI calculado

### MercadoPago
- **POST** `/api/orders` - Crear orden de compra
- **POST** `/api/mercadopago/preference` - Crear preferencia de pago
- **POST** `/api/webhooks/mercadopago` - Webhook de notificaciones

## 🧮 Lógica de Cálculo de Pensiones

### Constantes Base (Ley 73 IMSS)

#### UMA 2025
- **Valor base**: $113.07 MXN
- **Proyección**: +5% anual

#### Tasa M40 (Escalonada hasta 2030)
```javascript
2025: 13.347%
2026: 14.42%
2027: 15.5%
2028: 16.5%
2029: 17.7%
2030+: 18.8% (fija)
```

#### Factores de Edad (Art. 171)
```javascript
60 años: 0.75 (75%)
61 años: 0.80
62 años: 0.85
63 años: 0.90
64 años: 0.95
65 años: 1.00 (100%)
```

#### Asignaciones Familiares (Art. 164)
- Cónyuge: +15%
- Ninguno: 0%

#### Ley Fox
- Incremento adicional: +11%

### Proceso de Cálculo

1. **Cálculo de SDI Promedio**: Promedio de últimas 250 semanas
2. **Cuantía Básica (CB%)**: Según Tabla Art. 167 (basado en SDI/UMA)
3. **Incrementos Anuales**: Por años arriba de 500 semanas
4. **Porcentaje Pensión**: CB% + Incrementos
5. **Pensión Base**: SDI Promedio × Porcentaje Pensión
6. **Factor de Edad**: Aplicar según edad de jubilación
7. **Ley Fox**: Incremento 11%
8. **Asignaciones**: Dependientes económicos
9. **Pensión Final**: Suma de todos los factores

## 🔐 Sistema de Autenticación

### Providers
- **Email/Password**: Con bcrypt
- **Google OAuth**: Con @auth/prisma-adapter

### Sesión
- **Estrategia**: JWT
- **Datos en token**: id, email, subscription, hasUsedFreeStrategy

### Rutas Protegidas
- `/dashboard` - Requiere autenticación
- `/mis-estrategias` - Requiere autenticación
- `/admin` - Requiere rol admin (futuro)

## 📦 Instalación y Configuración

### 1. Clonar e Instalar

```bash
git clone <repository-url>
cd m40
npm install
```

### 2. Variables de Entorno

Crear `.env.local`:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-random-secret>"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN="..."
MERCADOPAGO_PUBLIC_KEY="..."
MERCADOPAGO_WEBHOOK_SECRET="..." (opcional)
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### 5. Producción

```bash
npm run build
npm start
```

## 🚀 Deployment (Vercel)

1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. Deploy automático en cada push a `main`

### Webhooks MercadoPago en Producción

Configurar en panel de MercadoPago:
- URL: `https://<your-domain>/api/webhooks/mercadopago`
- Eventos: `payment.created`, `payment.updated`, `merchant_order`

## 📊 Métricas y Analytics

- **Vercel Analytics**: Tracking automático de visitas y performance
- **Tracking interno**:
  - Visualizaciones de estrategias
  - Tiempo de cálculo
  - Conversiones de compra

## 🧪 Testing

### Endpoints de Testing
- `/api/test-mercadopago` - Probar integración MP
- `/api/test-webhook` - Simular webhook
- `/api/debug-webhook` - Debug webhooks

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📝 Licencia

Este proyecto es privado y confidencial.

---

**Última actualización**: Febrero 2025
**Versión**: 2.0.0
