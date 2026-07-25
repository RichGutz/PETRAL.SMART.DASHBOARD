# Maestro de Rutas (Plan y Ejecución)

## 1. Objetivo
Construir un nuevo módulo llamado **Maestro de Rutas**. Este maestro permitirá visualizar todas las rutas que el usuario ha grabado (típicamente desde el Multicotizador) y que están disponibles para ser cargadas y aplicadas a un barco en la matriz financiera.

## 2. Contexto y Funcionamiento
- Actualmente, al configurar un escenario en la matriz financiera, existe una base de datos (tabla de rutas) desde la cual se puede "jalar" una ruta previamente guardada.
- Las rutas se guardan actualmente a través del **Multicotizador**.
- **Problema actual**: No existe un lugar centralizado en la interfaz donde el usuario pueda ver el listado de estas rutas guardadas ni inspeccionar de qué se compone cada una.
- **Definición de Ruta**: Una ruta se compone esencialmente de las piernas (tramos) que tiene el viaje, junto con las distancias que provienen de la matriz de distancias. **Es fundamental que en la definición de la ruta se identifique explícitamente en qué puerto se CARGA y en qué puerto se DESCARGA** (esta información se almacena en el JSON `legs_data` bajo los campos `origin_action` y `destination_action` como 'CARGAR' o 'DESCARGAR').

## 3. Requerimientos de la Interfaz (Frontend)
- **Estándar UI**: Se debe respetar el estándar visual y de usabilidad de los otros maestros existentes en el sistema (ej. listado con tabla, filtros, diseño coherente).
- **Información Indispensable a Mostrar**:
  - Nombre o Identificador de la Ruta.
  - Composición de la Ruta (Piernas / Tramos del viaje).
  - Distancias asociadas a cada tramo (calculadas desde la matriz de distancias).
  - **Indicadores de Acción**: Para cada tramo de la ruta, mostrar claramente dónde ocurre la **CARGA** y dónde la **DESCARGA**.

## 4. Plan de Ejecución

### Fase 1: Backend & Base de Datos
- **Revisión del Modelo**: Explorar la tabla `routes_master` en la base de datos (Supabase). En particular, entender cómo se serializan los tramos y las acciones de los puertos en la columna `legs_data` (la cual es guardada por la API `/spot/save` del Multicotizador).
- **API**: Utilizar el endpoint existente `GET /spot/list` o crear uno nuevo si es necesario, que retorne el maestro de rutas con los detalles decodificados (piernas, distancias y acciones de CARGA/DESCARGA).

### Fase 2: Frontend (UI)
- **Creación del Componente**: Desarrollar el componente visual (ej. `RouteMaster_V2.tsx`), cumpliendo la regla de nomenclatura obligatoria (`_V2.tsx`).
- **Integración**: Consumir la API para poblar el listado.
- **Detalle de Ruta**: Implementar un diseño que permita ver fácilmente las piernas de la ruta (ya sea mediante filas expandibles, un modal, o un panel lateral).

### Fase 3: Validación
- Probar que las rutas guardadas desde el Multicotizador se listen inmediatamente en el Maestro.
- Comprobar que los datos de distancias coincidan con los de la matriz real.
