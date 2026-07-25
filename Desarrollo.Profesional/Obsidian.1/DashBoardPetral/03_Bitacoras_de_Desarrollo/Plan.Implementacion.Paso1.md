Vinculado a: [[Especificacion.Commercial.Forecast]] | [[Arquitectura.Carpetas]]

# Implementación de Backend (Paso 1: Endpoint de Commercial Forecast)

Este plan detalla la construcción del enrutador y servicio para la simulación y agregación del Commercial Forecast, inyectando las tablas físicas de Supabase detalladas en el `Modelo.E-R.md` dentro de `engine.py`.

## Proposed Changes

### 1. Modelos Pydantic (`models/forecast_models.py`)
Crearemos las estructuras de entrada y salida para tipar estrictamente el JSON que viaja desde React.

#### [NEW] `Geeksoft_Engine/backend/models/forecast_models.py`
- `ProjectionLine`: Definición de cada línea (ej: SPCC, ILO, MATARANI, MOQUEGUA, quantity, freq).
- `ForecastRequest`: Contenedor principal con `start_date`, `end_date`, y `lines`.
- `ForecastResponse`: Estructura jerárquica de la tabla Pivot (`agg_data[client][route][vessel][month] = VoyageResult`).

### 2. Capa de Servicios (`services/forecast_service.py`)
El servicio será el responsable de la orquestación, haciendo las llamadas a Supabase y al Motor P&L.

#### [NEW] `Geeksoft_Engine/backend/services/forecast_service.py`
- Función `run_forecast_simulation(request: ForecastRequest)`:
  - Iterará sobre `request.lines`.
  - Hará query a Supabase: `vessels` (consumos granulares, specs), `routes` (distancias, weather), `contracts` y `contract_tariffs` (fletes base).
  - Usará el `bunker_price_ifo` de la tabla `bunker_prices` a menos que el usuario envíe uno propio (What-if). En tal caso, ejecutará `calculate_baf_adjusted_rate` de `engine.py`.
  - Construirá el diccionario dict de `inputs` requerido por `calculate_voyage_pnl`.
  - Agrupará y totalizará los resultados multiplicando por la frecuencia mensual.
  - Formateará la respuesta en un diccionario jerárquico anidado, idéntico a la estructura requerida por el UI de la Tabla Pivot (Cliente -> Ruta -> Buque).

### 3. Capa de Enrutamiento (`api/routers/forecast.py`)
Exposición del endpoint.

#### [NEW] `Geeksoft_Engine/backend/api/routers/forecast.py`
- Instanciar `APIRouter(prefix="/forecast", tags=["Commercial Forecast"])`.
- Crear el endpoint POST `/run` que recibe `ForecastRequest` y retorna el resultado de `run_forecast_simulation`.

#### [MODIFY] `Geeksoft_Engine/backend/main.py`
- Registrar `forecast.router` en el objeto FastAPI central.

## Verification Plan

### Automated Tests
- No aplican pruebas unitarias exhaustivas en esta fase de andamiaje, pero se correrán comprobaciones de tipeo en los endpoints.

### Manual Verification
- Iniciaremos el servidor usando `uvicorn backend.main:app --reload`.
- Abriremos el Swagger `/docs`.
- Ejecutaremos un POST a `/api/v1/forecast/run` usando un JSON Mock de prueba (SPCC, ILO -> MATARANI, MOQUEGUA, 2 veces al mes).
- Confirmaremos que los números concuerden y la jerarquía se forme perfectamente, con todos los datos fluyendo real-time desde Supabase.

