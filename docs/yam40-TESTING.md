# Guía de Testing - Flujo Simplificado yam40

## Estado Actual

✅ **Flujo simplificado configurado como default** en `app/yam40/page.tsx`

## Cómo Probar

### 1. Iniciar el servidor de desarrollo
```bash
npm run dev
```

### 2. Navegar a `/yam40`
El flujo simplificado debería aparecer automáticamente.

---

## Flujo de Testing Paso a Paso

### Paso 1: Datos del Perfil
**Qué probar:**
- [ ] Ingresar nombre completo
- [ ] Seleccionar fecha de nacimiento (entre 1959-1979)
- [ ] Ingresar semanas cotizadas previas (ej: 500)
- [ ] Seleccionar estado civil
- [ ] Verificar que el botón "Ver mi pensión" se habilite cuando todos los campos estén completos

**Validaciones esperadas:**
- El formulario muestra errores si faltan campos
- La fecha de nacimiento valida el rango correcto
- Las semanas cotizadas aceptan números positivos

---

### Paso 2: Información de Pagos
**Qué probar:**
- [ ] Ingresar aportación mensual usando el slider o input (ej: 5000 pesos)
- [ ] Verificar que muestra la conversión a UMA como información
- [ ] Seleccionar número de meses pagados usando los botones +/-
- [ ] Verificar que la barra de progreso muestra correctamente (X de 58 meses)
- [ ] Ingresar último salario antes de M40 (ej: 15000)

**Validaciones esperadas:**
- El slider permite ajustar entre 1000 y máximo permitido
- Los meses no pueden exceder 58
- El cálculo automático se ejecuta cuando todos los datos están completos

---

### Paso 3: Resultado de Pensión
**Qué probar:**
- [ ] Verificar que aparece la pensión mensual grande y clara
- [ ] Verificar que muestra pensión anual y con aguinaldo
- [ ] Verificar que muestra el progreso (X de 58 meses pagados)
- [ ] Verificar que el botón "Ver mejoras" funciona
- [ ] Verificar que "Ver opciones avanzadas" muestra/oculta el calendario

**Validaciones esperadas:**
- La pensión se calcula correctamente basada en los datos ingresados
- El estado de carga se muestra mientras calcula
- Los números están formateados correctamente (con separadores de miles)

---

### Paso 4: Opciones de Mejora
**Qué probar:**
- [ ] Ingresar aportación adicional (ej: 7000 pesos)
- [ ] Seleccionar meses adicionales (ej: 12 meses)
- [ ] Verificar que muestra comparación antes/después
- [ ] Verificar que muestra diferencia y porcentaje de mejora
- [ ] Verificar que el cálculo se ejecuta automáticamente (con debounce)

**Validaciones esperadas:**
- El cálculo de mejora se ejecuta correctamente
- Muestra resultados claros de comparación
- Maneja errores gracefully si el cálculo falla

---

### Paso 5: Opciones Avanzadas (Opcional)
**Qué probar:**
- [ ] Hacer clic en "Ver opciones avanzadas"
- [ ] Verificar que aparece el calendario completo de 58 meses
- [ ] Verificar que se puede interactuar con el calendario
- [ ] Verificar que los cambios en el calendario actualizan los cálculos

---

## Casos de Prueba Específicos

### Caso 1: Usuario Nuevo (Sin datos previos)
1. Ingresar datos mínimos requeridos
2. Verificar que puede avanzar al resultado
3. Verificar que la pensión se calcula correctamente

### Caso 2: Usuario con Muchos Meses Pagados
1. Ingresar 50 meses pagados
2. Verificar que muestra "50 de 58 meses"
3. Verificar que solo puede agregar 8 meses más en mejoras

### Caso 3: Usuario con Aportación Alta
1. Ingresar aportación cercana al máximo (ej: 24000)
2. Verificar que el sistema acepta el valor
3. Verificar que la conversión a UMA es correcta

### Caso 4: Cálculo de Mejora
1. Completar todos los datos del paso 1 y 2
2. Ver resultado de pensión actual
3. Ir a mejoras y agregar 12 meses con aportación mayor
4. Verificar que la nueva pensión es mayor que la actual

---

## Errores Comunes a Verificar

### Error 1: Cálculo no se ejecuta automáticamente
**Síntoma:** No aparece pensión después de completar datos
**Solución:** Verificar que todos los campos requeridos están completos:
- `state.profile.birthDate`
- `state.sdiHistorico.value > 0`
- `mesesPagadosCount > 0`
- `state.profile.totalWeeksContributed > 0`

### Error 2: Pensión muestra null o 0
**Síntoma:** La pensión aparece como $0 o no aparece
**Solución:** 
- Verificar que `calcularPensionActual` retorna un resultado válido
- Verificar que los meses pagados tienen SDI correcto
- Revisar logs de consola para errores

### Error 3: Mejoras no calculan
**Síntoma:** Al ingresar mejoras, no aparece resultado
**Solución:**
- Verificar que la API `/api/calculate-strategies` está funcionando
- Verificar que `handleCalculateImprovement` está conectado correctamente
- Revisar logs de consola para errores de red

---

## Checklist de Testing

### Funcionalidad Básica
- [ ] El flujo simplificado carga correctamente
- [ ] Los 3 pasos funcionan correctamente
- [ ] La navegación entre pasos funciona (botones Atrás)
- [ ] Los indicadores de progreso se actualizan correctamente

### Componentes Simplificados
- [ ] SimplePensionCard muestra pensión correctamente
- [ ] SimpleContributionInput acepta valores y muestra conversión
- [ ] SimpleMonthsSelector permite seleccionar meses
- [ ] ImprovementOptions calcula y muestra mejoras

### Cálculos
- [ ] La pensión actual se calcula correctamente
- [ ] Las mejoras se calculan correctamente
- [ ] Los valores están formateados correctamente
- [ ] Los porcentajes y diferencias son correctos

### UX/UI
- [ ] El lenguaje es claro y comprensible
- [ ] Los componentes son visualmente atractivos
- [ ] La progresión es intuitiva
- [ ] Los errores se muestran claramente

### Responsive
- [ ] Funciona correctamente en móvil
- [ ] Funciona correctamente en tablet
- [ ] Funciona correctamente en desktop

---

## Datos de Prueba Sugeridos

### Usuario de Prueba 1
- Nombre: "Juan Pérez"
- Fecha de nacimiento: 15/03/1970
- Semanas cotizadas: 500
- Estado civil: Soltero
- Aportación mensual: 5000 pesos
- Meses pagados: 10
- Último salario: 15000 pesos

### Usuario de Prueba 2
- Nombre: "María González"
- Fecha de nacimiento: 20/05/1965
- Semanas cotizadas: 800
- Estado civil: Casado
- Aportación mensual: 8000 pesos
- Meses pagados: 25
- Último salario: 20000 pesos

---

## Notas para Testing con Usuarios Reales

1. **Observar comprensión:** ¿Entienden qué significa cada campo?
2. **Observar navegación:** ¿Saben cómo avanzar entre pasos?
3. **Observar lenguaje:** ¿Hay términos que confunden?
4. **Observar resultados:** ¿Entienden qué significa la pensión mostrada?
5. **Observar mejoras:** ¿Entienden cómo pueden mejorar su pensión?

---

## Reportar Problemas

Si encuentras problemas durante el testing:

1. Anotar el paso exacto donde ocurre
2. Capturar screenshot si es posible
3. Revisar consola del navegador para errores
4. Verificar logs del servidor si aplica
5. Documentar datos de entrada que causan el problema

---

## Próximos Pasos Después del Testing

1. **Ajustes basados en feedback:** Modificar lenguaje, visualización, etc.
2. **Optimización:** Mejorar rendimiento si es necesario
3. **Documentación de usuario:** Crear guías para usuarios finales
4. **Deployment:** Preparar para producción después de validación

