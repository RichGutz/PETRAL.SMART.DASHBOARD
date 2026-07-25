# 🇨🇱 TERMINAL INTERACID (MEJILLONES) — Layout Exacto de la Experta (B&M / Ultratug / Interacid)

> **Archivo Fuente**: `Costos Portuarios - Terminal Interacid` (Excel de la Experta)
> **Puerto / Terminal**: Terminal Interacid (Mejillones) 🇨🇱
> **Proveedores**: B&M Agencia Marítima (Agencia), Ultratug Ltd. (Remolques), Amarradores en Tierra (Linesmen), Autoridad Marítima de Chile.
> **Moneda de Referencia**: USD $

---

## 🚢 1. Parámetros de la Flota (Cabecera del Excel)

| Buque | Eslora (LOA) | Peso Muerto (DWT) | Tonelaje Bruto (GRT) | Carga (MT) | Ritmo (T/h) | Horas Puerto | Origen | Total Liquidación |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BT MOQUEGUA** | `134.16m` | `14,298.00` | `8,259` | `13,500` | `420` | `36h` | Perú | **$51,343.45 USD** |
| **BT TABLONES** | `158.80m` | `18,533.00` | `11,365` | `13,500` | `420` | `36h` | Perú | **$54,498.30 USD** |
| **BT HUEMUL** | `161.12m` | `22,962.00` | `13,666` | `13,500` | `420` | `36h` | Perú | **$73,588.90 USD** |
| **CONCON TRADER** | `145.53m` | `19,823.15` | `11,773` | `13,500` | `420` | `36h` | Perú | **$71,341.07 USD** |

---

## 📊 2. Matriz Desglosada de Ítems Tarifarios

### A) Shifting Expenses (Gastos de Maniobras)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | **Pilotage (Based on GRT)** | `$0.14/GRT` | 1 | `$1,151.01` | `$1,591.10` | `$1,609.80` | `$1,540.77` | Tarifa fija según Autoridad Marítima. |
| 2 | **Towage (Remolcadores Ultratug)** | `$2,800.00` | 4 | `$11,200.00` | `$11,200.00` | `$11,200.00` | `$11,200.00` | Tarifa Fija 2026 $2,800 maniobra mooring/unmooring. Remolcadores Ultratug Ltd. Vigencia al 31.12.2026. |
| 3 | **Pilot Insurance (Berthing/Unberthing)** | `$110.00` | 3 | `$330.00` | `$330.00` | `$330.00` | `$330.00` | Tarifa Fija Puerto Mejillones. |
| 4 | **Linesmen / amarre y desamarre** | `$871.25` | 2 | `$1,742.50` | `$1,742.50` | `$1,742.50` | `$1,742.50` | Tarifa fija según Puerto Mejillones amarradores en tierra. |

### B) General Port Expenses (Gastos Generales Interacid Mejillones)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 5 | **Light Dues (Faro y Balisas Chile)** | `$4.07 o $1.60` | Anual/Viaje | `$2,240.94` | `$3,083.70` | `$21,865.60` | `$18,836.80` | LIGHT DUES CHILE = USD 4.07 x GRT por año (Prorrateado 15 viajes Moquegua/Tablones). USD 1.60 x GRT por viaje para Huemul y Concon. Vigencia 31.12.2026. |
| 6 | **Dockage / Muellaje Interacid** | `$702/h ó $754/h` | 36h | `$25,272.00` | `$27,144.00` | `$27,144.00` | `$27,144.00` | USD 702 * H (36h) para BT MOQUEGUA; USD 754 * H (36h) para Tablones, Huemul y Concon Trader. |
| 7 | **Launch Anchorage** | `$390.00` | 1 | `$390.00` | `$390.00` | `$390.00` | `$390.00` | Por hora, si es requerida. |
| 8 | **Launch pier usage** | `$420.00` | 1 | `$420.00` | `$420.00` | `$420.00` | `$420.00` | Uso por muelle. |
| 9 | **Launch recepcion/amarre y desamarre** | `$450.00` | 4 | `$1,800.00` | `$1,800.00` | `$1,800.00` | `$1,800.00` | T.Fija Mooring (02 lanchas) / Unmooring (01 lancha) / Recepción por maniobra/por lancha. |
| 10 | **Launch embarcadero** | `$280.00` | 1 | `$280.00` | `$280.00` | `$280.00` | `$280.00` | T.Fija Mooring (02 lanchas) / Unmooring (01 lancha) / Recepción por maniobra/por lancha. |
| 11 | **Launch Inward/Outward clearances** | `$420.00` | 0 ó 2 | `$0.00` | `$0.00` | `$0.00` | `$840.00` | Lancha tramitación autoridades. |
| 12 | **Pilot Transport (amarre/desamarre)** | `$150.00` | 1 ó 3 | `$150.00` | `$150.00` | `$450.00` | `$450.00` | Tarifa fija según Puerto Mejillones. |
| 13 | **Authorities Transport (In/Out)** | `$650.00` | 1 | `$650.00` | `$650.00` | `$650.00` | `$650.00` | Transporte autoridades. |
| 14 | **Authorities Charges (Inward/Outward)** | `$700.00` | 1 ó 0 | `$700.00` | `$0.00` | `$0.00` | `$0.00` | Authorities clearance fee. |
| 15 | **ISPS Fee** | `$1,273.00` | 1 | `$1,273.00` | `$1,273.00` | `$1,273.00` | `$1,273.00` | Tarifa fija según Puerto Mejillones. |
| 16 | **Immigration Authorities** | `$28.00` | 1 | `$28.00` | `$28.00` | `$28.00` | `$28.00` | Tarifa fija según Policía de Investigaciones de Chile. |
| 17 | **Health authorities** | `$120.00` | 1 | `$120.00` | `$120.00` | `$120.00` | `$120.00` | Tarifa fija según Sanidad Marítima de Chile. |
| 18 | **Loading Master ($86.00 * Hr)** | `$86.00/h` | 36h | `$3,096.00` | `$3,096.00` | `$3,096.00` | `$3,096.00` | Tarifa fija según Puerto Mejillones ($86 x 36h). |

### C) Agency Expenses (Gastos de Agencia)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 19 | **Agency Fee** | `$1,200.00` | 1 | `$1,200.00` | `$1,200.00` | `$1,200.00` | `$1,200.00` | Tarifa fija B&M por agenciamiento de nave. |

---

## 📌 NOTAS Y OBSERVACIONES DE LA EXPERTA

1. **MUELLAJE INTERACID**: USD 702 x Hora (36 hrs) para BT MOQUEGUA = $25,272.00 USD. USD 754 x Hora (36 hrs) para BT TABLONES, BT HUEMUL y CONCON TRADER = $27,144.00 USD.
2. **LIGHT DUES CHILE**: USD 4.07 x GRT por AÑO (Prorrateado a 15 viajes para MOQUEGUA y TABLONES). USD 1.60 x GRT por VIAJE para HUEMUL y CONCON TRADER.
3. **PROFORMAS B&M**: De acuerdo a proformas enviadas por B&M Agencia Marítima Chile.
