# 🧮 AS-BUILT: Herramienta 01 — Multicotizador Spot

> **Ruta UI**: `/multicotizador`
> **Componente React**: `MultiCotizador_V2.tsx` / `MultiCotizadorExcel.tsx`
> **Módulo Auth**: `multicotizador_spot`

---

## 🧭 Navegación
| [← Precios Búnker](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Matriz Financiera →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/02_Herramientas_y_Motores/AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard.md) |

---

## 🎯 1. Propósito y Simulación de Circuitos Multileg

El **Multicotizador Spot (`/multicotizador`)** es la herramienta de simulación rápida de viajes comerciales. Permite evaluar viajes con múltiples tramos de carga y descarga (circuitos multileg), proyectando toneladas, días totales y el P&L completo antes de confirmar el negocio.

---

## 📥 Inyección de Dependencias Maestras
- [[AS_BUILT_Maestro_01_Buques_VesselsMaster]] — Selección de barco y consumos.
- [[AS_BUILT_Maestro_02_Rutas_RuteadorSpot_RouteMaster]] — Tramos y distancias náuticas.
- [[AS_BUILT_Maestro_04_Contratos_ContractsMaster]] — Comisiones e indexación.
- [[AS_BUILT_Maestro_06_Costos_Portuarios_PortCostsMaster]] — Estimación de costos de puerto.
- [[AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster]] — Precios de combustible.

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Envío de simulaciones a la grilla comercial.

---

## ⚙️ 2. Arquitectura de Cálculo Multileg

### 2.1 Flujo General

```
UI (MultiCotizadorExcel.tsx)
  └─► puertosConfig[]  ← tabla de puertos con campo OP.DEST (CARGAR / DESCARGAR / NONE)
        └─► apiPayload (tramos[])
              └─► POST /multicotizador/calculate  (forecast.py)
                    └─► calculate_multicotizador_simulation()  (spot_engine.py)
                          └─► Respuesta: consolidated.total_port_costs, total_freight_revenue, pnl_net_utility
```

### 2.2 Tipos de Tramo (`type`)

| Tipo | Descripción |
|------|-------------|
| `LADEN` | Tramo con carga a bordo — genera `net_income = Q × F` |
| `BALLAST` | Tramo sin carga — posicionamiento o reposicionamiento |

### 2.3 Campo OP.DEST (`origin_action` / `destination_action`)

Cada puerto en la tabla de la UI tiene el campo **OP.DEST** que define la operación:

| Valor | Significado | Rol |
|-------|-------------|-----|
| `CARGAR` | Se carga en ese puerto | POL (Puerto de Origen de Carga) |
| `DESCARGAR` | Se descarga en ese puerto | POD (Puerto de Destino de Descarga) |
| `NONE` | Solo tránsito / fondeo sin operación | Sin costo portuario |

> **REGLA CRÍTICA:** El costo de puerto **NO se infiere del tipo de tramo** (`LADEN`/`BALLAST`). Se infiere **exclusivamente del campo `OP.DEST`** del puerto. Un tramo `BALLAST` puede tener costos de puerto si el barco va a cargar en el destino (ej. posicionamiento a CALLAO para cargar).

---

## 🐛 3. Fix IZ.FEED.11.08 — Port Costs Dinámicos en Rutas Multileg Complejas

**Fecha:** 2026-08-12
**Commit Backend:** `4d49c60` — `IZ.FEED.11.08: Fix BALLAST legs preserve agency_costs`
**Commit Frontend:** `2ea46e9` — `IZ.FEED.11.08: Frontend - getDynamicPortCostItems`
**Pre-commit de seguridad:** `f8aaca6` — `PRE.IZ.FEED.11.08`

---

### 3.1 Ruta de Prueba que Reveló el Bug

**Ruta:** `NEXA / BUQUE TABLONES`

| # | Origen | Destino | Tipo | OP.DEST Destino | Costo Puerto Destino |
|---|--------|---------|------|-----------------|----------------------|
| 1 | ILO | CALLAO | BALLAST | CARGAR | $17,000 USD |
| 2 | CALLAO | MATARANI | LADEN | DESCARGAR | $18,000 USD |
| 3 | MATARANI | ILO | BALLAST | NONE | $0 USD |

**Total Port Costs correcto:** `$17,000 + $18,000 = $35,000 USD`

---

### 3.2 Causa Raíz — Backend (`spot_engine.py`)

El bucle de procesamiento de tramos en `calculate_multicotizador_simulation()` **zereaba incondicionalmente** los costos de puerto en tramos `BALLAST`:

```python
# ❌ CÓDIGO ORIGINAL (INCORRECTO)
if tipo == "BALLAST":
    res["port_costs"] = 0.0
    res["agency_costs_origin"] = 0.0
    res["agency_costs_destination"] = 0.0  # ← Borraba $17,000 del tramo ILO→CALLAO
```

Esto causaba que el tramo 1 (`ILO → CALLAO [CARGAR]`, $17,000) nunca sumara al `total_port_costs`, resultando en:
- `total_port_costs = $18,000` (solo MATARANI) en lugar de `$35,000`
- **Voyage Result sobrestimado en $18,000 USD**

**Fix aplicado:**

```python
# ✅ CÓDIGO CORREGIDO
if tipo == "BALLAST":
    res["agency_costs_origin"] = c_orig      # preservar costo real
    res["agency_costs_destination"] = c_dest  # preservar costo real
    res["port_costs"] = c_orig + c_dest       # acumular correctamente
    res["pnl_tramo"] = -res["bunker_costs"] - res["port_costs"]
```

**Archivo:** `backend/spot_engine.py` → función `calculate_multicotizador_simulation()` → líneas ~563-572

---

### 3.3 Causa Raíz — Frontend (`MultiCotizadorExcel.tsx`)

La Card de Port Costs y la Card de Voyage Result (Financial) usaban **valores hardcodeados** de `tramos[0]`:

```typescript
// ❌ CÓDIGO ORIGINAL (INCORRECTO)
const costPOL = result.tramos[0].agency_costs_origin;     // siempre ILO = $0
const costPOD = result.tramos[0].agency_costs_destination; // siempre CALLAO = $17k
// MATARANI ($18k) nunca aparecía en el PnL
```

**Fix aplicado — helper `getDynamicPortCostItems()`:**

```typescript
// ✅ CÓDIGO CORREGIDO
// Recorre puertosConfig[] usando OP.DEST como llave:
// CARGAR  → rol "POL (PUERTO)" → suma agency_costs_destination del tramo siguiente
// DESCARGAR → rol "POD (PUERTO)" → suma agency_costs_destination del tramo correspondiente
// NONE    → se ignora (sin costo)
const portItems = getDynamicPortCostItems();
const totalPortCosts = result?.consolidated?.total_port_costs
    ?? portItems.reduce((sum, item) => sum + item.cost, 0);
```

**Archivo:** `src/components/CommercialForecast/MultiCotizadorExcel.tsx`
- Helper `getDynamicPortCostItems()` — definido en el scope del componente
- Card Port Costs — línea ~3009: `const portItems = getDynamicPortCostItems()`
- Card Voyage Result — línea ~3202: `const portItems = getDynamicPortCostItems()`

---

### 3.4 Resultado Verificado en Terminal

```
--- RESULTADOS SIMULACIÓN MULTILEG COMPLEJA (NEXA/TABLONES) ---
Revenue Total:        $405,000.00
Bunker Total:              $0.00
Port Costs Total:     $35,000.00  ✅ (era $18,000 — fix correcto)
Net Profit (P&L):    $370,000.00
Días Totales:              7.13 d
TCE Real:            $51,889.82 $/día

[PASS] ASSERTIONS APROBADAS: total_port_costs == $35,000 USD ✅
```

**Build Frontend:** `✓ 1052 modules transformed — built in 17.15s` — sin errores de compilación.

---

### 3.5 Despliegue a Producción

**URL Producción:** https://forecast.geeksoft.tech
**Servidor VPS:** `91.108.125.253` (Hostinger)
**Método:** `deploy_forecast_kickoff.py` (SFTP + SSH restart + Nginx reload + Certbot SSL)

```
[OK] dist/ subido ✅
[OK] Geeksoft_Engine subido ✅
[OK] Backend FastAPI reiniciado ✅
[OK] Nginx syntax OK ✅
[OK] SSL HTTPS activo ✅
PUBLICADA EN: https://forecast.geeksoft.tech
```

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_02_Matriz_Financiera_Dashboard]] — Envío de simulaciones a la grilla comercial.

---

## 🔗 Referencias Técnicas

- **Motor de cálculo:** `Geeksoft_Engine/backend/spot_engine.py` → `calculate_multicotizador_simulation()`
- **Router API:** `Geeksoft_Engine/backend/api/routers/forecast.py` → `POST /multicotizador/calculate`
- **Modelo Pydantic:** `Geeksoft_Engine/backend/models/forecast_models.py` → `MultiCotizadorRequest`
- **Componente React:** `Geeksoft_Frontend/src/components/CommercialForecast/MultiCotizadorExcel.tsx`
- **Documentación histórica:** [[multicotizador]] (Maestros y Módulos)
