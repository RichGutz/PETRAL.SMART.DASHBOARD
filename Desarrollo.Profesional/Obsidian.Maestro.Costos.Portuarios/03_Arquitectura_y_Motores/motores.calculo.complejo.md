# ⚙️ Especificación Técnica Consolidada: Motores de Cálculo Complejo por Puerto

> **Ubicación en Bóveda**: `Obsidian.Maestro.Costos.Portuarios/motores.calculo.complejo.md`  
> **Ubicación en Código**: `Geeksoft_Engine/backend/port_engines/`  
> **Propósito**: Especificar la arquitectura modular backend y las ecuaciones matemáticas exactas sin mezclar reglas entre los 4 puertos principales de Perú (**Callao, Matarani, Marcona e Ilo**), garantizando 100% de transparencia matemática.

---

## 🏗️ 1. Arquitectura Modular Backend (`port_engines`)

El backend de `Geeksoft_Engine` desglosa la lógica en motores calculadores totalmente desacoplados para evitar cruce de reglas tarifarias:

```
Geeksoft_Engine/backend/port_engines/
 ├── core.py                 # Tubería Orquestadora Base & Evaluador de Fórmulas
 ├── calculator_callao.py    # Motor Dedicado: Callao (APM Terminals / Trans Total)
 ├── calculator_matarani.py  # Motor Dedicado: Matarani (Tisur S.A. / Addenda PSA)
 ├── calculator_marcona.py   # Motor Dedicado: Marcona (San Juan / SPCC Flat $36k)
 └── calculator_ilo.py       # Motor Dedicado: Ilo (Enapu / SPCC / PSA / Petranso)
```

---

## 📥 2. Estructura del Payload Universal (5 Inputs Clave)

El endpoint `POST /api/v2/port-costs/calculate-audit` procesa el siguiente contrato de datos:

```json
{
  "route_id": "CALLAO_MATARANI",
  "vessel_id": "MOQUEGUA",
  "cargo_tons": 13500.0,
  "entry_datetime": "2026-07-25T08:00:00Z",
  "exit_datetime": "2026-07-26T11:00:00Z",
  "last_port_country": "PE",
  "next_port_country": "PE",
  "tugboats_in": 2,
  "tugboats_out": 2
}
```

### 🔍 Extracción Automática del Maestro de Buques (`vessels`):
- `LOA` (Eslora total en metros): ej. `134.16m` (BT MOQUEGUA)
- `GRT` (Gross Register Tonnage): ej. `8,259` (BT MOQUEGUA)
- `DWT` (Deadweight Tonnage): ej. `14,298.00` (BT MOQUEGUA)

---

## 🇵🇪 3. Motor Dedicado Callao (`calculator_callao.py`) — APM Terminals

> **Terminal**: APM Terminals Callao | **Agente**: Trans Total | **Tipo de Cambio Ref**: 3.42 S/ por USD

### 3.1. Servicios Desdoblados
- `Pilotage_IN` / `Pilotage_OUT` (Practicaje)
- `Towage_IN` / `Towage_OUT` (Remolcadores Petranso / Trans Total)
- `Launch_IN` / `Launch_OUT` (Lanchas de amarre/desamarre)
- `Access_IN` / `Access_OUT` (Acceso atraque/desatraque)
- `Dockage_APM` (Muellaje APM Terminals)

### 3.2. Tubería de 3 Filtros de Callao
1. **Filtro 1: Reglas de Propiedad (`property_rules`)**:
   - `Lighthouse_Dues` (Faro y Balisas): $\$0.03\text{ USD / GRT}$ si procede de Perú (`PE`); $\$0.12\text{ USD / GRT}$ si procede del extranjero.
   - `Clearance`: $\$200.00\text{ USD Flat}$ (in/out).
   - `Sanitary_Inspection`: $\$520.00\text{ USD Flat}$ (si proviene o va al extranjero).

2. **Filtro 2: Reglas de Tiempo y Horario (`time_rules`)**:
   - `Pilotage_IN/OUT`: Base $\max(\$750.00, 0.055 \times \text{GRT})$. Overtime $18:00\text{--}24:00\text{h}$ $+25\%$; $00:00\text{--}07:00\text{h}$ y Domingos/Feriados $+50\%$.
   - `Launch_IN/OUT` & `Coordinator`: $+50\%$ recargo en Domingos/Feriados o Cierre de Puerto.
   - `Agency_Fee`: $\$1,000.00\text{ USD Flat}$ (hasta 5 días), $+\$150.00\text{ USD/día}$ adicional si $>5\text{ días}$.

3. **Filtro 3: Fórmulas Base**:
   - `Dockage_APM`: $\$1.50 \times \text{LOA} \times \text{Horas Puerto}$.
   - `Towage_Petranso`: $\$800.00 \times \text{Remolques Maniobrados}$.

### 3.3. Liquidación Oficial de Referencia Callao (BT MOQUEGUA — 27h Puerto)
| Ítem / Concepto | Proveedor | Ecuación Evaluada | Importe USD |
| :--- | :--- | :--- | :---: |
| **Practicaje (IN + OUT)** | Trans Total | `MAX(750, 0.055 × 8259) × 2` | `$1,500.00` |
| **Remolcaje (Petranso)** | Petranso | `4 Remolques × $800` | `$3,200.00` |
| **Acceso Atraque / Desatraque** | APM Terminals | `2 Maniobras × $70` | `$140.00` |
| **Faro y Balisas (Nacional)** | Autoridad Portuaria | `$0.03 × 8,259 GRT` | `$247.77` |
| **Muellaje APM Terminals** | APM Terminals | `$1.50 × 134.16m × 27h` | `$5,758.48` |
| **Lanchas Operativas** | Trans Total | `4 Lanchas × $85` | `$340.00` |
| **Coordinador a Bordo** | Trans Total | `2 Turnos × $225` | `$450.00` |
| **Clearance (In/Out)** | Autoridades | `Clearance obligatorio` | `$200.00` |
| **Inspección Sanitaria** | Sanidad Marítima | `Sanidad marítima flat` | `$520.00` |
| **Honorarios Agencia** | Trans Total | `Agency Fee Transtotal` | `$1,000.00` |
| **Movilidad & Comunicaciones**| Trans Total | `$200 + $250` | `$450.00` |
| **TOTAL LIQUIDACIÓN CALLAO** | — | — | **$14,938.34 USD** |

---

## 🇵🇪 4. Motor Dedicado Matarani (`calculator_matarani.py`) — Tisur S.A.

> **Terminal**: Tisur S.A. | **Prácticos/Remolques**: PSA Marine | **Agente**: Trans Total

### 4.1. Servicios Desdoblados
- `Pilotage_IN` / `OUT` & `Towage_IN` / `OUT` (Servicio Integral PSA)
- `Dockage_Tisur` (Muellaje Tisur S.A.)
- `Sanidad_Matarani` (Sanidad Marítima Arequipa)

### 4.2. Tubería de 3 Filtros de Matarani
1. **Filtro 1: Reglas de Propiedad (`property_rules`)**:
   - `Dockage_Tisur`: $\$0.65\text{ USD} \times \text{LOA (m)} \times \text{Horas Puerto}$.
   - `Sanidad_Matarani`: $\$670.00\text{ USD Flat}$.

2. **Filtro 2: Servicio Integral PSA & Overtime (`time_rules`)**:
   - `Servicio Integral PSA` (con Addenda 39.31%): $\$3,368.00\text{ USD}$ por maniobra ($\$6,736.00\text{ escala completa}$).
   - Overtime Lun-Sáb ($18:00\text{--}24:00\text{h}$): $+25\%$ ($\$842.00$).
   - Overtime Lun-Sáb ($00:00\text{--}07:00\text{h}$) y Dom/Feriados: $+50\%$ ($\$1,684.00$).

3. **Filtro 3: Descuentos Volumétricos por Frecuencia Anual**:
   - De 13 a 18 viajes/año: $-6.0\%$ de descuento en tarifa base.
   - 19 o más viajes/año: $-7.5\%$ de descuento.

### 4.3. Liquidación Oficial de Referencia Matarani (BT MOQUEGUA — 33h Puerto)
| Ítem / Concepto | Ecuación Evaluada | Importe USD |
| :--- | :--- | :---: |
| **Servicio Integral PSA (con Addenda 39.31%)** | `$3,368.00 × 2 Maniobras` | `$6,736.00` |
| **Muellaje Tisur S.A.** | `$0.65 × 134.16m × 33h` | `$2,877.73` |
| **Sanidad, Lanchas & Agenciamiento** | `Sanidad $670 + Agency $1,100 + Gastos` | `$5,750.77` |
| **TOTAL LIQUIDACIÓN MATARANI** | — | **$15,364.50 USD** |

---

## 🇵🇪 5. Motor Dedicado Marcona (`calculator_marcona.py`) — SPCC / San Juan

> **Puerto**: Marcona | **Proveedor**: PSA Marine / **Agente**: Trans Total | **Acuerdo**: SPCC (2025-2027)

### 5.1. Servicios Desdoblados
- `Pilotage_IN` / `OUT`, `Towage_IN` / `OUT`, `Linesmen_IN` / `OUT`
- `Launch_StandBy` (Evaluado en estadías $>48\text{h}$)

### 5.2. Tubería de 3 Filtros de Marcona
1. **Filtro 1: Reglas de Propiedad (`property_rules`)**:
   - `Lighthouse_Dues`: Tarifa preferencial a $\$0.03\text{ USD / GRT}$ para contrato SPCC/Southern.

2. **Filtro 2: Stand-By de Lanchas (`time_rules`)**:
   - Incluye hasta $48\text{ hrs}$ de lancha stand-by ($\$40/\text{h}$). Exceso $>48\text{h}$ aplica recargo de $\$3,000.00\text{ USD}$.

3. **Filtro 3: Regla Comercial Prevalente (Tarifa Acuerdo Southern)**:
   - Tarifario Público Bruto: $\$61,424.07\text{ USD}$.
   - Tarifario Acordado Preferencial SPCC-PSA-Petral: **$\$36,000.00\text{ USD Flat}$** por escala.

### 5.3. Liquidación Oficial de Referencia Marcona
| Ítem / Concepto | Tipo de Tarifa | Importe USD |
| :--- | :--- | :---: |
| **Servicio Integral Atraque Marcona** | Acuerdo Preferencial Pactado | `$30,508.48` |
| **Honorarios Agencia & Logística** | Agenciamiento Flat Trans Total | `$5,491.52` |
| **TOTAL LIQUIDACIÓN MARCONA** | **Acuerdo Flat Petral / Southern** | **$36,000.00 USD** |

---

## 🇵🇪 6. Motor Dedicado Ilo (`calculator_ilo.py`) — SPCC / Enapu

> **Puerto / Terminal**: ILO (SPCC / Enapu) | **Proveedores**: Port Operations (Practicaje), PSA Marine / Petranso, Trans Total

### 6.1. Servicios Desdoblados
- `Pilotage_IN` / `OUT` (Port Operations)
- `Towage_PSA_IN` / `OUT` (Tarifa mínima $\$1,800.00$)
- `Towage_Petranso_IN` / `OUT` ($\$0.18 \times \text{GRT}$ con 10% desc. comercial)
- `Dockage_SPCC` (Muellaje SPCC)

### 6.2. Tubería de 3 Filtros de Ilo
1. **Filtro 1: Reglas de Propiedad (`property_rules`)**:
   - `Dockage_SPCC`: $\$0.05\text{ USD} \times \text{GRT} \times \text{Días Muelle} + \$300.00\text{ USD (Amarre/Desamarre)}$.

2. **Filtro 2: Overtime Comparativo (`time_rules`)**:
   - PSA Marine Overtime: Lun-Sáb ($18:00\text{--}00:00\text{h}$) $+15\%$; Lun-Sáb ($00:00\text{--}07:00\text{h}$) y Dom/Feriados $+25\%$.
   - Petranso Overtime: $+25\%$ en horarios nocturnos y festivos.

### 6.3. Liquidación Oficial de Referencia Ilo (BT MOQUEGUA)
| Ítem / Concepto | Ecuación Evaluada | Importe USD |
| :--- | :--- | :---: |
| **Muellaje SPCC** | `$0.05 × 8,259 GRT × Días + $300` | `$1,538.85` |
| **Practicaje & Remolcaje Combinado** | `PSA / Petranso + Port Operations` | `$16,358.54` |
| **Agenciamiento & Gastos** | `Agency Fee + Lanchas + Sanidad` | `$3,900.00` |
| **TOTAL LIQUIDACIÓN ILO** | — | **$21,797.39 USD** |

---

## 📤 7. Estructura de Respuesta de Auditoría (`audit_trail`)

El orquestador `core.py` consolida los resultados en un objeto JSON unificado sin cruce de variables:

```json
{
  "port_id": "CALLAO",
  "total_scale_cost_usd": 14938.34,
  "total_port_hours": 27.0,
  "vessel_params": { "loa": 134.16, "grt": 8259, "dwt": 14298 },
  "audit_trail": [
    {
      "category": "A_SHIFTING",
      "concept": "Practicaje (IN + OUT)",
      "supplier": "Trans Total",
      "formula_evaluated": "MAX(750, 0.055 * 8259 GRT) * 2",
      "amount_usd": 1500.00
    },
    {
      "category": "B_GENERAL_PORT",
      "concept": "Muellaje APM Terminals",
      "supplier": "APM Terminals",
      "formula_evaluated": "1.50 USD * 134.16m (LOA) * 27h (Puerto)",
      "amount_usd": 5758.48
    }
  ]
}
```

---

## 🎛️ 8. Proformación Dinámica Forecast — Layout Dual de 4 PDFs (Mínimos vs Máximos)

Para resolver la incertidumbre de fecha y hora exacta de maniobra en la proformación comercial, el sistema genera **4 escenarios en PDF** organizados en 2 filas visuales dentro del panel de control:

### 📐 Layout de 4 PDFs en Pantalla (Fila Superior e Inferior):

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│ 📄 PDF 1: Carga Mínima (Horario Normal)       │ 📄 PDF 2: Descarga Mínima (Horario Normal)   │
│   • Maniobra Diurna Ordinaria (07:00-18:00h)  │   • Maniobra Diurna Ordinaria (07:00-18:00h)  │
│   • Sin recargo de overtime ($ Costo Base)    │   • Sin recargo de overtime ($ Costo Base)    │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 📄 PDF 3: Carga Máxima (Horario Recargo)      │ 📄 PDF 4: Descarga Máxima (Horario Recargo)  │
│   • Maniobra Nocturna/Feriado (00:00-07:00h) │   • Maniobra Nocturna/Feriado (00:00-07:00h) │
│   • Con recargo +25% / +50% por Overtime     │   • Con recargo +25% / +50% por Overtime     │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

### 📊 Regla de Promediado Dinámico para la Matriz Comercial:
```
Costo Carga Proforma    = (PDF 1 Carga Mínima + PDF 3 Carga Máxima) / 2
Costo Descarga Proforma = (PDF 2 Descarga Mínima + PDF 4 Descarga Máxima) / 2
Gasto Portuario Matriz  = Costo Carga Proforma + Costo Descarga Proforma
```

