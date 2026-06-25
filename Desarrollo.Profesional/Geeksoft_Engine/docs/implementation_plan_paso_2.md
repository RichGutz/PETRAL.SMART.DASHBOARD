# Motor P&L y Unit Economics - Paso 2: Backend y Pruebas (GUI-LESS)

Una vez resuelta la inicialización de Supabase y registradas las claves de entorno, avanzamos al "PASO 2" descrito en la arquitectura de la bóveda: la construcción del motor matemático y la automatización del Ledger en PDF.

## Goal

Construir el backend en Python (FastAPI) que recibirá los parámetros de un viaje, consultará los datos maestros desde Supabase (vía `supabase-py`), resolverá la lógica matemática, y ejecutará una suite `pytest` que generará un reporte físico de auditoría en PDF estructurado en 2 columnas y conciliación con Excel.

## User Review Required

> [!WARNING]
> Todo está claro respecto a la estructura del PDF. Estoy a la espera de que me proporciones las rutas de los archivos Excel (Voyage Calculations de Moquegua, Tablones y Concon) para integrarlos al script de conciliación.

## Proposed Changes

Se creará la siguiente estructura en `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend`:

### Entorno y Dependencias
Se añadirán dependencias: `fastapi`, `supabase`, `python-dotenv`, `pytest` y `reportlab` (ideal para dibujar coordenadas precisas y la grilla vertical exigida).

### Código del Motor (FastAPI)
- `backend/database.py`: Cliente de Supabase.
- `backend/engine.py`: Lógica de negocio pura (Mínimos, P&L, BAF Goal Seek).
- `backend/main.py`: Endpoint POST `/api/v1/simulate_voyage`.

### Pruebas y Output PDF Estructurado
- `backend/tests/test_voyage_ledger.py`: Suite de pruebas.
- **Estructura Arquitectónica del PDF (ReportLab):**
  - **Grilla dividida en 2 columnas (Línea central vertical):**
    - **Lado Izquierdo (Teoría):** Explicación conceptual, tablas de origen (Supabase), fórmulas con variables matemáticas literales.
    - **Lado Derecho (Aplicación):** Las mismas fórmulas mapeadas 1:1, pero con los valores numéricos resueltos de la simulación.
  - **Pie de Página (Conciliación Automática):** Cuadro de validación comparando los márgenes del motor en Python vs las cifras oficiales de tus Excel de Geeksoft, validando la convergencia final con diferencia = 0.00.

## Verification Plan

### Automated Tests
- Ejecutaremos `pytest` para escupir el archivo PDF y testear los 3 barcos. No se avanzará a la capa visual hasta que el PDF pruebe la conciliación absoluta con los Excel.
