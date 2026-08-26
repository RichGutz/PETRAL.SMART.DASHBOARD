# Plan de Modificaciones y Ajustes Multicotizador (26.08.26)

## 1. Resumen Ejecutivo
El presente documento detalla la planificación técnica y de arquitectura visual para implementar 5 ajustes de precisión comercial y simetría en el módulo **Multicotizador** de PETRAL SMART DASHBOARD:

1. **Estado Inicial de Demurrage en Cero (`'C'`)**: Al crear una cotización nueva o limpiar la grilla, el selector de Demurrage debe iniciar por defecto en **CERO (`'C'`)** (0.00 d), en lugar de Promedio (`'P'`).
2. **Nuevo Card "Costo Arriendo Naves" y División de Observaciones**:
   - Dividir la Columna 1 inferior (actualmente solo Observaciones) en dos tarjetas independientes apiladas:
     - **Superior**: Card *"Costo Arriendo Naves"* con un input numérico simple para ingresar un monto en USD.
     - **Inferior**: Card *"Comments (Observaciones)"* con textarea comercial redimensionado de forma compacta y simétrica.
   - Si el *Costo Arriendo Naves* es mayor a 0, se sumará directamente como costo de arriendo/fletamento en el motor de cálculo y se reflejará explícitamente en el **Financial Voyage Result Card**.
3. **Reseteo Determinístico de TCE Requerido y Diferencia con Grilla Limpia**:
   - Cuando la cotización esté limpia o en cero (0 días de viaje / 0 flete / 0 distancia), el **TCE Requerido** y la **Diferencia TCE** en el Financial Card deben mostrar **$0** (en lugar del valor base hardcodeado $15,000 y diferencia -$15,000).
4. **Líneas de Auditoría Detallada en Bunker Expenses (Mar, Puerto, Demurrage)**:
   - Debajo de la tabla de totales de Bunker Expenses, incorporar una sección de auditoría compacta con 3 filas explicativas (Mar, Puerto y Demurrage) que detallen:
     - `1. Travesía Mar`: Días de mar × consumo día (IFO + MDO) @ precio spot.
     - `2. Operaciones Puerto`: Días en puerto × consumo en puerto (IFO + MDO) @ precio spot.
     - `3. Demurrage (Estadías)`: Días de demora × consumo idle (IFO + MDO) @ precio spot.
5. **Preservación de Simetría Visual y Alturas en Grilla de Cards**:
   - Sincronizar las alturas en la grilla (`items-stretch` y `h-full`) para que *Bunker Expenses*, *Port Costs*, *Comisiones* y el *Financial Voyage Result* mantengan un balance visual impecable sin desalineaciones.

---

## 2. Detalle Técnico de Cambios por Componente

### 2.1. Grilla y Estado de Demurrage (`demurrageMode`)
- **Archivo afectado**: `MultiCotizadorExcel.tsx`, `SpreadsheetTramosGrid.tsx`
- **Comportamiento actual**:
  - `useState<'O' | 'P' | 'M' | 'C'>('P')` inicia en `'P'`.
  - `handleCreateNewGrid` ejecuta `setDemurrageMode('P')`.
- **Modificación**:
  - Cambiar el valor por defecto de inicialización a `'C'`.
  - En `handleCreateNewGrid`, cambiar a `setDemurrageMode('C')`.
  - Al cargar una cotización existente (`handleLoadRoute`), si la ruta tiene demoras registradas, se mantendrá en `'O'` (Origen).

### 2.2. Nuevo Card "Costo Arriendo Naves" y Rediseño de Columna Observaciones
- **Archivos afectados**:
  - `MultiCotizadorExcel.tsx` (nuevo estado `vesselHireCost` o `charterHireCost`, persistencia en payload de guardado y carga).
  - `FinancialResultCards.tsx` (renderizado de card arriba de Comments, recepción de prop `charterHireCost` / `setCharterHireCost`).
  - `multicotizadorCalculationEngine.ts` (incorporación del costo de arriendo manual a `hireUsd` o costo total de viaje, restando de `voyageResultPnl` y recalculando `tceRealizado`).
  - `multicotizadorPdfPrintService.ts` (soporte visual en impresión/PDF para reflejar el arriendo si aplica).
- **Diseño de la Columna 1 Inferior**:
  - Contenedor con `flex flex-col gap-2 justify-between flex-1 h-full`.
  - **Card Superior (Costo Arriendo Naves)**:
    - Encabezado: `🚢 Costo Arriendo Naves (Time Charter / Lump Sum)`.
    - Input de monto en USD con prefijo `$`, formateador con separador de miles y soporte reactivo en tiempo real (0ms).
  - **Card Inferior (Comments / Observaciones)**:
    - Textarea optimizado con altura ajustada para completar la columna simétricamente con respecto a BAF y Demurrage/Bandas.

### 2.3. Corrección de TCE Requerido & Diferencia en Estado Cero
- **Archivos afectados**: `multicotizadorCalculationEngine.ts`, `FinancialResultCards.tsx`
- **Lógica Matemática**:
  - Si `totalDays === 0` (o `totalFreight === 0 && totalDist === 0`):
    - `tceReq` mostrado = `0` (o `vesselParams?.tce_required` solo cuando hay días de viaje > 0).
    - `standardHireCost` = `0`.
    - `demurrageHireCost` = `0`.
    - `tceRealizado` = `0`.
    - `tceDiff` = `0`.
  - Cuando existan días de viaje (`totalDays > 0`), se activa el cálculo estándar: `tceDiff = tceRealizado - tceReq`.

### 2.4. Auditoría de Combustible en Bunker Expenses
- **Archivo afectado**: `FinancialResultCards.tsx`
- **Contenido del bloque inferior de Bunker**:
  - Separador sutil `border-t border-slate-200 mt-2 pt-1.5`.
  - 3 líneas de desglose rápido:
    - `🌊 1. Mar`: `{fmtDays(calc.totalSeaDays)} d × ({fmtNum(calc.seaIfoTons)}T IFO + {fmtNum(calc.seaMdoTons)}T MDO) = {fmtCur(calc.seaBunkerCost)}`
    - `⚓ 2. Puerto`: `{fmtDays(calc.totalPortDays)} d × ({fmtNum(calc.portIfoTons)}T IFO + {fmtNum(calc.portMdoTons)}T MDO) = {fmtCur(calc.portBunkerCost)}`
    - `⏱️ 3. Demurrage`: `{fmtDays(calc.totalDemurrageDays)} d × ({fmtNum(calc.demurrageIfoTons)}T IFO + {fmtNum(calc.demurrageMdoTons)}T MDO) = {fmtCur(calc.demurrageBunkerCost)}`

### 2.5. Balance y Simetría de Layout
- Asegurar que las tarjetas de la fila superior (Bunker Expenses, Port Costs, Comisiones) tengan la misma altura visual mediante clases Tailwind `h-full flex flex-col justify-between`.
- Asegurar que la columna derecha (Financial Voyage Result) acompañe armónicamente la altura total del bloque izquierdo.

---

## 3. Plan de Verificación
1. **Verificación de Grilla Limpia / Nueva**:
   - Abrir Multicotizador o presionar "Crear Nuevo":
     - Comprobar que Demurrage esté activo en **C** (Cero).
     - Comprobar que en Financial Card aparezca **TCE Requerido: $0** y **Diferencia TCE: $0**.
2. **Verificación de Costo Arriendo Naves**:
   - Ingresar un valor (ej. `$50,000` USD) en el nuevo card.
   - Comprobar que el PnL y los costos totales descuenten exactamente dicho monto.
   - Comprobar que con valor `$0` no afecte el flujo estándar.
3. **Verificación de Auditoría Bunker Expenses**:
   - Modificar días de mar, operaciones y demoras.
   - Comprobar que la suma de Mar + Puerto + Demurrage coincida al centavo con el Total General de Combustible.
4. **Verificación de Build**:
   - Ejecutar `npx vite build` en `Geeksoft_Frontend` para garantizar cero errores de TypeScript y compilación perfecta.
