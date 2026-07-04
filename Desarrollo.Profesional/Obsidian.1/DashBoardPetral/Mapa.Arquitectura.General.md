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

**Tablas vigentes según [[Modelo.E-R]] (actualizado 2026-07-04):**

1. **`vessels`** — [[Maestro.Flota]]: Barcos activos, consumos granulares IFO/MDO, parámetros físicos y capacidades hidráulicas.
2. **`bunker_prices`**: Precios de mercado de combustible (IFO / MDO) con fecha de cotización vigente.
3. **`routes`** — [[Maestro.Rutas]]: Tramos marítimos, distancias en millas náuticas y factores de fricción climática.
4. **`routes_spot`**: Catálogo de rutas spot multileg (posicionamiento + laden + retorno) para clientes como NEXA.
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

### ¿Cómo se cruzan en la base de datos?

Para que los programadores visualicen cómo se conectan las tablas en **Supabase** antes de picar el código, la jerarquía funciona así:

1. El usuario entra al formulario de viaje de la UI.
    
2. Selecciona un Cliente (ej. `SPCC`) y un Destino (ej. `MATARANI`).
    
3. Digita una Cantidad (ej. `13,500 MT`).
    
4. El sistema hace un _Lookup_ automático en la tabla relacional de **`[[Matriz.Tarifas]]`** (`contract_tariffs`) cruzando esas cuatro llaves (`contract_id` + `origin_port_id` + `destination_port_id` + `quantity`) para inyectar el `freight_rate` base (ej. **`$19.01 USD`**).
    
5. Si el switch de bunker está encendido, el motor aplica las reglas de **`[[Maestro.Contratos]]`**, evaluando si se dispara el umbral del BAF para recalcular la tarifa.
    
6. Al mismo tiempo, el sistema consulta **`[[Matriz.Costos.Portuarios]]`** (`port_costs_matrix` / `port_cost_static`) para traer los costos portuarios preferenciales de ese cliente en esa ruta.
    

🚀 **Control de Ejecución:** El flujo de trabajo y la inicialización detallada de las tablas en Supabase se sincronizan formalmente desde la guía de: **[[Secuencia.Desarrollo]]**.

---

### 🕵️‍♂️ Verificación final de lo que acabamos de asegurar:
1. El motor algorítmico apunta a tu archivo real: **`[[Voyage.Calculation.Tablones]]`** (eliminamos el `_3` fantasma que estaba escrito en tu nota anterior).
2. Se añadieron los enlaces directos a **`[[Modelo.E-R]]`** y a **`[[Matriz.Tarifas]]`** que no estaban vinculados en tu nota previa.
3. Al final de la nota, la línea del cohete se ancla directamente a **`[[Secuencia.Desarrollo]]`**, lo que automatiza la secuencia.

