# 🗺️ Mapa de Arquitectura General y Dependencias — Motor Geeksoft

Esta nota indexa el orden secuencial de lectura, inyección de dependencias y flujo de datos para la implementación del motor de P&L en **Supabase** y el frontend en **React**. Los agentes de desarrollo deben procesar los archivos en el orden estricto detallado a continuación.

## 🔄 Flujo de Datos del Sistema (Data Pipeline)

Plaintext

```
Capas Maestras (BBDD / Supabase)       Estrategia Backend (No-GUI)      Interfaz Producción (Cables)
  [[Maestro.Flota]]     -----\
  [[Maestro.Rutas]]     ------\
  [[Maestro.Aduanas]]   -------> [[Estrategia.Desarrollo.Etapa.1]] ---> [[Estrategia.Desarrollo.Etapa.2]]
  [[Maestro.Contratos]] ------/       (Engine + PDF Ledger)              (React + Contabo)
  [[Matriz.Tarifas]]    -----/
```

## 📌 Secuencia de Construcción Estricta

El agente de programación debe leer e implementar el sistema siguiendo estos 3 pasos secuenciales:

### 🗂️ PASO 1: Inicialización de la Base de Datos (Tablas Maestras)

Estas notas contienen los datos estáticos de infraestructura e ingeniería. Deben crearse primero en Supabase:

1. **[[Maestro.Flota]]**: Define los barcos activos, sus consumos de IFO y MDO granulares (`consumption_sea`, `_idle`, `_load`, `_disch`), parámetros físicos (`loa`, `beam`) y sus capacidades hidráulicas reales (`vessel_max_load_intake_limit`, `vessel_pump_discharge_rate`).
    
2. **[[Maestro.Rutas]]**: Cartografía los tramos marítimos oficiales, registrando las distancias en millas náuticas (`route_distance`) y los factores de fricción climática (`weather_factor`).
    
3. **[[Maestro.Aduanas]]**: Configura la matriz relacional de costos aduaneros cruzada por `client_id` + `port_id` + `operation_type` para garantizar descuentos por volumen.
    
4. **[[Maestro.Contratos]]**: Define los parámetros y la cláusula de ajuste por bunker (**BAF**), integrando el algoritmo analítico de optimización inversa (**Goal Seek**).
    
5. **[[Matriz.Tarifas]]**: Almacena los brackets o rangos comerciales de tonelaje por destino para jalar el flete base automático de los clientes.
    
6. **[[Modelo.E-R]]**: Contiene la especificación de llaves primarias (PK), foráneas (FK) y constraints de la base de datos PostgreSQL.
7. **[[Glosario.Variables.Negocio]]**: Diccionario conceptual que define la semántica comercial, operativa y naval de cada variable para blindar el entendimiento del negocio.
    

### 🖥️ PASO 2: La Fase Transaccional (Frontend UI)

- **`[[Módulo UI - Ingreso Rápido de Viaje]]`**: Formulario dinámico de captura de datos. Al seleccionar un buque, cliente y destino, el frontend debe realizar lookups automáticos a las tablas del Paso 1.
    

### ⚙️ PASO 3: Compilación y Despliegue del Motor (Logística y Financiero)

- **[[Voyage.Calculation.Tablones]]**: El motor definitivo. Recibe el JSON de la UI, resuelve las ecuaciones de cuellos de botella mediante la regla del **Triple Mínimo** (`MIN`), procesa la **Cláusula BAF** vía inversión analítica (Goal Seek) y entrega el estado de resultados con los KPIs para Apache ECharts.
    

## 🏁 Criterio de Verificación de la Arquitectura

> **Injunción para el Agente:** "Antes de dar por cerrado el módulo, el backend debe ejecutar de forma obligatoria el test unitario descrito en la sección 4 de [[Voyage.Calculation.Tablones]]. Si al enviar 13,500 MT a Matarani el sistema no converge exactamente en un `total_duration` de **3.769205 días** y un `voyage_result` de **$201,175.39 USD**, la base de datos se considerará corrupta y el despliegue será rechazado."

Al dejar este archivo indexador, cuando abras **Antigravity IDE** y le digas al agente: _"Lee el mapa de arquitectura general"_, la IA va a entender perfectamente la jerarquía de las tablas, no te va a mezclar las variables en Supabase, y sabrá exactamente contra qué números testear el código para que no falle nada.

### ¿Cómo se cruzan en la base de datos?

Para que los programadores visualicen cómo se conectan las tablas en **Supabase** antes de picar el código, la jerarquía funciona así:

1. El usuario entra al formulario de viaje de la UI.
    
2. Selecciona un Cliente (ej. `SPCC`) y un Destino (ej. `MATARANI`).
    
3. Digita una Cantidad (ej. `13,500 MT`).
    
4. El sistema hace un _Lookup_ automático en la tabla relacional de **`[[Matriz.Tarifas]]`** cruzando esas tres llaves (`client_id` + `destination_port_id` + `quantity`) para inyectar el `freight_rate` base (ej. **`$19.01 USD`**).
    
5. Si el switch de bunker está encendido, el motor aplica las reglas de **`[[Maestro.Contratos]]`**, evaluando si se dispara el umbral del BAF para recalcular la tarifa.
    
6. Al mismo tiempo, el sistema consulta **`[[Maestro.Aduanas]]`** para traer los costos portuarios preferenciales de ese cliente en esa ruta.
    

🚀 **Control de Ejecución:** El flujo de trabajo y la inicialización detallada de las tablas en Supabase se sincronizan formalmente desde la guía de: **[[Secuencia.Desarrollo]]**.

```

---

### 🕵️‍♂️ Verificación final de lo que acabamos de asegurar:
1. El motor algorítmico apunta a tu archivo real: **`[[Voyage.Calculation.Tablones]]`** (eliminamos el `_3` fantasma que estaba escrito en tu nota anterior).
2. Se añadieron los enlaces directos a **`[[Modelo.E-R]]`** y a **`[[Matriz.Tarifas]]`** que no estaban vinculados en tu nota previa.
3. Al final de la nota, la línea del cohete se ancla directamente a **`[[Secuencia.Desarrollo]]`**, lo que automát
```