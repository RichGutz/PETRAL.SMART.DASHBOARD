# 📋 PLAN MAESTRO DE MEJORA Y REFACTORIZACIÓN — MULTICOTIZADOR SPOT V3

> **Ruta de Control**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador`  
> **Estado de Despliegue VPS**: `https://forecast.geeksoft.tech`  

---

## 📌 Checklist de Puntos de Control y Estado de Ejecución

### ✅ PUNTO 1: Purga Total de Fallbacks Numéricos (`6.0`, `500`, `300`)
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Eliminados todos los valores por defecto inventados en `spot_engine.py` y `forecast.py`. Si falta un dato, el motor asigna `0.0`.

### ✅ PUNTO 2: Ritmos Operativos desde Maestro de Contratos
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Búsqueda jerárquica estricta de ritmos de carga y descarga en Supabase filtrados por `client_id + origin_port_id + destination_port_id`.

### ✅ PUNTO 3: Jerarquía Estricta de Precios Búnker
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Jerarquía: `1. Sobreescritura UI` → `2. Maestro Contratos` → `3. Cotización Actual` → `4. Maestro Búnker`. Homologación de MGO a MDO.

### ✅ PUNTO 4: Distancias NM Exclusivas del Maestro
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Eliminado el fallback de 100 NM y 0.05 weather factor. Las distancias provienen únicamente de la tabla `distances`.

### ✅ PUNTO 5: Ocultar Spinners ▲▼ de Inputs Numéricos
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Estilo CSS aplicado globalmente ocultando `-webkit-inner-spin-button` para una entrada de texto limpia estilo Excel.

### ✅ PUNTO 6: Costos Portuarios Editables por Celda en UI
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Celdas editables manualmente (`manual_port_cost`). Eliminados fallbacks de $500 y $345.

### ✅ PUNTO 7: Filas de Totales y Discrepancia ($\Sigma$ y $\Delta$)
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Tres filas de alto contraste:
  1. `📊 TOTAL ESTIMADO (MOTOR)` (Fila Azul)
  2. `🧮 TOTAL ARITMÉTICO (SUMA Σ)` (Fila Ámbar)
  3. `⚠️ DIFERENCIA DETECTADA (Δ)` o `✅ CONVERGENCIA PERFECTA` (Fila Verde/Rojo).

### ✅ PUNTO 8: Cards de Auditoría Expandibles sin Scrollbars
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Eliminados `max-h-36 overflow-y-auto` en Búnker y Port Costs.

### ✅ PUNTO 9: Suma de Costos Portuarios Multi-Pierna $N$-Puertos
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Fórmula de acumulación corregida a $\sum_{i=1}^{N} \text{port\_cost}_i$ sin duplicar los puertos intermedios.

### ✅ PUNTO 10: Renombrar Overhead a "TIME TO COUNT"
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Concepto sustituido al 100% en la rejilla, motor Python y fórmulas de auditoría.

### ✅ PUNTO 11: PDF Audit Trail "Calculadora en Mano" (Matriz de 5 Columnas)
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Matriz de 13 métricas desglosadas con 5 columnas:
  1. `ÍTEM / MÉTRICA OFICIAL`
  2. `FÓRMULA APLICADA`
  3. `CÁLCULO SUSTITUIDO NUMÉRICO`
  4. `GEEKSOFT ENGINE`
  5. `FUENTE DE DATOS (Trazabilidad)`

### ✅ PUNTO 12: 3er Tab "Auditoría Raw (JSON)"
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Detalle**: Visor de código JSON interactivo con botón `[Copiar JSON al Portapapeles]`.

### ✅ PUNTO 13: Verificación de Convergencia con Excel PETRAL (`NEXA.ILO.CALLAO.MATARANI.ILO`)
- **Estado**: `[COMPLETADO & EN VIVO]`
- **Resultados Mapeados**:
  - `Income`: $405,000 USD
  - `Port Costs`: $35,000 USD
  - `Días de Mar`: 4.057576 Días (4.06 d)
  - `Días de Puerto`: 3.072917 Días (3.07 d / 73.75 hrs)
  - `Duración Total`: 7.130492 Días (7.13 d)
  - `Costo Búnker`: $80,074.48 USD
  - `Voyage Result / PCM`: $289,925.52 USD
  - `TCE Realizado`: $40,659.96 / día
  - `P/L Net Utility`: $182,968.14 USD

---

## ⏳ PUNTOS PENDIENTES DE MODULARIZACIÓN

### 🎯 PUNTO 0: Modularización de Servicios de Frontend
- **Objetivo**: Decoplar `MultiCotizadorExcel.tsx` (+3,700 líneas) en módulos limpios:
  1. `src/services/multicotizadorService.ts`
  2. `src/components/CommercialForecast/tabs/EstimadorSpotTab.tsx`
  3. `src/components/CommercialForecast/tabs/CalculosDetalladosTab.tsx`
  4. `src/components/CommercialForecast/tabs/AuditoriaRawJsonTab.tsx`
