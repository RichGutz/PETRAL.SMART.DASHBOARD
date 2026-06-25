Vinculado a: [[Especificacion.Commercial.Forecast]] | [[Arquitectura.Carpetas]]

# Implementación del Frontend React (Paso 2: Commercial Forecast)

Este plan detalla la estrategia de construcción de la interfaz visual interactiva para el planificador financiero, consumiendo el JSON jerárquico que produce el backend (Paso 1).

## Proposed Changes

### 1. Instalación de Dependencias Core
Ejecutaremos comandos en `Geeksoft_Frontend` para instalar el ecosistema corporativo:
- **TailwindCSS:** Para estilos minimalistas ("fondo claro, todo minimalista").
- **Shadcn UI & `@tanstack/react-table`**: Para la Data Table de alto nivel, con componentes premium, filtros y paginación.
- **Apache ECharts (`echarts`, `echarts-for-react`)**: Para el gráfico interactivo dinámico.
- **Axios:** Para la comunicación HTTP con el backend.

### 2. Estructuración de Componentes (React + TS)

#### [NEW] `src/services/api.ts`
- Módulo `ForecastService` con un método `fetchForecast(requestData)` que hará el POST a `http://localhost:8000/api/v1/forecast/run`.

#### [NEW] `src/components/CommercialForecast/PivotGrid.tsx`
- **AG-Grid Component:** Estará configurado para recibir el JSON `agg_data`. 
- **Row Grouping Customizado:** Simularemos la experiencia visual del HTML (Cliente -> Ruta -> Buque) usando celdas de agrupamiento (Group Cell Renderer) y aplicando los colores institucionales que acordamos:
  - Rutas (Azul/Teal)
  - Buques (Celeste claro/Verde claro)

#### [NEW] `src/components/CommercialForecast/InteractiveChart.tsx`
- **ECharts Component:** Recibirá los mismos datos que la grilla. El eje X serán los meses (Jul, Ago, Sep...), y dibujará la línea de tendencia del `voyage_result`.

#### [NEW] `src/pages/CommercialForecast/CommercialForecast.tsx`
- **El Gran Orquestador (State Container):** 
  - Tendrá un estado de React (`useState`) almacenando los datos de la proyección.
  - Al cargar (`useEffect`), llamará a `api.ts` con un Payload base (ej. Julio a Diciembre, SPCC).
  - Distribuirá la data del backend hacia `PivotGrid` y `InteractiveChart`.

#### [MODIFY] `src/App.tsx`
- Limpiaremos el boilerplate por defecto de Vite y montaremos directamente la página `CommercialForecast`.

## Verification Plan

### Manual Verification
1. Levantaremos el backend (`uvicorn backend.main:app`).
2. Levantaremos el frontend (`npm run dev`).
3. Abriremos `http://localhost:5173`.
4. El Frontend llamará automáticamente al Backend, el Backend irá a Supabase, calculará el P&L de 6 meses y se lo devolverá a React.
5. Veremos la Data Table de Shadcn y el gráfico de ECharts renderizándose gloriosamente en la pantalla.
