# ⚓ MARCONA — Reglas de Costos Portuarios `_Claude`
> **Terminal**: PSA Marine / Shougang | **País**: Perú 🇵🇪
> **Fuente PNG**: [[PNG_Marcona_Layout]] | **DB**: `port_id=MARCONA`, `terminal=GENERAL`
> **⚠️ Puerto más caro de Perú** — Towage $18,000/maniobra
> **Buque ref (Moquegua)**: Eslora 134 | GRT 8,259 | DW 14,298

---

## A) Shifting Expenses — Reglas y Tarifas

### 🚢 Practicaje + Launch (Bundle)
> Marcona empaqueta Practicaje + Lancha del Práctico en una sola tarifa.

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Practicaje + Launch for pilot | $4,980.00 / maniobra | `4980 × QTY` | PSA MARINE. $4,980×Mnver + 18% vat. |
| Linesmen /amarre y desamarre | $4,450.00 / maniobra | `4450 × QTY` | PSA MARINE. Incluye 2 lanchas y gavieras. |
| Towage /Remolcaje (Por maniobra) | $18,000.00 / maniobra | `18000 × QTY` | PSA MARINE. $18,000×Mnver + 18% vat. 2 tugs. |
| Port toll /Land transport | $75.00 / move | `75 × MOVES` | |

### 💡 Stand By — Comodín de Marcona
| Concepto | Tarifa | Fórmula | Cuándo |
|---|---|---|---|
| Remolcaje Stand by | $16,000.00 fijo | `16000` | **Opcional**. A partir de 60 horas de operación se aplica $3,000/día adicional. |

---

## B) General Port Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Lighthouse Dues (Puerto Nacional) | $0.03 / GRT | `0.03 × GRT` | Dirección de Hidrografía y Navegación. |
| Lighthouse Dues (Puerto Extranjero) | $0.12 / GRT | `0.12 × GRT` | |
| Coordinator on board | $225.00 / día | `225 × DAYS` | $225 per day + 18% IGV. |
| Clearance Expenses (In/Out) | $200.00 fijo | `200` | |
| Sanitary Inspection | $670.00 fijo | `670` | Tarifa APN. |
| Launch for Authorities | $200.00 fijo | `200` | $200 × maniobra + 18%. |
| Launch Hire (Stand By) | $40.00 / hr | `40 × HOURS` | $40/hr. Aprox. 40 horas. PSA Marine SA. |

### 🔑 Características Únicas de Marcona
- **No hay Dockage/Muellaje separado** — el terminal de Shougang no cobra muellaje tradicional
- **Todo es por maniobra**: Pilotaje, Remolcaje y Linesmen son tarifas planas gigantes × maniobra
- **IGV (+18%)** aplica sobre las tarifas de PSA Marine — importante para el cálculo total
- **Launch Stand By**: `$40/hr × ~40 hrs ≈ $1,280` — pago continuo mientras el buque está atracado

---

## C) Agency Expenses

| Concepto | Tarifa | Fórmula |
|---|---|---|
| Agency Fee | $1,400.00 fijo | `1400` |
| Transportation | $200.00 fijo | `200` |
| Comunication | $250.00 fijo | `250` |

> **Agency Fee más alto de Perú**: $1,400

---

## 📊 Ejemplo — Buque Moquegua (GRT 8,259 | LOA 134 | 32 hrs)

| Ítem | Cálculo | Total |
|---|---|---|
| Practicaje + Launch (2 maniobras) | 4,980 × 2 | $9,960.00 |
| Linesmen (2 maniobras) | 4,450 × 2 | $8,900.00 |
| Towage (2 maniobras) | 18,000 × 2 | $36,000.00 |
| Port toll | 75 × 2 | $150.00 |
| Lighthouse Nacional | 0.03 × 8,259 | $247.77 |
| Coordinator (2 días) | 225 × 2 | $450.00 |
| Clearance | 200 | $200.00 |
| Sanitary | 670 | $670.00 |
| Launch Authorities | 200 | $200.00 |
| Launch Stand By (32 hrs) | 40 × 32 | $1,280.00 |
| Agency Fee | 1,400 | $1,400.00 |
| Transportation | 200 | $200.00 |
| Comunication | 250 | $250.00 |
| **TOTAL** | | **≈ $59,907.77** |

---
> 🔗 **Ver tabla completa PNG**: [[PNG_Marcona_Layout]]
> 🗄️ **DB**: `SELECT * FROM port_costs_matrix WHERE port_id='MARCONA' AND terminal='GENERAL'`
