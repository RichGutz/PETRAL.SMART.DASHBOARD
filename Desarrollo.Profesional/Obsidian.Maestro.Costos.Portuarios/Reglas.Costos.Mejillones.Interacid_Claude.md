# ⚓ MEJILLONES / INTERACID — Reglas de Costos Portuarios `_Claude`
> **Terminal**: Interacid | **País**: Chile 🇨🇱
> **Fuente PNG**: [[PNG_Mejillones_Interacid_Layout]] | **DB**: `port_id=MEJILLONES`, `terminal=INTERACID`
> **Agente**: B&M | **TOTAL ref Moquegua**: $64,199.41
> **Buque ref (Moquegua)**: Eslora 134 | GRT 8,259 | DW 14,298 | 36 hrs
> ⚠️ **FALTABA EN GEMINI — creado completamente desde PNG**

---

## A) Shifting Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Pilotage.( Based on GRT) | Variable GRT | `(GRT/8259) × 1151.01` | Tarifa fija según Autoridad Marítima Chile. Variable por GRT. |
| Towage. | $2,800.00 / maniobra | `2800 × QTY` | Tarifa Fija 2026. Mooring/unmooring. Remolcadores Ultratug Ltd. |
| Pilot Insurance | $110.00 / operación | `110 × 3` | Tarifa Fija Puerto Mejillones. 3 operaciones. |
| Linesmen /amarre y desamarre | $870.00 / maniobra | `870 × 2` | Tarifa fija Puerto Mejillones. Amarradores en tierra. |

> 💡 **Vs TGN**: Linesmen $870 vs $871.25 — casi idéntico

---

## B) General Port Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| **Ligth Dues ($1.60×GRT)** | $1.60 / GRT / año | `1.60 × GRT` | LIGHT DUES CHILE = USD 1.60/GRT POR AÑO. |
| **Dockage /Muellaje** | $702.00 / hr | `702 × HOURS` | `702 × TH / 36 H`. **⚠️ NO es LOA — es por hora**. |
| Launch Anchorage | $390.00 fijo | `390` | Por hora, si es requerida. **Opcional**. |
| Launch pier usage | $420.00 fijo | `420` | Uso por muelle. |
| Launch recepcion/amarre y desamarre | $450.00 / maniobra | `450 × QTY` | Mooring (02 lanchas) / unmooring (01 lancha). |
| **Launch embarcadero** | $280.00 fijo | `280` | ⚠️ **Exclusivo Interacid** (y Terquim). No existe en TGN. |
| Launch Inward/Outward clearances | $420.00 fijo | `420 × 2` | Entrada y salida. |
| Pilot Transport | $165.00 / operación | `165 × 3` | Tarifa fija Puerto Mejillones. |
| Authorities Transport (In/Out) | $650.00 fijo | `650` | |
| Authorities Charges (clearances) | $700.00 fijo | `700` | Authorities clearance fee. |
| **ISPS Fee.** | **$1,273.00** fijo | `1273` | ⚠️ **Mayor que TGN** ($1,140.35) y Terquim ($1,191). |
| Immigration Authorities. | $28.00 fijo | `28` | ⚠️ $3 más que TGN ($25). |
| Health authorities. | $120.00 fijo | `120` | ⚠️ $10 más que TGN ($110). |
| **Loading Master ($86.00×Hr)** | $86.00 / hr | `86 × HOURS` | ⚠️ **Variable por horas**. TGN y Terquim son planos. |

### 🔑 Diferencias Clave vs TGN y Terquim

| Ítem | TGN/TPM | INTERACID | TERQUIM |
|---|---|---|---|
| Dockage | $3.99×LOA×Hr | **$702/hr** | $5.72×LOA×Hr |
| Loading Master | $3,264.40 fijo | **$86/hr** | $2,923 fijo |
| Launch embarcadero | ❌ No | ✅ $280 | ✅ $280 |
| ISPS Fee | $1,140.35 | **$1,273.00** | $1,191.00 |
| Immigration | $25 | **$28** | $28 |
| Health | $110 | **$120** | $120 |

---

## C) Agency Expenses

| Concepto | Tarifa | Fórmula |
|---|---|---|
| Agency Fee | $1,200.00 fijo | `1200` |

---

## 📊 Referencia TOTAL — Buque Moquegua (GRT 8,259 | LOA 134 | 36 hrs)
> **TOTAL calculado desde PNG**: **$64,199.41** (+$6,200 vs TGN por dockage más caro)

---
> 🔗 **Ver tabla completa PNG**: [[PNG_Mejillones_Interacid_Layout]]
> 🗄️ **DB**: `SELECT * FROM port_costs_matrix WHERE port_id='MEJILLONES' AND terminal='INTERACID'`
> 🔗 **Comparar con**: [[Reglas.Costos.Mejillones.TGN_Claude]] | [[Reglas.Costos.Mejillones.Terquim_Claude]]
