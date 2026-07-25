Vinculado a: [[Plan.Implementacion.Paso2]]

# 📝 Bitácora de Desarrollo: Frontend React (Paso 2)

Este documento registra cronológicamente los avances en la construcción de la interfaz gráfica interactiva, que consumirá el backend y materializará la lógica del negocio en un entorno visual rico.

## [Completado] Fase A: Infraestructura y Estilos
*Instalación de librerías core y configuración de Tailwind CSS.*
- Paquetes instalados (`tailwindcss`, componentes de `shadcn ui`, `@tanstack/react-table`, `echarts`, `axios`).
- Configurado `tailwind.config.js` y las directivas en `index.css`.

## [Completado] Fase B: Conectividad (API)
*Construcción de `services/api.ts` para invocar al backend usando Axios.*
- Configurada la base URL a `http://localhost:8000/api/v1`.
- Creado método asíncrono `ForecastService.runSimulation`.

## [Completado] Fase C: Construcción de Componentes (Shadcn UI y ECharts)
*Implementación de la Data Table interactiva y el InteractiveChart.*
- Creado `DataTable.tsx` usando Shadcn UI y TanStack Table con Sorting, Filtering y paginación para la jerarquía aplanada.
- Creado `InteractiveChart.tsx` mapeando series ECharts a través de las llaves del backend.

## [Completado] Fase D: Orquestación UI
*Ensamblaje del contenedor final `CommercialForecast.tsx` y su inyección en `App.tsx`.*
- `CommercialForecast` contiene el mock payload inicial para la corrida completa de H2 2026.
- Implementado UI loading state elegante (`spinner`).
- El componente unifica la vista pivot y el análisis de tendencia bajo un mismo flujo asíncrono.
- La aplicación monta `CommercialForecast` desde `App.tsx`.

---
*Nota: Este documento se actualizará dinámicamente conforme avance la codificación.*

## 🐛 Registro de Hotfixes & Troubleshooting

Durante la integración final entre el Frontend y el Backend, se identificaron y resolvieron exitosamente los siguientes bloqueos:

### 1. Migración Sorpresa a Tailwind v4
- **Problema**: Vite instaló la versión 4.0 de TailwindCSS, deprecando la sintaxis clásica de configuración e importación.
- **Solución**: Se instaló `@tailwindcss/postcss`, se apuntó la variable en `postcss.config.js` y se actualizó `index.css` a la sintaxis `@import "tailwindcss"; @config "../tailwind.config.js";`.

### 2. Bloqueo por CORS en el Frontend
- **Problema**: FastAPI rechazaba los *requests* del navegador (Puerto 5173 hacia 8000) por política de seguridad de origen.
- **Solución**: Inyección de `CORSMiddleware` en `backend/main.py` para aceptar tráfico entrante de Vite.

### 3. Conflicto de Versiones en Supabase (Python)
- **Problema**: La versión instalada de `supabase-py` (v2.3) intentaba usar un proxy HTTP que rompía con `postgrest-py`. Además, su dependencia `realtime` exigía `websockets.asyncio`, la cual no existía en la versión de `websockets` (v12) del sistema.
- **Solución**: Se corrió un upgrade global de dependencias en el entorno virtual (`pip install --upgrade supabase postgrest` y `pip install websockets==14.0`), balanceando la compatibilidad de módulos asíncronos.

### 4. Resiliencia ante Tablas Faltantes (DB Schema)
- **Problema**: El sistema entregaba una respuesta en blanco (`NO ROWS TO SHOW`) porque el modelo backend fallaba catastróficamente al intentar buscar la tabla `bunker_prices`, que aún no existía físicamente en Supabase.
- **Solución**: Refactorización del servicio de pronóstico (`forecast_service.py`) usando un decorador/función `safe_fetch`. Ahora, el motor "atrapa" la excepción de tablas inexistentes y asume valores por defecto hardcodeados, garantizando que el flujo de UI siempre pinte la simulación.

### 5. Lógica Contractual de Tarifas de Flete (Gross Revenue a $0)
- **Problema**: El backend retornaba $0 en ingresos debido a dos bugs silentes: la tabla `contracts` no existía, y el mapeo del tonelaje de los buques excedía los rangos de la matriz `contract_tariffs`. Además, la base de datos tenía el puerto como `SAN_JUAN_DE_MARCONA` pero era muy largo y rompía convenciones.
- **Solución**: 
  - Se eliminó la dependencia estricta a `contracts` y se ruteó directamente a `contract_tariffs`. 
  - Se implementó una lógica de "Fallback" donde, si el barco excede el tonelaje máximo del contrato, se asigna el tramo tarifario más alto. 
  - Se migró definitivamente el ID en la base de datos a `MARCONA` a través de un script SQL en todas las tablas hijas, y se homologó la UI de React y la Bóveda Obsidian para que solo exista `MARCONA`.

### 6. Variable DWCC (Capacidad de Carga Útil) vs DWT
- **Problema**: El simulador tomaba el DWT (peso muerto total) del buque como cantidad a transportar, lo cual falseaba el P&L, pues el tonelaje comercial (DWCC) es significativamente menor (ej. Tablones tiene 16533 DWT pero 13500 DWCC).
- **Solución**: Se inyectó formalmente la variable técnica `dwcc` tanto en la base de datos de producción Supabase (vía script migratorio PostgreSQL) como en la constante de configuración del React Frontend `ForecastBuilder.tsx`, garantizando convergencia. Todo el ecosistema (Modelo E-R, DB, Frontend, y Archivos Maestros) está ahora alineado.

### 7. Re-Arquitectura de la Matriz Interactiva (Ledger Unitario y Edición en Vivo)
- **Logro 1**: Se enriqueció la tabla `ForecastGrid.tsx` inyectando botones colapsables (`+`) debajo de la métrica "Viajes". Esto despliega el libro mayor (Ledger) estático del viaje, categorizado visualmente en `Operativo`, `Tiempos/Costos` y `Financiero`.
- **Logro 2**: Los montos mostrados en el Ledger expandible reflejan valores *Unitarios* (sin multiplicar por frecuencia), permitiendo auditar la tarifa, Sea Days, y Consumos IFO de manera quirúrgica.
- **Logro 3 (Interactividad)**: Se transformó la celda de la métrica "Viajes (freq)" en un `<input>` interactivo. Cambiar el número dispara un evento hacia el orquestador maestro, actualiza las dependencias, clona el ladrillo fundacional y re-dispara la petición HTTP asíncrona hacia el motor en Python. Como resultado, la tabla y los totales parpadean en tiempo real sin recargar la página.
