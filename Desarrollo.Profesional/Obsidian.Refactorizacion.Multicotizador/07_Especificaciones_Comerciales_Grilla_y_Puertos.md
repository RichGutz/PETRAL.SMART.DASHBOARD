# 📑 ESPECIFICACIONES COMERCIALES: GRILLA LIVE DE TRAMOS Y CONFIGURACIÓN DE PUERTOS (V1.0)

> **Ubicación de Control:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador`  
> **Fecha de Documentación:** 14 de Agosto de 2026  
> **Estado:** Especificación Comercial de la Grilla Live Tabular y Configuración de Puertos  
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
    └── Tonelaje por defecto: 13,500 TM (Capacidad estándar de buques PETRAL: Moquegua / Tablones).
==================================================================================================
```

---

## 📊 2. Especificación Detallada de Columnas y Fórmulas Matemáticas

### 🔹 2.1. Columnas de Tramo de Navegación

1. **`TRAMO` (Tipo de Navegación):**
   * Valida en tiempo real si el buque transporta mineral.
   * `LADEN`: Buque navegando con carga.
   * `BALLAST`: Buque navegando en lastre.

2. **`ORIGEN (POL)` y `DESTINO (POD)`:**
   * Mapeados al catálogo oficial de la tabla `ports`.
   * El puerto de origen del Tramo $N+1$ se sincroniza automáticamente con el puerto de destino del Tramo $N$.

3. **`DISTANCIA (NM)`:**
   * Se auto-obtiene del Maestro de Distancias (`routes_clients` / `ports`).
   * Si no se encuentra coincidencia en el catálogo, se coloca `0` por defecto para edición manual.

4. **`WEATHER FACTOR (%)`:**
   * Factor de contingencia por condiciones meteorológicas en mar (por defecto: `3.0%`).

5. **`VELOCIDAD (knots)`:**
   * Se hereda de las especificaciones técnicas del Buque seleccionado en el Paso 4.

6. **`DÍAS MAR`:**
   * Cálculo matemático de navegación:
     $$\text{Días Mar} = \frac{\text{Distancia (NM)} \times \left(1 + \frac{\text{Weather Factor \%}}{100}\right)}{\text{Velocidad (knots)} \times 24}$$

---

### 🔹 2.2. Columnas de Operación de Puerto

1. **`ACCIÓN` (`NONE`, `CARGAR`, `DESCARGAR`):**
   * Define la actividad comercial en cada puerto.

2. **`TIME TO COUNT` (Horas de Demora en Puerto):**
   * Horas acordadas para inicio del cómputo de laancha/atracadero.
   * Para Clientes ACTIVOS, se jala del Maestro de Contratos (`contracts`), ej. 12.0h para NEXA, 6.0h para SPCC.

3. **`POSICIONAMIENTO` (Horas de Maniobra):**
   * Tiempo de atracadero y desamarre (pactado en `contracts` para clientes activos).

4. **`RITMO DE OPERACIÓN` (TH - Toneladas/Hora):**
   * Velocidad de carga o descarga estipulada en contrato.

5. **`DÍAS PUERTO`:**
   * Cálculo de permanencia en puerto:
     $$\text{Días Puerto} = \frac{\frac{\text{Cantidad TM}}{\text{Ritmo TH}} + \text{Time to Count (hrs)} + \text{Posicionamiento (hrs)}}{24}$$

---

### 🔹 2.3. Columnas Económicas y de Consumo

1. **`FLETE ($/MT)`:**
   * Para Clientes ACTIVOS, se obtiene del contrato vigentes en `contracts` para el destino correspondiente.
   * Flete Total ($) = $\text{Cantidad TM} \times \text{Flete (\$/MT)}$.

2. **`COSTO PUERTO ($)`:**
   * Tarifa de derechos portuarios obtenida de la matriz estática `port_cost_static`.

3. **`CONSUMO DE BÚNKER (USD)`:**
   * Combina las horas de mar y puerto con los 4 ratios de consumo del buque (Sea, Idle, Load, Disch):
     $$\text{Costo IFO} = \left(\text{Días Mar} \times \text{Ratio Sea IFO} + \text{Días Puerto} \times \text{Ratio Op IFO}\right) \times \text{Precio IFO (\$/T)}$$
     $$\text{Costo MDO} = \left(\text{Días Mar} \times \text{Ratio Sea MDO} + \text{Días Puerto} \times \text{Ratio Op MDO}\right) \times \text{Precio MDO (\$/T)}$$

4. **`MUELLAJE (Wharfage)`:**
   * Costo *pass-through* refacturado a costo cuando se acuerda convencionalmente con el cliente (ej. descarga en Mejillones).

---

## 🔄 3. Diagrama de Flujo de Datos en Grilla Live

```mermaid
flowchart TD
    SelectVessel["🚢 Buque Seleccionado (Paso 4)\n(Velocidad & Ratios IFO/MDO)"] --> GridCalc
    SelectClient["🏢 Cliente (Activo vs Prospecto)"] --> GridCalc
    TramosInput["🛣️ Tramos (POL ➔ POD, Distancia)"] --> GridCalc

    subgraph GridCalc ["🧮 MOTOR DE CÁLCULO DE GRILLA LIVE"]
        GridCalc --> SeaDays["🌊 Días Mar = (Dist * 1.03) / (Vel * 24)"]
        GridCalc --> PortDays["⚓ Días Puerto = (TM / Ritmo + Delays) / 24"]
        GridCalc --> BunkerCost["🛢️ Consumo Búnker = (Días * Ratios) * Precio Fuel"]
        GridCalc --> PortCosts["🏛️ Gastos Portuarios (port_cost_static)"]
        GridCalc --> FreightRev["💰 Ingreso Flete = TM * Rate ($/MT)"]
    end

    GridCalc --> FinalCards["📊 RESULTADOS FINANCIEROS (Cards Inferiores)"]
```

---

## 📄 Archivos Relacionados
* **Documento UI Cabecera y Búnker:** [`06_Especificaciones_Comerciales_UI_Header_y_Bunker.md`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/06_Especificaciones_Comerciales_UI_Header_y_Bunker.md)
* **Documento Modularización previa:** [`04_Modularizacion_Frontend_Servicios_y_Tabs.md`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/04_Modularizacion_Frontend_Servicios_y_Tabs.md)
* **Script Flujograma Python:** [`FLUJOGRAMA_Arquitectura_Multicotizador_V1.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/FLUJOGRAMA_Arquitectura_Multicotizador_V1.py)
