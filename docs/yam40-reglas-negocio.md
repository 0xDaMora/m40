# Reglas de Negocio del Sistema yam40

## Límites y Restricciones Críticas

### Límite de Meses en Modalidad 40
- **Máximo:** 58 meses (250 semanas) en total
- **Razón:** El IMSS calcula la pensión basándose en los últimos 58 meses (250 semanas) antes de la jubilación
- **Validación:** El sistema debe prevenir que se agreguen más de 58 meses en total
- **Cálculo:** `mesesPagados + mesesPlanificados + mesesRetroactivos ≤ 58`

### Límite de Reingreso
- **Regla:** Si un usuario deja de pagar M40 por más de 12 meses consecutivos, **NO puede reingresar**
- **Cálculo:** `fechaActual - ultimaFechaPagada ≤ 12 meses`
- **Meses Retroactivos:** Si el gap es menor a 12 meses, se deben pagar los meses faltantes retroactivamente
- **Validación:** `calcularLimitantesM40()` determina si puede reingresar y calcula meses retroactivos

### Edad de Jubilación
- **Rango válido:** 60-65 años
- **Validación:** La edad de jubilación debe ser mayor a la edad actual
- **Cálculo de meses disponibles:** `(edadJubilacion - edadActual) * 12`, máximo 58 meses

### Semanas Cotizadas Mínimas
- **Mínimo total:** 500 semanas cotizadas para tener derecho a pensión
- **Cálculo:** `semanasPrevias + semanasM40 ≥ 500`
- **Semanas M40:** `mesesM40 * 4.33` (redondeado hacia abajo)
- **Validación:** Si no cumple, la pensión será `null` con error "Insuficientes semanas cotizadas"

## Cálculo de Pensión

### SDI Promedio (Salario Diario Integrado Promedio)

**Regla Principal:** El IMSS calcula la pensión usando el promedio de SDI de los últimos 58 meses (250 semanas).

#### Caso 1: 58 o más meses M40 pagados
- **Cálculo:** Promedio directo de los últimos 58 meses de M40
- **Fórmula:** `sdiPromedio = suma(ultimos58Meses.sdi) / 58`
- **Implementación:** `calcularPensionActual()` líneas 128-133

#### Caso 2: Menos de 58 meses M40 pagados
- **Cálculo:** Se completa con SDI histórico hasta llegar a 58 meses
- **Construcción:** Array de 250 semanas donde:
  - Las primeras semanas se llenan con SDI histórico
  - Las últimas semanas se reemplazan con SDI de meses M40 pagados
- **Fórmula:** `sdiPromedio = suma(array250Semanas) / 250`
- **Implementación:** `calcularPensionActual()` líneas 145-186

**Nota importante:** Los meses M40 deben estar ordenados cronológicamente (más antiguo primero) para reemplazar correctamente las últimas semanas del array.

### Porcentaje según Ley 73 (Artículo 167)

**Tabla de Grupos:**
- Se determina el grupo según `vecesUMA = sdiPromedio / UMA(añoJubilacion)`
- Cada grupo tiene un porcentaje base (CB%) y un incremento por cada 52 semanas adicionales (INC%)
- **Fórmula:** `porcentaje = CB + INC * floor((semanasTotales - 500) / 52)`
- **Implementación:** `porcentajeLey73()` en `lib/all/utils.ts`

**Ejemplo:**
- Si `vecesUMA = 2.5` → Grupo 2.50 (CB: 37.65%, INC: 1.756%)
- Si `semanasTotales = 600` → Incrementos: `floor((600-500)/52) = 1`
- Porcentaje final: `37.65 + 1.756 * 1 = 39.406%`

### Factores Aplicados

1. **Factor de Edad (Art. 171):**
   - 60 años: 0.75
   - 61 años: 0.80
   - 62 años: 0.85
   - 63 años: 0.90
   - 64 años: 0.95
   - 65 años: 1.00
   - **Fórmula:** `pension = pensionBase * factorEdad[edad]`

2. **Ley Fox (11%):**
   - Aplica a todos los casos
   - **Fórmula:** `pension = pension * 1.11`

3. **Asignaciones Familiares (Art. 164):**
   - Ninguno: 0%
   - Cónyuge: 15%
   - Hijos: 10% cada uno
   - Ascendientes: 10% cada uno
   - **Fórmula:** `pension = pension * (1 + asignaciones[dependiente])`

**Orden de aplicación:**
1. Porcentaje Ley 73 → `pensionBase`
2. Factor edad → `conFactorEdad`
3. Ley Fox → `conLeyFox`
4. Asignaciones → `pensionFinal`

### Pensión Mínima Garantizada (PMG)

- Si la pensión calculada es menor a la PMG, se ajusta a la PMG
- **Valor actual:** Definido en `lib/config/pensionMinima.ts`
- **Implementación:** `ajustarPensionConPMG()` en `calcularPensionActual()`

## Meses Retroactivos

### Condiciones para Meses Retroactivos

**Solo se calculan si:**
1. Hay un gap temporal entre el último mes pagado y la fecha actual/inicio de planificación
2. El gap es menor a 12 meses (si es mayor, no puede reingresar)
3. El total de meses no excedería 58 meses

**NO se calculan si:**
- Los meses pagados son consecutivos (mes 1, 2, 3... N)
- Ya se alcanzaron 58 meses pagados
- No hay gap temporal real

### Cálculo de Meses Retroactivos

**Implementación:** `calcularLimitantesM40()` en `lib/yam40/limitantesM40.ts`

**Proceso:**
1. Encontrar último mes pagado (por fecha, no por número de mes)
2. Calcular fecha límite de reingreso (12 meses después del último pago)
3. Si hay fecha de inicio de planificación:
   - Calcular meses faltantes entre último pago y mes anterior al inicio
   - Solo si hay gap temporal real
4. Si no hay fecha de inicio:
   - Si hay meses disponibles (menos de 58), esos son futuros, no retroactivos
   - Solo calcular retroactivos si ya se alcanzaron 58 meses

**Validación:** Los meses retroactivos deben tener `esRetroactivo: true` y no exceder el límite de 58 meses totales.

## Estrategias Futuras

### Cálculo de Nuevo SDI Histórico

Cuando un usuario ya tiene meses pagados y quiere calcular estrategias futuras:

**Proceso:**
1. Calcular promedio de SDI de los meses M40 ya pagados
2. Combinar con SDI histórico original según proporción
3. **Fórmula:** `nuevoSDIHistorico = promedio(mesesPagados.sdi) * pesoM40 + sdiHistorico * pesoHistorico`
4. **Implementación:** `calcularNuevoSDIHistorico()` en `lib/yam40/calcularNuevoSDIHistorico.ts`

**Uso:** Este nuevo SDI histórico se usa para calcular estrategias futuras que continúan desde donde el usuario ya pagó.

### Generación de Estrategias

**Modo 'fixed':**
- Genera estrategias solo para el número exacto de meses especificado
- Usado cuando se quiere una estrategia específica

**Modo 'scan':**
- Genera estrategias para todos los meses posibles (1 hasta mesesDisponibles)
- Usado en yam40 para mostrar todas las opciones posibles
- **Implementación:** `allStrats()` con `monthsMode: 'scan'`

**Parámetros:**
- `mesesDisponibles`: `min(58 - mesesPagados, (edadJubilacion - edadActual) * 12)`
- `semanasPrevias`: `semanasAntesM40 + semanasM40Pagadas`
- `sdiHistorico`: Nuevo SDI histórico calculado

## Validaciones Críticas

### Validación de Meses
- `mesesM40 >= 1 && mesesM40 <= 120` (en calculator.ts, pero máximo real es 58)
- `totalMesesConSDI <= 58` (validación en frontend)

### Validación de Edad
- `edadActual >= 40` (mínimo para simulación confiable)
- `edadActual < edadJubilacion`
- `edadJubilacion >= 60 && edadJubilacion <= 65`

### Validación de UMA
- `umaElegida >= 1 && umaElegida <= 25`
- UMA se convierte a SDI: `sdiMensual = uma * UMA(año) * 30.4`
- **Límite máximo de aportación: 25 UMA (varía por año según UMA del año)**
  - El límite debe calcularse según el año de cada mes pagado
  - Fórmula: `aportacionMaxima(año) = 25 * UMA(año) * tasaM40(año) * 30.4`
  - Ejemplo: Para 2025, si UMA=113.07 y tasa=0.13347, máximo ≈ $11,500
  - **CRÍTICO:** No usar un valor fijo en pesos, siempre calcular según el año correspondiente

### Validación de SDI
- SDI puede estar en formato diario o mensual
- **Detección:** Si SDI > 10,000, se asume mensual y se convierte a diario: `sdiDiario = sdiMensual / 30.4`
- **Rango típico:** SDI diario: 100-5,000, SDI mensual: 3,000-150,000

### Validación de Semanas
- `semanasPrevias >= 250` (mínimo para simulación válida)
- `semanasTotales >= 500` (mínimo para pensión)

## Conversiones y Cálculos Auxiliares

### SDI Mensual a Diario
- `sdiDiario = sdiMensual / 30.4`
- Usado para cálculos internos (el IMSS trabaja con SDI diario)

### SDI Diario a Mensual
- `sdiMensual = sdiDiario * 30.4`
- Usado para mostrar resultados al usuario

### Meses a Semanas
- `semanasM40 = floor(mesesM40 * 4.33)`
- Cada mes tiene aproximadamente 4.33 semanas

### UMA a SDI Mensual
- `sdiMensual = uma * UMA(año) * 30.4`
- UMA varía por año (crecimiento 5% anual desde 2025)

### Cuota Mensual M40
- `cuotaMensual = sdiMensual * tasaM40(año)`
- Tasa M40 varía por año (escalonada hasta 2030, luego fija en 18.8%)

## Casos Edge y Manejo de Errores

### Caso: Usuario con 58 meses completos
- No puede agregar más meses
- No se calculan meses retroactivos
- Pensión se calcula solo con los 58 meses M40

### Caso: Gap mayor a 12 meses
- No puede reingresar a M40
- Mensaje de error: "Ya no puedes reingresar a Modalidad 40"
- No se calculan estrategias futuras

### Caso: Menos de 500 semanas totales
- Pensión será `null`
- Error: "Insuficientes semanas cotizadas (mínimo 500)"
- Se muestra mensaje al usuario

### Caso: Edad de jubilación menor a edad actual
- Error: "Ya tiene la edad de jubilación deseada"
- No se pueden calcular estrategias

### Caso: SDI histórico inválido
- Validación: `sdiHistorico > 0`
- Si es 0 o negativo, error en validación

## Referencias de Implementación

- **Cálculo de pensión actual:** `lib/yam40/calcularPensionActual.ts`
- **Cálculo de limitantes:** `lib/yam40/limitantesM40.ts`
- **Cálculo de nuevo SDI histórico:** `lib/yam40/calcularNuevoSDIHistorico.ts`
- **Cálculo de escenario base:** `lib/all/calculator.ts`
- **Generación de estrategias:** `lib/all/allStrats.ts`
- **Utilidades:** `lib/all/utils.ts`
- **Constantes:** `lib/all/constants.ts`

