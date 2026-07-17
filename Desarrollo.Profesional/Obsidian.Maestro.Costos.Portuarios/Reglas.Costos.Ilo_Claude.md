# ⚓ ILO — Reglas de Costos Portuarios `_Claude`
> **Terminal**: Enapu / Southern | **País**: Perú 🇵🇪
> **Fuente PNG**: [[PNG_Ilo_Layout]] | **DB**: `port_id=ILO`, `terminal=GENERAL`
> **Agente**: Transtotal
> **Buque ref (Moquegua)**: Eslora 134 | GRT 8,259 | DW 14,298

---

## A) Shifting Expenses — Reglas y Tarifas

### 🚢 Practicaje
| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Practicaje | $1,500.00 / maniobra | `1500 × QTY` | Tarifa Port Operations. $1,500 por maniobra. |
| Linesmen /amarre y desamarre | $170.00 / maniobra | `170 × QTY` | Por maniobra. |

### 🚤 Remolcaje — DOBLE OPCIÓN (PSA Marine vs Petranso)
> ⚠️ **Estructura compuesta**: Cada maniobra tiene 2 cobros paralelos (Tarifa Base + Posicionamiento)

**OPCIÓN A: PSA Marine**
| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Towage PSA MARINE | $0.16 / GRT | `0.16 × GRT × MOVES × TUGBOATS` | PSA $0.16 × GRT por maniobra por remolcador (2). |
| Remolcaje Posicionamiento PSA | $700.00 fijo | `700` | Tarifa plana extra por posicionamiento. |

**OPCIÓN B: Petranso**
| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Towage PETRANSO | $0.15 / GRT | `0.15 × GRT × MOVES × TUGBOATS` | Factor $0.15 × GRT, sujeto a 10% descuento. |
| Remolcaje Posicionamiento PETRANSO | $600.00 fijo | `600` | Posicionamiento $1,400 → $600 por remolcador. |

**Regla Horaria**: Las tarifas IN y OUT se calculan independientemente (pueden ocurrir en distintos horarios). Aplica Regla del Casino si cruzan horario.

### 🚢 Port Toll
| Concepto | Tarifa | Fórmula |
|---|---|---|
| Port toll /Land transport /terminal fee | $75.00 / move | `75 × MOVES` |

---

## B) General Port Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Lighthouse Dues (Puerto Nacional) | $0.03 / GRT | `0.03 × GRT` | Condicional: viene de PE. |
| Lighthouse Dues (Puerto Extranjero) | $0.12 / GRT | `0.12 × GRT` | Condicional: viene del extranjero. |
| Coordinator on board | $200.00 / día | `200 × DAYS` | Por Nave/Turno x día. |
| Sanitary Inspection | $520.00 fijo | `520` | S/1,284.00. Solo viajes internacionales. |
| **Lancha autoridades/práctico in/out** | $90.00 / hr | `90 × HOURS` | **Mínimo 4 hrs**. Lanchas de transporte. |
| **Lancha coordinador** | $85.00 / hr | `85 × HOURS` | **Mínimo 4 hrs**. |
| **Lancha amarre/desamarre** | $375.00 / maniobra | `375 × QTY` | Por maniobra (2in/2out). |
| **Lancha posicionamiento** | $100.00 / maniobra | `100 × QTY` | **Opcional** — Solo si aplicable. |
| Clearance (In/Out) | $200.00 fijo | `200` | |

### 🔑 Regla de Lanchas — Ilo es el más detallado de Perú
Ilo tiene **4 rubros de lanchas** con lógicas mixtas:
1. **Autoridades/Práctico**: `Tarifa/Hr × Hrs` con **mínimo 4 horas**
2. **Coordinador**: `Tarifa/Hr × Hrs` con **mínimo 4 horas**
3. **Amarre/Desamarre**: `Tarifa plana × maniobras` (2in/2out)
4. **Posicionamiento**: `Tarifa plana × maniobras` (opcional)

---

## C) Agency Expenses

| Concepto | Tarifa | Fórmula |
|---|---|---|
| Agency Fee | $900.00 fijo | `900` |
| Transportation | $200.00 fijo | `200` |
| Comunication | $200.00 fijo | `200` |

> **Agency Fee más bajo de Perú**: $900 vs Callao $1,000 / Marcona $1,400

---

## 📊 Ejemplo — Buque Moquegua (GRT 8,259 | 32 hrs | PSA Marine)

| Ítem | Cálculo | Total |
|---|---|---|
| Practicaje (2 maniobras) | 1,500 × 2 | $3,000.00 |
| Linesmen (4 maniobras) | 170 × 4 | $680.00 |
| Towage PSA (2 tugs × 2 moves) | 0.16 × 8,259 × 2 × 2 | $5,285.76 |
| Posicionamiento PSA (2 tugs) | 700 × 2 | $1,400.00 |
| Port toll | 75 × 2 | $150.00 |
| Lighthouse Nacional | 0.03 × 8,259 | $247.77 |
| Lancha autoridades (4 hrs) | 90 × 4 | $360.00 |
| Lancha coordinador (4 hrs) | 85 × 4 | $340.00 |
| Lancha amarre (4 maniobras) | 375 × 4 | $1,500.00 |
| Lancha posicionamiento (4) | 100 × 4 | $400.00 |
| Agency Fee | 900 | $900.00 |
| Transportation | 200 | $200.00 |
| Comunication | 200 | $200.00 |

---
> 🔗 **Ver tabla completa PNG**: [[PNG_Ilo_Layout]]
> 🗄️ **DB**: `SELECT * FROM port_costs_matrix WHERE port_id='ILO' AND terminal='GENERAL'`
