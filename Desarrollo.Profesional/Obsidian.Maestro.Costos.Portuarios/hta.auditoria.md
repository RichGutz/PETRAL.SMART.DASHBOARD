# 🖥️ Especificación Técnica: Herramienta de Auditoría y Modelo Matriz Compleja

> **Ubicación en Bóveda**: `Obsidian.Maestro.Costos.Portuarios/hta.auditoria.md`
> **Ubicación en Código**: `Geeksoft_Frontend/src/pages/Masters/MatrixComplexPanel.tsx`
> **Acceso en UI**: Módulo **Maestro Gastos Portuarios** (`/port-costs`) ➔ Pestaña **"Modelo Matriz Compleja"**
> **Estética**: Basada en la arquitectura ejecutiva de **`AuditFinal_V2.tsx`** (tarjetas KPI de impacto, desgloses desplegables por puerto, badges de Overtime/Pass-Through y exportación a PDF/Excel).

---

## 🎨 1. Arquitectura de Pantalla e Inputs de Simulación

El componente `MatrixComplexPanel.tsx` se divide en **3 Bloques Ejecutivos**:

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 1. BARRA SUPERIOR DE INPUTS OPERATIVOS                                      │
 │ Ruta: [ Callao -> Matarani ▼ ]  Buque: [ BT MOQUEGUA ▼ ]  Carga: [ 13,500 MT ]│
 │ Entrada: [ 2026-07-25 08:00 ]   Salida: [ 2026-07-26 11:00 ]                │
 │ [ 🚀 EJECUTAR AUDITORÍA Y LIQUIDACIÓN PORTUARIA ]                           │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 2. TARJETAS DE IMPACTO FINANCIERO (KPI CARDS - Estilo AuditFinal)           │
 │ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────┐ │
 │ │ PUERTO ORIGEN    │ │ PUERTO DESTINO   │ │ TOTAL ESCALA     │ │ HORAS    │ │
 │ │ $14,938.34 USD   │ │ $15,364.50 USD   │ │ $30,302.84 USD   │ │ 60.0 hrs │ │
 │ └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────┘ │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 3. DESGLOSE LINEAL DE AUDITORÍA POR PUERTO (Acordeón Pestañas)               │
 │ [ 🇵🇪 CALLAO (Origen) ]   [ 🇵🇪 MATARANI (Destino) ]                           │
 │                                                                             │
 │ Tabla con 5 Columnas:                                                       │
 │ ÍTEM / SERVICIO ➔ PROVEEDOR ➔ ECUACIÓN EVALUADA REAL ➔ SUBTOTAL ➔ PROPIEDAD │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 2. Especificación de Componentes

### 2.1. Panel Superior de Inputs Simulación
- **Selector de Ruta (`route_id`)**: Carga las rutas comerciales de `RoutesMaster_V2` (ej. `Callao -> Matarani`, `Marcona -> Ilo`, `Callao -> Ilo`).
- **Selector de Buque (`vessel_id`)**: Carga los buques de `VesselsMaster_V2` (`BT MOQUEGUA`, `BT TABLONES`, `BT HUEMUL`, `CONCON TRADER`). Al seleccionar, muestra las tarjetas flotantes con $\text{LOA}$, $\text{GRT}$, $\text{DWT}$.
- **Volumen Carga ($\text{MT}$)**: Input numérico editable en toneladas métricas.
- **Picker Fecha/Hora Entrada (`entry_datetime`)**: `datetime-local` picker para evaluar horario de ingreso (Casino/Overtime).
- **Picker Fecha/Hora Salida (`exit_datetime`)**: `datetime-local` picker para calcular horas en puerto ($\Delta t$) y desatraque.

---

### 2.2. Tarjetas KPI Resumen (Estilo AuditFinal_V2)
- 🔵 **Gastos Puerto Carga (Origen)**: Monto consolidado en USD del puerto de salida.
- 🟢 **Gastos Puerto Descarga (Destino)**: Monto consolidado en USD del puerto de llegada.
- 🟣 **Total Escala Portuaria**: Suma total en USD ($C_{\text{origen}} + C_{\text{destino}}$).
- ⏱️ **Horas Totales en Puerto**: Tiempo total acoplado de la nave en los muelles.

---

### 2.3. Grilla de Auditoría Transparente (Línea por Línea)
Organizada en acordeones por puerto con la sub-cabecera de secciones oficiales:
- 🟦 `A) SHIFTING EXPENSES`
- 🟩 `B) GENERAL PORT EXPENSES`
- 🟪 `C) AGENCY EXPENSES`

#### Columnas de la Tabla de Auditoría:
1. **Ítem / Servicio**: Nombre oficial del rubro.
2. **Proveedor / Agencia**: Entidad ejecutora (`Trans Total`, `PSA Marine`, `APM Terminals`, `Tisur`, `Sanidad`).
3. **Ecuación Matematica Evaluada al Lado**: Muestra los valores reales insertados en la fórmula (ej: `"$1.50 × 134.16m (LOA) × 27h (Puerto)"` o `"MAX($750.00, 0.055 × 8,259 GRT) + 25% Overtime"`).
4. **Subtotal USD**: Monto calculado resultante.
5. **Propiedad / Badges**: `<PT>` (*Pass Through*), `<OT>` (*Overtime Recargo*), `<ACUERDO>` (*Tarifa Pactada*).

---

## 📄 3. Exportación de Auditoría
- **Botón Exportar Excel**: Descarga la planilla desglosada con fórmulas dinámicas.
- **Botón Generar Acta PDF**: Genera el PDF oficial de Auditoría Portuaria para la gerencia de Naviera Petral.
