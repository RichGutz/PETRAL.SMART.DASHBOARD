# 🗺️ Mapa de Arquitectura General y Dependencias — Motor Geeksoft

Esta nota indexa el orden secuencial de lectura, inyección de dependencias y flujo de datos para la implementación del motor de P&L en **Supabase** y el frontend en **React**. Los agentes de desarrollo deben procesar los archivos en el orden estricto detallado a continuación.

## 🔄 Flujo de Datos del Sistema (Data Pipeline)

Plaintext

```
Capas Maestras (BBDD / Supabase)       Estrategia Backend (No-GUI)      Interfaz Producción (Cables)
  [[Maestro.Flota]]     -----\
  [[Maestro.Rutas]]     ------\
  [[Maestro.Contratos]] -------> [[Estrategia.Desarrollo.Etapa.1]] ---> [[Estrategia.Desarrollo.Etapa.2]]
  [[Matriz.Tarifas]]    -----/       (Engine + PDF Ledger)              (React + Contabo)
```

## 📌 Secuencia de Construcción Estricta

El agente de programación debe leer e implementar el sistema siguiendo estos 3 pasos secuenciales:

### 🗂️ PASO 1: Inicialización de la Base de Datos (Tablas Maestras)

Estas notas contienen los datos estáticos de infraestructura e ingeniería. Deben crearse primero en Supabase:

**Tablas vigentes según [[Modelo.E-R]] (actualizado 2026-07-06):**

1. **`vessels`** — [[Maestro.Flota]]: Barcos activos, consumos granulares IFO/MDO, parámetros físicos y capacidades hidráulicas.
2. **`bunker_prices`**: Precios de mercado de combustible (IFO / MDO) con fecha de cotización vigente.
3. **`routes`** — [[Maestro.Rutas]]: Tabla maestra de rutas. Se proyecta como la tabla única de circuitos multileg creados en el multicotizador.
4. **`routes_master`**: Nueva tabla unificada para almacenar cotizaciones y circuitos multileg estructurados por combinación de Cliente, Puertos y Buque (`CLIENTE.PUERTOS.BUQUE`). Sirve como repositorio central para las rutas regulares (como las redondas de SPCC) y cotizaciones complejas.
5. **`ports`**: Límites operativos de terminales — tasa máxima de carga/descarga, maniobras portuarias.
6. **`clients`** — Maestro de Clientes Corporativos.
7. **`port_costs_matrix`** — [[Matriz.Costos.Portuarios]]: Costos portuarios desglosados por cliente, puerto, terminal y tipo de operación.
8. **`port_cost_concepts`**: Catálogo maestro de conceptos de costos portuarios.
9. **`port_cost_static`**: Fallback estático consolidado de costos de puerto (duplicación de respaldo de `agency_matrix`).
10. **`agency_matrix`**: Historial consolidado de costos de agencia (respaldo).
11. **`contracts`** — [[Maestro.Contratos]]: Parámetros comerciales, comisiones (Address & Broker) y cláusula BAF.
12. **`contract_tariffs`** — [[Matriz.Tarifas]]: Brackets de flete por tonelaje y destino para extracción automática.
13. **`audit_benchmarks`**: Valores reales del Excel de Petral usados como benchmark en el Voyage Ledger.
14. **`commercial_forecasts`**: Tabla transaccional que almacena los escenarios y corridas completas de forecast grabados.
15. **`vessel_trips`**: Tabla transaccional que contiene los viajes concretos realizados o proyectados por la flota.
16. **`sources_sinks`**: Capacidad anual de volumen de ácido por puerto y año para balances.
17. **[[Modelo.E-R]]**: Contiene la especificación completa de PKs, FKs y constraints de PostgreSQL/Supabase.
18. **[[Glosario.Variables.Negocio]]**: Diccionario conceptual de variables comerciales, operativas y navales.
    

### 🖥️ PASO 2: La Fase Transaccional (Frontend UI)

- **`[[Módulo UI - Ingreso Rápido de Viaje]]`**: Formulario dinámico de captura de datos. Al seleccionar un buque, cliente y destino, el frontend debe realizar lookups automáticos a las tablas del Paso 1.
    

### ⚙️ PASO 3: Compilación y Despliegue del Motor (Logística y Financiero)

- **[[Voyage.Calculation.Tablones]]**: El motor definitivo. Recibe el JSON de la UI, resuelve las ecuaciones de cuellos de botella mediante la regla del **Triple Mínimo** (`MIN`), procesa la **Cláusula BAF** vía inversión analítica (Goal Seek) y entrega el estado de resultados con los KPIs para Apache ECharts.
    

## 🏁 Criterio de Verificación de la Arquitectura

> **Injunción para el Agente:** "Antes de dar por cerrado el módulo, el backend debe ejecutar de forma obligatoria el test de convergencia del Ledger. Si al enviar 13,500 MT a Matarani (Laden) con buque MOQUEGUA el sistema no converge exactamente en un `total_duration` de **4.0801 días** (Mar: 0.5384 d, Puerto: 3.5417 d), un `port_costs` de **$39,000.00 USD**, un `bunker_costs` de **$18,560.53 USD** y un `voyage_result` neto (después de deducir comisiones si aplican) cercano a **$195,033 USD** y un TCE de **$47,801.35 USD**, el motor se considerará descalzado y el despliegue será rechazado."

Al dejar este archivo indexador, cuando abras **Antigravity IDE** y le digas al agente: _"Lee el mapa de arquitectura general"_, la IA va a entender perfectamente la jerarquía de las tablas, no te va a mezclar las variables en Supabase, y sabrá exactamente contra qué números testear el código para que no falle nada.

### 🔄 Lógica de Simulación de Rutas Unificadas

Con la arquitectura de base de datos consolidada, toda ruta en el sistema se genera a través de la secuencia de tramos del **Multicotizador**. Cuando un viaje se simula en la Matriz Financiera, el flujo de datos e inyección de dependencias opera así:

1. **Selección del Usuario:** El usuario nomina un viaje eligiendo **Cliente** (ej. `SPCC`), **Ruta** (ej. `ILO.MATARANI.ILO`) y **Buque** (ej. `MOQUEGUA`).
2. **Búsqueda del Circuito (`routes_master`):** El sistema arma la llave de búsqueda única `${CLIENTE}.${PUERTOS}.${BUQUE}` (ej. `SPCC.ILO.MATARANI.ILO.MOQUEGUA`) y consulta la tabla `routes_master`.
3. **Inyección Dinámica de Variables:**
   - **Buque Nombrado:** Si el usuario cambia el buque en la grilla de la matriz (ej. a `TABLONES`), el backend reemplaza las velocidades y consumos del buque original por las del nuevo buque nominado en caliente.
   - **Búnker Dinámico:** Se inyectan los precios de combustible vigentes en la simulación activa de la matriz (ej. IFO/MDO editados en el panel superior) sobre los tramos del viaje.
   - **Costos de Puerto:** Si la cotización tiene costos manuales en `0.0` (dinámicos), el backend calcula los costos de puerto en caliente aplicando el selector de modo de costo portuario (`static` o `matrix`) de la matriz y el barco nominado.
4. **Ejecución del Motor:** El backend corre la simulación del multicotizador (`calculate_multicotizador_simulation`) entregando las toneladas exactas, días de viaje y el P&L consolidado para esa línea de la Matriz.

🚀 **Control de Ejecución:** El flujo de trabajo y la inicialización detallada de las tablas en Supabase se sincronizan formalmente desde la guía de: **[[Secuencia.Desarrollo]]**.

---

### 🕵️‍♂️ Verificación final de lo que acabamos de asegurar:
1. El motor algorítmico apunta a tu archivo real: **`[[Voyage.Calculation.Tablones]]`**.
2. Se eliminaron las referencias al concepto legacy de "ruta spot" segregada, integrando todo bajo la tabla `routes_master` cruzada con la Matriz.
3. Se detalló el flujo de inyección dinámica para barcos nominados, búnker dinámico y modo de costos portuarios (`static` vs `matrix`).


---

## 🔬 Diagnóstico e Investigación Profunda — Sesión 2026-07-07

> **Autor del análisis:** Antigravity (Gemini 3.5 Flash / Claude Sonnet 4.6)
> **Commits generados:** `94de99a`

Esta sección documenta los hallazgos de la investigación técnica profunda realizada durante la sesión de debugging del sistema de recálculo de la Matriz Financiera.

---

### ⚡ Problema 1: Edición del Flete bloqueada (rebote inmediato)

**Síntoma:** Al escribir un nuevo valor en la celda "Flete (USD/MT)" dentro del desplegable de Viajes, el valor rebotaba de inmediato al valor anterior sin poder editarse.

**Causa raíz:** Las celdas de la sub-fila "Flete (USD/MT)" leían su valor directamente del objeto `data` retornado por la última simulación del backend (`flete_unit`). Como el recálculo automático fue desactivado (para evitar loops), el backend no se llamaba al tipear. En el siguiente render de React, el componente sobreescribía lo escrito con el valor viejo de la simulación.

**Archivos afectados:**
- `Geeksoft_Frontend/src/components/CommercialForecast/ForecastGrid.tsx`

**Fix aplicado:** La celda "Flete (USD/MT)" ahora lee prioritariamente `line.custom_tariff` desde el estado React `projectionLines` (en caliente) en lugar del objeto `data` del servidor. Si `custom_tariff` está definido, se usa; si no, cae al valor del servidor.

---

### 🏎️ Problema 2: Recálculo tardaba 2+ minutos

**Síntoma:** Al presionar "Recalcular", el spinner se quedaba activo durante 1-2 minutos antes de responder.

**Investigación realizada:**
- Test de velocidad HTTP directo al backend: `3.49s` primera llamada
- Conteo de filas en Supabase: 9 tablas, **191 filas** en `port_costs_matrix`
- Cada llamada a `run_forecast_simulation` y `run_forecast_simulation_universal` hacía **9 round-trips sincrónicos a Supabase** antes de hacer cualquier cálculo

**Arquitectura del cuello de botella:**

```
Usuario → Recalcular → POST /forecast/run
  → safe_fetch(supabase, "vessels")           ← round-trip 1
  → safe_fetch(supabase, "routes")            ← round-trip 2
  → safe_fetch(supabase, "routes_master")     ← round-trip 3
  → safe_fetch(supabase, "bunker_prices")     ← round-trip 4
  → safe_fetch(supabase, "ports")             ← round-trip 5
  → safe_fetch(supabase, "contracts")         ← round-trip 6
  → safe_fetch(supabase, "contract_tariffs")  ← round-trip 7
  → safe_fetch(supabase, "port_costs_matrix") ← round-trip 8 (191 filas)
  → safe_fetch(supabase, "port_cost_static")  ← round-trip 9
  → [calcula P&L] → responde
```

**Fix aplicado — Cache en Memoria con TTL 30s:**
Se creó `get_cached_masters()` en `forecast_service.py` que almacena las 9 tablas en un diccionario Python en memoria del proceso Uvicorn. Las tablas se re-fetchen automáticamente solo si han pasado más de 30 segundos desde la última carga.

**Resultado de velocidad medido:**

| Corrida | Tipo | Tiempo |
|---|---|---|
| 1ª | Cache MISS (primera vez) | 2.6s |
| 2ª | Cache HIT | 0.0001s |
| 3ª | Tras limpiar caché | 1.18s |

**Warm-up al arrancar:** Se agregó un `lifespan` hook en `backend/main.py` que precalienta el caché cuando Uvicorn arranca, eliminando el cold start.

---

### 🔁 Problema 3: "Cuelgue" al Recalcular tras editar Flete

**Síntoma:** Después de editar el flete, al hacer clic en "Recalcular" el spinner se quedaba activo por mucho tiempo.

**Causa — dos capas encadenadas:**

**Capa 1: React StrictMode (modo desarrollo)** ejecuta cada `useEffect` dos veces intencionalmente. Al montar el componente se lanzaban **2 requests simultáneas** al backend.

**Capa 2: Uvicorn single-worker en `--reload`** atiende las requests en cola secuencialmente:
- Request 1: se procesa (3.5s)
- Request 2: espera en cola → se procesa (3.5s más)
- Total percibido por el usuario: **7 segundos de "cuelgue"**

**Fix aplicado:** `AbortController` en `ForecastContext_V2.tsx`. Si se lanza una nueva simulación antes de que termine la anterior, la primera se cancela inmediatamente:

```tsx
// Cancelar cualquier request anterior en vuelo
if (abortControllerRef.current) {
    abortControllerRef.current.abort();
}
const controller = new AbortController();
abortControllerRef.current = controller;

// Solo actualizar estado si este request no fue cancelado
if (!controller.signal.aborted) {
    setData(result);
    setIsDirty(false);
}
```

---

### 🗺️ Rutas Fantasma de SPCC — Fix confirmado

**Síntoma:** Al seleccionar SPCC aparecían rutas cruzadas e invertidas (ILO-MATARANI y MATARANI-ILO mezcladas).

**Causa:** El `useMemo` de `clientRoutes` en `ForecastBuilder_V2.tsx` recorría `spotRoutes` de la base de datos y `routes_master` contenía combinaciones bidireccionales que duplicaban las rutas.

**Fix:** Early return con las 3 rutas fijas oficiales de SPCC:
```tsx
if (selectedClient === 'SPCC') {
    return ['ILO-MATARANI', 'ILO-MARCONA', 'ILO-MEJILLONES'];
}
```

---

### 📐 Tabla de Archivos Modificados — Sesión 2026-07-07

| Archivo | Cambio | Impacto |
|---|---|---|
| `backend/main.py` | Warm-up de caché al startup (lifespan hook) | Primera request instantánea tras reiniciar |
| `backend/services/forecast_service.py` | Cache TTL 30s para las 9 tablas maestras | Recálculo ~3.5s → <0.5s en cache hit |
| `src/context/ForecastContext_V2.tsx` | AbortController + useRef mutex | Elimina "cuelgue" por requests en cola |
| `src/components/CommercialForecast/ForecastGrid.tsx` | Flete lee desde `projectionLines.custom_tariff` | Edición de flete sin rebote |
| `src/components/CommercialForecast/ForecastBuilder_V2.tsx` | Early return rutas SPCC | Elimina rutas fantasma |
| `src/components/CommercialForecast/ForecastBuilder.tsx` | Early return rutas SPCC | Consistencia V1/V2 |

---

### 🧠 Patrones Arquitectónicos Críticos Descubiertos

1. **Dos versiones del motor de UI corren en paralelo:**
   - `CommercialForecast.tsx` (legacy, `/dashboard`) → `useEffect` depende de `projectionLines` **completo** → reactivo a cualquier cambio de celda → **NO usar en producción**
   - `ForecastContext_V2.tsx` (App V2 activa) → `useEffect` depende de `projectionLines.length` → solo reactivo a agregar/eliminar filas

2. **La App activa en producción es `App_V2.tsx`** — montada desde `main.tsx`. El archivo `App.tsx` es legacy y **NO se usa** en producción.

3. **El endpoint `/forecast/run`** usa `run_forecast_simulation` (rutas tradicionales + multicotizador vía `routes_master`). El endpoint `/forecast/run_universal` usa `run_forecast_simulation_universal`. Ambos comparten el mismo caché.

4. **La tabla `port_costs_matrix` con 191 filas** es el principal cuello de botella de `calculate_detailed_port_costs`. Cada lookup es O(n) sobre 191 filas. El caché elimina el round-trip a Supabase. Si el volumen crece, se debería pre-indexar con un diccionario `{(client_id, port_id, operation_type): [rows]}` construido en memoria al cargar el caché.

5. **`handleTariffChange` en ForecastContext_V2** aplica `custom_tariff` a **todos los meses** de la misma combinación cliente+ruta+buque con un `.map()`. Esto es correcto y por diseño (el flete es un parámetro de contrato, no mensual).

---

## 🔬 Diagnóstico Profundo — Sesión 2026-07-07 (Ronda 2)

> **Autor del análisis:** Antigravity (Claude Sonnet 4.6 Thinking)
> **Problema:** Recálculo tardaba "para siempre" a pesar de los fixes de la sesión anterior.

### 🧪 Benchmark HTTP Directo al Backend (Pre-fix)

Test con payload de 1 línea (SPCC / MOQUEGUA / ILO-MATARANI / 13,500 MT):

| Corrida | Worker | Tipo | Tiempo |
|---|---|---|---|
| 1ª | Worker 1 | Cache MISS (frío) | **3.931s** |
| 2ª | Worker 2 | Cache MISS (frío) | **3.014s** |
| 3ª | Worker 1 | Cache HIT | **1.120s** |
| 4ª | Worker 2 | Cache HIT | **0.793s** |

### 🧠 Causa Raíz Real — Dos Capas

**Capa 1: AbortController era un fantasma**
El `AbortController` creado en `ForecastContext_V2.tsx` creaba una `signal` correctamente, pero esta señal **NUNCA se pasaba a axios**. El `ForecastService.runSimulation(payload)` llamaba a axios sin la `{ signal }` en el config. Resultado: cuando el usuario hacía click en Recalcular dos veces rápido, ambas requests HTTP corrían en paralelo en el backend de forma irrecuperable.

```ts
// ANTES (roto) — signal creada pero ignorada:
const result = await ForecastService.runSimulation(requestPayload);

// DESPUÉS (correcto) — signal conectada al HTTP:
const result = await ForecastService.runSimulation(requestPayload, controller.signal);
```

**Capa 2: 2 workers = 2 cachés fríos independientes**
Al usar `--workers 2`, cada proceso Uvicorn mantiene su propio diccionario `_masters_cache` en memoria RAM. Las primeras 2 requests (una por worker) siempre pagaban el cold start de ~3-4s cada una. El warm-up del lifespan hook solo calienta el worker que lo ejecuta.

```
Worker 1: lifespan warm-up → caché ✅
Worker 2: primer request → cold start de 3s 🐌
```

### ✅ Fixes Aplicados — Sesión Ronda 2

| Archivo | Cambio |
|---|---|
| `src/services/api.ts` | `runSimulation` y `runSimulationUniversal` aceptan `signal?: AbortSignal` y lo pasan a `axios.post(..., { signal })` |
| `src/context/ForecastContext_V2.tsx` | Se pasa `controller.signal` a `ForecastService.runSimulation(payload, controller.signal)` — el AbortController ahora cancela el HTTP real |
| `src/context/ForecastContext_V2.tsx` | Se eliminó `portCostMode` de las dependencias del `useEffect` — se reemplazó con `portCostModeRef` (ref pattern) para evitar disparos dobles |
| `Push.VPS/deploy_engine_vps.py` | Volver a `--workers 1` — 1 caché único, siempre caliente tras el primer request post-reinicio |

### 🧪 Benchmark HTTP Directo al Backend (Post-fix)

| Corrida | Tipo | Tiempo |
|---|---|---|
| 1ª | Cache HIT (worker único, ya caliente) | **0.736s** |
| 2ª | Cache HIT | **0.713s** |
| 3ª | Cache HIT | **0.730s** |
| 4ª | Cache HIT | **0.732s** |

### 🔑 Regla Arquitectónica Crítica (nueva)

> **El AbortController de React SOLO cancela la espera del lado del cliente (la promesa JS). Para que cancele la request HTTP real, la `signal` DEBE pasarse como `{ signal }` en el config de axios/fetch. Sin esto, el backend sigue procesando y las requests se apilan.**

6. **Uvicorn con `--workers 1` + caché en memoria** es la configuración correcta para este sistema. Con múltiples workers, el caché en RAM se fragmenta y cada worker paga su propio cold start. Para escalar horizontalmente en el futuro, se debe migrar el caché a **Redis** (`redis-py` + TTL 30s) en lugar de variables Python en memoria.

---

## 🔬 Diagnóstico y Correcciones — Sesión 2026-07-08

> **Autor del análisis:** Antigravity (Claude Sonnet 4.6 Thinking)
> **Commits generados:** `a6beb3e`, `1f8375b`, `f651ff2`

---

### ⚡ Bug 1: Anomalía Visual en Yield de Enero 2027 — Duplicidad de `projectionLines`

**Síntoma:** En la columna de Enero 2027 de la Matriz Financiera (escenario `PB 2027`, ruta `ILO-MARCONA`, buque `MOQUEGUA`, cliente `SPCC`), la grilla pintaba **1 viaje** y **13,500 MT**, pero los campos financieros correspondían a **2 viajes** (`Gross Revenue: $616,140`), disparando el `Yield Flete` a `$32.33 USD/MT` en lugar del correcto `$20.92 USD/MT`.

**Causa Raíz — 3 capas encadenadas:**

1. **Indexación incompleta en `handleFrequencyChange`:** La función usaba `route_key.split('-')[1]` para obtener solo el `destination_port_id`. Al comparar solo destino + vessel + client + month (sin el `origin_port_id`), `findIndex` podía fallar en rutas con destinos compartidos o al haber colisiones. El índice devuelto (`-1`) activaba el bloque `else if`, que **insertaba una nueva línea duplicada** (freq=1) en lugar de actualizar la existente (freq=2).

2. **Desincronización UI vs Backend:** La grilla del navegador buscaba la primera coincidencia en `projectionLines` → encontraba la nueva línea duplicada → pintaba **1 viaje** en pantalla. Pero al simular, el frontend enviaba al backend **ambas líneas** (la original con freq=2 + la nueva con freq=1).

3. **Sobreescritura en agregación del backend:** En `forecast_service.py`, el diccionario de agregación usa `agg_data[client][route_key][vessel][month] = monthly_result`. Al procesar ambas líneas de Enero, el resultado de la línea con freq=2 sobreescribía al de freq=1. El frontend recibía la respuesta financiera de 2 viajes mientras mostraba visualmente 1.

**Corrección aplicada — `CommercialForecast.tsx`:**

```typescript
// ANTES (incompleto — solo destination_port_id):
const destination_port_id = route_key.split('-')[1];
const existingIndex = prev.findIndex(p =>
    p.month_index === month_index &&
    p.vessel_id === vessel_id &&
    p.destination_port_id === destination_port_id && // ← faltaba origin
    p.client_id === client_id
);

// DESPUÉS (completo — origin + destination):
const parts = route_key.split('-');
const origin_port_id = parts[0];
const destination_port_id = parts[1];
const firstMatchIndex = prev.findIndex(p =>
    p.month_index === month_index &&
    p.vessel_id === vessel_id &&
    p.origin_port_id === origin_port_id &&    // ← añadido
    p.destination_port_id === destination_port_id &&
    p.client_id === client_id
);
// + limpieza en caliente de duplicados residuales al actualizar
```

También se implementó **deduplicación automática en `handleLoadSelected`** usando un `Map` con llave compuesta `client-origin-dest-vessel-month` para curar inconsistencias históricas al cargar escenarios desde Supabase.

**Regla Arquitectónica derivada:**

> Todo `findIndex` o `find` sobre `projectionLines` debe validar **siempre** los 5 campos de llave: `client_id`, `origin_port_id`, `destination_port_id`, `vessel_id`, `month_index`. Omitir cualquiera introduce el riesgo de colisiones y duplicados silenciosos que desincronizen la UI del backend.

---

### ⚡ Bug 2: Selector de Cliente en `ForecastBuilder_V2` no mostraba SPCC

**Síntoma:** Al intentar agregar una nueva línea de ruta SPCC a un escenario ya cargado en la Matriz Financiera (`ToolsLayout_V2`), el selector de "Cliente" solo mostraba NEXA (y SPOT). SPCC era invisible.

**Causa Raíz:** El `useEffect` de carga del `ForecastBuilder_V2` construía la lista de clientes disponibles filtrando **únicamente** los registros de la tabla `spots` con bandera `is_multicotizador === true`. Las rutas de SPCC (`ILO-MATARANI`, `ILO-MARCONA`, `ILO-MEJILLONES`) son simples y están hardcodeadas directamente en el `useMemo` de `clientRoutes`, no en la tabla `spots`. Por lo tanto SPCC nunca aparecía en la lista dinámica.

**Corrección aplicada — `ForecastBuilder_V2.tsx`:**

```typescript
// ANTES — solo clientes dinámicos de spots (SPCC nunca aparecía):
const uniqueClients = Array.from(new Set(clientIds));
setAvailableClients(uniqueClients);

// DESPUÉS — SPCC fijo + dinámicos de spots (NEXA, etc.):
const fixedClients = ['SPCC'];
const allClients = Array.from(new Set([...fixedClients, ...dynamicClientIds]));
setAvailableClients(allClients);
```

**Regla Arquitectónica derivada:**

> Los clientes con rutas simples hardcodeadas (actualmente solo `SPCC`) deben declararse como **fijos garantizados** en el `ForecastBuilder_V2`. Los clientes con rutas multicotizador complejas (NEXA y futuros) aparecen dinámicamente desde la tabla `spots`. Esta separación debe mantenerse explícita al agregar nuevos clientes al sistema.

---

### 🖼️ Mejora: Actualización de Asset Visual

- Imagen del **B/T MOQUEGUA** en el Maestro de Buques (`VesselsMaster.tsx` / `VesselsMaster_V2.tsx`) actualizada por la fotografía oficial a color.
- Ruta: `public/moquegua_1.jpg` (reemplazo in-place, sin cambio de nombre en el código fuente).

### ✅ Resumen de Fixes — Sesión 2026-07-08

| Archivo | Cambio |
|---|---|
| `src/pages/CommercialForecast/CommercialForecast.tsx` | `handleFrequencyChange` y `handleTariffChange` — comparación simétrica `origin_port_id` + `destination_port_id` + deduplicación en caliente |
| `src/pages/CommercialForecast/CommercialForecast.tsx` | `handleLoadSelected` — deduplicación automática de `projectionLines` al cargar escenarios |
| `src/components/CommercialForecast/ForecastBuilder_V2.tsx` | Clientes del selector: `SPCC` agregado como fijo; SPOT retirado |
| `public/moquegua_1.jpg` | Fotografía oficial del B/T MOQUEGUA actualizada |

