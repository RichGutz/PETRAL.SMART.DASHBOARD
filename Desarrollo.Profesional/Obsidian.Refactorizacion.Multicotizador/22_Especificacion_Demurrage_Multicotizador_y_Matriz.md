# 🕵️ El Método Benoit Blanc: Especificación Maestra de Demurrage (Estadías)
## Arquitectura Forense, Consumo Dual, Selector [P | M], Búnker Idle y Desglose Financiero

> *"En fletamento marítimo, el tiempo no es solo dinero: es combustible quemado en fondeo, costo de capital flotante (hire) y compensación por estadías. Una arquitectura robusta no esconde estos rubros en cajas negras: los destripa y concilia al centavo."*

**Proyecto**: PETRAL Smart Dashboard — Módulo Commercial Forecast & Port Costs  
**Documento Fuente**: [`21_Mapeo.Debugging.Datos.Consumo.Multicotizador.md`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/21_Mapeo.Debugging.Datos.Consumo.Multicotizador.md)  
**Fecha**: 22 de Agosto de 2026  
**URL de Producción**: `https://forecast.geeksoft.tech`  

---

## 📋 Índice General

1. **Axiomas de Negocio: El Impacto Dual del Demurrage**
2. **Paso 1: Maestro de Gastos Portuarios — Tabla de Demoras Mensuales (3 Filas × 4 Meses)**
3. **Paso 1.1: Reglas de Visualización, Sugerencia en Gris y Sobreescritura en Grilla**
4. **Paso 1.2: Selector Minimalista de Cabecera `[ P | M ]` (Promedio vs. Mes Calendario)**
5. **Paso 2: Servicio Especializado `PortDemurrageRatesService.ts` (Perfil 12 Meses)**
6. **Paso 3: Matemática del Búnker en Demurrage (Consumo Idle Tripartito)**
7. **Paso 4: Destripe de los 4 Cards Financieros y Conciliación con Casilla Verde (P&L)**
8. **Consumo Dual: Multicotizador (Promedio Anual / Mes) vs. Matriz Financiera (Mes Específico)**
9. **Tabla de Mapeo de Variables y Persistencia en Supabase**

---

## 1. Axiomas de Negocio: El Impacto Dual del Demurrage

El Demurrage (estadía) ocurre cuando el buque permanece en puerto por más tiempo del acordado contractualmente (laytime). Esto genera una ecuación económica dual:

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           IMPACTO DUAL DEL DEMURRAGE                              │
├─────────────────────────────────────────┬─────────────────────────────────────────┤
│ 💵 1. INGRESO (Demurrage Revenue)       │ 📉 2. COSTO / EGRESO (Demurrage Cost)   │
├─────────────────────────────────────────┼─────────────────────────────────────────┤
│ Se factura al cliente/fletador:         │ A. Costo de Hire (Tiempo Barco):        │
│   Σ(Días Demurrage) × Tarifa Buque ($/d)│      Σ(Días Demurrage) × TCE Req ($/d)  │
│                                         │ B. Consumo Búnker Extra (Modo IDLE):    │
│                                         │      Σ(Días Demurrage) × Consumo IDLE   │
└─────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 2. Paso 1: Maestro de Gastos Portuarios — Tabla de Demoras Mensuales

En [`PortCostsMaster_V2.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Masters/PortCostsMaster_V2.tsx), para cada buque y puerto se incorpora un 4to bloque debajo de `⛽ Bunkering` con una cuadrícula ergonómica de **3 filas × 4 meses**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⏳ Demoras Mensuales (Días)                           Promedio Anual: 1.45 d│
├─────────────────────────────────────────────────────────────────────────────┤
│   [ ENE: 1.20 ]    [ FEB: 1.50 ]    [ MAR: 2.00 ]    [ ABR: 1.80 ]          │
│   [ MAY: 1.40 ]    [ JUN: 1.10 ]    [ JUL: 1.30 ]    [ AGO: 1.60 ]          │
│   [ SEP: 1.50 ]    [ OCT: 1.40 ]    [ NOV: 1.20 ]    [ DIC: 1.40 ]          │
└─────────────────────────────────────────────────────────────────────────────┘
```

* **Fórmula de Promedio Anual**:
  $$\text{Promedio Anual (días)} = \frac{\sum_{i=1}^{12} \text{Mes}_i}{12}$$
* **Persistencia en Supabase (`port_cost_static`)**:
  - `operation_type`: `'DEMURRAGE'`
  - `sub_operation_type`: `'m01'`, `'m02'`, ..., `'m12'`
  - `cost`: valor numérico de días (con 2 decimales).

---

## 3. Paso 1.1 & 1.2: Grilla y Selector Minimalista de Cabecera `[ P | M ]`

1. **Ubicación en Grilla:** Nueva columna **`DEMURRAGE (D)`** inmediatamente a la izquierda de `TIME TO COUNT (H)`.
2. **Selector de Modo en Cabecera `<th>`:**
   ```text
   ┌───────────────────────────┐
   │   DEMURRAGE (D)  [ P | M ]│
   └───────────────────────────┘
   ```
   - **`P` (Promedio Anual - Activo por defecto):** Sugiere en gris la media de los 12 meses.
   - **`M` (Mensual según Fecha de Cotización):** Al hacer clic en `M`, sugiere en gris la demora puntual del mes de la fecha de validez (`validFrom`).
   - Interacción limpia con clic directo sobre la letra, sin checks ni artificios visuales.
3. **Condición de Habilitación:**
   - **Fila 0 (POL):** Solo habilitado si la acción de origen es **`CARGAR`**. Si es `NONE`, muestra **`—`** en gris inactivo.
   - **Filas 1..N (Tramos):** Solo habilitado si `OP. DEST` es **`CARGAR`** o **`DESCARGAR`**. Si es `NONE` o `BUNKERING`, muestra **`—`** en gris inactivo.
4. **Patrón Ergonómico de Sugerencia vs. Sobreescritura:**
   - **Valor Sugerido (Gris / Placeholder):** Autocompleta con el valor del perfil de Demurrage (Promedio o Mes según `P`/`M`).
   - **Sobreescritura por el Usuario:** Si el usuario digita un valor explícito (ej. `0`, `2.50`), se muestra en **texto negro/oscuro** y toma precedencia absoluta.
5. **Fila TOTAL Azul:**
   - Suma matemática exacta de todos los días de demurrage de los tramos activos (ej. $1.45 + 2.10 = \mathbf{3.55\text{ d}}$).

---

## 4. Paso 2: Servicio Especializado `PortDemurrageRatesService.ts`

El servicio recupera el perfil completo de los 12 meses (`m01` hasta `m12`) + el promedio anual en memoria (0ms) a partir de `staticCostsData`.

```typescript
export interface PortVesselDemurrageProfile {
    port_id: string;
    vessel_id: string;
    months: Record<string, number>;
    annual_average: number;
}
```

---

## 5. Paso 3: Matemática del Búnker en Demurrage (Consumo Idle Tripartito)

Durante los días de estadías/demurrage, el buque se encuentra fondeado/en espera, operando bajo el régimen **100% IDLE**:

$$\text{Tons IFO Demurrage} = \sum (\text{Días Demurrage}) \times \text{Consumo Idle IFO Buque (T/d)}$$

$$\text{Tons MDO Demurrage} = \sum (\text{Días Demurrage}) \times \text{Consumo Idle MDO Buque (T/d)}$$

$$\text{Costo IFO Demurrage (\$)} = \text{Tons IFO Demurrage} \times \text{Precio IFO (\$/T)}$$

$$\text{Costo MDO Demurrage (\$)} = \text{Tons MDO Demurrage} \times \text{Precio MDO (\$/T)}$$

$$\mathbf{\text{Costo Búnker Demurrage Total}} = \text{Costo IFO Demurrage} + \text{Costo MDO Demurrage}$$

---

## 6. Paso 4: Destripe de los 4 Cards Financieros

### 🛢️ Card 1: Bunker Expenses (Combustible) — Matriz Tripartita

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BUNKER EXPENSES (COMBUSTIBLE)                                                          │
├──────────────┬──────────────────┬──────────────────┬──────────────────┬────────────────┤
│ Fuel         │  1. Mar (Sea)    │ 2. Pto (Tierra)  │ 3. Demurrage     │ TOTAL ($)      │
├──────────────┼──────────────────┼──────────────────┼──────────────────┼────────────────┤
│ IFO (Heavy)  │ 36.5 T ($35,305) │  8.7 T  ($8,415) │  2.1 T  ($2,076) │ 47.3 T $45,796 │
│ MDO (Diesel) │  0.0 T      ($0) │  1.2 T  ($1,834) │  0.3 T    ($458) │  1.5 T  $2,292 │
├──────────────┼──────────────────┼──────────────────┼──────────────────┼────────────────┤
│ TOTAL FUEL   │ 36.5 T ($35,305) │  9.9 T ($10,249) │  2.4 T  ($2,534) │ 48.8 T $48,088 │
└──────────────┴──────────────────┴──────────────────┴──────────────────┴────────────────┘
```

### 💵 Card 4: Financial Voyage Result (Casilla Verde P&L & TCE)

| # | Concepto en Casilla Verde | Naturaleza | Fórmula Matemática |
| :---: | :--- | :---: | :--- |
| **1** | `REVENUE (Q MT × $F/MT)` | **Ingreso** | $\sum (\text{Cantidad} \times \text{Flete})$ |
| **2** | `🆕 (+) Ingreso por Demurrage` | **Ingreso** | $\sum (\text{Días Demurrage}) \times \text{Tarifa Demurrage Asignada al Buque (\$/d)}$ |
| **3** | `(+) Refacturación Muellaje (al cliente)` | **Ingreso** | $\sum \text{Muellajes marcados como RF}$ |
| **—** | **GROSS REVENUE TOTAL** | **Subtotal** | $\text{Línea 1} + \text{Línea 2} + \text{Línea 3}$ |
| **4** | `(-) Hire (TCE Req × Días Viaje Estándar)` | **Egreso** | $\text{TCE Req} \times (\text{Días Mar} + \text{Días Puerto})$ |
| **5** | `🆕 (-) Costo Hire Demurrage` | **Egreso** | $\text{TCE Req} \times \sum (\text{Días Demurrage})$ |
| **6** | `(-) Bunker IFO (Incluye Idle Demurrage)` | **Egreso** | $\text{Tons IFO Totales} \times \text{Precio IFO}$ |
| **7** | `(-) Bunker MDO (Incluye Idle Demurrage)` | **Egreso** | $\text{Tons MDO Totales} \times \text{Precio MDO}$ |
| **8** | `(-) Port Costs & Muellaje` | **Egreso** | Gastos de agencia y terminales |
| **9** | `(-) Comisiones (Address + Broker)` | **Egreso** | Comisiones comerciales |
| **🏁** | **VOYAGE RESULT / P&L** | **Neto** | $\text{Gross Revenue} - \sum \text{Egresos}$ |
| **⚡** | **TCE REALIZADO (\$/día)** | **Métrica** | $(\text{Gross Revenue} - \text{Búnker} - \text{Port Costs} - \text{Comisiones}) / \text{Días Totales}$ |

---

## 7. Tabla de Mapeo de Variables y Persistencia en Supabase

| Módulo / Componente | Campo / Variable | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| `PortCostsMaster_V2` | `DEMURRAGE[m01..m12]` | `number` | Días de estadías por mes (12 meses). |
| `PortDemurrageRatesService`| `resolveDemurrageValue`| `method` | Resuelve Demurrage según modo `P` o `M`. |
| `CalculationEngine` | `demurrage_days` | `number` | Días de estadía asignados al tramo. |
| `CalculationEngine` | `demurrage_revenue` | `number` | Ingreso facturado por demurrage. |
| `CalculationEngine` | `demurrage_hire_cost`| `number` | Costo de hire durante los días de demurrage. |
| `CalculationEngine` | `demurrage_ifo_tons` | `number` | Toneladas IFO consumidas en fondeo idle. |
| `CalculationEngine` | `demurrage_mdo_tons` | `number` | Toneladas MDO consumidas en fondeo idle. |
| `CalculationEngine` | `demurrage_bunker_cost` | `number` | Costo en dólares del combustible de demurrage. |
| `SpreadsheetTramosGrid` | `col_demurrage_days` | `input` | Input editable a la izquierda de `TIME TO COUNT`. |
| `SpreadsheetTramosGrid` | `demurrageMode` | `'P' \| 'M'` | Selector de Promedio vs. Mensual en cabecera `<th>`. |
| `FinancialResultCards` | `Card 1: Bunker Matrix`| `table` | Matriz 3 columnas (`Mar`, `Pto`, `Demurrage`). |
| `FinancialResultCards` | `Card 4: Casilla Verde`| `table` | Ingreso Demurrage (Línea 2) y Costo Hire Demurrage (Línea 5). |

---

## 8. Certificación de Implementación Técnica y Verificación de Compilación

* **Servicio Especializado:** [`PortDemurrageRatesService.ts`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/providers/portDemurrageRatesService.ts) creado y activo.
* **Motor Puro de Cálculo:** [`multicotizadorCalculationEngine.ts`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/providers/multicotizadorCalculationEngine.ts) actualizado con el régimen 100% IDLE de Demurrage y desglose tripartito de Búnker.
* **Grilla Tabular:** [`SpreadsheetTramosGrid.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/multicotizador/SpreadsheetTramosGrid.tsx) con columna `DEM (D)` y selector de letras `[ P | M ]`.
* **Tarjetas Financieras:** [`FinancialResultCards.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/multicotizador/FinancialResultCards.tsx) con Card 1 reorganizado y Card 4 (Casilla Verde P&L & TCE) con Ingreso y Costo de Hire por Demurrage.
* **Compilación de Validación:** Certificado con `npx vite build` (**Código 0**, compilado en 9.87s).

