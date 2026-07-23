# ⚓ CALLAO (APM Terminals) — Reglas de Costos Portuarios & Modelo JSONB
> **Vínculo con el Layout**: [[PNG_Callao_Layout]]
> **Terminal**: APM Terminals Callao 🇵🇪 | **Agente**: Trans Total
> **Tipo de Cambio de Referencia**: 3.42 S/ por USD

---

## 🏗️ 1. Desdoblamiento de Servicios e Identificación de Maniobras

Para soportar las variaciones por hora exacta y día de maniobra, los servicios desdoblados en Callao son:

- `Pilotage_IN` y `Pilotage_OUT` (Practicaje)
- `Towage_IN` y `Towage_OUT` (Remolcadores)
- `Launch_IN` y `Launch_OUT` (Lanchas de Amarre/Desamarre)
- `Access_IN` y `Access_OUT` (Cargos de Acceso al Atraque/Desatraque)

---

## 🧮 2. Tubería de 3 Filtros Aplicada a Callao

### 1️⃣ Filtro 1: Reglas de Propiedad del Viaje (`property_rules`)
- **`Lighthouse_Dues` (Derechos de Faro y Balisas)**:
  - Si el puerto anterior (`last_port`) es un **puerto nacional (Perú)**: `Tarifa = $0.03 USD / GRT`.
  - Si el puerto anterior (`last_port`) es un **puerto extranjero**: `Tarifa = $0.12 USD / GRT`.
- **`Clearance`**:
  - `Tarifa = $200.00 USD` (Flat in/out).
- **`Sanitary_Inspection`**:
  - Aplica únicamente si la nave viene o va del extranjero (`$520.00 USD`).

---

### 2️⃣ Filtro 2: Reglas de Tiempo / Casino (`time_rules`)

#### A. Practicaje (`Pilotage_IN` / `Pilotage_OUT`):
- Tarifa base: `$750.00 USD` o `0.055 × GRT` (el mayor).
- **Recargos Horarios (`time_range`)**:
  - Entre **18:00 y 24:00 hrs**: **`+25%`** sobre la tarifa.
  - Entre **00:00 y 07:00 hrs**: **`+50%`** sobre la tarifa.
  - **Domingos y Feriados (`is_holiday_or_sunday`)**: **`+50%`** sobre la tarifa.

#### B. Coordinadores y Linemen (`Coordinator`, `Launch_IN/OUT`):
- **Domingos y Feriados (`is_holiday_or_sunday`)**: **`+50%`** de recargo.
- **Cierre de Puerto (`port_closure`)**: **`+50%`** de recargo en lanchas.

#### C. Agenciamiento (`Agency_Fee`):
- Tarifa base: `$1,000.00 USD` (hasta 5 días de estadía).
- **Estadía Excesiva (`stay_days > 5`)**: **`+$150.00 USD`** por día adicional.

---

### 3️⃣ Filtro 3: Fórmulas Matemáticas Base (Las 7 Categorías)

```json
{
  "Pilotage_IN": {
    "calculation_type": "CONDITIONAL_MAX",
    "default_rate": 750.00,
    "grt_multiplier": 0.055,
    "time_rules": [
      { "name": "Overtime 18:00-24:00", "type": "time_range", "start": "18:00", "end": "24:00", "percentage": 25.0 },
      { "name": "Overtime 00:00-07:00", "type": "time_range", "start": "00:00", "end": "07:00", "percentage": 50.0 },
      { "name": "Domingo o Feriado", "type": "is_holiday_or_sunday", "percentage": 50.0 }
    ]
  },
  "Towage_IN": {
    "calculation_type": "PER_QTY",
    "default_rate": 800.00,
    "default_qty": 2
  },
  "Dockage_APM": {
    "calculation_type": "PER_LOA_HOUR",
    "default_rate": 1.50
  },
  "Lighthouse_Dues": {
    "calculation_type": "PER_GRT",
    "property_rules": [
      { "condition": "last_port_national", "rate": 0.03 },
      { "condition": "last_port_foreign", "rate": 0.12 }
    ]
  }
}
```

---

## 📊 3. Verificación de la Simulación Oficial (Moquegua — Callao)

Para un buque tipo **Moquegua** (GRT `8,259` | LOA `134.16m` | Carga `13,500 MT` | Horas Puerto `27h`):

| Concepto | Fórmula | Cálculo | Importe |
| :--- | :--- | :--- | :---: |
| **Practicaje (IN + OUT)** | `$750 × 2` | `MAX(750, 0.055 × 8259) × 2` | `$1,500.00` |
| **Remolcaje (Petranso)** | `$800 × 4` | `4 Remolques × $800` | `$3,200.00` |
| **Acceso Atraque / Desatraque** | `$70 × 2` | `2 Maniobras × $70` | `$140.00` |
| **Faro y Balisas (Nacional)** | `$0.03 × GRT` | `$0.03 × 8,259` | `$247.77` |
| **Muellaje APM** | `$1.50 × LOA × Hrs` | `$1.50 × 134.16 × 27h` | `$5,758.48` |
| **Lanchas Operativas** | `$85 × 4` | `4 Lanchas × $85` | `$340.00` |
| **Coordinador a Bordo** | `$225 × 2` | `2 Turnos × $225` | `$450.00` |
| **Clearance (In/Out)** | Flat | `Clearance obligatorio` | `$200.00` |
| **Inspección Sanitaria** | Flat | `Sanidad marítima` | `$520.00` |
| **Honorarios Agencia** | Flat | `Agency Fee Transtotal` | `$1,000.00` |
| **Movilidad & Comunicaciones** | Flat | `$200 + $250` | `$450.00` |
| **TOTAL LIQUIDACIÓN CALLAO** | — | — | **$14,938.34 USD** |
