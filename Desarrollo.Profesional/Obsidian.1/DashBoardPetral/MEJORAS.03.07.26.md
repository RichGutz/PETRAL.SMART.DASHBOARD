# 📋 Plan de Mejoras - 03 de Julio de 2026

Este documento registrará el listado de cambios acordados tras la reunión con el cliente, los cuales iremos ejecutando de manera secuencial y controlada.

## 🚀 Lista de Mejoras### ✅ Mejora 1 — `agency_matrix` → `port_cost_static` (Herramienta de Forecast)

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
- `[x]` Crear la tabla física `port_cost_static` en Supabase y copiar toda la data de `agency_matrix`.
- `[x]` Actualizar referencias en el backend para leer de `port_cost_static`:
  - `forecast_service.py` — cambiar `agency_matrix` → `port_cost_static`
  - `forecast.py` (router) — endpoint de carga de datos
  - `spot_engine.py` — si aplica para el motor multileg
- `[x]` Protocolo de validación: usuario audita Ledger → números deben ser IDÉNTICOS (misma data, distinto nombre)
- `[x]` Deploy VPS + verificación

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
- `[x]` Añadir las 4 nuevas columnas (`time_to_count_carga_hrs`, `time_to_count_descarga_hrs`, `maneuver_carga_hrs`, `maneuver_descarga_hrs`) a la tabla `ports` (o a la tabla de reglas comerciales que se defina), migrando los valores actuales.
- `[x]` Las columnas antiguas (`overhead_carga_hrs`, `overhead_descarga_hrs`, `positioning_carga_hrs`, `positioning_descarga_hrs`) quedan en estado **🛑 DORMIDAS** (no se eliminan hasta certificar que nada las consume).

*Backend:*
- `[x]` Actualizar `engine.py` — reemplazar todas las referencias a `overhead` y `positioning` por los nuevos nombres.
- `[x]` Actualizar `forecast_service.py` — idem.
- `[x]` Actualizar `forecast.py` (router) — idem en los endpoints de carga de puertos.
- `[x]` Actualizar `spot_engine.py` — idem para el motor multileg.

*Frontend:*
- `[x]` Actualizar `VoyageLedgerTest.tsx` — renombrar los labels del card "Límites Portuarios" para mostrar los nuevos términos `Time to Count` y `Maneuver`.
- `[x]` Actualizar `MultiCotizadorExcel.tsx` — si las celdas de overhead/posicionamiento usan los nombres antiguos, actualizarlos.
- `[x]` Actualizar `ForecastBuilder.tsx` — verificar si los campos de overhead se inyectan al builder y corregir.

**Fórmula de Días de Puerto (no cambia, solo cambian los nombres de variables):**
```
port_days = ((Q / act_load + time_to_count_or + maneuver_or) + (Q / act_disch + time_to_count_de + maneuver_de)) / 24
```

**Regla de Conservación:**
> ⚠️ Los campos `overhead_*` y `positioning_*` en la tabla `ports` **NO se deben eliminar** hasta que todos los módulos (Engine, Ledger, Estimador, Forecast) hayan sido actualizados y verificados en producción.


---

### ✅ Mejora 3 - Agregar address_commission y broker_commission a Reglas Comerciales

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
- `[x]` Agregar address_commission (%) y broker_commission (%) a la tabla de Reglas Comerciales (a definir junto con la Mejora 2).
- `[x]` Valores por defecto: 0.00 (sin comisiones si no se especifican).

Backend:
- `[x]` Actualizar engine.py - incorporar el descuento de comisiones al calculo del net_income.
- `[x]` Actualizar forecast_service.py - inyectar las comisiones en la linea de simulacion y reflejarlas en el unit_result.
- `[x]` Actualizar spot_engine.py - idem para el motor multileg del Estimador Excel.

Frontend:
- `[x]` Actualizar VoyageLedgerTest.tsx - agregar fila de Comisiones (desglosada en Address + Broker) en la auditoria del ledger.
- `[x]` Actualizar ForecastGrid.tsx - mostrar comisiones como linea deductible en la Matriz Financiera.
- `[x]` Actualizar MultiCotizadorExcel.tsx - mostrar el impacto de las comisiones en el card de resultado del viaje.

**Regla de Negocio:**
Las comisiones se aplican sobre el flete bruto (Q x freight_rate), no sobre el resultado neto. Son un costo directo del negocio de transporte maritimo y deben mostrarse de forma transparente en la auditoria del ledger.to del negocio de transporte maritimo y deben mostrarse de forma transparente en la auditoria del ledger.

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
- Guardar  ddressCommission y  rokerCommission dentro de legs_data al serializar la ruta.
- Cargar y asignar los estados al recuperar la ruta.

**Alcance del Cambio:**
- `[x]` Declarar `addressCommPct` y `brokerCommPct` en `MultiCotizadorExcel.tsx`.
- `[x]` Actualizar formula de consolidado en `handleCalculate` para descontar comisiones locales.
- `[x]` Modificar layout de 3 a 4 columnas e insertar el nuevo card de comisiones.
- `[x]` Integrar campos en la serializacion / deserializacion de `legs_data` al guardar y cargar rutas.
- `[x]` Implementar botón y ventana `Export PDF` para auditorías cruzadas.

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
- `[x]` Modificar el estado PuertoConfig para soportar manual_port_cost.
- `[x]` En la rejilla principal de MultiCotizadorExcel.tsx, convertir la columna "Costo Pto" en un <input> editable con logica de override (mostrar sugerencia si no hay valor manual).
- `[x]` Actualizar la funcion handleCalculate para inyectar y respetar los costos de puerto manuales en el payload del calculo y en las sumatorias de consolidacion.
- `[x]` Modificar la inicializacion de op_rate para inyectar directamente el numero en el estado del componente en lugar de usar placeholders.
- `[x]` Asegurar que manual_port_cost se guarde y cargue correctamente en legs_data de las rutas guardadas.

---

### ✅ Mejora 5 — Reordenamiento de Métricas y Desplegable en Matriz Financiera (ForecastGrid)

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
- `[x]` En ForecastGrid.tsx, reordenar el array subMetrics de subtotales, el array globalMetrics de TOTAL FLOTA y el array accumMetrics de TOTAL ACUMULADO.
- `[x]` Cambiar la lógica de asignación del Chevron (isExpandableSubtotal, isExpandableGlobal) para que apunte a P/L en lugar de Gross Revenue.
- `[x]` Ajustar el renderizado condicional de filas visibles al colapsar: en lugar de mostrar subMetrics[0] (Gross Revenue), mostrar el nuevo subMetrics[0] (que será P/L).
- `[x]` Comprobar visualmente que al colapsar el subtotal o total general, solo quede a la vista la fila de P/L.

---

### ✅ Mejora 6 — Selector de Rutas de Ancho Flexible (SelectContent) en el Constructor

**Contexto y Decision:**
En la interfaz del ForecastBuilder, cuando se despliega el menu para elegir una ruta, la lista desplegable tiene un ancho fijo restringido al tamaño del trigger (w-(--anchor-width)). Esto provoca que las rutas con nombres largos se corten y no se puedan leer de forma comoda.

**La decision:**
- Modificar el estilo del contenedor SelectContent en el componente ui para que se comporte de forma flexible:
  * Su ancho debe acomodarse de forma automatica al contenido de los textos de las rutas (w-auto min-w-[max-content]).
  * Debe limitar su altura maxima para no salirse de la pantalla (max-h-[300px] o max-h-60) y permitir scroll vertical (overflow-y-auto).

**Alcance del Cambio:**
- `[x]` Solución localizada en ForecastBuilder.tsx: se pasó `className="w-auto min-w-[max-content] max-h-[300px] overflow-y-auto"` directamente al `<SelectContent>` del selector de rutas, sin modificar el componente global `select.tsx`.
- `[x]` Comprobar visualmente que el selector se despliega de forma completa y flexible.

---

## 🔁 CICLO DE TRABAJO ESTABLECIDO (Paso a Paso por cada Mejora)

Para garantizar la estabilidad y no romper nada en produccion:

1. **Desarrollo Local:** Gemini realiza la modificacion de la mejora correspondiente en el codigo local.
2. **Deploy al VPS:** Gemini sube los cambios de inmediato al VPS (https://forecast.geeksoft.tech).
3. **Pausa para Feedback Humano:** Gemini se detiene y avisa al usuario para que audite visualmente los cambios en el navegador.
4. **Evaluacion del Resultado:**
   * **Caso 1: ✅ Todo salio bien:**
     * El usuario aprueba los numeros y comportamiento.
     * Gemini realiza un git add ., un git commit -m "Mejora N completada - [Descripcion]" y un git push origin main.
     * Se avanza a la siguiente mejora.
   * **Caso 2: ❌ Salio mal / No convence:**
     * Gemini ejecuta git reset --hard HEAD (o retorna al commit del tag anterior) y hace redeploy inmediato al VPS para restaurar la estabilidad.
     * Se analiza el fallo antes de volver a intentar.

---

### 🔄 Mejora 7 — Certificación del Circuito Grabar → Jalar Rutas Spot (Estimador Excel ↔ Matriz Financiera)

**Origen:** Audio de sesión transcrito con Whisper desde `CIRCUITO.GRABAR.RUTAS.JALAR.RUTAS.ogg`.

**Contexto y Problema Identificado:**
La Matriz Financiera se alimenta de dos fuentes de rutas:
1. **Rutas Fijas** → auditadas en el Voyage Ledger con todos sus costos certificados.
2. **Rutas Spot** → generadas en el Estimador Excel (`MultiCotizadorExcel`), grabadas en la BD, y jaladas en la Matriz Financiera al seleccionar un cliente SPOT.

El problema reportado: al jalar una ruta Spot en la Matriz, **no se transfiere el paquete completo de datos**, lo cual se manifiesta en costos incorrectos en el P/L.

---

**Análisis del Flujo Completo (Data Flow):**

```
GRABAR (Estimador Excel → Supabase)
  MultiCotizadorExcel.tsx
    └── handleSaveRoute()
          └── ForecastService.saveSpot()
                └── POST /api/forecast/spot/save
                      └── INSERT en tabla `routes_spot` (campo JSONB `legs_data`)

JALAR (ForecastBuilder → ForecastGrid → Backend)
  ForecastBuilder.tsx
    └── ForecastService.listSpots() → lista rutas disponibles
    └── handleAdd() → genera línea con:
          origin_port_id: "SPOT"
          destination_port_id: nombre de la ruta
          custom_tariff: flete manual (único, plano)

  forecast_service.py
    └── Para líneas con origin_port_id == "SPOT":
          └── Extrae legs_data de routes_spot
          └── Si legs_data tiene "tramos" → motor multicotizador
          └── Si no → motor SpotRouter tradicional
```

---

**Tabla `routes_spot` — Estructura Real (inspeccionada en Supabase):**

| Columna | Tipo | Notas |
|---|---|---|
| `spot_id` | UUID (PK) | Auto-generado |
| `name` | VARCHAR | Nombre de la ruta |
| `description` | TEXT | |
| `legs_data` | **JSONB** | Cajón flexible — contiene todo el paquete |
| `created_at` | TIMESTAMP | Auto |
| `pais` | TEXT | "Peru" o "Chile" |

**Conclusión sobre la tabla:** La tabla NO es el problema. El campo `legs_data` JSONB es infinitamente flexible. El problema estaba en QUÉ datos se metían en ese cajón al grabar, y QUÉ datos leía el backend al jalar.

---

**5 Gaps Identificados (antes del fix):**

| # | Campo que se perdía | Causa |
|---|---|---|
| 1 | `manual_port_cost` | El `forecast_service.py` recalculaba costos desde `port_cost_static`, ignorando el override manual grabado |
| 2 | `addressCommPct` / `brokerCommPct` | Las comisiones se grababan en el código pero no llegaban al payload del engine al recalcular |
| 3 | `vesselParams` personalizados | Se usaba el buque maestro de la BD, no los parámetros editados en el Estimador |
| 4 | `puertosConfig` (op_rate, overhead, positioning) | Nunca se mapeaban al payload del engine |
| 5 | `origin_action` / `destination_action` de cada tramo | Los tramos grabados no incluían qué acción realizaba cada puerto (CARGAR/DESCARGAR) |

**Causa raíz:** La función `handleSaveRoute` guardaba los `tramos` en su estado crudo de React (sin enrichment), mientras que `handleCalculate` sí construía un payload completo y enriquecido al llamar al engine. Existían dos versiones del dato: la rica (en memoria, para calcular) y la pobre (en BD, para persistir).

---

**Discusión: ¿Qué "Flete" debe mostrar la Matriz Financiera para rutas multi-descarga?**

Si una ruta tiene 1 carga → 3 descargas con tarifas distintas:

| Tramo | Toneladas | Flete | Ingreso |
|---|---|---|---|
| ILO → MATARANI (descarga) | 4,000 MT | $18/MT | $72,000 |
| ILO → MARCONA (descarga) | 3,000 MT | $22/MT | $66,000 |
| ILO → MEJILLONES (descarga) | 3,000 MT | $15/MT | $45,000 |
| **TOTAL** | **10,000 MT** | | **$183,000** |

**Decisión:** La tarifa que se muestra en la Matriz es el **Yield Ponderado por toneladas**:
```
yield_flete = Σ(Q_i × F_i) / Σ(Q_i) = $183,000 / 10,000 = $18.30/MT
```
Esto es matemáticamente correcto: `total_quantity × yield_flete = total_freight_revenue`.

**Consecuencia directa:** El campo **"9. Flete"** del `ForecastBuilder` pierde sentido para rutas Spot del Estimador Excel. El yield puede calcularse automáticamente desde el `legs_data`. Para rutas fijas y SpotRouter tradicional, el campo sigue siendo necesario.

---

**Fix Aplicado — Fase 1 (Completada):**

**Archivo:** `MultiCotizadorExcel.tsx` — función `handleSaveRoute`
**Commit:** `bd7b90a` — *"fix: handleSaveRoute graba paquete completo de datos enriquecidos del estimador excel"*

La función ahora construye `tramosEnriquecidos` usando exactamente la misma lógica de `handleCalculate`, incluyendo todos los campos que el engine necesita:

**Campos nuevos grabados en cada tramo:**
- `origin_action` / `destination_action` → qué hace el buque en cada puerto
- `custom_load_rate` / `custom_discharge_rate` → ritmo de operación en T/h
- `rate_unit_origin` / `rate_unit_destination` → unidad del ritmo (TH o TD)
- `port_overhead_hours_origin` / `port_overhead_hours_dest` → time to count
- `positioning_carga_hrs` / `positioning_descarga_hrs` → horas de maniobra
- `agency_costs_origin` / `agency_costs_destination` → override de costo portuario manual
- `weather_factor` → normalizado a decimal (0.05) en lugar de porcentaje (5)

**Campos ya correctos, mantenidos:**
- `addressCommPct` / `brokerCommPct` → comisiones (%) explícitas en legs_data
- `puertosConfig` → configuración visual de cada puerto (para reload en UI)
- `vesselParams` → particularidades del buque editadas en el Estimador
- `bunker_price_ifo` / `bunker_price_mdo` → precios fijados en la cotización

---

**Fase 2 (Completada):**

**Archivo:** `forecast_service.py` — bloque `ESCENARIO MULTICOTIZADOR`
**Commit:** `f76d08c` — *"fix(fase2): forecast_service multicotizador - usa legs_data completo"*

Se corrigió la lectura del JSONB `legs_data` en el backend para reconstruir fielmente la simulación multi-tramo del Estimador Excel:
1. **Respetar overrides de puertos:** Si `agency_costs_origin` o `agency_costs_destination` vienen configurados en los tramos guardados (valores mayores a 0.0), el backend los conserva tal cual en lugar de recalcularlos contra el catálogo estático.
2. **Aplicar comisiones:** Se leen `addressCommPct` y `brokerCommPct` y se deducen del Gross Revenue del viaje, afectando el cálculo final del P/L y el TCE Real.
3. **VesselParams personalizados:** Si el buque tiene consumos, velocidades o DWT editados en el Estimador Excel, se utiliza dicho objeto `vesselParams` guardado en la BD en lugar de extraer el maestro por defecto de la BD.
4. **Tarifa (Yield Ponderado):** La tarifa representativa del flete que se le pasa al inputs general del forecast es el flete promedio ponderado (`total_freight_revenue / total_laden_qty`) calculado dinámicamente sobre los tramos LADEN del viaje.

---

**Protocolo de Auditoría y Verificación:**

Se creó y ejecutó un script de verificación automatizada: [auditoria_mejora7_spot.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch/auditoria_mejora7_spot.py) con los siguientes resultados en producción:
- **Rutas Fijas Intactas:** El cálculo clásico de rutas fijas (ej. `TABLONES` en `ILO->MATARANI`) produce exactamente los mismos valores numéricos anteriores (P/L: $195,033, TCE: $47,801.35).
- **Consolidación y Yield en Engine:** Simulación con 1 carga (13,500 MT) y 2 descargas ($18 y $22) arrojó un Yield Flete exacto de **$19.926/MT** ($269,000 de ingreso bruto) y detectó correctamente la deducción esperada por comisiones de 3%.
- **Robustez ante Datos Históricos:** Al jalar rutas antiguas sin campos enriquecidos, el backend no produce error (HTTP 200) y realiza un fallback elegante, mientras que al jalar rutas nuevas, aplica toda la data enriquecida.

---

**Fase 3 - Bloqueo de Campos en UI (Completada):**

**Archivo:** `ForecastBuilder.tsx`
**Propósito:** Evitar contradicciones lógicas. Dado que las rutas complejas (multicotizador) están atadas al buque, cantidades y yield ponderado con los que fueron calculadas originalmente (Opción B de diseño), el builder debe impedir que el usuario altere estos campos en el selector del forecast.

Se implementó el comportamiento en el componente:
1. **Detección Automática:** Se evalúa reactivamente si la ruta seleccionada de Nexa (`client === 'NEXA'`) es de tipo multicotizador (`legs_data.is_multicotizador === true`).
2. **Autocompletado de Campos:**
   - **Buque:** Se autoselecciona el `vessel_id` original de la cotización.
   - **TM/viaje (Cantidad):** Se calcula e introduce la suma de las cantidades de todos los tramos de tipo `LADEN` (cargados).
   - **Flete (Yield Ponderado):** Se calcula el yield promedio ponderado de los tramos (`revenue / qty`) y se refleja en el campo.
3. **Bloqueo Visual:**
   - Se deshabilitan los controles de **Buque**, **TM/viaje** y **Flete** (`disabled={isComplexRoute}`) cuando la ruta cargada es compleja.
   - El placeholder de flete cambia a "Yield Auto".
4. **Validación en handleAdd:** Se exceptúa la obligatoriedad del flete manual si es una ruta compleja, permitiendo añadirla con el yield calculado de forma transparente.

---

**Alcance del Cambio:**
- `[x]` Analizar el flujo completo de datos: Estimador Excel → `routes_spot` (JSONB) → `forecast_service.py` → engine.
- `[x]` Identificar los 5 gaps de datos perdidos al grabar/jalar.
- `[x]` Inspeccionar tabla `routes_spot` en Supabase para confirmar estructura real y datos existentes.
- `[x]` Corregir `handleSaveRoute` en `MultiCotizadorExcel.tsx` para grabar el paquete enriquecido completo (Fase 1).
- `[x]` Corregir `forecast_service.py` para consumir correctamente el `legs_data` completo al jalar (Fase 2).
- `[x]` Decidir e implementar la lógica de yield ponderado como tarifa representativa en la Matriz.
- `[x]` Validar retrocompatibilidad con fallbacks para rutas históricas sin datos enriquecidos.
- `[x]` Implementar Opción B en backend e inhabilitar selectores de buque/flete/cantidad en la UI de ForecastBuilder para rutas complejas (Fase 3).

**Git snapshots:**
- `896a1f1` → pre-mejora snapshot (antes del fix)
- `bd7b90a` → fix handleSaveRoute: paquete completo de datos enriquecidos (Fase 1)
- `f76d08c` → fix forecast_service: integración de legs_data completo y comisiones (Fase 2)
- `99789dd` → docs: actualizar MEJORAS y agregar script de auditoria
- `92eef85` → feat(fase3): forecast_builder - bloquear y autocompletar buque/TM/flete si es ruta compleja (Nexa)
