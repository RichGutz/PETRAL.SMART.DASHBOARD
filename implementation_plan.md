# Plan de Implementación: Integración Nativa de Cotizaciones en Matriz Financiera (ForecastGrid)

Este plan detalla la refactorización para cambiar el flujo de exportación: en lugar de "empujar" desde el Multicotizador a la Matriz Financiera, la **Matriz Financiera** "jalará" (pull) las cotizaciones directamente desde `routes_quotes` mediante sus propios controles, permitiendo además re-calcular todo dinámicamente si se cambia el buque (buque comodín).

---

## Cambios Propuestos

### 1. Copias de Respaldo (Sufijo `_legacy`)

* **[NEW]** `c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\ForecastGrid_legacy.tsx`
  - Copia exacta del actual `ForecastGrid.tsx` antes de iniciar cambios.
* **[MODIFY]** `c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel_legacy.tsx`
  - Asegurar que contenga la versión previa estable del Multicotizador.

---

### 2. Ajustes en el Multicotizador Spot (`MultiCotizadorExcel.tsx`)

* **Eliminación de "Exportar a Matrix"**:
  - Se remueve el botón `📊 Exportar a Matrix` y su modal asociado de la barra del Paso 6.
* **Consolidación del Botón `Grabar`**:
  - El botón `💾 Grabar Cotización` se renombra a **`💾 Grabar`**.
  - Persiste la cotización en `routes_quotes` con el prefijo del cliente en el campo `name` (ej. `SPCC - Ilo a Callao`).

---

### 3. Ajustes en la Matriz Financiera (`ForecastGrid.tsx`)

* **Selector de Rutas/Cotizaciones**:
  - Al agregar o editar una línea en el ForecastGrid, el selector de rutas consultará tanto las rutas de contratos (`routes_contracts`) como las cotizaciones grabadas (`routes_quotes`).
  - Las cotizaciones se identificarán por su nombre prefijado con el cliente.
* **Carga de Detalles de Cotización**:
  - Si se jala una ruta de contrato: se cargan los valores estándar (comportamiento actual).
  - Si se jala una cotización de `routes_quotes`: se cargan todos los detalles específicos del viaje (tramos, factores de clima, ritmos de operación y costos de puerto específicos grabados).
* **Buque Comodín (Wildcard Vessel)**:
  - En la fila de la cotización dentro de la Matriz Financiera, el usuario podrá cambiar el buque asignado mediante un menú desplegable.
  - Al cambiar el buque, el sistema recalculará automáticamente los días de mar, días de puerto, consumos de búnker y resultados financieros usando las especificaciones técnicas del nuevo buque seleccionado.

---

## Plan de Verificación

### Pruebas Manuales
1. Guardar una cotización en el estimador con el nombre `SPCC - Prueba Comodín` usando un buque inicial.
2. Ir a la Matriz Financiera, agregar una línea para `SPCC`, seleccionar la cotización `Prueba Comodín` y verificar que jala los datos con el desglose exacto.
3. Cambiar el buque en la línea de la Matriz Financiera y validar que las métricas (días, costos de búnker) se recalculan dinámicamente.
