# 🧮 AS-BUILT: Herramienta 01 — Multicotizador Spot

> **Ruta UI**: `/multicotizador`
> **Componente React**: `MultiCotizador_V2.tsx` / `MultiCotizadorExcel.tsx`
> **Módulo Auth**: `multicotizador_spot`

---

## 🧭 Navegación
| [← Precios Búnker](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Matriz Financiera →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard.md) |

---

## 🎯 1. Propósito y Simulación de Circuitos Multileg

El **Multicotizador Spot (`/multicotizador`)** es la herramienta de simulación rápida de viajes comerciales. Permite evaluar viajes con múltiples tramos de carga y descarga (circuitos multileg), proyectando toneladas, días totales y el P&L completo antes de confirmar el negocio.

---

## 📥 Inyección de Dependencias Maestras
- [[AS_BUILT_Maestro_01_Buques_VesselsMaster]] — Selección de barco y consumos.
- [[AS_BUILT_Maestro_02_Rutas_RuteadorSpot_RouteMaster]] — Tramos y distancias náuticas.
- [[AS_BUILT_Maestro_04_Contratos_ContractsMaster]] — Comisiones e indexación.
- [[AS_BUILT_Maestro_06_Costos_Portuarios_PortCostsMaster]] — Estimación de costos de puerto.
- [[AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster]] — Precios de combustible.

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Envío de simulaciones a la grilla comercial.

---

## ⚙️ 2. Arquitectura de Cálculo Multileg

### 2.1 Flujo General

```
UI (MultiCotizadorExcel.tsx)
  └─► puertosConfig[]  ← tabla de puertos con campo OP.DEST (CARGAR / DESCARGAR / NONE)
        └─► apiPayload (tramos[])
              └─► POST /multicotizador/calculate  (forecast.py)
                    └─► calculate_multicotizador_simulation()  (spot_engine.py)
                          └─► Respuesta: consolidated.total_port_costs, total_freight_revenue, pnl_net_utility
```

### 2.2 Tipos de Tramo (`type`)

| Tipo | Descripción |
|------|-------------|
| `LADEN` | Tramo con carga a bordo — genera `net_income = Q × F` |
| `BALLAST` | Tramo sin carga — posicionamiento o reposicionamiento |

### 2.3 Campo OP.DEST (`origin_action` / `destination_action`)

Cada puerto en la tabla de la UI tiene el campo **OP.DEST** que define la operación:

| Valor | Significado | Rol |
|-------|-------------|-----|
| `CARGAR` | Se carga en ese puerto | POL (Puerto de Origen de Carga) |
| `DESCARGAR` | Se descarga en ese puerto | POD (Puerto de Destino de Descarga) |
| `NONE` | Solo tránsito / fondeo sin operación | Sin costo portuario |

> **REGLA CRÍTICA:** El costo de puerto **NO se infiere del tipo de tramo** (`LADEN`/`BALLAST`). Se infiere **exclusivamente del campo `OP.DEST`** del puerto. Un tramo `BALLAST` puede tener costos de puerto si el barco va a cargar en el destino (ej. posicionamiento a CALLAO para cargar).

---

## 🐛 3. Fix IZ.FEED.11.08 — Port Costs Dinámicos en Rutas Multileg Complejas

**Fecha:** 2026-08-12
**Commit Backend:** `4d49c60` — `IZ.FEED.11.08: Fix BALLAST legs preserve agency_costs`
**Commit Frontend:** `2ea46e9` — `IZ.FEED.11.08: Frontend - getDynamicPortCostItems`
**Pre-commit de seguridad:** `f8aaca6` — `PRE.IZ.FEED.11.08`

---

### 3.1 Ruta de Prueba que Reveló el Bug

**Ruta:** `NEXA / BUQUE TABLONES`

| # | Origen | Destino | Tipo | OP.DEST Destino | Costo Puerto Destino |
|---|--------|---------|------|-----------------|----------------------|
| 1 | ILO | CALLAO | BALLAST | CARGAR | $17,000 USD |
| 2 | CALLAO | MATARANI | LADEN | DESCARGAR | $18,000 USD |
| 3 | MATARANI | ILO | BALLAST | NONE | $0 USD |

**Total Port Costs correcto:** `$17,000 + $18,000 = $35,000 USD`

---

### 3.2 Causa Raíz — Backend (`spot_engine.py`)

El bucle de procesamiento de tramos en `calculate_multicotizador_simulation()` **zereaba incondicionalmente** los costos de puerto en tramos `BALLAST`:

```python
# ❌ CÓDIGO ORIGINAL (INCORRECTO)
if tipo == "BALLAST":
    res["port_costs"] = 0.0
    res["agency_costs_origin"] = 0.0
    res["agency_costs_destination"] = 0.0  # ← Borraba $17,000 del tramo ILO→CALLAO
```

Esto causaba que el tramo 1 (`ILO → CALLAO [CARGAR]`, $17,000) nunca sumara al `total_port_costs`, resultando en:
- `total_port_costs = $18,000` (solo MATARANI) en lugar de `$35,000`
- **Voyage Result sobrestimado en $18,000 USD**

**Fix aplicado:**

```python
# ✅ CÓDIGO CORREGIDO
if tipo == "BALLAST":
    res["agency_costs_origin"] = c_orig      # preservar costo real
    res["agency_costs_destination"] = c_dest  # preservar costo real
    res["port_costs"] = c_orig + c_dest       # acumular correctamente
    res["pnl_tramo"] = -res["bunker_costs"] - res["port_costs"]
```

**Archivo:** `backend/spot_engine.py` → función `calculate_multicotizador_simulation()` → líneas ~563-572

---

### 3.3 Causa Raíz — Frontend (`MultiCotizadorExcel.tsx`)

La Card de Port Costs y la Card de Voyage Result (Financial) usaban **valores hardcodeados** de `tramos[0]`:

```typescript
// ❌ CÓDIGO ORIGINAL (INCORRECTO)
const costPOL = result.tramos[0].agency_costs_origin;     // siempre ILO = $0
const costPOD = result.tramos[0].agency_costs_destination; // siempre CALLAO = $17k
// MATARANI ($18k) nunca aparecía en el PnL
```

**Fix aplicado — helper `getDynamicPortCostItems()`:**

```typescript
// ✅ CÓDIGO CORREGIDO
// Recorre puertosConfig[] usando OP.DEST como llave:
// CARGAR  → rol "POL (PUERTO)" → suma agency_costs_destination del tramo siguiente
// DESCARGAR → rol "POD (PUERTO)" → suma agency_costs_destination del tramo correspondiente
// NONE    → se ignora (sin costo)
const portItems = getDynamicPortCostItems();
const totalPortCosts = result?.consolidated?.total_port_costs
    ?? portItems.reduce((sum, item) => sum + item.cost, 0);
```

**Archivo:** `src/components/CommercialForecast/MultiCotizadorExcel.tsx`
- Helper `getDynamicPortCostItems()` — definido en el scope del componente
- Card Port Costs — línea ~3009: `const portItems = getDynamicPortCostItems()`
- Card Voyage Result — línea ~3202: `const portItems = getDynamicPortCostItems()`

---

### 3.4 Resultado Verificado en Terminal

```
--- RESULTADOS SIMULACIÓN MULTILEG COMPLEJA (NEXA/TABLONES) ---
Revenue Total:        $405,000.00
Bunker Total:              $0.00
Port Costs Total:     $35,000.00  ✅ (era $18,000 — fix correcto)
Net Profit (P&L):    $370,000.00
Días Totales:              7.13 d
TCE Real:            $51,889.82 $/día

[PASS] ASSERTIONS APROBADAS: total_port_costs == $35,000 USD ✅
```

**Build Frontend:** `✓ 1052 modules transformed — built in 17.15s` — sin errores de compilación.

---

### 3.5 Despliegue a Producción

**URL Producción:** https://forecast.geeksoft.tech
**Servidor VPS:** `91.108.125.253` (Hostinger)
**Método:** `deploy_forecast_kickoff.py` (SFTP + SSH restart + Nginx reload + Certbot SSL)

```
[OK] dist/ subido ✅
[OK] Geeksoft_Engine subido ✅
[OK] Backend FastAPI reiniciado ✅
[OK] Nginx syntax OK ✅
[OK] SSL HTTPS activo ✅
PUBLICADA EN: https://forecast.geeksoft.tech
```

---

## 📌 4. Diagnóstico y Plan de Corrección: Integración Dinámica de Búnker Spot

### 4.1 Lista de Hallazgos y Diagnóstico

| # | Hallazgo | Diagnóstico Técnico | Impacto |
|---|----------|---------------------|---------|
| **1** | **Fallback incompleto en `MAESTRO_CONTRATOS`** | Cuando un cliente/contrato no define precio base (`bunker_baseline_price_ifo` / `mdo` = 0), el frontend mantiene congelados los precios default `$967.26 / $1,528.26` en lugar de hacer fallback automático al precio vigente de `bunker_prices`. | Muestra precios obsoletos de búnker cuando el contrato no estipula base. |
| **2** | **Disparo Reactivo al Conmutar Selector `FUENTE`** | Al cambiar el selector de FUENTE (`MAESTRO_BUNKER`, `MAESTRO_CONTRATOS`, `SOBREESCRITURA`), los valores cambian en el estado local pero no disparan inmediatamente la recalculación del API (`POST /multicotizador/calculate`). | Grilla P&L desfasada hasta que el usuario fuerce otro evento. |
| **3** | **Dependencia de Precios Iniciales Hardcodeados** | El estado de `bunkerPriceIfo` y `bunkerPriceMdo` inicia con defaults hardcodeados (`967.26`, `1528.26`) antes de que `ForecastService.getLatestBunker()` resuelva la promesa asíncrona. | Breve ventana donde la simulación usa precios desactualizados si se autoejecuta. |
| **4** | **Trazabilidad en PDF de Cotización** | El reporte PDF exportado muestra `Bunker Total ($)` pero no indica la fuente del precio utilizada (`MAESTRO_BUNKER` vs `MAESTRO_CONTRATOS` vs `SOBREESCRITURA`) ni la fecha del precio. | Falta de auditoría comercial en cotizaciones enviadas a clientes. |
| **5** | **Homologación MGO ➔ MDO en Labels PDF/UI** | Ocasionalmente se usa la etiqueta MGO sin la aclaración explícita del estándar PETRAL (MGO $\equiv$ MDO). | Incumplimiento de la regla de homologación unificada. |
| **6** | **Formato Numérico sin Separador de Miles en Precios Búnker** | Los campos/celdas de `PRECIO ($/T)` (IFO/MDO) muestran los valores como texto sin formato (ej: `1100`, `1528.26`). | Dificultad de lectura en grilla comercial y reportes visuales. |
| **7** | **Etiqueta de Columna `OVERHEAD (H)` Desactualizada** | El encabezado de columna en la grilla del Multicotizador figura como `OVERHEAD (H)`. | Inconsistencia terminológica con la nomenclatura contractual `Time to Count (H)`. |
| **8** | **Mismatch en Días Puerto por Omisión de Posicionamiento (`posic`)** | El modelo Excel calcula `Total Hrs = (TM/Ritmo) + Time to Count + Posic` ($27 + 6 + 1 = 34\text{h} \rightarrow 1.42\text{d}$ en CALLAO, totalizando $3.07\text{d}$), mientras la UI omitía la $1\text{h}$ de `posic`, resultando desfasada en $3.03\text{d}$. | Desfase de $0.04\text{d}$ en días de puerto, búnker e impacto directo en TCE Real. |
| **9** | **Incoherencia en la Fila 'TOTAL ESTIMADO' de Días Puerto (`3.03` vs `3.07`/`3.08`)** | La grilla individual de tramos muestra `1.42 d` (Callao) y `1.66 d` (Matarani), pero la fila de 'TOTAL ESTIMADO' al pie de la tabla muestra **`3.03 d`**, rompiendo la suma visible de las filas ($1.42 + 1.66 = 3.08\text{d}$). | Inconsistencia de auditoría interna visible en la grilla comercial del Multicotizador. |
| **10** | **Presencia Fantasma de MDO (`1.3 t`) en Buques Mono-Fuel (`TABLONES`)** | El buque `TABLONES` tiene consumos de MDO en $0.0\text{ t/d}$ para todas las fases. Sin embargo, el motor inyectaba $1.3\text{ t}$ ($1.27\text{ t}$) de MDO por usar fallbacks arbitrarios durante overheads. | Imputación indebida de combustible en barcos mono-fuel que no consumen MDO. |
| **11** | **Sensibilidad de Precisión Decimal en Tonelajes de Búnker** | Redondear prematuramente los tonelajes de búnker a 1 decimal (ej: `71.6 t` vs `71.554 t`) genera diferencias de hasta $\$110\text{ USD}$ en el costo total de combustible ($\$78,760\text{ USD}$ vs $\$78,709\text{ USD}$). | Mismatch en la convergencia exacta de búnker frente al Excel del usuario. |

---

### 4.2 Plan de Acción y Corrección

#### Fase 1: Fix de Reactividad, Formato, Mismatch Math y Labels UI en Frontend (`MultiCotizadorExcel.tsx`)
1. **Sincronización Total de Días Puerto (`1.42d + 1.66d = 3.07d/3.08d`):** Corregir la celda 'TOTAL ESTIMADO' de Días Puerto en el pie de la tabla para que lea la suma acumulada de los tramos individuales incluyendo las horas de `posic`.
2. **Fórmula de Días de Puerto con Posicionamiento (`posic`):** Actualizar la fórmula de cálculo de días de puerto a:
   $$\text{Días Puerto} = \frac{(\text{TM} / \text{Ritmo}) + \text{Time to Count (H)} + \text{Posic (H)}}{24}$$
   *Para CALLAO ($13,500 / 500 + 6 + 1 = 34\text{h} \rightarrow 1.416667\text{d}$), logrando la suma exacta de $3.072917\text{ días}$.*
3. **Renombrar Encabezado `OVERHEAD (H)` ➔ `Time to Count (H)`:** Cambiar el label visual del encabezado de columna en `MultiCotizadorExcel.tsx` a `Time to Count (H)`.
4. **Separador de Miles en Precios `PRECIO ($/T)`:** Aplicar formateador `toLocaleString('en-US')` / `fmtThousandSep` a los campos de entrada e inputs de IFO y MDO (ej. `$1,100.00` y `$1,528.26`).
5. **Fallback Automático a `latestBunkerPrices`:** En el `useEffect` de resolución de contratos, si `cIfo == 0` o `cMdo == 0`, forzar la asignación automática desde `latestBunkerPrices` (`bunker_prices`).
6. **Disparo de Recálculo Inmediato:** Agregar `bunkerPriceIfo`, `bunkerPriceMdo` y `bunkerSource` al arreglo de dependencias del `useEffect` de simulación reactiva, garantizando que todo cambio de fuente o precio recalcule el P&L al instante.
7. **Inicialización Asíncrona Limpia:** Esperar a la resolución de `getLatestBunker()` antes de habilitar el primer disparo automático del motor.

#### Fase 2: Robustecimiento en Backend API (`forecast.py` / `spot_engine.py`)
1. **Eliminación de MDO Fantasma en Buques Mono-Fuel:** En `spot_engine.py`, si todos los consumos MDO del buque son `0.0`, forzar de forma estricta `tot_mdo_tons = 0.000` y `mdo_cost = $0.00`, anulando cualquier fallback arbitrario.
2. **Alta Precisión Decimal en Tonelaje y Costos de Búnker:** Mantener flotante de 64 bits sin redondeos prematuros en el motor Python, aplicando redondeo únicamente a 3 decimales en tonelaje (`71.554 MT`) y a 2 decimales en moneda (`$78,708.93 USD`).
3. **Validación de Integridad:** Verificar que `POST /multicotizador/calculate` valide la coherencia de los precios recibidos con el maestro `bunker_prices` vigente si la fuente solicitada es `MAESTRO_BUNKER`.
4. **Homologación Estándar MGO/MDO:** Confirmar que todos los nodos de respuesta etiqueten adecuadamente MDO (cubriendo MGO).

#### Fase 3: Trazabilidad y Auditoría en Exportación PDF (`MultiCotizadorExcel.tsx`)
1. **Header de Auditoría de Búnker en PDF:** Agregar en la sección de P&L del PDF exportado:
   - Fuente utilizada: `[MAESTRO BÚNKER | MAESTRO CONTRATOS | SOBREESCRITURA]`
   - Cotizaciones aplicadas: `IFO 180: $XXX.XX USD/MT | MDO: $YYY.YY USD/MT (Fecha: YYYY-MM-DD)`

---

### 4.3 Protocolo Metodológico de Ejecución Iterativa (Loop Atómico por Cambio)

1. **Paso 0 — Commit de Seguridad Baseline:** Realizar un `git commit` / `git push` del estado actual para asegurar el punto de restauración seguro inicial.
2. **Paso 1 — Ejecución del Cambio Individual:** Aplicar **un solo cambio a la vez** de la lista (comenzando por el Cambio #1).
3. **Paso 2 — Verificación Local en Terminal:** Probar el cambio localmente en la consola (build/scripts) y mostrar el resultado (éxito/error) en pantalla.
4. **Paso 3 — Despliegue al VPS:** Desplegar a Producción (VPS Hostinger) ejecutando:
   - `npm run build` en `Geeksoft_Frontend`
   - `python deploy_forecast_kickoff.py` en `Push.VPS`
5. **Paso 4 — Validación del Usuario & Control de Versiones:**
   - **Si el usuario confirma "TODO OK":** Realizar nuevo `git commit` / `git push` y avanzar al siguiente cambio.
   - **Si el usuario indica "SALIÓ MAL":** Rollback inmediato al último commit seguro (`git reset --hard`).
6. **Loop Iterativo:** Repetir este proceso estrictamente hasta procesar todos los hallazgos.

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Envío de simulaciones a la grilla comercial.

---

## 🔗 Referencias Técnicas

- **Motor de cálculo:** `Geeksoft_Engine/backend/spot_engine.py` → `calculate_multicotizador_simulation()`
- **Router API:** `Geeksoft_Engine/backend/api/routers/forecast.py` → `POST /multicotizador/calculate`
- **Modelo Pydantic:** `Geeksoft_Engine/backend/models/forecast_models.py` → `MultiCotizadorRequest`
- **Componente React:** `Geeksoft_Frontend/src/components/CommercialForecast/MultiCotizadorExcel.tsx`
- **Documentación histórica:** [[multicotizador]] (Maestros y Módulos)

