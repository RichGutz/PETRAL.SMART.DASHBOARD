# 🗺️ Índice — Desarrollo Matriz Dinámica de Puertos

> **Propósito**: Documentación técnica completa del Motor de Costos Portuarios PETRAL.
> **Estado general**: Fases 1-5 COMPLETADAS ✅ | Base de datos sedeada con datos reales de PNGs

---

## 📂 Estructura de este Vault

| Archivo | Contenido |
|---|---|
| [Plan.Implementacion.Matriz.md](Plan.Implementacion.Matriz.md) | Arquitectura ER, SQL de migración, log de ejecución por fases |
| [00_Indice.md](00_Indice.md) | Este índice |
| [01_Esquema_DB.md](01_Esquema_DB.md) | Esquema real de tablas en Supabase + constraints |
| [02_Terminales_y_Puertos.md](02_Terminales_y_Puertos.md) | Mapeo completo port_id → terminal_id |
| [03_Seed_Completado.md](03_Seed_Completado.md) | Resumen de lo sedeado desde los PNGs |

---

## 🧠 Resumen Ejecutivo

El motor de costos portuarios funciona con 3 tablas clave:

```
ports  ──►  terminals  ──►  port_costs_matrix
                                 │
                         port_cost_concepts
```

### Tablas en Producción (Supabase)
| Tabla | Función |
|---|---|
| `ports` | Maestro de puertos (CALLAO, ILO, MATARANI, MARCONA, MEJILLONES, BARQUITO) |
| `terminals` | Maestro de terminales por puerto |
| `port_cost_concepts` | Catálogo de conceptos (Pilotage, Towage, Dockage, etc.) |
| `port_costs_matrix` | **Motor de reglas** — tarifa + fórmula por puerto/terminal/operacion |

### Constraints importantes
- `category` acepta: `shifting` | `general_port` | `agency`
- `default_calculation_type` acepta: `FIXED` | `VARIABLE_TIME` | `VARIABLE_TONS`

---

## 📌 Estado actual del Seed (Julio 2026)

| Puerto | Terminal DB | Terminal Real | Ítems CARGA | Ítems DESCARGA |
|---|---|---|---|---|
| CALLAO | APM | APM Terminals | 13 | 13 |
| ILO | GENERAL | Enapu / Southern | 17 | 17 |
| MATARANI | GENERAL | Tisur | 15 | 15 |
| MARCONA | GENERAL | PSA Marine / Shougang | 13 | 13 |
| MEJILLONES | TPM | TGN | 17 | 17 |
| MEJILLONES | INTERACID | Interacid | 19 | 19 |
| MEJILLONES | TERQUIM | Terquim | 20 | 20 |
| BARQUITO | GENERAL | Barquito | 20 | 20 |

> **Fuente de datos**: PNGs en `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA\`
> Transcritos a MD en: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\`
