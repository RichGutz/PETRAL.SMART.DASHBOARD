# 🚢 Maestro — Puertos (Límites Físicos de Terminales)

*Tabla creada en sesión 2026-06-26 para resolver la violación de 3NF que existía al poner límites de terminales en la tabla `routes`.*

## 📌 Principio Arquitectónico

Los límites físicos de un terminal (tasa máxima de carga o descarga) son una **propiedad del puerto**, no de la ruta. Si se almacenan en `routes`, cada puerto de destino aparece repetido en múltiples filas con el mismo valor — violación de la Segunda Forma Normal (2NF/3NF).

**Solución:** Tabla `ports` en Supabase con PK `port_id`. Las rutas referencian puertos, no duplican sus propiedades.

## 📊 Datos Actuales en Supabase

| port_id | port_name | country | max_load_rate (T/hr) | max_disch_rate (T/hr) |
|---|---|---|---|---|
| **ILO** | Puerto de Ilo | PE | 500 | 9999 |
| **MATARANI** | Puerto de Matarani | PE | 9999 | **300** |
| **MARCONA** | Puerto de San Juan | PE | 9999 | **300** |
| **MEJILLONES** | Puerto Mejillones | CL | 9999 | **300** |
| **CALLAO** | Puerto del Callao | PE | 9999 | 9999 |

> 9999 = sin restricción física conocida. El cuello de botella lo determina el barco o el contrato.

## 🧮 Uso en el Motor de Cálculo

Estas variables alimentan directamente las tasas reales de operación (`act_load` y `act_disch`) mediante la función MIN de triple restricción:

```
act_load  = MIN(c_load, v_intake, t_load_rate)
             ↓            ↓           ↓
         contracts    vessels      ports.max_load_rate

act_disch = MIN(c_disch, v_pump, p_disch_limit)
             ↓             ↓          ↓
         contracts     vessels    ports.max_disch_rate
```

### Ejemplo TABLONES → MATARANI:
```
act_disch = MIN(9999,  450,  300) = 300 MT/hr  ← MATARANI gana el MIN
              ↑          ↑      ↑
           SPCC no   Bombas  Puerto limita
           impone    TABLONES
           límite
```

## 🔗 Relaciones con Otras Tablas

- `routes.origin_port_id → ports.port_id` → para obtener `max_load_rate` del puerto de **carga**
- `routes.destination_port_id → ports.port_id` → para obtener `max_disch_rate` del puerto de **descarga**

## ⚠️ TODOs / Pendientes

- [ ] Agregar columnas `overhead_carga_hrs` y `overhead_descarga_hrs` a esta tabla para sacar el hardcode de 6H que existe en `forecast_service.py`
- [ ] Confirmar `max_disch_rate` de MEJILLONES (actualmente 300 por paridad con MATARANI y MARCONA — verificar con operaciones)
- [ ] Agregar CALLAO con datos reales cuando se opere esa ruta
