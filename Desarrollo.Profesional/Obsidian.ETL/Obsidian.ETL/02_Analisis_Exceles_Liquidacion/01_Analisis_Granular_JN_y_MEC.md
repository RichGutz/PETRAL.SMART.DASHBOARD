# ANÁLISIS GRANULAR DE LIQUIDACIONES REALES (JORGE NEYRA & MARÍA ELENA CASTRO)

> **NAVIERA PETRAL S.A.**  
> **Fuentes Oficiales:**  
> - **Resultados.JN (B/T Tablones):** `VC Tablones 2026.xlsx` (Jorge Neyra)  
> - **Resultados.MEC (B/T Moquegua):** `MOQUEGUA - Voyage calculation viajes Enero a Junio  2026.xlsx` (María Elena Castro)  

---

## 1. ESTRUCTURA COMPARATIVA DE LIBROS DE EXCEL

| Parámetro | B/T Tablones (`Resultados.JN`) | B/T Moquegua (`Resultados.MEC`) |
| :--- | :--- | :--- |
| **Operador Responsable** | Jorge Neyra (`JN`) | María Elena Castro (`MEC`) |
| **Pestaña Resumen** | `RESUMEN` | ` Resumen Moquegua Enero-Junio  ` |
| **Viajes Registrados** | `v.038` a `v.052` | `V.761` a `V.777` |
| **Clientes Principales** | SPCC & NEXA | SPCC & NEXA |
| **Naves Asignadas** | B/T Tablones (DWT 16,500) | B/T Moquegua (DWT 14,300) |

---

## 2. DESGLOSE CAMPO POR CAMPO DE LA PESTAÑA RESUMEN

### A. Columnas de la Pestaña Resumen:
1. **Viaje (NVR):** Identificador correlativo del viaje (`v.038` ... `v.052` en Tablones; `761` ... `777` en Moquegua).
2. **Cliente:** Cliente comercial fletador (`SPCC` o `NEXA`).
3. **POL (Port of Loading):** Puerto de carga (ej. *Ilo*, *Callao*).
4. **POD (Port of Discharge):** Puerto de descarga (ej. *Matarani*, *Marcona*, *Mejillones*).
5. **Costo Portuario Carga ($USD$):** Desembolso total en el puerto de originen.
6. **Costo Portuario Descarga ($USD$):** Desembolso total en el puerto de destino.
7. **Flete Pactado ($USD/MT$):** Tarifa de flete contractual por tonelada métrica.
8. **Toneladas Cargadas (TM):** Carga efectiva embarcada.
9. **Facturación Total / Ingreso Bruto ($USD$):** Flete total cobrado ($TM \times \text{Flete}$).
10. **TCE ($USD/\text{día}$):** Time Charter Equivalent / Rendimiento diario neto del viaje.
11. **P/L (Profit & Loss $USD$):** Utilidad Neta Real del viaje.
12. **Precio Promedio Búnker ($USD/MT$):** Precios reales pagados de IFO 380 y MDO.

---

## 3. FICHA GRANULAR DE VIAJE (PLANTILLA CORPORATIVA VOYAGE ESTIMATION)

Cada pestaña individual (`v.044 NEXA`, `V.763 NEXA Marcona`) se organiza en 4 bloques de cálculo:

```
┌────────────────────────────────────────────────────────┐
│ 1. CABECERA: Vessel Name, Prepared By (JN/MEC), DWT, LOA│
├────────────────────────────────────────────────────────┤
│ 2. INGRESOS (INCOME): Cliente, Flete USD/MT, TM, Total │
├────────────────────────────────────────────────────────┤
│ 3. ITINERARIO (PROGRAM): POL, POD, Días Mar, MT/h, Hrs  │
├────────────────────────────────────────────────────────┤
│ 4. GASTOS (EXPENSES): Port Expenses + Bunker IFO/MDO   │
└────────────────────────────────────────────────────────┘
```
