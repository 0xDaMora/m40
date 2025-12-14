# Validaciones y Casos Edge - Sistema yam40

## Validaciones Críticas

### Validación de Meses Totales

**Regla:** El total de meses (pagados + planificados + retroactivos) no puede exceder 58.

**Implementación:**
```typescript
const totalMeses = mesesPagados.length + mesesPlanificados.length + mesesRetroactivos.length
if (totalMeses > 58) {
  // Error: excede límite
  throw new Error(`Total de meses (${totalMeses}) excede el límite de 58 meses`)
}
```

**Ubicación:** 
- `components/yam40/M40Calendar.tsx` líneas 422-432
- `lib/yam40/limitantesM40.ts` líneas 99-106

---

### Validación de Reingreso

**Regla:** Si el gap entre el último pago y la fecha actual es mayor a 12 meses, no puede reingresar.

**Implementación:**
```typescript
const fechaLimiteReingreso = new Date(ultimaFechaPagada)
fechaLimiteReingreso.setMonth(fechaLimiteReingreso.getMonth() + 12)
if (fechaActual > fechaLimiteReingreso) {
  return {
    puedeReingresar: false,
    mensajeError: `Ya no puedes reingresar a Modalidad 40. Tu último pago fue en ${mesUltimo}/${añoUltimo} y el límite de reingreso (12 meses) ya expiró.`
  }
}
```

**Ubicación:** `lib/yam40/limitantesM40.ts` líneas 77-87

---

### Validación de Semanas Mínimas

**Regla:** Mínimo 500 semanas cotizadas totales para tener derecho a pensión.

**Implementación:**
```typescript
const semanasTotales = semanasPrevias + semanasM40
if (semanasTotales < 500) {
  return {
    pensionMensual: null,
    error: "Insuficientes semanas cotizadas (mínimo 500)"
  }
}
```

**Ubicación:** 
- `lib/all/calculator.ts` líneas 73-85
- `lib/yam40/calcularPensionActual.ts` líneas 217-231

---

### Validación de Edad

**Regla:** 
- Edad de jubilación: 60-65 años
- Edad actual debe ser menor a edad de jubilación
- Edad mínima para simulación: 40 años

**Implementación:**
```typescript
if (edadJubilacion < 60 || edadJubilacion > 65) {
  throw new Error("Edad de jubilación debe estar entre 60 y 65 años")
}

if (edadActual >= edadJubilacion) {
  throw new Error("Ya tiene la edad de jubilación deseada")
}

if (edadActual < 40) {
  throw new Error("Edad mínima 40 años para simulación confiable")
}
```

**Ubicación:**
- `lib/all/allStrats.ts` líneas 44-46, 79-85
- `lib/all/calculator.ts` líneas 26-28

---

### Validación de SDI

**Regla:** SDI debe ser mayor a 0. Se detecta automáticamente si está en formato diario o mensual.

**Implementación:**
```typescript
if (sdiHistorico <= 0) {
  throw new Error("SDI histórico debe ser mayor a 0")
}

// Detección automática: si SDI > 10,000, se asume mensual
let sdiDiario = sdiHistorico
if (sdiDiario > 10000) {
  sdiDiario = sdiDiario / 30.4 // Convertir a diario
}
```

**Ubicación:**
- `lib/yam40/calcularPensionActual.ts` líneas 24-32
- `lib/all/allStrats.ts` líneas 56-58

---

### Validación de UMA

**Regla:** UMA debe estar entre 1 y 25 (límite legal).

**Implementación:**
```typescript
if (umaElegida < 1 || umaElegida > 25) {
  throw new Error("UMA elegida debe estar entre 1 y 25")
}
```

**Ubicación:**
- `lib/all/calculator.ts` líneas 22-24
- `lib/all/allStrats.ts` líneas 52-54

---

## Casos Edge

### Caso 1: Usuario con 58 meses completos

**Escenario:** Usuario ya pagó los 58 meses completos de M40.

**Comportamiento esperado:**
- No puede agregar más meses
- No se calculan meses retroactivos
- Pensión se calcula solo con los 58 meses M40 (promedio directo)
- No se muestran estrategias futuras

**Validación:**
```typescript
if (mesesPagados.length >= 58) {
  // Calcular promedio directo de los últimos 58 meses
  const ultimos58Meses = mesesOrdenados.slice(-58)
  const sumaSDIDiario = ultimos58Meses.reduce((acc, mes) => acc + mes.sdi, 0)
  const sdiPromedioDiario = sumaSDIDiario / 58
  sdiPromedio = sdiPromedioDiario * 30.4
}
```

**Ubicación:** `lib/yam40/calcularPensionActual.ts` líneas 128-133

---

### Caso 2: Gap mayor a 12 meses

**Escenario:** Usuario dejó de pagar M40 hace más de 12 meses.

**Comportamiento esperado:**
- No puede reingresar a M40
- Mensaje de error claro
- No se calculan estrategias futuras
- Solo se muestra pensión actual con lo que ya pagó

**Validación:**
```typescript
if (fechaActual > fechaLimiteReingreso) {
  return {
    puedeReingresar: false,
    mesesRetroactivos: [],
    mensajeError: "Ya no puedes reingresar a Modalidad 40..."
  }
}
```

**Ubicación:** `lib/yam40/limitantesM40.ts` líneas 77-87

---

### Caso 3: Menos de 500 semanas totales

**Escenario:** Usuario tiene menos de 500 semanas cotizadas totales.

**Comportamiento esperado:**
- Pensión será `null`
- Error descriptivo: "Insuficientes semanas cotizadas (mínimo 500)"
- Se muestra mensaje al usuario explicando el problema

**Validación:**
```typescript
if (semanasTotales < 500) {
  return {
    pensionMensual: null,
    error: "Insuficientes semanas cotizadas (mínimo 500)"
  }
}
```

**Ubicación:** `lib/yam40/calcularPensionActual.ts` líneas 217-231

---

### Caso 4: Meses consecutivos sin gaps

**Escenario:** Usuario pagó meses consecutivos (mes 1, 2, 3... N) sin gaps temporales.

**Comportamiento esperado:**
- NO se calculan meses retroactivos
- Los meses disponibles son futuros, no retroactivos
- Se pueden planificar meses futuros normalmente

**Validación:**
```typescript
// Si no hay gap temporal entre último pago y fecha actual/inicio planificación
// NO hay meses retroactivos
if (!debeCalcularRetroactivos || !fechaLimiteCalculo) {
  return {
    puedeReingresar: true,
    mesesRetroactivos: []
  }
}
```

**Ubicación:** `lib/yam40/limitantesM40.ts` líneas 160-172

---

### Caso 5: Gap menor a 12 meses con meses disponibles

**Escenario:** Usuario tiene un gap temporal menor a 12 meses y aún tiene meses disponibles para completar 58.

**Comportamiento esperado:**
- Se calculan meses retroactivos para llenar el gap
- Los meses retroactivos + meses disponibles no deben exceder 58
- Se validan límites antes de agregar retroactivos

**Validación:**
```typescript
const totalConRetroactivos = mesesConSDI.length + mesesRetroactivosNuevos
if (totalConRetroactivos > 58) {
  // Limitar los meses retroactivos
  const mesesRetroactivosPermitidos = Math.max(0, 58 - mesesConSDI.length)
  return {
    ...resultado,
    mesesRetroactivos: resultado.mesesRetroactivos.slice(0, mesesRetroactivosPermitidos)
  }
}
```

**Ubicación:** `lib/yam40/limitantesM40.ts` líneas 442-458

---

### Caso 6: SDI histórico en formato mensual

**Escenario:** Usuario ingresa SDI histórico en formato mensual (ej: 15,000) en lugar de diario (ej: 500).

**Comportamiento esperado:**
- Se detecta automáticamente (SDI > 10,000)
- Se convierte a diario dividiendo entre 30.4
- Se muestra advertencia en consola (solo desarrollo)

**Validación:**
```typescript
let sdiHistoricoDiario = sdiHistorico
if (sdiHistoricoDiario > 10000) {
  console.warn(`⚠️ SDI detectado como mensual (${sdiHistorico}), convirtiendo a diario: ${sdiHistorico / 30.4}`)
  sdiHistoricoDiario = sdiHistorico / 30.4
}
```

**Ubicación:** `lib/yam40/calcularPensionActual.ts` líneas 24-32

---

### Caso 7: Edad de jubilación igual a edad actual

**Escenario:** Usuario tiene exactamente la edad de jubilación deseada.

**Comportamiento esperado:**
- Error: "Ya tiene la edad de jubilación deseada"
- No se pueden calcular estrategias futuras
- Solo se muestra pensión actual

**Validación:**
```typescript
if (edadHoy >= edadJubilacion) {
  throw new Error("Ya tiene la edad de jubilación deseada")
}
```

**Ubicación:** `lib/all/allStrats.ts` líneas 83-85

---

### Caso 8: Array 250 semanas con meses M40

**Escenario:** Usuario tiene menos de 58 meses M40, se debe completar con SDI histórico.

**Comportamiento esperado:**
- Se construye array de 250 semanas
- Las primeras semanas se llenan con SDI histórico
- Las últimas semanas se reemplazan con SDI de meses M40
- Los meses M40 deben estar ordenados cronológicamente
- Se procesan en orden inverso para reemplazar desde el final

**Validación:**
```typescript
// Ordenar meses por número de mes (cronológicamente)
const mesesOrdenados = [...mesesM40].sort((a, b) => a.mes - b.mes)

// Procesar en orden inverso (más reciente primero)
const mesesInvertidos = [...mesesOrdenados].reverse()
let indiceArray = TOTAL_SEMANAS - 1 // Empezar desde el final

for (const mes of mesesInvertidos) {
  // Reemplazar 4 semanas completas
  for (let i = 0; i < 4 && indiceArray >= 0; i++) {
    arraySemanas[indiceArray] = mes.sdi
    indiceArray--
  }
  // Manejar fracción de 0.33 semanas
  if (indiceArray >= 0) {
    arraySemanas[indiceArray] = (mes.sdi * 0.33) + (valorActual * 0.67)
    indiceArray--
  }
}
```

**Ubicación:** 
- `lib/yam40/calcularPensionActual.ts` líneas 145-186
- `lib/yam40/calcularNuevoSDIHistorico.ts` líneas 30-60

---

### Caso 9: Filtrado de estrategias sin coincidencia exacta

**Escenario:** No hay estrategias que coincidan exactamente con los meses futuros planificados.

**Comportamiento esperado:**
- Buscar estrategias cercanas (diferencia de ±2 meses)
- Si hay cercanas, retornar la que tenga UMA más cercana
- Si no hay cercanas, retornar la primera estrategia como fallback

**Validación:**
```typescript
if (estrategiasPorMeses.length === 0) {
  const estrategiasCercanas = estrategias.filter(
    s => Math.abs(s.mesesM40 - mesesFuturos.length) <= 2
  )
  if (estrategiasCercanas.length > 0) {
    // Retornar la que tenga UMA más cercana
    return mejorEstrategiaPorUMA
  }
  return estrategias[0] // Fallback
}
```

**Ubicación:** `lib/yam40/calcularEstrategiaDesdeCalendario.ts` líneas 181-199

---

### Caso 10: Meses retroactivos que excederían límite

**Escenario:** Los meses retroactivos calculados harían que el total exceda 58 meses.

**Comportamiento esperado:**
- Limitar meses retroactivos para no exceder 58
- Mostrar advertencia en consola
- Retornar solo los meses retroactivos permitidos

**Validación:**
```typescript
const totalConRetroactivos = mesesConSDI.length + mesesRetroactivosNuevos
if (totalConRetroactivos > 58) {
  console.warn('⚠️ Los meses retroactivos excederían el límite de 58 meses')
  const mesesRetroactivosPermitidos = Math.max(0, 58 - mesesConSDI.length)
  return {
    ...resultado,
    mesesRetroactivos: resultado.mesesRetroactivos.slice(0, mesesRetroactivosPermitidos)
  }
}
```

**Ubicación:** `lib/yam40/limitantesM40.ts` líneas 442-458

---

## Testing Recomendado

### Casos de Prueba Críticos

1. **Usuario con 58 meses completos**
   - Input: 58 meses pagados
   - Expected: No puede agregar más, pensión calculada correctamente

2. **Gap de 13 meses**
   - Input: Último pago hace 13 meses
   - Expected: Error de reingreso, no puede continuar

3. **Gap de 6 meses con meses disponibles**
   - Input: Último pago hace 6 meses, 10 meses disponibles
   - Expected: 6 meses retroactivos + 10 futuros = 16 total

4. **Meses consecutivos sin gaps**
   - Input: Meses 1-20 pagados consecutivamente
   - Expected: No hay retroactivos, 38 meses futuros disponibles

5. **SDI mensual vs diario**
   - Input: SDI = 15,000 (mensual)
   - Expected: Se convierte a 493.42 diario automáticamente

6. **Menos de 500 semanas**
   - Input: 200 semanas previas + 20 meses M40 (86 semanas) = 286 total
   - Expected: Pensión null, error descriptivo

7. **Array 250 semanas con 30 meses M40**
   - Input: 30 meses M40 pagados
   - Expected: 130 semanas históricas + 120 semanas M40 = 250 total

8. **Filtrado de estrategias**
   - Input: 10 meses futuros con UMA promedio 15, estrategia fijo
   - Expected: Estrategia con 10 meses, UMA cercana a 15, tipo fijo

---

## Referencias de Implementación

- **Validaciones de meses:** `components/yam40/M40Calendar.tsx`
- **Validaciones de reingreso:** `lib/yam40/limitantesM40.ts`
- **Validaciones de semanas:** `lib/yam40/calcularPensionActual.ts`
- **Validaciones de edad:** `lib/all/allStrats.ts`
- **Validaciones de SDI:** `lib/yam40/calcularPensionActual.ts`
- **Construcción array 250:** `lib/yam40/calcularPensionActual.ts`, `lib/yam40/calcularNuevoSDIHistorico.ts`
- **Filtrado estrategias:** `lib/yam40/calcularEstrategiaDesdeCalendario.ts`

