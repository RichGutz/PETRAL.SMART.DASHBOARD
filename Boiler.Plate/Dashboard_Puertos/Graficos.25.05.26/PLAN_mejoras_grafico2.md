# Plan de Mejoras — Gráfico 2 (Correcciones Críticas)

## 1. Corrección de la Ruta
**Problema:** Se graficó una ruta incorrecta o completa (Ruta 1S / IC-821).
**Solución Exacta:** Utilizar exclusivamente la capa de la **Ruta Morada** (`LAYER_PURPLE_ROUTE`), que contiene exactamente el trazado desde la "Carretera San Juan de Marcona" hasta el Puerto de San Nicolás que se observó en el Gráfico 1.
- Acción: Activar `toggle-purple-route` y suprimir `toggle-osrm-routes`, `toggle-ic821`, y `toggle-garita-1s`.

## 2. Limpieza de Etiquetas del Triángulo
**Problema:** Las medidas en kilómetros de cada lado del Triángulo PETRAL (Ej: "4.10 km") generan ruido visual.
**Solución Exacta:** Desactivar `toggle-perimeter-labels`. En su lugar, el polígono quedará completamente limpio y, si es necesario, solo se agregará la etiqueta indicativa de la zona.

## Correcciones Finales (Iteración 4 - Tramo Exacto Etiqueta-Puerto)

| # | Corrección Solicitada | Acción Técnica |
|---|---|---|
| 1 | Tramo de Etiqueta a San Nicolás | Se usará la capa de la carretera original que pasa por `[-15.228, -75.216]` (donde está la etiqueta "Carretera San Juan de Marcona"). Se hará un corte (slice) del GeoJSON para graficar **únicamente** el segmento desde la coordenada exacta de la etiqueta hacia el Sur, hasta terminar en la costa (San Nicolás). Ferrobamba queda descartado. |
| 2 | Eliminar rutas irrelevantes | Desactivar por completo OSRM, Ruta Alterna y cualquier otra capa que ensucie el mapa. Solo quedará el tramo Etiqueta-Puerto. |
| 3 | Burbuja de 3 líneas (Amortiguamiento) | Modificar la etiqueta para que su HTML fuerce tres líneas usando `<br>`: `ZONA SOBRE EL`<br>`ÁREA DE`<br>`AMORTIGUAMIENTO`. |
| 4 | Reubicar al Noroeste + Call out line | Mover las coordenadas del ancla de la burbuja hacia el Noroeste del Triángulo PETRAL (Ej: `[-15.150, -75.280]`) y trazar una línea visible que conecte esa burbuja con el centro del achurado. |

---

## 3. Cálculo Matemático de Intersección (Amortiguamiento ∩ Triángulo)
**Problema:** El achurado era una aproximación inexacta.
**Solución Matemática (Shapely):**
Hemos cruzado las coordenadas originales del `PERIMETER_SIDES_GEOJSON` con el `AMORTIGUAMIENTO_GEOJSON` usando álgebra de polígonos. 

Como el Triángulo PETRAL tiene un vértice hacia el Norte y otro hacia el Oeste, y la Reserva lo corta a la mitad, el polígono resultante **es la zona norte del triángulo**, definida por **5 vértices exactos**:

1. **Vértice Norte (Original Triángulo):** `[-15.165498334, -75.256950835]`
2. **Vértice Oeste (Original Triángulo):** `[-15.172534472, -75.268253938]`
3. **Punto de Intersección 1 (Corte Oeste):** `[-15.180562729, -75.253777267]`
4. **Punto de Intersección 2 (Punto interno Reserva):** `[-15.182605655, -75.256033940]`
5. **Punto de Intersección 3 (Corte Este):** `[-15.181578064, -75.247416445]`

**Implementación:**
Este polígono será inyectado directamente en `script_local2.js` usando `L.polygon()` y rellenado con un patrón SVG de rayas (`#hatch`). Esto garantiza que el área achurada represente **estrictamente** la zona de solapamiento geográfico sin invadir un milímetro de más.

---

## 4. Coordenadas Exactas de Corte (Proporcionadas por el Usuario)

Las coordenadas de corte exactas en formato DMS y decimal son las siguientes:

* **Garita 1S (Inicio de la 1S):** `14°50'48.14"S 74°54'47.86"W` &rarr; Leaflet `[-14.84671, -74.91329]` (Índice OSRM: `11463`)
* **Inicio Carretera a Marcona:** `15°08'22.24"S 74°58'31.99"W` &rarr; Leaflet `[-15.13951, -74.97555]` (Índice OSRM: `11834`)

### Tabla de Tramos a Graficar

| Tramo | Descripción | Desde | Hasta | Color / Acción |
|---|---|---|---|---|
| **Tramo 1** | Ferrobamba a Garita 1S | Ferrobamba `[-13.80691, -73.25202]` | Garita 1S `[-14.84671, -74.91329]` | **Eliminado** en Gráfico 2 / **Graficado** en Gráfico 1 |
| **Tramo 2** | 1S a Carretera a Marcona | Garita 1S `[-14.84671, -74.91329]` | Carretera a Marcona `[-15.13951, -74.97555]` | **Amarillo** (`#ffc107`) en Gráfico 2 / **Morado** en Gráfico 1 |
| **Tramo 3** | Tramo restante a San Nicolás | Carretera a Marcona `[-15.13951, -74.97555]` | Puerto de San Nicolás `[-15.2600, -75.2400]` | **Morado** (`#9c27b0`) en ambos gráficos |

### Detalles de Implementación en los Gráficos

* **Gráfico 1 (Ferrobamba):** Se dibuja toda la ruta en color **Morado** (`#9c27b0`) sin cortes. Se añaden landmarks visuales específicos en los puntos de inicio de la **1S** y de la **Carretera a Marcona** con líneas de llamada de alta calidad.
* **Gráfico 2 (Triángulo PETRAL):** Se realiza el corte (slice) asíncrono exacto de la ruta: el Tramo 1 se descarta, el Tramo 2 se pinta en **Amarillo** (`#ffc107`), y el Tramo 3 se pinta en **Morado** (`#9c27b0`). Sin ensuciar el mapa.

## 5. MEJORAS FINALES: Guía de Perfección para Exportación HD (V23)

La exportación de mapas de Leaflet a imágenes de Alta Resolución (HD) a través de herramientas de captura de DOM (como Súper Resolución x3) presenta severos desafíos técnicos. Para lograr la perfección visual obtenida en la **Versión 23**, los futuros agentes DEBEN respetar estrictamente las siguientes reglas descubiertas durante la iteración:

### 5.1 El Motor de Captura (Librería)
- **❌ NO USAR `html2canvas`:** Provoca bugs severos con las coordenadas 3D de Leaflet (`translate3d`), haciendo que los vectores, Canvas y SVGs salgan volando fuera de foco o desaparezcan por completo al aplicar el multiplicador de escala.
- **✅ USAR `html-to-image`:** Librería moderna que procesa fielmente el renderizado nativo del navegador. Soluciona instantáneamente los desfases de Leaflet sin necesidad de hacks de "congelamiento 3D".

### 5.2 Renderizado Nativo de Leaflet
- **Forzar Canvas:** Leaflet dibuja SVG por defecto. Para asegurar que `html-to-image` capture todas las rutas (OSRM) y polígonos, inyectar globalmente `window.L_PREFER_CANVAS = true;` ANTES de cargar Leaflet en el HTML. Esto obliga a dibujar todo en un `<canvas>`.
- **Desactivar 3D (Opcional):** Si persiste el offset, evitar hacks de CSS. Leaflet puede ser forzado a trabajar en modo "flat 2D" inyectando `L.Browser.any3d = false;` (aunque `html-to-image` suele manejar el 3D sin problemas).

### 5.3 Problemas de Tipografía (Kerning y Overflows)
- Las cajas de `max-content` dentro de `foreignObject` (usado por `html-to-image`) sufren de bugs severos: al multiplicar la escala (x3), el navegador ensancha milimétricamente las letras, rompiendo los recuadros.
- **Solución Estructural:** Sustituir `width: max-content;` por `display: inline-block;`. Añadir generosos márgenes internos (`padding`) para darle a las palabras un "colchón" de expansión seguro.
- **Solución Tipográfica Segura:** **EVITAR FUENTES WEB COMO GOOGLE FONTS (ej. `Rajdhani`)** en las etiquetas. Estas fuentes pueden retrasarse o calcular mal su ancho en los Canvas estáticos. **Usar fuentes de sistema (ej. `Arial, Helvetica, sans-serif`)**, las cuales poseen kerning estricto e indestructible.

### 5.4 Limpieza Visual (Efectos)
- **Eliminar `box-shadow`:** Las librerías fotográficas fallan al renderizar difuminados, halos o sombras semitransparentes sobre escalas altas, produciendo manchas, bordes sucios o artefactos visuales. 
- En la V23, **SE DEBEN QUITAR TODAS LAS SOMBRAS** (`box-shadow`) de los contenedores de etiquetas, la burbuja principal e incluso de los puntos ancla decorativos (bolitas). El diseño *flat* (plano) asegura una exportación fotográfica limpia.
