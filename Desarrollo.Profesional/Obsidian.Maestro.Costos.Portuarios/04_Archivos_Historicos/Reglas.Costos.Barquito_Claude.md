# ⚓ BARQUITO — Reglas de Costos Portuarios `_Claude`
> **Terminal**: Barquito (Puerto Chañaral) | **País**: Chile 🇨🇱
> **Fuente PNG**: [[PNG_Barquito_Layout]] | **DB**: `port_id=BARQUITO`, `terminal=GENERAL`
> **Agente**: B&M | **TOTAL ref Moquegua**: **$89,195.81 — Puerto más caro de toda la red**
> **Buque ref (Moquegua)**: Eslora 134 | GRT 8,259 | DW 14,298 | 28 hrs | Carga 10,500

---

## A) Shifting Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Pilotage. | Variable GRT | `(GRT/8259) × 1151.01` | Tarifa fija según Autoridad Marítima Chile. |
| **Towage.(amarre/desamarre)** | **$6,500.00 / maniobra** | `6500 × QTY` | ⚠️ **Más del doble que Mejillones** ($2,800). Ultratug. Basado en 02 horas. |
| Pilot Insurance | $110.00 / operación | `110 × 3` | 2 seguros de práctico $80 c/u. Total $110 × 3. |
| Linesmen /amarre y desamarre | $1,000.00 / maniobra | `1000 × 2` | ⚠️ **Mayor que todos los Mejillones**. SMPs amarradores en tierra. |
| Port toll /Land transport | $75.00 fijo | `75` | |

---

## B) General Port Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| **Ligth Dues ($1.56×GRT)** | $1.56 / GRT / año | `1.56 × GRT` | ⚠️ USD 4.07/GRT POR AÑO → 15 viajes = $1.56 por viaje. USD 33,614 anuales para Moquegua. |
| **Dockage ($71.92×TH)** | $71.92 / hr | `71.92 × HOURS` | ⚠️ USD 71.92 por hora (28 hrs ref). Fórmula única sin LOA. |
| Launch amarre y desamarre | $720.00 / maniobra | `720 × QTY` | Mooring (02×02 hrs) / unmooring (02×01 hr) por maniobra. |
| Launch Stand by | $100.00 / hr | `100 × HOURS` | Lancha Stand by en puerto. Regularización local. |
| Launch Anchorage at roads | $430.00 fijo | `430` | Por hora si es requerida. **Opcional**. |
| Launch Inward/Outward clearances | $380.00 fijo | `380 × 2` | |
| Pilot Transport | $140.00 / operación | `140 × 3` | ⚠️ Más barato que Mejillones ($165). |
| **Linesmen transportation** | $350.00 fijo | `350` | ⚠️ **Exclusivo Barquito**. Transporte de amarradores In/Out. |
| **Tugboat stand by** | **$648.00 / hr** | `648 × HOURS` | ⚠️ **Concepto exigido por Autoridad Marítima**. No es opcional. |
| **Tugboat Navigation** | **$745.00 / hr** | `745 × 8` | ⚠️ **Exclusivo Barquito**. Navegación desde Caldera (~8 hrs). |
| Authorities Transport (In/Out) | $550.00 fijo | `550` | |
| Authorities Charges (clearances) | $700.00 fijo | `700` | Authorities clearance fee. |
| Immigration Authorities. | $28.00 fijo | `28` | Policía de Investigación de Chile. |
| Health authorities. | $130.00 fijo | `130` | ⚠️ Más caro que Mejillones ($110–$120). |

### 🔑 Lo que hace a Barquito el más caro de todos

| Factor | Valor | Por qué duele |
|---|---|---|
| **Tugboat Stand By** | $648/hr × 28 hrs | = $18,144 — obligatorio, exigido por DIRECTEMAR |
| **Tugboat Navigation** | $745 × 8 hrs | = $5,960 — viaje desde Caldera |
| **Towage** | $6,500 × maniobras | El doble que Mejillones |
| **Light Dues** | $1.56 × 8,259 GRT | = $12,884 por viaje |
| **Launch Stand By** | $100/hr × 28 hrs | = $2,800 |

> ⚠️ **Barquito = Mejillones + Tugboat Stand By constante + Navegación Caldera**

---

## C) Agency Expenses

| Concepto | Tarifa | Fórmula |
|---|---|---|
| Loading Master | $2,450.00 fijo | `2450` |
| Agency Fee | $1,200.00 fijo | `1200` |

---

## 📊 Referencia TOTAL — Buque Moquegua (GRT 8,259 | LOA 134 | 28 hrs)
> **TOTAL calculado desde PNG**: **$89,195.81**

### Top de puertos por costo total (buque Moquegua):
| Puerto/Terminal | Total USD |
|---|---|
| 🔴 BARQUITO | **$89,196** |
| 🟠 MARCONA | **~$60,000** |
| 🟡 MEJILLONES Interacid | $64,199 |
| 🟡 MEJILLONES Terquim | $64,056 |
| 🟡 MEJILLONES TGN | $57,999 |
| 🟢 MATARANI | ~$23,200 |
| 🟢 ILO | ~$17,800 |
| 🟢 CALLAO | ~$15,300 |

---
> 🔗 **Ver tabla completa PNG**: [[PNG_Barquito_Layout]]
> 🗄️ **DB**: `SELECT * FROM port_costs_matrix WHERE port_id='BARQUITO' AND terminal='GENERAL'`
