# 📊 MATRIZ AUDITADA DE COSTOS E INGRESOS: 31 VIAJES REALES DE FLOTA (PETRAL ETL)

> **Proyecto**: PETRAL SMART DASHBOARD  
> **Módulo**: Obsidian ETL & Conciliación de Liquidaciones Reales  
> **Fuentes**: `VC Tablones 2026.PASS.THROUGH.xlsx` & `MOQUEGUA...PASS.THROUGH.xlsx`  
> **Fecha de Emisión**: 2026-07-31  

---

## 1. 📋 Resumen Consolidado de Costos e Ingresos por Viaje (31 Viajes Reales)

La siguiente tabla presenta el desglose auditado de los **31 viajes ejecutados** (16 para **B/T Moquegua** y 15 para **B/T Tablones**). Cada viaje incluye la refacturación de **Muellaje / Pass-Through Dockage**, gastos de puerto, costos de búnker y los resultados finales de Utilidad Neta Real ($P/L$) y $TCE$:

| # | Nave | Viaje | Cliente | Ruta | Ingreso Total (`I23`) | Items de Ingreso (Flete Base / Pass-Through / Paridad) | Gastos Puerto | Costo Búnker | Profit Real ($P/L$) | TCE ($/día) |
|:---:|:---|:---|:---|:---|:---:|:---|:---:|:---:|:---:|:---:|
| 1 | **MOQUEGUA** | `V.761 Matarani` | SPCC | ILO → MATARANI | $219,988.27 | SPCC V.761 ($197,159.69), Muellaje Matarani ($2,005.69), Reintegro ($20,822.89) | $51,598.84 | $12,171.37 | $112,558.13 | $46,514.84 |
| 2 | **MOQUEGUA** | `V.762 Marcona` | SPCC | ILO → MARCONA | $277,940.80 | SPCC V.762 ($277,940.80) | $49,676.32 | $28,639.96 | $130,700.38 | $37,651.81 |
| 3 | **MOQUEGUA** | `V.763 NEXA Marcona` | NEXA | ILO → CALLAO → MARCONA | $336,994.54 | NEXA V.763 ($330,756.10), Muellaje Callao ($6,238.44) | $47,519.54 | $47,084.66 | $146,220.96 | $32,765.88 |
| 4 | **MOQUEGUA** | `V.764-A Callao V.764 Marcona` | SPCC | ILO → CALLAO → MARCONA | $409,725.02 | SPCC V.764-A ($159,827.17), SPCC V.764 ($249,897.85) | $60,388.15 | $47,294.40 | $203,475.05 | $39,836.21 |
| 5 | **MOQUEGUA** | `V.765 Mejillones y Terquim` | SPCC | ILO → MEJILLONES → TERQUIM | $313,425.31 | SPCC V.765 ($267,591.35), SHIFTING ($18,000.00), Muellaje ($27,833.96) | $121,804.92 | $32,439.34 | $76,668.70 | $25,456.74 |
| 6 | **MOQUEGUA** | `V.766 Marcona` | SPCC | ILO → MARCONA | $294,240.65 | SPCC V.766 ($294,240.65) | $50,863.36 | $28,220.76 | $143,577.65 | $39,076.26 |
| 7 | **MOQUEGUA** | `V.767 Mejillones y Terquim` | SPCC | ILO → MEJILLONES → TERQUIM | $314,747.93 | SPCC V.767 ($267,145.16), SHIFTING ($18,000.00), Muellaje ($29,602.77) | $89,974.80 | $32,427.61 | $109,892.34 | $30,867.96 |
| 8 | **MOQUEGUA** | `V.768 Mejillones` | SPCC | ILO → MEJILLONES | $288,659.40 | SPCC V.768 ($267,836.29), Muellaje ($20,823.11) | $63,218.81 | $31,873.65 | $114,525.71 | $32,451.40 |
| 9 | **MOQUEGUA** | `V.769 Mejillones` | SPCC | ILO → MEJILLONES | $280,903.24 | SPCC V.769 ($267,243.33), Paridad ($-6,734.96), Muellaje ($20,394.87) | $64,465.68 | $31,858.07 | $108,116.90 | $31,381.79 |
| 10 | **MOQUEGUA** | `V.770 Marcona` | SPCC | ILO → MARCONA | $287,407.29 | SPCC V.770 ($294,157.11), Paridad ($-6,749.82) | $52,987.59 | $28,218.74 | $134,632.25 | $37,455.09 |
| 11 | **MOQUEGUA** | `V.771 Mejillones` | SPCC | ILO → MEJILLONES | $294,973.41 | SPCC V.771 ($281,373.16), Paridad ($-6,741.09), Muellaje ($20,341.34) | $63,312.62 | $43,500.53 | $109,165.41 | $31,552.23 |
| 12 | **MOQUEGUA** | `V.772 Matarani` | SPCC | ILO → MATARANI | $252,144.08 | SPCC V.772 ($255,820.52), Paridad ($-6,728.58), Muellaje ($3,052.14) | $32,278.84 | $18,526.73 | $148,421.30 | $49,462.18 |
| 13 | **MOQUEGUA** | `V.773 Marcona` | SPCC | ILO → MARCONA | $291,299.95 | SPCC V.773 ($297,825.49), Paridad ($-6,525.54) | $54,067.10 | $38,198.33 | $128,656.03 | $36,764.77 |
| 14 | **MOQUEGUA** | `V.774 NEXA Matarani` | NEXA | ILO → CALLAO → MATARANI | $414,451.46 | NEXA V.774 ($405,187.71), Muellaje Callao ($6,037.20), Muellaje Matarani ($3,226.55) | $28,583.03 | $60,813.85 | $232,342.92 | $45,579.05 |
| 15 | **MOQUEGUA** | `V.775 Mejillones` | SPCC | ILO → MEJILLONES | $293,533.99 | SPCC V.775 ($273,353.24), Muellaje ($20,180.75) | $68,146.76 | $43,227.53 | $104,175.87 | $30,941.41 |
| 16 | **MOQUEGUA** | `V.777 Marcona` | SPCC | ILO → MARCONA | $308,066.62 | SPCC V.777 ($308,066.62) | $57,000.00 | $38,520.21 | $140,977.14 | $38,607.40 |
| 17 | **TABLONES** | `v.038` | SPCC | ILO → MEJILLONES | $295,661.52 | SPCC ACIDO ($271,394.18), Muellaje Mejillones ($24,267.34) | $68,948.34 | $35,106.95 | $102,619.07 | $32,297.85 |
| 18 | **TABLONES** | `v.039` | SPCC | ILO → MEJILLONES | $301,288.84 | SPCC ACIDO ($274,677.13), Muellaje Mejillones ($26,611.71) | $72,024.81 | $35,206.39 | $104,566.63 | $32,526.90 |
| 19 | **TABLONES** | `v.040` | SPCC | ILO → MEJILLONES | $297,998.44 | SPCC ACIDO ($297,998.44) | $54,293.52 | $31,462.68 | $127,667.79 | $37,642.97 |
| 20 | **TABLONES** | `v.041` | SPCC | ILO → MATARANI | $239,795.20 | SPCC ACIDO ($235,654.01), Muellaje Matarani ($4,141.19) | $33,935.32 | $31,575.29 | $89,685.09 | $30,901.71 |
| 21 | **TABLONES** | `v.042` | SPCC | ILO → MEJILLONES | $300,554.50 | SPCC ACIDO ($274,918.50), Muellaje Mejillones ($25,636.00) | $67,855.28 | $35,213.70 | $107,957.47 | $33,087.76 |
| 22 | **TABLONES** | `v.043 2POD` | SPCC | ILO → MEJILLONES (TPM/TERQUIM) | $336,803.75 | SPCC ACIDO ($280,324.51), SHIFTING ($18,000.00), Muellaje TPM ($14,953.24), Terquim ($23,526.00) | $111,569.80 | $36,159.65 | $94,673.96 | $30,043.48 |
| 23 | **TABLONES** | `v.044 NEXA` | NEXA | CALLAO → MATARANI | $341,331.72 | NEXA ACIDO ($331,017.66), Muellaje Callao ($6,907.80), Muellaje Matarani ($3,406.26) | $29,862.21 | $48,442.55 | $156,038.85 | $36,877.04 |
| 24 | **TABLONES** | `v.045` | SPCC | ILO → MATARANI | $245,923.90 | SPCC ACIDO ($241,782.71), Muellaje Matarani ($4,141.19) | $34,674.67 | $30,913.56 | $94,262.42 | $31,427.13 |
| 25 | **TABLONES** | `v.046` | SPCC | ILO → MEJILLONES | $287,084.35 | SPCC ACIDO ($287,084.35) | $53,552.68 | $30,268.80 | $119,993.46 | $36,615.40 |
| 26 | **TABLONES** | `v.047` | SPCC | ILO → MEJILLONES | $278,694.99 | SPCC ACIDO ($285,149.25), Paridad ($-6,454.26) | $54,716.59 | $29,726.25 | $113,816.70 | $36,225.10 |
| 27 | **TABLONES** | `v.048` | SPCC | ILO → MEJILLONES | $296,647.66 | SPCC ACIDO ($273,449.19), Paridad ($-6,961.54), Muellaje Mejillones ($30,160.00) | $73,890.78 | $34,171.21 | $98,983.96 | $31,570.66 |
| 28 | **TABLONES** | `v.049` | SPCC | ILO → MEJILLONES | $301,213.55 | SPCC ACIDO ($275,902.54), Paridad ($-7,024.00), Muellaje Mejillones ($32,335.00) | $73,779.22 | $34,243.81 | $103,209.60 | $32,205.25 |
| 29 | **TABLONES** | `v.050` | SPCC | ILO → MEJILLONES | $300,717.40 | SPCC ACIDO ($307,453.91), Paridad ($-6,736.50) | $53,918.28 | $41,055.45 | $123,594.62 | $37,567.75 |
| 30 | **TABLONES** | `v.051` | SPCC | ILO → MEJILLONES | $314,130.48 | SPCC ACIDO ($295,035.75), Paridad ($-7,136.81), Muellaje Mejillones ($26,231.54) | $72,895.61 | $46,957.61 | $103,611.40 | $32,141.74 |
| 31 | **TABLONES** | `v.052` | SPCC | ILO → MEJILLONES | $325,307.53 | SPCC ACIDO ($298,089.20), Paridad ($-7,210.67), Muellaje Mejillones ($34,429.00) | $74,808.38 | $47,074.89 | $112,309.95 | $33,489.40 |

---

## 2. 💡 Notas de Auditoría Rápidas para Cotejo Manual

- **Formula de Verificación de Ingreso (`I23`):**  
  $$\text{Ingreso Total (I23)} = \text{Flete Base} + \text{Muellaje Pass-through} + \text{Shifting} + \text{Ajuste Paridad}$$
- **Formula de Verificación de Profit Real ($P/L$):**  
  $$\text{Profit Real (P/L)} = \text{Ingreso Total (I23)} - \text{Gastos Puerto} - \text{Costo Búnker} - \text{Costo OPEX}$$
