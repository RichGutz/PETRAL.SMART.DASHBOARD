# 📑 ESPECIFICACIONES COMERCIALES: GRILLA LIVE DE TRAMOS Y CONFIGURACIÓN DE PUERTOS (V1.0)

> **Ubicación de Control:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador`  
> **Fecha de Documentación:** 14 de Agosto de 2026  
> **Estado:** Especificación Comercial Completa de la Grilla Live Tabular y Puertos  
> **Servidor VPS:** `https://forecast.geeksoft.tech`

---

## 🎯 1. Visión General de la Grilla Live (`SpreadsheetTramosGrid.tsx`)

La **Grilla Live Tabular** es el motor operativo donde se construye la secuencia de navegación y operaciones de puerto para el viaje marítimo.

```text
==================================================================================================
                 ⚓ ESTRUCTURA DE LA GRILLA LIVE DE TRAMOS Y PUERTOS
==================================================================================================
 🔘 REGLA DE FILAS MÍNIMAS:
    └── MÍNIMO OBLIGATORIO DE 3 TRAMOS (BALLAST ➔ LADEN ➔ BALLAST) para cotizar viajes redondos.

 🔘 DINÁMICA DE CARGA A BORDO:
    ├── Si Carga a Bordo > 0 ➔ Tipo de Tramo se fija automáticamente en 'LADEN' (Cargado).
    └── Si Carga a Bordo = 0 ➔ Tipo de Tramo se fija automáticamente en 'BALLAST' (En Lastre).

 🔘 TONELAJE ESTÁNDAR OPERATIVO:
    └── Tonelaje por defecto: 13,500 MT (Capacidad estándar de buques PETRAL: Moquegua / Tablones).
==================================================================================================
```

---

## 📊 2. Matriz Completa de Columnas (De Izquierda a Derecha)

Below is the exhaustive, column-by-column operational matrix mapping exact database sources (`distances`, `contracts`, `port_cost_static`), input fields, and mathematical formulas:

| # | Columna | Función / Descripción Comercial | Origen de Datos / Tipo BD | Fórmula de Cálculo o Regla Comercial Exacta |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **`LEG`** | Identificador secuencial del tramo. Incluye botones `[+]` y `[-]` para agregar/quitar tramos. | Control UI (Auto-generado) | Secuencia $1, 2, 3...$ (Mínimo obligatorio de 3 tramos para viajes redondos). |
| **2** | **`Tipo`** | Clasifica el tramo en **`LADEN`** (Navegando cargado) o **`BALLAST`** (Navegando en lastre/vacío). | Auto-calculado en memoria | Si $\text{Carga a Bordo} > 0 \Rightarrow \text{'LADEN'}$. Si $\text{Carga a Bordo} = 0 \Rightarrow \text{'BALLAST'}$. determina los Weather Factors de la tabla `distances`. |
| **3** | **`Puerto`** | Puerto de Origen (POL) en Fila 0 y Puertos de Destino (POD) en filas siguientes. | Selección Catálogo (`ports`) | Fila 0 = POL inicial. El Origen del Tramo $N+1$ se sincroniza automáticamente con el Destino del Tramo $N$. |
| **4** | **`Dist (NM)`** | Distancia marítima del tramo expresada en Millas Náuticas (NM). | Consulta BD: Tabla **`distances`** | Busca por el par ordenado (Puerto Origen `POL` ➔ Puerto Destino `POD`) en la tabla `distances`. |
| **5** | **`W.F (%)`** | Weather Factor / Margen de contingencia por clima adverso en mar. | Consulta BD: Tabla **`distances`** | **NO ES FIJO 3.0%**. Se lee de `distances`: columna `weather_factor_laden` para `LADEN` y `weather_factor_ballast` para `BALLAST`. |
| **6** | **`Vel (kn)`** | Velocidad de navegación del buque en nudos (knots). | Auto-completado de Buque | Heredado automáticamente del buque seleccionado en el Paso 4 (ej. `TABLONES = 11.0 kn`). |
| **7** | **`Días Mar`** | Días totales de navegación efectiva en mar. | Cálculo Matemático | $$\text{Días Mar} = \frac{\text{Distancia (NM)} \times \left(1 + \frac{\text{W.F \%}}{100}\right)}{\text{Velocidad (kn)} \times 24}$$ |
| **8** | **`Días Pto`** | Días de permanencia operativa en el puerto de destino. | Cálculo Matemático | $$\text{Días Pto} = \frac{\frac{\text{Cantidad (MT)}}{\text{Ritmo (TH)}} + \text{Time to Count (h)} + \text{Posic (h)}}{24}$$ |
| **9** | **`Time to Count (H)`**| Demora/espera en puerto estipulada en contrato antes del inicio de plancha. | Consulta BD: Tabla **`contracts`** | Leído de `contracts`: `time_to_count_carga_hrs` si `Op. Dest` es `CARGAR`, `time_to_count_descarga_hrs` si es `DESCARGAR`, y `0.0h` si es `NONE`. |
| **10** | **`Posic (h)`** | Horas de maniobra, atracadero y desamarre en el puerto. | Consulta BD: Tabla **`contracts`** | Leído de `contracts`: `maneuver_carga_hrs` si `Op. Dest` es `CARGAR`, `maneuver_descarga_hrs` si es `DESCARGAR`, y `0.0h` si es `NONE`. |
| **11** | **`Op. Dest`** | **COLUMNA CLAVE DE CONTROL:** Acción en puerto: **`NONE`**, **`CARGAR`**, **`DESCARGAR`**. | Selector Manual / Lógica Live | Fila 0 = `CARGAR` por defecto. Determina la asignación de `Time to Count` y `Posicionamiento` (si es `NONE`, ambos se fijan en `0.0h`). |
| **12** | **`Ritmo (C/D)`** | Velocidad de operación en puerto (Toneladas/Hora - TH). | Consulta BD / Defecto 500 TH | Leído de `contracts` (`load_rate` / `discharge_rate`). **Si no existe en contrato, se fija por defecto en 500 TH** tanto para Carga como Descarga. |
| **13** | **`Q (MT)`** | Cantidad de mineral a cargar o descargar en Toneladas Métricas (MT). | Input Numérico (Editable) | Tonelaje estándar nominal por defecto: **`13,500 MT`** (capacidad estándar PETRAL). |
| **14** | **`F ($/t)`** | Tarifa de flete unitaria fijada en Dólares por Tonelada ($/MT). | Consulta BD: Tabla **`contracts`** | Clientes ACTIVOS: leída de la matriz de tarifas por rango de toneladas en `contracts`. Prospectos: digitada libremente. |
| **15** | **`Costo Pto`** | Gastos portuarios totales del puerto en USD. | Consulta BD: **`port_cost_static`** | Consulta estructurada en `port_cost_static` mediante la tupla de 3 llaves: `(port_id, operation_type, vessel_id)`. |
| **16** | **`Flete ($)`** | Ingreso total bruto generado por la carga del tramo (USD). | Cálculo Matemático | $$\text{Flete Total (\$)} = \text{Cantidad (MT)} \times \text{Flete (\$/t)}$$ |
| **17** | **`Bunker ($)`** | Costo total de combustible consumido en el tramo (IFO + MDO) en USD. | Cálculo Matemático | $$\text{Bunker (\$)} = (\text{Horas Mar} \times \text{Consumo Sea} + \text{Horas Pto} \times \text{Consumo Op}) \times \text{Precio Búnker (\$/T)}$$ |
| **18** | **`MUELLAJE`** | Monto en USD por derecho de muellaje (*wharfage*). | Consulta BD: **`port_cost_static`** | Búsqueda estructurada en `port_cost_static` por puerto y buque (ej. **`$33,333.00`** para descarga en Mejillones). |
| **19** | **`RF`** | Casilla de Refacturación de Muellaje (*pass-through*) al cliente. | Selector Checkbox (`[x]`) | Si está marcado `[x]`, el muellaje se refactura al cliente y no afecta el margen directo PETRAL. |

---

## 🔄 3. Diagrama de Flujo de Datos e Integración de Tablas BD

```mermaid
flowchart TD
    DistBD["📍 Tabla distances\n(distancia, weather_factor_laden, weather_factor_ballast)"] --> GridCalc
    ContractsBD["📑 Tabla contracts\n(time_to_count_carga/descarga, maneuver_carga/descarga, rates)"] --> GridCalc
    PortStaticBD["🏛️ Tabla port_cost_static\n(port_id, operation_type, vessel_id -> cost & wharfage)"] --> GridCalc
    SelectVessel["🚢 Buque Seleccionado (Paso 4)\n(Velocidad & Ratios IFO/MDO)"] --> GridCalc

    subgraph GridCalc ["🧮 MOTOR DE CÁLCULO DE GRILLA LIVE"]
        GridCalc --> OpAction["11. Op. Dest (CARGAR/DESCARGAR/NONE)\nAsigna T.C y Maneuver exactos de contracts"]
        GridCalc --> SeaDays["7. Días Mar = (Dist * (1 + WF/100)) / (Vel * 24)"]
        GridCalc --> PortDays["8. Días Puerto = (TM / Ritmo[500 TH] + TC + Posic) / 24"]
        GridCalc --> BunkerCost["17. Consumo Búnker = (Horas * Ratios) * Precio Fuel"]
        GridCalc --> PortCosts["15/18. Gastos Portuarios & Muellaje (port_cost_static)"]
    end

    GridCalc --> FinalCards["📊 RESULTADOS FINANCIEROS (Cards Inferiores)"]
```

---

## 📄 Archivos Relacionados
* **Documento UI Cabecera y Búnker:** [`06_Especificaciones_Comerciales_UI_Header_y_Bunker.md`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/06_Especificaciones_Comerciales_UI_Header_y_Bunker.md)
* **Documento Modularización previa:** [`04_Modularizacion_Frontend_Servicios_y_Tabs.md`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/04_Modularizacion_Frontend_Servicios_y_Tabs.md)
* **Script Flujograma Python:** [`FLUJOGRAMA_Arquitectura_Multicotizador_V1.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/FLUJOGRAMA_Arquitectura_Multicotizador_V1.py)
