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
