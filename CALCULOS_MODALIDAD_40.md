# Guía de Cálculos - Modalidad 40 IMSS

## 📋 Tabla de Contenidos

1. [Fundamentos Legales](#fundamentos-legales)
2. [Constantes y Valores Base](#constantes-y-valores-base)
3. [Proceso de Cálculo Detallado](#proceso-de-cálculo-detallado)
4. [Algoritmo de Generación de Estrategias](#algoritmo-de-generación-de-estrategias)
5. [Cálculos Específicos YAM40](#cálculos-específicos-yam40)
6. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## ⚖️ Fundamentos Legales

### Ley del Seguro Social (LSS) - Ley 73

La Modalidad 40 permite a trabajadores que dejaron de cotizar al IMSS, continuar haciendo aportaciones voluntarias para mejorar su pensión. Se rige por la **Ley del Seguro Social de 1973 (Ley 73)**.

#### Artículos Clave

**Artículo 167**: Cálculo de Cuantía Básica  
**Artículo 171**: Factores de Edad  
**Artículo 164**: Asignaciones Familiares  
**Ley Fox (2009)**: Incremento adicional del 11%

### Requisitos para Pensión Ley 73

1. **Edad**: 60-65 años
2. **Semanas Cotizadas**: Mínimo 500 semanas
3. **Vigencia de Derechos**: Estar dado de baja del IMSS
4. **Modalidad 40**: Pagar voluntariamente (1-58 meses máximo = 250 semanas)

---

## 📊 Constantes y Valores Base

### UMA (Unidad de Medida y Actualización)

**Valor base 2025**: $113.07 MXN

```javascript
// lib/all/constants.ts

function getUMA(year) {
  const baseYear = 2025
  const baseValue = 113.07
  const diff = year - baseYear
  return baseValue * Math.pow(1.05, diff)  // +5% anual
}

// Ejemplos:
getUMA(2025) = 113.07
getUMA(2026) = 118.72
getUMA(2027) = 124.66
getUMA(2030) = 138.60
```

**Histórica (años anteriores)**:
```javascript
function getUMAHistorica(year) {
  const baseYear = 2025
  const baseValue = 113.07
  
  if (year >= baseYear) {
    return getUMA(year)  // Proyección futura
  } else {
    const diff = baseYear - year
    return baseValue * Math.pow(0.95, diff)  // -5% anual hacia atrás
  }
}

// Ejemplos:
getUMAHistorica(2024) = 107.42
getUMAHistorica(2023) = 102.05
```

### Tasa Modalidad 40 (Escalonada)

**Reforma 2020** - La tasa crece gradualmente hasta 2030:

```javascript
const tasaM40 = {
  2022: 0.10075,  // 10.075%
  2023: 0.11166,  // 11.166%
  2024: 0.12256,  // 12.256%
  2025: 0.13347,  // 13.347%
  2026: 0.1442,   // 14.42%
  2027: 0.155,    // 15.5%
  2028: 0.165,    // 16.5%
  2029: 0.177,    // 17.7%
  2030: 0.188,    // 18.8% (fija de 2030 en adelante)
}

function getTasaM40(year) {
  if (tasaM40[year]) return tasaM40[year]
  if (year < 2025) return tasaM40[2025]
  if (year > 2030) return 0.188
  
  // Interpolar para años intermedios
  // ...
}
```

### Factores de Edad (Art. 171)

```javascript
const factorEdad = {
  60: 0.75,  // 75% - penalización por jubilarse antes
  61: 0.80,  // 80%
  62: 0.85,  // 85%
  63: 0.90,  // 90%
  64: 0.95,  // 95%
  65: 1.00,  // 100% - sin penalización
}
```

**Impacto**: Jubilarse a los 60 años reduce la pensión en 25% vs jubilarse a los 65.

### Asignaciones Familiares (Art. 164)

```javascript
const asignaciones = {
  ninguno: 0,       // Sin dependientes: 0%
  conyuge: 0.15,    // Con cónyuge: +15%
  hijos: 0.10,      // Por cada hijo menor: +10% (max 2)
  ascendientes: 0.10 // Por ascendiente: +10%
}
```

### Ley Fox (2009)

Incremento adicional: **+11%** sobre la pensión base

### Tabla Art. 167 - Cuantía Básica e Incrementos

```javascript
const tabla167 = [
  { max: 1.00, cb: 100.00, inc: 0.500 },  // Hasta 1 UMA = 100% CB
  { max: 1.25, cb: 80.00,  inc: 0.563 },
  { max: 1.50, cb: 77.11,  inc: 0.814 },
  { max: 1.75, cb: 58.18,  inc: 1.178 },
  { max: 2.00, cb: 49.23,  inc: 1.430 },
  { max: 2.25, cb: 42.67,  inc: 1.615 },
  { max: 2.50, cb: 37.65,  inc: 1.756 },
  { max: 2.75, cb: 33.68,  inc: 1.868 },
  { max: 3.00, cb: 30.48,  inc: 1.958 },
  { max: 3.25, cb: 27.83,  inc: 2.033 },
  { max: 3.50, cb: 25.60,  inc: 2.096 },
  { max: 3.75, cb: 23.70,  inc: 2.149 },
  { max: 4.00, cb: 22.07,  inc: 2.195 },
  // ... hasta 6.00
  { max: 999,  cb: 13.62,  inc: 2.433 },  // > 6.00
  { max: 9999, cb: 13.00,  inc: 2.450 },  // Límite superior
]
```

**Uso**: Determina el porcentaje de pensión según el SDI/UMA del trabajador.

---

## 🧮 Proceso de Cálculo Detallado

### Paso 1: Calcular SDI Promedio de 250 Semanas

El IMSS calcula la pensión usando el promedio de las **últimas 250 semanas cotizadas**.

```javascript
// lib/all/calculator.ts

function calcularSDIPromedio250Semanas(
  sdiHistorico,      // SDI antes de M40 (diario)
  semanasPrevias,    // Semanas cotizadas antes de M40
  mesesM40,          // Meses en Modalidad 40
  umaElegida,        // Nivel UMA elegido (1-25)
  estrategia,        // 'fijo' o 'progresivo'
  inicioM40          // Fecha de inicio M40
) {
  const semanasM40 = Math.floor((mesesM40 * 30.4) / 7)
  const semanasHistoricas = 250 - semanasM40
  
  // Construir array de 250 semanas
  const array250 = []
  
  // 1. Semanas históricas (antes de M40)
  for (let i = 0; i < semanasHistoricas; i++) {
    array250.push(sdiHistorico)
  }
  
  // 2. Semanas de M40
  for (let sem = 0; sem < semanasM40; sem++) {
    const mesActual = Math.floor(sem / 4.345)  // ~4.345 semanas/mes
    const fechaMes = new Date(inicioM40)
    fechaMes.setMonth(fechaMes.getMonth() + mesActual)
    
    const año = fechaMes.getFullYear()
    const umaDelAño = getUMA(año)
    
    let sdiSemana
    if (estrategia === 'fijo') {
      // Fijo: UMA crece con inflación
      sdiSemana = umaElegida * umaDelAño
    } else {
      // Progresivo: UMA constante, SDI crece
      sdiSemana = umaElegida * umaDelAño
    }
    
    array250.push(sdiSemana)
  }
  
  // 3. Calcular promedio
  const suma = array250.reduce((acc, sdi) => acc + sdi, 0)
  const promedio = suma / 250
  
  return promedio
}
```

### Paso 2: Determinar Cuantía Básica (CB%)

```javascript
function obtenerCuantiaBasica(sdiPromedio, umaReferencia) {
  const grupoSalarial = sdiPromedio / umaReferencia  // SDI en UMAs
  
  // Buscar en tabla Art. 167
  for (const fila of tabla167) {
    if (grupoSalarial <= fila.max) {
      return fila.cb / 100  // Retornar como decimal (80% = 0.80)
    }
  }
  
  // Si no encuentra, usar última fila
  return tabla167[tabla167.length - 1].cb / 100
}

// Ejemplo:
// sdiPromedio = 450 MXN
// umaReferencia = 113.07 MXN
// grupoSalarial = 450 / 113.07 = 3.98
// Buscar en tabla: max 4.00 → cb = 22.07%
```

### Paso 3: Calcular Incrementos Anuales

```javascript
function calcularIncrementos(semanasTotales, grupoSalarial) {
  const añosSobre500 = Math.floor((semanasTotales - 500) / 52)
  
  // Buscar incremento anual en tabla
  let incrementoPorAño = 0
  for (const fila of tabla167) {
    if (grupoSalarial <= fila.max) {
      incrementoPorAño = fila.inc / 100
      break
    }
  }
  
  const incrementoTotal = añosSobre500 * incrementoPorAño
  
  return incrementoTotal
}

// Ejemplo:
// semanasTotales = 876 (800 previas + 76 en M40)
// grupoSalarial = 3.98
// añosSobre500 = (876 - 500) / 52 = 7.23 años
// incrementoPorAño = 2.195% (de tabla)
// incrementoTotal = 7.23 * 2.195% = 15.87%
```

### Paso 4: Calcular Porcentaje de Pensión

```javascript
function calcularPorcentajePension(cuantiaBasica, incrementos) {
  const porcentaje = cuantiaBasica + incrementos
  
  // Máximo legal: 100%
  return Math.min(porcentaje, 1.00)
}

// Ejemplo:
// cuantiaBasica = 22.07%
// incrementos = 15.87%
// porcentaje = 22.07% + 15.87% = 37.94%
```

### Paso 5: Calcular Pensión Base

```javascript
function calcularPensionBase(sdiPromedio, porcentajePension) {
  return sdiPromedio * 30.4 * porcentajePension
}

// Ejemplo:
// sdiPromedio = 450 MXN/día
// porcentajePension = 37.94%
// pensionBase = 450 * 30.4 * 0.3794 = 5,189.16 MXN/mes
```

### Paso 6: Aplicar Factor de Edad

```javascript
function aplicarFactorEdad(pensionBase, edad) {
  const factor = factorEdad[edad] || 1.00
  return pensionBase * factor
}

// Ejemplo:
// pensionBase = 5,189.16 MXN
// edad = 65 años → factor = 1.00
// pensionConEdad = 5,189.16 * 1.00 = 5,189.16 MXN
//
// Si edad = 60 años → factor = 0.75
// pensionConEdad = 5,189.16 * 0.75 = 3,891.87 MXN (-25%)
```

### Paso 7: Aplicar Ley Fox

```javascript
function aplicarLeyFox(pensionConEdad) {
  return pensionConEdad * 1.11  // +11%
}

// Ejemplo:
// pensionConEdad = 5,189.16 MXN
// pensionConFox = 5,189.16 * 1.11 = 5,759.97 MXN
```

### Paso 8: Aplicar Asignaciones Familiares

```javascript
function aplicarAsignaciones(pensionConFox, dependiente) {
  const factorAsignacion = 1 + (asignaciones[dependiente] || 0)
  return pensionConFox * factorAsignacion
}

// Ejemplo:
// pensionConFox = 5,759.97 MXN
// dependiente = 'conyuge' → +15%
// pensionFinal = 5,759.97 * 1.15 = 6,623.96 MXN
```

### Paso 9: Validar Pensión Mínima Garantizada (PMG)

```javascript
function aplicarPMG(pensionFinal, año) {
  const uma = getUMA(año)
  const pmg = uma * 30.4  // 1 UMA mensual
  
  if (pensionFinal < pmg) {
    return {
      pensionMensual: pmg,
      pmgAplicada: true,
      pmgValor: pmg
    }
  }
  
  return {
    pensionMensual: pensionFinal,
    pmgAplicada: false
  }
}

// Ejemplo:
// pensionFinal = 2,500 MXN
// UMA 2025 = 113.07
// PMG = 113.07 * 30.4 = 3,437.33 MXN
// pensionFinal < PMG → aplicar PMG
// pensionMensual = 3,437.33 MXN
```

---

## 🎯 Algoritmo de Generación de Estrategias

### allStrats - Generador de Escenarios

**Archivo**: `lib/all/allStrats.ts`

```javascript
function allStrats({
  fechaNacimiento,     // "1970-01-15"
  edadJubilacion,      // 60-65
  semanasPrevias,      // 800
  dependiente,         // "conyuge" | "ninguno"
  umaMin,              // 1
  umaMax,              // 25
  sdiHistorico,        // 492.76 (diario)
  fechaInicio,         // "2025-03-01" (opcional)
  monthsMode           // 'fixed' | 'scan'
}) {
  // 1. Validaciones
  validarParametros(...)
  
  // 2. Calcular edad actual
  const edadActual = calcularEdad(fechaNacimiento)
  
  // 3. Determinar fecha de inicio M40
  const fechaInicioM40 = fechaInicio 
    ? new Date(fechaInicio)
    : edadActual >= 53 ? hoy : fecha53Años
  
  // 4. Calcular meses disponibles
  const fechaJubilacion = new Date(fechaNacimiento)
  fechaJubilacion.setFullYear(
    fechaJubilacion.getFullYear() + edadJubilacion
  )
  
  const mesesDisponibles = calcularMesesEntre(
    fechaInicioM40, 
    fechaJubilacion
  )
  const mesesMax = Math.min(mesesDisponibles, 58)  // Límite legal
  
  // 5. Generar escenarios
  const resultados = []
  
  const mesesIterator = monthsMode === 'scan'
    ? Array.from({ length: mesesMax }, (_, i) => i + 1)  // [1, 2, ..., 58]
    : [mesesMax]  // Solo meses máximos
  
  for (const meses of mesesIterator) {
    for (const estrategia of ['fijo', 'progresivo']) {
      for (const uma of range(umaMin, umaMax)) {
        try {
          const resultado = calcularEscenario({
            mesesM40: meses,
            estrategia,
            semanasPrevias,
            edad: edadJubilacion,
            dependiente,
            umaElegida: uma,
            sdiHistorico,
            inicioM40: fechaInicioM40
          })
          
          resultados.push(resultado)
        } catch (error) {
          console.warn(`Error en escenario ${meses}-${estrategia}-${uma}`)
        }
      }
    }
  }
  
  // 6. Filtrar y ordenar por ROI
  return resultados
    .filter(r => r.pensionMensual !== null)
    .sort((a, b) => (b.ROI || 0) - (a.ROI || 0))
}
```

**Ejemplo de Generación**:
- `umaMin = 1`, `umaMax = 25`
- `monthsMode = 'scan'`, `mesesMax = 36`
- **Total escenarios**: 36 meses × 2 estrategias × 25 UMAs = **1,800 escenarios**

### calcularEscenario - Cálculo Individual

```javascript
function calcularEscenario({
  mesesM40,          // 36
  estrategia,        // 'fijo'
  semanasPrevias,    // 800
  edad,              // 65
  dependiente,       // 'conyuge'
  umaElegida,        // 15
  sdiHistorico,      // 492.76
  inicioM40          // Date
}) {
  // 1. Calcular SDI promedio 250 semanas
  const sdiPromedio = calcularSDIPromedio250Semanas(
    sdiHistorico,
    semanasPrevias,
    mesesM40,
    umaElegida,
    estrategia,
    inicioM40
  )
  
  // 2. Determinar UMA de referencia (año de jubilación)
  const añoJubilacion = inicioM40.getFullYear() + Math.ceil(mesesM40 / 12)
  const umaReferencia = getUMA(añoJubilacion)
  
  // 3. Calcular cuantía básica
  const grupoSalarial = sdiPromedio / umaReferencia
  const cuantiaBasica = obtenerCuantiaBasica(sdiPromedio, umaReferencia)
  
  // 4. Calcular incrementos
  const semanasM40 = Math.floor((mesesM40 * 30.4) / 7)
  const semanasTotales = semanasPrevias + semanasM40
  const incrementos = calcularIncrementos(semanasTotales, grupoSalarial)
  
  // 5. Calcular porcentaje de pensión
  const porcentaje = calcularPorcentajePension(cuantiaBasica, incrementos)
  
  // 6. Calcular pensión base
  const pensionBase = calcularPensionBase(sdiPromedio, porcentaje)
  
  // 7. Aplicar factores
  const pensionConEdad = aplicarFactorEdad(pensionBase, edad)
  const pensionConFox = aplicarLeyFox(pensionConEdad)
  const pensionConAsignaciones = aplicarAsignaciones(pensionConFox, dependiente)
  
  // 8. Validar PMG
  const { pensionMensual, pmgAplicada } = aplicarPMG(
    pensionConAsignaciones, 
    añoJubilacion
  )
  
  // 9. Calcular inversión total
  const inversionTotal = calcularInversionTotal(
    mesesM40,
    umaElegida,
    estrategia,
    inicioM40
  )
  
  // 10. Calcular ROI
  const ROI = ((pensionMensual * 12) / inversionTotal) * 100
  
  // 11. Generar registros detallados (opcional)
  const registros = generarRegistrosMensuales(...)
  
  return {
    estrategia,
    umaElegida,
    mesesM40,
    pensionMensual,
    ROI,
    inversionTotal,
    pmgAplicada,
    registros
  }
}
```

---

## 🔄 Cálculos Específicos YAM40

### Construcción del Array 250 Semanas con Meses Reales

**Archivo**: `lib/yam40/construirArray250Semanas.ts`

```javascript
function construirArray250Semanas(
  sdiHistorico,     // SDI antes de M40
  mesesConSDI       // Meses ya pagados con SDI real
) {
  const array250 = []
  const semanasM40 = mesesConSDI.length * 4.345  // ~4.345 sem/mes
  const semanasHistoricas = 250 - Math.ceil(semanasM40)
  
  // 1. Semanas históricas (antes de M40)
  for (let i = 0; i < semanasHistoricas; i++) {
    array250.push(sdiHistorico)
  }
  
  // 2. Semanas de M40 con SDI REAL de cada mes
  for (const mes of mesesConSDI) {
    const semanasDelMes = 4.345
    for (let s = 0; s < semanasDelMes; s++) {
      array250.push(mes.sdi)  // SDI real del mes pagado
    }
  }
  
  // 3. Truncar a exactamente 250 semanas
  return array250.slice(0, 250)
}
```

### Calcular SDI Histórico Nuevo

**Archivo**: `lib/yam40/calcularNuevoSDIHistorico.ts`

Cuando un usuario reingresa a M40 después de haber pagado meses, necesita recalcular su SDI histórico.

```javascript
function calcularNuevoSDIHistorico(
  sdiHistoricoOriginal,  // SDI antes del primer M40
  mesesPagadosPrevios    // Meses del primer período M40
) {
  const array250 = construirArray250Semanas(
    sdiHistoricoOriginal,
    mesesPagadosPrevios
  )
  
  // El nuevo SDI histórico es el promedio de las 250 semanas
  const suma = array250.reduce((acc, sdi) => acc + sdi, 0)
  const nuevoSDI = suma / 250
  
  return nuevoSDI
}

// Ejemplo:
// Usuario pagó 18 meses en M40 con UMA 15
// Al reingresar, esos 18 meses forman parte de su historial
// El SDI histórico sube de 492.76 a ~580.00
```

### Calcular Pensión Actual (Ya estoy en M40)

**Archivo**: `lib/yam40/calcularPensionActual.ts`

```javascript
function calcularPensionActual(
  sdiHistorico,          // 492.76
  semanasPrevias,        // 800
  mesesPagados,          // Array de meses con SDI real
  edadJubilacion,        // 65
  dependiente,           // 'conyuge'
  fechaNacimiento        // Date
) {
  // 1. Construir array 250 semanas con meses reales
  const array250 = construirArray250Semanas(sdiHistorico, mesesPagados)
  
  // 2. Calcular SDI promedio
  const sdiPromedio = array250.reduce((a, b) => a + b, 0) / 250
  
  // 3. Calcular semanas totales
  const semanasM40 = mesesPagados.length * 4.345
  const semanasTotales = semanasPrevias + semanasM40
  
  // 4. Calcular pensión (mismo proceso que normal)
  const umaReferencia = getUMA(new Date().getFullYear())
  const cuantiaBasica = obtenerCuantiaBasica(sdiPromedio, umaReferencia)
  const incrementos = calcularIncrementos(semanasTotales, sdiPromedio / umaReferencia)
  const porcentaje = calcularPorcentajePension(cuantiaBasica, incrementos)
  const pensionBase = calcularPensionBase(sdiPromedio, porcentaje)
  const pensionConEdad = aplicarFactorEdad(pensionBase, edadJubilacion)
  const pensionConFox = aplicarLeyFox(pensionConEdad)
  const pensionFinal = aplicarAsignaciones(pensionConFox, dependiente)
  
  // 5. Calcular ROI
  const inversionTotal = mesesPagados.reduce(
    (sum, mes) => sum + (mes.aportacionMensual || 0), 
    0
  )
  const ROI = ((pensionFinal * 12) / inversionTotal) * 100
  
  return {
    pensionMensual: pensionFinal,
    ROI,
    inversionTotal,
    mesesM40: mesesPagados.length,
    sdiPromedio,
    semanasTotales
  }
}
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Usuario Nuevo en M40

**Datos:**
- Fecha de nacimiento: 15/05/1970 (54 años)
- Semanas cotizadas: 800
- Salario bruto mensual: $15,000 MXN
- Estado civil: Casado
- Edad jubilación deseada: 65 años
- Inicio M40: Marzo 2025
- UMA seleccionado: 15
- Estrategia: Fija
- Meses en M40: 36

**Cálculos:**

1. **SDI Histórico**:
   ```
   SDI diario = 15,000 / 30.4 = 493.42 MXN/día
   ```

2. **Array 250 Semanas**:
   - 76 semanas en M40 (36 meses × 30.4 / 7)
   - 174 semanas históricas (250 - 76)
   
   ```
   Semanas 1-174: SDI = 493.42
   Semanas 175-250: SDI = 15 × UMA(2025-2027)
                    = 15 × 113.07-118.72
                    = 1,696.05 - 1,780.80
   ```

3. **SDI Promedio**:
   ```
   Suma = (174 × 493.42) + (76 × 1,738.43 promedio)
   SDI Promedio = 218,106.38 / 250 = 872.43 MXN/día
   ```

4. **Cuantía Básica** (UMA 2028 = 131.50):
   ```
   Grupo Salarial = 872.43 / 131.50 = 6.63 UMAs
   CB% = 13.62% (de tabla, >6.00 UMAs)
   ```

5. **Incrementos**:
   ```
   Semanas totales = 800 + 76 = 876
   Años sobre 500 = (876 - 500) / 52 = 7.23 años
   Incremento anual = 2.433% (de tabla)
   Incremento total = 7.23 × 2.433% = 17.59%
   ```

6. **Porcentaje Pensión**:
   ```
   Porcentaje = 13.62% + 17.59% = 31.21%
   ```

7. **Pensión Base**:
   ```
   Pensión Base = 872.43 × 30.4 × 0.3121 = 8,278.66 MXN/mes
   ```

8. **Factor Edad** (65 años):
   ```
   Pensión con Edad = 8,278.66 × 1.00 = 8,278.66 MXN
   ```

9. **Ley Fox** (+11%):
   ```
   Pensión con Fox = 8,278.66 × 1.11 = 9,189.31 MXN
   ```

10. **Asignaciones** (Cónyuge +15%):
    ```
    Pensión Final = 9,189.31 × 1.15 = 10,567.71 MXN/mes
    ```

11. **Inversión Total** (36 meses):
    ```
    Aportación mensual (15 UMA fijo) ≈ 2,500 MXN
    Total = 2,500 × 36 = 90,000 MXN
    ```

12. **ROI**:
    ```
    ROI = (10,567.71 × 12 / 90,000) × 100 = 141%
    Recuperación = 90,000 / 10,567.71 = 8.5 meses
    ```

### Ejemplo 2: Usuario Ya en M40

**Datos:**
- Ya pagó 18 meses (Feb 2024 - Jul 2025)
- Aportación fija: $5,000 MXN/mes
- SDI histórico original: 492.76 MXN/día
- Quiere saber pensión actual

**Paso 1: Generar Lista SDI Real**:
```javascript
listaSDI = await generarListaSDI({
  fechaInicio: { mes: 2, año: 2024 },
  fechaFin: { mes: 7, año: 2025 },
  tipoEstrategia: 'fija',
  valorInicial: 5000
})

// Resultado:
// Feb 2024: SDI = 1,137.86, UMA = 10.6
// Mar 2024: SDI = 1,137.86, UMA = 10.6
// ...
// Jul 2025: SDI = 1,050.36, UMA = 9.3 (tasa aumentó)
```

**Paso 2: Construir Array 250 Semanas**:
```javascript
array250 = [
  ...Array(172).fill(492.76),      // Semanas históricas
  ...semanasM40ConSDIReal          // 78 semanas con SDI variable
]
```

**Paso 3: Calcular Pensión Actual**:
```javascript
sdiPromedio = suma(array250) / 250 = 612.45 MXN/día
pensionMensual = calcularPension(...) = 6,850.00 MXN/mes
```

**Paso 4: Calcular Mejoras**:
Si paga 20 meses más con UMA 18:
```javascript
nuevoSDIPromedio = 715.80 MXN/día
nuevaPensionMensual = 9,450.00 MXN/mes
incremento = 9,450 - 6,850 = +2,600 MXN/mes (+38%)
```

---

## 🎓 Notas Finales

### Validaciones Importantes

1. **Mínimo 250 semanas totales** para pensión
2. **Edad mínima 40 años** para simulación confiable
3. **Edad >= 53 años** para entrar a M40
4. **Máximo 58 meses** (250 semanas) en M40
5. **PMG siempre se aplica** si pensión < 1 UMA mensual

### Optimizaciones de Performance

1. **Debounce en filtros**: 500ms para evitar cálculos repetidos
2. **Memoización**: Resultados UMA por año
3. **Lazy loading**: Estrategias paginadas (25 por carga)
4. **Worker threads**: Para cálculos masivos (futuro)

### Precisión de Cálculos

- **Redondeo**: 2 decimales para montos MXN
- **Semanas/Mes**: 30.4 / 7 = 4.345 semanas
- **UMA**: 2 decimales de precisión
- **Tasas**: 5 decimales de precisión

---

**Última actualización**: Febrero 2025
