# 📋 Plan de Mejoras - 03 de Julio de 2026

Este documento registrará el listado de cambios acordados tras la reunión con el cliente, los cuales iremos ejecutando de manera secuencial y controlada.

## 🚀 Lista de Mejoras

---

### ✅ Mejora 1 — `agency_matrix` → `port_cost_static` (Herramienta de Forecast)

**Contexto y Decisión:**
- Deseamos tener una **nueva tabla física real** en Supabase llamada `port_cost_static` para que el forecast tenga su propia entidad editable y limpia.
- Para evitar riesgos, **NO renombramos ni eliminamos `agency_matrix`**.
- En su lugar, **creamos la tabla física `port_cost_static`** con la misma estructura y migramos todos los datos de `agency_matrix` a esta nueva tabla.
- **`port_cost_concepts`** y **`port_costs_matrix`** quedan en estado **🛑 DORMIDO** por ahora. No se eliminan físicamente de la BD, pero el motor de forecast las ignorará hasta nuevo aviso.
- La nueva fuente primaria de cálculo para el **Forecast** (tanto en rutas clásicas como en rutas multileg del Estimador Excel) será exclusivamente la nueva tabla física **`port_cost_static`**.

**Estrategia de ejecución (Riesgo cero via Duplicación Física):**
1. Crear la tabla `port_cost_static` (copiando esquema y registros de `agency_matrix`).
2. Mantener la tabla antigua `agency_matrix` intacta en la BD como respaldo.
3. Actualizar el código del backend para consumir de `port_cost_static`.

**Alcance del Cambio:**
- `[ ]` Crear la tabla física `port_cost_static` en Supabase y copiar toda la data de `agency_matrix`.
- `[ ]` Actualizar referencias en el backend para leer de `port_cost_static`:
  - `forecast_service.py` — cambiar `agency_matrix` → `port_cost_static`
  - `forecast.py` (router) — endpoint de carga de datos
  - `spot_engine.py` — si aplica para el motor multileg
- `[ ]` Protocolo de validación: usuario audita Ledger → números deben ser IDÉNTICOS (misma data, distinto nombre)
- `[ ]` Deploy VPS + verificación

**Regla de Conservación:**
> ⚠️ La tabla física `agency_matrix` **NO se elimina ni se altera**. Servirá de respaldo histórico. Las tablas `port_cost_concepts` y `port_costs_matrix` tampoco se tocan.

---

### ✅ Mejora 2 — Disolución de "Límites Portuarios" y Migración a Reglas Comerciales

**Contexto y Decisión:**
Actualmente la tabla `ports` en Supabase almacena variables que se agrupan visualmente en el Voyage Ledger bajo el card de **"Límites Portuarios"**. Estas variables corresponden a dos conceptos distintos que debían coexistir en la misma tabla:
- **Overheads administrativos** → tiempos muertos de papelería, conexión de mangueras, inspecciones, etc.
- **Posicionamiento** → horas de maniobra del buque antes de operar.

**La decisión:**
1. El bloque de **"Límites Portuarios"** desaparece como entidad visual y conceptual en el sistema.
2. Sus variables se migran conceptualmente a **"Reglas Comerciales"** (tabla o estructura a definir), donde tendrán un contexto más preciso dentro del acuerdo contractual cliente-puerto.
3. Los campos se **renombran** para reflejar su naturaleza real:

| Campo Actual (tabla `ports`) | Campo Nuevo | Significado |
|---|---|---|
| `overhead_carga_hrs` | `time_to_count_carga_hrs` | Tiempo que empieza a contar el contrato (Time to Count) en la operación de carga |
| `overhead_descarga_hrs` | `time_to_count_descarga_hrs` | Tiempo que empieza a contar el contrato (Time to Count) en la operación de descarga |
| `positioning_carga_hrs` | `maneuver_carga_hrs` | Horas de maniobra del buque antes de iniciar la carga |
| `positioning_descarga_hrs` | `maneuver_descarga_hrs` | Horas de maniobra del buque antes de iniciar la descarga |

**Alcance del Cambio:**

*Base de Datos (Supabase):*
- `[ ]` Añadir las 4 nuevas columnas (`time_to_count_carga_hrs`, `time_to_count_descarga_hrs`, `maneuver_carga_hrs`, `maneuver_descarga_hrs`) a la tabla `ports` (o a la tabla de reglas comerciales que se defina), migrando los valores actuales.
- `[ ]` Las columnas antiguas (`overhead_carga_hrs`, `overhead_descarga_hrs`, `positioning_carga_hrs`, `positioning_descarga_hrs`) quedan en estado **🛑 DORMIDAS** (no se eliminan hasta certificar que nada las consume).

*Backend:*
- `[ ]` Actualizar `engine.py` — reemplazar todas las referencias a `overhead` y `positioning` por los nuevos nombres.
- `[ ]` Actualizar `forecast_service.py` — idem.
- `[ ]` Actualizar `forecast.py` (router) — idem en los endpoints de carga de puertos.
- `[ ]` Actualizar `spot_engine.py` — idem para el motor multileg.

*Frontend:*
- `[ ]` Actualizar `VoyageLedgerTest.tsx` — renombrar los labels del card "Límites Portuarios" para mostrar los nuevos términos `Time to Count` y `Maneuver`.
- `[ ]` Actualizar `MultiCotizadorExcel.tsx` — si las celdas de overhead/posicionamiento usan los nombres antiguos, actualizarlos.
- `[ ]` Actualizar `ForecastBuilder.tsx` — verificar si los campos de overhead se inyectan al builder y corregir.

**Fórmula de Días de Puerto (no cambia, solo cambian los nombres de variables):**
```
port_days = ((Q / act_load + time_to_count_or + maneuver_or) + (Q / act_disch + time_to_count_de + maneuver_de)) / 24
```

**Regla de Conservación:**
> ⚠️ Los campos `overhead_*` y `positioning_*` en la tabla `ports` **NO se deben eliminar** hasta que todos los módulos (Engine, Ledger, Estimador, Forecast) hayan sido actualizados y verificados en producción.


---

### Mejora 3 - Agregar address_commission y broker_commission a Reglas Comerciales

**Contexto y Decisión:**
Las comisiones comerciales son costos que se deducen del ingreso bruto del flete y que actualmente NO estan modeladas en el sistema. Deben incorporarse como parte de las Reglas Comerciales del contrato, junto con las variables de time_to_count y maneuver definidas en la Mejora 2.

**Definicion de Variables:**

| Campo Nuevo | Tipo | Descripcion |
|---|---|---|
| address_commission | NUMERIC (%) | Comision de direccion - porcentaje deducido del flete bruto que el armador paga al fletador como descuento directo. Tipico: 1.25% a 5%. |
| broker_commission | NUMERIC (%) | Comision de corretaje - porcentaje deducido del flete bruto pagado al broker o intermediario que gestiono el negocio. Tipico: 1.25% a 2.5%. |

**Impacto en la Formula Financiera:**
    gross_revenue     = Q x freight_rate
    total_commissions = gross_revenue x (address_commission + broker_commission) / 100
    net_freight       = gross_revenue - total_commissions
    voyage_result     = net_freight - port_costs - bunker_costs

La metrica Gross Revenue pasa a ser el ingreso bruto antes de comisiones. El Net Freight (nuevo) es el ingreso real que afecta el P/L. El P/L y TCE se calculan sobre net_freight, no sobre gross_revenue.

**Alcance del Cambio:**

Base de Datos (Supabase):
- [ ] Agregar address_commission (%) y broker_commission (%) a la tabla de Reglas Comerciales (a definir junto con la Mejora 2).
- [ ] Valores por defecto: 0.00 (sin comisiones si no se especifican).

Backend:
- [ ] Actualizar engine.py - incorporar el descuento de comisiones al calculo del net_income.
- [ ] Actualizar forecast_service.py - inyectar las comisiones en la linea de simulacion y reflejarlas en el unit_result.
- [ ] Actualizar spot_engine.py - idem para el motor multileg del Estimador Excel.

Frontend:
- [ ] Actualizar VoyageLedgerTest.tsx - agregar fila de Comisiones (desglosada en Address + Broker) en la auditoria del ledger.
- [ ] Actualizar ForecastGrid.tsx - mostrar comisiones como linea deductible en la Matriz Financiera.
- [ ] Actualizar MultiCotizadorExcel.tsx - mostrar el impacto de las comisiones en el card de resultado del viaje.

**Regla de Negocio:**
Las comisiones se aplican sobre el flete bruto (Q x freight_rate), no sobre el resultado neto. Son un costo directo del negocio de transporte maritimo y deben mostrarse de forma transparente en la auditoria del ledger.

---

## ESTRATEGIA GLOBAL DE EJECUCION SEGURA

### Principio rector: Anadir antes de borrar

Nunca renombrar ni eliminar lo que funciona en la BD. Agregar lo nuevo en paralelo, migrar gradualmente, y solo retirar lo viejo cuando el 100% del sistema este verificado en produccion.

---

### Clasificacion de riesgo por tipo de cambio

| Tipo de cambio | Git tag protege? | Riesgo |
|---|---|---|
| Cambio de codigo Python/TypeScript | SI | Bajo - revertible en 2 min |
| Nueva columna en Supabase (ADD con DEFAULT) | Si (no necesita revertirse) | Cero - aditivo |
| Renombrar tabla/columna en Supabase | NO | Alto - inconsistencia irreversible |
| Eliminar tabla/columna en Supabase | NUNCA | Perdida de datos permanente |

---

### El Loop de Pruebas (Ciclo de Verificacion por cada cambio)

Antes de cada cambio:
- [ ] Ejecutar en terminal: python scratch/test_convergence_ledger.py
- [ ] Anotar los valores de referencia del Ledger (voyage_result, port_costs, bunker_costs, TCE, dias)
- [ ] Ejecutar: git tag pre-mejora-N (donde N es el numero de mejora)
- [ ] Ejecutar: git push --tags

Despues de cada cambio:
- [ ] Ejecutar: python deploy_engine_vps.py
- [ ] Abrir el dashboard: https://forecast.geeksoft.tech -> Auditoria Ledger
- [ ] Verificar que los numeros de TODOS los casos (TABLONES ILO-MATARANI, ILO-MARCONA, ILO-MEJILLONES) sean IDENTICOS a los anotados antes del cambio
- [ ] Si los numeros cambiaron inesperadamente: git checkout pre-mejora-N, redeploy, analizar

Criterio de exito:
- Voyage Result: igual al centavo
- Port Costs: igual al centavo
- Bunker Costs: igual al centavo
- TCE Realizado: igual al decimal
- Dias de Puerto: igual al decimal
- Dias de Mar: igual al decimal

El Auditoria Ledger es el UNICO arbitro. Si los numeros siguen siendo los mismos que el Excel de referencia, el cambio es seguro.

---

### Plan de ejecucion de las 3 mejoras en orden de menor a mayor riesgo

#### MEJORA 3 - Comisiones (ejecutar primero - cero riesgo)

Fase A (Supabase + backend sin activar formula):
- [ ] git tag pre-mejora-3-fase-a
- [ ] ADD COLUMN address_commission NUMERIC DEFAULT 0 en tabla de reglas comerciales
- [ ] ADD COLUMN broker_commission NUMERIC DEFAULT 0 en tabla de reglas comerciales
- [ ] Backend lee los valores pero NO los resta del calculo todavia
- [ ] LOOP DE PRUEBAS: numeros deben ser IDENTICOS
- [ ] Deploy VPS + verificacion

Fase B (activar la deduccion en la formula):
- [ ] git tag pre-mejora-3-fase-b
- [ ] Activar en engine.py: net_freight = gross_revenue * (1 - commissions/100)
- [ ] Agregar fila de Comisiones en VoyageLedgerTest.tsx
- [ ] LOOP DE PRUEBAS: con commission=0, numeros deben ser IDENTICOS. Con valores reales del contrato, verificar contra Excel de referencia con comisiones.
- [ ] Deploy VPS + verificacion

#### MEJORA 1 - port_cost_static (riesgo bajo via tabla fisica duplicada)

- [ ] git tag pre-mejora-1
- [ ] Crear la tabla fisica `port_cost_static` en Supabase (copiando el esquema y datos de `agency_matrix`).
- [ ] Actualizar backend para leer de `port_cost_static` en lugar de `agency_matrix`.
- [ ] LOOP DE PRUEBAS: numeros deben ser IDENTICOS (misma data, distinta tabla física).
- [ ] Deploy VPS + verificacion.


- [ ] git tag pre-mejora-2
- [ ] ADD COLUMN time_to_count_carga_hrs, time_to_count_descarga_hrs, maneuver_carga_hrs, maneuver_descarga_hrs a ports con los mismos valores actuales
- [ ] Backend usa dual-read: port.get("time_to_count_carga_hrs") or port.get("overhead_carga_hrs", 6.0)
- [ ] LOOP DE PRUEBAS: numeros deben ser IDENTICOS
- [ ] Deploy VPS + verificacion
- [ ] Solo si todo OK por 48h: deprecar columnas viejas (no eliminar)

---

## PROTOCOLO DE VALIDACION REVISADO (Acuerdo de trabajo)

### Division de roles

| Actor | Rol |
|---|---|
| Usuario (humano) | Arbitra el negocio: valida visualmente que el numero del Auditoria Ledger tenga sentido comercial |
| Gemini (agente) | Arbitra la tecnica: verifica que Estimador Excel y Matriz Financiera converjan con el numero aprobado por el usuario |

### Loop de pruebas correcto

1. Gemini hace el cambio + deploy al VPS
2. Usuario abre Auditoria Ledger en el dashboard
3. Para cambios que NO deben mover numeros: Usuario confirma que los numeros son IDENTICOS a los de antes
4. Para cambios que SI deben mover numeros (ej. comisiones): Usuario confirma que el nuevo numero tiene sentido comercial segun el contrato real
5. Usuario da el visto bueno (o rechaza)
6. Si aprobado: Gemini corre comparacion entre Estimador Excel y Matriz Financiera para certificar convergencia tecnica
7. Si rechazado: git checkout + redeploy inmediato

### Nota clave

La Auditoria Ledger NO es siempre la referencia fija. Es la fuente de verdad APROBADA POR EL USUARIO en ese momento. Cuando se hacen cambios intencionales al modelo financiero, el usuario re-aprueba los nuevos numeros y esos se convierten en la nueva referencia.

---

### Mejora 3.1 - Interfaz de Comisiones en Estimador Excel (MultiCotizador)

**Contexto y Decision:**
Para que el Estimador Excel (Multi-Leg) refleje el mismo circuito financiero del Voyage Ledger, debe permitir configurar las comisiones desde la interfaz del usuario. Se incorporara un card interactivo pequeno al lado del card de Port Costs.

**Diseno de Interfaz y Variables Locales:**
- En MultiCotizadorExcel.tsx, declarar dos estados de react:
  * ddressCommission (porcentaje, por defecto  )
  * rokerCommission (porcentaje, por defecto  )
- En el layout de tarjetas inferiores, la rejilla pasara a tener 4 columnas (en pantallas grandes):
  1. Bunker Expenses
  2. Port Costs
  3. Comisiones (Card Nuevo)
  4. Voyage Result (PL)

**Estructura del Card "Comisiones (Commercial Rules)":**
- Icono/Titulo: 💼 Comisiones de Viaje
- Input para Address Comm: Address Comm (%) con control numerico editable (estilo Excel).
- Input para Broker Comm: Broker Comm (%) con control numerico editable (estilo Excel).
- Tabla resumen mostrando el monto en USD:
  * Address Comm (USD) -> 	otal_revenue * address_commission / 100
  * Broker Comm (USD) -> 	otal_revenue * broker_commission / 100
  * Total Deduccion (USD) -> suma de ambas salidas.

**Impacto en los Calculos de UI:**
En la funcion handleCalculate:
- 	otal_commissions = total_freight_revenue * (addressCommission + brokerCommission) / 100
- pnl_net_utility = total_freight_revenue - total_commissions - total_port_costs - total_bunker_costs
- 	ce_real = total_days > 0 ? (pnl_net_utility / total_days) : 0

**Persistencia de Rutas (Save/Load):**
- Guardar ddressCommission y rokerCommission dentro de legs_data al serializar la ruta.
- Cargar y asignar los estados al recuperar la ruta.

**Alcance del Cambio:**
- [ ] Declarar ddressCommission y rokerCommission en MultiCotizadorExcel.tsx.
- [ ] Actualizar formula de consolidado en handleCalculate para descontar comisiones locales.
- [ ] Modificar layout de 3 a 4 columnas e insertar el nuevo card de comisiones.
- [ ] Integrar campos en la serializacion / deserializacion de legs_data al guardar y cargar rutas.

---

### Mejora 4 — Flexibilidad en Estimador Excel: Costos Portuarios Editables y Ritmos de Operacion Explicitos

**Contexto y Decision:**
Para dar una experiencia 100% de hoja de calculo (Excel) al Multicotizador:
1. **Costos de Puerto Editables:** El usuario podra forzar ("override") el costo portuario de origen y destino de cada tramo directamente en la rejilla, sin depender exclusivamente del backend.
2. **Ritmos de Operacion Explicitos:** El ritmo de operacion (Carga/Descarga) no debe mostrarse como "Auto" (placeholder vacio). En su lugar, el sistema auto-poblara el campo con el valor numerico real de la base de datos inmediatamente al cambiar el puerto o la accion, haciendolo visible y editable desde el primer momento.

**Mecanica de Costos Portuarios Manuales (Override):**
- En puertosConfig (que define el estado de cada puerto en la rejilla), agregar un campo manual_port_cost?: string | number.
- En la columna **Costo Pto** de la rejilla principal:
  * Reemplazar la celda de solo lectura por un <input type="number">.
  * Si el campo manual_port_cost esta vacio o es nulo, la celda mostrara el valor calculado por el backend (esult.tramos[idx].agency_costs_...) en gris/italic como sugerencia o fallback.
  * Si el usuario escribe un numero, este valor se guarda en manual_port_cost y se resalta en negrita (indicando que es un valor sobreescrito manualmente).
- En la funcion handleCalculate:
  * Al armar el payload para el backend, enviar los costos manuales para que el motor de calculo sume estos valores en lugar de consultar la base de datos de costos de puerto (port_cost_static).
  * En el calculo local del flete consolidado y P/L, usar los costos manuales si existen.

**Mecanica de Ritmos de Operacion Explicitos:**
- Modificar los disparadores reactivos en MultiCotizadorExcel.tsx (updateTramoField y updatePuertoConfigField) para que cuando la accion cambie a CARGAR o DESCARGAR, el estado op_rate se inicialice directamente con el valor devuelto por getAutoPortRate(portId, action).
- El input en la rejilla ya no tendra placeholder Auto, sino que tendra el numero cargado real en su propiedad alue.

**Alcance del Cambio:**
- [ ] Modificar el estado PuertoConfig para soportar manual_port_cost.
- [ ] En la rejilla principal de MultiCotizadorExcel.tsx, convertir la columna "Costo Pto" en un <input> editable con logica de override (mostrar sugerencia si no hay valor manual).
- [ ] Actualizar la funcion handleCalculate para inyectar y respetar los costos de puerto manuales en el payload del calculo y en las sumatorias de consolidacion.
- [ ] Modificar la inicializacion de op_rate para inyectar directamente el numero en el estado del componente en lugar de usar placeholders.
- [ ] Asegurar que manual_port_cost se guarde y cargue correctamente en legs_data de las rutas guardadas.

---

### Mejora 5 — Reordenamiento de Métricas y Desplegable en Matriz Financiera (ForecastGrid)

**Contexto y Decisión:**
Para mejorar la legibilidad y control del analista en la Matriz Financiera:
1. **Chevron en P/L:** El acordeón de colapso de subtotales y totales generales se asocia a la métrica **P/L** (Utilidad Neta), que es el indicador financiero definitivo. Al colapsar, solo la fila de **P/L** permanecerá visible.
2. **Reordenación de Ingresos:** La métrica **Gross Revenue** se mueve de posición para ubicarse inmediatamente arriba de **Demurrage** y **Gross + Demurrage**, agrupando de manera intuitiva los conceptos que componen el ingreso total bruto.

**Nuevo Orden de Filas en Subtotales y Totales:**
1. **P/L** (Collapsible, visible en modo colapsado)
2. **Toneladas**
3. **Gross Revenue** (Ingreso por Flete)
4. **Demurrage** (Ingreso por Demora)
5. **Gross + Demurrage** (Ingreso Bruto Combinado)
6. **Yield Flete (USD/MT)**
7. **Yield (USD/MT)**

**Alcance del Cambio:**
- [ ] En ForecastGrid.tsx, reordenar el array subMetrics de subtotales, el array globalMetrics de TOTAL FLOTA y el array ccumMetrics de TOTAL ACUMULADO.
- [ ] Cambiar la lógica de asignación del Chevron (isExpandableSubtotal, isExpandableGlobal) para que apunte a P/L en lugar de Gross Revenue.
- [ ] Ajustar el renderizado condicional de filas visibles al colapsar: en lugar de mostrar subMetrics[0] (Gross Revenue), mostrar el nuevo subMetrics[0] (que será P/L).
- [ ] Comprobar visualmente que al colapsar el subtotal o total general, solo quede a la vista la fila de P/L.

---

### Mejora 6 — Selector de Rutas de Ancho Flexible (SelectContent) en el Constructor

**Contexto y Decision:**
En la interfaz del ForecastBuilder, cuando se despliega el menu para elegir una ruta, la lista desplegable tiene un ancho fijo restringido al tamaño del trigger (w-(--anchor-width)). Esto provoca que las rutas con nombres largos se corten y no se puedan leer de forma comoda.

**La decision:**
- Modificar el estilo del contenedor SelectContent en el componente ui para que se comporte de forma flexible:
  * Su ancho debe acomodarse de forma automatica al contenido de los textos de las rutas (w-auto min-w-[max-content]).
  * Debe limitar su altura maxima para no salirse de la pantalla (max-h-[300px] o max-h-60) y permitir scroll vertical (overflow-y-auto).

**Alcance del Cambio:**
- [ ] Modificar src/components/ui/select.tsx:
  * En la funcion SelectContent, cambiar o sobreescribir la clase w-(--anchor-width) por w-auto min-w-[max-content] max-h-[300px] overflow-y-auto cuando sea necesario, o usar una clase personalizada pasada por prop className en el select de rutas en ForecastBuilder.tsx.
  * Como alternativa segura para no afectar a otros Selects globales del sistema: pasar la clase w-auto min-w-[max-content] max-h-[250px] overflow-y-auto a traves de la propiedad className del <SelectContent> especifico del selector de rutas en ForecastBuilder.tsx.
- [ ] Comprobar visualmente que el selector se despliega de forma completa y flexible.
