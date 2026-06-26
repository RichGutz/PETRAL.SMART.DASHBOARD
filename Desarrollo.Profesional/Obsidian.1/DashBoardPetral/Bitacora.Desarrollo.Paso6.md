# 📘 Bitácora de Desarrollo - Paso 6 (Auditoría del Voyage Ledger & Dashboard de Parámetros)

## 📌 Contexto
Tras consolidar la plataforma multi-usuario con identidad corporativa (Paso 5), la prioridad operativa fue construir una **pantalla de auditoría** que permita verificar la lógica del motor matemático "con una sola mirada". El objetivo: que cualquier usuario pueda confirmar que los datos que entraron al cálculo son exactamente los correctos, sin necesidad de depurar código.

---

## 🛠️ Acciones Realizadas

### 1. Creación del Componente `VoyageLedgerTest.tsx`
- Se creó el componente de **Auditoría del Voyage Ledger** como página diagnóstica accesible desde el módulo `CommercialForecast`.
- Permite seleccionar un escenario (buque + ruta + cliente) y ejecutar el motor, mostrando:
  - Los **parámetros crudos de entrada** (`raw_inputs`) extraídos de la BD.
  - Las **fórmulas algebraicas** del motor con reemplazo numérico real.
  - La **tabla de métricas** con columna GEEKSOFT vs PETRAL (Excel) y el Delta (Δ).
  - La **tabla de origen** de cada variable (qué tabla de Supabase la provee).

### 2. Esquema de Color por Tabla (`COLOR_SCHEME`)
- Se asignó un color único e inmutable a cada tabla de origen de datos:
  - 🔵 **`vessels`** → Azul
  - 🟡 **`bunker_prices`** → Amarillo
  - 🟣 **`routes`** → Púrpura
  - 🟠 **`ports`** → Naranja
  - 🔴 **`agency_matrix`** → Rojo
  - 🟢 **`contracts`** → Verde
- Este código de color se aplica simultáneamente a los **cards superiores** y a la **columna "Tabla Origen"** de la tabla de auditoría, creando un link visual instantáneo entre el parámetro y su fuente.

### 3. Dashboard de 6 Cards — Layout 4 Columnas
- Se implementó un layout de **4 columnas con `flex`** para los 6 cards de parámetros:
  - **Col 1:** Maestro Flota (`vessels`) — Ocupa toda la altura (mayor cantidad de campos: consumos granulares IFO/MDO × 4 fases)
  - **Col 2:** Combustible + Costos Portuarios (apilados y pegados, `gap-1`)
  - **Col 3:** Maestro Rutas + Reglas Comerciales (apilados y pegados, `gap-1`)
  - **Col 4:** Límites Portuarios (`ports`)
- Formato **horizontal** de variables (nombre + valor en la misma fila) para maximizar densidad y reducir altura.
- Cada variable muestra su **nombre técnico** entre paréntesis (ej: `Intake Máx. (v_intake)`).

### 4. Mejoras de Detalle en los Cards
- **Maestro Flota:** Muestra el nombre del barco activo en la primera fila (`Barco: MOQUEGUA`).
- **Costos Portuarios (`agency_matrix`):** Llave compuesta documentada en el card (`Cliente + Puerto + Op + Barco`). Muestra el cliente (`SPCC`).
- **Consumos de búnker:** Se añadió la unidad `MT/d` a todos los valores de consumo (IFO Mar, MDO Mar, IFO Idle, etc.).
- **Combustible:** Se añadió campo `Fecha Cotización` para mostrar la fecha de vigencia del precio.

### 5. Migración de Base de Datos — `agency_matrix`
- Se agregó la columna `vessel_id` a la tabla `agency_matrix` mediante migración SQL:
  ```sql
  ALTER TABLE public.agency_matrix ADD COLUMN IF NOT EXISTS vessel_id VARCHAR DEFAULT 'DEFAULT';
  ```
- La llave primaria compuesta de la tabla pasó a ser: `client_id + port_id + operation_type + vessel_id`.

### 6. Migración de Base de Datos — `bunker_prices`
- Se agregó la columna `date DATE NOT NULL DEFAULT CURRENT_DATE` a la tabla `bunker_prices`.
- Se actualizaron los registros existentes con la fecha de cotización vigente (`2026-06-26`).

---

## 🎯 Resultado
La **Pantalla de Auditoría del Voyage Ledger** permite verificar end-to-end la cadena de datos:
- Qué valores se extrajeron de cada tabla de Supabase.
- Con qué fórmula los procesó el motor.
- Cuánto difiere del benchmark en Excel (Δ).

El esquema de colores crea un **mapa visual inmediato**: si hay un error, el analista puede localizar en segundos en qué tabla está el dato incorrecto, sin tocar código.
