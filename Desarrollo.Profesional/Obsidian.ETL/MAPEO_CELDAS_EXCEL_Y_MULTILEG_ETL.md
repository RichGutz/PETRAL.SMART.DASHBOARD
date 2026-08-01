# 📑 MAPEO MAESTRO DE CELDAS EXCEL Y ALGORITMO MULTILEG (ETL PARSER PASS-THROUGH)

> **Ubicación del Módulo ETL**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.ETL`  
> **Archivos de Origen**:  
> - `VC Tablones 2026.PASS.THROUGH.xlsx`  
> - `MOQUEGUA - Voyage calculation viajes Enero a Junio  2026  - 31.07.2026.PASS.THROUGH.xlsx`  

---

## 1. 🖼️ Mapeo de Celdas de Ingresos (Freight Income Breakdown)

En los archivos `PASS.THROUGH.xlsx`, el bloque de Ingresos comprende el rango **`B15:B22`** (Conceptos) e **`I15:I22`** (Montos USD positivos/negativos), consolidando en la celda **`I23`** (`Total Freight Income`).

### 📊 Matriz de Coordenadas de Ingresos y Gastos
| Concepto Financiero / Operativo | Columna | Fila / Celda | Tipo de Dato | Descripción / Regla de Extracción |
| :--- | :---: | :---: | :---: | :--- |
| **Conceptos de Ingreso (Freight Items)** | `B` | `15:22` | Texto String | Nombres de conceptos (Flete Base, Muellaje Refacturado/Pass-through, Shifting, Paridad de Flete, etc.) |
| **Montos por Concepto** | `I` | `15:22` | USD Float | Valores en Dólares ($USD$). Pueden ser positivos (fletes/reembolsos) o negativos (descuentos/penalidades) |
| **Total Freight Income (Gross Revenue)** | `I` | **`23`** | USD Float | Suma consolidada de los items de ingreso (`I15:I22`) |
| **Port Costs (Gastos de Puerto)** | `N` / `C` | `15` / `48` | USD Float | Suma acumulada de agenciamiento/practicaje |
| **Bunker Costs (Costo Búnker)** | `N` / `S` | `16` / `48` | USD Float | Consumo acumulado de combustible |
| **TCE Realizado (US$/d)** | `Q` | `17` | USD Float | TCE ejecutado del viaje |
| **TCE Req. (TCE Requerido)** | `Q` | `18` | USD Float | Costo diario de la nave ($13,000 / $15,000 USD/día) |
| **P/L (Utilidad Neta Real US$)** | `Q` | `20` | USD Float | Utilidad Neta Real considerando el recupero de Pass-Through Dockage |

---

## 2. ⚙️ Algoritmo Extractor Python (`etl_parser_liquidations.py`)

```python
def extract_voyage_liquidation_data(ws):
    """
    Algoritmo unificado de extracción con desglose granular de Freight Income (B15:B22 / I15:I22 / I23)
    """
    freight_income_items = []
    for r in range(15, 23):
        concept = ws.cell(row=r, column=2).value
        val = ws.cell(row=r, column=9).value
        if concept and str(concept).strip() and val is not None:
            try:
                freight_income_items.append({
                    "concept": str(concept).strip(),
                    "amount_usd": float(val)
                })
            except (ValueError, TypeError):
                pass

    gross_revenue = float(ws.cell(row=23, column=9).value or ws.cell(row=15, column=7).value or 0.0)
    agency_cost = float(ws.cell(row=15, column=14).value or ws.cell(row=48, column=3).value or 0.0)
    bunker_cost = float(ws.cell(row=16, column=14).value or ws.cell(row=48, column=19).value or 0.0)

    return {
        "gross_revenue_usd": gross_revenue,
        "freight_income_items": freight_income_items,
        "port_costs_usd": agency_cost,
        "bunker_costs_usd": bunker_cost,
        "pcm_usd": gross_revenue - bunker_cost - agency_cost
    }
```

