# Guía de Integración - Componentes Simplificados yam40

## Resumen

Esta guía explica cómo integrar los nuevos componentes simplificados en el flujo de yam40 para mejorar la experiencia de usuario, especialmente para usuarios no técnicos (50-60 años).

## Componentes Disponibles

### 1. SimplePensionCard
**Ubicación:** `components/yam40/simple/SimplePensionCard.tsx`

**Uso:**
```tsx
import SimplePensionCard from "@/components/yam40/simple/SimplePensionCard"

<SimplePensionCard
  pensionActual={pensionActual}
  loading={false}
  mesesPagados={mesesPagadosCount}
  onVerMejoras={() => setShowImprovements(true)}
/>
```

**Props:**
- `pensionActual: StrategyResult | null` - Resultado del cálculo de pensión
- `loading: boolean` - Estado de carga
- `mesesPagados: number` - Número de meses ya pagados
- `onVerMejoras?: () => void` - Callback para ver opciones de mejora

---

### 2. SimpleContributionInput
**Ubicación:** `components/yam40/simple/SimpleContributionInput.tsx`

**Uso:**
```tsx
import SimpleContributionInput from "@/components/yam40/simple/SimpleContributionInput"

<SimpleContributionInput
  value={aportacionMensual}
  onChange={setAportacionMensual}
  label="¿Cuánto pagas al mes?"
  helperText="Ingresa cuánto pagas mensualmente"
  min={1000}
  max={25000}
/>
```

**Características:**
- Input en pesos (no UMA)
- Conversión automática a UMA (mostrada como información)
- Slider visual para ajuste rápido
- Validación automática de rangos

---

### 3. SimpleMonthsSelector
**Ubicación:** `components/yam40/simple/SimpleMonthsSelector.tsx`

**Uso:**
```tsx
import SimpleMonthsSelector from "@/components/yam40/simple/SimpleMonthsSelector"

<SimpleMonthsSelector
  value={mesesPagadosCount}
  onChange={setMesesPagadosCount}
  mesesPagados={0}
  maxMeses={58}
  label="¿Cuántos meses has pagado?"
/>
```

**Características:**
- Selector visual con botones +/-
- Barra de progreso visual
- Muestra meses pagados vs seleccionados vs restantes
- Validación automática de límites

---

### 4. ImprovementOptions
**Ubicación:** `components/yam40/simple/ImprovementOptions.tsx`

**Uso:**
```tsx
import ImprovementOptions from "@/components/yam40/simple/ImprovementOptions"

<ImprovementOptions
  pensionActual={pensionActual}
  mesesPagados={mesesPagadosCount}
  mesesDisponibles={58 - mesesPagadosCount}
  onCalculate={handleCalculateImprovement}
  loading={false}
/>
```

**Características:**
- Comparación visual antes/después
- Cálculo automático con debounce
- Muestra diferencia y porcentaje de mejora
- Timeline simple de progreso

---

## Flujo Simplificado

### YaM40FlowSimplified
**Ubicación:** `components/yam40/YaM40FlowSimplified.tsx`

**Características:**
- 3 pasos claros: Datos → Resultado → Mejoras
- Usa componentes simplificados
- Opciones avanzadas ocultas por defecto
- Progresión gradual

**Para usar:**
```tsx
import YaM40FlowSimplified from "@/components/yam40/YaM40FlowSimplified"

// En app/yam40/page.tsx
export default function YaM40Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <YaM40FlowSimplified />
    </div>
  )
}
```

---

## Adaptador para EstrategiaDetallada

### adaptarEstrategiaYam40
**Ubicación:** `lib/yam40/adaptarEstrategiaYam40.ts`

**Uso:**
```tsx
import { adaptarEstrategiaYam40 } from "@/lib/yam40/adaptarEstrategiaYam40"

const { estrategia, datosUsuario } = adaptarEstrategiaYam40({
  mesesPagados: mesesPagados,
  mesesFuturos: mesesFuturos,
  pensionActual: pensionActual,
  datosUsuario: {
    name: state.profile.name,
    birthDate: state.profile.birthDate!,
    retirementAge: state.profile.retirementAge,
    totalWeeksContributed: state.profile.totalWeeksContributed,
    civilStatus: state.profile.civilStatus,
    sdiHistorico: state.sdiHistorico.value
  }
})

// Usar con EstrategiaDetallada
<EstrategiaDetallada
  estrategia={estrategia}
  datosUsuario={datosUsuario}
  onVolver={() => setShowDetalle(false)}
/>
```

---

## Migración del Flujo Actual

### Opción 1: Reemplazar Completamente
```tsx
// app/yam40/page.tsx
import YaM40FlowSimplified from "@/components/yam40/YaM40FlowSimplified"

export default function YaM40Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <YaM40FlowSimplified />
    </div>
  )
}
```

### Opción 2: Alternar entre Flujos
```tsx
// app/yam40/page.tsx
import { useState } from "react"
import YaM40Flow from "@/components/yam40/YaM40Flow"
import YaM40FlowSimplified from "@/components/yam40/YaM40FlowSimplified"

export default function YaM40Page() {
  const [useSimplified, setUseSimplified] = useState(true)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-end p-4">
        <button
          onClick={() => setUseSimplified(!useSimplified)}
          className="text-sm text-blue-600 hover:underline"
        >
          {useSimplified ? 'Ver modo avanzado' : 'Ver modo simple'}
        </button>
      </div>
      {useSimplified ? <YaM40FlowSimplified /> : <YaM40Flow />}
    </div>
  )
}
```

---

## Mejoras en YaM40Results

YaM40Results ha sido reorganizado para:
1. Mostrar pensión actual primero (usando SimplePensionCard)
2. Mostrar opciones de mejora cuando el usuario lo solicite
3. Ocultar calendario avanzado por defecto
4. Mantener funcionalidad completa disponible

**Cambios principales:**
- Importa `SimplePensionCard` y `ImprovementOptions`
- Usa `showAdvanced` para mostrar/ocultar calendario
- Implementa `handleCalculateImprovement` para calcular mejoras

---

## Ejemplo de Integración Completa

```tsx
"use client"

import { useState } from "react"
import SimplePensionCard from "@/components/yam40/simple/SimplePensionCard"
import ImprovementOptions from "@/components/yam40/simple/ImprovementOptions"
import { StrategyResult } from "@/types/strategy"
import { calcularNuevoSDIHistorico } from "@/lib/yam40/calcularNuevoSDIHistorico"
import { aportacionToUMA } from "@/lib/all/umaConverter"
import { calcularSemanasM40 } from "@/lib/all/utils"

export default function EjemploIntegracion() {
  const [pensionActual, setPensionActual] = useState<StrategyResult | null>(null)
  const [mesesPagados, setMesesPagados] = useState(10)
  const [showImprovements, setShowImprovements] = useState(false)

  const handleCalculateImprovement = async (
    aportacionMensual: number,
    mesesAdicionales: number
  ): Promise<StrategyResult | null> => {
    // Implementar cálculo usando API
    // Ver YaM40FlowSimplified.tsx para ejemplo completo
    return null
  }

  return (
    <div className="space-y-6">
      <SimplePensionCard
        pensionActual={pensionActual}
        loading={false}
        mesesPagados={mesesPagados}
        onVerMejoras={() => setShowImprovements(true)}
      />

      {showImprovements && (
        <ImprovementOptions
          pensionActual={pensionActual}
          mesesPagados={mesesPagados}
          mesesDisponibles={58 - mesesPagados}
          onCalculate={handleCalculateImprovement}
        />
      )}
    </div>
  )
}
```

---

## Próximos Pasos

1. **Testing:** Probar con usuarios reales (50-60 años)
2. **Ajustes:** Refinar lenguaje y visualización basado en feedback
3. **Integración:** Decidir si usar flujo simplificado por defecto o como opción
4. **Documentación:** Crear guías de usuario final (no técnicas)

---

## Referencias

- **Documentación completa:** Ver `docs/yam40-*.md`
- **Componentes:** `components/yam40/simple/*.tsx`
- **Lógica:** `lib/yam40/*.ts`
- **Ejemplo completo:** `components/yam40/YaM40FlowSimplified.tsx`

