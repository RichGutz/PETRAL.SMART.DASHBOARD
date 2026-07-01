# 🗺️ Especificación: Ruteador Spot (Cotizaciones Multileg)

## 1. Resumen de Funcionalidades
1. **La lista de puertos de norte a sur:** Talara, Callao, Marcona, Matarani, Ilo, Mejillones y Barquito.
2. **El Mockup de la UI (Matriz Doble Entrada):** Una tabla que cruza los puertos y que simulará la tabla `routes` (distancias y `W Factor Laden y Ballast`).
3. **Mecánica Drag & Drop y Lógica Inteligente:** Al arrastrar un cruce al constructor de piernas, el sistema distingue automáticamente si es una pierna en "Laden" (cargada) o "Ballast" (lastre) para aplicar el W Factor correcto.
4. **Gross P&L a nivel de Pierna:** Una tabla resumen que desglosa distancia, combustible e ingresos por cada tramo, calculando el margen de GyP y un total consolidado.
5. **Guardado (Forecasting):** La opción de ponerle nombre y grabar esta ruta de múltiples piernas para jalarla en el futuro en los módulos de forecast.

## 2. Contexto y Problema
Actualmente, la generalidad de los viajes se calcula bajo la lógica de un **viaje redondo**. Esta asume que el barco:
1. Sale de un punto de origen (carga).
2. Llega al punto de destino (descarga).
3. Regresa al mismo punto de origen.

Esta lógica es básica y suficiente para los viajes regulares, ya que permite calcular los costos de combustible y el tiempo de travesía de forma estándar. Sin embargo, las **cotizaciones Spot** no siguen esta lógica. Los barcos a menudo se encuentran en un puerto base u operativo y deben desplazarse hacia el puerto de carga antes de iniciar el viaje al destino, y posteriormente retornar a su base.

## 3. Ejemplo Práctico (Spot vs Regular)
**Ruta Solicitada por el Cliente:** Callao -> Mejillones

* **Lógica Regular (Viaje Redondo):**
  * Pierna 1: Callao -> Mejillones
  * Pierna 2: Mejillones -> Callao (Retorno)
* **Lógica Spot (Realidad Operativa):**
  * El barco opera normalmente en *Ilo* (embarque de Sauron Perú).
  * Pierna 1 (Posicionamiento): Ilo -> Callao
  * Pierna 2 (Carga a Descarga): Callao -> Mejillones
  * Pierna 3 (Retorno a Base): Mejillones -> Ilo

## 4. Diseño de la Interfaz (Concepto y UI)

### A. Matriz de Rutas (Drag & Drop)
Se presenta una tabla de doble entrada que cruza todos los puertos. Refleja el contenido de la tabla `routes` (con sus distancias y factores climáticos W Factor Laden y Ballast).

> [!IMPORTANT]
> **Sofisticación de Interfaz:** El orden de los puertos en la columna vertical de **Origen** (de arriba a abajo) debe coincidir estrictamente con el orden de la fila horizontal de **Destino** (de izquierda a derecha), siguiendo la secuencia de norte a sur: **Talara, Callao, Marcona, Matarani, Ilo, Mejillones y Barquito**.

| Origen / Destino | Talara | Callao | Marcona | Matarani | Ilo | Mejillones | Barquito |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Talara** | - | ... | ... | ... | ... | ... | ... |
| **Callao** | ... | - | ... | ... | ... | ... | ... |
| **Marcona** | ... | ... | - | ... | ... | ... | ... |
| **Matarani** | ... | ... | ... | - | ... | ... | ... |
| **Ilo** | ... | ... | ... | ... | - | ... | ... |
| **Mejillones** | ... | ... | ... | ... | ... | - | ... |
| **Barquito** | ... | ... | ... | ... | ... | ... | - |

*Interacción:* El usuario hace "Drag and Drop" de la distancia/cruce de esta matriz hacia el "Constructor de Piernas". El script detectará si es Laden o Ballast para jalar el W Factor correcto.

### B. Constructor de Viaje (Multileg) — 3 Buckets Fijos
| Bucket | Rol | Estado |
| :--- | :--- | :--- |
| **1. Posicionamiento** | Desplazamiento al puerto de carga | Ballast automático |
| **2. Carga a Descarga** | Tramo comercial principal | Laden automático |
| **3. Retorno a Base** | Regreso al puerto operativo | Ballast automático |

### C. Panel de Resultados PnL — Funcionalidades Implementadas
| Concepto | Valor | % Venta |
| :--- | ---: | ---: |
| Gross Revenue *(clic → P×Q audit)* | $xxx,xxx | 100% |
| Port Costs *(clic → desglose por pierna)* | -$xx,xxx | xx.x% |
| Bunker Costs *(clic → desglose por pierna)* | -$xx,xxx | xx.x% |
| **Voyage Result** | **$xx,xxx** | **xx.x%** |

**🎚️ Slider What-If de Tarifa:**
- Anclado al valor de flete ingresado (centro del slider).
- Rango: ±$10/TM desde la base.
- Mueve el slider → todo el cuadro (Gross Revenue, Voyage Result, % costos, TCE) se recalcula en tiempo real **sin llamar al backend**.

---

## 5. 🛠️ Plan de Implementación Técnica

### 5.1 Base de Datos (Supabase)
- **[✅ HECHO]** Columna `weather_factor` renombrada a `weather_factor_laden` + nueva `weather_factor_ballast` en tabla `routes`.
- **[✅ HECHO]** Tabla `routes_spot` creada con `jsonb` para persistir configuraciones multileg.
- **[✅ HECHO]** `agency_matrix` seeded con registros `DEFAULT` para los 7 puertos (CARGA y DESCARGA) a **$9,999** como placeholder identificable. ILO/CARGA ($25,500) y MATARANI/DESCARGA ($21,000) tienen valores reales.
- **[✅ HECHO]** `contracts` → `discharge_rate` actualizado con datos reales del cliente SPCC:
  - MATARANI: **300 TMH**
  - MARCONA: **345 TMH**
  - MEJILLONES: **350 TMH**
- **[⏳ PENDIENTE]** `contracts` → `load_rate` (tasa de carga): esperando datos del cliente.

### 5.2 Backend (Geeksoft_Engine)
- **[✅ HECHO]** `spot_engine.py`: función `calculate_spot_multileg()` que calcula distancia, bunker (incluyendo el consumo detallado en la traza de auditoría por fases), port costs y GyP por cada pierna, sumando las demoras en puerto a los overheads normales, y consolida el total retornando `tce_required`.
- **[✅ HECHO]** `forecast.py`: endpoint `POST /api/v1/forecast/spot/calculate` — inyecta `agency_costs_origin` y `agency_costs_destination` desde `agency_matrix` antes de llamar al motor.
- **[✅ HECHO]** `forecast.py`: endpoint `POST /api/v1/forecast/spot/save` — persiste en `routes_spot`.
- **[✅ HECHO]** `forecast.py`: endpoint `GET /api/v1/forecast/spot/list` — lista todas las rutas spot guardadas ordenadas de forma descendente.
- **[✅ HECHO]** `forecast_models.py`: `SpotCalculationRequest` y `SpotSaveRequest`.

### 5.3 Frontend (Geeksoft_Frontend)
- **[✅ HECHO]** `RouteMatrix.tsx`: Matriz dinámica con colores diferenciados para Destino (eje X, bg-teal-50) y Origen (eje Y, bg-indigo-50). Drag & Drop habilitado.
- **[✅ HECHO]** `SpotRouter.tsx`: UI estructurada en columnas flex que alinean de forma perfecta los buckets de viaje y las descripciones explicativas, incorporando los inputs numéricos para las demoras en puerto.
- **[✅ HECHO]** `SpotRouter.tsx`: Panel PnL que integra las filas **TCE Diario (Real)** y **TCE Requerido** de manera permanente debajo de Voyage Result, con auditoría expandible de toneladas (IFO/MDO) por fase y Slider What-If reactivo.
- **[✅ HECHO]** `SpotRouter.tsx`: Validaciones de consistencia geográfica de puertos y campos obligatorios (flete y cantidad) que bloquean y deshabilitan dinámicamente el botón de procesamiento.
- **[✅ HECHO]** `SpotRouter.tsx`: Widget y lógica de guardado de ruta spot con nombre y usuario en la tabla `routes_spot` de Supabase (llamando a `POST /spot/save`), con botón integrado en la barra de ejecución.
- **[✅ HECHO]** `SpotRouter.tsx`: Catálogo y lógica de carga de rutas spot con botón en la barra de ejecución, el cual restaura buque, tramos y demoras ejecutando un cálculo reactivo automático tras la carga.

### 5.4 Despliegue
- **[✅ HECHO]** Live en producción: **https://forecast.geeksoft.tech**
- **[✅ HECHO]** Workflow establecido: desarrollo → `npm run build` → `python deploy_forecast_kickoff.py` → VPS.

---

## 6. Siguientes Pasos
- [ ] Recibir y cargar `load_rate` del cliente SPCC en tabla `contracts`.
- [ ] Reemplazar `$9,999` placeholders en `agency_matrix` con costos portuarios reales por puerto.
- [✅ HECHO] Función de guardado de ruta (UI para nombre + botón Save → `POST /spot/save`).
- [✅ HECHO] Cargar rutas guardadas en el Ruteador Spot (catálogo y carga reactiva en UI).
- [ ] Integrar rutas spot guardadas dentro del módulo de Forecast mensual consolidado.
