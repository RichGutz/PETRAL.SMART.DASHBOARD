# 🇨🇱 TERMINAL BARQUITO — Layout Exacto de la Experta (B&M / Ultratug / Codelco Barquito)

> **Archivo Fuente**: `Costos Portuarios - Terminal Barquito` (Excel de la Experta)
> **Puerto / Terminal**: Terminal Barquito (Chañaral, Atacama) 🇨🇱
> **Proveedores**: B&M Agencia Marítima (Agencia), Ultratug Ltd. (Remolques), SMPs Amarradores en Tierra (Linesmen), Autoridad Marítima de Chile.
> **Moneda de Referencia**: USD $

---

## 🚢 1. Parámetros de la Flota (Cabecera del Excel)

| Buque | Eslora (LOA) | Peso Muerto (DWT) | Tonelaje Bruto (GRT) | Carga (MT) | Ritmo (T/h) | Horas Puerto | Origen | Total Liquidación |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BT MOQUEGUA** | `134.16m` | `14,298.00` | `8,259` | `13,500` | `380` | `32h` | Perú | **$81,932.84 USD** |
| **BT TABLONES** | `158.80m` | `18,533.00` | `11,365` | `13,500` | `380` | `32h` | Perú | **$84,475.28 USD** |
| **BT HUEMUL** | `161.12m` | `22,962.00` | `13,666` | `13,500` | `380` | `40h` | Perú | **$108,731.45 USD** |
| **CONCON TRADER** | `145.53m` | `19,823.15` | `11,773` | `13,500` | `380` | `40h` | Perú | **$105,633.62 USD** |

---

## 📊 2. Matriz Desglosada de Ítems Tarifarios

### A) Shifting Expenses (Gastos de Maniobras)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | **Pilotage (Based on GRT)** | `$1.00` | 1 | `$1,151.01` | `$1,388.62` | `$1,609.80` | `$1,540.77` | Tarifa fija según Autoridad Marítima. |
| 2 | **Towage (amarre/desamarre)** | `$6,776.25` | 5 | `$33,881.25` | `$33,881.25` | `$33,881.25` | `$33,881.25` | Tarifa Ultratug (Tarifario Público) / Basado en 02 horas. Vigencia 31.12.2026. |
| 3 | **Pilot Insurance (Berthing/Unberthing)** | `$110.00` | 3 | `$330.00` | `$330.00` | `$330.00` | `$330.00` | Tarifa fija por 2 seguros de práctico $80.00 c/u + gastos. |
| 4 | **Linesmen amarre y desamarre** | `$1,500.00` | 2 | `$3,000.00` | `$3,000.00` | `$3,000.00` | `$3,000.00` | Tarifa fija según SMPs amarradores en tierra. Vigencia 31.12.2026. |
| 5 | **Port toll / Land transport / terminal fee** | `$90.00` | 1 | `$90.00` | `$90.00` | `$90.00` | `$90.00` | Embarking Access. |

### B) General Port Expenses (Gastos Generales Barquito)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 6 | **Light Dues (Faro y Balisas Chile)** | `$4.07 o $1.60` | Anual/Viaje | `$2,240.94` | `$4,465.06` | `$21,865.60` | `$18,836.80` | LIGHT DUES CHILE = USD 4.07 x GRT por año (Moquegua/Tablones). USD 1.60 x GRT por viaje para Huemul y Concon Trader. |
| 7 | **Dockage / Muellaje ($71.92*TH)** | `$71.92/h` | 32h/40h | `$2,301.44` | `$2,301.44` | `$2,876.80` | `$2,876.80` | USD 71.92 por hora (32h / 40h). Vigencia 31.12.2026. |
| 8 | **Launch amarre y desamarre** | `$720.00` | 4 | `$2,880.00` | `$2,880.00` | `$2,880.00` | `$2,880.00` | T.Fija Mooring (02 lanchas) / Unmooring (01 lancha) por maniobra/lancha. |
| 9 | **Launch Stand by** | `$110.00/h` | 32h/40h | `$3,520.00` | `$3,520.00` | `$4,400.00` | `$4,400.00` | Lancha Stand by en puerto como regularización local. Vigencia 31.12.2026. |
| 10 | **Launch Anchorage at roads** | `$420.00` | 1 | `$420.00` | `$420.00` | `$420.00` | `$420.00` | Por hora, si es requerida. |
| 11 | **Launch Inward/Outward clearances** | `$420.00` | 2 | `$840.00` | `$840.00` | `$840.00` | `$840.00` | Por hora, si es requerida. |
| 12 | **Pilot Transport (amarre/desamarre)** | `$165.00` | 2 | `$330.00` | `$330.00` | `$330.00` | `$330.00` | Tarifa fija según Puerto Mejillones / Barquito. Vigencia 31.12.2026. |
| 13 | **Linesmen transportation** | `$450.00` | 1 | `$450.00` | `$450.00` | `$450.00` | `$450.00` | Linesmen transportation In/Out. |
| 14 | **Tugboat stand by (en Puerto)** | `$650.00/h` | 32h/40h | `$20,800.00` | `$20,800.00` | `$26,000.00` | `$26,000.00` | Tarifa Ultratug (Concepto exigido por Autoridad Marítima) $650.00 por hora. Vigencia 31.12.2026. |
| 15 | **Tugboat Navigation** | `$750.00` | 6 | `$4,500.00` | `$4,500.00` | `$4,500.00` | `$4,500.00` | Navegación desde Caldera a Barquito (Segundo remolcador). Vigencia 31.12.2026. |
| 16 | **Authorities Transport (In/Out)** | `$750.00` | 1 | `$750.00` | `$750.00` | `$750.00` | `$750.00` | Tarifa fija según Sanidad Marítima / Autoridad. |
| 17 | **Authorities Charges (Inward/Outward)** | `$700.00` | 1 | `$700.00` | `$700.00` | `$700.00` | `$700.00` | Authorities clearance fee. |
| 18 | **Immigration Authorities** | `$28.00` | 1 | `$28.00` | `$28.00` | `$28.00` | `$28.00` | Tarifa fija según Policía de Investigaciones de Chile. |
| 19 | **Health authorities** | `$130.00` | 1 | `$130.00` | `$130.00` | `$130.00` | `$130.00` | Tarifa fija según Sanidad Marítima. |
| 20 | **Loading Master** | `$2,450.00` | 1 | `$2,450.00` | `$2,450.00` | `$2,450.00` | `$2,450.00` | Tarifa fija según Sanidad Marítima / Terminal Barquito. |

### C) Agency Expenses (Gastos de Agencia)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 21 | **Agency Fee** | `$1,200.00` | 1 | `$1,200.00` | `$1,200.00` | `$1,200.00` | `$1,200.00` | Tarifa fija B&M por agenciamiento de nave. |

---

## 📌 NOTAS Y OBSERVACIONES DE LA EXPERTA

1. **INCLUYE MUELLAJE Y REMOLCADOR STAND BY**: Costo refacturable a cliente Southern Perú según acuerdo.
2. **LIGHT DUES CHILE**: USD 4.07 x GRT por AÑO (Prorrateado en 15 viajes anuales referencia 2025 para Moquegua/Tablones). USD 1.60 x GRT por VIAJE para Huemul y Concon Trader.
3. **PROFORMAS B&M**: De acuerdo a proformas enviadas por B&M Agencia Marítima Chile.
