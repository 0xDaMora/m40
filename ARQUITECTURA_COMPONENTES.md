# Arquitectura y Componentes del Sistema

## 📋 Tabla de Contenidos

1. [Componentes Principales](#componentes-principales)
2. [Componentes YAM40](#componentes-yam40)
3. [Hooks Personalizados](#hooks-personalizados)
4. [Sistema de Estados](#sistema-de-estados)
5. [Lógica de Negocio](#lógica-de-negocio)

---

## 🎯 Componentes Principales

### 1. HeroOnboard.tsx

**Ubicación**: `components/HeroOnboard.tsx`  
**Propósito**: Simulador rápido en landing page para captar usuarios sin registro

#### Características
- **5 pasos simples**: Nacimiento, edad jubilación, semanas, salario, estado civil
- **Cálculo automático**: Al completar el paso 5
- **Migración de datos**: Guarda en localStorage para transferir a simulador completo
- **Sin autenticación requerida**

#### Flujo de Datos
```typescript
respuestas = {
  Nacimiento: "1970-01-15",
  "Edad de Jubilacion": "65",
  Semanas: "800",
  sdi: "492.76",  // SDI diario calculado
  salarioBruto: "15000",  // Salario mensual bruto original
  "Estado Civil": "conyuge" | "ninguno"
}

// Transform para API
datosUsuario = {
  edad: 65,
  dependiente: "conyuge" | "ninguno",
  estadoCivil: "casado" | "soltero",
  sdiHistorico: 492.76,
  semanasPrevias: 800,
  fechaNacimiento: "1970-01-15",
  inicioM40: "2025-03-01"
}
```

#### Componentes Steps
- `StepFechaN.tsx` - Selector de fecha de nacimiento con validación
- `StepJubi.tsx` - Edad de jubilación (60-65 años)
- `StepSemanas.tsx` - Semanas cotizadas (mínimo 500)
- `StepSDI.tsx` - Salario mensual bruto → convierte a SDI
- `StepEstadoCivil.tsx` - Estado civil para asignaciones

#### Resultado
**Componente**: `HeroOnboardStrategiesView.tsx`
- Recibe `datosUsuario` del HeroOnboard
- Llama a `/api/calculate-strategies` con `monthsMode: 'scan'`
- Muestra top estrategias con filtros
- Botón para migrar a simulador completo

---

### 2. FamilySimulatorIntegration.tsx

**Ubicación**: `components/integration/FamilySimulatorIntegration.tsx`  
**Propósito**: Simulador completo profesional con gestión de familiares

#### Arquitectura Modular

##### Hooks Utilizados
```typescript
// Gestión de familiares
const { 
  familyMembers, 
  selectedFamilyMember, 
  selectFamilyMember,
  ...
} = useFamilyManagement()

// Cálculo de estrategias
const { 
  strategies, 
  loading, 
  calculateStrategies 
} = useStrategyCalculation()

// Filtrado de estrategias
const { useFilteredStrategies } = useStrategyFiltering()

// Paginación
const { 
  displayedStrategies, 
  hasMoreStrategies, 
  loadMoreStrategies 
} = usePagination({ strategies })

// Gestión de modales
const { 
  showStrategyPurchaseModal,
  openStrategyPurchaseModal,
  ...
} = useModalManager()
```

##### Componentes Hijos

**FamilySelector** (`components/integration/components/FamilySelector.tsx`)
- Lista de familiares existentes
- Botón para agregar nuevo
- Formulario modal de creación
- Fecha óptima de inicio calculada

**StrategyFiltersPanel** (`components/integration/components/StrategyFilters.tsx`)
- Rango de aportación mensual (slider)
- Meses en M40 (1-58)
- Edad de jubilación (60-65)
- Fecha de inicio personalizada

**StrategyList** (`components/integration/components/StrategyList.tsx`)
- Filtros adicionales:
  - Tipo de estrategia (fijo/progresivo)
  - Rango UMA (1-25)
  - Rango de meses
- Ordenamiento: ROI, pensión, inversión, meses
- Vista card/row adaptativa

**PaginationControls**
- Carga progresiva (25 estrategias por página)
- Contador: "Mostrando X de Y"
- Botón "Cargar más"

#### Flujo de Cálculo

```typescript
// 1. Usuario selecciona familiar
selectFamilyMember(familiar)

// 2. Se activan filtros con debounce (500ms)
useEffect(() => {
  if (selectedFamilyMember) {
    const timer = setTimeout(() => {
      calculateStrategies()
    }, 500)
    return () => clearTimeout(timer)
  }
}, [filters, selectedFamilyMember])

// 3. Cálculo de estrategias
async function calculateStrategies() {
  const response = await fetch('/api/calculate-strategies', {
    method: 'POST',
    body: JSON.stringify({
      familyData: {
        id: selectedFamilyMember.id,
        name: selectedFamilyMember.name,
        birthDate: selectedFamilyMember.birthDate,
        weeksContributed: selectedFamilyMember.weeksContributed,
        lastGrossSalary: selectedFamilyMember.lastGrossSalary,
        civilStatus: selectedFamilyMember.civilStatus
      },
      filters: {
        monthlyContributionRange: { min, max },
        months: 58,
        retirementAge: 65,
        startMonth: 3,
        startYear: 2025,
        monthsMode: 'scan' // Generar TODAS las estrategias
      }
    })
  })
  
  const { strategies } = await response.json()
  setStrategies(strategies)
}

// 4. Filtrado local (no recalcula)
const filteredStrategies = useFilteredStrategies(
  strategies, 
  strategyFilters, 
  selectedFamilyMember
)

// 5. Paginación
const displayedStrategies = filteredStrategies.slice(0, page * 25)
```

#### Acciones sobre Estrategias

**Ver Detalles**
```typescript
async function viewStrategyDetails(strategy) {
  // Solo premium puede ver detalles
  if (userPlan !== 'premium') {
    openPremiumModal()
    return
  }
  
  // Generar código único de estrategia
  const strategyCode = generarCodigoEstrategia('integration', {
    familyMemberId,
    estrategia: strategy.estrategia,
    umaElegida: strategy.umaElegida,
    mesesM40: strategy.mesesM40,
    edadJubilacion: filters.retirementAge,
    inicioM40: fechaInicio
  })
  
  // Guardar y redirigir
  await fetch('/api/guardar-estrategia', {
    method: 'POST',
    body: JSON.stringify({ debugCode: strategyCode, ... })
  })
  
  router.push(`/estrategia/${strategyCode}`)
}
```

**Descargar PDF**
```typescript
function downloadStrategyPDF(strategy) {
  const strategyCode = generarCodigoEstrategia(...)
  const params = new URLSearchParams({
    code: strategyCode,
    download: 'true',
    nombreFamiliar: selectedFamilyMember.name,
    ...
  })
  window.open(`/estrategia/${strategyCode}?${params}`, '_blank')
}
```

**Comprar Estrategia**
```typescript
async function handleConfirmStrategyPurchase(strategy, familyMember) {
  // 1. Guardar estrategia en BD
  const strategyCode = generarCodigoEstrategia(...)
  await fetch('/api/guardar-estrategia', { ... })
  
  // 2. Redirigir a estrategia guardada
  router.push(`/estrategia/${strategyCode}`)
}
```

---

## 🔄 Componentes YAM40

### 1. YaM40FlowSimplified.tsx

**Ubicación**: `components/yam40/YaM40FlowSimplified.tsx`  
**Propósito**: Flujo para usuarios que YA están pagando Modalidad 40

#### Estructura de 3 Pasos

```typescript
type Step = 'profile' | 'payments' | 'result'

const [currentStep, setCurrentStep] = useState<Step>('profile')
```

#### Estado Principal

```typescript
const [state, setState] = useState<YaM40State>({
  profile: {
    name: string
    birthDate: Date | null
    retirementAge: number  // 60-65
    totalWeeksContributed: number  // Semanas ANTES de M40
    civilStatus: 'soltero' | 'casado'
  },
  sdiHistorico: {
    value: number  // Salario bruto mensual antes de M40
    isDirectSDI: false
  },
  mesesPagados: [],
  mesesConSDI: MesConSDI[],
  modoEntradaPagos: 'rango' | 'manual',
  mesesManuales: MesManual[]
})
```

#### Paso 1: Perfil (UserProfileCard.tsx)

Campos:
- Nombre completo
- Fecha de nacimiento
- Edad de jubilación deseada
- Semanas cotizadas ANTES de M40
- Estado civil
- Salario mensual bruto histórico (antes de M40)

#### Paso 2: Pagos (PaymentModeSelector.tsx)

**Modo Rango** (más común)
```typescript
{
  fechaInicioM40: { mes: 2, año: 2024 },
  fechaFinM40: { mes: 12, año: 2025 },
  paymentMethod: 'aportacion' | 'uma',
  paymentValue: 5000  // $5000 MXN o 15 UMA
}
```

**Modo Manual** (para pagos irregulares)
```typescript
mesesManuales: [
  { mes: 2, año: 2024, aportacion: 5000 },
  { mes: 3, año: 2024, aportacion: 5500 },
  { mes: 5, año: 2024, aportacion: 4800 },
  // ...
]
```

#### Paso 3: Resultado (SimplePensionCard.tsx)

**Cálculo de Pensión Actual**
```typescript
// Llamada a API para generar lista SDI
const listaSDIResponse = await fetch('/api/lista-sdi-yam40', {
  method: 'POST',
  body: JSON.stringify({
    fechaInicioM40,
    fechaFinM40,
    tipoEstrategia: paymentMethod === 'aportacion' ? 'fija' : 'progresiva',
    valorInicial: paymentValue
  })
})

const { listaSDI } = await listaSDIResponse.json()

// Cálculo con calculator YAM40
const resultado = calcularEscenarioYam40Recrear({
  fechaNacimiento: state.profile.birthDate,
  semanasPrevias: state.profile.totalWeeksContributed,
  sdiHistorico: state.sdiHistorico.value / 30.4,
  fechaInicioM40,
  fechaFinM40,
  edadJubilacion: state.profile.retirementAge,
  dependiente: state.profile.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
  listaSDI
})
```

**Resultado Mostrado**
```typescript
{
  pensionMensual: 12500,
  pensionConAguinaldo: 13541,
  ROI: 245%,
  recuperacionMeses: 18,
  inversionTotal: 85000,
  mesesM40: 18,
  estrategia: 'fija',
  umaElegida: 15,
  semanasTotales: 876,
  sdiPromedio: 620.50,
  porcentajePension: 65%
}
```

### 2. Yam40MejorasEstrategia.tsx

**Propósito**: Calcular estrategias futuras para mejorar pensión actual

#### Validaciones de Limitantes

**Limitante de Reingreso**: 12 meses entre baja y reingreso
```typescript
function calcularMesesFaltantesReingreso(ultimaFechaPago) {
  const fechaActual = new Date()
  const diferenciaMeses = 
    (fechaActual.getFullYear() - ultimaFechaPago.año) * 12 +
    (fechaActual.getMonth() + 1 - ultimaFechaPago.mes)
  
  return Math.max(0, 12 - diferenciaMeses)
}
```

**Limitante de Retroactivos**: Máximo 6 meses retroactivos
```typescript
function calcularMesesRetroactivosDisponibles(ultimaFechaPago) {
  const fechaActual = new Date()
  const mesesDesdeUltimoPago = ...
  
  // Solo primeros 6 meses pueden ser retroactivos
  return Math.min(6, mesesDesdeUltimoPago)
}
```

#### Cálculo de Mejoras

```typescript
// 1. Obtener pensión actual
const pensionActual = state.pensionActual?.pensionMensual || 0

// 2. Calcular meses disponibles para mejora
const mesesDisponibles = calcularMesesDisponiblesParaMejora(
  state.mesesConSDI,
  state.profile.birthDate,
  state.profile.retirementAge
)

// 3. Generar estrategias de mejora
const mejoras = await calcularEstrategiasFuturas({
  pensionActual,
  mesesPagados: state.mesesConSDI,
  mesesDisponibles,
  sdiHistorico: state.sdiHistorico.value / 30.4,
  ...
})

// 4. Mostrar comparativa
mejoras.forEach(mejora => {
  const incremento = mejora.pensionMensual - pensionActual
  const porcentajeIncremento = (incremento / pensionActual) * 100
  // Renderizar card con mejora
})
```

### 3. EstrategiaDetalladaYam40.tsx

**Diferencias con EstrategiaDetallada normal**:

1. **Manejo de meses pagados reales**: Usa `adaptarEstrategiaYam40()` para combinar meses históricos + futuros
2. **Cronograma ajustado**: Marca meses ya pagados vs pendientes
3. **Cálculos desde pensión actual**: Proyección desde pensión real, no estimada

```typescript
// Adaptación de estrategia YAM40
const estrategiaAdaptada = adaptarEstrategiaYam40({
  estrategiaBase,
  mesesPagados: state.mesesConSDI,
  datosUsuario: {
    fechaNacimiento: state.profile.birthDate,
    edadJubilacion: state.profile.retirementAge,
    ...
  }
})

// Genera registros completos incluyendo:
// - Meses pagados históricos (con datos reales)
// - Meses futuros planificados (con estimación)
```

---

## 🎣 Hooks Personalizados

### useFamilyManagement.ts

**Ubicación**: `components/integration/hooks/useFamilyManagement.ts`

```typescript
export function useFamilyManagement() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null)
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  
  // Cargar familiares al montar
  useEffect(() => {
    loadFamilyMembers()
  }, [session])
  
  async function loadFamilyMembers() {
    if (session) {
      // Usuario autenticado: cargar desde BD
      const response = await fetch('/api/family')
      const data = await response.json()
      setFamilyMembers(data)
    } else {
      // Usuario no autenticado: cargar desde localStorage
      const localFamily = localStorage.getItem('localFamilyMembers')
      if (localFamily) {
        setFamilyMembers(JSON.parse(localFamily))
      }
    }
  }
  
  function selectFamilyMember(member: FamilyMember) {
    setSelectedFamilyMember(member)
  }
  
  function handleFamilyFormSuccess(newMember: FamilyMember) {
    setFamilyMembers([...familyMembers, newMember])
    setSelectedFamilyMember(newMember)
    setShowFamilyForm(false)
  }
  
  return {
    familyMembers,
    selectedFamilyMember,
    showFamilyForm,
    selectFamilyMember,
    openFamilyForm: () => setShowFamilyForm(true),
    closeFamilyForm: () => setShowFamilyForm(false),
    handleFamilyFormSuccess,
    setSelectedFamilyMember
  }
}
```

### useStrategyCalculation.ts

**Ubicación**: `components/integration/hooks/useStrategyCalculation.ts`

```typescript
export function useStrategyCalculation() {
  const [strategies, setStrategies] = useState<StrategyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadTime, setLoadTime] = useState<number | null>(null)
  
  async function calculateStrategies(
    familyMember: FamilyMember,
    filters: IntegrationFilters
  ) {
    setLoading(true)
    const startTime = performance.now()
    
    try {
      const response = await fetch('/api/calculate-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyData: {
            id: familyMember.id,
            name: familyMember.name,
            birthDate: familyMember.birthDate,
            weeksContributed: familyMember.weeksContributed,
            lastGrossSalary: familyMember.lastGrossSalary,
            civilStatus: familyMember.civilStatus
          },
          filters: {
            ...filters,
            monthsMode: 'scan' // Importante: generar todas
          }
        })
      })
      
      const { strategies: calculatedStrategies } = await response.json()
      setStrategies(calculatedStrategies)
      
      const endTime = performance.now()
      setLoadTime(Math.round(endTime - startTime))
    } catch (error) {
      console.error('Error calculating strategies:', error)
      setStrategies([])
    } finally {
      setLoading(false)
    }
  }
  
  return {
    strategies,
    loading,
    loadTime,
    calculateStrategies,
    resetStrategies: () => setStrategies([]),
    setStrategies
  }
}
```

### useStrategyFiltering.ts

**Ubicación**: `components/integration/hooks/useStrategyFiltering.ts`

```typescript
export function useStrategyFiltering() {
  function useFilteredStrategies(
    strategies: StrategyResult[],
    filters: StrategyFilters,
    selectedFamilyMember: FamilyMember | null
  ) {
    return useMemo(() => {
      let filtered = [...strategies]
      
      // 1. Filtrar por tipo de estrategia
      if (filters.strategyType !== 'all') {
        filtered = filtered.filter(s => s.estrategia === filters.strategyType)
      }
      
      // 2. Filtrar por rango de meses
      filtered = filtered.filter(s => 
        s.mesesM40 >= filters.monthsRange.min &&
        s.mesesM40 <= filters.monthsRange.max
      )
      
      // 3. Filtrar por rango UMA
      filtered = filtered.filter(s =>
        s.umaElegida >= filters.umaRange.min &&
        s.umaElegida <= filters.umaRange.max
      )
      
      // 4. Filtro inteligente: UMA >= SDI actual del familiar
      if (selectedFamilyMember) {
        const sdiActual = selectedFamilyMember.lastGrossSalary / 30.4
        const umaActual = getUMA(new Date().getFullYear())
        const umaMinima = Math.ceil(sdiActual / umaActual)
        
        filtered = filtered.filter(s => s.umaElegida >= umaMinima)
      }
      
      // 5. Ordenar
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy] || 0
        const bValue = b[filters.sortBy] || 0
        return filters.sortOrder === 'desc' 
          ? bValue - aValue 
          : aValue - bValue
      })
      
      return filtered
    }, [strategies, filters, selectedFamilyMember])
  }
  
  return { useFilteredStrategies }
}
```

### usePagination.ts

**Ubicación**: `components/integration/hooks/usePagination.ts`

```typescript
export function usePagination({ 
  strategies, 
  strategiesPerPage = 25 
}: { 
  strategies: StrategyResult[]
  strategiesPerPage?: number 
}) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const displayedStrategies = useMemo(() => {
    return strategies.slice(0, currentPage * strategiesPerPage)
  }, [strategies, currentPage, strategiesPerPage])
  
  const hasMoreStrategies = displayedStrategies.length < strategies.length
  const remainingStrategies = strategies.length - displayedStrategies.length
  
  function loadMoreStrategies() {
    setCurrentPage(prev => prev + 1)
  }
  
  // Reset page cuando cambian las estrategias
  useEffect(() => {
    setCurrentPage(1)
  }, [strategies])
  
  return {
    displayedStrategies,
    currentPage,
    hasMoreStrategies,
    strategiesPerPage,
    loadMoreStrategies,
    remainingStrategies,
    totalStrategies: strategies.length
  }
}
```

---

## 🔐 Sistema de Estados y Context

### SimulatorContext.tsx

```typescript
const SimulatorContext = createContext({
  isSimulatorActive: false,
  setIsSimulatorActive: (active: boolean) => {}
})

export function SimulatorProvider({ children }) {
  const [isSimulatorActive, setIsSimulatorActive] = useState(false)
  
  return (
    <SimulatorContext.Provider value={{ 
      isSimulatorActive, 
      setIsSimulatorActive 
    }}>
      {children}
    </SimulatorContext.Provider>
  )
}

// Usado en HeroOnboard para ocultar footer/navbar cuando está activo
```

### NextAuth Session

```typescript
// Extendido en types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      authProvider: string
      subscription: 'free' | 'basic' | 'premium'
      hasUsedFreeStrategy: boolean
    }
  }
}

// Uso en componentes
const { data: session } = useSession()
const userPlan = session?.user?.subscription || 'free'
const hasUsedFree = session?.user?.hasUsedFreeStrategy || false
```

---

## 📊 Generación de Códigos de Estrategia

### Formato de Códigos

```typescript
// lib/utils/strategy.ts

export function generarCodigoEstrategia(
  source: 'integration' | 'yam40' | 'compra',
  params: {
    familyMemberId?: string
    estrategia: 'fijo' | 'progresivo'
    umaElegida: number
    mesesM40: number
    edadJubilacion: number
    inicioM40: string  // YYYY-MM-DD
  }
): string {
  if (source === 'integration') {
    const [año, mes] = params.inicioM40.split('-')
    const mesAño = `${mes}${año}`
    
    return `integration_${params.familyMemberId}_${params.estrategia}_${params.umaElegida}_${params.mesesM40}_${params.edadJubilacion}_${mesAño}`
  }
  
  if (source === 'yam40') {
    const timestamp = Date.now()
    return `yam40_${params.estrategia}_${params.umaElegida}_${params.mesesM40}_${timestamp}`
  }
  
  // compra
  const random = Math.random().toString(36).substring(7)
  return `compra_${Date.now()}_${random}`
}

// Ejemplos de códigos generados:
// integration_clx123abc_fijo_15_36_65_022025
// yam40_progresivo_20_48_1709567890123
// compra_1709567890123_x7k9m2p
```

---

**Última actualización**: Febrero 2025
