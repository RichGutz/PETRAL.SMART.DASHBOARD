# ⚓ CALLAO — Layout Exacto de la Experta (APM Terminals / Transtotal)
> **Archivo Fuente**: `Callao_Experta_2026.png` | **Terminal**: APM Terminals Callao 🇵🇪
> **Agente Principal**: Trans Total | **Tipo de Cambio Referencia**: 3.42 S/ por USD
> **Producto Evaluado**: Ácido Sulfúrico (Descarga 13,500 MT a 14,500 MT)

---

## 🚢 1. Parámetros de la Flota (Cabecera del Excel)

| Buque | Eslora (LOA) | Peso Muerto (DW) | Tonelaje Bruto (GRT) | Carga (MT) | Ritmo (T/h) | Horas Puerto | Origen | Total Liquidación |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BT MOQUEGUA** | `134.16m` | `14,298.00` | `8,259` | `13,500` | `500` | `27h` | Perú | **$14,938.34 USD** |
| **BT TABLONES** | `158.50m` | `18,335.00` | `11,365` | `14,500` | `500` | `34h` | Perú | **$18,229.48 USD** |
| **BT HUEMUL** | `161.42m` | `22,962.00` | `13,696` | `14,500` | `500` | `34h` | Perú | **$18,700.05 USD** |
| **CONCON TRADER** | `141.38m` | `19,823.15` | `11,773` | `14,500` | `500` | `34h` | Perú | **$17,673.30 USD** |

---

## 📊 2. Matriz Desglosada de Ítems Tarifarios

### A) Shifting Expenses (Gastos de Maniobras y Amarre)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua (8,259 GRT) | Tablones (11,365 GRT) | Huemul (13,696 GRT) | Concon Trader (11,773 GRT) | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | **Pilotage ($750 + OT)** | `$750.00` | 2 | `$1,500.00` | `$1,500.00` | `$1,500.00` | `$1,500.00` | Tarifa de Transtotal. Fija. Práctico por maniobra vigente hasta 31.12.2027. |
| 2 | **Pilotage ($0.055 * GRT)** | `0.055` | — | *(No aplica)* | *(No aplica)* | *(No aplica)* | *(No aplica)* | No aplica ($750 base es mayor al cálculo de GRT). |
| 3 | **Remolcaje TARIFA MINIMA PETRANSO** | `$800.00` | 4 | `$3,200.00` | `$3,200.00` | `$3,200.00` | `$3,200.00` | Petranso Remolcadores. Tarifa mínima $800 por maniobra (2 in, 2 out) aplicable hasta Junio 2027. |
| 4 | **Remolcaje ($0.065 * GRT) con 10% desc.** | `0.065` | — | *(No aplica)* | *(No aplica)* | *(No aplica)* | *(No aplica)* | No aplica. |
| 5 | **Cargo por Acceso al Atraque** | `$70.00` | 2 | `$140.00` | `$140.00` | `$140.00` | `$140.00` | Tarifa de Transtotal. Fija. Vigente hasta 31.12.2027. |
| 6 | **Cargo por Acceso al Desatraque** | `$70.00` | 2 | `$140.00` | `$140.00` | `$140.00` | `$140.00` | Tarifa de Transtotal. Fija. Vigente hasta 31.12.2027. |

### B) General Port Expenses (Gastos Generales de Puerto)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua (8,259 GRT) | Tablones (11,365 GRT) | Huemul (13,696 GRT) | Concon Trader (11,773 GRT) | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 7 | **Lighthouse Dues (Puerto NACIONAL)** | `$0.03/GRT` | 1 | `$247.77` | `$340.95` | `$410.88` | `$353.19` | Dirección de Hidrografía y Navegación. Depende del tránsito de la nave (cabotaje). |
| 8 | **Lighthouse Dues (Puerto EXTRANJERO)** | `$0.12/GRT` | 1 | `$991.08` | `$1,363.80` | `$1,643.52` | `$1,412.76` | Dirección de Hidrografía y Navegación. Aplica si viene de puerto extranjero. |
| 9 | **Dockage Muellaje ($1.50 * LOA * Hr)** | `$1.50/LOA/h` | Hrs | `$5,758.48` | `$8,083.50` | `$8,232.42` | `$7,210.38` | Tarifa APM $1.50 por hora o fracción (5.1.1.1). Tarifario oficial APM Callao. |
| 10 | **Launch Hire** | `$85.00` | 4 | `$340.00` | `$340.00` | `$340.00` | `$340.00` | Tarifa de Transtotal. Fija. Mooring / unmooring por maniobra / por lancha USD 85.00 x/h. Vigente hasta 31.12.2027. |
| 11 | **Coordinator on board** | `$225.00` | 2 | `$450.00` | `$450.00` | `$450.00` | `$450.00` | Tarifa fija Transtotal por nave/turno. Vigente hasta 31.12.2027. |
| 12 | **Clearance (In/Out)** | `$200.00` | 1 | `$200.00` | `$200.00` | `$200.00` | `$200.00` | Clearance (In/Out) $157 (IN) / $144 (OUT) SIEMPRE SE PAGA. |
| 13 | **Sanitary Inspection** | `$520.00` | 1 | `$520.00` | `$520.00` | `$520.00` | `$520.00` | Tarifa fija según Sanidad Marítima. Solo si viene o va del extranjero. |

### C) Agency Expenses (Gastos de Agencia)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua (8,259 GRT) | Tablones (11,365 GRT) | Huemul (13,696 GRT) | Concon Trader (11,773 GRT) | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 14 | **Agency Fee** | `$1,000.00` | 1 | `$1,000.00` | `$1,000.00` | `$1,000.00` | `$1,000.00` | Tarifa fija Transtotal por Agenciamiento de Nave. Vigente hasta 31.12.2027. |
| 15 | **Transportation** | `$200.00` | 1 | `$200.00` | `$200.00` | `$200.00` | `$200.00` | Autoridades, coordinador y personal operativo. Tarifa fija Transtotal. |
| 16 | **Comunication** | `$250.00` | 1 | `$250.00` | `$250.00` | `$250.00` | `$250.00` | Tarifa fija Transtotal. Vigente hasta 31.12.2027. |

---

## 🚨 3. Reglas de Recargo (Overcharges) y Condicionamientos de la Experta

> 📌 **NOTAS TÉCNICAS DEL PIE DE PÁGINA:**

1. **`(*)` Pilot Overcharges (Practicaje)**:
   - **`+25%`** si la maniobra se realiza entre **18:00 y 24:00 hrs**.
   - **`+50%`** si la maniobra se realiza entre **00:00 y 07:00 hrs**.
   - **`+50%`** si la maniobra se realiza en **Domingos y Feriados Públicos** (`[**]`).
2. **`(**)` Agency Fee (Estadía Prolongada)**:
   - Tarifa base válida para un máximo de **5 días** desde la llegada hasta el zarpe.
   - Tiempo extra: **`+$150 USD` por cada día adicional**.
3. **`(***)` Launch Overcharges (Cierre de Puerto)**:
   - **`+50% extra`** si la operación de lancha se realiza durante **cierre de puerto por mal tiempo**.
4. **`(****)` Overcharges en Feriados para Personal**:
   - **`+50% extra`** se aplicará en feriados públicos para **Coordinadores a Bordo** y **Amarradores (Linemen)**.
