# ⚓ MATARANI — Reglas de Costos Portuarios `_Claude`
> **Terminal**: Tisur | **País**: Perú 🇵🇪
> **Fuente PNG**: [[PNG_Matarani_Layout]] | **DB**: `port_id=MATARANI`, `terminal=GENERAL`
> **Agente**: Transtotal | **Operador terminal**: PSA Marine (servicio integral)
> **Buque ref (Moquegua)**: Eslora 134 | GRT 8,259 | DW 14,298

---

## A) Shifting Expenses — Reglas y Tarifas

### 🚢 Servicio Integral (Único en Perú)
> ⚠️ **Matarani empaqueta Pilotaje + Remolcadores + Lancha** en UNA sola tarifa base.

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Pilot + Tug Boats + Lancha (Servicio integral) | $5,550.00 / maniobra | `5550 × QTY` | Incluye Remolcaje, Practicaje, Lancha. PSA Marine. |
| Cargo de Acceso | $70.00 / maniobra | `70 × QTY` | $70.00 + IGV. |
| Linesmen /amarre y desamarre | $357.30 fijo | `357.30` | Tarifa plana. |
| Port toll /Land transport /terminal fee | $75.00 / move | `75 × MOVES` | |

### 💡 Regla de Recargos Porcentuales (Exclusiva Matarani)
> A diferencia de otros puertos donde el recargo es fijo, aquí es **un % sobre la tarifa base $5,550**.

| Horario | Recargo | Cálculo | Ejemplo |
|---|---|---|---|
| Lunes–Sábado 18:00–24:00 | **+25%** | `5550 × 0.25` | +$1,387.50 |
| Lunes–Sábado 00:00–07:00 | **+50%** | `5550 × 0.50` | +$2,775.00 |
| Domingos y Feriados | **+50%** | `5550 × 0.50` | +$2,775.00 |

> 🎰 **Regla del Casino**: Si la maniobra empieza en horario normal pero termina en nocturno, se aplica la tarifa más alta a **toda** la maniobra.

---

## B) General Port Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Lighthouse Dues (Puerto Nacional) | $0.03 / GRT | `0.03 × GRT` | Condicional: viene de PE. |
| Lighthouse Dues (Puerto Extranjero) | $0.12 / GRT | `0.12 × GRT` | Condicional: viene del extranjero. |
| Dockage /Muellaje ($0.65×LOA×Hr) | $0.65 / LOA×Hr | `0.65 × LOA × HOURS` | Tisur: $0.57/hr × Hora × Eslora. |
| Launch autoridades / Min 2 hrs | $155.00 / 2hrs | `155` | Fija. **Mínimo 2 hrs**. |
| Sanitary Inspection | $670.00 fijo | `670` | Tarifa Región Moquegua. |
| Clearance (In/Out) | $200.00 fijo | `200` | Tarifa APN. |
| Coordinator on board | $225.00 / día | `225 × DAYS` | USD $225 por día + 18% IGV. |

### 🔑 Regla de Dockage — Diferente a Callao
- **Matarani**: `$0.65 × LOA × HOURS` (Tisur)
- **Callao**: `$1.50 × LOA × HOURS` (APM)
- Las **Horas de Puerto** deben sumar rigurosamente los tiempos periféricos de amarre/desamarre al tiempo neto de operación.

---

## C) Agency Expenses

| Concepto | Tarifa | Fórmula |
|---|---|---|
| Agency Fee | $1,100.00 fijo | `1100` |
| Transportation | $200.00 fijo | `200` |
| Comunication | $200.00 fijo | `200` |

---

## 📊 Ejemplo — Buque Moquegua (GRT 8,259 | LOA 134 | 32 hrs | horario diurno)

| Ítem | Cálculo | Total |
|---|---|---|
| Servicio Integral (2 maniobras) | 5,550 × 2 | $11,100.00 |
| Recargo 25% (si aplica nocturno) | 5,550 × 0.25 | $1,387.50 |
| Cargo de Acceso (4 usos) | 70 × 4 | $280.00 |
| Linesmen | 357.30 × 1 | $357.30 |
| Port toll | 75 × 2 | $150.00 |
| Lighthouse Nacional | 0.03 × 8,259 | $247.77 |
| Dockage Tisur | 0.65 × 134 × 32 | $2,787.20 |
| Launch autoridades | 155 × 1 | $155.00 |
| Sanitary | 670 | $670.00 |
| Clearance | 200 | $200.00 |
| Coordinator (2 días) | 225 × 2 | $450.00 |
| Agency Fee | 1,100 | $1,100.00 |
| Transportation | 200 | $200.00 |
| Comunication | 200 | $200.00 |

---
> 🔗 **Ver tabla completa PNG**: [[PNG_Matarani_Layout]]
> 🗄️ **DB**: `SELECT * FROM port_costs_matrix WHERE port_id='MATARANI' AND terminal='GENERAL'`
