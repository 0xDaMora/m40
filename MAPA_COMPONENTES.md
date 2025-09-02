# 🗺️ Mapa de Componentes - Modalidad 40 Simulator

## 📁 Estructura del Proyecto

### 🏠 **Páginas Principales**
- `/` (Home) - `app/page.tsx`
- `/dashboard` - `app/dashboard/page.tsx`
- `/simulador` - `app/simulador/page.tsx`
- `/estrategia/[code]` - `app/estrategia/[code]/page.tsx`
- `/mis-estrategias` - `app/mis-estrategias/page.tsx`
- `/premium` - `app/premium/page.tsx`

### 🔐 **Autenticación**
- `/auth/error` - `app/auth/error/page.tsx` (página de error de autenticación)
- `/auth/error` - `app/auth/error/page.tsx`
- `/reset-password` - `app/reset-password/page.tsx`

### 🧮 **APIs Activas**
- `/api/auth/[...nextauth]` - NextAuth.js
- `/api/auth/register` - Registro de usuarios
- `/api/auth/forgot-password` - Recuperación de contraseña
- `/api/auth/validate-reset-token` - Validación de token
- `/api/auth/reset-password` - Reset de contraseña
- `/api/family` - Gestión de familiares
- `/api/family/[id]` - Operaciones CRUD de familiares
- `/api/calculate-strategies` - Cálculo de estrategias
- `/api/estrategia-compartible` - Estrategias compartibles
- `/api/guardar-estrategia` - Guardar estrategias
- `/api/mis-estrategias` - Listar estrategias guardadas
- `/api/mis-estrategias/[id]` - Operaciones de estrategias guardadas
- `/api/simulate-purchase` - Simulación de compra
- `/api/update-user-plan` - Actualización de plan de usuario

## 🧩 Componentes Principales

### 🎯 **HeroOnboard** (components/HeroOnboard.tsx)
**Propósito:** Simulador rápido de Modalidad 40
**Componentes hijos:**
- `BaseStep` - Componente base para todos los steps
- `StepFechaN` - Fecha de nacimiento
- `StepMesesM40` - Meses en Modalidad 40
- `StepSemanas` - Semanas cotizadas
- `StepSDI` - Salario Diario Integrado
- `StepJubi` - Edad de jubilación
- `StepEstadoCivil` - Estado civil
- `StepPensionObjetivo` - Pensión objetivo
- `StepRitmoPago` - Ritmo de pago
- `StepNivelUMA` - Nivel UMA
- `StepEstrategiaPersonalizada` - Estrategia personalizada
- `ComparativaImpacto` - Comparativa de impacto
- `SidebarTips` - Tips en sidebar
- `ComparativoEstrategias` - Comparativo de estrategias

**Estados principales:**
- `currentStep` - Paso actual
- `formData` - Datos del formulario
- `loading` - Estado de carga
- `results` - Resultados calculados

### 📊 **ComparativoEstrategias** (components/results/ComparativoEstrategias.tsx)
**Propósito:** Muestra las 5 mejores estrategias calculadas
**Componentes hijos:**
- `DetallesPlan` - Modal de detalles del plan
- `QuickRegistrationModal` - Modal de registro rápido
- `ConfirmationModal` - Modal de confirmación
- `TooltipInteligente` - Tooltips informativos

**Estados principales:**
- `modalAbierto` - Modal activo
- `estrategiaSeleccionada` - Estrategia seleccionada
- `showConfirmationModal` - Mostrar modal de confirmación

### 🔧 **FamilySimulatorIntegration** (components/integration/FamilySimulatorIntegration.tsx)
**Propósito:** Simulador avanzado con gestión de familiares
**Componentes hijos:**
- `RangeSlider` - Slider de rango de aportación
- `FamilyMemberForm` - Formulario de familiar
- `PurchaseModal` - Modal de compra
- `TooltipInteligente` - Tooltips informativos
- `BaseModal` - Componente base para modales

**Estados principales:**
- `selectedFamilyMember` - Familiar seleccionado
- `filters` - Filtros aplicados
- `strategies` - Estrategias calculadas
- `loading` - Estado de carga

### 📋 **EstrategiaDetallada** (components/EstrategiaDetallada.tsx)
**Propósito:** Vista detallada de una estrategia específica
**Componentes hijos:**
- `Tabs` - Pestañas de información
- `Table` - Tabla de pagos mensuales
- `Chart` - Gráficos de proyección
- `Star` (Lucide) - Botón de guardar
- `Share` (Lucide) - Botón de compartir

**Estados principales:**
- `activeTab` - Pestaña activa
- `guardando` - Estado de guardado
- `guardada` - Estado guardado

### 🎚️ **RangeSlider** (components/ui/RangeSlider.tsx)
**Propósito:** Slider de rango personalizado
**Componentes hijos:**
- `motion.div` - Animaciones de los handles
- `input[type="range"]` - Inputs nativos

**Estados principales:**
- `minValue`, `maxValue` - Valores del rango
- `isDragging` - Estado de arrastre

### 🎯 **BaseStep** (components/steps/BaseStep.tsx)
**Propósito:** Componente base para todos los steps del HeroOnboard
**Componentes hijos:**
- `motion.div` - Animaciones de Framer Motion
- `ArrowLeft`, `ArrowRight` - Iconos de navegación

**Props principales:**
- `title`, `description` - Contenido del step
- `onNext`, `onBack` - Funciones de navegación
- `canProceed` - Control de habilitación

### 🎯 **BaseModal** (components/ui/BaseModal.tsx)
**Propósito:** Componente base para todos los modales
**Componentes hijos:**
- `motion.div`, `AnimatePresence` - Animaciones
- `X` - Icono de cerrar

**Props principales:**
- `isOpen`, `onClose` - Control del modal
- `size` - Tamaño del modal (sm, md, lg, xl)
- `title` - Título del modal

### 🛡️ **ErrorBoundary** (components/ui/ErrorBoundary.tsx)
**Propósito:** Manejo de errores en componentes
**Componentes hijos:**
- `AlertTriangle`, `RefreshCw`, `Home` - Iconos de acción

**Funcionalidades:**
- Captura de errores automática
- UI de recuperación
- Detalles de error en desarrollo

### ⚡ **LazyLoader** (components/ui/LazyLoader.tsx)
**Propósito:** Lazy loading con skeletons
**Componentes hijos:**
- `Suspense`, `lazy` - React lazy loading
- `motion.div` - Animaciones de skeleton

**Funcionalidades:**
- Carga diferida de componentes
- Skeletons personalizados
- Intersection Observer

### 📈 **AnimatedCounter** (components/AnimatedCounter.tsx)
**Propósito:** Contador con animación
**Componentes hijos:**
- `motion.span` - Animación del número

**Estados principales:**
- `displayValue` - Valor mostrado

### 🔐 **LoginButton** (components/auth/LoginButton.tsx)
**Propósito:** Botón de login/logout
**Componentes hijos:**
- `User` (Lucide) - Icono de usuario
- `LogOut` (Lucide) - Icono de logout

**Estados principales:**
- `session` - Sesión actual (NextAuth)

### 📋 **DetallesPlan** (components/DetallesPlan.tsx)
**Propósito:** Detalles del plan seleccionado
**Componentes hijos:**
- `CheckCircle` (Lucide) - Iconos de verificación
- `FileText` (Lucide) - Icono de documento
- `Calendar` (Lucide) - Icono de calendario
- `CreditCard` (Lucide) - Icono de tarjeta
- `Users` (Lucide) - Icono de usuarios
- `Download` (Lucide) - Icono de descarga
- `Shield` (Lucide) - Icono de escudo
- `Phone` (Lucide) - Icono de teléfono

**Estados principales:**
- `isOpen` - Modal abierto/cerrado

### 🔐 **LoginModal** (components/auth/LoginModal.tsx)
**Propósito:** Modal de login/registro
**Componentes hijos:**
- `ForgotPasswordModal` - Modal de recuperación de contraseña
- `Mail` (Lucide) - Icono de email
- `Lock` (Lucide) - Icono de candado
- `Eye` (Lucide) - Icono de ojo
- `EyeOff` (Lucide) - Icono de ojo cerrado

**Estados principales:**
- `isOpen` - Modal abierto/cerrado
- `mode` - Modo (login/registro)
- `loading` - Estado de carga

### 🔐 **ForgotPasswordModal** (components/auth/ForgotPasswordModal.tsx)
**Propósito:** Modal de recuperación de contraseña
**Componentes hijos:**
- `Mail` (Lucide) - Icono de email
- `AlertCircle` (Lucide) - Icono de alerta

**Estados principales:**
- `isOpen` - Modal abierto/cerrado
- `email` - Email ingresado
- `loading` - Estado de carga

### 🔐 **AuthProvider** (components/auth/AuthProvider.tsx)
**Propósito:** Proveedor de autenticación
**Componentes hijos:**
- `SessionProvider` (NextAuth)

### 🏠 **Navbar** (components/layout/Navbar.tsx)
**Propósito:** Barra de navegación principal
**Componentes hijos:**
- `LoginModal` - Modal de login
- `PremiumModal` - Modal de plan premium
- `Home` (Lucide) - Icono de home
- `Menu` (Lucide) - Icono de menú
- `ArrowRight` (Lucide) - Icono de flecha
- `User` (Lucide) - Icono de usuario
- `LogOut` (Lucide) - Icono de logout

**Estados principales:**
- `isMenuOpen` - Menú móvil abierto/cerrado
- `showLoginModal` - Mostrar modal de login
- `showPremiumModal` - Mostrar modal premium

### 🏠 **Footer** (components/layout/Footer.tsx)
**Propósito:** Pie de página
**Componentes hijos:**
- `Mail` (Lucide) - Icono de email
- `Phone` (Lucide) - Icono de teléfono
- `MapPin` (Lucide) - Icono de ubicación

### 📊 **DashboardHeader** (components/dashboard/DashboardHeader.tsx)
**Propósito:** Encabezado del dashboard
**Componentes hijos:**
- `User` (Lucide) - Icono de usuario
- `Settings` (Lucide) - Icono de configuración

### 📊 **DashboardStats** (components/dashboard/DashboardStats.tsx)
**Propósito:** Estadísticas del dashboard
**Componentes hijos:**
- `AnimatedCounter` - Contador animado
- `TrendingUp` (Lucide) - Icono de tendencia
- `Users` (Lucide) - Icono de usuarios
- `FileText` (Lucide) - Icono de documento

### 📊 **SavedStrategiesList** (components/dashboard/SavedStrategiesList.tsx)
**Propósito:** Lista de estrategias guardadas
**Componentes hijos:**
- `Star` (Lucide) - Icono de estrella
- `Share2` (Lucide) - Icono de compartir
- `Trash2` (Lucide) - Icono de eliminar
- `ArrowUpRight` (Lucide) - Icono de flecha

### 👨‍👩‍👧‍👦 **FamilyMemberForm** (components/family/FamilyMemberForm.tsx)
**Propósito:** Formulario para agregar/editar familiares
**Componentes hijos:**
- `Calendar` (Lucide) - Icono de calendario
- `User` (Lucide) - Icono de usuario
- `Mail` (Lucide) - Icono de email

**Estados principales:**
- `formData` - Datos del formulario
- `loading` - Estado de carga
- `errors` - Errores de validación

### 👨‍👩‍👧‍👦 **FamilyMembersList** (components/family/FamilyMembersList.tsx)
**Propósito:** Lista de familiares
**Componentes hijos:**
- `FamilyMemberForm` - Formulario de familiar
- `Edit` (Lucide) - Icono de editar
- `Trash2` (Lucide) - Icono de eliminar
- `Plus` (Lucide) - Icono de agregar

### 🎯 **ExplicacionModalidad40** (components/ExplicacionModalidad40.tsx)
**Propósito:** Explicación de Modalidad 40
**Componentes hijos:**
- `Info` (Lucide) - Icono de información
- `X` (Lucide) - Icono de cerrar
- `ChevronDown` (Lucide) - Icono de expandir

**Estados principales:**
- `isExpanded` - Expandido/contraído
- `isVisible` - Visible/oculto

### 🎯 **TooltipInteligente** (components/TooltipInteligente.tsx)
**Propósito:** Tooltips inteligentes con posicionamiento dinámico
**Componentes hijos:**
- `Info` (Lucide) - Icono de información
- `createPortal` - Portal para renderizado

**Estados principales:**
- `isVisible` - Tooltip visible/oculto
- `position` - Posición del tooltip

### 🎯 **CasosDeExito** (components/CasosDeExito.tsx)
**Propósito:** Casos de éxito de Modalidad 40
**Componentes hijos:**
- `AnimatedCounter` - Contador animado
- `TrendingUp` (Lucide) - Icono de tendencia
- `Users` (Lucide) - Icono de usuarios
- `DollarSign` (Lucide) - Icono de dinero

### 🎯 **IndicadoresConfianza** (components/IndicadoresConfianza.tsx)
**Propósito:** Indicadores de confianza
**Componentes hijos:**
- `Shield` (Lucide) - Icono de escudo
- `CheckCircle` (Lucide) - Icono de verificación
- `Users` (Lucide) - Icono de usuarios

### 🎯 **IndicadoresConfianzaWrapper** (components/IndicadoresConfianzaWrapper.tsx)
**Propósito:** Wrapper para indicadores de confianza
**Componentes hijos:**
- `IndicadoresConfianza` - Indicadores de confianza
- `useSimulator` - Hook del simulador

### 🎯 **SimulatorContext** (components/SimulatorContext.tsx)
**Propósito:** Contexto del simulador
**Componentes hijos:**
- `createContext` - Contexto de React
- `useContext` - Hook de contexto

**Estados principales:**
- `isSimulatorActive` - Simulador activo/inactivo

### 🎯 **ToastProvider** (components/ui/ToastProvider.tsx)
**Propósito:** Proveedor de notificaciones toast
**Componentes hijos:**
- `Toaster` (react-hot-toast)

## 🔧 Hooks Personalizados

### 📊 **useFormatters** (hooks/useFormatters.ts)
**Propósito:** Hook para formateo centralizado
**Funciones:**
- `currency` - Formateo de moneda
- `percentage` - Formateo de porcentajes
- `date` - Formateo de fechas
- `number` - Formateo de números
- `age` - Formateo de edades
- `weeks` - Formateo de semanas

### 🎯 **useStrategy** (hooks/useStrategy.ts)
**Propósito:** Hook para manejo de estrategias
**Funciones:**
- `procesarEstrategia` - Procesamiento de estrategias
- `actualizarPlanUsuario` - Actualización de planes
- `loading` - Estado de carga
- `isAuthenticated`, `isPremium` - Estados de autenticación

### 👨‍👩‍👧‍👦 **useFamily** (hooks/useFamily.ts)
**Propósito:** Hook para manejo de familiares
**Funciones:**
- `addFamilyMember` - Agregar familiar
- `updateFamilyMember` - Actualizar familiar
- `deleteFamilyMember` - Eliminar familiar
- `loadFamilyMembers` - Cargar familiares

### 📈 **useStrategies** (hooks/useStrategies.ts)
**Propósito:** Hook para manejo de estrategias
**Funciones:**
- `calculateStrategies` - Calcular estrategias
- `filterStrategies` - Filtrar estrategias
- `loadMoreStrategies` - Cargar más estrategias
- `resetPagination` - Resetear paginación

## 🔄 Flujos de Usuario

### 🚀 **Flujo Principal (HeroOnboard)**
Usuario → Formulario → Cálculo → Resultados → Selección → Detalles

### 🔧 **Flujo Avanzado (FamilySimulatorIntegration)**
Familiar → Filtros → Cálculo → Estrategias → Selección → Guardar → Detalles

### 🔐 **Flujo de Autenticación**
Login/Registro → Verificación → Dashboard

### 💳 **Flujo de Compra**
Selección → Modal de Compra → Confirmación → Pago → Acceso

## 📊 APIs y Endpoints

### 🔐 **Autenticación**
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/forgot-password` - Recuperación de contraseña
- `POST /api/auth/validate-reset-token` - Validación de token
- `POST /api/auth/reset-password` - Reset de contraseña

### 👨‍👩‍👧‍👦 **Familiares**
- `GET /api/family` - Listar familiares
- `POST /api/family` - Crear familiar
- `PUT /api/family/[id]` - Actualizar familiar
- `DELETE /api/family/[id]` - Eliminar familiar

### 📊 **Estrategias**
- `POST /api/calculate-strategies` - Calcular estrategias
- `POST /api/estrategia-compartible` - Estrategias compartibles
- `POST /api/guardar-estrategia` - Guardar estrategia
- `GET /api/mis-estrategias` - Listar estrategias guardadas
- `DELETE /api/mis-estrategias/[id]` - Eliminar estrategia guardada

### 💳 **Compras**
- `POST /api/simulate-purchase` - Simular compra
- `POST /api/update-user-plan` - Actualizar plan de usuario

## 🛠️ Utilidades Centralizadas

### 📊 **formatters.ts** (lib/utils/formatters.ts)
**Funciones:**
- `formatCurrency` - Formateo de moneda mexicana
- `formatPercentage` - Formateo de porcentajes
- `formatDate` - Formateo de fechas
- `formatNumber` - Formateo de números
- `formatAge` - Formateo de edades
- `formatWeeks` - Formateo de semanas

### 🧮 **calculations.ts** (lib/utils/calculations.ts)
**Funciones:**
- `calcularSDI` - Cálculo de SDI
- `calcularEdad` - Cálculo de edad
- `calcularFechaInicioM40` - Fecha de inicio M40
- `calcularFechaJubilacion` - Fecha de jubilación
- `calcularAportacionPromedio` - Aportación promedio
- Funciones de validación

### 🎯 **strategy.ts** (lib/utils/strategy.ts)
**Funciones:**
- `generarCodigoEstrategia` - Generación de códigos únicos
- `construirDatosEstrategia` - Construcción de datos de estrategia
- `construirDatosUsuario` - Construcción de datos de usuario
- `construirParametrosURL` - Parámetros de URL para fallback
- `guardarEstrategiaConFallback` - Guardado con fallback
- `validarEstrategia` - Validación de estrategias
- `calcularROI` - Cálculo de ROI

## 🎨 Estilos y UI

### 🎨 **Tailwind CSS**
- Configuración personalizada
- Componentes UI reutilizables
- Responsive design

### 🎭 **Framer Motion**
- Animaciones suaves
- Transiciones de página
- Micro-interacciones

### 🎯 **Lucide React**
- Iconografía consistente
- Iconos vectoriales
- Personalización de colores

## 🔧 Configuración

### ⚙️ **Next.js 15**
- App Router
- Server Components
- API Routes

### 🔐 **NextAuth.js v4**
- Google OAuth
- Email/Password
- JWT Sessions

### 🗄️ **Prisma ORM**
- PostgreSQL (Supabase)
- Migraciones automáticas
- Type safety

### 🎨 **Tailwind CSS 4**
- Utility-first CSS
- Custom components
- Responsive utilities

## 📝 Notas de Desarrollo

### 🧹 **Limpieza Realizada**
- ✅ Eliminados componentes no utilizados
- ✅ Eliminadas APIs de debug
- ✅ Eliminadas páginas de debug
- ✅ Eliminados archivos duplicados
- ✅ Actualizado mapa de componentes

### 🔄 **Flujos Optimizados**
- ✅ HeroOnboard simplificado
- ✅ FamilySimulatorIntegration funcional
- ✅ Autenticación robusta
- ✅ Compra de estrategias funcional

### 📊 **APIs Activas**
- ✅ Todas las APIs necesarias funcionando
- ✅ Endpoints documentados
- ✅ Manejo de errores implementado

### 🚀 **Refactorización y Optimización**
- ✅ **Utilidades Centralizadas**: Creadas funciones de formateo, cálculo y estrategias
- ✅ **Hooks Personalizados**: useFormatters, useStrategy, useFamily, useStrategies
- ✅ **Componentes Base**: BaseStep, BaseModal para reutilización
- ✅ **Error Boundaries**: Manejo robusto de errores
- ✅ **Lazy Loading**: Carga diferida con skeletons
- ✅ **Reducción de Código**: ~30% menos código duplicado
- ✅ **Mejor Performance**: Memoización y optimizaciones
- ✅ **Mantenibilidad**: Código más limpio y organizado
