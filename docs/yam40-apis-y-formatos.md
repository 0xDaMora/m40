# Documentación de APIs y Formatos de Datos - yam40

## APIs Principales

### 1. `/api/calculate-current-pension`

**Propósito:** Calcula la pensión actual basándose en los meses M40 que el usuario ya ha pagado.

**Método:** `POST`

**Request Body:**
```typescript
{
  profile: {
    birthDate: string,              // ISO date string "YYYY-MM-DD"
    retirementAge: number,           // 60-65
    totalWeeksContributed: number,  // Semanas ANTES de M40
    civilStatus: 'soltero' | 'casado'
  },
  mesesPagados: MesConSDI[],        // Array de meses ya pagados
  sdiHistorico: {
    value: number,                   // SDI diario o mensual (se detecta automáticamente)
    isDirectSDI: boolean             // true = SDI directo, false = salario bruto
  }
}
```

**Response (Success):**
```typescript
{
  success: true,
  estrategia: {
    estrategia: 'fijo',
    umaElegida: number,             // UMA promedio de meses pagados
    mesesM40: number,                // Total de meses pagados
    inversionTotal: number,          // Total invertido en M40
    pensionMensual: number | null,  // Pensión mensual calculada
    pensionConAguinaldo: number | null,
    ROI: number | null,
    recuperacionMeses: number | null,
    semanasTotales: number,
    sdiPromedio: number,            // SDI promedio mensual
    porcentajePension: number,      // Porcentaje según Ley 73
    conLeyFox: number,
    conDependiente: number,
    factorEdad: number,
    conFactorEdad: number,
    pmgAplicada: boolean,           // Si se aplicó Pensión Mínima Garantizada
    pmgValor: number,
    registros: Array<{               // Registros mensuales de pagos
      fecha: string,
      uma: number,
      tasaM40?: number,
      sdiMensual: number,
      cuotaMensual: number,
      acumulado: number
    }>,
    debug?: {                        // Información de debug (solo desarrollo)
      logSDIPromedio: object,
      logDatosPension: object,
      logCalculoPension: object,
      logPensionFinal: object
    }
  }
}
```

**Response (Error):**
```typescript
{
  error: string                      // Mensaje de error descriptivo
}
```

**Validaciones:**
- `mesesPagados.length > 0`
- `sdiHistorico.value > 0`
- `retirementAge >= 60 && retirementAge <= 65`
- `totalWeeksContributed >= 0`

**Implementación:** `app/api/calculate-current-pension/route.ts`

---

### 2. `/api/calculate-strategies`

**Propósito:** Genera estrategias futuras de M40 basándose en los filtros proporcionados.

**Método:** `POST`

**Request Body:**
```typescript
{
  familyData: FamilyMemberData,
  filters: IntegrationFilters,
  userPreferences?: {               // Opcional
    nivelUMA?: 'conservador' | 'equilibrado' | 'maximo',
    pensionObjetivo?: 'basica' | 'confortable' | 'premium'
  }
}
```

**Response (Success):**
```typescript
{
  strategies: StrategyResult[],
  count: number,
  familyData: FamilyMemberData,
  filters: IntegrationFilters
}
```

**Validaciones:**
- `filters.months >= 1 && filters.months <= 58`
- `filters.retirementAge >= 60 && filters.retirementAge <= 65`
- `filters.monthlyContributionRange.min >= 0`
- `filters.monthlyContributionRange.max >= filters.monthlyContributionRange.min`

**Implementación:** `app/api/calculate-strategies/route.ts`

**Nota:** Esta API usa `allStrats()` internamente, que genera todas las combinaciones posibles de estrategias.

---

### 3. `/api/calculate-historical-pension`

**Propósito:** Calcula pensión para períodos históricos con UMA variable (modo avanzado).

**Método:** `POST`

**Request Body:**
```typescript
{
  profile: {
    name: string,
    birthDate: string,               // ISO date string
    retirementAge: number,
    totalWeeksContributed: number,
    civilStatus: 'soltero' | 'casado'
  },
  periodosM40: PeriodoM40Historico[],
  ultimoSalarioBruto: number,       // Último salario bruto mensual antes de M40
  semanasPrevias: number,
  edadJubilacion: number,
  dependiente: 'soltero' | 'casado' | 'conyuge' | 'ninguno',
  fechaNacimiento: string
}
```

**Response:** Similar a `calculate-current-pension`

**Implementación:** `app/api/calculate-historical-pension/route.ts`

---

### 4. `/api/calculate-pension-array`

**Propósito:** Calcula pensión usando array completo de 250 semanas (exclusivo para yam40).

**Método:** `POST`

**Request Body:**
```typescript
{
  array250Semanas: number[],        // Array de exactamente 250 elementos con SDI diario
  semanasPrevias: number,           // Semanas antes de las 250 semanas del array
  edadJubilacion: number,
  dependiente: 'soltero' | 'casado',
  fechaNacimiento: string | Date
}
```

**Validaciones:**
- `array250Semanas.length === 250`
- `semanasPrevias >= 0`
- `edadJubilacion >= 60 && edadJubilacion <= 65`

**Implementación:** `app/api/calculate-pension-array/route.ts`

---

## Formatos de Datos

### MesConSDI

**Ubicación:** `types/yam40.ts`

```typescript
interface MesConSDI {
  mes: number;                      // Número de mes en calendario (1-58)
  año: number;                      // Año del mes
  sdi: number;                      // SDI diario (no mensual)
  uma: number;                      // UMA del mes
  yaPagado: boolean;                // true = ya pagado, false = planificado/futuro
  esRetroactivo?: boolean;          // true = mes retroactivo (gap temporal)
  aportacionMensual?: number;       // Mes del año (1-12) para meses retroactivos
}
```

**Notas importantes:**
- `mes` es el número secuencial en el calendario de 58 meses (1-58)
- `aportacionMensual` es el mes del año real (1-12) y solo se usa para meses retroactivos
- `sdi` siempre está en formato diario, no mensual
- Para convertir a mensual: `sdiMensual = sdi * 30.4`

---

### FamilyMemberData

**Ubicación:** `types/strategy.ts`

```typescript
interface FamilyMemberData {
  id: string;                       // ID único del familiar/usuario
  name: string;                     // Nombre
  birthDate: Date;                  // Fecha de nacimiento
  weeksContributed: number;         // Semanas cotizadas totales (antes M40 + M40)
  lastGrossSalary: number;          // Último salario bruto mensual
  civilStatus: string;              // 'soltero' | 'casado'
}
```

**Uso en yam40:**
- `weeksContributed`: Debe incluir semanas M40 ya pagadas si se calculan estrategias futuras
- `lastGrossSalary`: Se convierte a SDI diario: `sdiDiario = lastGrossSalary / 30.4`

---

### IntegrationFilters

**Ubicación:** `types/strategy.ts`

```typescript
interface IntegrationFilters {
  familyMemberId: string | null;
  monthlyContributionRange: {
    min: number;                    // Aportación mensual mínima en pesos
    max: number;                     // Aportación mensual máxima en pesos
  };
  months: number;                    // Número de meses para estrategias (1-58)
  retirementAge: number;             // Edad de jubilación (60-65)
  startMonth?: number;               // Mes de inicio (1-12)
  startYear?: number;                // Año de inicio
  monthsMode?: 'fixed' | 'scan';     // 'fixed' = solo meses especificados, 'scan' = 1 hasta meses
}
```

**Conversión a UMA:**
- El rango de aportación se convierte a UMA usando `getUMARange()`
- `umaRange = getUMARange(monthlyContributionRange.min, monthlyContributionRange.max, añoActual)`

---

### StrategyResult

**Ubicación:** `types/strategy.ts`

```typescript
interface StrategyResult {
  estrategia: 'fijo' | 'progresivo';
  umaElegida: number;               // UMA elegida (1-25)
  mesesM40: number;                 // Meses en M40
  pensionMensual: number | null;    // Pensión mensual calculada
  ROI: number | null;               // Return on Investment en 20 años
  inversionTotal: number | null;    // Inversión total requerida
  error?: string;                   // Mensaje de error si hay problema
  pmgAplicada?: boolean;            // Si se aplicó PMG
  pmgValor?: number;                // Valor de PMG
}
```

**Campos adicionales (de calcularEscenario):**
- `pensionConAguinaldo: number | null`
- `recuperacionMeses: number | null`
- `semanasTotales: number`
- `sdiPromedio: number`
- `porcentajePension: number`
- `conLeyFox: number`
- `conDependiente: number`
- `factorEdad: number`
- `conFactorEdad: number`
- `registros?: Array<{...}>`        // Registros mensuales detallados

---

### PeriodoM40Historico

**Ubicación:** `types/yam40.ts`

```typescript
interface PeriodoM40Historico {
  fechaInicio: {
    mes: number;                    // 1-12
    año: number;
  };
  fechaFin: {
    mes: number;                    // 1-12
    año: number;
  };
  aportacionMensual: number;       // Aportación mensual en pesos
}
```

**Uso:** Para usuarios que pagaron M40 con aportaciones variables (no UMA fija).

---

## Compatibilidad con calculator.ts

### calcularEscenario()

**Ubicación:** `lib/all/calculator.ts`

**Parámetros esperados:**
```typescript
{
  mesesM40: number,                 // 1-120 (pero máximo real es 58)
  estrategia: 'fijo' | 'progresivo',
  semanasPrevias: number,           // Semanas antes de M40
  edad: number,                      // 60-65
  dependiente: 'conyuge' | 'ninguno',
  umaElegida: number,               // 1-25
  sdiHistorico: number,             // SDI diario histórico
  inicioM40: Date                   // Fecha de inicio de M40
}
```

**Retorna:**
```typescript
{
  mesesM40: number,
  estrategia: 'fijo' | 'progresivo',
  umaElegida: number,
  inversionTotal: number,
  pensionMensual: number | null,
  pensionConAguinaldo: number | null,
  ROI: number | null,
  recuperacionMeses: number | null,
  semanasTotales: number,
  sdiPromedio: number,
  porcentajePension: number,
  error?: string
}
```

**Diferencias con yam40:**
- `calcularEscenario()` asume estrategia desde cero
- `calcularPensionActual()` maneja meses pagados reales con fechas específicas
- `calcularEscenario()` usa `inicioM40` para calcular fechas, yam40 usa fechas reales de meses pagados

---

### allStrats()

**Ubicación:** `lib/all/allStrats.ts`

**Parámetros:**
```typescript
{
  fechaNacimiento: string,         // "YYYY-MM-DD"
  edadJubilacion: number,           // 60-65
  semanasPrevias: number,
  dependiente: 'conyuge' | 'ninguno',
  umaMin: number,                   // 1-25
  umaMax: number,                   // 1-25, >= umaMin
  sdiHistorico: number,             // SDI diario histórico
  fechaInicio?: string,             // "YYYY-MM-DD" - opcional
  monthsMode?: 'fixed' | 'scan'    // 'fixed' = solo mesesTarget, 'scan' = 1..mesesDisponibles
}
```

**Retorna:**
```typescript
{
  resultados: StrategyResult[],     // Ordenados por ROI descendente
  metadatos: {
    totalEscenarios: number,
    escenariosValidos: number,
    edadActual: number,
    inicioM40: string,              // "YYYY-MM-DD"
    fechaJubilacion: string,        // "YYYY-MM-DD"
    mesesDisponibles: number
  }
}
```

**Uso en yam40:**
- Se llama desde `/api/calculate-strategies`
- `semanasPrevias` debe incluir semanas M40 ya pagadas
- `sdiHistorico` debe ser el nuevo SDI histórico (promedio de meses pagados + histórico)
- `monthsMode: 'scan'` para generar todas las estrategias posibles

---

## Conversiones y Transformaciones

### SDI Histórico a Diario

**Detección automática:**
```typescript
// Si SDI > 10,000, se asume mensual
if (sdi > 10000) {
  sdiDiario = sdi / 30.4
} else {
  sdiDiario = sdi  // Ya está en formato diario
}
```

**Implementación:** `lib/yam40/calcularPensionActual.ts` líneas 24-32

---

### Aportación Mensual a UMA

**Conversión:**
```typescript
// Aportación mensual = SDI mensual * tasa M40
// SDI mensual = UMA * UMA(año) * 30.4
// Por lo tanto: aportacionMensual = UMA * UMA(año) * 30.4 * tasaM40(año)

// Para convertir de aportación a UMA:
const uma = aportacionMensual / (UMA(año) * 30.4 * tasaM40(año))
```

**Implementación:** `lib/all/umaConverter.ts` - `getUMARange()`

---

### Meses a Semanas

**Conversión:**
```typescript
const semanasM40 = Math.floor(mesesM40 * 4.33)
```

**Nota:** Cada mes tiene aproximadamente 4.33 semanas (52 semanas / 12 meses).

---

### Construcción de Array 250 Semanas

**Proceso:**
1. Crear array de 250 elementos lleno con SDI histórico diario
2. Ordenar meses M40 pagados cronológicamente (más antiguo primero)
3. Procesar meses en orden inverso (más reciente primero)
4. Reemplazar últimas semanas del array con SDI de meses M40
5. Cada mes reemplaza aproximadamente 4 semanas completas + fracción

**Implementación:** `lib/yam40/calcularPensionActual.ts` líneas 145-186

---

## Flujo de Datos en yam40

### Flujo Principal

1. **Usuario ingresa datos básicos:**
   - `YaM40Flow` → `UserProfileCard` + `SDIHistoricoInput`
   - Se construye `YaM40State` con `profile`, `sdiHistorico`, `mesesConSDI`

2. **Usuario selecciona meses pagados:**
   - `M40Calendar` permite seleccionar meses del calendario de 58
   - Se actualiza `mesesConSDI` con `yaPagado: true`

3. **Cálculo de pensión actual:**
   - `useCalendarCalculations` hook calcula `pensionActual`
   - Usa `calcularPensionActual()` con meses pagados
   - O `calcularPensionHistorica()` si hay períodos históricos

4. **Cálculo de estrategias futuras:**
   - Se construye `FamilyMemberData` con semanas actualizadas
   - Se construye `IntegrationFilters` con meses disponibles
   - Se llama `/api/calculate-strategies`
   - Se filtran estrategias según calendario planificado

5. **Visualización de resultados:**
   - `YaM40Results` muestra pensión actual primero
   - Luego muestra estrategias futuras disponibles
   - Opción de ver `EstrategiaDetallada` (requiere adaptador)

---

## Validaciones Comunes

### Validación de Meses Totales
```typescript
const totalMeses = mesesPagados.length + mesesPlanificados.length + mesesRetroactivos.length
if (totalMeses > 58) {
  // Error: excede límite
}
```

### Validación de Reingreso
```typescript
const fechaLimiteReingreso = new Date(ultimaFechaPagada)
fechaLimiteReingreso.setMonth(fechaLimiteReingreso.getMonth() + 12)
if (fechaActual > fechaLimiteReingreso) {
  // Error: no puede reingresar
}
```

### Validación de Semanas Mínimas
```typescript
const semanasTotales = semanasPrevias + semanasM40
if (semanasTotales < 500) {
  // Error: insuficientes semanas
}
```

---

## Referencias

- **Tipos:** `types/yam40.ts`, `types/strategy.ts`
- **APIs:** `app/api/calculate-*/route.ts`
- **Cálculos:** `lib/yam40/*.ts`, `lib/all/*.ts`
- **Componentes:** `components/yam40/*.tsx`

