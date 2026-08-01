# 📊 AS-BUILT: Herramienta 02 — Matriz Financiera y Forecast (Dashboard)

> **Ruta UI**: `/dashboard`
> **Componente React**: `FinancialMatrix_V2.tsx` / `CommercialForecast.tsx`
> **Tabla Supabase**: `commercial_forecasts`
> **Módulo Auth**: `matriz_financiera`

---

## 🧭 Navegación
| [← Multicotizador Spot](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_01_Multicotizador_Spot.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Análisis Gráfico →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_03_Analisis_Grafico_Commercial.md) |

---

## 🎯 1. Propósito y Estructura P&L de 31 Viajes

La **Matriz Financiera (`/dashboard`)** es el tablero comercial principal de PETRAL. Presenta la grilla financiera consolidada para el programa anual/semestral de 31 viajes.

### 📌 Jerarquía Financiera por Fila de Viaje:
1. **Viajes** (Identificador de viaje / cliente / buque).
2. **Toneladas ($Q$)** (Volumen transportado en MT).
3. **Gross Revenue** ($Q \times Flete$).
4. **Comisiones** (Deducción por Address Commission + Brokerage Fee).
5. **Net Freight** ($\text{Gross Revenue} - \text{Comisiones}$).
6. **Port Costs** (Costos portuarios origen/destino en modo `STATIC` o `MATRIX`).
7. **Bunker Costs** (Gasto total IFO + MDO).
8. **Voyage Result** (Resultado Operativo Neto: $\text{Net Freight} - \text{Port Costs} - \text{Bunker Costs}$).

---

## ⚡ UX & Recálculos en Caliente (`useMemo`)

- **Sticky Headers**: Encabezados fijos al hacer scroll vertical.
- **Edición en Caliente de Fletes**: Al editar el flete unitario en una sub-fila, React recalcula en memoria el Net Freight y Voyage Result en tiempo real sin perder el foco.

---

## 📥 Inyección de Dependencias
- [[AS_BUILT_Maestro_01_Buques_VesselsMaster]] — Consumos del buque.
- [[AS_BUILT_Maestro_04_Contratos_ContractsMaster]] — Comisiones comerciales.
- [[AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster]] — Precios de combustible.

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_03_Analisis_Grafico_Commercial]] — Alimentación de gráficos.
- [[AS_BUILT_Herramienta_05_Auditoria_PDF_Liquidaciones_WeasyPrint]] — Exportación de Acta PDF.
