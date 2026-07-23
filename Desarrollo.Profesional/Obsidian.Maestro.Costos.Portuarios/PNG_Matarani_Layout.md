# ⚓ MATARANI — Layout Exacto de la Experta (Tisur / PSA Marine / Transtotal)
> **Archivo Fuente**: `Matarani_Experta_2026.png` | **Terminal**: Tisur S.A. (Matarani) 🇵🇪
> **Operador Portuario**: Tisur | **Prácticos/Remolques**: PSA Marine | **Agente**: Trans Total
> **Tipo de Cambio de Referencia**: 3.42 S/ por USD

---

## 🚢 1. Parámetros de la Flota (Cabecera del Excel)

| Buque | Eslora (LOA) | Peso Muerto (DW) | Tonelaje Bruto (GRT) | Carga (MT) | Ritmo (T/h) | Horas Puerto | Origen | Total Liquidación |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BT MOQUEGUA** | `134.16m` | `14,298.00` | `8,259` | `13,500` | `500` | `33h` | Perú | **$15,364.50 USD** |
| **BT TABLONES** | `158.50m` | `18,335.00` | `11,365` | `14,500` | `500` | `34h` | Perú | **$17,028.73 USD** |
| **BT HUEMUL** | `161.42m` | `22,962.00` | `13,696` | `14,500` | `500` | `34h` | Perú | **$17,450.03 USD** |
| **CONCON TRADER** | `141.38m` | `19,823.15` | `11,773` | `14,500` | `500` | `33h` | Perú | **$15,964.17 USD** |

---

## 📊 2. Matriz Desglosada de Ítems Tarifarios

### A) Shifting Expenses (Gastos de Maniobras)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | **Pilot + Tug + Lancha (Servicio Integral)** | `$5,550.00` | 2 | `$11,100.00` | `$11,100.00` | `$11,100.00` | `$11,100.00` | Tarifa de servicio Integral PSA. Incluye Remolcaje, Practicaje, Lancha. |
| 2 | **TARIFA Con Descuento Addenda (39.31%)** | `$3,368.00` | 2 | `$6,736.00` | `$6,736.00` | `$6,736.00` | `$6,736.00` | Tarifa acordada Addenda Contrato PSA Marine Terminales A,B,C (hasta 31/12/2027). |
| 3 | **Recargo PSA Incremento Brent** | Brent Table | — | Indexado | Indexado | Indexado | Indexado | Recargo temporal indexado al precio del crudo Brent. |
| 4 | **Recargo Servicio Integral - 25%** | `$3,368.00` | 0.25 | `$842.00` | `$842.00` | `$842.00` | `$842.00` | Tarifa servicio integral PSA mín 25% máx 50%. |
| 5 | **Recargo Servicio Integral - 50%** | `$3,368.00` | 0.50 | `$1,684.00` | `$1,684.00` | `$1,684.00` | `$1,684.00` | Tarifa servicio integral PSA mín 25% máx 50%. |
| 6 | **Cargo de Acceso** | `$70.00` | 4 | `$280.00` | `$280.00` | `$280.00` | `$280.00` | Acceso $70.00 + IGV tarifa vigente hasta 31/12/2027. |
| 7 | **Linesmen (amarre y desamarre)** | `$357.30` | 1 | `$357.30` | `$357.30` | `$357.30` | `$357.30` | Tarifa fija Transtotal. |
| 8 | **Port toll / Land Transport / Terminal Fee** | `$75.00` | 2 | `$150.00` | `$150.00` | `$150.00` | `$150.00` | Tarifa fija Transtotal. |

### B) General Port Expenses (Gastos Generales Tisur)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 9 | **Lighthouse Dues (Puerto NACIONAL)** | `$0.03/GRT` | 1 | `$247.77` | `$340.95` | `$410.88` | `$353.19` | Dirección de Hidrografía y Navegación. |
| 10 | **Lighthouse Dues (Puerto EXTRANJERO)** | `$0.12/GRT` | — | *(No aplica)* | *(No aplica)* | *(No aplica)* | *(No aplica)* | No aplica si origen es Nacional (Ilo/Callao). |
| 11 | **Dockage Muellaje Tisur ($0.65*LOA*Hr)** | `$0.65/LOA/h` | Hrs | `$2,877.73` | `$3,502.85` | `$3,567.38` | `$3,127.62` | Tisur Tarifa $0.65 X Hora X Eslora (Terminal Tisur S.A.). |
| 12 | **Launch Authorities / Min 2 hrs** | `$155.00` | 2 | `$310.00` | `$310.00` | `$620.00` | `$620.00` | Transtotal Fija Mooring/Unmooring por lancha. |
| 13 | **Sanitary Inspection** | `$670.00` | 1 | `$670.00` | `$670.00` | `$670.00` | `$670.00` | Tarifa Región Moquegua / Arequipa. |
| 14 | **Clearance (In/Out)** | `$200.00` | 1 | `$200.00` | `$200.00` | `$200.00` | `$200.00` | Tarifa APN. |
| 15 | **Coordinator on board** | `$225.00` | 2 | `$450.00` | `$450.00` | `$450.00` | `$450.00` | USD$225 por día + 18% IGV. |

### C) Agency Expenses (Gastos de Agencia)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 16 | **Agency Fee** | `$1,100.00` | 1 | `$1,100.00` | `$1,100.00` | `$1,100.00` | `$1,100.00` | Tarifa fija Transtotal por Agenciamiento. |
| 17 | **Transportation** | `$200.00` | 1 | `$200.00` | `$200.00` | `$200.00` | `$200.00` | Tarifa fija Transtotal. |
| 18 | **Comunication** | `$250.00` | 1 | `$250.00` | `$250.00` | `$250.00` | `$250.00` | Tarifa fija Transtotal. |

---

## 🚨 3. Reglas de Recargo, Escala Brent y Descuentos Anuales por Volumen

> 📌 **REGLAS DE RECARGOS HORARIOS:**
> - **`25%`**: Lunes a Sábado entre **18:00 y 24:00 hrs**.
> - **`50%`**: Lunes a Sábado entre **00:00 y 07:00 hrs**, y todo el día **Domingos y Feriados**.

> 📈 **MATRIZ DE RECARGO INDEXADA AL PETRÓLEO BRENT (USD/Barril):**
> | Rango Brent (USD) | Recargo por Maniobra Remolcador | Recargo por Carnero (Pushing) | Recargo por Hora Maniobra |
> | :---: | :---: | :---: | :---: |
> | `$51 - $90` | `$0.00` | `$0.00` | `$0.00` |
> | `$91 - $100` | `+$67.00` | `+$65.00` | `+$15.00` |
> | `$101 - $110` | `+$144.00` | `+$108.00` | `+$20.00` |
> | `$111 - $120` | `+$203.00` | `+$152.00` | `+$25.00` |
> | `$121 - $130` | `+$260.00` | `+$195.00` | `+$30.00` |
> | `$131 - $140` | `+$317.00` | `+$238.00` | `+$35.00` |
> | `$141 - $150` | `+$375.00` | `+$281.00` | `+$40.00` |

> 📉 **DESCUENTOS VOLUMÉTRICOS ANUALES POR ESCALA:**
> - **Naves 13 a 18 en el año**: **`-6%`** sobre la tarifa por nave.
> - **Naves 19 en adelante**: **`-7.5%`** sobre la tarifa por nave.
