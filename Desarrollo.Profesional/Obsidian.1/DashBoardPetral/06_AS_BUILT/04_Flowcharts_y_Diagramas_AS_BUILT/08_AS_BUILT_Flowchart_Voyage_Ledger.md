# ⚓ AS-BUILT Flowchart 08 — Voyage Ledger Engine

> **Herramienta**: Motor Algorítmico P&L y Ledger de Navegación
> **Ruta UI**: `/audit-ledger`
> **Componentes React**: `AuditLedger_V2.tsx`, `VoyageLedgerFinal.tsx`
> **Script Python Backend**: `backend/spot_engine.py`
> **Script Python Diagrama**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_VOYAGE_LEDGER.py`
> **Asset SVG Public**: `Geeksoft_Frontend/public/FLOWCHART_VOYAGE_LEDGER.svg`

---

## 🧭 Navegación
| [← Flowchart Multicotizador](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/07_AS_BUILT_Flowchart_Multicotizador.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [← Volver al Índice General](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/00_Fundamentos_y_Arquitectura/00_AS_BUILT_Indice_General_Dashboard.md) |

---

## 🔄 Flujo Estricto de 5 Pasos

```mermaid
graph TD
    P1["PASO 1: Ingesta del JSON de Viaje<br/>• Parámetros del buque, toneladas MT, distancia NM, flete USD/MT"]
    P2["PASO 2: Algoritmo Triple Mínimo (MIN)<br/>• Ritmo Efectivo = MIN(Ritmo Terminal, Ritmo Bombeo, Ritmo Contrato)<br/>• Cálculo exacto de Horas en Muelle y Días en Mar"]
    P3["PASO 3: Cálculo de Consumo Granular de Búnker<br/>• Gasto IFO = Días Mar * Consumo IFO * Precio IFO<br/>• Gasto MDO = Días Puerto * Consumo MDO Work * Precio MDO"]
    P4["PASO 4: Deducción de Comisiones y Costos Portuarios<br/>• Net Freight = Gross Revenue - Comisiones (Address + Broker)<br/>• Costos de Puerto según modo STATIC o MATRIX"]
    P5["PASO 5: Resultado Final & Test de Convergencia QC<br/>• Voyage Result = Net Freight - Port Costs - Bunker Costs<br/>• Verificación de convergencia del benchmark (13.5k MT Matarani)"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

---

## 🔗 Enlaces Relacionados
- [[AS_BUILT_Herramienta_07_Auditoria_Ledger_VoyageLedger]] — Documentación de la herramienta UI.
- [[AS_BUILT_Maestro_01_Buques_VesselsMaster]] — Consumos del buque.
