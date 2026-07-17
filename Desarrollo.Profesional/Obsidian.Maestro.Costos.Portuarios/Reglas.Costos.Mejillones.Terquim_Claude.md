# ⚓ MEJILLONES / TERQUIM — Reglas de Costos Portuarios `_Claude`
> **Terminal**: Terquim | **País**: Chile 🇨🇱
> **Fuente PNG**: [[PNG_Mejillones_Terquim_Layout]] | **DB**: `port_id=MEJILLONES`, `terminal=TERQUIM`
> **Agente**: B&M | **TOTAL ref Moquegua**: $64,056.27
> **Buque ref (Moquegua)**: Eslora 134 | GRT 8,259 | DW 14,298 | **30 hrs** (más rápido que TGN/Interacid)

---

## A) Shifting Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Pilotage. | Variable GRT | `(GRT/8259) × 1151.01` | Tarifa fija según Autoridad Marítima Chile. |
| Towage. | $2,800.00 / maniobra | `2800 × QTY` | Tarifa Fija 2026. Remolcadores Ultratug Ltd. |
| Pilot Insurance | $110.00 / operación | `110 × 3` | Tarifa Fija Puerto Mejillones. |
| Linesmen /amarre y desamarre | $801.00 / maniobra | `801 × 2` | ⚠️ Más barato que TGN ($871.25) e Interacid ($870). |

---

## B) General Port Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| **Ligth Dues ($1.60×GRT)** | $1.60 / GRT / año | `1.60 × GRT` | LIGHT DUES CHILE = USD 1.60/GRT POR AÑO. |
| **Dockage ($5.72×LOA×TH)** | $5.72 / LOA×Hr | `5.72 × LOA × HOURS` | ⚠️ **El más caro de Mejillones**. 5.72 × LOA × 30 hrs. |
| Launch recepcion/amarre y desamarre | $450.00 / maniobra | `450 × QTY` | Mooring (02 lanchas) / unmooring (01 lancha). |
| **Launch embarcadero** | $280.00 fijo | `280` | Exclusivo Terquim e Interacid. |
| Launch Anchorage | $390.00 fijo | `390` | Por hora, si es requerida. **Opcional**. |
| Launch Inward/Outward clearances | $420.00 fijo | `420 × 2` | Entrada y salida. |
| Launch pier usage | $420.00 fijo | `420` | Uso por muelle. |
| Pilot Transport | $165.00 / operación | `165 × 3` | Tarifa fija Puerto Mejillones. |
| Authorities Transport (In/Out) | $650.00 fijo | `650` | |
| **ISPS Fee.** | **$1,191.00** fijo | `1191` | Entre TGN ($1,140) e Interacid ($1,273). |
| Authorities Charges (clearances) | $700.00 fijo | `700` | Authorities clearance fee. |
| Immigration Authorities. | $28.00 fijo | `28` | Policía de Investigación de Chile. |
| Health authorities. | $120.00 fijo | `120` | Sanidad Marítima. |
| **Loading Master** | **$2,923.00** fijo | `2923` | Por nominación USD 2,401.90. El más bajo de Mejillones. |

### 🔑 Particularidades de Terquim
- **Dockage más caro**: `$5.72 × LOA × HOURS` — vs TGN $3.99 / Interacid $702/hr
- **Horas de referencia**: 30 hrs (vs 36 hrs TGN/Interacid) — opera más rápido
- **Loading Master más económico**: $2,923 vs Interacid $3,096 (86×36) vs TGN $3,264
- **Pass Through disponible**: Toggle para que el cliente asuma directamente dockage y loading master

---

## C) Agency Expenses

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Agency Fee | $1,200.00 fijo | `1200` | B&M por Agenciamiento de Nave. |
| **Hose conection/Portalon** | **$2,500.00** fijo | `2500` | ⚠️ **Opcional** — "Solo Si requiere". Checkbox Frontend. |

> 💡 **Hose Connection**: Único cobro de Agency Expenses que es opcional. Si el terminal requiere conexión de manguera/portón para la operación química, se activa este costo.

---

## 📊 Referencia TOTAL — Buque Moquegua (GRT 8,259 | LOA 134 | 30 hrs)
> **TOTAL calculado desde PNG**: **$64,056.27**

### Comparativa Mejillones 3 terminales:
| Terminal | Dockage (30/36 hrs) | Loading Master | ISPS | TOTAL |
|---|---|---|---|---|
| TGN/TPM | $19,270 (36h) | $3,264 | $1,140 | **$57,999** |
| INTERACID | $25,272 (36h) | $3,096 | $1,273 | **$64,199** |
| TERQUIM | $23,022 (30h) | $2,923 | $1,191 | **$64,056** |

---
> 🔗 **Ver tabla completa PNG**: [[PNG_Mejillones_Terquim_Layout]]
> 🗄️ **DB**: `SELECT * FROM port_costs_matrix WHERE port_id='MEJILLONES' AND terminal='TERQUIM'`
> 🔗 **Comparar con**: [[Reglas.Costos.Mejillones.TGN_Claude]] | [[Reglas.Costos.Mejillones.Interacid_Claude]]
