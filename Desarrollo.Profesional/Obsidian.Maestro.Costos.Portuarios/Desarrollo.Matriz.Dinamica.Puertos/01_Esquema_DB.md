# 🗄️ Esquema Real de Base de Datos — Supabase

> Levantado el 2026-07-17 por inspección directa.

---

## Tabla: `ports`

| Columna | Tipo | Notas |
|---|---|---|
| `port_id` | varchar PK | Ej: `CALLAO`, `MEJILLONES` |
| `port_name` | varchar | Nombre completo |
| `country` | varchar | `PE` o `CL` |
| `lat` / `lon` | numeric | Coordenadas GPS |
| `display_order` | integer | Orden en UI |

### Puertos en producción
| port_id | port_name | country |
|---|---|---|
| CALLAO | Puerto del Callao | PE |
| ILO | Puerto de Ilo | PE |
| MATARANI | Puerto de Matarani | PE |
| MARCONA | Puerto de San Juan | PE |
| MEJILLONES | Puerto Mejillones | CL |
| BARQUITO | Barquito | CL |

---

## Tabla: `terminals`

| Columna | Tipo | Notas |
|---|---|---|
| `terminal_id` | varchar PK | Ej: `APM`, `TPM` |
| `port_id` | varchar FK | Referencia a `ports` |
| `terminal_name` | varchar | Nombre completo |
| `is_active` | boolean | |
| `mooring_time_hrs` | numeric | Horas de amarre |
| `unmooring_time_hrs` | numeric | Horas de desamarre |

### Terminales en producción
| terminal_id | port_id | terminal_name |
|---|---|---|
| APM | CALLAO | APM TERMINALS |
| GENERAL | ILO | General sin nombre |
| GENERAL | MATARANI | General sin nombre |
| GENERAL | MARCONA | General sin nombre |
| TPM | MEJILLONES | Terminal Puerto Mejillones |
| INTERACID | MEJILLONES | INTERACID |
| TERQUIM | MEJILLONES | TERQUIM |
| GENERAL | BARQUITO | General sin nombre |

---

## Tabla: `port_cost_concepts`

| Columna | Tipo | Constraint |
|---|---|---|
| `concept_id` | varchar PK | |
| `concept_name` | varchar | |
| `category` | varchar | CHECK: `shifting` \| `general_port` \| `agency` |
| `default_calculation_type` | varchar | CHECK: `FIXED` \| `VARIABLE_TIME` \| `VARIABLE_TONS` |

---

## Tabla: `port_costs_matrix`

| Columna | Tipo | Notas |
|---|---|---|
| `rule_id` | uuid PK | UUID único por regla |
| `port_id` | varchar | FK → ports |
| `terminal` | varchar | FK → terminals.terminal_id |
| `operation_type` | varchar | `CARGA` o `DESCARGA` |
| `vessel_id` | varchar | `ALL` o buque específico |
| `concept_id` | varchar | FK → port_cost_concepts |
| `cost` | numeric | Siempre `0` (calculado dinámicamente) |
| `rate_usd` | numeric | Tarifa base en USD |
| `multiplier_source` | varchar | `FIXED`, `PER_GRT`, `PER_LOA_HOUR`, `PER_MANEUVER`, `PER_HOUR` |
| `min_limit` | numeric | Límite mínimo (nullable) |
| `max_limit` | numeric | Límite máximo (nullable) |
| `calculation_formula_template` | text | Fórmula legible ej: `1.50 * LOA * HOURS` |
| `origin_country` | varchar | `PE` si aplica solo desde Perú |
| `supplier_id` | uuid | FK → suppliers (nullable) |
| `sub_item_name` | varchar | Nombre del ítem en la UI |
| `allow_pass_through` | boolean | Toggle pass-through al cliente |
| `is_optional` | boolean | Costo opcional |
| `logic_comments` | varchar | Observación del Excel/PNG original |

---

## Tabla: `port_cost_static`

Tabla legacy — tarifas estáticas pre-modelo dinámico. No editar sin coordinación.
