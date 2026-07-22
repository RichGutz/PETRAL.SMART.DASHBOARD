# 📊 ESPECIFICACIÓN TÉCNICA Y QC: MATRIZ FINANCIERA CONSOLIDADA PETRAL & GEEKSOFT ENGINE

> **Estado**: 100% OPERATIVO & VALIDADO CON EL ACTA PDF  
> **Script de QC Matriz**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\run_qc_matriz_financiera.py`  
> **Consistencia de Datos**: 100% Coincidente con `ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf`  
> **Responsable**: AntiGravity AI Engine & Equipo Técnico PETRAL  

---

## 1. 📌 Propósito de la Matriz Financiera Consolidada

La **Matriz Financiera** consolida los resultados económico-operativos globales de todas las rutas comerciales oficiales de los clientes **NEXA** y **SPCC** evaluadas para el buque `MOQUEGUA`.

Los valores de esta matriz se extraen con precisión matemática del motor **GEEKSOFT ENGINE** y coinciden al 100% con los datos auditados en el informe PDF oficial `ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf`.

---

## 2. 📊 Matriz Financiera Consolidada Definitiva (SPCC & NEXA)

| Cliente | Nombre de Ruta | Piernas | Distancia (NM) | Días Mar | Días Puerto | Días Totales | Costo Búnker (USD) | Costos Puerto (USD) | Ingreso Flete (USD) | PnL Neto (USD) | TCE Real (USD/Día) | Estado QC |
| :--- | :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **NEXA** | `NEXA.ILO.CALLAO.MEJILLONES.ILO` | 3 | 1,632.0 | 6.49d | 3.31d | 9.80d | $92,192.11 | $81,327.99 | $375,000.00 | $201,479.90 | $20,552.02/d | `✅ PASSED` |
| **NEXA** | `NEXA.ILO.CALLAO.MATARANI.ILO` | 3 | 1,040.0 | 4.06d | 3.03d | 7.09d | $60,720.26 | $48,327.99 | $405,000.00 | $295,951.75 | $41,749.05/d | `✅ PASSED` |
| **SPCC** | `SPCC.ILO.MATARANI` | 1 | 69.0 | 0.27d | 3.03d | 3.30d | $13,310.05 | $32,000.00 | $344,250.00 | $298,939.95 | $90,432.16/d | `✅ PASSED` |
| **SPCC** | `SPCC.ILO.MARCONA` | 1 | 279.0 | 1.11d | 3.03d | 4.14d | $23,777.09 | $55,000.00 | $344,250.00 | $265,472.91 | $64,109.81/d | `✅ PASSED` |
| **SPCC** | `SPCC.ILO.MEJILLONES` | 1 | 335.0 | 1.33d | 3.03d | 4.36d | $26,568.30 | $65,000.00 | $344,250.00 | $252,681.70 | $57,906.22/d | `✅ PASSED` |
| **NEXA** | `NEXA.ILO.CALLAO.MARCONA.ILO` | 3 | 1,051.0 | 4.10d | 3.30d | 7.40d | $62,233.73 | $71,327.99 | $344,250.00 | $210,688.28 | $28,480.65/d | `✅ PASSED` |

---

## 3. 🧮 Fórmulas de Consolidación Financiera y Operativa

Cada métrica de la Matriz Financiera se deriva directamente de la suma y cálculo de las piernas del viaje:

1. **Distancia Total ($NM$)**: $\sum \text{Distancia Piernas}$
2. **Días de Mar Totales ($d$)**: $\sum \frac{\text{Distancia Pierna} \times (1 + WF)}{\text{Velocidad} \times 24h}$
3. **Días de Puerto Totales ($d$)**: $\sum \left( \frac{Q}{\text{Ritmo Carga} \times 24} + \frac{Q}{\text{Ritmo Descarga} \times 24} + \text{Overheads} \right)$
4. **Costo Búnker Total ($USD$)**: $(\text{Total IFO Tons} \times \$895.14) + (\text{Total MDO Tons} \times \$1,460.30)$
5. **Costos Portuarios Totales ($USD$)**: $\sum (\text{Agencia Origen} + \text{Agencia Destino})$
6. **Ingreso Flete Total ($USD$)**: $\sum (Q \times F)$
7. **PnL Neto ($USD$)**: $\text{Ingreso Flete} - \text{Comisiones} - \text{Costo Búnker} - \text{Costos Puerto}$
8. **TCE Real ($USD/Día$)**: $\frac{\text{PnL Neto}}{\text{Días Totales Viaje}}$

---

## 4. ⚙️ Script Autónomo de Ejecución QC (`run_qc_matriz_financiera.py`)

Para ejecutar la verificación continua de la Matriz Financiera en la terminal local:

```bash
python Desarrollo.Profesional/Geeksoft_Engine/run_qc_matriz_financiera.py
```

El script consulta Supabase, ejecuta las simulaciones para el buque `MOQUEGUA` e imprime la matriz consolidada verificando la tasa de éxito al 100%.

---

## 5. 📜 Evidencia de Ejecución Autónoma del QC Loop (Registro de Log)

```text
==============================================================================================================
📊 [QC MATRIZ FINANCIERA] CALCULANDO MATRIZ FINANCIERA CONSOLIDADA DE RUTAS SPCC Y NEXA
==============================================================================================================

CLIENTE  │ NOMBRE RUTA                      │ DIST (NM)  │ DÍAS MAR  │ DÍAS PTO  │ BÚNKER ($)   │ PUERTOS ($)  │ FLETE ($)    │ PNL NETO ($) │ TCE ($/d)   
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
NEXA     │ NEXA.ILO.CALLAO.MEJILLONES.ILO   │ 1632.0     │ 6.49      │ 3.31      │ 92,192.11    │ 81,327.99    │ 375,000.00   │ 201,479.90   │ 20,552.02   
NEXA     │ NEXA.ILO.CALLAO.MATARANI.ILO     │ 1040.0     │ 4.06      │ 3.03      │ 60,720.26    │ 48,327.99    │ 405,000.00   │ 295,951.75   │ 41,749.05   
SPCC     │ SPCC.ILO.MATARANI                │ 69.0       │ 0.27      │ 3.03      │ 13,310.05    │ 32,000.00    │ 344,250.00   │ 298,939.95   │ 90,432.16   
SPCC     │ SPCC.ILO.MARCONA                 │ 279.0      │ 1.11      │ 3.03      │ 23,777.09    │ 55,000.00    │ 344,250.00   │ 265,472.91   │ 64,109.81   
SPCC     │ SPCC.ILO.MEJILLONES              │ 335.0      │ 1.33      │ 3.03      │ 26,568.30    │ 65,000.00    │ 344,250.00   │ 252,681.70   │ 57,906.22   
NEXA     │ NEXA.ILO.CALLAO.MARCONA.ILO      │ 1051.0     │ 4.10      │ 3.30      │ 62,233.73    │ 71,327.99    │ 344,250.00   │ 210,688.28   │ 28,480.65   
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
✅ [QC PASSED] Matriz Financiera validada 100% coincidente con Acta PDF.
```

