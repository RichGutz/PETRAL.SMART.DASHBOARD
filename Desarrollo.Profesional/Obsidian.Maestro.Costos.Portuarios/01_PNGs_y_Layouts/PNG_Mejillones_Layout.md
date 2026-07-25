# 🇨🇱 PUERTO TPM MEJILLONES — Layout Exacto de la Experta (B&M / Ultratug / TPM)

> **Archivo Fuente**: `Costos Portuarios - Puerto TPM Mejillones` (Excel de la Experta)
> **Puerto / Terminal**: Puerto TPM Mejillones (Terminal Puerto Mejillones S.A.) 🇨🇱
> **Proveedores**: B&M Agencia Marítima (Agencia), Ultratug Ltd. (Remolques), Amarradores en Tierra (Linesmen), Autoridad Marítima de Chile.
> **Moneda de Referencia**: USD $

---

## 🚢 1. Parámetros de la Flota (Cabecera del Excel)

| Buque | Eslora (LOA) | Peso Muerto (DWT) | Tonelaje Bruto (GRT) | Carga (MT) | Ritmo (T/h) | Horas Puerto | Origen | Total Liquidación |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BT MOQUEGUA** | `134.16m` | `14,298.00` | `8,259` | `13,500` | `420` | `36h` | Perú | **$46,807.88 USD** |
| **BT TABLONES** | `158.80m` | `18,533.00` | `11,365` | `13,500` | `420` | `36h` | Perú | **$50,873.66 USD** |
| **BT HUEMUL** | `161.12m` | `22,962.00` | `13,666` | `13,500` | `420` | `36h` | Perú | **$69,677.50 USD** |
| **CONCON TRADER** | `145.53m` | `19,823.15` | `11,773` | `13,500` | `420` | `36h` | Perú | **$64,340.32 USD** |

---

## 📊 2. Matriz Desglosada de Ítems Tarifarios

### A) Shifting Expenses (Gastos de Maniobras)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | **Pilotage (Based on GRT)** | `$0.15` | 1 | `$1,207.38` | `$1,591.10` | `$1,609.80` | `$1,540.77` | Tarifa fija según Autoridad Marítima. |
| 2 | **Towage (Remolcadores Ultratug)** | `$2,800.00` | 4 | `$11,200.00` | `$11,200.00` | `$11,200.00` | `$11,200.00` | Tarifa Fija 2026 $2,800 maniobra mooring/unmooring. Remolcadores Ultratug Ltd. Vigencia 31.12.2026. |
| 3 | **Linesmen / amarre y desamarre** | `$871.25` | 2 | `$1,742.50` | `$1,742.50` | `$1,742.50` | `$1,742.50` | Tarifa fija según Puerto Mejillones amarradores en tierra. |

### B) General Port Expenses (Gastos Generales TPM Mejillones)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 4 | **Light Dues (Faro y Balisas Chile)** | `$4.07 o $1.60` | Anual/Viaje | `$2,240.94` | `$3,083.70` | `$21,865.60` | `$18,836.80` | LIGHT DUES CHILE = USD 4.07 x GRT por año (Prorrateado 15 viajes Moquegua/Tablones). USD 1.60 x GRT por viaje para Huemul y Concon. |
| 5 | **Dockage / Muellaje ($3.99*LOA*Hr)** | `$3.99/m/h` | 36h | `$19,270.74` | `$22,810.03` | `$23,143.28` | `$20,903.93` | 3.99 * LOA * 36h Puerto TPM Mejillones. |
| 6 | **Launch Anchorage** | `$390.00` | 1 | `$390.00` | `$390.00` | `$390.00` | `$390.00` | Por hora, si es requerida. |
| 7 | **Launch pier usage** | `$272.57` | 1 | `$272.57` | `$272.57` | `$272.57` | `$272.57` | Uso por muelle. |
| 8 | **Launch recepcion/amarre y desamarre** | `$450.00` | 4 | `$1,800.00` | `$1,800.00` | `$1,800.00` | `$1,800.00` | T.Fija Mooring (02 lanchas) / Unmooring (01 lancha) por maniobra/lancha. |
| 9 | **Launch Inward/Outward clearances** | `$420.00` | 1 ó 2 | `$420.00` | `$420.00` | `$840.00` | `$840.00` | T.Fija B&M. |
| 10 | **Pilot Transport (amarre/desamarre)** | `$140.00` | 2, 4 ó 3 | `$280.00` | `$560.00` | `$420.00` | `$420.00` | Tarifa fija según Puerto Mejillones. |
| 11 | **Pilot Insurance (Berthing/Unberthing)** | `$110.00` | 3 ó 0 | `$330.00` | `$330.00` | `$0.00` | `$0.00` | Tarifa fija según Puerto Mejillones. |
| 12 | **Authorities Transport (In/Out)** | `$650.00` | 1 | `$650.00` | `$650.00` | `$650.00` | `$650.00` | T.Fija B&M. |
| 13 | **Authorities Charges (Inward/Outward)** | `$700.00` | 1 ó 0 | `$700.00` | `$0.00` | `$0.00` | `$0.00` | Authorities clearance fee. |
| 14 | **ISPS Fee** | `$1,140.35` | 1 | `$1,140.35` | `$1,140.35` | `$1,140.35` | `$1,140.35` | Tarifa fija según Puerto Mejillones. |
| 15 | **Immigration Authorities** | `$29.00` | 1 | `$29.00` | `$29.00` | `$29.00` | `$29.00` | Tarifa fija según Policía de Investigaciones de Chile. |
| 16 | **Health authorities** | `$110.00` | 1 | `$110.00` | `$110.00` | `$110.00` | `$110.00` | Tarifa fija según Sanidad Marítima de Chile. |
| 17 | **Loading Master** | `$3,264.40` | 1 | `$3,264.40` | `$3,264.40` | `$3,264.40` | `$3,264.40` | Tarifa fija según Puerto Mejillones ($62 x 36h + fees). |

### C) Agency Expenses (Gastos de Agencia)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 18 | **Agency Fee** | `$1,200.00` | 1 | `$1,200.00` | `$1,200.00` | `$1,200.00` | `$1,200.00` | Tarifa fija B&M por agenciamiento de nave. |

---

## 📌 TOTALES DE LIQUIDACIÓN EXPERTA
- **BT MOQUEGUA**: **`$46,807.88 USD`**
- **BT TABLONES**: **`$50,873.66 USD`**
- **BT HUEMUL**: **`$69,677.50 USD`**
- **CONCON TRADER**: **`$64,340.32 USD`**
