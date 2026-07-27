# 📑 MAPEO MAESTRO DE CELDAS EXCEL Y ALGORITMO MULTILEG (ETL PARSER)

> **Ubicación del Módulo ETL**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.ETL`  
> **Imágenes de Respaldo**: 
> - `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\mapa_celdas_excel_liquidaciones.png`  
> - `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\mapa_excel_2_pod_multileg.png`  

---

## 1. 🖼️ Captura 1: Mapeo de Celdas en Plantilla Estándar (Single Leg - Viaje `v.045`)

![Mapa de Celdas Excel Single Leg](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Maestro.Costos.Portuarios/PNGs/mapa_celdas_excel_liquidaciones.png)

### 📊 Matriz de Coordenadas Single Leg
| Concepto Financiero / Operativo | Columna | Fila | Tipo de Dato | Coordenada / Ejemplo (`v.045`) |
| :--- | :---: | :---: | :---: | :---: |
| **Income (Gross Revenue)** | `N` | `14` | USD Float | `$241,783.00 USD` |
| **Port Costs (Gastos de Puerto)** | `N` | **`15`** | USD Float | **`$34,674.67 USD`** |
| **Bunker Costs (Costo Búnker)** | `N` | **`16`** | USD Float | **`$30,913.56 USD`** |
| **Other Costs (Otros Gastos)** | `N` | `17` | USD Float | `$0.00 USD` |
| **Voyage Result (US$)** | `N` | `18` | USD Float | `$176,194.00 USD` |
| **Duration (d) - Días Totales** | `Q` | `14` | Float | `5.74 días` |
| **Sea Days (Días de Mar)** | `Q` | `15` | Float | `2.208 días` |
| **Port/Idle Days (Días de Puerto)** | `Q` | `16` | Float | `3.530 días` |
| **TCE Realizado (US$/d)** | `Q` | `17` | USD Float | `$30,705.00 /día` |
| **TCE Req. (TCE Requerido)** | `Q` | **`18`** | USD Float | **`$15,000.00 /día`** |
| **P/L (Utilidad Neta Real US$)** | `Q` | **`20`** | USD Float | **`$90,121.00 USD`** |

---

## 2. 🖼️ Captura 2: Mapeo de Celdas en Plantilla Multileg con 2 PODs (Viaje `V.764 MOQUEGUA`)

![Mapa de Celdas Excel Multileg 2 PODs](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Maestro.Costos.Portuarios/PNGs/mapa_excel_2_pod_multileg.png)

### 📊 Matriz de Coordenadas Multileg (2 Puertos de Descarga)
| Concepto Financiero / Operativo | Columna | Fila / Celda | Regla del Parser ETL | Ejemplo `V.764 MOQUEGUA` |
| :--- | :---: | :---: | :--- | :---: |
| **Total Freight Income US$** | `H` | `23` | Celda roja de consolidación de múltiples fletes de descarga | **`$403,725.00 USD`** |
| **Income (Gross Revenue)** | `N` | `14` | Resumen superior de ingresos | `$409,725.00 USD` |
| **Total Agency US$ (Gastos Puerto)** | `C` | **`48`** | Suma acumulada de agenciamientos (`ILO` $16,373 + `CALLAO` $10,863 + `MARCONA` $33,146) | **`$60,388.00 USD`** |
| **Bunkers US$ (Consumo Búnker)** | `S` | **`48`** | Suma total de consumo de búnker en las 3 piernas navegadas | **`$47,294.00 USD`** |
| **Duration (d) Multileg** | `Q` | `14` | Días totales navegados y de estadía | `7.58 días` |
| **Sea Days (Días de Mar)** | `Q` | `15` | Suma de días de navegación | `4.10 días` |
| **Port/Idle Days (Días de Puerto)** | `Q` | `16` | Suma de estadías en puertos de carga y descarga | `3.48 días` |
| **TCE Realizado Multileg** | `Q` | `17` | TCE ejecutado de la expedición multileg | **`$39,836.00 /día`** |
| **TCE Req. (TCE Requerido)** | `Q` | **`18`** | Costo base diario del buque (`MOQUEGUA`) | **`$13,000.00 /día`** |
| **P/L (Utilidad Neta Real)** | `Q` | **`20`** | Celda amarilla de Utilidad Neta Real acumulada | **`$203,475.00 USD`** |

---

## 3. ⚙️ Algoritmo Extractor Python para `Obsidian.ETL` (`openpyxl`)

```python
def extract_voyage_liquidation_data(sheet):
    """
    Algoritmo unificado de extracción de celdas para Single Leg y Multileg 2 PODs.
    """
    # 1. Detección de Multileg (Chequeo de celda C48 o múltiples filas de descarga en C29:C33)
    is_multileg = sheet['C48'].value is not None and str(sheet['C48'].value).strip() != ""
    
    if is_multileg:
        # Extracción Multileg
        port_costs = float(sheet['C48'].value or 0.0)
        bunker_costs = float(sheet['S48'].value or 0.0)
        gross_revenue = float(sheet['H23'].value or sheet['N14'].value or 0.0)
    else:
        # Extracción Single Leg
        port_costs = float(sheet['N15'].value or 0.0)
        bunker_costs = float(sheet['N16'].value or 0.0)
        gross_revenue = float(sheet['N14'].value or 0.0)

    # Métricas Comunes de la Sección Results
    duration_days = float(sheet['Q14'].value or 0.0)
    sea_days = float(sheet['Q15'].value or 0.0)
    port_days = float(sheet['Q16'].value or 0.0)
    tce_real = float(sheet['Q17'].value or 0.0)
    tce_req = float(sheet['Q18'].value or 13000.0)
    net_profit = float(sheet['Q20'].value or 0.0)

    return {
        "gross_revenue_usd": gross_revenue,
        "port_costs_usd": port_costs,
        "bunker_costs_usd": bunker_costs,
        "duration_days": duration_days,
        "sea_days": sea_days,
        "port_days": port_days,
        "tce_usd_day": tce_real,
        "tce_req_usd_day": tce_req,
        "net_profit_usd": net_profit
    }
```
