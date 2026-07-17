# ⚓ MEJILLONES / TGN — Reglas de Costos Portuarios `_Claude`
> **Terminal**: TPM — Terminal Puerto Mejillones (TGN) | **País**: Chile 🇨🇱
> **Fuente PNG**: [[PNG_Mejillones_TGN_Layout]] | **DB**: `port_id=MEJILLONES`, `terminal=TPM`
> **Agente**: B&M | **TOTAL ref Moquegua**: $57,999.77
> **Buque ref (Moquegua)**: Eslora 134 | GRT 8,259 | DW 14,298 | 36 hrs

---

## A) Shifting Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Pilotage. | Variable GRT | `(GRT/8259) × 1207.38` | Tarifa fija según Autoridad Marítima Chile. Variable por GRT. |
| Towage. | $2,800.00 / maniobra | `2800 × QTY` | Tarifa Fija 2026. Mooring/unmooring. Remolcadores Ultratug Ltd. |
| Pilot Insurance | $110.00 / operación | `110 × 3` | 3 operaciones: amarre, desamarre, anchorage. |
| Linesmen /amarre y desamarre | $871.25 / maniobra | `871.25 × 2` | Tarifa fija Puerto Mejillones. Amarradores en tierra. |

---

## B) General Port Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| **Ligth Dues ($1.60×GRT)** | $1.60 / GRT / año | `1.60 × GRT` | **LIGHT DUES CHILE = USD 1.60/GRT POR AÑO** |
| **Dockage ($3.99×LOA×Hr)** | $3.99 / LOA×Hr | `3.99 × LOA × HOURS` | 3.99 × LOA × 36 hrs. Tarifa TGN. |
| Launch Anchorage | $390.00 fijo | `390` | Por hora, si es requerida. **Opcional**. |
| Launch pier usage | $420.00 fijo | `420` | Uso por muelle. |
| Launch recepcion/amarre y desamarre | $450.00 / maniobra | `450 × QTY` | Mooring (02 lanchas) / unmooring (01 lancha). Por maniobra. |
| Launch Inward/Outward clearances | $420.00 fijo | `420 × 2` | Entrada y salida. |
| Pilot Transport | $165.00 / operación | `165 × 3` | Tarifa fija Puerto Mejillones. |
| Authorities Transport (In/Out) | $650.00 fijo | `650` | |
| Authorities Charges (clearances) | $700.00 fijo | `700` | Authorities clearance fee. |
| ISPS Fee. | $1,140.35 fijo | `1140.35` | Tarifa fija Puerto Mejillones. |
| Immigration Authorities. | $25.00 fijo | `25` | Policía de Investigación de Chile. |
| Health authorities. | $110.00 fijo | `110` | Sanidad Marítima. |
| **Loading Master** | $3,264.40 fijo | `3264.40` | $62/hr × 36 hrs. Tarifa fija Puerto Mejillones. |

### 🔑 Reglas Exclusivas de Chile (TGN)
- **Light Dues**: Se paga ANUAL — `$1.60 × GRT × año`. Para el buque Moquegua: `$1.60 × 8,259 = $13,214.40`
- **Dockage**: `$3.99 × LOA × HOURS` — tarifa más cara que Matarani ($0.65) y Callao ($1.50)
- **Loading Master**: Cargo fijo de $3,264.40 (≈$62/hr × 36h) — no aplica en puertos Perú
- **ISPS Fee**: Cargo de seguridad portuaria Chile. TGN: $1,140.35

---

## C) Agency Expenses

| Concepto | Tarifa | Fórmula |
|---|---|---|
| Agency Fee | $1,200.00 fijo | `1200` |

---

## 📊 Referencia TOTAL — Buque Moquegua (GRT 8,259 | LOA 134 | 36 hrs)
> **TOTAL calculado desde PNG**: **$57,999.77**

---
> 🔗 **Ver tabla completa PNG**: [[PNG_Mejillones_TGN_Layout]]
> 🗄️ **DB**: `SELECT * FROM port_costs_matrix WHERE port_id='MEJILLONES' AND terminal='TPM'`
> 🔗 **Comparar con**: [[Reglas.Costos.Mejillones.Interacid_Claude]] | [[Reglas.Costos.Mejillones.Terquim_Claude]]
