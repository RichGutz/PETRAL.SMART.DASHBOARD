# INTEGRACIÓN EN MATRIZ FINANCIERA (FORECAST VS EJECUCIÓN REAL)

> **Módulo:** ETL - Tablero Comparativo en Voyage Ledger  
> **Interfaz:** `FinancialMatrix_V2.tsx`  

---

## 1. INTEGRACIÓN EN LA INTERFAZ DE USUARIO (UI)

La pantalla de **Matriz Financiera** incorporará un selector de modo de vista que permitirá al analista financiero evaluar tres perspectivas:

```
[ Modo Vista: 📊 Forecast Proyectado | 💵 Ejecución Real | ⚖️ Variación (Variance) ]
```

---

## 2. TABLERO COMPARATIVO DE DESVIACIÓN (VARIANCE TABLE)

| Métrica Financiera | Forecast (USD) | Real (USD) | Desviación ($USD$) | Desviación ($\%$) | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ingreso por Flete** | $120,000 | $125,000 | +$5,000 | +4.17% | ✅ Favorable |
| **Demurrage Cobrado** | $0 | $3,500 | +$3,500 | N/A | ✅ Favorable |
| **Gasto de Búnker** | -$45,000 | -$48,200 | -$3,200 | -7.11% | ❌ Desfavorable |
| **Gastos Portuarios** | -$18,500 | -$17,900 | +$600 | +3.24% | ✅ Favorable |
| **Profit Neto Real** | **$56,500** | **$62,400** | **+$5,900** | **+10.44%** | **✅ Favorable** |

---

## 3. INDICADORES CLAVE DE RENDIMIENTO (KPIs)

- **Exactitud del Forecast (Forecast Accuracy):** Medida en porcentaje de apego del P&L presupuestado frente al auditado en las liquidaciones reales de **B/T Moquegua** y **B/T Tablones**.
