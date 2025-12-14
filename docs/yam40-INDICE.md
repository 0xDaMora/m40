# Índice de Documentación - Sistema yam40

## Documentación Completa

### 1. Reglas de Negocio
**Archivo:** `docs/yam40-reglas-negocio.md`

**Contenido:**
- Límites y restricciones (58 meses, 12 meses reingreso)
- Cálculo de pensión (SDI promedio, Ley 73, factores)
- Meses retroactivos
- Estrategias futuras
- Validaciones críticas

---

### 2. APIs y Formatos de Datos
**Archivo:** `docs/yam40-apis-y-formatos.md`

**Contenido:**
- Documentación de todas las APIs
- Formatos de datos (MesConSDI, FamilyMemberData, etc.)
- Compatibilidad con calculator.ts
- Conversiones y transformaciones
- Flujo de datos completo

---

### 3. Diagramas de Flujo
**Archivo:** `docs/yam40-diagrama-flujo.md`

**Contenido:**
- Flujo principal del usuario
- Flujo de cálculo de pensión actual
- Flujo de cálculo de estrategias futuras
- Flujo de validación y limitantes
- Casos edge y validaciones
- Construcción de array 250 semanas

---

### 4. Validaciones y Casos Edge
**Archivo:** `docs/yam40-validaciones-y-casos-edge.md`

**Contenido:**
- 10 casos edge documentados
- Validaciones críticas
- Casos de prueba recomendados
- Referencias de implementación

---

### 5. Resumen de Implementación
**Archivo:** `docs/yam40-resumen-implementacion.md`

**Contenido:**
- Archivos creados/modificados
- Mejoras implementadas
- Próximos pasos recomendados

---

### 6. Guía de Integración
**Archivo:** `docs/yam40-guia-integracion.md`

**Contenido:**
- Cómo usar los componentes simplificados
- Ejemplos de código
- Guía de migración
- Referencias rápidas

---

## Estructura de Archivos

```
docs/
├── yam40-reglas-negocio.md          # Reglas de negocio completas
├── yam40-apis-y-formatos.md          # APIs y formatos
├── yam40-diagrama-flujo.md           # Diagramas de flujo
├── yam40-validaciones-y-casos-edge.md # Validaciones y casos edge
├── yam40-resumen-implementacion.md   # Resumen de cambios
├── yam40-guia-integracion.md         # Guía de integración
└── yam40-INDICE.md                   # Este archivo

components/yam40/
├── simple/
│   ├── SimplePensionCard.tsx         # Card de pensión simplificada
│   ├── SimpleContributionInput.tsx   # Input de aportación en pesos
│   ├── SimpleMonthsSelector.tsx      # Selector de meses simplificado
│   └── ImprovementOptions.tsx        # Opciones de mejora
├── YaM40Flow.tsx                     # Flujo original (avanzado)
├── YaM40FlowSimplified.tsx           # Flujo simplificado (nuevo)
└── YaM40Results.tsx                  # Resultados (reorganizado)

lib/yam40/
├── adaptarEstrategiaYam40.ts         # Adaptador para EstrategiaDetallada
├── calcularNuevoSDIHistorico.ts     # Cálculo de nuevo SDI (corregido)
├── calcularEstrategiaDesdeCalendario.ts # Filtrado mejorado
└── calcularPensionActual.ts          # Cálculo de pensión actual
```

---

## Guía Rápida

### Para entender el sistema completo:
1. Leer `yam40-reglas-negocio.md` primero
2. Revisar `yam40-diagrama-flujo.md` para entender el flujo
3. Consultar `yam40-apis-y-formatos.md` para detalles técnicos

### Para implementar mejoras UX/UI:
1. Leer `yam40-guia-integracion.md`
2. Revisar componentes en `components/yam40/simple/`
3. Ver ejemplo en `YaM40FlowSimplified.tsx`

### Para debugging:
1. Consultar `yam40-validaciones-y-casos-edge.md`
2. Revisar logs en `calcularPensionActual.ts`
3. Verificar formatos en `yam40-apis-y-formatos.md`

---

## Componentes Clave

### Base Algorítmica
- `lib/all/calculator.ts` - Cálculo base de escenarios
- `lib/all/allStrats.ts` - Generación de todas las estrategias
- `lib/all/constants.ts` - Constantes (UMA, tasas, factores)

### yam40 Específico
- `lib/yam40/calcularPensionActual.ts` - Pensión con meses pagados reales
- `lib/yam40/calcularNuevoSDIHistorico.ts` - Nuevo SDI histórico
- `lib/yam40/limitantesM40.ts` - Validaciones de reingreso y retroactivos

### Componentes UI
- `components/yam40/simple/*` - Componentes simplificados
- `components/yam40/M40Calendar.tsx` - Calendario avanzado (opcional)
- `components/integration/FamilySimulatorIntegration.tsx` - Referencia (funciona bien)

### Producto Final
- `components/EstrategiaDetallada.tsx` - PDF y detalles completos
- `lib/yam40/adaptarEstrategiaYam40.ts` - Adaptador para compatibilidad

---

## Notas Importantes

- **Compatibilidad:** Todos los cambios mantienen compatibilidad con código existente
- **Progresión:** El flujo simplificado permite acceso a opciones avanzadas cuando se necesite
- **Lenguaje:** Simplificado para usuarios no técnicos, pero términos técnicos disponibles en modo avanzado
- **Testing:** Se recomienda testing con usuarios reales antes de producción

