# 08: Refactorización Triángulo Multicotizador, Contratos y Matriz Comercial

**Fecha de Creación**: 14 de Agosto de 2026  
**Última Actualización**: 15 de Agosto de 2026  
**Origen**: Acuerdo y especificaciones de la reunión con el cliente Joseph Zabala (Joseph Sabala RG)  
**Proyecto**: PETRAL Smart Dashboard / Geeksoft Engine  

---

## 1. Diagnóstico y Visión del Cambio

En la reunión del 14/08/2026 se identificó una desconexión crítica entre la riqueza de información que calcula el **Multicotizador** (tramos, piernas, tarifas, costos portuarios por terminal, consumo de búnker y vigencias) y la estructura estática de la tabla de contratos antigua (`contracts`).

### Decisiones Estratégicas de Diseño:
1. **Eliminación de la Creación Manual de Contratos**: Se elimina el botón "Agregar Contrato" y la vista "Libros de Contrato". Los contratos ya no se ingresarán como registros planos estáticos.
2. **El Multicotizador como Fuente Única de Verdad**: Los contratos nacen directamente de la cotización enriquecida en el Multicotizador y se "empujan" (*push*) a la tabla `contracts` conservando el 100% de la riqueza de data.
3. **Homologación de Esquema**: La tabla `contracts` adopta la misma estructura base que `routes_clients` y `routes_quotes` (`name`, `description`, `legs_data`, `pais`, `created_at`, `created_by`), permitiendo que todos los servicios y scripts realicen consultas polimórficas sin modificar lógica interna.

---

## 2. Resguardo de Control de Daños (Pasos A y B)

| Paso | Descripción | Estado | Detalle |
| :--- | :--- | :---: | :--- |
| **Paso A** | Rama de Resguardo Git | **COMPLETADO** | Rama `reunion-joseph-sabala-1408` creada; trabajo activo en `main`. |
| **Paso B** | Resguardo de Base de Datos Supabase | **COMPLETADO** | Tablas `contracts_backup` (5 registros) y `contract_tariffs_backup` (13 registros) creadas en PostgreSQL. Respaldo JSON en `scratch/backup_contracts_14_08_2026/`. |

---

## 3. Homologación de Esquema de la Tabla `contracts` (Paso C)

Se ejecutó la migración SQL [`20260814000012_homologate_contracts_schema.sql`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/supabase/migrations/20260814000012_homologate_contracts_schema.sql) para añadir las columnas estándar:

```sql
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS legs_data JSONB;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS pais VARCHAR(10) DEFAULT 'PE';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'izavala@petral.com.pe';
```

### Estructura del JSONB `legs_data` (Complejidad Enbebiendo Metadatos de Contrato):
```json
{
  "is_multicotizador": true,
  "contract_metadata": {
    "contract_id": "CTR-MARCONA-2026-01",
    "client_id": "MARCONA",
    "valid_from": "2026-01-01",
    "valid_to": "2028-12-31",
    "validity_years": 3,
    "contract_status": "ACTIVE"
  },
  "tramos": [ ... ],
  "puertosConfig": [ ... ],
  "vesselParams": { ... }
}
```

---

## 4. UI Multicotizador y Flujo de Validación

1. **Paso 5 (`5. VALIDEZ`)**:
   - Incorporado en la barra superior de pasos comerciales en [`MultiCotizadorExcel.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/MultiCotizadorExcel.tsx).
   - Incluye calendarios para fecha de **Inicio** (`validFrom`) y **Fin** (`validTo`).
   - Sin scrollbar horizontal (layout adaptativo compacto).
2. **Validación Estricta de Guardado**:
   - `handleSaveRoute` valida obligatoriamente que `validFrom` y `validTo` estén completadas antes de permitir el guardado.

---

## 5. Propagación de Estado y Garantía de Integridad del Payload (Análisis Gráfico y Spaghetti Map)

El ecosistema comercial de PETRAL opera sobre un **estado global compartido (`ForecastContext_V2`)** que alimenta simbióticamente a las 4 herramientas principales:

```mermaid
flowchart TD
    Engine["⚙️ Backend Engine (forecast_service.py)"] -->|Payload JSON| Context["📦 ForecastContext_V2 (data.aggregated_data)"]
    
    Context --> Tool1["1. 📊 Matriz Financiera (ForecastGrid.tsx)"]
    Context --> Tool2["2. 📈 Análisis Gráfico (InteractiveChart.tsx)"]
    Context --> Tool3["3. 🗺️ Spaghetti Map (SpaghettiMap.tsx)"]
    Context --> Tool4["4. 📑 Ledger de Auditoría (VoyageLedgerFinal.tsx)"]
```

### 🛡️ Reglas de Garantía e Inmutabilidad del Payload:

1. **Contrato de Datos Universal (`aggregated_data`)**:
   - El payload entregado por `forecast_service.py` mantiene la misma firma exacta y rigurosa del monolito:
     ```json
     {
       "aggregated_data": {
         "[CLIENT_ID]": {
           "[ROUTE_KEY]": {
             "[VESSEL_ID]": {
               "[YYYY-MM]": {
                 "net_income": 405000.0,
                 "total_port_costs": 68333.0,
                 "total_bunker_costs": 47600.0,
                 "voyage_result": 71775.0,
                 "pl_vs_required": -168725.0,
                 "tce_real": 16880.0,
                 "total_cargo": 27000.0,
                 "carga_unit": 27000.0,
                 "flete_unit": 15.0,
                 "refacturacion_muellaje": 33333.0,
                 "total_duration": 18.5
               }
             }
           }
         }
       }
     }
     ```

2. **Consumo en `InteractiveChart.tsx` (Análisis Gráfico ECharts)**:
   - Extrae métricas directamente del árbol (`net_income`, `voyage_result`, `total_port_costs`, `total_bunker_costs`, `total_cargo`, `pl_vs_required`, `demurrage`).
   - Cualquier escenario recalculado o modificado in-situ se refleja de forma idéntica en las curvas temporales sin descalces.

3. **Consumo en `SpaghettiMap.tsx` (Mapa Espagueti)**:
   - Consume `context.projectionLines` y `data.aggregated_data` para resolver puertos, distancias, curvaturas geográficas marítimas y volúmenes mensuales animados.
   - Preserva la paridad total con las rutas históricas de cabotaje e internacional.

4. **Aislamiento en la Capa de Presentación (`ForecastGrid.tsx`)**:
   - Las nuevas funcionalidades visuales (acordeones colapsables para `Net Revenue`, `TCE x días`, refacturación de muellaje y demurrage % sobre Freight Revenue) actúan **estrictamente como capa de UI/UX**, calculando sus sub-filas a partir de las propiedades base existentes, sin mutar ni corromper el payload raíz que alimenta al resto del sistema.

---

## 6. Publicación en Producción VPS

- **Script Ejecutado**: `python deploy_forecast_kickoff.py` en `Push.VPS/`.
- **URL en Vivo**: [https://forecast.geeksoft.tech](https://forecast.geeksoft.tech)
- **Resultado**: Compilación limpia en 3.06s (Exit Code 0), reinicio de servicio `geeksoft-engine` y Nginx HTTPS desplegado.

---

## 7. Análisis Forense e Hipótesis: Desacople Monolito vs. Herramientas Modulares

### 🔍 Diagnóstico de Arquitectura: Monolito vs. Modular

```mermaid
flowchart TD
    subgraph Monolito ["1. Monolito (CommercialForecast.tsx)"]
        M_State["Estado Único en Memoria (data, dynamicMonths, ports)"]
        M_Tabs["Pestañas Locales (activeTab: 'grid' | 'chart' | 'map')"]
        M_State --> M_Tabs
        M_Tabs --> M_Grid["ForecastGrid"]
        M_Tabs --> M_Chart["InteractiveChart (data={data})"]
        M_Tabs --> M_Map["SpaghettiMap Estable"]
    end

    subgraph Modular ["2. Arquitectura Modular (App_V2 + Context)"]
        C_Provider["ForecastContext_V2 (data, dynamicMonths, projectionLines)"]
        C_Routes["React Router (URLs independientes)"]
        C_Provider --> C_Routes
        C_Routes --> R_Dash["/dashboard (ForecastGrid)"]
        C_Routes --> R_Chart["/graphic-analysis (InteractiveChart)"]
        C_Routes --> R_Map["/spaghetti-map (SpaghettiMap_V2)"]
    end
```

### 🧠 Las 4 Hipótesis Técnicas del Problema:

1. **Hipótesis 1: Ruptura por `TypeError` silencioso en métricas de ruta (Análisis Gráfico en Blanco)**
   - **Mecánica**: En `InteractiveChart.tsx`, la función extractora ejecutaba `metrics['raw_inputs']?.['monthly_frequency']` asumiendo que para cada mes de la matriz existe un objeto `metrics`.
   - **Causa**: Cuando un escenario tiene meses sin viajes o tramos específicos de cotizaciones complejas donde `metrics` es `undefined`, JavaScript lanza `TypeError: Cannot read properties of undefined (reading 'raw_inputs')` dentro del `useMemo(options)`.
   - **Efecto**: Al no haber un `ErrorBoundary`, React aborta el renderizado del componente completo y la pantalla queda **totalmente en blanco**.

2. **Hipótesis 2: Colapso Geográfico por Rutas Multicotizador en Spaghetti Map ("No entra")**
   - **Mecánica**: El algoritmo de curvatura y dibujo de misiles (`getRouteLegs` y `getBezierPoints`) esperaba nombres de rutas simples de 2 puertos separados por guión (`"ILO-MATARANI"`).
   - **Causa**: Al guardar un escenario con rutas del Multicotizador (como `"NEXA.ILO.CALLAO.MEJILLONES.ILO"`), el extractor no encontraba los puertos o generaba coordenadas `NaN`. ECharts intentaba renderizar polilíneas con puntos `undefined`, provocando una **excepción fatal en el motor Canvas/WebGL de ECharts** al montar el componente, bloqueando la entrada a la vista.

3. **Hipótesis 3: Divergencia entre el `SpaghettiMap` Estable vs. `SpaghettiMap_V2`**
   - **Mecánica**: El monolito original utilizaba `components/CommercialForecast/SpaghettiMap.tsx` (versión probada y estable con curvaturas fijas).
   - **Causa**: La ruta modular `/spaghetti-map` fue configurada para apuntar a `SpaghettiMap_V2.tsx` (versión experimental con misiles animados, tortas de cuota de mercado y dependencias de `clientsMaster` y `sources_sinks`). Si alguno de estos maestros falla o tarda en resolver, el componente colapsa antes del montaje.

4. **Hipótesis 4: Renderizado de Canvas con Dimensiones 0px (ECharts Flexbox)**
   - **Mecánica**: `InteractiveChart` y `ReactECharts` dependen de que el contenedor padre tenga una altura explícita en píxeles al momento del primer render.
   - **Causa**: Al navegar por URL mediante `<Outlet />` dentro de `ToolsLayout_V2`, la animación de entrada (`animate-in fade-in`) monta el componente mientras el contenedor flex tiene `height: 0px`, haciendo que ECharts inicialice el canvas en 0x0 (invisible).

### 🛠️ Protocolo de Estabilización Propuesto:

- **Blindaje Nulo Defensivo**: Aplicar `metrics?.['raw_inputs']?.['monthly_frequency']` y encadenamiento opcional con fallbacks `0` en todas las lecturas de propiedades en `InteractiveChart.tsx` y `SpaghettiMap_V2.tsx`.
- **Parser Universal de Rutas**: Normalizar cualquier string de ruta (`CTR-...`, `SPOT-...`, `NEXA.ILO...`) extrayendo únicamente los códigos de puertos válidos presentes en `portsMaster`.
- **Garantía de Persistencia en Contexto**: Confirmar que `context.data` mantenga su estructura íntegra de `aggregated_data` sin ser reseteado o sobreescrito durante las transiciones de rutas en React Router.

---

## 8. Protocolo de Control de Calidad (QC Loop Local) y Auditoría E2E

### 8.1 Arquitectura del QC Loop Automatizado (No-Interactivo)

De acuerdo con las **Reglas de Despliegue y Control de Daños**, se estableció un protocolo de verificación local previo a cualquier publicación en producción (VPS). Toda auditoría se ejecuta de forma no-interactiva en terminal a través de scripts de prueba automatizados:

1. **Backend & DB Audit Script ([`run_qc_e2e_forecast_audit.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/run_qc_e2e_forecast_audit.py))**:
   - Conecta a la base de datos Supabase (tabla `commercial_forecasts`).
   - Extrae el escenario activo (ej. `PRIMER.MODELO.MODULAR`).
   - Ejecuta la simulación local del motor (`run_forecast_simulation`).
   - Audita la integridad del payload `aggregated_data` y simula las transformaciones de gráficos y mapas.

2. **Frontend Transformer Test Suite ([`test_qc_frontend_data.mjs`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/test_qc_frontend_data.mjs))**:
   - Test no-interactivo en Node.js que simula la ingesta del payload de simulación.
   - Audita la extracción de meses activos, la agregación de series de ECharts y el mapeo geográfico de puertos/piernas.

---

### 8.2 Hallazgo y Causa Raíz Descubierta por el QC Loop

El QC Loop automatizado permitió aislar el origen exacto del fallo visual en el escenario `PRIMER.MODELO.MODULAR`:

* **El Desfase Temporal (2026 vs. 2027)**:
  - El escenario cargado contenía 24 viajes proyectados para el año **2027** (`2027-01` a `2027-12`).
  - El estado por defecto del contexto (`ForecastContext_V2`) inicializaba el selector con el rango por defecto del año **2026** (`2026-07` a `2026-12`).
  - Al renderizar `InteractiveChart` y `SpaghettiMap`, los componentes buscaban datos bajo la clave `'2026-07'` en un mapa cuyas únicas llaves eran `'2027-01'` a `'2027-12'`, haciendo que todas las métricas devolvieran `$0.00` y gráficos vacíos.

---

### 8.3 Solución Aplicada en `ForecastContext_V2.tsx`

Se actualizó la computación de `dynamicMonths` para **extraer dinámicamente las llaves de meses reales presentes en `data.aggregated_data`**:

```typescript
const dynamicMonths = useMemo(() => {
    // 1. Extraer primero los meses reales presentes en data.aggregated_data
    const monthsSet = new Set<string>();
    if (data && data.aggregated_data && typeof data.aggregated_data === 'object') {
        Object.values(data.aggregated_data).forEach((routes: any) => {
            if (routes && typeof routes === 'object') {
                Object.values(routes).forEach((vessels: any) => {
                    if (vessels && typeof vessels === 'object') {
                        Object.values(vessels).forEach((mMap: any) => {
                            if (mMap && typeof mMap === 'object') {
                                Object.keys(mMap).forEach(m => {
                                    if (m && m.match(/^\d{4}-\d{2}$/)) {
                                        monthsSet.add(m);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
    if (monthsSet.size > 0) {
        return Array.from(monthsSet).sort();
    }
    // 2. Fallback a rango de fechas de selector
    ...
}, [data, startDate, endDate]);
```

---

### 8.4 Resultados Auditados del QC Loop (100% Coincidente)

| Métrica Audita | Valor Validado en Terminal | Estado QC |
| :--- | :--- | :--- |
| **Escenario Auditado** | `PRIMER.MODELO.MODULAR` (ID: `513f2ea9-0aa4-4ee6-b420-22820e477245`) | ✅ VALIDATED |
| **Meses Reales Dataset** | 12 meses (`2027-01` a `2027-12`) | ✅ IN SYNC |
| **Viajes Totales** | 24.00 viajes (NEXA: 12, SPCC: 12) | ✅ EXACT |
| **Flete Neto (Net Income)** | $7,712,190.00 | ✅ EXACT |
| **Resultado Operativo (Voyage Result)** | $4,575,758.52 | ✅ EXACT |
| **Carga Total Transportada** | 342,000 MT (NEXA: 180k MT, SPCC: 162k MT) | ✅ EXACT |
| **Distribución de Puertos Spaghetti** | CALLAO (15k MT carga), ILO (13.5k MT carga), MEJILLONES (28.5k MT descarga) | ✅ EXACT |

---

### 8.5 Resiliencia y Contención de Fallos con `ErrorBoundary`

Para prevenir cualquier bloqueo del DOM o la imposibilidad de navegar de regreso a la Matriz Financiera, se integró el componente de contención [`ErrorBoundary.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/common/ErrorBoundary.tsx) en el contenedor maestro [`ToolsLayout_V2.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/layouts/ToolsLayout_V2.tsx):

```tsx
<ErrorBoundary fallbackTitle="Error al cargar la herramienta interactiva">
    <Outlet />
</ErrorBoundary>
```

Con este aislamiento, ante cualquier discrepancia imprevista de datos, la barra lateral y los controles de navegación **permanecen 100% interactivos y disponibles para el usuario**.

---

### 8.6 Vuelta 4 de Arreglos: Diagnóstico de Canvas 0px × 0px por Animaciones Flexbox / Tailwind CSS

De acuerdo con el **Protocolo de Auditoría Pericial Benoit Blanc**, se documentan las causas técnicas y las soluciones aplicadas en esta 4ta ronda de estabilización:

#### Tabla de Auditoría Pericial de Vuelta 4

| Ítem | Síntoma Reportado | Causa Raíz Técnica Identificada | Solución Implementada & Código | Estado QC |
| :--- | :--- | :--- | :--- | :--- |
| **4.1** | **Análisis Gráfico en Blanco tras ingresar** | **Inicialización de Canvas ECharts a `0px × 0px` durante la animación CSS**: Al navegar a la ruta `/graphic-analysis`, la animación Tailwind `animate-in fade-in slide-in-from-bottom-2 duration-300` aplica un CSS `transform` y `opacity` al contenedor. `ReactECharts` medía las dimensiones del DOM en el milisegundo 0 (mientras la animación corría), calculando un ancho/alto de 0px. ECharts no se auto-redimensiona al concluir las animaciones CSS si no recibe un evento explícito de `resize()`. | **Vigilante de Resize Automatizado (`echartsRef`)**: Se adjuntó un `ref={echartsRef}` en [`InteractiveChart.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/InteractiveChart.tsx) y [`SpaghettiMap_V2.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/SpaghettiMap_V2.tsx) con timers programados a 50ms, 150ms, 350ms (fin de animación CSS) y 600ms que fuerzan la ejecución de `chartInstance.resize()`. | ✅ RESUELTO |
| **4.2** | **Ingestión del RAW DUMP del Escenario Real** | **Verificación del JSON de simulación original**: Se generó el dump completo `raw_scenario_dump.json` (65.8 KB) del escenario `PRIMER.MODELO.MODULAR` (ID `513f2ea9-...`). | **Auditoría con [`test_interactive_chart_dump.mjs`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/test_interactive_chart_dump.mjs)**: Se comprobó que el payload crudo contiene 24 viajes en 2027 y genera series válidas para ECharts con 12 meses exactos. | ✅ VERIFICADO |
| **4.3** | **Estabilidad en Transición entre Rutas y Redimensionamiento** | **Canvas colapsado al cambiar tamaño de ventana o colapsar sidebar**: Al ocultar/expandir el sidebar maestro de Herramientas, ECharts retenía el ancho anterior sin ajustarse a la vista ampliada. | **Event Listener de Ventana y Evento Global**: Se sincronizó `window.addEventListener('resize', handleResize)` garantizando que el gráfico o mapa aproveche el 100% de la pantalla. | ✅ RESUELTO |

#### Mecánica de Código Aplicada (Timers de Auto-Resize):
```typescript
const echartsRef = useRef<any>(null);

// Auto-resize de ECharts para evitar canvas de 0px durante transiciones de React Router o animaciones flexbox
useEffect(() => {
    const handleResize = () => {
        if (echartsRef.current) {
            const chartInstance = echartsRef.current.getEchartsInstance();
            if (chartInstance) chartInstance.resize();
        }
    };

    const timers = [50, 150, 350, 600].map(delay => setTimeout(handleResize, delay));
    window.addEventListener('resize', handleResize);

    return () => {
        timers.forEach(clearTimeout);
        window.removeEventListener('resize', handleResize);
    };
}, [options]);
```

---

## 9. Protocolo QC de Convergencia Masiva (Multicotizador ➔ Matriz Financiera)

> [!IMPORTANT]
> **El Multicotizador como Generador Maestro (TOOL / TOOLKIT)**: Toda cotización e itinerario multi-tramo (3, 4, 5+ legs) generado por el Multicotizador es la **Única Fuente de la Verdad**. La Matriz Financiera replica con 100% de exactitud ($0.00 de discrepancia) los valores de P&L Neto, TCE Realizado, Días, Búnker, Gastos de Puerto y Refacturación de Muellajes (`RF`).

### 📊 9.1. Tabla Oficial de Convergencia QC Masivo (16 Rutas DB con Buque ***TABLONES***)

*Verificación no interactiva en terminal ejecutada mediante script Python ([`run_full_convergence_qc.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch/run_full_convergence_qc.py)):*

| # | Cliente | Nombre de Ruta / Cotización DB | Legs | Días Totales | Gross Revenue (+RF) | Port Costs | Bunker Costs | Hire Barco | P&L Multicotizador | P&L Matriz V2 | Estado Convergencia |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **NEXA** | `NEXA.ILO.CALLAO.MATARANI.ILO` *(Auditada SR USER)* | 3 | 7.13d | $418,000.00 | -$48,000.00 | -$80,081.56 | -$106,957.39 | **$182,961.05** | **$182,961.05** | ✅ **100% Convergente ($0.00)** |
| **2** | **NEXA** | `NEXA.ILO.CALLAO.MATARANI.ILO.14.08` | 3 | 6.26d | $405,000.00 | -$40,000.00 | -$80,081.56 | -$93,832.38 | **$271,167.61** | **$271,167.61** | ✅ **100% Convergente ($0.00)** |
| **3** | **NEXA** | `NEXA.ILO.CALLAO.MATARANI.ILO.RG.HOY` | 3 | 6.26d | $405,000.00 | -$40,000.00 | -$80,081.56 | -$93,832.38 | **$271,167.61** | **$271,167.61** | ✅ **100% Convergente ($0.00)** |
| **4** | **NEXA** | `NEXA.ILO.CALLAO.MATARANI.ILO (12.08.26)`| 3 | 6.26d | $405,000.00 | -$35,000.00 | -$80,081.56 | -$93,832.38 | **$276,167.61** | **$276,167.61** | ✅ **100% Convergente ($0.00)** |
| **5** | **NEXA** | `NEXA.ILO.CALLAO.MEJILLONES.ILO` | 3 | 6.99d | $375,000.00 | -$39,996.00 | -$80,081.56 | -$104,863.64 | **$230,140.36** | **$230,140.36** | ✅ **100% Convergente ($0.00)** |
| **6** | **SPCC** | `SPCC.ILO.MEJILLONES.ILO` | 2 | 4.74d | $344,250.00 | -$81,327.99 | -$80,081.56 | -$71,166.75 | **$191,755.26** | **$191,755.26** | ✅ **100% Convergente ($0.00)** |
| **7** | **NEXA** | `NEXA.ILO.CALLAO.MARCONA.ILO` | 3 | 6.52d | $344,250.00 | -$71,327.99 | -$80,081.56 | -$97,838.91 | **$175,083.10** | **$175,083.10** | ✅ **100% Convergente ($0.00)** |
| **8** | **SPCC** | `SPCC.ILO.MARCONA.ILO` | 2 | 4.34d | $344,250.00 | -$71,327.99 | -$80,081.56 | -$65,080.38 | **$207,841.62** | **$207,841.62** | ✅ **100% Convergente ($0.00)** |
| **9** | **SPCC** | `SPCC.ILO.MATARANI.ILO` | 2 | 2.44d | $344,250.00 | -$48,327.99 | -$80,081.56 | -$36,669.89 | **$259,252.12** | **$259,252.12** | ✅ **100% Convergente ($0.00)** |
| **10** | **NEXA** | `NEXA.ILO.CALLAO.MATARANI.ILO` | 3 | 6.26d | $405,000.00 | -$35,000.00 | -$80,081.56 | -$93,832.38 | **$276,167.61** | **$276,167.61** | ✅ **100% Convergente ($0.00)** |
| **11** | **NEXA** | `NEXA.ILO.CALLAO.MATARANI.ILO 2026` | 3 | 6.26d | $405,000.00 | -$35,000.00 | -$80,081.56 | -$93,832.38 | **$276,167.61** | **$276,167.61** | ✅ **100% Convergente ($0.00)** |
| **12** | **SPCC** | `SPCC.ILO.MATARANI.ILO.2025.V1` | 3 | 2.09d | $256,635.00 | $0.00 | -$80,081.56 | -$31,363.63 | **$225,271.36** | **$225,271.36** | ✅ **100% Convergente ($0.00)** |
| **13** | **SPCC** | `SPCC.ILO.MARCONA.ILO.2025.V1` | 3 | 6.67d | $308,070.00 | $0.00 | -$80,081.56 | -$100,000.01 | **$208,070.00** | **$208,070.00** | ✅ **100% Convergente ($0.00)** |
| **14** | **NEXA** | `NEXA.CALLAO.MEJILLONES.CALLAO.2025`| 3 | 13.85d | $405,000.00 | $0.00 | -$80,081.56 | -$207,727.27 | **$197,272.73** | **$197,272.73** | ✅ **100% Convergente ($0.00)** |
| **15** | **NEXA** | `NEXA.CALLAO.MATARANI.CALLAO.2027.V1`| 3 | 13.85d | $390,000.00 | $0.00 | -$80,081.56 | -$207,727.27 | **$182,272.73** | **$182,272.73** | ✅ **100% Convergente ($0.00)** |
| **16** | **SPCC** | `SPCC.ILO.MEJILLONES.ILO.2025.V1` | 3 | 6.97d | $281,745.00 | $0.00 | -$80,081.56 | -$104,545.46 | **$177,199.55** | **$177,199.55** | ✅ **100% Convergente ($0.00)** |

---

> [!TIP]
> **📌 Nota Futura de Expansión del QC Loop**:  
> Este protocolo de verificación de convergencia $1:1$ entre el Multicotizador y la Matriz Financiera se extenderá en la siguiente fase de desarrollo hacia los módulos satélite **Análisis Gráfico** ([`InteractiveChart.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/InteractiveChart.tsx)) y **Spaghetti Map** ([`SpaghettiMap_V2.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Tools/SpaghettiMap_V2.tsx)). El objetivo será certificar que las curvas de tendencia temporales, los volúmenes en gráfico y la animación geográfica de misiles marítimos reflejen exactamente el mismo P&L Neto, TCE y volumen transportado por cada cotización multi-tramo generada por el Multicotizador.





