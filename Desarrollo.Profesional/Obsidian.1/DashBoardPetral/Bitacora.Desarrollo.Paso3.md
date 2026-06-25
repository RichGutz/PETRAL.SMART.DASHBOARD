# 📘 Bitácora de Desarrollo - Paso 3 (Estabilización QA y Ledger Unitario)

## 📌 Contexto
Tras la implementación de la matriz dinámica del **Commercial Forecast**, se detectó que la tabla en React colapsaba las métricas financieras unitarias ("Gross Revenue", "Bunker Costs") al expandirse, y peor aún, los cálculos de `Bunker Costs` retornaban $6,663 en lugar de $28,156.46 para el B/T MOQUEGUA. 

## 🛠️ Acciones Realizadas

### 1. Refinamiento de la Matriz Dinámica (React / TSX)
- Se estabilizó el `ForecastGrid.tsx` manteniendo su arquitectura monolítica de 300 líneas para proteger el fragilísimo cálculo de los `rowSpan` de HTML.
- **Ledger Expandible:** La fila `Viajes (freq)` se convirtió en un acordeón que inyecta dinámicamente 16 sub-filas agrupadas por `▶ Operativo`, `▶ Tiempos / Costos` y `▶ Financiero`.
- **Subtotales Automáticos:** Se añadió una fila maestra color ámbar al final de cada bloque jerárquico de cliente (`Σ SUBTOTAL - TOTAL CLIENTE`) que agrega todos los revenues y costos del mes.

### 2. QA y Análisis de Causa Raíz (Root Cause Analysis)
- El usuario reportó números matemáticamente incorrectos en el Bunker. Al investigar el `voyage_ledger_test.pdf`, nos dimos cuenta que la prueba original de Python estaba usando un nivel de **ultra-granularidad de consumo dual-fuel** (IFO y MDO) separado por *sea, idle, load* y *discharge*.
- **La Causa Real:** La base de datos `vessels` en Supabase carecía de estas columnas (solo tenía un genérico `consumption_port_ifo`) y la tabla `bunker_prices` no existía en producción. El motor Python, al estar "ciego", multiplicaba los tiempos de puerto por 0 y usaba un hardcode de $450 por tonelada.

### 3. Migración y Corrección de Base de Datos (Supabase)
- Se ejecutó un script en `psycopg2` conectándose al motor real.
- Se creó y pobló la tabla `bunker_prices` con precios reales del test (IFO = $895.14, MDO = $1,460.30).
- Se ejecutó un `ALTER TABLE vessels` para añadir:
  - `consumption_idle_ifo`, `consumption_load_ifo`, `consumption_disch_ifo`
  - `consumption_sea_mdo`, `consumption_idle_mdo`, `consumption_load_mdo`, `consumption_disch_mdo`
- Se migró la data exacta de consumo del MOQUEGUA, TABLONES y CONCON TRADER al motor remoto.

## 🎯 Resultado
El P&L es ahora **100% dinámico y conducido por los maestros (DB)**. La corrida interactiva arroja resultados hiperprecisos que coinciden con las proyecciones estáticas en Excel de la naviera. Se ha creado un punto de restauración (`_V1`) y se ha hecho `push` a la rama `main` en Git para salvaguardar el proyecto antes de la demostración.
