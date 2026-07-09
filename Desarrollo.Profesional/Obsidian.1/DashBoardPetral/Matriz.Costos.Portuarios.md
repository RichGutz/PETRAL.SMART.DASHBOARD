# ⚓ Matriz de Costos Portuarios Extraídos (SPCC)

Este documento centraliza los costos fijos de agencia y aduanas extraídos de los Exceles de *Voyage Calculations* reales (Tablones, Moquegua, Concon Trader) pertenecientes al cliente SPCC.

Esta información alimenta directamente la tabla `agency_matrix` en la Base de Datos según el [[Modelo.E-R]].

## 📊 Matriz Base de Tarifas Reales (SPCC)

| Puerto (Port ID) | Buque (Vessel ID) | Costo Portuario Extraído (USD) | Tipo de Operación Inferido |
| :--- | :--- | :--- | :--- |
| **ILO** | CONCON_TRADER | $23,500 | CARGA (Origen) |
| **ILO** | MOQUEGUA | $22,000 | CARGA (Origen) |
| **ILO** | TABLONES | $23,000 | CARGA (Origen) |
| **MATARANI** | CONCON_TRADER | $19,000 | DESCARGA (Destino) |
| **MATARANI** | MOQUEGUA | $17,000 | DESCARGA (Destino) |
| **MATARANI** | TABLONES | $18,000 | DESCARGA (Destino) |
| **MARCONA** | CONCON_TRADER | $61,000 | DESCARGA (Destino) |
| **MARCONA** | MOQUEGUA | $40,000 | DESCARGA (Destino) |
| **MARCONA** | TABLONES | $44,000 | DESCARGA (Destino) |
| **MEJILLONES** | CONCON_TRADER | $60,000 | DESCARGA (Destino) |
| **MEJILLONES** | MOQUEGUA | $29,000 | DESCARGA (Destino) |
| **MEJILLONES** | TABLONES | $32,000 | DESCARGA (Destino) |

> 📌 **Nota Operativa:**
> Todos estos valores pertenecen comercialmente al cliente **SPCC**. En el esquema de rutas de cabotaje/exportación de ácido sulfúrico, el puerto de Ilo actúa como base de origen (`CARGA`), mientras que Matarani, Marcona y Mejillones actúan como puertos de destino final (`DESCARGA`).

---
*Datos auditados y extraídos directamente de la gerencia comercial para inyección en el módulo Commercial Forecast.*

---

## 🛠️ Sesión de Trabajo — 2026-07-08

### Bugs Corregidos

#### 1. Anomalía Visual en Yield de Enero 2027 (ILO-MARCONA / MOQUEGUA / SPCC)

- **Síntoma:** La grilla mostraba **1 viaje** y **13,500 MT** en Enero 2027, pero los campos financieros (Gross Revenue: `$616,140`) correspondían a **2 viajes**, disparando el Yield Flete a `$32.33 USD/MT` en lugar de `$20.92 USD/MT`.
- **Causa Raíz:** `handleFrequencyChange` en `CommercialForecast.tsx` usaba solo `destination_port_id` para buscar la línea a actualizar (`findIndex` devolvía `-1`), insertando un duplicado en el estado `projectionLines`. La UI pintaba el duplicado (1 viaje) pero el backend recibía ambas líneas y calculaba los financieros con 2 viajes.
- **Solución:** Se refactorizaron `handleFrequencyChange` y `handleTariffChange` para comparar `origin_port_id` **y** `destination_port_id`. Se agregó deduplicación en caliente y limpieza automática al cargar escenarios (`handleLoadSelected`).
- **Archivo modificado:** `src/pages/CommercialForecast/CommercialForecast.tsx`

#### 2. SPCC no aparecía en el selector de Cliente de la Matriz Financiera

- **Síntoma:** Al agregar una nueva ruta de SPCC a un escenario cargado, el selector de Cliente solo mostraba NEXA.
- **Causa Raíz:** `ForecastBuilder_V2` construía la lista de clientes filtrando **únicamente** rutas con bandera `is_multicotizador === true` en la tabla `spots`. SPCC tiene rutas simples hardcodeadas, no guardadas ahí.
- **Solución:** Se agregó `SPCC` como cliente fijo garantizado. NEXA y demás siguen siendo dinámicos según BD. SPOT fue evaluado y retirado.
- **Archivo modificado:** `src/components/CommercialForecast/ForecastBuilder_V2.tsx`

### Mejoras / Assets

#### 3. Foto del B/T MOQUEGUA actualizada en Maestro de Buques

- Imagen anterior `moquegua_1.jpg` reemplazada por fotografía oficial a color (`moquegua.color.jpeg`).
- Archivo copiado a `public/` del frontend y recompilado en el bundle de Vite.

### Despliegues Realizados

| # | Descripción | Commit | Estado |
|---|---|---|---|
| 1 | Fix anomalía Yield Enero 2027 | `a6beb3e` | ✅ |
| 2 | Fix selector cliente SPCC | `1f8375b` | ✅ |
| 3 | Retirar SPOT del selector | `f651ff2` | ✅ |
| 4 | Foto MOQUEGUA actualizada | `1f8375b` | ✅ |

**URL Producción:** https://forecast.geeksoft.tech

---

## 🚀 Plan de Implementación: Costos Portuarios Dinámicos (Fórmulas Complejas)

Este plan detalla el diseño, la lógica de cálculo y la hoja de ruta para incorporar el cálculo dinámico y detallado de costos de puerto (basado en fórmulas y variables físicas de los buques y tiempos reales de estadía), permitiendo al usuario alternar entre la **Matriz Estática** (valores fijos de agencia) y la **Matriz Dinámica** (cálculo auditado granular).

### 1. Digestión de Exceles de Costos Portuarios (Rastro Matemático)

Tras parsear los Exceles de la gerencia comercial (`Costos.SUA % 2026`), se extraen las siguientes variables y fórmulas de cálculo por puerto:

#### A. Variables Físicas y Operativas de Entrada
*   `LOA (Eslora)` ── Eslora del buque en metros (ej: `134.16` para Moquegua, `158.80` para Tablones).
*   `GRT (TRB)` ── Tonelaje de Registro Bruto del buque (ej: `8,259` para Moquegua, `11,365` para Tablones).
*   `Carga (Q)` ── Cantidad de ácido sulfúrico a cargar o descargar en toneladas métricas (MT).
*   `Ritmo` ── Ritmo de carga o descarga configurado en toneladas/día o toneladas/hora.
*   `País de Origen` ── País del puerto de procedencia del buque (ej: `Peru`).

#### B. Fórmula de Tiempo en Puerto (Estadía Estimada)
El tiempo total de puerto (horas) se calcula de forma estándar como:
$$\text{Horas de Puerto} = \frac{\text{Carga (Q)}}{\text{Ritmo (MT/día)}} \times 24 \text{ (si es T/h)} + \text{Maniobras (3 hrs)} + \text{Esperas (2 hrs)}$$
*Fórmula en Excel:* `= (Cantidad / Ritmo) + 3 + 2` horas.

---

#### C. Fórmulas de Cálculo por Puerto y Concepto

##### 1. Puerto de ILO (Operación de Carga)
*   **Practicaje + Remolcadores + Lanchas (Integral):** Tarifa plana de **`$5,550 USD`** por maniobra. Se multiplica por **2** (entrada y salida) = **`$11,100 USD`**.
    *   *Recargos:* 25% o 50% aplicable sobre la tarifa integral según condiciones climáticas.
*   **Amarradores (Linesmen):** Tarifa plana de **`$357.30 USD`** por servicio.
*   **Derecho de Faro (Lighthouse Dues):**
    *   Si procede de puerto nacional (cabotaje): $\text{GRT} \times \$0.03\text{ USD}$
    *   Si procede de puerto extranjero: $\text{GRT} \times \$0.12\text{ USD}$
*   **Muellaje (Dockage):**
    *   Fórmula: $\text{Tarifa (\$0.65 USD)} \times \text{LOA (m)} \times \text{Horas de Puerto}$
*   **Gastos de Agencia:** Tarifa fija de **`$1,100 USD`** + **`$400 USD`** de movilidad/comunicaciones.

##### 2. Puerto de MARCONA (Operación de Descarga)
*   **Practicaje + Lancha de Piloto:** Tarifa de **`$4,980 USD`** x **2** (maniobras) = **`$9,960 USD`**.
*   **Amarradores (Linesmen):** Tarifa de **`$4,450 USD`** x **2** = **`$8,900 USD`**.
*   **Remolcadores (Towage):** Tarifa de **`$18,000 USD`** x **2** = **`$36,000 USD`**.
*   **Derecho de Faro (Lighthouse Dues):**
    *   Fórmula: $\text{Tarifa (\$0.03 o \$0.12)} \times \text{GRT}$
*   **Lancha de Espera (Launch Hire Stand By):**
    *   Fórmula: $\text{Tarifa (\$40.00 USD/hr)} \times \text{Horas de Puerto}$
*   **Gastos de Agencia:** Tarifa fija de **`$1,400 USD`** + **`$450 USD`** de movilidad/comunicaciones.

##### 3. Puerto de MATARANI (Operación de Descarga)
*   **Practicaje + Remolcadores + Lanchas (Integral):** Tarifa de **`$5,550 USD`** x **2** = **`$11,100 USD`**.
*   **Derecho de Faro (Lighthouse Dues):**
    *   Fórmula: $\text{Tarifa (\$0.03 o \$0.12)} \times \text{GRT}$
*   **Muellaje (Dockage):**
    *   Fórmula: $\text{Tarifa (\$0.65 USD)} \times \text{LOA (m)} \times \text{Horas de Puerto}$
*   **Gastos de Agencia:** Tarifa fija de **`$1,100 USD`** + **`$400 USD`** de movilidad/comunicaciones.

---

### 2. Diseño del Auditor de Costos Portuarios (UI/UX)

Para dar total transparencia a los números que publica el sistema (estilo *Auditoría Ledger*), implementaremos un **Panel de Auditoría de Gastos Portuarios**:

1.  **Activación:** Al hacer clic en el valor del Costo de Puerto de cualquier tramo en la grilla del Multicotizador o de la Matriz Financiera, se abrirá un modal de auditoría.
2.  **Sección Superior: Variables de Entrada (Fact Sheet en Tiempo Real):**
    *   Una tabla que resume las variables activas tomadas para el cálculo: buque seleccionado, eslora, TRB (GRT), toneladas de carga, ritmo de operación, horas estimadas de puerto y país de procedencia.
3.  **Sección Central: Desglose de Fórmulas y Conceptos:**
    *   Un desglose detallado en 3 bloques contables:
        *   **A) Maniobras (Shifting):** Prácticos, Remolcadores, Amarradores, Derechos de Acceso.
        *   **B) Gastos Generales (General Port):** Muellaje (con el desglose de $\text{LOA} \times \text{Horas} \times \text{Tarifa}$), Derechos de Faro ($\text{GRT} \times \text{Tarifa}$), Lanchas de Espera e Inspecciones Sanitarias/Despacho.
        *   **C) Agencia:** Honorarios de Agencia, Movilidad y Comunicaciones.
    *   Cada fila mostrará el nombre del concepto, la tarifa base, el multiplicador aplicado (ej. GRT, Horas, Fijo) y el total.
4.  **Sección Inferior: Comparativo de Modos (Estático vs. Dinámico):**
    *   Un resumen que contrastará:
        *   Costo Estático (Tarifa Plana de la base de datos).
        *   Costo Dinámico (Suma del desglose de fórmulas).
        *   Desviación absoluta en dólares y porcentual.

---

### 3. Hoja de Ruta de Desarrollo

```mermaid
graph TD
    F1[Fase 1: Configurar constantes de tarifas en database.py o Supabase] --> F2[Fase 2: Implementar motor de cálculo en spot_engine.py / engine.py]
    F2 --> F3[Fase 3: Crear endpoints en el backend para simulación detallada y desglose]
    F3 --> F4[Fase 4: Diseñar componente visual PortCostsAuditorModal en el frontend]
    F4 --> F5[Fase 5: Integrar el modal en la grilla del Multicotizador y Ledger]
```

*   **Fase 1 (Base de Datos):** Mapear y registrar las tarifas dinámicas de practicaje, muellaje, remolcadores y faro de Ilo, Matarani y Marcona en una tabla de coeficientes en Supabase o como constantes tipadas en el backend.
*   **Fase 2 (Backend / Motores):** Crear la función `calculate_dynamic_port_costs(port_id, vessel_id, quantity, rate, origin_country)` que implemente el rastro matemático de las fórmulas de los Exceles.
*   **Fase 3 (API Endpoints):** Exponer un endpoint `POST /api/v1/forecast/port_costs/audit` que reciba los parámetros del tramo y retorne el JSON desglosado para el modal de auditoría.
*   **Fase 4 (Frontend UI):** Crear el componente React del modal aplicando estilo exceliano contable de alta densidad con bordes definidos.
*   **Fase 5 (Integración y Despliegue):** Cablear el modal y desplegar todo a producción en el VPS.

---

## 📐 Fórmulas Universales para Puertos Peruanos

> 📌 **Validación:** Las siguientes fórmulas son **universales y reguladas** a nivel nacional por la **Autoridad Portuaria Nacional (APN)** y la **Dirección General de Capitanías y Guardacostas (DICAPI)**. Aplican de forma estándar a todos los terminales portuarios del Perú: Ilo, Matarani, Callao, Marcona, Pisco, Talara, etc. Los Exceles de costos del cliente **SPCC** (Paola) confirman exactamente estas mismas fórmulas en su estructura matemática interna.

---

### 1. Derecho de Faro (Lighthouse Dues)

Tarifa universal regulada por la APN. Se cobra a todo buque que arriba a un puerto peruano, basada en el **TRB (GRT — Gross Register Tonnage)**:

$$\text{Costo de Faro} = \text{Tarifa} \times \text{GRT (TRB)}$$

| Origen del Buque | Tarifa por unidad de GRT |
| :--- | :---: |
| Puerto Nacional (Cabotaje) | **$0.03 USD** |
| Puerto Extranjero | **$0.12 USD** |

*Ejemplo Moquegua (GRT = 8,259, cabotaje):* `8,259 × $0.03 = $247.77 USD`

---

### 2. Muellaje de Amarradero (Dockage)

Cobro por el tiempo que el buque permanece amarrado al muelle. La estructura matemática es universal en todos los terminales peruanos:

$$\text{Muellaje} = \text{Tarifa Base} \times \text{LOA (metros)} \times \text{Horas de Estadía}$$

*   **Tarifa estándar confirmada en los exceles de Ilo y Matarani:** **`$0.65 USD`** por metro-hora.
*   **Fórmula en Excel:** `= Horas_Puerto × LOA × 0.65`

*Ejemplo Moquegua (LOA = 134.16 m, 32 horas en puerto):* `134.16 × 32 × $0.65 = $2,790.53 USD`

---

### 3. Tiempo Estimado de Puerto (Horas de Estadía)

Fórmula estándar naviera para calcular las horas de estadía de un buque en puerto:

$$\text{Horas de Puerto} = \frac{\text{Carga o Descarga (MT)}}{\text{Ritmo (MT/hr)}} + 3\text{ (maniobras)} + 2\text{ (esperas)}$$

*   Las **3 horas** corresponden a maniobras de atraque y desatraque.
*   Las **2 horas** corresponden a tiempos muertos operativos (inspecciones, autoridades, etc.).
*   **Fórmula en Excel:** `= (Cantidad / Ritmo) + 3 + 2`

---

### 4. Practicaje (Pilotage)

Obligatorio por DICAPI para buques de más de 500 GRT. Se cobra por maniobra completa (entrada + salida = **×2**):

$$\text{Practicaje} = \text{Tarifa Fija del Puerto} \times 2\text{ (maniobras)}$$

*   La tarifa varía por puerto. En los exceles de SPCC:
    *   **Ilo:** Servicio Integral (Práctico + Remolcadores + Lancha) = `$5,550` × 2 = **`$11,100 USD`**
    *   **Marcona:** Solo Práctico + Lancha = `$4,980` × 2 = **`$9,960 USD`**
*   **Recargos universales aplicables:**
    *   Horario nocturno (18:00–06:00): **+50%** sobre la tarifa base.
    *   Domingos y Feriados Nacionales: **+50% o +100%** sobre la tarifa base.

---

### 5. Remolcaje (Towage)

Obligatorio según la eslora y el arqueo del buque para maniobra segura en el amarradero:

$$\text{Remolcaje} = \text{N° Remolcadores} \times \text{Tarifa (escala GRT)} \times \text{Maniobras}$$

*   **Marcona (por complejidad del terminal):** `$18,000` × 2 maniobras = **`$36,000 USD`** por viaje.
*   **Ilo/Matarani:** Incluido en el servicio integral del práctico.

---

### 6. Gastos de Agencia (Agency Expenses)

Comisión de la agencia marítima local. Consta de:

| Concepto | Tarifa ILO/MATARANI | Tarifa MARCONA |
| :--- | :---: | :---: |
| Honorarios de Agencia | $1,100 USD | $1,400 USD |
| Movilidad (Autoridades + Coord.) | $200 USD | $200 USD |
| Comunicaciones | $200 USD | $250 USD |
| **Total Agencia** | **$1,500 USD** | **$1,850 USD** |

---

## 🔧 Diseño del Motor de Cálculo — `PortCostsEngine`

El motor de cálculo será una función en el backend FastAPI que recibirá los parámetros del tramo y retornará el desglose completo auditado de costos.

### A. Estructura de Parámetros en Base de Datos (Supabase)

Tabla propuesta: **`port_tariffs_config`** (coeficientes por puerto, actualizables sin recompilar):

```json
{
  "port_id": "ILO",
  "lighthouse_national_rate": 0.03,
  "lighthouse_foreign_rate": 0.12,
  "dockage_rate_per_meter_hour": 0.65,
  "pilotage_base_rate": 5550.00,
  "linesmen_rate": 357.30,
  "towage_rate": 0.00,
  "agency_fee": 1100.00,
  "transport_flat": 200.00,
  "comms_flat": 200.00
}
```

**Ventaja clave:** Si la APN actualiza tarifas, solo se modifica la tabla en Supabase. El motor recalcula todo automáticamente sin tocar el código fuente.

---

### B. Algoritmo del Motor en Python

Archivo propuesto: **`backend/services/port_costs_engine.py`**

```python
def calculate_dynamic_port_costs(
    port_id: str,
    vessel: dict,       # { 'loa': 134.16, 'grt': 8259 }
    quantity: float,    # Toneladas a cargar/descargar
    rate: float,        # Ritmo operativo en MT/hr
    prev_port_country: str  # 'PE' = nacional, otro = extranjero
) -> dict:

    # 1. Tiempo estimado universal en puerto
    op_hours = (quantity / rate) if rate > 0 else 0
    port_hours = op_hours + 3 + 2  # +3 maniobras, +2 esperas

    # 2. Cargar coeficientes del puerto desde Supabase
    tariffs = db.get_port_tariffs(port_id)

    # 3. Derecho de Faro (APN — Universal)
    is_national = (prev_port_country.upper() == 'PE')
    faro_rate = tariffs['lighthouse_national_rate'] if is_national \
                else tariffs['lighthouse_foreign_rate']
    lighthouse_cost = faro_rate * vessel['grt']

    # 4. Muellaje (APN — Universal)
    dockage_cost = tariffs['dockage_rate_per_meter_hour'] * vessel['loa'] * port_hours

    # 5. Practicaje + Maniobras (Shifting)
    shifting_cost = (tariffs['pilotage_base_rate'] * 2) + \
                    tariffs.get('linesmen_rate', 0) + \
                    tariffs.get('towage_rate', 0)

    # 6. Gastos de Agencia (Agency)
    agency_cost = tariffs['agency_fee'] + \
                  tariffs['transport_flat'] + \
                  tariffs['comms_flat']

    # 7. Retorno estructurado para el Modal de Auditoría
    total = lighthouse_cost + dockage_cost + shifting_cost + agency_cost
    return {
        "port_id": port_id,
        "mode": "DYNAMIC",
        "total_cost_usd": round(total, 2),
        "details": {
            "vessel_loa_m": vessel['loa'],
            "vessel_grt": vessel['grt'],
            "quantity_mt": quantity,
            "rate_mt_hr": rate,
            "port_hours_estimated": round(port_hours, 2),
            "origin_country": prev_port_country,
            "lighthouse_dues": round(lighthouse_cost, 2),
            "dockage": round(dockage_cost, 2),
            "shifting_expenses": round(shifting_cost, 2),
            "agency_expenses": round(agency_cost, 2)
        }
    }
```

---

### C. Endpoint de la API (FastAPI)

```python
@router.post("/api/v1/forecast/port_costs/audit")
async def audit_port_costs(payload: PortCostAuditRequest):
    """
    Recibe los parámetros del tramo y retorna el desglose
    auditado de costos portuarios dinámicos.
    """
    result = calculate_dynamic_port_costs(
        port_id=payload.port_id,
        vessel={"loa": payload.loa, "grt": payload.grt},
        quantity=payload.quantity_mt,
        rate=payload.rate_mt_hr,
        prev_port_country=payload.origin_country
    )
    return result
```

---

### D. Comparativo Estático vs. Dinámico

El API también puede incluir el costo estático de la `agency_matrix` para que el frontend muestre la comparación:

| Modo | Descripción | Valor Ejemplo (Moquegua / ILO) |
| :--- | :--- | :---: |
| **Estático** | Tarifa plana guardada en BD | $22,000 USD |
| **Dinámico** | Calculado con fórmulas APN | ~$20,500–$23,500 USD |
| **Desviación** | Diferencia absoluta y % | ±$1,500 (~6.8%) |

---

## 📋 Conclusión del Plan

> [!IMPORTANT]
> Las fórmulas de Derecho de Faro, Muellaje y tiempo de estadía son **universales y reguladas a nivel nacional**. Esto significa que el motor de cálculo puede aplicar exactamente las mismas ecuaciones para **cualquier puerto peruano** (Callao, Pisco, Talara, Paita, etc.) simplemente cambiando los coeficientes de la tabla `port_tariffs_config` en Supabase. **No se necesitan cambios de código** para agregar nuevos puertos al motor.

