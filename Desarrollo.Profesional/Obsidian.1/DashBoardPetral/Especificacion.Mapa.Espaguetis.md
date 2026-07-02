# Mapa Espaguetis con Pies — Fuentes y Sumideros (Cuarto Modulo Ribbon)

> **Origen:** Transcripcion de audio de reunion de producto Petral
> **Archivo fuente:** `SPAGHETTI.MAPS.CON.PIES.ogg`
> **Referencias visuales ECharts:**
> - https://echarts.apache.org/examples/en/editor.html?c=map-iceland-pie
> - https://echarts.apache.org/examples/en/editor.html?c=graph
> - https://echarts.apache.org/examples/en/editor.html?c=graph-label-overlap

---

## 1. Concepto General y Posicion en el Ribbon

El **Mapa Espaguetis** es el cuarto modulo del ribbon del Dashboard Petral. Es una visualizacion geoespacial interactiva sobre un **mapa del Peru** que muestra simultaneamente tres dimensiones de informacion logistica:

| Capa | Descripcion |
|---|---|
| **Mapa base** | GeoJSON del Peru renderizado con ECharts `geo` (fondo oscuro, bordes de departamentos) |
| **Espaguetis** | Rutas maritimas activas como aristas curvas de color entre puertos, via `series.type: graph` |
| **Pie charts** | Un pie chart flotante por puerto activo mostrando la composicion de su actividad, via `series.type: pie` con `coordinateSystem: geo` |

**Posicion en el Ribbon:**

| # | Modulo | Estado |
|---|---|---|
| 1 | Voyage Ledger | Productivo |
| 2 | Ruteador Spot | Productivo |
| 3 | Commercial Forecast | Productivo |
| **4** | **Mapa Espaguetis** | **Productivo** |

Ver vinculacion: [[Especificacion.Commercial.Forecast]]

---

## 2. Logica de Negocio — Fuentes, Sumideros y Market Share

### 2.1 Fuentes vs. Sumideros

Cada puerto del mapa tiene un ROL definido por el balance entre lo que carga y lo que descarga:

- **Fuente:** Puerto donde Petral **embarca** la carga. Sus toneladas "salen" hacia otros puertos. Ejemplo: ILO (origen de acido sulfurico).
- **Sumidero:** Puerto donde Petral **descarga** la carga. Sus toneladas "entran" desde otros puertos. Ejemplo: MATARANI, MARCONA, MEJILLONES.
- Un puerto puede ser **mixto** si en distintas rutas actua como origen en unas y destino en otras.

El **pie chart interior** de cada nodo muestra este split:
- Sector azul = toneladas cargadas (Petral como proveedor en ese puerto)
- Sector naranja = toneladas descargadas (Petral como cliente en ese puerto)

### 2.2 Market Share (V2)

```
Market Share Petral (%) = Toneladas Petral en puerto / Capacidad total del puerto x 100
```

- Un **donut exterior** (anillo) representa a Petral vs. el total del mercado en ese terminal.
- Los datos de capacidad total se obtienen de fuentes externas (Ositran, reportes portuarios anuales).
- **En MVP:** solo pie interior Petral. El donut de market share va en Fase 5.

### 2.3 Toneladas por Espagueti

Cada arista (espagueti) entre dos puertos lleva:
- **Grosor** proporcional a las toneladas transportadas en esa ruta en el periodo.
- **Color** = `routes.color_hex` de la ruta correspondiente en la base de datos.
- **Curvatura** diferente por par origen-destino para evitar solapamiento visual.
- **Tooltip:** al pasar el mouse muestra `ORIGEN -> DESTINO | X,XXX MT / mes`.

### 2.4 Linea de Tiempo (Timeline)

El reporte NO es estatico. Incorpora un slider de meses (componente `timeline` de ECharts):

- Cada tick del slider recalcula: toneladas por ruta, volumen por puerto, roles fuente/sumidero.
- Los puertos pueden cambiar su rol a lo largo del tiempo.
- El radio de los pie charts cambia con el volumen mensual.

---

## 3. Arquitectura Tecnica ECharts — Capas Combinadas

```
option = {
  geo    → mapa base del Peru
  graph  → nodos (puertos) + edges (espaguetis)       [coordinateSystem: geo]
  pie[]  → un pie series por cada puerto activo       [coordinateSystem: geo]
  timeline → slider de meses
  options[]  → un juego de series por mes
}
```

### 3.1 Mapa Base (geo)

```javascript
geo: {
  map: 'peru',                // registrado via echarts.registerMap('peru', geoJSON)
  roam: true,                 // pan y zoom habilitado
  aspectScale: 0.85,
  silent: false,
  itemStyle: {
    areaColor: '#1e293b',     // fondo oscuro tipo dark mode
    borderColor: '#334155',
    borderWidth: 0.8
  },
  emphasis: {
    itemStyle: { areaColor: '#263853' },
    label: { show: false }
  },
  zoom: 4.5,                  // zoom inicial centrado en la costa peruana
  center: [-75.5, -14.0]     // centro aprox. costa del Peru
}
```

### 3.2 Espaguetis via series.type "graph"

El `graph` es elegido sobre `lines` porque:

| Caracteristica | lines | graph |
|---|---|---|
| Nodos con label | No nativo | SI — label en cada nodo |
| Grosor de arista por tonelaje | Solo lineStyle.width | SI — edge.lineStyle.width |
| Flecha de direccion | Si | Si — curveness + symbol |
| Anti-solapamiento de labels | No | SI — hideOverlap: true |
| Tooltip rico por nodo y arista | Basico | SI — dataType node/edge |
| coordinateSystem: geo | SI | SI — posiciona nodos en lat/lon |
| Hover focus adjacency | No | SI — emphasis.focus: adjacency |

```javascript
{
  type: 'graph',
  coordinateSystem: 'geo',
  layout: 'none',             // posicionamiento manual por coordenadas geograficas
  zlevel: 2,

  nodes: [
    { id: 'ILO',       name: 'ILO',       x: -71.3375, y: -17.6394, symbolSize: 28, itemStyle: { color: '#DC2626' } },
    { id: 'MATARANI',  name: 'MATARANI',  x: -72.1072, y: -16.9994, symbolSize: 20, itemStyle: { color: '#06B6D4' } },
    { id: 'MARCONA',   name: 'MARCONA',   x: -75.1295, y: -15.3439, symbolSize: 20, itemStyle: { color: '#A855F7' } },
    { id: 'CALLAO',    name: 'CALLAO',    x: -77.1428, y: -12.0464, symbolSize: 22, itemStyle: { color: '#0EA5E9' } },
    { id: 'MEJILLONES',name: 'MEJILLONES',x: -70.4553, y: -23.1016, symbolSize: 18, itemStyle: { color: '#D946EF' } },
    { id: 'BARQUITO',  name: 'BARQUITO',  x: -70.5833, y: -26.3667, symbolSize: 14, itemStyle: { color: '#F97316' } }
  ],

  edges: [
    // Una edge por cada ruta activa en aggregated_data
    { source: 'ILO', target: 'MATARANI',  value: 12500, lineStyle: { width: 4, color: '#06B6D4', curveness: 0.15 } },
    { source: 'ILO', target: 'MARCONA',   value: 9800,  lineStyle: { width: 3, color: '#A855F7', curveness: 0.25 } },
    { source: 'ILO', target: 'MEJILLONES',value: 14000, lineStyle: { width: 5, color: '#D946EF', curveness: 0.35 } }
    // ... generado dinamicamente desde aggregated_data
  ],

  label: {
    show: true,
    position: 'right',
    formatter: '{b}',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f1f5f9',
    hideOverlap: true          // clave del patron graph-label-overlap
  },

  emphasis: {
    focus: 'adjacency',        // hover en un puerto resalta solo sus rutas
    lineStyle: { width: 8, opacity: 1 }
  },

  edgeLabel: {
    show: true,
    formatter: (params) => `${(params.data.value/1000).toFixed(1)}k MT`,
    fontSize: 9,
    color: '#94a3b8'
  }
}
```

### 3.3 Pie Charts por Puerto (Carga vs. Descarga)

Patron directo del ejemplo `map-iceland-pie`:

```javascript
// Una serie pie por cada puerto activo — generada dinamicamente
{
  type: 'pie',
  coordinateSystem: 'geo',
  center: [-71.3375, -17.6394],  // [lon, lat] de ILO
  radius: 16,                     // radio proporcional al volumen total del puerto
  zlevel: 3,
  label: { show: false },
  emphasis: { label: { show: true, formatter: '{b}: {d}%' } },
  data: [
    { value: 45000, name: 'Carga',    itemStyle: { color: '#0EA5E9' } },
    { value: 12000, name: 'Descarga', itemStyle: { color: '#F97316' } }
  ]
}
```

**Radio dinamico:** `radius = 8 + (totalTons / maxTonsAllPorts) * 20`
Esto asegura que el puerto con mayor volumen tenga el pie mas grande visualmente.

### 3.4 Tooltip Enriquecido

```javascript
tooltip: {
  trigger: 'item',
  backgroundColor: '#1e293b',
  borderColor: '#334155',
  textStyle: { color: '#f1f5f9' },
  formatter: (params) => {
    if (params.dataType === 'node') {
      const d = params.data;
      const rol = d.carga >= d.descarga ? 'FUENTE' : 'SUMIDERO';
      return `<b>${d.name}</b> — ${rol}<br/>
              Carga: ${d.carga.toLocaleString()} MT<br/>
              Descarga: ${d.descarga.toLocaleString()} MT<br/>
              Total: ${(d.carga + d.descarga).toLocaleString()} MT`;
    }
    if (params.dataType === 'edge') {
      return `<b>${params.data.source} → ${params.data.target}</b><br/>
              ${params.data.value.toLocaleString()} MT / mes`;
    }
    if (params.componentType === 'series' && params.seriesType === 'pie') {
      return `${params.name}: ${params.value.toLocaleString()} MT (${params.percent}%)`;
    }
  }
}
```

### 3.5 Timeline Mensual

```javascript
timeline: {
  data: ['2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'],
  autoPlay: false,
  loop: false,
  bottom: 10,
  label: { color: '#94a3b8' },
  controlStyle: { color: '#0EA5E9', borderColor: '#0EA5E9' },
  lineStyle: { color: '#334155' },
  itemStyle: { color: '#0EA5E9' }
},
options: [
  // Un objeto { series: [...] } por cada mes
  // Cada objeto recalcula nodes (symbolSize), edges (width/value) y pies (data, radius)
]
```

---

## 4. Coordenadas Geograficas de Puertos

Se requiere agregar `lat` y `lon` a la tabla `ports` en Supabase:

```sql
ALTER TABLE ports ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE ports ADD COLUMN IF NOT EXISTS lon NUMERIC;

UPDATE ports SET lat = -17.6394, lon = -71.3375 WHERE port_id = 'ILO';
UPDATE ports SET lat = -16.9994, lon = -72.1072 WHERE port_id = 'MATARANI';
UPDATE ports SET lat = -15.3439, lon = -75.1295 WHERE port_id = 'MARCONA';
UPDATE ports SET lat = -12.0464, lon = -77.1428 WHERE port_id = 'CALLAO';
UPDATE ports SET lat = -23.1016, lon = -70.4553 WHERE port_id = 'MEJILLONES';
UPDATE ports SET lat = -26.3667, lon = -70.5833 WHERE port_id = 'BARQUITO';
```

---

## 5. GeoJSON del Peru

Para registrar el mapa base con ECharts:

```typescript
// En SpaghettiMap.tsx — al montar el componente
import * as echarts from 'echarts';

const geoJson = await fetch('/peru.json').then(r => r.json());
echarts.registerMap('peru', geoJson);
```

**Fuente del GeoJSON:**
- Natural Earth (simplificado): `https://raw.githubusercontent.com/johan/world.geo.json/master/countries/PER.geo.json`
- Colocar en: `Geeksoft_Frontend/public/peru.json`

---

## 6. Flujo de Datos desde la API

El mapa reutiliza el mismo endpoint de la Matriz Financiera. NO requiere nuevo endpoint de backend.

```
POST /api/v1/forecast/run
  →  aggregated_data[client][route][vessel][month]
     └── total_cargo (toneladas)
     └── net_income  (Gross Revenue)
     └── voyage_result
```

### 6.1 Hook de transformacion — useSpaghettiData.ts

```typescript
export function useSpaghettiData(aggregatedData: any, month: string, ports: Port[]) {
  return useMemo(() => {
    const portMap: Record<string, { carga: number; descarga: number }> = {};
    const edges: SpaghettiEdge[] = [];

    // Inicializar todos los puertos
    ports.forEach(p => { portMap[p.port_id] = { carga: 0, descarga: 0 }; });

    Object.entries(aggregatedData).forEach(([client, routes]: any) => {
      Object.entries(routes).forEach(([route, vessels]: any) => {
        // Parsear ruta: 'ILO-MATARANI' o 'SPOT-NEXA.ILO.CALLAO.MEJILLONES.ILO'
        const [origin, dest] = parseRoute(route);
        const tons = sumTons(vessels, month);   // suma freq * carga_unit
        const colorHex = getRouteColor(route);

        portMap[origin].carga    += tons;
        portMap[dest].descarga   += tons;

        edges.push({
          source: origin,
          target: dest,
          value: tons,
          lineStyle: {
            width: Math.max(1, tons / 3000),   // escalar grosor
            color: colorHex,
            curveness: getCurveness(origin, dest)  // curvatura unica por par
          }
        });
      });
    });

    const maxTons = Math.max(...Object.values(portMap).map(p => p.carga + p.descarga));

    const nodes = ports
      .filter(p => (portMap[p.port_id]?.carga + portMap[p.port_id]?.descarga) > 0)
      .map(p => ({
        id: p.port_id,
        name: p.port_id,
        x: p.lon,
        y: p.lat,
        carga:    portMap[p.port_id].carga,
        descarga: portMap[p.port_id].descarga,
        symbolSize: 8 + ((portMap[p.port_id].carga + portMap[p.port_id].descarga) / maxTons) * 22,
        rol: portMap[p.port_id].carga >= portMap[p.port_id].descarga ? 'FUENTE' : 'SUMIDERO'
      }));

    const pieSeries = nodes.map(n => ({
      type: 'pie',
      coordinateSystem: 'geo',
      center: [n.x, n.y],
      radius: 8 + ((n.carga + n.descarga) / maxTons) * 14,
      label: { show: false },
      data: [
        { value: n.carga,    name: 'Carga',    itemStyle: { color: '#0EA5E9' } },
        { value: n.descarga, name: 'Descarga', itemStyle: { color: '#F97316' } }
      ]
    }));

    return { nodes, edges, pieSeries };
  }, [aggregatedData, month, ports]);
}
```

---

## 7. Estructura del Componente React

```
src/
  components/
    SpaghettiMap/
      SpaghettiMap.tsx         ← Componente principal: ReactECharts wrapper
      SpaghettiMap.types.ts    ← Tipos TS: SpaghettiNode, SpaghettiEdge, Port
      useSpaghettiData.ts      ← Hook de transformacion aggregated_data → graph/pie data
  pages/
    SpaghettiMap/
      SpaghettiMapPage.tsx     ← Pagina: filtros de periodo + SpaghettiMap
```

### SpaghettiMap.tsx — esqueleto

```typescript
import ReactECharts from 'echarts-for-react';
import { useSpaghettiData } from './useSpaghettiData';

export const SpaghettiMap: React.FC<{ data: any; months: string[]; ports: Port[] }> = ({
  data, months, ports
}) => {
  const [activeMonth, setActiveMonth] = useState(months[0]);
  const { nodes, edges, pieSeries } = useSpaghettiData(data.aggregated_data, activeMonth, ports);

  const option = useMemo(() => ({
    backgroundColor: '#0f172a',
    geo: { map: 'peru', roam: true, /* ... */ },
    series: [
      { type: 'graph', coordinateSystem: 'geo', layout: 'none', nodes, edges, /* ... */ },
      ...pieSeries
    ],
    tooltip: { /* ... */ }
  }), [nodes, edges, pieSeries]);

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
};
```

---

## 8. Rutas y Colores de Referencia

Colores de rutas ya definidos en la base de datos (`routes.color_hex`) y en el frontend:

| Ruta | Color | Hex |
|---|---|---|
| ? → MATARANI | Cyan | #06B6D4 |
| ? → MARCONA | Violeta | #A855F7 |
| ? → MEJILLONES | Fucsia | #D946EF |
| NEXA (spot) | Naranja | #F97316 |
| ? → CALLAO | Azul | #0EA5E9 |

---

## 9. Estado de Implementación por Fases (Julio 2026)

### Fase 1 — MVP: Mapa base con puertos (Completado ✓)
- [x] Descargar `peru.json` (GeoJSON) y colocarlo en `/public/`
- [x] Agregar columnas `lat` y `lon` a la tabla `ports` en Supabase y poblar coordenadas
- [x] Crear `SpaghettiMap.tsx` con mapa base oscuro y puertos geoposicionados
- [x] Agregar pestaña "Mapa Espaguetis" al Ribbon del dashboard (`CommercialForecast.tsx`)
- [x] Modificar endpoint `GET /api/v1/forecast/ports` para retornar `lat` y `lon`

### Fase 2 — Espaguetis (Completado ✓)
- [x] Renderizar viajes marítimos usando `series.type: graph` con posicionamiento geográfico
- [x] Grosor de arista proporcional a las toneladas acumuladas
- [x] Color de arista mapeado al **color del buque** según el `Manual.Estilos.md`
- [x] Curvatura diferenciada por par origen-destino para evitar solapamientos
- [x] Ocultar etiquetas de aristas por defecto y centrarse en tooltips interactivos

### Fase 3 — Pie Charts Concéntricos (Completado ✓)
- [x] Superponer series `pie` usando `coordinateSystem: 'geo'` en cada puerto activo
- [x] **Pie Interno (Petral):** Carga (azul `#0EA5E9`) vs Descarga (naranja `#F97316`) acumulada
- [x] **Donut Externo (Mercado):** Capacidad fija acumulada del puerto, coloreada por rol (morado para Fuente, gris para Sumidero)
- [x] Escalar el radio del nodo total proporcionalmente a la capacidad de mercado del puerto

### Fase 4 — Timeline Acumulativo (Completado ✓)
- [x] Integrar componente `timeline` de ECharts
- [x] Lógica de acumulación mensual: al avanzar en la animación se van sumando los viajes y toneladas del año
- [x] Animación fluida de transiciones entre meses

### Fase 5 — Market Share e Histórico (Completado ✓)
- [x] Donut exterior: Capacidad de mercado histórica anualizada
- [x] Tabla de soporte `sources_sinks` en Supabase con clave compuesta `(port_id, year)` para variaciones anuales
- [x] Cálculo dinámico de Market Share de Petral (%) en el tooltip interactivo

---

## 10. Estructura de Base de Datos Realizada

### 10.1. Coordenadas en Tabla `ports`
Se agregaron los campos a `ports` y se poblaron los puertos activos:
- **ILO:** lat: `-17.6394`, lon: `-71.3375`
- **MATARANI:** lat: `-16.9994`, lon: `-72.1072`
- **MARCONA:** lat: `-15.3439`, lon: `-75.1295`
- **CALLAO:** lat: `-12.0464`, lon: `-77.1428`
- **MEJILLONES:** lat: `-23.1016`, lon: `-70.4553`
- **BARQUITO:** lat: `-26.3667`, lon: `-70.5833`

### 10.2. Tabla `sources_sinks` (Fuentes y Sumideros por Año)
Permite almacenar las capacidades fijas del mercado:
- `port_id` *(VARCHAR, PK, FK references ports)*
- `year` *(INTEGER, PK)*
- `capacity_mt` *(NUMERIC)*
- `type` *(VARCHAR - 'SOURCE' | 'SINK' | 'MIXED')*

---

## 11. Arquitectura Técnica Implementada

### 11.1. Reglas de Curvatura Geográfica para Evitar Solapamientos
Para impedir que las rutas se crucen de forma caótica, se configuraron curvaturas fijas y específicas por par de puertos:
- **Rutas cortas de cabotaje:** `ILO-MATARANI` usa curvatura mínima (`0.10`).
- **Rutas intermedias:** `ILO-MARCONA` usa curvatura (`0.22`) para esquivar a Matarani.
- **Rutas largas:** `ILO-CALLAO` usa curvatura (`0.35`).
- **Rutas de Chile (hacia el sur):** `ILO-MEJILLONES` tiene curvatura hacia abajo (`-0.15`) e `ILO-BARQUITO` tiene curvatura hacia arriba (`-0.32`) para pasar rodeándola.
- **Varios barcos en el mismo tramo:** Se aplica un offset dinámico (`baseCurveness + index * 0.06`) para renderizar líneas curvas paralelas separadas y limpias.

### 11.2. Mapeo de Colores por Buque
En lugar de pintar por rutas, las líneas curvas (espaguetis) toman el color asignado a su buque en el manual de estilos:
- `TABLONES` &rarr; `#DC2626` (Rojo)
- `MOQUEGUA` &rarr; `#16A34A` (Verde)
- `CONCON TRADER` &rarr; `#475569` (Gris)
- `HUEMUL` &rarr; `#4F46E5` (Índigo)
- Buque genérico/otros &rarr; `#94A3B8` (Slate)

---

*Especificacion técnica y detalles de implementación del módulo de visualización geoespacial.*
*Petral Dashboard Team — Geeksoft*
