# 📘 Bitácora de Desarrollo - Paso 8 (Bug Crítico: Flete $0 en Reglas Comerciales)

## 📌 Contexto

Durante la revisión del Voyage Ledger en `localhost:5173`, se detectó que el card **Reglas Comerciales** mostraba **Flete Base (F) = $0.00/MT** en los 9 escenarios. Esto causaba que el Ingreso Bruto (`Q × F`) calculara $0, invalidando el Resultado de Viaje y el TCE.

---

## 🔍 Diagnóstico — Causa Raíz (2 bugs encadenados)

### Bug #1 — Schema desincronizado en `contract_tariffs`

La migración `20260624000008_create_contracts_table.sql` ejecutó:

```sql
ALTER TABLE contract_tariffs DROP COLUMN client_id;
ALTER TABLE contract_tariffs DROP COLUMN destination_port_id;
```

La tabla pasó a vincularse por `contract_id` (FK hacia `contracts`). Sin embargo, `forecast_service.py` seguía filtrando con:

```python
# ❌ ROTO — esas columnas ya no existen en BD
matching_tariffs = [
    t for t in tariffs_data
    if t.get("client_id") == client and t.get("destination_port_id") == line.destination_port_id
]
```

Resultado: `matching_tariffs = []` siempre → `freight_rate = 0` siempre.

### Bug #2 — ID de puerto inconsistente: `MARCONA` ≠ `SAN_JUAN_DE_MARCONA`

El `ForecastBuilder` enviaba `destination_port_id = "MARCONA"`, pero todas las tablas de BD usan `"SAN_JUAN_DE_MARCONA"` (routes, contracts, contract_tariffs, agency_matrix).

Esto causaba que la ruta MARCONA no encontrara:
- Tarifa de flete → $0
- Contrato → `None`
- Ruta (`r_data`) → `{}` → distancia = 0 NM → días de mar = 0

---

## 🛠️ Solución Implementada en `forecast_service.py`

### 1. Tabla de alias de puertos

```python
PORT_ALIASES = {
    "MARCONA": "SAN_JUAN_DE_MARCONA",
}
```

Aplicado **antes de cualquier consulta** a BD. Cobertura total: rutas, contratos, tarifas, puertos, costos de agencia.

### 2. Lookup de tarifas via `contract_id` (nuevo schema)

```python
# ✅ CORRECTO — join por contract_id
if contract:
    contract_id = contract.get("contract_id")
    matching_tariffs = [
        t for t in tariffs_data
        if str(t.get("contract_id")) == str(contract_id)
    ]
```

Fallback legacy incluido para compatibilidad si alguna tabla aún tiene `client_id`/`destination_port_id`.

### 3. Resolución de alias en rutas y puertos

```python
resolved_dest = PORT_ALIASES.get(line.destination_port_id, line.destination_port_id)
route_key = f"{line.origin_port_id}-{resolved_dest}"
r_data = routes_db.get(route_key, {})
```

---

## 🗂️ Archivos Modificados

| Archivo | Cambio |
|---|---|
| `backend/services/forecast_service.py` | `PORT_ALIASES` dict · lookup por `contract_id` · `resolved_dest` en routes/ports/agency |

---

## ✅ Verificación

```bash
python -c "from backend.services.forecast_service import run_forecast_simulation; print('OK')"
# OK - import exitoso
```

Compilación TypeScript frontend sin errores (`npx tsc --noEmit`).

---

## 🎯 Resultado Esperado

| Escenario | Flete antes | Flete después |
|---|---|---|
| TABLONES → MATARANI (13,500 MT) | $0.00 | $19.01/MT |
| TABLONES → MARCONA (13,500 MT) | $0.00 | $22.82/MT |
| TABLONES → MEJILLONES (13,500 MT) | $0.00 | $20.87/MT |
| MOQUEGUA → MATARANI (13,500 MT) | $0.00 | $19.01/MT |
| MOQUEGUA → MARCONA (13,500 MT) | $0.00 | $22.82/MT |
| MOQUEGUA → MEJILLONES (13,500 MT) | $0.00 | $20.87/MT |
| CONCON_TRADER → MATARANI (19,000 MT) | $0.00 | $18.92/MT |
| CONCON_TRADER → MARCONA (19,000 MT) | $0.00 | $21.77/MT |
| CONCON_TRADER → MEJILLONES (19,000 MT) | $0.00 | $19.92/MT |

> Los valores corresponden al bracket de tonelaje de cada escenario según `contract_tariffs`.

---

## 📌 Lección Aprendida

> **Cuando se hace una migración que elimina columnas (DROP COLUMN), se DEBE actualizar de inmediato todos los servicios que las referencian.** En este caso la migración `20260624000008` se ejecutó pero `forecast_service.py` no fue actualizado en consecuencia.

Se recomienda documentar en la migración SQL los servicios que deben actualizarse:
```sql
-- IMPORTANTE: Actualizar forecast_service.py para usar contract_id en lugar de
-- client_id + destination_port_id al filtrar contract_tariffs.
```
