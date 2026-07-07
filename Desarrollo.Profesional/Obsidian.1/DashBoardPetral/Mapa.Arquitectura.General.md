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


