# MANUAL Y DOCUMENTACIÓN INTEGRAL DEL SISTEMA PETRAL SHIPPING.SOFT V2.5 PRO

> **NAVIERA PETRAL S.A.**  
> *Plataforma Comercial, Operativa y de Auditoría de Costos Portuarios (Costa Oeste PE / CL)*  
> **Última Actualización:** 2026-07-26 | **Estado:** 97% READY — Commit `b47cd5e`

---

## 1. VISIÓN GENERAL Y ARQUITECTURA DEL ECOSISTEMA

PETRAL SHIPPING.SOFT V2.5 es una plataforma web integral diseñada para la simulación comercial Spot, gestión de contratos marco COA, tarificación dinámica $P \times Q$, contabilidad de viajes (Voyage Ledger P&L) y auditoría de gastos portuarios.

### Principios Fundamentales del Sistema:
1. **Regla de Sin Fallbacks ("NO HAY"):** Si un dato o tarifa no existe en la base de datos Supabase, el sistema no inventa valores ni usa fallbacks genéricos. Muestra explícitamente `NO HAY`.
2. **Homologación MDO/MGO:** En todo el software PETRAL, las siglas **MGO** (Marine Gas Oil / Diesel Marino) equivalen y se registran unificadamente bajo el estándar **MDO**.
3. **Regla 6 QC Overtime (+25%):** En zarpes u operaciones fuera de jornada hábil (nocturno, dominical o feriado), el recargo de Overtime (+25%) se aplica individualmente $P_{base} \times 1.25$ sobre practicaje OUT, remolques OUT, lanchas y agenciamiento.
4. **Layout Fluido & Sidebar Congelado:** La barra lateral navegable está congelada rígidamente a **320px fijos** (`w-[320px] shrink-0`), mientras que la vista principal del módulo ocupa el **100% del ancho disponible de la pantalla (`w-full max-w-full`)**.
5. **Arquitectura Offline-First (Fallback Client-Side):** Todos los motores de cálculo (Multicotizador y Auditoría Final) operan con un `Promise.race` de 300–500ms contra el backend Python. Si el backend no está disponible, el cálculo se realiza íntegramente en el frontend con las mismas fórmulas oficiales. El usuario **nunca ve una pantalla en blanco**.

---

## 2. DATOS MAESTROS (11 MÓDULOS EN 4 CATEGORÍAS)

El menú de **DATOS MAESTROS** organiza el catálogo oficial del sistema en 4 bloques funcionales:

```
DATOS MAESTROS
├── 🏗️ MAESTROS FÍSICOS
│   ├── 🚢 Maestro de Flota
│   ├── ⚓ Maestro de Puertos y Terminales
│   └── ✏️ Maestro de Distancias
├── 💼 MAESTROS COMERCIALES
│   ├── 🏢 Maestro de Clientes
│   ├── 📜 Maestro de Contratos
│   ├── 📍 Maestro de Rutas
│   └── 📑 Maestro de Cotizaciones
├── 💰 MAESTROS DE COSTOS
│   ├── 🏷️ Maestro de Tarifas Portuarias
│   └── 🧮 Maestro de Gastos Portuarios
└── ⛽ MERCADO & ORIGINACIÓN
    ├── ⛽ Maestro de Búnker
    └── ⚙️ Maestro de Originación
```

### 2.1 🏗️ MAESTROS FÍSICOS
* **Maestro de Flota (`/vessels`):** Reglas constructivas de la nave (LOA, GRT/TRB, DWT, Calados Summer/Tropical) y matriz de consumos de búnker IFO 380, VLSFO y Diesel MDO en las 3 fases operativas: Navegando (Lastre/Cargado), Operando en Muelle y Espera/Fondeo.
* **Maestro de Puertos y Terminales (`/ports`):** Directorio de terminales de Perú y Chile (Callao APM/Multiboyas, Matarani Tisur, Ilo SPCC/Enapu, Marcona, Mejillones). Regula la variable **Q (Cantidad)** de permanencia:
  $$\text{Horas Muelle } Q_{total} = \frac{\text{Carga MT}}{\text{Ritmo MT/h}} + 4.0\text{ horas fijas (Amarre/Desamarre + Conexiado/Desconexiado)}$$
  * **Matriz Callao:** Evalúa Practicaje ($Q_{TRB}$), Remolcaje ($2\text{ IN} / 2\text{ OUT}$ por HP/TRB), Muellaje a la Nave (LOA y $Q_{total}$ horas), Muellaje a la Carga ($Q_{MT}$), Tasas DICAPI/APN, Sanidad Marítima y Overtime (+25%).
* **Maestro de Distancias (`/routes`):** Matriz distancial oficial en Millas Náuticas ($NM$) entre puertos de originación y destino para el cálculo de días navegando.

### 2.2 💼 MAESTROS COMERCIALES
* **Maestro de Clientes (`/clients`):** Registro corporativo exclusivo de los 2 clientes comerciales activos con contrato marco de Naviera Petral:
  1. **Southern Perú Copper Corporation (SPCC)**
  2. **Nexa Resources Peru S.A.A. (NEXA)**
* **Maestro de Contratos (`/contracts`):** Términos marco COA (Flete base USD/MT, horas Laytime permitidas, tasa de Demurrage USD/día y fórmulas de indexación BAF).
* **Maestro de Rutas (`/spot-routes`):** Parejas Origen-Destino físicas activas vinculadas a clientes en `routes_clients` (ej. *SPCC Ilo - Callao*, *Nexa Cajamarquilla*).
* **Maestro de Cotizaciones (`/quotes`):** Registro histórico de proformas comercial Spot emitidas a prospectos en `routes_quotes`.

### 2.3 💰 MAESTROS DE COSTOS
* **Maestro de Tarifas Portuarias (`/port-tariffs`):** Catálogo de tarifas unitarias por proveedor y servicio.
* **Maestro de Gastos Portuarios (`/port-costs` - Los 3 Tabs Operativos):**
  * **Tab 1 — Modelo Estático:** Matriz de costos fijos estáticos ($USD) por puerto y buque, desagregada por rubros de faena: Costo Principal (`MAIN`), Loading Master / Supervisión (`loading_master`) y Otros Gastos (`other`).
  * **Tab 2 — Matriz Compleja:** Estructura tarifaria dinámica avanzada con reglas condicionales $P \times Q$ por proveedor.
  * **Tab 3 — Bandas Tarifarias:** Tablero de auditoría de toda la flota que verifica el encuadre del costo fijo de DB contra el rango de tolerancia hábil **MIN** vs pesimista con Overtime (+25%) **MAX**. Muestra los estados: ✅ `EN BANDA`, ❌ `SOBRE MAX`, o `NO HAY`.

### 2.4 ⛽ MERCADO & ORIGINACIÓN
* **Maestro de Búnker (`/bunker-prices`):** Matriz de precios de combustible IFO 380, VLSFO y Diesel MDO, aplicando estrictamente la regla **MGO = MDO**.
* **Maestro de Originación (`/sources-sinks`):** Oferta y demanda de carga (Sources & Sinks) por puerto, empresa y producto en TM/año.

---

## 3. HERRAMIENTAS & MOTORES (7 MÓDULOS - GUÍA BOTÓN POR BOTÓN)

### 3.1 ⛴️ Multicotizador Multirutas (`/multicotizador`)
* **⚡ Botón "Simular Itinerario / Calcular Flete":** Ejecuta el motor Spot calculando días navegando ($T_{ballast} + T_{laden}$), días en muelle ($Q_{op} + 4.0\text{h}$), consumo de búnker IFO/MDO y gastos portuarios para obtener el Flete de Equilibrio y el TCE Target ($USD/\text{día}$).
* **🎛️ Selector "Costos Puerto: STATIC / MATRIX":** Alterna en tiempo real entre el Modelo Estático (costo fijo de `port_cost_static`) y la Matriz Compleja $P \times Q$ dinámica. El recálculo automático (estilo Excel) se dispara en ≤ 500ms al cambiar el selector.
* **💾 Botón "Guardar Cotización Spot":** Registra la simulación en `routes_quotes` con código de proforma comercial.
* **📄 Botón "Exportar PDF / Excel":** Genera el informe proforma membretado oficial para envío al cliente.
* **⚙️ Fallback Offline:** Si el backend Python (uvicorn) no responde en 500ms, el motor ejecuta automáticamente el cálculo client-side con las fórmulas oficiales PETRAL (Weather Factor, ritmos T/h, consumos IFO/MDO). El usuario nunca ve pantalla en blanco.

### 3.2 📊 Matriz Financiera - Voyage Ledger P&L (`/dashboard`)
* **➕ Botón "Nuevo Asiento de Viaje (NVR)":** Abre la ventana para registrar un nuevo viaje asignando buque, ruta, toneladas e ingresos por flete.
* **🔒 Botón "Cerrar Viaje / Conciliar Ledger":** Bloquea la edición del viaje y concilia los costos estimados de búnker y agenciamiento frente a las facturas reales liquidadas, determinando la Utilidad Neta Real.
* **🔍 Botón "Ver Desglose de Gastos P×Q":** Despliega la auditoría ítem por ítem del viaje (practicaje, remolques, búnker en lastre/cargado y comisiones).
* **📊 Botón "Exportar Libro Financiero (Excel)":** Descarga el estado de resultados consolidado de la flota para la gerencia financiera.

### 3.3 📈 Análisis Gráfico (`/graphic-analysis`)
* **📅 Selector "Horizonte Temporal":** Filtra la serie temporal a nivel Mensual, Trimestral o Anual.
* **📊 Selector de Métrica (TCE / Búnker / Tarifas):** Cambia el indicador visualizado entre Rendimiento Diario ($USD/\text{día}$), Consumo MDO/IFO y Desembolsos Portuarios.
* **📈 Botón "Alternar Tipo de Gráfico":** Modifica la visualización entre Barras Comparativas, Líneas de Tendencia Continua y Área Acumulada.
* **📷 Botón "Exportar Gráfica (PNG / SVG)":** Descarga la imagen vectorial de alta resolución.

### 3.4 🗺️ Spaghetti Map (`/spaghetti-map`)
* **🏢 Botón "Filtro por Cliente (SPCC / NEXA)":** Muestra u oculta las rutas marítimas asignadas a cada cliente.
* **🗺️ Conmutador de Capas (Satélite vs Marítimo OSM):** Alterna entre capa satelital de alta resolución e hidrográfica náutica OpenStreetMap.
* **📏 Herramienta "Medir Distancia Náutica (NM)":** Permite hacer clic sobre el mapa para calcular distancias náuticas entre coordenadas.
* **🎯 Botón "Recentrar Costa Oeste":** Enfoca la vista sobre la Costa Oeste de Sudamérica (Callao-Matarani-Ilo-Mejillones).

### 3.5 ⚖️ Auditoría Final — Acta Maestra (`/audit-final`)

**Componente:** `VoyageLedgerFinal.tsx` (commit base `92d18d9 OK.HTA.AUDITORIA`)

La herramienta genera el **Acta Oficial de Auditoría y Trazabilidad** — un documento PDF imprimible en A4 Apaisado con membrete dual (Logo Petral + Logo Geeksoft) que consolida matemáticamente todas las rutas del cliente seleccionado.

#### Estructura del Acta (por cada Ruta/Opción):
1. **5 Cards de Inputs Maestros** (trazabilidad de origen de cada variable):
   - `CARD 1 (RUTAS)` — Itinerario, Distancia Total NM, Weather Factor
   - `CARD 2 (BUQUES)` — Vessel, Speed kts, Consumos IFO/MDO, TCE Requerido
   - `CARD 3 (BÚNKER)` — Precio IFO $/t, Precio MDO $/t, Tonelaje estimado, BAF Baseline
   - `CARD 4 (CONTRATOS & COMERCIAL)` — Cliente, Q (MT), Freight Base $/MT, Ritmos carga/descarga, Comisiones
   - `CARD 5 (PUERTOS & AGENCIA)` — Agencia Carga USD, Agencia Descarga USD, Total Port Costs USD
2. **Aritmética Pierna a Pierna** — Desglose explícito de cada tramo: días de mar (con fórmula WF), días de puerto, búnker por pierna.
3. **Tabla Oficial Ledger (12 Métricas)** — Cada fila incluye Ítem, Fórmula Aplicada, Cálculo Numérico Sustituido y Valor Geeksoft Engine:
   - Ritmo Carga, Ritmo Descarga, Días Puerto, Días Mar, Días Totales, Income, Comisiones, Búnker, Port Costs, Voyage Result, TCE Diario, P/L vs TCE Req.
4. **Pie de Firma** — Bloque de Responsable Auditor, Estado (Aprobado / Con Errores / Observado), Firma y caja de Comentarios.

#### Controles del Ribbon:
* **Selector "Cliente"** — SPCC / NEXA / PROSPECTOS.
* **Selector "Buque"** — Flota PETRAL (MOQUEGUA, TABLONES, CONCON TRADER, HUEMUL).
* **Selector "Matriz"** — Estática (Master) / Dinámica (JSONB).
* **Botón "Imprimir / Exportar PDF"** — Abre ventana de impresión sin encabezados del navegador (`@page { margin: 0mm }`) con salto de página automático por ruta.
* **⚙️ Fallback Offline:** Si el backend no responde en 300ms, el Acta se genera íntegramente con cálculo client-side — **el Acta siempre aparece**.

### 3.6 🗺️ Flowchart del Sistema (`/system-flowchart`)
* **🔀 Selector "Nivel de Diagrama (1 a 5)":** Navega entre los 5 niveles de arquitectura (Nivel 1 Maestros $\rightarrow$ Nivel 2 Spot $\rightarrow$ Nivel 3 P×Q $\rightarrow$ Nivel 4 Ledger $\rightarrow$ Nivel 5 Auditoría).
* **📥 Botón "Descargar Flowchart (SVG / PDF)":** Exporta el flujograma vectorial oficial para manuales operacionales.
* **🔍 Botón "Zoom Interactivo / Pantalla Completa":** Amplía el lienzo del flujograma permitiendo explorar dinámicamente cada nodo.

### 3.7 📚 Documentación del Sistema (`/system-documentation`)
* **🔍 Campo "Buscador Inteligente de Módulos":** Filtra los 18 capítulos por títulos, subtítulos o palabras clave en tiempo real.
* **🗂️ Acordeón "DATOS MAESTROS" (Colapsable):** Despliega o contrae verticalmente la lista de los 11 maestros.
* **🛠️ Acordeón "HERRAMIENTAS & MOTORES" (Colapsable):** Despliega o contrae verticalmente los 7 módulos de herramientas.
* **📥 Botón "Descargar PDF Membretado":** Abre el cuadro de impresión para descargar el manual editorial oficial con logo de Naviera Petral.

---

## 4. MEJORAS GLOBALES DE UI Y TEMPLATE (`MasterTemplate_V2.tsx`)

1. **Menús Colapsables Verticalmente en todo el Software:**
   - La barra lateral navegable en cualquier pantalla del software cuenta con acordeones colapsables para los bloques **DATOS MAESTROS** y **HERRAMIENTAS**, con botones de flecha interactivos (`ChevronDown` / `ChevronRight`).
2. **Botón "Nueva Pestaña":**
   - El botón de la cabecera superior del software permite abrir cualquier módulo en una pestaña independiente del navegador (`window.open(location.href, '_blank')`).
3. **Layout de Ancho Fluido & Sidebar Congelado:**
   - La barra lateral navegable está congelada rígidamente a **320px fijos** (`w-[320px] min-w-[320px] max-w-[320px] shrink-0`), garantizando que jamás se mueva o cambie de tamaño al hacer clic en distintos módulos.
   - El panel contenedor principal ocupa el **100% de todo el ancho disponible de la pantalla (`w-full max-w-full`)**, aprovechando por completo monitores 1080p, 2K o ultrawide.

---

## 5. REGISTRO DE CAMBIOS — SESIÓN 26-07-26

| Commit | Descripción |
|---|---|
| `92d18d9` | `OK.HTA.AUDITORIA` — Versión base del Acta Maestra con 5 Cards + 12 métricas ledger |
| `83301ce` | Restauración UTF-8 limpia de `VoyageLedgerFinal.tsx` desde `git checkout` (sin `Out-File` de PowerShell que corrompía box-drawing chars `═══ ─── ╔`) |
| `feda1c5` | Supresión del encabezado nativo del navegador al imprimir: `@page { margin: 0mm }` + `body { padding: 5mm }` |
| `143127c` | **3 bugs corregidos en `MultiCotizadorExcel.tsx`:** (1) `autoFillPortCost` usaba prop fijo `portCostMode` → corregido a `localPortCostMode`; (2) `useEffect` reactivo escuchaba `portCostMode` → corregido a `localPortCostMode`; (3) `handleCalculate` sin timeout → añadido `Promise.race` 500ms + fallback client-side completo |
| `b47cd5e` | **Milestone `97.percent.READY.26.07.26`** |


---

## 1. VISIÓN GENERAL Y ARQUITECTURA DEL ECOSISTEMA

PETRAL SHIPPING.SOFT V2.5 es una plataforma web integral diseñada para la simulación comercial Spot, gestión de contratos marco COA, tarificación dinámica $P \times Q$, contabilidad de viajes (Voyage Ledger P&L) y auditoría de gastos portuarios.

### Principios Fundamentales del Sistema:
1. **Regla de Sin Fallbacks ("NO HAY"):** Si un dato o tarifa no existe en la base de datos Supabase, el sistema no inventa valores ni usa fallbacks genéricos. Muestra explícitamente `NO HAY`.
2. **Homologación MDO/MGO:** En todo el software PETRAL, las siglas **MGO** (Marine Gas Oil / Diesel Marino) equivalen y se registran unificadamente bajo el estándar **MDO**.
3. **Regla 6 QC Overtime (+25%):** En zarpes u operaciones fuera de jornada hábil (nocturno, dominical o feriado), el recargo de Overtime (+25%) se aplica individualmente $P_{base} \times 1.25$ sobre practicaje OUT, remolques OUT, lanchas y agenciamiento.
4. **Layout Fluido & Sidebar Congelado:** La barra lateral navegable está congelada rígidamente a **320px fijos** (`w-[320px] shrink-0`), mientras que la vista principal del módulo ocupa el **100% del ancho disponible de la pantalla (`w-full max-w-full`)**.

---

## 2. DATOS MAESTROS (11 MÓDULOS EN 4 CATEGORÍAS)

El menú de **DATOS MAESTROS** organiza el catálogo oficial del sistema en 4 bloques funcionales:

```
DATOS MAESTROS
├── 🏗️ MAESTROS FÍSICOS
│   ├── 🚢 Maestro de Flota
│   ├── ⚓ Maestro de Puertos y Terminales
│   └── ✏️ Maestro de Distancias
├── 💼 MAESTROS COMERCIALES
│   ├── 🏢 Maestro de Clientes
│   ├── 📜 Maestro de Contratos
│   ├── 📍 Maestro de Rutas
│   └── 📑 Maestro de Cotizaciones
├── 💰 MAESTROS DE COSTOS
│   ├── 🏷️ Maestro de Tarifas Portuarias
│   └── 🧮 Maestro de Gastos Portuarios
└── ⛽ MERCADO & ORIGINACIÓN
    ├── ⛽ Maestro de Búnker
    └── ⚙️ Maestro de Originación
```

### 2.1 🏗️ MAESTROS FÍSICOS
* **Maestro de Flota (`/vessels`):** Reglas constructivas de la nave (LOA, GRT/TRB, DWT, Calados Summer/Tropical) y matriz de consumos de búnker IFO 380, VLSFO y Diesel MDO en las 3 fases operativas: Navegando (Lastre/Cargado), Operando en Muelle y Espera/Fondeo.
* **Maestro de Puertos y Terminales (`/ports`):** Directorio de terminales de Perú y Chile (Callao APM/Multiboyas, Matarani Tisur, Ilo SPCC/Enapu, Marcona, Mejillones). Regula la variable **Q (Cantidad)** de permanencia:
  $$\text{Horas Muelle } Q_{total} = \frac{\text{Carga MT}}{\text{Ritmo MT/h}} + 4.0\text{ horas fijas (Amarre/Desamarre + Conexiado/Desconexiado)}$$
  * **Matriz Callao:** Evalúa Practicaje ($Q_{TRB}$), Remolcaje ($2\text{ IN} / 2\text{ OUT}$ por HP/TRB), Muellaje a la Nave (LOA y $Q_{total}$ horas), Muellaje a la Carga ($Q_{MT}$), Tasas DICAPI/APN, Sanidad Marítima y Overtime (+25%).
* **Maestro de Distancias (`/routes`):** Matriz distancial oficial en Millas Náuticas ($NM$) entre puertos de originación y destino para el cálculo de días navegando.

### 2.2 💼 MAESTROS COMERCIALES
* **Maestro de Clientes (`/clients`):** Registro corporativo exclusivo de los 2 clientes comerciales activos con contrato marco de Naviera Petral:
  1. **Southern Perú Copper Corporation (SPCC)**
  2. **Nexa Resources Peru S.A.A. (NEXA)**
* **Maestro de Contratos (`/contracts`):** Términos marco COA (Flete base USD/MT, horas Laytime permitidas, tasa de Demurrage USD/día y fórmulas de indexación BAF).
* **Maestro de Rutas (`/spot-routes`):** Parejas Origen-Destino físicas activas vinculadas a clientes en `routes_clients` (ej. *SPCC Ilo - Callao*, *Nexa Cajamarquilla*).
* **Maestro de Cotizaciones (`/quotes`):** Registro histórico de proformas comercial Spot emitidas a prospectos en `routes_quotes`.

### 2.3 💰 MAESTROS DE COSTOS
* **Maestro de Tarifas Portuarias (`/port-tariffs`):** Catálogo de tarifas unitarias por proveedor y servicio.
* **Maestro de Gastos Portuarios (`/port-costs` - Los 3 Tabs Operativos):**
  * **Tab 1 — Modelo Estático:** Matriz de costos fijos estáticos ($USD) por puerto y buque, desagregada por rubros de faena: Costo Principal (`MAIN`), Loading Master / Supervisión (`loading_master`) y Otros Gastos (`other`).
  * **Tab 2 — Matriz Compleja:** Estructura tarifaria dinámica avanzada con reglas condicionales $P \times Q$ por proveedor.
  * **Tab 3 — Bandas Tarifarias:** Tablero de auditoría de toda la flota que verifica el encuadre del costo fijo de DB contra el rango de tolerancia hábil **MIN** vs pesimista con Overtime (+25%) **MAX**. Muestra los estados: ✅ `EN BANDA`, ❌ `SOBRE MAX`, o `NO HAY`.

### 2.4 ⛽ MERCADO & ORIGINACIÓN
* **Maestro de Búnker (`/bunker-prices`):** Matriz de precios de combustible IFO 380, VLSFO y Diesel MDO, aplicando estrictamente la regla **MGO = MDO**.
* **Maestro de Originación (`/sources-sinks`):** Oferta y demanda de carga (Sources & Sinks) por puerto, empresa y producto en TM/año.

---

## 3. HERRAMIENTAS & MOTORES (7 MÓDULOS - GUÍA BOTÓN POR BOTÓN)

### 3.1 ⛴️ Multicotizador Multirutas (`/multicotizador`)
* **⚡ Botón "Simular Itinerario / Calcular Flete":** Ejecuta el motor Spot calculando días navegando ($T_{ballast} + T_{laden}$), días en muelle ($Q_{op} + 4.0\text{h}$), consumo de búnker IFO/MDO y gastos portuarios para obtener el Flete de Equilibrio y el TCE Target ($USD/\text{día}$).
* **🎛️ Selector "Modo de Gastos Portuarios":** Alterna entre Modelo Estático (costo fijo DB), Matriz Compleja $P \times Q$ (dinámica OT) y Bandas Tarifarias.
* **💾 Botón "Guardar Cotización Spot":** Registra la simulación en `routes_quotes` con código de proforma comercial.
* **📄 Botón "Exportar PDF / Excel":** Genera el informe proforma membretado oficial para envío al cliente.

### 3.2 📊 Matriz Financiera - Voyage Ledger P&L (`/dashboard`)
* **➕ Botón "Nuevo Asiento de Viaje (NVR)":** Abre la ventana para registrar un nuevo viaje asignando buque, ruta, toneladas e ingresos por flete.
* **🔒 Botón "Cerrar Viaje / Conciliar Ledger":** Bloquea la edición del viaje y concilia los costos estimados de búnker y agenciamiento frente a las facturas reales liquidadas, determinando la Utilidad Neta Real.
* **🔍 Botón "Ver Desglose de Gastos P×Q":** Despliega la auditoría ítem por ítem del viaje (practicaje, remolques, búnker en lastre/cargado y comisiones).
* **📊 Botón "Exportar Libro Financiero (Excel)":** Descarga el estado de resultados consolidado de la flota para la gerencia financiera.

### 3.3 📈 Análisis Gráfico (`/graphic-analysis`)
* **📅 Selector "Horizonte Temporal":** Filtra la serie temporal a nivel Mensual, Trimestral o Anual.
* **📊 Selector de Métrica (TCE / Búnker / Tarifas):** Cambia el indicador visualizado entre Rendimiento Diario ($USD/\text{día}$), Consumo MDO/IFO y Desembolsos Portuarios.
* **📈 Botón "Alternar Tipo de Gráfico":** Modifica la visualización entre Barras Comparativas, Líneas de Tendencia Continua y Área Acumulada.
* **📷 Botón "Exportar Gráfica (PNG / SVG)":** Descarga la imagen vectorial de alta resolución.

### 3.4 🗺️ Spaghetti Map (`/spaghetti-map`)
* **🏢 Botón "Filtro por Cliente (SPCC / NEXA)":** Muestra u oculta las rutas marítimas asignadas a cada cliente.
* **🗺️ Conmutador de Capas (Satélite vs Marítimo OSM):** Alterna entre capa satelital de alta resolución e hidrográfica náutica OpenStreetMap.
* **📏 Herramienta "Medir Distancia Náutica (NM)":** Permite hacer clic sobre el mapa para calcular distancias náuticas entre coordenadas.
* **🎯 Botón "Recentrar Costa Oeste":** Enfoca la vista sobre la Costa Oeste de Sudamérica (Callao-Matarani-Ilo-Mejillones).

### 3.5 ⚖️ Auditoría Final (`/audit-final`)
* **⚓ Selector "Seleccionar Buque & Puerto":** Carga la liquidación oficial de la nave trayendo todos los rubros portuarios.
* **⚡ Interruptor "Regla 6 Overtime (+25%)":** Activa o desactiva el recargo en practicaje y remolcaje OUT para zarpes nocturnos/dominicales.
* **📑 Botón "Generar Acta de Auditoría (A4 Flex)":** Construye el PDF A4 membretado de 2 buques por hoja con firmas en 2 columnas (PETRAL vs V°B° Experta Sandra) y caja `.obs-box` flex-fill hasta el pie de página.
* **✅ Botón "Aprobar Liquidación / Sellar V°B°":** Asigna el estado de "AUDITADO OK" en la base de datos y congela los montos.

### 3.6 🗺️ Flowchart del Sistema (`/system-flowchart`)
* **🔀 Selector "Nivel de Diagrama (1 a 5)":** Navega entre los 5 niveles de arquitectura (Nivel 1 Maestros $\rightarrow$ Nivel 2 Spot $\rightarrow$ Nivel 3 P×Q $\rightarrow$ Nivel 4 Ledger $\rightarrow$ Nivel 5 Auditoría).
* **📥 Botón "Descargar Flowchart (SVG / PDF)":** Exporta el flujograma vectorial oficial para manuales operacionales.
* **🔍 Botón "Zoom Interactivo / Pantalla Completa":** Amplía el lienzo del flujograma permitiendo explorar dinámicamente cada nodo.

### 3.7 📚 Documentación del Sistema (`/system-documentation`)
* **🔍 Campo "Buscador Inteligente de Módulos":** Filtra los 18 capítulos por títulos, subtítulos o palabras clave en tiempo real.
* **🗂️ Acordeón "DATOS MAESTROS" (Colapsable):** Despliega o contrae verticalmente la lista de los 11 maestros.
* **🛠️ Acordeón "HERRAMIENTAS & MOTORES" (Colapsable):** Despliega o contrae verticalmente los 7 módulos de herramientas.
* **📥 Botón "Descargar PDF Membretado":** Abre el cuadro de impresión para descargar el manual editorial oficial con logo de Naviera Petral.

---

## 4. MEJORAS GLOBALES DE UI Y TEMPLATE (`MasterTemplate_V2.tsx`)

1. **Menús Colapsables Verticalmente en todo el Software:**
   - La barra lateral navegable en cualquier pantalla del software cuenta con acordeones colapsables para los bloques **DATOS MAESTROS** y **HERRAMIENTAS**, con botones de flecha interactivos (`ChevronDown` / `ChevronRight`).
2. **Botón "Nueva Pestaña":**
   - El botón de la cabecera superior del software permite abrir cualquier módulo en una pestaña independiente del navegador (`window.open(location.href, '_blank')`).
3. **Layout de Ancho Fluido & Sidebar Congelado:**
   - La barra lateral navegable está congelada rígidamente a **320px fijos** (`w-[320px] min-w-[320px] max-w-[320px] shrink-0`), garantizando que jamás se mueva o cambie de tamaño al hacer clic en distintos módulos.
   - El panel contenedor principal ocupa el **100% de todo el ancho disponible de la pantalla (`w-full max-w-full`)**, aprovechando por completo monitores 1080p, 2K o ultrawide.
