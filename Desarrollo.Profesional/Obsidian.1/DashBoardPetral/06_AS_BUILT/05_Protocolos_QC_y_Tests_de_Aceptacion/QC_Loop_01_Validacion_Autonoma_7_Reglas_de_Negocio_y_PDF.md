# 🤖 QC Loop 01 — Validación Autónoma de 7 Reglas de Negocio y Generación de PDF

> **Propósito**: Suite de pruebas autónomas en Python (`run_qc_loop_pdf.py`) que evalúa todas las rutas registradas en Supabase DB contra 7 reglas estrictas de negocio.
> **Compara contra**: Tarifario Real Maestro (`PORT_COSTS_MASTER`) y reglas físicas de navegación.
> **Genera**: `ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf` en Blanco y Negro Landscape A4.

---

## 🧭 Navegación
| [← Índices QC](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/05_Protocolos_QC_y_Tests_de_Aceptacion/00_Indice_Protocolos_y_Loops_QC.md) | 🏠 [[00_Indice_Protocolos_y_Loops_QC]] | [Siguiente: QC Loop 02 Test de Oro →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/05_Protocolos_QC_y_Tests_de_Aceptacion/QC_Loop_02_Test_de_Oro_Convergencia_Matarani_BT_Moquegua.md) |

---

## 🛡️ Las 7 Reglas Estrictas de Validación QC:

| # | Regla Evaluada | Criterio de Validación | Comparado Contra | Estado |
|---|---|---|---|---|
| **1** | **Costo Mínimo Búnker** | Si Distancia $> 500\text{ NM} \implies \text{Búnker} > \$20,000\text{ USD}$ | Consumo IFO/MDO en mar | `PASS` |
| **2** | **Aislamiento de Lastre** | En piernas `BALLAST` $\implies \text{Costos Agencia} = \$0.00\text{ USD}$ | Matriz de agenciamiento | `PASS` |
| **3** | **Tarifa Mejillones** | En descargas en Mejillones (Chile) $\implies \text{Agencia} \ge \$45,000\text{ USD}$ | Tarifa real SAAM/Ultratug ($50,000 USD) | `PASS` |
| **4** | **Flete en Cargado** | En piernas `LADEN` $\implies \text{Gross Revenue} > \$0.00\text{ USD}$ | Tarifa de contrato COA | `PASS` |
| **5** | **Naming SPCC** | Formato de viaje redondo cerrado `SPCC.ILO.PUERTO.ILO` | Tabla `routes_master` | `PASS` |
| **6** | **Desglose de Días** | Días calculados de forma independiente por pierna (`LADEN` vs `BALLAST`) | Velocidad buque (11 kts) + Weather Factor (10%) | `PASS` |
| **7** | **Inputs de Buque** | PnL = Voyage Result - (Días * TCE Requerido) | Campo `TCE Requerido` de `vessels` | `PASS` |
