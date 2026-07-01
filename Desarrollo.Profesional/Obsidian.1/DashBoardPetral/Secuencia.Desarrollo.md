
## Secuencia de Construcción Estricta

El agente de programación debe leer e implementar el sistema siguiendo estos 3 pasos secuenciales:

### 🗂️ PASO 1: Inicialización de la Base de Datos (Tablas Maestras)

Estas notas contienen los datos estáticos de infraestructura e ingeniería. Deben crearse primero en Supabase:

1. **[[Maestro.Flota]]**: Define los barcos activos, sus consumos de IFO y MDO granulares (`consumption_sea`, `_idle`, `_load`, `_disch`), parámetros físicos (`loa`, `beam`) y sus capacidades hidráulicas reales (`vessel_max_load_intake_limit`, `vessel_pump_discharge_rate`).
    
2. **[[Maestro.Rutas]]**: Cartografía los tramos marítimos oficiales, registrando las distancias en millas náuticas (`route_distance`) y los factores de fricción climática (`weather_factor_laden`).
    
3. **[[Maestro.Aduanas]]**: Configura la matriz relacional de costos aduaneros cruzada por `client_id` + `port_id` + `operation_type` para garantizar descuentos por volumen.
    
4. **[[Maestro.Contratos]]**: Define la tabla cabecera (`contracts`) que aloja las reglas del bunker (**BAF**) a través de un campo `JSONB` flexible, y establece los parámetros base (`bunker_baseline_price`) y tiempos operativos de Laytime.
    
5. **[[Matriz.Tarifas]]**: Define la tabla hija (`contract_tariffs`) que se subordina al contrato maestro. Almacena los brackets o rangos comerciales de tonelaje (`min_tonnage` y `max_tonnage`) por destino para jalar el flete base automático de los clientes.
    
6. **[[Modelo.E-R]]**: Contiene la especificación de llaves primarias (PK), foráneas (FK) y constraints de la base de datos PostgreSQL.
    

### ⚙️ PASO 2: Compilación y Despliegue del Motor (Estrategia No-GUI)

- **[[Estrategia.Desarrollo.Etapa.1]]**: Especifica el método GUI-LESS para probar el motor en FastAPI mediante `pytest` sin pantallas intermedias y generar el Libro de Cálculo Blanco (White-Box Math Ledger) en PDF.
    
- **[[Voyage.Calculation.Tablones]]**: El motor algorítmico definitivo. Recibe el JSON, resuelve los cuellos de botella mediante la regla del **Triple Mínimo** (`MIN`), procesa la cláusula BAF y entrega los KPIs.
    

### 🖥️ PASO 3: La Fase de Conexión de Cables e Interfaz

- **[[Plan.Etapa.2.Mockups]]**: Define el flujo inicial para la validación de mockups visuales y la separación del entorno `Geeksoft_Frontend`.

- **[[Estrategia.Desarrollo.Etapa.2]]**: Define la construcción del frontend definitivo con React, Vue, Tailwind CSS y la visualización de analítica avanzada conectada a Apache ECharts.
    

## 🏁 Criterio de Verificación de la Arquitectura

> **Injunción para el Agente:** "Antes de dar por cerrado el módulo, el backend debe ejecutar de forma obligatoria el test unitario descrito en la sección 4 de [[Voyage.Calculation.Tablones]]. Si al enviar 13,500 MT a Matarani el sistema no converge exactamente en un `total_duration` de **3.769205 días** y un `voyage_result` de **$201,175.39 USD**, la base de datos se considerará corrupta y el despliegue será rechazado."

### ¿Cómo se cruzan en la base de datos?

Para que los programadores visualicen cómo se conectan las tablas en **Supabase** antes de picar el código, la jerarquía funciona así:

1. El usuario entra al formulario de viaje de la UI.
    
2. Selecciona un Cliente (ej. `SPCC`) y un Destino (ej. `MATARANI`).
    
3. Digita una Cantidad (ej. `13,500 MT`).
    
4. El sistema hace un _Lookup_ automático en la tabla hija **`[[Matriz.Tarifas]]`** (`contract_tariffs`) buscando el tonelaje inyectado en los brackets de `min_tonnage` y `max_tonnage` del contrato padre para inyectar el `freight_rate` base (ej. **`$19.01 USD`**).
    
5. Si el switch de bunker está encendido (en la etapa de Liquidación), el motor lee el campo `baf_rules` de tipo `JSONB` de la tabla cabecera **`[[Maestro.Contratos]]`** (`contracts`), evaluando si se dispara el umbral del 5% del `bunker_baseline_price` para recalcular la tarifa usando la fórmula del BAF y salvaguardar el TCE base.
    
6. Al mismo tiempo, el sistema consulta **`[[Maestro.Aduanas]]`** para traer los costos portuarios preferenciales de ese cliente en esa ruta.