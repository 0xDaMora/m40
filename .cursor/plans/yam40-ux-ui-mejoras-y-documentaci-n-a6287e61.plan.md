<!-- a6287e61-9195-4acb-892a-2ce3986e7bd5 86d399fc-e1ed-4e3e-a2ce-4a0faf187c93 -->
# Mover mejoras a EstrategiaDetalladaYam40

## Objetivo

Eliminar el paso "improvements" del flujo yam40 (datos → pagos → resultado) y crear un nuevo componente de mejoras dentro de EstrategiaDetalladaYam40 que permita mejorar la estrategia guardada en tiempo real.

## Cambios necesarios

### 1. Eliminar paso "improvements" del flujo yam40

**Archivo:** `components/yam40/YaM40FlowSimplified.tsx`

- Cambiar tipo `Step` de `'profile' | 'payments' | 'result' | 'improvements'` a `'profile' | 'payments' | 'result'`
- Eliminar import de `ImprovementOptions`
- Eliminar el bloque completo de `{currentStep === 'improvements' && ...}` (líneas ~798-832)
- Eliminar 'improvements' del array de steps en el indicador de progreso (línea ~573)
- Eliminar 'improvements' del array `stepOrder` (línea ~578)
- Eliminar función `handleCalculateImprovement` (líneas ~437-540) ya que no se usará en el flujo

### 2. Eliminar botón "Ver cómo aumentar mi pensión"

**Archivo:** `components/yam40/simple/SimplePensionCard.tsx`

- Eliminar prop `onVerMejoras` de la interfaz `SimplePensionCardProps`
- Eliminar el bloque completo del botón `{onVerMejoras && ...}` (líneas ~367-377)
- Eliminar la llamada a `onVerMejoras={() => setCurrentStep('improvements')}` en `YaM40FlowSimplified.tsx` (línea ~784)

### 3. Crear nuevo componente de mejoras para EstrategiaDetalladaYam40

**Archivo:** `components/yam40/Yam40MejorasEstrategia.tsx` (nuevo)

Componente que:

- Recibe como props:
  - `estrategiaActual`: datos de la estrategia guardada
  - `datosUsuario`: datos del usuario guardados
  - `fechaInicioM40`: fecha inicio M40 guardada
  - `fechaFinM40`: fecha fin M40 guardada
  - `tipoPago`: tipo de pago guardado ('aportacion' | 'uma')
  - `valorInicial`: valor inicial guardado
  - `sdiHistorico`: SDI histórico guardado
  - `semanasPrevias`: semanas previas guardadas
  - `edadJubilacion`: edad de jubilación guardada (no modificable)
  - `dependiente`: dependiente guardado
  - `listaSDI`: lista SDI guardada (si modo manual)
- Permite al usuario:
  - Agregar meses adicionales (input numérico con validación: máximo 58 - mesesM40 actuales)
  - Agregar aportación adicional (input numérico, debe ser >= aportación promedio actual)
- Calcula en tiempo real usando `calcularEscenarioYam40Recrear`:
  - Extiende `fechaFinM40` con los meses adicionales
  - Usa `aportacionAdicional` como nuevo `valorInicial` si es mayor
  - Recalcula la pensión con los meses adicionales
- Muestra comparación visual:
  - Pensión actual vs pensión mejorada
  - Diferencia en pesos y porcentaje
  - Meses adicionales a pagar
  - Aportación adicional mensual
  - Inversión total adicional
  - ROI de la mejora

### 4. Agregar tab "Mejoras" en EstrategiaDetalladaYam40

**Archivo:** `components/yam40/EstrategiaDetalladaYam40.tsx`

- Agregar nuevo tab en el array `tabs`:
  ```typescript
  { id: "mejoras", label: "🚀 Mejorar Estrategia", icon: TrendingUp }
  ```

- Importar el nuevo componente `Yam40MejorasEstrategia`
- Agregar bloque de contenido para el tab "mejoras":
  ```typescript
  {tabActivo === "mejoras" && (
    <Yam40MejorasEstrategia
      key="tab-mejoras"
      estrategiaActual={estrategia}
      datosUsuario={datosUsuario}
      fechaInicioM40={fechaInicioM40}
      fechaFinM40={fechaFinM40}
      tipoPago={estrategia.tipoPago || 'aportacion'}
      valorInicial={/* extraer de registros o datosEstrategia */}
      sdiHistorico={/* extraer de datosUsuario o datosEstrategia */}
      semanasPrevias={datosUsuario.semanasPrevias || datosEstrategia.semanasPrevias}
      edadJubilacion={parseInt(estrategia.edadJubilacion) || 65}
      dependiente={datosUsuario.dependiente || 'ninguno'}
      listaSDI={/* si modo manual, extraer de datosEstrategia.listaSDI */}
    />
  )}
  ```


### 5. Lógica de cálculo de mejoras

**Archivo:** `components/yam40/Yam40MejorasEstrategia.tsx`

La función de cálculo debe:

1. Calcular nueva `fechaFinM40` extendiendo con meses adicionales
2. Determinar nueva aportación: usar `aportacionAdicional` si es mayor que aportación promedio actual
3. Si `tipoPago === 'uma'`, convertir aportación a UMA
4. Llamar a `calcularEscenarioYam40Recrear` con:

   - Mismos datos base (fechaNacimiento, semanasPrevias, sdiHistorico, edadJubilacion, dependiente)
   - Nueva `fechaFinM40` (extendida)
   - Mismo `tipoPago` o 'aportacion' si cambió
   - Nuevo `valorInicial` (aportación adicional)
   - Si hay `listaSDI`, extenderla con los meses adicionales

5. Comparar resultado con estrategia actual y mostrar diferencias

## Notas importantes

- La edad de jubilación NO se puede cambiar (ya está guardada)
- La estrategia actual está guardada y no se modifica
- Los cálculos son en tiempo real con debounce (500ms)
- El componente debe validar que meses adicionales no excedan 58 meses totales
- El componente debe validar que aportación adicional >= aportación promedio actual

### To-dos

- [ ] Eliminar componentes no usados: YaM40Flow, YaM40Results, M40Calendar.old, M40Calendar.refactored, SDIHistoricoInput, AsignarSDIModal, ProfileSummary
- [ ] Eliminar directorio calendar/ completo (no usado en flujo simple)
- [ ] Eliminar funciones no usadas en lib/yam40: calcularPensionActual, calcularPensionHistorica, calcularEstrategiaDesdeCalendario, calculatorYam40
- [ ] Eliminar APIs no usadas: calculate-historical-pension, guardar-estrategia-calendario
- [ ] Remover import de M40Calendar en YaM40FlowSimplified si no se usa realmente
- [ ] Limpiar código duplicado y funciones no usadas