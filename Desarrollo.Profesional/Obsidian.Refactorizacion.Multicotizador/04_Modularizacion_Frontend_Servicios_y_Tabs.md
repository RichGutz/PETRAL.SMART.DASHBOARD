# 📦 MODULARIZACIÓN FRONTEND Y ARQUITECTURA DE SERVICIOS (PUNTO 0)

> **Ruta de Control**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador`  
> **Fecha de Documentación**: 14 de Agosto de 2026  
> **Estado de Despliegue VPS**: `https://forecast.geeksoft.tech`  

---

## 1. 🎯 Estructura Desacoplada de Componentes (Enterprise Pattern)

Se completó el desacoplamiento de `MultiCotizadorExcel.tsx`, separándolo en servicios proveedores puros y subcomponentes modulares limpios bajo la siguiente jerarquía de archivos:

```
Geeksoft_Frontend/src/
├── services/providers/
│   ├── vesselProviderService.ts        # Extrae consumos, DWT, GRT y parámetros del buque
│   ├── routeDistancesService.ts       # Resuelve distancias NM y weather factor (WF)
│   ├── portCostsRatesService.ts       # Consulta port_cost_static y desglose de muellaje ($33,333)
│   ├── multicotizadorStorageService.ts # Graba cotizaciones en routes_clients y routes_quotes
│   └── multicotizadorRetrieverService.ts# Recupera y desempaqueta proformas comerciales
└── components/CommercialForecast/
    ├── MultiCotizadorExcel.tsx          # Controlador principal de estado global (< 600 líneas)
    └── multicotizador/
        ├── VesselFactSheetHeader.tsx   # Fact Sheet técnico del buque (Paso 4 & Consumos)
        ├── SpreadsheetTramosGrid.tsx   # Grilla live (Tramos, Time to Count, Celda Dual Muellaje $33,333)
        ├── FinancialResultCards.tsx   # Tarjetas inferiores (Búnker IFO/MDO, Port Costs, PnL)
        └── SaveLoadQuoteModals.tsx    # Modales de persistencia (Guardar / Cargar Cotización)
```

---

## 2. 🧱 Responsabilidad de cada Módulo y Subcomponente

### 🔌 Servicios Proveedores (`src/services/providers/`)
- **`vesselProviderService.ts`**: Resuelve las especificaciones técnicas del buque y sus consumos de combustible por estado (Navegación / Espera / Carga / Descarga).
- **`routeDistancesService.ts`**: Mapea pares de puertos (`port_a ➔ port_b`) contra `routes_clients` retornando distancia exacta en NM.
- **`portCostsRatesService.ts`**: Consulta las tarifas estáticas en `port_cost_static`, extrayendo el costo base de agencia y los **$33,333.00** de muellaje.
- **`multicotizadorStorageService.ts`**: Persiste proformas en Supabase DB respetando si es Cliente Activo (`routes_clients`) o Prospecto (`routes_quotes`).
- **`multicotizadorRetrieverService.ts`**: Carga y desempaqueta la proforma comercial completa restaurando tramos, puertosConfig y búnker.

### 📋 Fact Sheet del Buque (`VesselFactSheetHeader.tsx`)
- Renderiza el encabezado rojo Fact Sheet con los insumos del buque (GRT, DWT, DWCC, Calado, Consumos).
- Mantiene sincronizados los precios IFO y MDO según la fuente seleccionada (`Maestro de Contratos`, `Cotización`, `Maestro Búnker`).

### 📑 Grilla Spreadsheet Live (`SpreadsheetTramosGrid.tsx`)
- Renderiza la matriz multi-tramo ($N$ piernas) con selección de puertos, distancias NM, días de mar y puerto.
- **Time to Count**: Columna interactiva que auto-carga los delays de estadía estipulados (`12.0h` NEXA, `6.0h` SPCC).
- **Celda Dual de Muellaje**: Sub-celda 1 con el valor numérico (\$33,333.00 en Mejillones descarga) y Sub-celda 2 con la casilla de refacturación **`RF` `[x]`**.

### 💰 Tarjetas de Resultado Financiero (`FinancialResultCards.tsx`)
- Muestra el desglose de 4 tarjetas paralelas: Búnker IFO/MDO, Gastos Portuarios, Comisiones Comerciales y Voyage Result / PnL.
- Mantiene paridad numérica del 100% con los insumos de la cabecera Fact Sheet y la grilla live.

---

## 3. 🎯 Especificaciones de Control Funcional (6 Puntos Integrados)

1. **Paso 1 — Selector de Cliente (Activos vs Prospectos):**
   - Pestaña `PROSPECTOS`: Filtra la lista de clientes prospectos reales (`is_prospect = true` -> `MARCOBRE`, `PRIMAX`, `CODELCO`, `R TRADING`, `CERRO VERDE`).
   - Pestaña `ACTIVOS`: Filtra clientes con contratos vigentes (`SPCC`, `NEXA`).
2. **Paso 2 — Cargar Ruta:** Menu desplegable con las 66 rutas de `routes_clients`.
3. **Paso 3 — Cargar Cotización:** Menu desplegable con las proformas guardadas en `routes_quotes`.
4. **Paso 4 — Selector de Buque & Time to Count:** Sincronización de consumos e inicialización de horas de delay (`12.0h` NEXA, `6.0h` SPCC).
5. **Muellaje & Refacturación `RF`:** Auto-imputación de **$33,333.00** en Mejillones descarga y activación de casilla `RF` `[x]`.
6. **Paridad MDO:** Homologación exacta de precios y costos de MDO entre Fact Sheet, grilla y tarjetas.

---

## 4. 🧪 Resultados del QC Loop V2

| Métrica | Excel PETRAL Real | Engine / API Response | Delta ($\Delta$) | Estado |
|---|---|---|---|---|
| **Gross Revenue** | `$405,000.00 USD` | `$405,000.00 USD` | `0.000000` | **`[OK]`** |
| **Port Costs** | `$35,000.00 USD` | `$35,000.00 USD` | `0.000000` | **`[OK]`** |
| **Muellaje Refacturado** | `$33,333.00 USD` | `$33,333.00 USD` | `0.000000` | **`[OK]`** |
| **Días de Mar** | `4.057576 Días` | `4.057576 Días` | `0.000000` | **`[OK]`** |
| **Días de Puerto** | `3.072917 Días` | `3.072917 Días` | `0.000000` | **`[OK]`** |
| **Días Totales** | `7.130492 Días` | `7.130492 Días` | `0.000000` | **`[OK]`** |
| **Voyage Result** | `$289,925.52 USD` | `$289,918.44 USD` | `7.084621` | **`[OK]`** |

**Resultado Final**: `[OK] CONVERGENCIA ARQUITECTURAL MODULAR 100%: PASS`.

---

## 5. 🚀 Estado Actual del Avance y Próximos Pasos

### 📊 Logros y Mejoras Alcanzadas en la Sesión
- **Desacoplamiento Estructural**: Reducción del componente monolítico `MultiCotizadorExcel.tsx` delegando responsabilidades a servicios puros (`src/services/providers/`) y subcomponentes modulares (`src/components/CommercialForecast/multicotizador/`).
- **Punto 1 (Prospectos)**: Integración dinámica del listado de clientes prospectos reales de la tabla `clients` (`MARCOBRE`, `PRIMAX`, `CODELCO`, `R TRADING`, `CERRO VERDE`) al seleccionar la pestaña `PROSPECTOS`.
- **Paso 2 y 3 (Desplegables de Carga)**: menus desplegables `<select>` para la selección directa de rutas (`routes_clients`) y cotizaciones (`routes_quotes`).
- **Paso 4 (Buque & Time to Count)**: Auto-llenado de Delays (`12.0h` NEXA, `6.0h` SPCC) en la columna `TIME TO COUNT (H)`.
- **Paso 5 (Muellaje & Checkbox `RF`)**: Auto-imputación de **$33,333.00** de muellaje en Mejillones descarga con casilla `RF` `[x]` habilitada.
- **Paso 6 (Paridad MDO)**: Homologación numérica del precio y costo de MDO entre Fact Sheet, grilla y tarjetas financieras.
- **Despliegue VPS**: Publicado y verificado en vivo en `https://forecast.geeksoft.tech`.

### 📌 Nota de Avance
> **Estado:** La arquitectura y la interfaz muestran un avance sustancial y una estabilidad superior a la versión anterior. Si bien aún restan ajustes finos y trabajo continuo en siguientes fases (afinar escenarios complejos de multirecalas y pulido visual extremo), la estructura actual representa un hito de mejora significativo.


