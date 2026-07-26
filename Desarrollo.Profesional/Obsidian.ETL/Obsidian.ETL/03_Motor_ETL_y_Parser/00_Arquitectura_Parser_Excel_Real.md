# ARQUITECTURA DEL MOTOR PARSER ETL (PYTHON EXTRACTOR)

> **Módulo:** ETL - Motor Parser de Exceles Reales  
> **Tecnología:** Python (pandas / openpyxl) & FastAPI Backend  

---

## 1. DISEÑO DEL PIPELINE DE EXTRACCIÓN

El motor ETL está concebido como una canalización (pipeline) de 4 fases para procesar los Exceles heterogéneos de liquidación:

```
┌─────────────────┐     ┌─────────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│ ARCHIVO EXCEL   │ ──► │ PARSER & NORMALIZAD.│ ──► │ REGLAS DE NEGOCIO  │ ──► │ TABLA SUPABASE   │
│ Liquidación     │     │ openpyxl / pandas   │     │ MGO=MDO / Validac. │     │ voyage_execution │
└─────────────────┘     └─────────────────────┘     └────────────────────┘     └──────────────────┘
```

---

## 2. REGLAS DE NORMALIZACIÓN EN EL PARSER

1. **Unificación de Nombres de Puerto:**
   - Estandariza variaciones de texto en los Exceles (ej. `"CALLAO - APM"`, `"PTO CALLAO"` $\rightarrow$ `CALLAO`).
2. **Homologación de Combustibles:**
   - Todo consumo de `MGO` se convierte automáticamente al tipo unificado `MDO`.
3. **Conversión de Moneda:**
   - Si un gasto de agencia figura en Soles Peruanos ($PEN$), aplica el tipo de cambio oficial del día de zarpe para almacenar el valor equivalente en Dólares ($USD$).
