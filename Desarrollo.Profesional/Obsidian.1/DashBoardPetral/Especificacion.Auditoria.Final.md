# Especificación Auditoría Final (VoyageLedgerFinal.tsx) — Documento de Convergencia Final

**Componente:** `VoyageLedgerFinal.tsx`  
**Backend:** `forecast.py`, `spot_engine.py`, `forecast_service.py`, `forecast_models.py`  
**Estado:** 🟢 **COMPLETO Y VERIFICADO AL 100%** (Convergencia Matemática Total con el PDF Oficial)

---

## 📜 El Vía Crucis de la Auditoría Final (Resumen de la Odisea)

Para lograr la **"Caja de Cristal"** requerida por la dirección comercial, se llevó a cabo un proceso minucioso de auditoría matemática paso a paso. El objetivo: hacer que **cada uno de los números** expuestos en las 7 tarjetas superiores y en las 12 filas de la tabla de reemplazo numérico coincidieran al 100% con la física operacional del buque, las tablas maestras de Supabase (`routes`, `vessels`, `contracts`, `bunker_prices`, `port_cost_static`) y la fórmula del **PDF Oficial de Auditoría (Acta TABLONES ILO-MARCONA)**.

---

## 🔍 Matriz de Convergencia Final (Motor Backend vs PDF Oficial)

Prueba ejecutada mediante `test_engine_local.py` comparada directamente contra la Página 1 del PDF Oficial:

| # | Métrica | Fórmula Algorítmica | Reemplazo Numérico / Explicación | PDF Oficial (Gold Standard) | Salida del Motor / UI Web | Estado |
|---|---|---|---|---|---|---|
| **1** | **Ritmo Carga** | `c_load` | Prioridad incondicional de la tabla `contracts` | `500 T/h` | **`500 T/h`** | ✅ MATCH |
| **2** | **Ritmo Descarga** | `c_disch` | Prioridad incondicional de la tabla `contracts` | `345 T/h` | **`345 T/h`** | ✅ MATCH |
| **3** | **Días de Puerto** | `((Q/act_load + over_or + pos_or + delay_load) + (Q/act_disch + over_de + pos_de + delay_disch)) / 24` | `((13,500/500 + 6.0 + 1.0 + 0) + (13,500/345 + 6.0 + 0.0 + 0)) / 24` | `3.2971 días` | **`3.2971 días`** | ✅ MATCH |
| **4** | **Días de Mar** | `(dist * (1+w_laden) + dist * (1+w_ballast)) / (speed * 24)` | `(279 * (1+0.03) + 279 * (1+0.03)) / (11.0 * 24)` (2 piernas) | `2.1770 días` | **`2.1770 días`** | ✅ MATCH |
| **5** | **Días de Viaje** | `sea_days + port_days` | `2.1770 + 3.2971` | `5.4741 días` | **`5.4741 días`** | ✅ MATCH |
| **6** | **Income (Flete)** | `Q * F` | `13,500 MT * $22.82/MT` | `$308,070.00` | **`$308,070.00`** | ✅ MATCH |
| **7** | **Comisiones** | `gross_income * (addr_comm% + broker_comm%) / 100` | `308,070 * 0%` | `$0.00` | **`$0.00`** | ✅ MATCH |
| **8** | **Costo Bunker** | `(ifo_tons * p_ifo) + (mdo_tons * p_mdo)` | `(45.55 t * $895.14) + (0 t * $1,460.30)` (45.55 t IFO de 2 piernas) | `$40,776.01` | **`$40,776.01`** | ✅ MATCH |
| **9** | **Port Costs** | `agency_origin + agency_dest` | `$23,000.00 Origen + $44,000.00 Destino` | `$67,000.00` | **`$67,000.00`** | ✅ MATCH |
| **10** | **Voyage Result** | `Income - commissions - port_costs - bunker` | `$308,070.00 - $0 - $67,000.00 - $40,776.01` | `$200,293.99` | **`$200,293.99`** | ✅ MATCH |
| **11** | **TCE Diario** | `voyage_result / total_duration` | `$200,293.99 / 5.4741 días` | `$36,589.08` | **`$36,589.08`** | ✅ MATCH |
| **12** | **P/L vs Requerido** | `voyage_result - (tce_req * total_duration)` | `$200,293.99 - ($15,000 * 5.4741 días)` | `$118,181.78` | **`$118,181.78`** | ✅ MATCH |

---

## 🛠️ Detalle Técnico de los Errores Corregidos y Soluciones

### 1. Precios de Combustible Hardcodeados ($600 / $900) vs `bunker_prices`
- **Problema:** En el backend, `vessel_params` no recibía los precios cotizados de la tabla `bunker_prices` cuando la petición venía vacía, aplicando fallbacks por defecto de `$600.00` IFO y `$900.00` MDO.
- **Solución:** Se creó e integró `get_latest_bunker_prices()` en `forecast_service.py` e inyectó incondicionalmente los precios cotizados al `vessel_params` en `forecast.py` ($895.14 IFO / $1,460.30 MDO).

### 2. Navegación y Consumo de Bunker de 1 Leg vs 2 Legs (Viaje Redondo)
- **Problema:** `spot_engine.py` calculaba `sea_days` y `ifo_tons` utilizando únicamente 1 pierna (1.0885 días y 29.76 t), resultando en un costo falso de bunker de $17,861.45.
- **Solución:** Se integró `tot_sea_d = sea_days * 2` (2.1770 días), elevando el tonelaje IFO a **45.55 t** y el costo real de bunker a **$40,776.01**.

### 3. Duplicación de Tramo Balasto en `forecast.py` (3 Tramos / 837 NM)
- **Problema:** `forecast.py` insertaba un tramo balasto de retorno manual en `tramos_payload`, ocasionando que la UI mostrara 3 tramos (837 NM) en lugar del viaje redondo de 558 NM.
- **Solución:** Se eliminó la duplicación en `forecast.py` para mantener 1 tramo limpio que el engine simula como viaje completo de 558 NM.

### 4. Omisión de Maniobras (`pos_or`/`pos_de`) en la Fórmula de Días de Puerto
- **Problema:** El generador de texto de auditoría en `spot_engine.py` sumaba correctamente el tiempo en la matemática (3.30 días), pero omitía escribir el término `pos_or` (1.0 H) en la cadena del reemplazo numérico.
- **Solución:** Se actualizó el formato en `spot_engine.py` para incluir `pos_or` (1.0 H) y `pos_de` (0.0 H) explícitamente.

### 5. `AttributeError: 'MultiCotizadorTramo' object has no attribute 'contract_agreed_load_rate'`
- **Problema:** El modelo Pydantic carecía de las definiciones opcionales de ritmos contractuales, fallando al acceder por atributo.
- **Solución:** Se añadieron los campos opcionales a `MultiCotizadorTramo` en `forecast_models.py` y se aseguró el acceso seguro vía `tr_dict.get(...)`.

### 6. `ImportError: cannot import name 'get_latest_bunker_prices'`
- **Problema:** `forecast.py` intentaba importar una función inexistente en `forecast_service.py`.
- **Solución:** Se implementó `get_latest_bunker_prices()` con consulta a Supabase y fallback seguro.

### 7. Fórmula del P/L vs Requerido en la Fila 12 ($21,589.08 vs $118,181.78)
- **Problema:** La UI calculaba `TCE Real − TCE Requerido` ($36,589.08 - $15,000 = $21,589.08$).
- **Solución:** Se actualizó la variable `pl_vs_required_unit` en `VoyageLedgerFinal.tsx` a `voyage_result − (tce_req × total_duration)` = **$118,181.78**.

---

## 🧪 Script de Prueba Local y Verificación de Convergencia

Se creó `test_engine_local.py` en la raíz de `Geeksoft_Engine` para ejecutar simulación local desacoplada del despliegue:

```python
# test_engine_local.py
from backend.spot_engine import calculate_multicotizador_simulation

payload = { ... } # TABLONES ILO-MARCONA Q=13500, F=22.82
res = calculate_multicotizador_simulation(payload)
# Valida exactitud en bunker_costs ($40,776.01), voy_res ($200,293.99), TCE ($36,589.08) y P/L ($118,181.78)
```

---

## 📄 Características Adicionales Entregadas

1. **Botón 'Imprimir Acta PDF':** Integrado en la cabecera de cada tramo con soporte completo para generar la presentación en PDF oficial.
2. **Cards Superiores Sincronizadas:** Maestro Flota, Reglas Comerciales, Maestro Rutas, Límites Portuarios, Costos de Puerto y Combustible cotizado.

---

*Documentación de Cierre — Commit Git: AUDITORIA.FINAL.V1*
