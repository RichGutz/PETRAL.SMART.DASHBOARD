# 🔄 QC Loop 07 — Doble Loop ETL: Re-Parseo y Coordenadas Celdas Excel Operadores

> **Propósito**: Especificación y protocolo de re-parseo ETL sobre los Exceles de liquidación de los operadores navieros para corregir datos en `voyage_liquidations` de Supabase DB.
> **Ubicación Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\run_qc_loop_non_plus_ultra.py`

---

## 🧭 Navegación
| [← QC Loop 06](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/05_Protocolos_QC_y_Tests_de_Aceptacion/QC_Loop_06_Guardado_Cotizaciones_Spot_y_Llaves_Compuestas.md) | 🏠 [[00_Indice_Protocolos_y_Loops_QC]] | [Siguiente: QC Loop 08 →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/05_Protocolos_QC_y_Tests_de_Aceptacion/QC_Loop_08_Non_Plus_Ultra_Prueba_Final_31_Viajes_vs_Spot_Matrix.md) |

---

## 🎯 1. Matriz de Coordenadas Excel de Celdas Auditadas

### A. Plantilla Estándar Single Leg:
| Concepto Financiero / Operativo | Columna Excel | Fila | Ejemplo Auditado (`v.045`) |
|---|:---:|:---:|---|
| **Gross Revenue (Income)** | `N` | `14` | `$241,783.00 USD` |
| **Port Costs (Gastos de Puerto)** | `N` | `15` | `$34,674.67 USD` |
| **Bunker Costs (Costo Búnker)** | `N` | `16` | `$30,913.56 USD` |
| **Voyage Result (US$)** | `N` | `18` | `$176,194.00 USD` |
| **Duration (d) - Días Totales** | `Q` | `14` | `5.74 días` |
| **TCE Requerido (US$/d)** | `Q` | `18` | `$15,000.00 /día` |
| **P/L (Utilidad Neta Real US$)** | `Q` | `20` | `$90,121.00 USD` |

### B. Plantilla Multileg 2 PODs (Ej. `V.764 MOQUEGUA`: ILO ➔ CALLAO ➔ MARCONA):
- **Freight Income Total**: Columna `H`, Fila `23` (`$403,725.00 USD`).
- **Total Agency US$ (Puertos)**: Columna `C`, Fila `48` (`$60,388.00 USD`).
- **Bunkers US$ (Consumo Total)**: Columna `S`, Fila `48` (`$47,294.00 USD`).
- **P/L Utilidad Neta Real**: Columna `Q`, Fila `20` (`$203,475.00 USD`).
