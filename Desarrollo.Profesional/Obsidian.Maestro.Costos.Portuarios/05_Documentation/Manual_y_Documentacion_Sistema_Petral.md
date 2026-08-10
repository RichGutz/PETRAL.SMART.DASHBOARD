# MANUAL Y DOCUMENTACIÓN INTEGRAL DEL SISTEMA PETRAL SHIPPING.SOFT V2.6 PRO

> **NAVIERA PETRAL S.A.**  
> *Plataforma Comercial, Operativa y de Auditoría de Costos Portuarios (Costa Oeste PE / CL)*  
> **Última Actualización:** 2026-08-10 | **Estado:** 100% READY — Versión Matriz Integrada
> **Ubicación local de capturas:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\`

---

## 1. VISIÓN GENERAL Y ARQUITECTURA DEL ECOSISTEMA

PETRAL SHIPPING.SOFT V2.6 es una plataforma web integral diseñada para la simulación comercial Spot, gestión de contratos marco COA, tarificación dinámica $P \times Q$, contabilidad de viajes (Voyage Ledger P&L) y auditoría de gastos portuarios.

### Principios Fundamentales del Sistema:
1. **Regla de Sin Fallbacks ("NO HAY"):** Si un dato o tarifa no existe en la base de datos Supabase, el sistema no inventa valores ni usa fallbacks genéricos. Muestra explícitamente `NO HAY`.
2. **Homologación MDO/MGO:** En todo el software PETRAL, las siglas **MGO** (Marine Gas Oil / Diesel Marino) equivalen y se registran unificadamente bajo el estándar **MDO**.
3. **Regla 6 QC Overtime (+25%):** En zarpes u operaciones fuera de jornada hábil (nocturno, dominical o feriado), el recargo de Overtime (+25%) se aplica individualmente $P_{base} \times 1.25$ sobre practicaje OUT, remolques OUT, lanchas y agenciamiento.
4. **Lectura 100% Dinámica de Itinerarios y Parcelación P×Q:** En rutas simples y multipiernas (2PODs), queda terminantemente prohibido hardcodear cadenas estáticas o días de puerto fijos. Las escalas se leen dinámicamente desde `details.itinerary`, respetando la regla $\sum Q_{\text{descargas}} = Q_{\text{carga total}}$.
5. **Ecuación Contable Lineal de 4 Componentes:** En el reporte de auditoría side-by-side:
   $$\text{Gross Revenue} - \text{Gastos Puerto} - \text{Costo Búnker} - \text{Costo OPEX (Días } \times \text{ TCE Req)} = \text{Utilidad Neta}$$
6. **Layout Fluido & Sidebar Congelado:** La barra lateral navegable está congelada rígidamente a **320px fijos** (`w-[320px] shrink-0`), mientras que la vista principal del módulo ocupa el **100% del ancho disponible de la pantalla (`w-full max-w-full`)**.

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
* **Maestro de Puertos y Terminales (`/ports`):** Directorio de terminales de Perú y Chile (Callao APM/Tisur, Ilo SPCC/Enapu). Regula la variable **Q (Cantidad)** de permanencia:
  $$\text{Horas Muelle } Q_{total} = \frac{\text{Carga MT}}{\text{Ritmo MT/h}} + 4.0\text{ horas fijas}$$
* **Maestro de Distancias (`/routes`):** Matriz distancial oficial en Millas Náuticas ($NM$) entre puertos para el cálculo de días navegando.

### 2.2 💼 MAESTROS COMERCIALES
* **Maestro de Clientes (`/clients`):** Registro corporativo. Combina contratos fijos con clientes dinámicos extraídos del campo `name` en `routes_clients` y `routes_quotes` (SPCC, NEXA, SPOT, y prospectos).
* **Maestro de Contratos (`/contracts`):** Términos marco COA (Flete base USD/MT, horas Laytime permitidas, tasa de Demurrage USD/día y fórmulas de indexación BAF).
* **Maestro de Rutas (`/spot-routes`):** Parejas Origen-Destino físicas activas vinculadas a clientes en `routes_clients`.
* **Maestro de Cotizaciones (`/quotes`):** Registro histórico de proformas comerciales Spot emitidas a prospectos en `routes_quotes` (sin prefijo `PROSPECT.` hardcodeado en la DB).

### 2.3 💰 MAESTROS DE COSTOS
* **Maestro de Tarifas Portuarias (`/port-tariffs`):** Catálogo de tarifas unitarias por proveedor y servicio.
* **Maestro de Gastos Portuarios (`/port-costs` - Los 3 Tabs Operativos):**
  * **Tab 1 — Modelo Estático:** Matriz de costos fijos estáticos por puerto y buque.
  * **Tab 2 — Matriz Compleja:** Estructura tarifaria dinámica avanzada con reglas condicionales $P \times Q$.
  * **Tab 3 — Bandas Tarifarias:** Tablero de auditoría que verifica el encuadre del costo fijo contra el rango de tolerancia MIN vs MAX con Overtime (+25%).

### 2.4 ⛽ MERCADO & ORIGINACIÓN
* **Maestro de Búnker (`/bunker-prices`):** Matriz de precios de combustible IFO 380, VLSFO y Diesel MDO, aplicando la regla **MGO = MDO**.
* **Maestro de Originación (`/sources-sinks`):** Oferta y demanda de carga (Sources & Sinks) por puerto, empresa y producto en TM/año.

---

## 3. HERRAMIENTAS & MOTORES (7 MÓDULOS - GUÍA BOTÓN POR BOTÓN)

### 3.1 ⛴️ Multicotizador Multirutas (`/multicotizador`)
* **⚡ Botón "Simular Itinerario / Calcular Flete":** Calcula días de mar, días de muelle, consumo de búnker y costos de puerto.
* **🎛️ Selector "Costos Puerto: STATIC / MATRIX":** Alterna en tiempo real entre el Modelo Estático y la Matriz Compleja.
* **💾 Botón "Guardar Cotización Spot":** Registra la simulación en `routes_quotes` con código de proforma comercial.
* **📄 Botón "Exportar PDF / Excel":** Genera el informe oficial.
* **⚙️ Fallback Offline:** Simulación client-side en caso de caída del backend Python.

### 3.2 📊 Matriz Financiera - Voyage Ledger P&L (`/dashboard`)
* **➕ Botón "Añadir Asiento (NVR)":** Permite al usuario incorporar proyecciones o cotizaciones guardadas.
  - Al seleccionar un cliente con cotizaciones, el dropdown de **Rutas** muestra el listado precedido por el emoji `💬` y el prefijo `QUOTE:spot_id`.
  - El sistema detecta y limpia dinámicamente los campos `customTariff`, `vessel` y `quantity` para naves convencionales con tarifas oficiales de contrato para evitar fletes residuales.
* **🚢 Selector de Buque Comodín (Navegación Vertical):** 
  - Las celdas de la columna **Buque** (`vessel`) muestran un dropdown interactivo para reasignar la nave en caliente.
  - **Técnica de Centrado Exacto (Capa Select-Div)**: El nombre del buque se muestra en un `<div className="vertical-text mx-auto px-2">` idéntico a las columnas Cliente y Ruta. Por encima, un `<select>` transparente (`opacity-0 absolute inset-0`) captura el clic para abrir el dropdown del navegador, logrando un centrado vertical y horizontal perfecto y la misma tipografía de la grilla.
  - Al cambiar el buque, se dispara `handleVesselChange` que gatilla una re-simulación en el backend, recalculando la ruta con las especificaciones de velocidad, consumo de IFO/MDO del nuevo buque seleccionado.
* **✏️ Edición Directa de Tarifas y Flete Base P:**
  - Se habilitó la edición directa del flete en la fila agrupada **Flete (USD/MT)** y en la subfila del desglose de viajes:
    `↳ Tarifa Flete Base P (USD/MT)`.
  - El usuario puede sobrescribir en caliente el flete mensual para cualquier fila (SPCC, NEXA, SPOT o prospectos) de forma directa en el Grid.

### 3.3 📈 Análisis Gráfico (`/graphic-analysis`)
* Selector de horizonte temporal y métricas de TCE, búnker y desembolsos portuarios.

### 3.4 🗺️ Spaghetti Map (`/spaghetti-map`)
* Visualización cartográfica y trazabilidad geoespacial de la Costa Oeste.

### 3.5 ⚖️ Auditoría Final — Acta Maestra (`/audit-final`)
* **Componente:** `VoyageLedgerFinal.tsx` (Acta Oficial de Auditoría y Trazabilidad).
* Imprime un reporte A4 Apaisado membretado dual que detalla inputs maestros de rutas, buques, búnker, agenciamiento y la Tabla Ledger con las 12 métricas.

### 3.6 🗺️ Flowchart del Sistema (`/system-flowchart`)
* Diagrama interactivo de niveles de arquitectura desde Datos Maestros a Ledger.

### 3.7 📚 Documentación del Sistema (`/system-documentation`)
* Acordeón interactivo del manual editorial y buscador inteligente de módulos.

---

## 4. MEJORAS GLOBALES DE UI Y TEMPLATE (`MasterTemplate_V2.tsx`)

1. **Menús Colapsables Verticalmente**: Acordeones en la barra lateral con botones interactivos Chevron.
2. **Botón "Nueva Pestaña"**: Permite abrir cualquier módulo en una ventana independiente.
3. **Ancho Fluido & Sidebar Congelado**: Barra lateral fija a `320px` y panel de contenido principal fluido al `100%` del ancho de pantalla.

---

## 5. REGISTRO DE CAMBIOS Y VERSIONES (Agosto 2026)

| Versión | Hito / Commit | Descripción |
|---|---|---|
| `V2.5` | `92d18d9` | `OK.HTA.AUDITORIA` — Acta Maestra con 5 Cards y 12 métricas Ledger. |
| `V2.6` | `V2.6.FINAL` | **Matriz Integrada & Buque Comodín**: <br>- Carga dinámica de cotizaciones en dropdown de rutas de la Matriz.<br>- Integración de Buque Comodín en grilla con selector vertical centrado (capa select-div invisible).<br>- Habilitación de edición de Flete Base P en grid general y en subfilas de desglose.<br>- Robustez contra nulos en backend (`forecast_service.py`). |
