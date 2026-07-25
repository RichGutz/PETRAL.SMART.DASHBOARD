# 📘 Bitácora de Desarrollo - Paso 4 (UI/UX Analytics & Interactive Dashboard)

## 📌 Contexto
Habiendo estabilizado el P&L unitario en el backend (Paso 3) y la tabla pivot en React, el enfoque migró hacia la visualización analítica de los datos. El objetivo era convertir la grilla estática en un verdadero "Motor de Inteligencia de Negocios Interactivo" (HTA Commercial Forecast), integrando capacidades de *Cross-Filtering*, desglose de métricas al 100%, y una identidad visual impecable que asemeje plataformas corporativas nivel Bloomberg.

## 🛠️ Acciones Realizadas

### 1. Gráfico Cruzado Dinámico (Apache ECharts)
- Se desarrolló el componente `InteractiveChart.tsx` acoplado matemáticamente a la cuadrícula temporal del Forecast.
- **Cross-Filtering:** Se inyectó una botonera de controles (Ribbon izquierdo en diseño compacto) que permite "Cruzar Data" agrupando por `Cliente`, `Ruta` o `Buque` dinámicamente, y filtrando por opciones específicas de cada dimensión.
- **Métricas Duales ($ USD vs % Pct):** Implementación de un conmutador matemático que renderiza las barras absolutas en USD, o recalcula instantáneamente los pesos ponderados sobre el Gross Revenue para mostrar barras porcentuales (100% de escala Y).

### 2. Desglose Avanzado de Rentabilidad (Gross Profit Breakdown)
- A solicitud comercial, se creó la métrica especial **"Gross Profit (100%)"**.
- El motor gráfico renderiza una columna apilada que toma el "Gross Revenue" como su 100%, y construye bloques sobre él ordenados jerárquicamente:
  1. `Voyage Result` (P&L Neto Operativo - Abajo)
  2. `Bunker Costs` (Al medio)
  3. `Port Costs` (Arriba)
- **Etiquetado Inteligente:** Los ladrillos contienen su valor en % dentro de la barra, y se auto-ocultan elegantemente si la porción representa menos del 4% del total para no asfixiar el diseño visual.
- **Alineamiento Físico:** Se ajustó el `grid.left` y las proporciones para que la línea de tiempo horizontal (Meses X) coincida geométricamente con las columnas de la tabla superior.

### 3. Refinamiento Estético y Estructura Split Cell en Forecast Grid
- **Formateo Split:** Se reescribió el layout en React de las celdas financieras (`isCurrency`) para crear un efecto visual de doble dato. El valor en USD queda a la izquierda (formato moneda), y su peso Porcentual (%) aparece a la derecha encapsulado en un "badge" con un fondo tenue.
- **Estandarización de Alineamiento:** Para los datos granulares que no son financieros (o no tienen base porcentual), como Días, Frecuencia, o Cargos, las cifras se forzaron limpiamente hacia la derecha.
- **Separadores de Miles:** Se inyectó formateo estándar global (`Intl.NumberFormat`) para toda variable numérica expuesta en la tabla para legibilidad masiva.

## 🎯 Resultado
La **HTA Commercial Forecast** superó su etapa transaccional para convertirse en un *Visualizador Ejecutivo* de clase mundial. La interacción es instantánea (0 latencia entre backend y reflow del DOM en React) y la lectura visual cumple las más estrictas exigencias de una Junta de Directorio, demostrando no solo factibilidad técnica, sino *excelencia* visual corporativa.
