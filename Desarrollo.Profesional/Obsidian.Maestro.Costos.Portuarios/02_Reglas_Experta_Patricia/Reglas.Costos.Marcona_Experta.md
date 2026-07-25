# ⚓ MARCONA — Reglas de Costos Portuarios & Modelo JSONB
> **Vínculo con el Layout**: [[PNG_Marcona_Layout]]
> **Puerto**: Marcona 🇵🇪 | **Proveedor**: PSA Marine / Agente: Trans Total
> **Acuerdo Marco**: Contrato Southern / SPCC (2025-2027)

---

## 🏗️ 1. Desdoblamiento de Servicios e Identificación de Maniobras

- `Pilotage_IN` / `OUT`
- `Towage_IN` / `OUT`
- `Linesmen_IN` / `OUT`
- `Launch_StandBy` (evaluado por horas de estadía > 48h)

---

## 🧮 2. Tubería de 3 Filtros Aplicada a Marcona

### 1️⃣ Filtro 1: Reglas de Propiedad del Viaje (`property_rules`)
- **`Lighthouse_Dues`**:
  - Para cliente **SPCC / Southern**: Tarifa a `$0.03 USD/GRT` (Nacional). Extranjero no aplica por acuerdo marco.

### 2️⃣ Filtro 2: Reglas de Tiempo / Casino (`time_rules`)
- **Stand-By de Lancha**:
  - Horas base incluidas: 48 hrs ($40/h).
  - Exceso > 48 hrs: Recargo de $3,000 USD en Remolque Stand-By si supera límite operativo.

### 3️⃣ Filtro 3: Regla Comercial Prevalente (Tarifa Acuerdo Southern)

```json
{
  "Marcona_Standard_Rate": {
    "calculation_type": "AGREED_FLAT",
    "public_tariff_sum": 61424.07,
    "agreed_contract_rate": 36000.00,
    "notes": "Tarifario preferencial cerrado con Southern 2025-2027 para Naviera Petral"
  }
}
```

---

## 📊 3. Resumen de Liquidación

- **Tarifario Público Bruto**: `$61,424.07 USD`
- **Tarifario Acordado SPCC-PSA**: `$35,117.33 USD`
- **Tarifario Aplicable Final Petral (Engine Output)**: **`$36,000.00 USD`**
