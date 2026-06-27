# Plan de Implementación: Controles de Gráfico y Formato de Unidades

Este plan detalla los cambios necesarios para agregar controles independientes por eje en el gráfico interactivo, además de la capacidad de alternar entre Unidades Originales y Porcentajes (%) tanto en el gráfico como en la tabla.

## User Review Required

> [!IMPORTANT]
> **Definición del Porcentaje (%) en la Tabla:** Cuando activamos la vista en `%`, generalmente significa "% de los Ingresos Brutos (Gross Revenues)". Es decir, si el Bunker Cost es $30k y el Ingreso Bruto es $100k, se mostrará `30%`. 
> Por favor, confirma si esta es la lógica correcta para los campos financieros.

## Open Questions

> [!WARNING]
> **Métricas no financieras en %:** Para las métricas "Viajes (número)" y "Toneladas", ¿deberían mantenerse siempre en sus unidades originales incluso si el selector global está en `%`? (Dado que no tiene mucho sentido mostrar los viajes como porcentaje de los ingresos). Asumiremos que se mantienen en sus unidades originales a menos que me indiques lo contrario.

## Proposed Changes

### Componentes de UI y Estado

#### [MODIFY] [InteractiveChart.tsx](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/InteractiveChart.tsx)
- **Estado de Controles:** 
  - Agregar `primaryGraphType` y `secondaryGraphType` (`'bar' | 'line'`).
  - Agregar `isPrimaryCumulative` para habilitar valores acumulados en el Eje Y izquierdo.
- **Métricas:** 
  - Asegurar que el selector incluya exactamente: `viajes`, `net_income` (Gross Revenues), `total_port_costs`, `total_bunker_costs`, `voyage_result` y `total_cargo` (Toneladas).
- **Interfaz (Mockup):** 
  - Rediseñar el panel izquierdo lateral para dividir claramente en **Eje Primario (Izquierdo)** y **Eje Secundario (Derecho)**, cada uno con su propio selector de Métrica, Tipo de Gráfico (Radio buttons) y Checkbox de Acumulado.
- **Lógica ECharts:** 
  - Vincular las selecciones de tipo de gráfico para que rendericen dinámicamente barras o líneas en la configuración de la `series` de ECharts.

---

#### [MODIFY] [ForecastGrid.tsx](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/ForecastGrid.tsx)
- **Selector de Vista (Tabla):**
  - Agregar un control (Switch o Botones) en la parte superior de la tabla para alternar entre "Unidades Originales" y "%".
- **Formateo de Celdas:**
  - Si el usuario selecciona `%`, modificar el renderizado de las filas para `total_port_costs`, `total_bunker_costs` y `voyage_result` para que dividan su valor por el `net_income` del mismo nodo y se multipliquen por 100, mostrando el resultado con el símbolo `%`.
  - Las filas de `viajes` y `total_cargo` ignorarán este formato y se mostrarán en formato estándar.

## Verification Plan

### Manual Verification
1. Abrir la pestaña del Gráfico. Modificar el eje primario a Barras (Gross Revenue) y el secundario a Líneas (Toneladas, Acumulado). Verificar que ECharts dibuje correctamente la gráfica mixta y con dos escalas en Y.
2. Alternar entre las modalidades "Original Units" y "%". Verificar que los Tooltips y los ejes del gráfico reflejen los datos correctamente.
3. Ir a la pestaña de la Tabla (Grid). Activar el toggle de "%" y validar manualmente que los valores de Costos representen matemáticamente la división entre el Costo y el Ingreso Bruto.
