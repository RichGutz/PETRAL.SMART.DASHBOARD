# Instrucciones: Replicación de Gráficos SVG (Mockups para Proposals)

Este documento sirve como "memoria técnica" o "prompt maestro" para que cualquier agente de IA pueda replicar o generar nuevos gráficos interactivos SVG para el dashboard/forecast de Petral, manteniendo el estándar de diseño, la estructura algorítmica y la precisión matemática que hemos consolidado.

Al momento de generar un gráfico de "Gross Margin" o "Ventas" por Ruta y Buque, el Agente DEBE seguir estrictamente estas directrices:

## 1. Estructura General y Escalas (Ejes Duales)
- **SVG ViewBox:** Usar un ancho robusto (ej. `viewBox="0 0 630 300"`) para dar espacio a todas las agrupaciones.
- **Doble Eje Y:** 
  - **Izquierdo (Por Barco):** Escala de `0` a `1,250,000` (o aproximado real). El título debe desplazarse totalmente hacia la izquierda (ej. `x="-5"`) rotado `-90` grados para no pisar las cifras.
  - **Derecho (Total Mes):** Escala que consolida la suma total del mes (ej. `0` a `3,000,000`).
- **Formato Financiero:** Todas las cifras de los ejes DEBEN tener comas separadoras de miles (ej. `1,250,000`, nunca `1250000`).

## 2. Precisión Matemática Financiera (Core Logic)
- **Fletes Reales:** La altura de los stacks en el eje izquierdo debe reflejar ventas lógicas. La fórmula por "viaje" (voyage) es de **13,000 TM** multiplicado por un tarifario promedio de **$19 a $30 USD/TM** (aprox. **$247k a $390k USD** por viaje).
- **Frecuencia:** Cada barco operativo debe ejecutar un **mínimo de 2 y un máximo de 3 viajes** mensuales. Está prohibido graficar barcos con 1 solo viaje, la barra general quedaría muy pequeña e irreal.
- **Curva de Tendencia:** Se debe plotear una curva (línea roja con marcadores) que cruce el mes indicando la SUMA EXACTA de las ventas de todos los buques de ese mes, y debe apuntar visualmente a la escala del Eje Derecho.

## 3. Disposición de Barras (Agrupamiento en Eje X)
- **Meses (Eje X):** Los labels de meses deben ir en la parte inferior, ubicados lo suficientemente abajo (ej. `y="270"`) para **NO colisionar** con los nombres de los barcos.
- **Agrupamiento:** Para un mismo mes, se presentarán 3 barcos juntos (ej. Moquegua, Tablones, Concon T.).
- **Angostamiento y Gaps:** Cada barco ocupa una "ranura" de 24 píxeles en el eje X, pero la barra (el `<rect>`) debe medir **20 píxeles de ancho**. Esto asegura un margen (gap) de **4 píxeles** entre barra y barra para que respiren.
- **Rotación de Etiquetas:** Los nombres de los barcos van rotados `-90` (hacia arriba) justo debajo de su barra (`y="190"`), sin tocar la etiqueta del mes.

## 4. Texturizado (Algoritmo de Inyección de Letras SVG)
**CRÍTICO:** Está estrictamente prohibido usar patrones `<pattern patternUnits="userSpaceOnUse">` que repitan letras o texturas globales, ya que causan que las letras se corten en las fronteras de las barras. 

Para colocar el indicador del barco sobre su respectiva barra de color (ruta), debes usar **overlay explícito de etiquetas `<text>`**:
- **Posicionamiento Geométrico:** Inserta elementos `<text>` calculando el centro de la porción (`y = y_top + height/2`).
- **Dos Columnas:** Ya que la barra tiene ancho 20, debes insertar DOS letras en paralelo (ej. a `x+6` y a `x+14` de la barra).
- **Repetición Vertical (Tile Dinámico):** Si la porción (brick) es de una altura menor a 14px, inserta solo una fila de letras. Si es mayor a 14px, repite las letras a un paso (step) de ~12px calculando la distribución vertical uniforme. **La letra nunca debe cruzar el límite del rectángulo.**
- **Estilo:** Letras minúsculas de tamaño `4.5` (`font-size="4.5"`) y color NEGRO (`fill="#000000"`).

## 5. Leyendas Inferiores y Cierre de SVGs
- **Estructura de Dos Filas (Prevención de Solapamientos):** En gráficos de barras de forecast (como Pilar A y Variante), la leyenda debe estar estructurada obligatoriamente en **dos filas independientes** (Rutas arriba, Barcos/Buques abajo) utilizando un contenedor Flexbox vertical (`display: flex; flex-direction: column; align-items: center; gap: 8px;`). Esto previene que WeasyPrint colisione horizontalmente la palabra "BUQUES" o "BARCOS" con etiquetas largas de rutas como "Ilo-Callao".
- **Rutas (Colores):** Organizar las rutas en una sola línea horizontal con su respectiva muestra de color, usando `white-space: nowrap;` y un tamaño de letra adecuado (`7.5pt`) para que los nombres de las rutas no se rompan ni se desborden.
- **Barcos (Etiquetas):** Disponer las etiquetas de los barcos en la segunda fila horizontal, mostrando las letras insignia (`T`, `M`, `CT`, `H`) en recuadros grises (`#e2e8f0`) con el nombre correspondiente al lado.
- **Cierre Correcto de SVG (CRÍTICO):** Todos los gráficos SVG deben cerrarse de forma correcta y explícita en el HTML (`</svg>`), y todas sus etiquetas internas (como `<circle>`, `<rect>`, `<path>`) deben cerrarse propiamente con `/>`. La falta de un tag de cierre de SVG causa que WeasyPrint inyecte la leyenda HTML directamente *dentro* del lienzo gráfico, ignorando el flujo normal y sobreponiendo el texto de la leyenda sobre el área de datos (por ejemplo, encimando la palabra "BUQUES" sobre la barra "Ilo-Callao").

## 6. Spaghetti Map de Rutas (Mapa Geográfico Vectorial)
Para graficar el flujo de tráfico mediante arcos de densidad en un mapa costero:
- **Máscara de Recorte (Crop):** Cortar el mapa de Perú y Chile con un paralelo estricto al norte de Callao usando una máscara `<clipPath id="map-clip">` con `<rect x="0" y="38" width="340" height="402" />`.
- **Coordenadas de Puertos en Lienzo (340x440):**
  - **Callao:** `[113.7, 44.6]`
  - **Marcona:** `[165.7, 151.3]`
  - **Matarani:** `[243.7, 204.3]`
  - **Ilo:** `[263.7, 225.2]`
  - **Mejillones (Chile):** `[289.0, 399.1]`
- **Diferenciación Geopolítica:** Sombree el territorio chileno con gris medio-oscuro (`fill="#94a3b8"`, `stroke="#64748b"`) en contraste con Perú (`fill="#cbd5e1"`, `stroke="#cbd5e1"`), lo que resalta nítidamente la frontera costera en el extremo sur.
- **Trazado de Arcos (Spaghetti Arcs):**
  - Genere arcos convexos hacia el oeste (océano) usando curvas Bézier cúbicas (`C`).
  - **Evitar Superposiciones:** Para rutas paralelas o superpuestas, aplique una dispersión dinámica en la dirección del vector unitario perpendicular de la órbita de **8 píxeles** por viaje (`spread_h = (i - (count-1)/2) * 8.0`). Esto permite el conteo visual de viajes individuales.
- **Panel Lateral de Control (Mockup):** Diseñar una columna interactiva a la derecha (ancho `32%`) con selectores de lista (`<select>`) para Mes, Buque y Ruta, y la leyenda vertical de rutas.

## 7. Pie-Bubble Chart (Gráfico de Burbujas con Sectores Circulares)
Para mostrar la participación del Gross Margin de cada buque por ruta de origen-destino en un gráfico multidimensional:
- **Ejes y Coordenadas 1:1:**
  - Usar un viewBox de `0 0 800 450` y un tamaño físico de SVG de `width="720" height="450"` (escala exacta de renderizado de `0.9` en WeasyPrint).
  - **Eje Y (Salida):** Eje vertical en `x = 80`. Puertos de salida situados en `y = 100` (Callao) e `y = 300` (Ilo).
  - **Eje X (Llegada):** Eje horizontal en `y = 390`. Puertos de llegada situados en `x = 140` (Callao), `x = 340` (Marcona), `x = 540` (Matarani) y `x = 740` (Mejillones).
  - **Separación de Columnas:** La distancia entre centros de las columnas en el eje X debe ser de **`200px`** (el doble de los `100px` originales en pantalla) para evitar colisiones.
- **Evitar Colisión del Eje X:** El eje X debe colocarse en `y = 390`. Para una burbuja de radio máximo `54.7px` (1.45M con origen Ilo `y = 300`), su base inferior llegará a `y = 354.7`, lo que garantiza una holgura libre de **35.3px** respecto al eje X.
- **Cálculo de Diámetro (+20% parejo):**
  - Fórmula del radio en código: `r = (20 + (total_val / 1450000.0) * 18) * 1.44` (el factor `1.44` garantiza que las burbujas se rendericen un 20% más grandes en pantalla).
- **Lógica de Sectores Circulares (Pie Chart Overlay):**
  - Si un buque tiene 100% de participación en una ruta, se dibuja un `<circle>` simple del color del barco.
  - Si hay participación compartida, se dividen en sectores trigonométricos usando arcos SVG `<path d="M cx,cy L x1,y1 A r,r 0 large_arc,1 x2,y2 Z">`.
  - **Etiquetas de Buque Internas:** Colocar el indicador de buque (ej. `T`, `M`, `CT`, `H`) centrado angularmente en el sector a `0.62 * r` de distancia del centro (`fill="#ffffff"`, `font-size="7.5"`, `font-weight="bold"`).
- **Etiquetas de Gross Margin Externas:** El Gross Margin consolidado (ej. `$1,450k`) debe ir centrado y flotando **fuera** de la burbuja, en la parte superior, con un margen de 8 píxeles (`text_y = cy - r - 8`).

> **Instrucción para el Agente:** "Antes de crear el SVG, revisa la matemática. Al momento de armar las barras, ejecuta la lógica del texturizado dinámico con elementos de texto para evitar cortes de frontera. Al crear mapas o bubble charts, respeta los crops geopolíticos, las escalas 1:1, los espaciados amplificados a 200px y las holguras verticales de seguridad de 35px en el eje X para evitar solapamientos."

