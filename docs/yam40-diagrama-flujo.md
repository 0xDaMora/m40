# Diagrama de Flujo Completo - Sistema yam40

## Flujo Principal del Usuario

```mermaid
flowchart TD
    Start([Usuario entra a yam40]) --> Step1[Paso 1: Información Básica]
    
    Step1 --> UserProfile[UserProfileCard]
    UserProfile --> |Nombre, Fecha Nacimiento<br/>Edad Jubilación<br/>Semanas Cotizadas| SDIInput[SDIHistoricoInput]
    
    SDIInput --> |SDI Histórico<br/>Meses Pagados| Validate1{Validar Datos}
    
    Validate1 --> |Incompleto| Step1
    Validate1 --> |Completo| Step2[Paso 2: Calendario]
    
    Step2 --> Calendar[M40Calendar]
    Calendar --> |Seleccionar meses pagados| CalcPension[Calcular Pensión Actual]
    
    CalcPension --> |mesesPagados| CheckPeriodos{¿Hay períodos<br/>históricos?}
    
    CheckPeriodos --> |Sí| APIHist[/api/calculate-historical-pension]
    CheckPeriodos --> |No| CalcLocal[calcularPensionActual]
    
    APIHist --> PensionResult[Resultado Pensión Actual]
    CalcLocal --> PensionResult
    
    PensionResult --> CheckLimitantes[Calcular Limitantes M40]
    CheckLimitantes --> |calcularLimitantesM40| Retroactivos{¿Hay meses<br/>retroactivos?}
    
    Retroactivos --> |Sí| AddRetro[Agregar meses retroactivos<br/>a mesesConSDI]
    Retroactivos --> |No| CheckFuturos{¿Hay meses<br/>futuros planificados?}
    
    AddRetro --> CheckFuturos
    
    CheckFuturos --> |Sí| CalcFuturos[Calcular Estrategias Futuras]
    CheckFuturos --> |No| Results[YaM40Results]
    
    CalcFuturos --> |construirFamilyMemberData<br/>construirIntegrationFilters| APIStrategies[/api/calculate-strategies]
    APIStrategies --> |allStrats| FilterStrategies[Filtrar Estrategias<br/>según calendario]
    FilterStrategies --> Results
    
    Results --> ShowPension[Mostrar Pensión Actual]
    ShowPension --> ShowOptions[Mostrar Opciones de Mejora]
    ShowOptions --> UserAction{¿Usuario quiere<br/>ver detalles?}
    
    UserAction --> |Sí| AdaptStrategy[Adaptar Estrategia para<br/>EstrategiaDetallada]
    UserAction --> |No| End([Fin])
    
    AdaptStrategy --> EstrategiaDetallada[EstrategiaDetallada<br/>PDF/Detalles]
    EstrategiaDetallada --> End
```

## Flujo de Cálculo de Pensión Actual

```mermaid
flowchart TD
    Start([Inicio: Calcular Pensión Actual]) --> Input[Input: mesesPagados, sdiHistorico,<br/>semanasPrevias, edadJubilacion]
    
    Input --> Validate{Validar Datos}
    Validate --> |Error| Error[Retornar Error]
    Validate --> |OK| Normalize[Normalizar SDI a diario]
    
    Normalize --> |SDI > 10000| Convert[Convertir mensual a diario<br/>sdiDiario = sdi / 30.4]
    Normalize --> |SDI <= 10000| UseDirect[Usar SDI directo]
    
    Convert --> Order[Ordenar meses pagados<br/>por número de mes]
    UseDirect --> Order
    
    Order --> CheckMonths{Meses pagados<br/>>= 58?}
    
    CheckMonths --> |Sí| CalcDirect[Calcular promedio directo<br/>de últimos 58 meses]
    CheckMonths --> |No| BuildArray[Construir array 250 semanas]
    
    CalcDirect --> CalcSDI[SDI Promedio =<br/>suma últimos 58 / 58]
    BuildArray --> |Llenar con SDI histórico<br/>Reemplazar últimas semanas<br/>con meses M40| CalcSDI
    
    CalcSDI --> CalcWeeks[Calcular semanas totales<br/>semanasPrevias + semanasM40]
    
    CalcWeeks --> CheckWeeks{Semanas totales<br/>>= 500?}
    CheckWeeks --> |No| ErrorWeeks[Error: Insuficientes semanas]
    CheckWeeks --> |Sí| CalcPercent[Calcular porcentaje Ley 73<br/>porcentajeLey73]
    
    CalcPercent --> CalcBase[Pensión Base =<br/>porcentaje / 100 * sdiPromedio]
    
    CalcBase --> ApplyAge[Aplicar Factor Edad<br/>pension * factorEdad]
    ApplyAge --> ApplyFox[Aplicar Ley Fox<br/>pension * 1.11]
    ApplyFox --> ApplyDep[Aplicar Asignaciones<br/>pension * 1 + asignaciones]
    
    ApplyDep --> CheckPMG{¿Pensión < PMG?}
    CheckPMG --> |Sí| ApplyPMG[Ajustar a PMG]
    CheckPMG --> |No| CalcMetrics[Calcular métricas finales]
    
    ApplyPMG --> CalcMetrics
    
    CalcMetrics --> |ROI, Recuperación,<br/>Pensión con aguinaldo| Return[Retornar Resultado]
    
    Error --> Return
    ErrorWeeks --> Return
```

## Flujo de Cálculo de Estrategias Futuras

```mermaid
flowchart TD
    Start([Inicio: Calcular Estrategias Futuras]) --> Input[Input: mesesPagados, mesesFuturos,<br/>sdiHistorico, semanasPrevias]
    
    Input --> CalcNewSDI[Calcular Nuevo SDI Histórico<br/>calcularNuevoSDIHistorico]
    
    CalcNewSDI --> |Promedio meses pagados<br/>+ SDI histórico| BuildFamily[Construir FamilyMemberData]
    
    BuildFamily --> |birthDate, weeksContributed<br/>lastGrossSalary, civilStatus| BuildFilters[Construir IntegrationFilters]
    
    BuildFilters --> |monthlyContributionRange<br/>months, retirementAge<br/>startMonth/Year, monthsMode| CallAPI[Llamar /api/calculate-strategies]
    
    CallAPI --> |allStrats con<br/>nuevo SDI histórico| Generate[Generar todas las estrategias<br/>posibles 1..mesesDisponibles]
    
    Generate --> Filter[Filtrar estrategias según<br/>meses futuros planificados<br/>filtrarEstrategiaCalendario]
    
    Filter --> |Encontrar estrategia que<br/>coincide con calendario| Return[Retornar Estrategias]
    
    Return --> End([Fin])
```

## Flujo de Validación y Limitantes

```mermaid
flowchart TD
    Start([Inicio: Validar Limitantes M40]) --> Input[Input: mesesPagados, fechaActual]
    
    Input --> CheckEmpty{¿Hay meses<br/>pagados?}
    
    CheckEmpty --> |No| Allow[Permitir inicio normal<br/>puedeReingresar = true]
    CheckEmpty --> |Sí| FindLast[Encontrar último mes pagado<br/>por fecha real]
    
    FindLast --> CalcLimit[Calcular fecha límite<br/>reingreso = últimoPago + 12 meses]
    
    CalcLimit --> CheckLimit{¿Fecha actual<br/>> límite?}
    
    CheckLimit --> |Sí| Deny[No puede reingresar<br/>puedeReingresar = false<br/>mensajeError]
    CheckLimit --> |No| CheckTotal{¿Total meses<br/>>= 58?}
    
    CheckTotal --> |Sí| NoRetro[No hay retroactivos<br/>mesesRetroactivos = []]
    CheckTotal --> |No| CheckGap{¿Hay gap temporal<br/>entre último pago<br/>y fecha actual/inicio?}
    
    CheckGap --> |No| NoRetro
    CheckGap --> |Sí| CalcRetro[Calcular meses retroactivos<br/>desde mes siguiente al último<br/>hasta fecha límite]
    
    CalcRetro --> ValidateRetro{¿Total + retroactivos<br/>> 58?}
    
    ValidateRetro --> |Sí| LimitRetro[Limitar retroactivos<br/>a 58 - total]
    ValidateRetro --> |No| ReturnRetro[Retornar meses retroactivos]
    
    LimitRetro --> ReturnRetro
    Allow --> Return[Retornar Resultado]
    Deny --> Return
    NoRetro --> Return
    ReturnRetro --> Return
```

## Casos Edge y Validaciones

```mermaid
flowchart TD
    Start([Validación de Datos]) --> ValidateAge{Edad Jubilación<br/>60-65?}
    
    ValidateAge --> |No| ErrorAge[Error: Edad inválida]
    ValidateAge --> |Sí| ValidateWeeks{Semanas previas<br/>>= 250?}
    
    ValidateWeeks --> |No| ErrorWeeks[Error: Mínimo 250 semanas]
    ValidateWeeks --> |Sí| ValidateSDI{SDI histórico<br/>> 0?}
    
    ValidateSDI --> |No| ErrorSDI[Error: SDI inválido]
    ValidateSDI --> |Sí| ValidateMonths{Meses pagados<br/>> 0?}
    
    ValidateMonths --> |No| ErrorMonths[Error: Selecciona al menos un mes]
    ValidateMonths --> |Sí| ValidateTotal{Total meses<br/><= 58?}
    
    ValidateTotal --> |No| ErrorTotal[Error: Máximo 58 meses]
    ValidateTotal --> |Sí| ValidateReentry{¿Puede reingresar?<br/>Gap <= 12 meses?}
    
    ValidateReentry --> |No| ErrorReentry[Error: No puede reingresar<br/>Gap > 12 meses]
    ValidateReentry --> |Sí| Success[Validación exitosa]
    
    ErrorAge --> End([Fin])
    ErrorWeeks --> End
    ErrorSDI --> End
    ErrorMonths --> End
    ErrorTotal --> End
    ErrorReentry --> End
    Success --> End
```

## Flujo de Adaptación para EstrategiaDetallada

```mermaid
flowchart TD
    Start([Adaptar Estrategia yam40]) --> Input[Input: mesesPagados, mesesFuturos,<br/>pensionActual, datosUsuario]
    
    Input --> Combine[Combinar meses pagados<br/>+ meses futuros]
    
    Combine --> GenerateRegs[Generar registros completos<br/>para 58 meses]
    
    GenerateRegs --> |Para cada mes:<br/>fecha, uma, tasaM40,<br/>sdiMensual, cuotaMensual,<br/>acumulado| BuildStrategy[Construir objeto estrategia<br/>compatible con EstrategiaDetallada]
    
    BuildStrategy --> |estrategia, umaElegida,<br/>mesesM40, pensionMensual,<br/>inversionTotal, ROI,<br/>registros completos| BuildUserData[Construir datosUsuario<br/>con información correcta]
    
    BuildUserData --> |inicioM40 basado en<br/>primer mes pagado<br/>fechaNacimiento, edadJubilacion| AdaptDates[Ajustar fechas:<br/>fechaInicioM40, fechaFinM40,<br/>fechaTramite, fechaJubilacion]
    
    AdaptDates --> Return[Retornar estrategia adaptada<br/>+ datosUsuario]
    
    Return --> End([Fin: Listo para EstrategiaDetallada])
```

## Flujo de Construcción de Array 250 Semanas

```mermaid
flowchart TD
    Start([Construir Array 250 Semanas]) --> Input[Input: sdiHistoricoDiario, mesesM40]
    
    Input --> Init[Inicializar array de 250<br/>con SDI histórico]
    
    Init --> CheckEmpty{¿Hay meses<br/>M40?}
    
    CheckEmpty --> |No| Return[Retornar array<br/>con SDI histórico]
    CheckEmpty --> |Sí| Order[Ordenar meses M40<br/>cronológicamente]
    
    Order --> Reverse[Invertir orden<br/>más reciente primero]
    
    Reverse --> InitIndex[Iniciar índice = 249<br/>última semana del array]
    
    InitIndex --> Loop[Para cada mes M40]
    
    Loop --> Replace4[Reemplazar 4 semanas<br/>con SDI del mes]
    
    Replace4 --> |índice -= 4| CheckFraction{¿Queda fracción<br/>0.33 semanas?}
    
    CheckFraction --> |Sí| ReplaceFraction[Promediar fracción<br/>con SDI histórico]
    CheckFraction --> |No| NextMonth{Siguiente mes}
    
    ReplaceFraction --> |índice -= 1| NextMonth
    
    NextMonth --> CheckIndex{¿Índice >= 0<br/>y hay más meses?}
    
    CheckIndex --> |Sí| Loop
    CheckIndex --> |No| CalcAvg[Calcular promedio<br/>suma / 250]
    
    CalcAvg --> Return
    
    Return --> End([Fin: Array 250 semanas])
```

## Resumen de Componentes y sus Responsabilidades

### YaM40Flow
- **Responsabilidad:** Orquestar el flujo completo
- **Estados:** 'profile' | 'calendar'
- **Transiciones:** Validar datos → Avanzar a calendario

### UserProfileCard
- **Responsabilidad:** Capturar información básica del usuario
- **Datos:** Nombre, fecha nacimiento, edad jubilación, semanas cotizadas, estado civil

### SDIHistoricoInput
- **Responsabilidad:** Capturar SDI histórico y meses pagados
- **Datos:** SDI histórico (directo o desde salario), meses pagados históricos

### M40Calendar
- **Responsabilidad:** Mostrar calendario de 58 meses y permitir selección
- **Funciones:** 
  - Calcular pensión actual
  - Calcular estrategias futuras
  - Manejar meses retroactivos
  - Validar límites

### YaM40Results
- **Responsabilidad:** Mostrar resultados y opciones de mejora
- **Funciones:**
  - Mostrar pensión actual destacada
  - Mostrar estrategias futuras disponibles
  - Permitir ver detalles completos

### EstrategiaDetallada
- **Responsabilidad:** Mostrar detalles completos de una estrategia
- **Requiere:** Adaptador para manejar meses ya pagados

## Puntos de Integración con APIs

1. **calculate-current-pension:** Se llama cuando hay meses pagados seleccionados
2. **calculate-strategies:** Se llama para generar estrategias futuras
3. **calculate-historical-pension:** Se llama si hay períodos históricos con UMA variable
4. **calculate-pension-array:** Se usa internamente para validación (no directamente desde frontend)

## Manejo de Errores

- **Validación temprana:** Validar datos antes de llamar APIs
- **Mensajes claros:** Errores en lenguaje simple para usuarios
- **Fallbacks:** Si una API falla, mostrar mensaje y permitir reintentar
- **Logging:** Registrar errores para debugging sin exponer detalles técnicos al usuario

