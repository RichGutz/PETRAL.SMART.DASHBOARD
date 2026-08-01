# 📑 ACTUALIZACIÓN ETL: REFACTURACIÓN PASS-THROUGH DOCKAGE Y AUDITORÍA DE 31 VIAJES REALES

> **Proyecto**: PETRAL SMART DASHBOARD  
> **Módulo**: Obsidian ETL & Conciliación de Liquidaciones Reales  
> **Estado**: COMPLETADO & VERIFICADO EN SUPABASE  
> **Fecha de Actualización**: 2026-07-31  

---

## 1. 🔍 Contexto del Problema Operativo (Pass-Through Dockage)

En las liquidaciones iniciales de viaje entregadas por las naves **B/T Tablones** y **B/T Moquegua**, los operadores registraban el **Dockage (muellaje / tarifa de atraque)** únicamente como gasto de puerto. 

Al ser el Dockage un concepto **pass-through** (gasto reembolsable que se refactura al cliente/charterer), los costos de puerto aparecían sobreestimados sin su correspondiente contrapartida de ingreso, generando una distorsión a la baja en la Utilidad Neta ($P/L$) y en el $TCE$ ejecutado.

---

## 2. 🛠️ Solución Implementada: Plantillas `PASS.THROUGH.xlsx`

Se incorporaron las plantillas actualizadas:
- **B/T Tablones (Operador JN):** `VC Tablones 2026.PASS.THROUGH.xlsx`
- **B/T Moquegua (Operador MEC):** `MOQUEGUA - Voyage calculation viajes Enero a Junio  2026  - 31.07.2026.PASS.THROUGH.xlsx`

### 📊 Mapeo Granular de Celdas de Ingreso:
- **Conceptos (`B15:B22`):** Nombres de items de flete (Flete Base, Muellaje Refacturado/Pass-through, Shifting, Paridad de Flete, Reintegros).
- **Montos USD (`I15:I22`):** Valores positivos (ingresos/reembolsos) y negativos (descuentos/penalidades).
- **Total Freight Income (`I23`):** Suma consolidada de los items de ingreso.

---

## 3. ⚙️ Adaptación del Motor Extractor y Base de Datos

En [etl_parser_liquidations.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/etl_parser_liquidations.py) y [push_to_supabase.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/push_to_supabase.py):

1. **Objeto JSONB `details.income.freight_income_items`:**
   ```json
   "income": {
     "charterer": "NEXA",
     "freight_rate_usd": 24.50,
     "quantity_mt": 13500.25,
     "gross_revenue_usd": 330756.10,
     "total_freight_income_usd": 330756.10,
     "freight_income_items": [
       { "concept": "Flete Base", "amount_usd": 324517.66 },
       { "concept": "Muellaje Callao (Refacturación Pass-through)", "amount_usd": 6238.44 }
     ]
   }
   ```
2. **Normalización de Nombres de Viaje:**
   Limpieza de sufijos temporales como `(2)` (ej. `v.038 (2)` $\rightarrow$ `v.038`).

---

## 4. 🔬 Auditoría Final de Viajes Reales (Conteo Exacto de 31 Viajes)

Se ejecutó la limpieza y carga completa sobre la tabla `voyage_liquidations` de Supabase DB:

- **B/T Tablones (15 viajes reales):** `v.038`, `v.039`, `v.040`, `v.041`, `v.042`, `v.043 2POD`, `v.044 NEXA`, `v.045`, `v.046`, `v.047`, `v.048`, `v.049`, `v.050`, `v.051`, `v.052`.
- **B/T Moquegua (16 viajes reales):** `V.761 Matarani`, `V.762 Marcona`, `V.763 NEXA Marcona`, `V.764-A Callao V.764 Marcona`, `V.765 Mejillones y Terquim`, `V.766 Marcona`, `V.767 Mejillones y Terquim`, `V.768 Mejillones`, `V.769 Mejillones`, `V.770 Marcona`, `V.771 Mejillones`, `V.772 Matarani`, `V.773 Marcona`, `V.774 NEXA Matarani`, `V.775 Mejillones`, `V.777 Marcona`.
- **Total en Supabase:** **31 VIAJES REALES CONSOLIDADOS**.

*(Nota: Las 21 pestañas adicionales presentes en el Excel de Moquegua corresponden a escenarios de simulación comercial y se ignoran en el conteo de ejecuciones reales).*
