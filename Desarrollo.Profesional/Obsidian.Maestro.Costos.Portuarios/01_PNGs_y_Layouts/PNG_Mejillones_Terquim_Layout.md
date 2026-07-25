# 🇨🇱 TERMINAL TERQUIM (MEJILLONES) — Layout Exacto de la Experta (B&M / Ultratug / Terquim)

> **Archivo Fuente**: `Costos Portuarios - Terminal Terquim` (Excel de la Experta)
> **Puerto / Terminal**: Terminal Terquim (Mejillones) 🇨🇱
> **Proveedores**: B&M Agencia Marítima (Agencia), Ultratug Ltd. (Remolques), Amarradores en Tierra (Linesmen), Autoridad Marítima de Chile.
> **Moneda de Referencia**: USD $

---

## 🚢 1. Parámetros de la Flota (Cabecera del Excel)

| Buque | Eslora (LOA) | Peso Muerto (DWT) | Tonelaje Bruto (GRT) | Carga (MT) | Ritmo (T/h) | Horas Puerto | Origen | Total Liquidación |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BT MOQUEGUA** | `134.16m` | `14,298.00` | `8,259` | `13,500` | `520` | `30h` | Perú | **$49,313.06 USD** |
| **BT TABLONES** | `158.80m` | `18,533.00` | `11,365` | `13,500` | `520` | `30h` | Perú | **$58,423.88 USD** |
| **BT HUEMUL** | `161.12m` | `22,962.00` | `13,666` | `13,500` | `520` | `30h` | Perú | **$77,917.88 USD** |
| **CONCON TRADER** | `145.53m` | `19,823.15` | `11,773` | `13,500` | `520` | `30h` | Perú | **$72,144.81 USD** |

---

## 📊 2. Matriz Desglosada de Ítems Tarifarios

### A) Shifting Expenses (Gastos de Maniobras)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | **Pilotage (Based on GRT)** | `$0.14/GRT` | 1 | `$1,156.26` | `$1,591.10` | `$1,609.80` | `$1,540.77` | Tarifa fija según Autoridad Marítima. |
| 2 | **Towage (Remolcadores Ultratug)** | `$2,800.00` | 3 ó 4 | `$8,400.00` | `$11,200.00` | `$11,200.00` | `$11,200.00` | Tarifa Fija 2026 $2,800 maniobra mooring/unmooring. Remolcadores Ultratug Ltd. Vigencia al 31.12.2026. |
| 3 | **Pilot Insurance (Berthing/Unberthing)** | `$110.00` | 2 ó 3 | `$220.00` | `$220.00` | `$330.00` | `$330.00` | Tarifa Fija Puerto Mejillones. |
| 4 | **Linesmen / amarre y desamarre** | `$801.00` | 2 | `$1,602.00` | `$1,602.00` | `$1,602.00` | `$1,602.00` | Tarifa fija según Puerto Mejillones amarradores en tierra. |

### B) General Port Expenses (Gastos Generales Terquim Mejillones)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 5 | **Light Dues (Faro y Balisas Chile)** | `$4.07 o $1.60` | Anual/Viaje | `$2,240.94` | `$3,083.70` | `$21,865.60` | `$18,836.80` | LIGHT DUES CHILE = USD 4.07 x GRT por año (Prorrateado 15 viajes Moquegua/Tablones). USD 1.60 x GRT por viaje para Huemul y Concon. Vigencia 31.12.2026. |
| 6 | **Dockage / Muellaje ($5.72*LOA*TH)** | `$5.72/m/h` | 30h | `$23,021.86` | `$27,250.08` | `$27,648.19` | `$24,972.95` | 5.72 * LOA * TH (30 H) Puerto Mejillones terquim. |
| 7 | **Launch recepcion/amarre y desamarre** | `$450.00` | 4 | `$1,800.00` | `$1,800.00` | `$1,800.00` | `$1,800.00` | T.Fija Mooring (02 lanchas) / Unmooring (01 lancha) / Recepción por maniobra/por lancha. |
| 8 | **Launch embarcadero** | `$280 o $420` | 1 | `$280.00` | `$420.00` | `$420.00` | `$420.00` | T.Fija Mooring (02 lanchas) / Unmooring (01 lancha) / Recepción por maniobra/por lancha. |
| 9 | **Launch Anchorage** | `$390.00` | 1 | `$390.00` | `$390.00` | `$390.00` | `$390.00` | Por hora, si es requerida. |
| 10 | **Launch Inward/Outward clearances** | `$420.00` | 2 | `$840.00` | `$840.00` | `$840.00` | `$840.00` | Lanchas autoridades. |
| 11 | **Launch pier usage** | `$420.00` | 1 | `$420.00` | `$420.00` | `$420.00` | `$420.00` | Uso por muelle. |
| 12 | **Pilot Transport (amarre/desamarre)** | `$165.00` | 2 ó 3 | `$330.00` | `$495.00` | `$495.00` | `$495.00` | Tarifa fija según Puerto Mejillones. |
| 13 | **Authorities Transport (In/Out)** | `$650.00` | 1 | `$650.00` | `$650.00` | `$650.00` | `$650.00` | Transporte autoridades. |
| 14 | **ISPS Fee** | `$1,191.00` | 1 | `$1,191.00` | `$1,191.00` | `$1,191.00` | `$1,191.00` | Tarifa fija según Puerto Mejillones. |
| 15 | **Authorities Charges (Inward/Outward)** | `$700.00` | 1 ó 0 | `$700.00` | `$0.00` | `$0.00` | `$0.00` | Authorities clearance fee. |
| 16 | **Immigration Authorities** | `$28.00` | 1 | `$28.00` | `$28.00` | `$28.00` | `$28.00` | Tarifa fija según Policía de Investigaciones de Chile. |
| 17 | **Health authorities** | `$120.00` | 1 | `$120.00` | `$120.00` | `$120.00` | `$120.00` | Tarifa fija según Sanidad Marítima de Chile. |
| 18 | **Loading Master** | `$2923 o $3108` | 1 | `$2,923.00` | `$2,923.00` | `$3,108.29` | `$3,108.29` | Tarifa fija según Puerto Mejillones por nominación. |

### C) Agency Expenses (Gastos de Agencia)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 19 | **Agency Fee** | `$1,200.00` | 1 | `$1,200.00` | `$1,200.00` | `$1,200.00` | `$1,200.00` | Tarifa fija B&M por agenciamiento de nave. |
| 20 | **Hose connection/Portalon (Opcional)** | `$2500 o $3000` | 1 | `$2,500.00` | `$3,000.00` | `$3,000.00` | `$3,000.00` | Tarifa fija B&M conexión manguera / portalón. |

---

## 📌 NOTAS Y OBSERVACIONES DE LA EXPERTA

1. **MUELLAJE TERQUIM**: $5.72 x LOA x TH (30h) Puerto Mejillones Terquim.
2. **LIGHT DUES CHILE**: USD 4.07 x GRT por AÑO (Prorrateado a 15 viajes para MOQUEGUA y TABLONES). USD 1.60 x GRT por VIAJE para HUEMUL y CONCON TRADER.
3. **PROFORMAS B&M**: De acuerdo a proformas enviadas por B&M Agencia Marítima Chile.
