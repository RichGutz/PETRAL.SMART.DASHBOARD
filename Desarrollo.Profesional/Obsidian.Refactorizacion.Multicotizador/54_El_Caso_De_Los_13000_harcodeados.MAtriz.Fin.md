# 54. El Caso de los 13,000 "Hardcodeados" y la Auditoría Pericial de Escenarios en la Matriz Financiera

**Fecha:** 26 de Octubre de 2026  
**Auditor Pericial:** Benoit Blanc  
**Estado:** Resuelto / Evidencia Forense Irrefutable  
**Entorno Auditado:** Base de Datos Oficial de Producción Contabo VPS (`169.58.168.107` / `petral_db`)  

---

## 1. El Misterio Planteado por la Gerencia

La hipótesis comercial señalaba:
> *"No es la primera vez que se cambia de buque para crear escenarios. Miren los escenarios que están grabados en la base de datos."*

La duda legítima era: Si en la Matriz Financiera ya existen escenarios guardados que combinan **MOQUEGUA** y **TABLONES**, ¿cómo es posible que hoy al seleccionar una ruta diseñada para MOQUEGUA y cambiar el selector a TABLONES el sistema arroje un `TypeError: can't multiply sequence by non-int of type 'float'` en la línea 943 de `forecast_service.py` (`total_days * tce_req`)? ¿Acaso no se hacía esto antes?

---

## 2. Auditoría Forense de la Base de Datos (`commercial_forecasts`)

Se realizó una inspección forense directa sobre el contenedor PostgreSQL en producción en Contabo ejecutando un script de verificación línea por línea de todos los escenarios almacenados en la tabla `commercial_forecasts`.

### 2.1. Escenarios Registrados en Producción

Solo existen **2 escenarios comerciales históricos** guardados en la tabla `commercial_forecasts`:

| ID de Escenario | Nombre del Escenario | Fecha de Creación | Total Filas | Buques Involucrados | Clientes |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `f7de5bd0-7bc4-414d-a124-f12fe8ed7dec` | **PB 2027** | 2026-09-11 14:53:51 | 72 | `MOQUEGUA`, `TABLONES` | `SPCC` |
| `ff3ddd4b-f6fa-4b35-b7a0-c36c98886c49` | **2028 +10% DEM 22/26K** | 2026-09-11 14:59:12 | 72 | `MOQUEGUA`, `TABLONES` | `SPCC` |

---

## 3. Desglose Pericial Línea por Línea (El Hallazgo Revelador)

Al analizar las 72 filas de cada escenario contrastando el buque asignado a la fila (`line.vessel_id`) contra la cotización real seleccionada (`line.quote_id`) y el buque interno con el que se modeló dicha cotización en `routes_quotes`:

### 3.1. Escenario 1: `PB 2027` (72 Líneas)
* **36 Líneas de TABLONES:** Todas y cada una fueron creadas utilizando cotizaciones diseñadas **específicamente para TABLONES**:
  * `SPCC.ILO.MATARANI.ILO.2025 Tablones COA Dem`
  * `SPCC.ILO.MARCONA.ILO.2025 Tablones COA Dem`
  * `SPCC.ILO.MEJILLONES.ILO.2025 Tablones COA Dem`
* **36 Líneas de MOQUEGUA:** Todas y cada una fueron creadas utilizando cotizaciones diseñadas **específicamente para MOQUEGUA**:
  * `SPCC.ILO.MATARANI.ILO.2025 Moquegua COA Dem`
  * `SPCC.ILO.MARCONA.ILO.2025 Moquegua COA Dem`
  * `SPCC.ILO.MEJILLONES.ILO.2025 Moquegua COA Dem`
* **Resultado Forense:**
  $$\text{Coincidencias (Buque Fila == Buque Cotización)} = 72 \quad (100\%)$$
  $$\text{Discrepancias (Buque Fila } \neq \text{ Buque Cotización)} = 0 \quad (0\%)$$

### 3.2. Escenario 2: `2028 +10% DEM 22/26K` (72 Líneas)
* **36 Líneas de TABLONES:** Todas utilizaron cotizaciones pre-fabricadas para TABLONES:
  * `SPCC.ILO.MATARANI.ILO.2028 Tablones Dem 22k +10%`
  * `SPCC.ILO.MARCONA.ILO.2028 Tablones Dem 26k +10%`
  * `SPCC.ILO.MEJILLONES.ILO.2028 Tablones Dem 26k +10%`
* **36 Líneas de MOQUEGUA:** Todas utilizaron cotizaciones pre-fabricadas para MOQUEGUA:
  * `SPCC.ILO.MATARANI.ILO.2028 Mquegua Dem 22k +10%`
  * `SPCC.ILO.MARCONA.ILO.2028 Moquegua Dem 26k +10%`
  * `SPCC.ILO.MEJILLONES.ILO.2028 Moquegua Dem 26k +10%`
* **Resultado Forense:**
  $$\text{Coincidencias (Buque Fila == Buque Cotización)} = 72 \quad (100\%)$$
  $$\text{Discrepancias (Buque Fila } \neq \text{ Buque Cotización)} = 0 \quad (0\%)$$

---

## 4. La Conclusión Forense (Por qué nunca antes había reventado)

1. **El Método Histórico Usado en Septiembre 2026:**
   Para armar los escenarios históricos `PB 2027` y `2028 +10%`, el usuario **no cambió el dropdown de buque al vuelo** sobre una cotización existente. El usuario creó en el Multicotizador cotizaciones separadas: unas con el nombre y parámetros de `Tablones` y otras con el nombre y parámetros de `Moquegua`. Al armar la matriz, simplemente seleccionaba la cotización de Tablones para Tablones, y la cotización de Moquegua para Moquegua.
   
2. **Por qué jamás fallaba:**
   Como en todas las 144 filas históricas `vessel == original_vessel_id` (`is_same_vessel = True`), el motor de simulación **SIEMPRE ejecutaba el Camino A** (consumo directo del snapshot precalculado en `financial_summary`), donde `tce_req` venía casteado numéricamente como `float(fin_summary.get("tceReq"))`.

3. **Qué ocurrió hoy (El Nuevo Flujo de Trabajo):**
   Hoy se intentó por primera vez el **Flujo Dinámico de Buque Comodín**:
   * Elegir una cotización diseñada para `MOQUEGUA`.
   * En el mismo formulario, cambiar el selector de Buque a `TABLONES`.
   * Al hacer esto, por primera vez en la historia del sistema:
     $$\text{vessel} \ ('\text{TABLONES}') \neq \text{original\_vessel\_id} \ ('\text{MOQUEGUA}') \implies \text{is\_same\_vessel} = \text{False}$$
   * Esto forzó al motor a entrar al **Camino B** (recálculo dinámico en caliente para buque comodín).
   * En el Camino B, la línea 703 tenía un descuido legacy:
     `tce_req = v_data.get("tce_required", 0)`
     Como `v_data` provenía de la tabla `vessels` donde la base de datos devuelve texto (`'13000.0'`), al evaluar la línea 943:
     `pnl_after_comm - (total_days * tce_req)`
     Python intentó multiplicar `float * str` y estalló con `TypeError`.

---

## 5. Dictamen y Resolución Definitiva

* **No hay datos hardcodeados:** El TCE se jala y se ha jalado siempre del **Maestro de Flota** (`vessels`).
* **Se habilitó exitosamente el Camino B:** Con la corrección aplicada:
  ```python
  tce_req = float(v_data.get("tce_required") or 0.0)
  ```
  y el pre-casteo masivo de todas las columnas numéricas de la tabla `vessels` en `vessels_db`, ahora el usuario puede:
  1. Diseñar un viaje con la cotización de `MOQUEGUA`.
  2. Cambiar inmediatamente a `TABLONES` en el dropdown.
  3. El motor jalará dinámicamente los 13,000 USD de TABLONES del Maestro de Flota, sus velocidades y consumos de IFO/MDO, y simulará la comparación en paralelo sin error.
