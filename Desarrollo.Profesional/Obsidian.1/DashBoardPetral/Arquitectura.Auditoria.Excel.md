# 🏗️ Arquitectura de Auditoría Automatizada (Excel → Geeksoft)

## 📌 1. Visión y Objetivo
El objetivo de este flujo es establecer una "tubería de verdad" continua entre el equipo Financiero/Operaciones (que usa Excel) y el equipo de Desarrollo (que construye el motor Geeksoft). 
En lugar de "quemar" (hardcodear) los datos de prueba en la interfaz web, el sistema debe ser capaz de alimentarse autónomamente de múltiples hojas de cálculo presentes o futuras, subir esos resultados al motor de base de datos y usarlos como "Benchmarks" de validación técnica en el Dashboard.

---

## ⚙️ 2. Flujo de Trabajo Operativo (Data Pipeline)

El ciclo de vida de los datos de auditoría fluye en una sola dirección:

1. **Excel Corporativo:** El comercial corre su escenario de rentabilidad (ej: "B/T MOQUEGUA hacia MEJILLONES") en su Excel institucional de confianza.
2. **Scrapers Extractores (Python):** Scripts modulares de Python que leen esos Exceles específicos, identifican las celdas críticas de resultado y las empaquetan en un formato JSON.
3. **Inyección en Supabase:** El script realiza una operación UPSERT a la tabla `audit_benchmarks` en la base de datos de producción.
4. **Voyage Ledger Test (UI):** La pantalla de React que ya hemos construido descarga estos benchmarks de la tabla, ejecuta el propio motor matemático interno de Geeksoft (FastAPI), y alinea ambos resultados frente a frente para mostrar los **Deltas (Δ)**.

---

## 🐍 3. Los Scripts Scrapers (Implementación Actual)

Actualmente, el sistema cuenta con el script de producción principal:
* **Script:** `Geeksoft_Engine/scripts/scrape_voyages.py`
* **Tecnología:** Utiliza `openpyxl` para extraer datos de los `.xlsx` sin necesidad de abrir Excel.
* **Mapeo Híbrido:** Toma una matriz base de métricas operacionales (días de mar, bunker, tce) y dinámicamente escanea las celdas buscando la etiqueta **"Additional Expenses US$"** para extraer los gastos operativos imprevistos (Ej. Loading Master) directamente de las pestañas (`ILO-MEJILLONES`, etc.).
* **Integración DB:** Se conecta a PostgreSQL/Supabase vía `psycopg2` y hace un TRUNCATE/INSERT (Upsert) hacia la tabla `audit_benchmarks`.

---

## 🗄️ 4. Estructura de la Tabla `audit_benchmarks` (Supabase)

La tabla receptora en Supabase actúa como el historial inmutable de proyecciones oficiales, e incluye el campo de gastos adicionales:

* `benchmark_id` *(UUID, PK)*
* `scenario_key` *(VARCHAR)* → Llave combinada (Ej: `TABLONES-ILO-MATARANI`).
* `excel_source_file` *(VARCHAR)*
* `execution_date` *(TIMESTAMP)*
* **Métricas Operativas (NUMERIC)**:
  * `act_load` / `act_disch` (MT/hora)
  * `port_days` / `sea_days` (Días)
  * `bunker_costs` (USD)
  * `voyage_result` (USD)
  * `total_duration` (Días)
  * `tce_real` (USD/Día)
  * `pl_vs_req` (USD)
  * **`additional_expenses` (USD) → Extraído dinámicamente de Excel (ej: 2500 para Mejillones)**

---

## 📊 5. Conciliación en el Dashboard (Voyage Ledger Test)

La pantalla web asume la responsabilidad de la **Comparación en Tiempo Real**. 
Por cada llave (ej: `TABLONES-ILO-MATARANI`), el frontend:
1. Pide al motor de Geeksoft calcular el viaje (endpoint `/api/v1/forecast/run`).
2. Descarga de la base de datos oficial los Benchmarks de Excel (endpoint `/api/v1/forecast/benchmarks`).
3. Cruza la data fila por fila en la Matriz. Se ha añadido la fila **"5.5 Gastos Adicionales"**:
   * *GEEKSOFT:* Muestra `$0` (ya que es un imprevisto, no un pronóstico algorítmico).
   * *PETRAL (Excel):* Muestra el valor extraído por el script (Ej. `$2,500`).
   * *Delta:* Se visualiza la discrepancia en rojo para alertar a los analistas de un costo oculto en su rentabilidad comercial.

> **💡 Nota Estratégica:** Este flujo permite que el Motor de Geeksoft pueda someterse a pruebas de estrés automatizadas, contrastando las fórmulas algorítmicas de Python contra el modelo real de rentabilidad empresarial forjado en Excel.
