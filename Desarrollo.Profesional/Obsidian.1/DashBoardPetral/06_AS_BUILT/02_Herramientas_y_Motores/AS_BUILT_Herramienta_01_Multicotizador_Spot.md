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
