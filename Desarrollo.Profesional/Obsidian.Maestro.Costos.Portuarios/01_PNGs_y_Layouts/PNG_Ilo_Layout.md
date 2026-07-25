# ⚓ ILO — Layout Exacto de la Experta (SPCC / Port Operations / PSA Marine / Petranso)
> **Archivo Fuente**: `Ilo_Experta_2026.png` | **Puerto / Terminal**: ILO (Muelle SPCC / Enapu) 🇵🇪
> **Proveedores**: Port Operations (Practicaje), PSA Marine / Petranso (Remolques), Trans Total (Agencia)
> **Tipo de Cambio de Referencia**: 3.42 S/ por USD

---

## 🚢 1. Parámetros de la Flota (Cabecera del Excel)

| Buque | Eslora (LOA) | Peso Muerto (DW) | Tonelaje Bruto (GRT) | Carga (MT) | Ritmo (T/h) | Horas Puerto | Origen | Total Liquidación |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **BT MOQUEGUA** | `134.16m` | `14,298.00` | `8,259` | `13,500` | `500` | `37h` | Perú | **$21,797.39 USD** |
| **BT TABLONES** | `158.50m` | `18,335.00` | `11,365` | `14,500` | `500` | `39h` | Perú | **$24,011.59 USD** |
| **BT HUEMUL** | `161.42m` | `22,962.00` | `13,696` | `14,500` | `500` | `37h` | Perú | **$26,542.60 USD** |
| **CONCON TRADER** | `141.38m` | `19,823.15` | `11,773` | `14,500` | `500` | `37h` | Perú | **$24,493.30 USD** |

---

## 📊 2. Matriz Desglosada de Ítems Tarifarios

### A) Shifting Expenses (Gastos de Maniobras)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 | **Practicaje (Port Operations)** | `$1,500.00` | 2 | `$3,000.00` | `$3,000.00` | `$3,000.00` | `$3,000.00` | Tarifa Port Operations $1,500 por maniobra. |
| 2 | **Linesmen / amarre y desamarre** | `$170.00` | 4 | `$680.00` | `$680.00` | `$680.00` | `$680.00` | Tarifa fija Transtotal vigente hasta 31/12/2027. |
| 3 | **Dockage / Muellaje SPCC** | `$0.05/GRT/día` | 2d | `$825.90` | `$1,136.50` | `$1,369.60` | `$1,177.30` | SPCC, Tarifa de Amarre/Desamarre $300 + Muelle SPCC $0.05 x GRT x día. |
| 4 | **Remolcaje PSA Marine ($0.16*GRT*Mnvr*Tug)** | `$0.16/GRT` | 2 | `$3,600.00` | `$3,636.80` | `$4,382.72` | `$3,767.36` | Tarifa PSA $0.16 x GRT x remolcador (2 in/out). Mínimo $1,800.00 por maniobra (BT Moquegua aplica tarifa mínima). |
| 5 | **Remolcaje Posicionamiento - PSA MARINE** | `$700.00` | 2 | `$1,400.00` | `$1,400.00` | `$1,400.00` | `$1,400.00` | PSA MARINE posicionamiento $1,400 ($700 x 2). |
| 6 | **Remolcaje PETRANSO ($0.18*GRT*Mnvr*Tug)** | `$0.18/GRT` | 2 | `$2,973.24` | `$4,091.40` | `$4,919.76` | `$4,238.28` | Tarifa PETRANSO $0.18 x GRT x remolcador (2) sujeta a 10% descuento. |
| 7 | **Remolcaje Posicionamiento - PETRANSO** | `$630.00` | 2 | `$1,260.00` | `$1,260.00` | `$1,260.00` | `$1,260.00` | Posicionamiento $1,400 sujeto a 10% descuento ($630 x 2). |
| 8 | **Port toll / Land transport ($75*mnvr)** | `$75.00` | 2 | `$150.00` | `$150.00` | `$150.00` | `$150.00` | Tarifa fija Transtotal. |
| 9 | **Recargos Overtime Remolcaje PSA Marine** | 25% | 1 | `$900.00` | `$909.20` | `$1,095.68` | `$941.84` | Lun-Sáb (18:00-00:00: 15%; 00:00-07:00: 25%; Dom/Feriados: 25%). |
| 10 | **Recargos Overtime Remolcaje Petranso** | 25% | 1 | `$743.31` | `$1,022.85` | `$1,229.94` | `$1,059.57` | Lun-Sáb (18:00-24:00: 25%; 00:00-07:00: 25%; Dom/Feriados: 25%). |

### B) General Port Expenses (Gastos Generales)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 11 | **Lighthouse Dues (Puerto NACIONAL)** | `$0.03/GRT` | 1 | `$247.77` | `$340.95` | `$410.88` | `$353.19` | Tarifa Dirección de Hidrografía y Navegación. |
| 12 | **Lighthouse Dues (Puerto EXTRANJERO)** | `$0.12/GRT` | — | *(No aplica)* | *(No aplica)* | *(No aplica)* | *(No aplica)* | No aplica si origen es Nacional. |
| 13 | **Coordinator on board** | `$200.00` | 2 | `$400.00` | `$400.00` | `$400.00` | `$400.00` | Tarifa fija Transtotal por Nave/Turno x día. |
| 14 | **Sanitary Inspection** | `$520.00` | 1 | `$520.00` | `$520.00` | `$520.00` | `$520.00` | Tarifa fija según Sanidad Marítima (S/ 1,254.00). |
| 15 | **Lancha Autoridades / Práctico (Min 4h)** | `$90.00/h` | 4 | `$360.00` | `$360.00` | `$360.00` | `$360.00` | Lanchas de transporte. |
| 16 | **Lancha Coordinador (Min 4h)** | `$85.00/h` | 4 | `$340.00` | `$340.00` | `$340.00` | `$340.00` | Lanchas de transporte. |
| 17 | **Lancha Amarre/Desamarre (2in/2out)** | `$375.00` | 4 | `$1,500.00` | `$1,500.00` | `$1,500.00` | `$1,500.00` | Lanchas de transporte por maniobra. |
| 18 | **Lancha Posicionamiento** | `$100.00` | 4 | `$400.00` | `$400.00` | `$400.00` | `$400.00` | Lanchas de transporte. |
| 19 | **Clearance (In/Out)** | `$200.00` | 1 | `$200.00` | `$200.00` | `$200.00` | `$200.00` | Tarifa fija Sanidad / Autoridad. |

### C) Agency Expenses (Gastos de Agencia)

| # | Concepto / Ítem | Tarifa Base | QTY | Moquegua | Tablones | Huemul | Concon Trader | Observaciones de la Experta |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 20 | **Agency Fee** | `$900.00` | 1 | `$900.00` | `$900.00` | `$900.00` | `$900.00` | Tarifa fija Transtotal por agenciamiento. |
| 21 | **Transportation** | `$200.00` | 1 | `$200.00` | `$200.00` | `$200.00` | `$200.00` | Tarifa fija Transtotal. |
| 22 | **Comunication** | `$200.00` | 1 | `$200.00` | `$200.00` | `$200.00` | `$200.00` | Tarifa fija Transtotal. |
