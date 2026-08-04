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

### 📌 Jerarquía Financiera y 14 Métricas Simétricas por Fila de Viaje (Espejo Auditoría Final):
1. **Distancia (MN)** (`distancia_total`): Distancia náutica total acumulada por viaje.
2. **Carga Transportada (MT)** (`carga_unit`): Volumen de carga transportada ($Q$).
3. **Flete Base (USD/MT)** (`flete_unit`): Tarifa base de flete contractual.
4. **Flete Bruto (USD)** (`gross_income_unit`): $Q \times \text{Flete Base}$.
5. **Comisiones (USD)** (`total_commissions_unit`): Deducción comercial por Address Commission + Broker Fee ($\text{Flete Bruto} \times \frac{\% \text{Addr} + \% \text{Broker}}{100}$).
6. **Flete Neto (USD)** (`net_income_unit`): $\text{Flete Bruto} - \text{Comisiones}$.
7. **Días de Mar** (`sea_days_unit`): Días navegando en mar con Weather Factor.
8. **Días de Puerto** (`port_days_unit`): Días de Carga + Descarga + Overheads/Espera en Puerto.
9. **Duración Total (Días)** (`total_duration_unit`): $\text{Días de Mar} + \text{Días de Puerto}$.
10. **Port Costs (USD)** (`total_port_costs_unit`): Costos portuarios origen/destino (Agencias en modo `STATIC` o `MATRIX`).
11. **Bunker Costs (USD)** (`total_bunker_costs_unit`): Costo total de combustible consumido (IFO + MDO/MGO).
12. **Voyage Result (USD)** (`voyage_result_unit`): Utilidad Operativa Neta ($\text{Flete Neto} - \text{Port Costs} - \text{Bunker Costs}$).
13. **TCE Real (USD/Día)** (`tce_real_unit`): Rendimiento diario del buque ($\frac{\text{Voyage Result}}{\text{Duración Total}}$).
14. **P/L Neto vs Requerido (USD)** (`pl_vs_required_unit`): Resultado Neto Final ajustado por costo de flota ($\text{Voyage Result} - (\text{Duración Total} \times \text{TCE Requerido})$).

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
