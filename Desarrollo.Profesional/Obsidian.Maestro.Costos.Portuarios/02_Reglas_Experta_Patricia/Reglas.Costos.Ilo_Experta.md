# ⚓ ILO — Reglas de Costos Portuarios & Modelo JSONB
> **Vínculo con el Layout**: [[PNG_Ilo_Layout]]
> **Puerto / Terminal**: ILO (SPCC / Enapu) 🇵🇪
> **Proveedores**: Port Operations (Practicaje), PSA Marine / Petranso (Remolques), Trans Total

---

## 🏗️ 1. Desdoblamiento de Servicios e Identificación de Maniobras

- `Pilotage_IN` / `OUT`
- `Towage_PSA_IN` / `OUT` (Tarifa mínima $1,800.00)
- `Towage_Petranso_IN` / `OUT` (Tarifa $0.18 x GRT con 10% desc)
- `Dockage_SPCC` ($0.05 x GRT x Día + $300 amarre)

---

## 🧮 2. Tubería de 3 Filtros Aplicada a Ilo

### 1️⃣ Filtro 1: Reglas de Propiedad del Viaje (`property_rules`)
- **Muellaje SPCC (`Dockage_SPCC`)**:
  - `0.05 USD × GRT × Días de Muelle + 300 USD (Amarre/Desamarre)`.

### 2️⃣ Filtro 2: Reglas de Tiempo & Overtime (`time_rules`)
- **PSA Marine Overtime**:
  - Lun-Sáb (18:00–00:00): `+15%`.
  - Lun-Sáb (00:00–07:00) y Dom/Feriados: `+25%`.
- **Petranso Overtime**:
  - Lun-Sáb (18:00–24:00), (00:00–07:00) y Dom/Feriados: `+25%`.

---

## 📊 3. Resumen de Liquidación (Moquegua)

- **Total Liquidación Ilo (Moquegua)**: **`$21,797.39 USD`**
