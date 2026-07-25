# 🗺️ Plan de Implementación: Flujograma General del Sistema (Graphviz TB - 10 Maestros & Layout Vertical)

> **Ubicación del Plan en Bóveda**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\01_Arquitectura_y_Especificaciones\Plan.Implementacion.Flowchart.General.md`
> **Ubicación del Código del Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\generar_flowchart_general_petral_v1.py`
> **Ubicación en Frontend UI**: Módulo **Herramientas** (`/tools`) ➔ Subpestaña **"Flowchart del Sistema"**

---

## 🎯 Objetivo General
Desarrollar la **Herramienta de Diagramación Visual General del Sistema** basada en el estándar **Graphviz V18 (Top-to-Bottom `rankdir=TB`)**, con desarrollo vertical profundo y angosto (ancho ajustado a ~750px para encajar 100% en pantalla sin scroll horizontal) e indexando explícitamente **los 10 Maestros Reales** del software.

---

## 📚 Catálogo de los 10 Maestros Reales Incorporados

1. 🚢 **Maestro de Buques / Flota** (`/vessels`): BT Moquegua, BT Tablones, BT Huemul, Concon Trader (LOA, GRT, DWT).
2. ⚓ **Maestro de Puertos & Terminales** (`/ports`): Callao APM/DPWorld, Marcona Shougang, Matarani Tisur, Ilo SPCC/ENAPU, TPM Mejillones, Interacid, Terquim, Barquito.
3. 🗺️ **Maestro de Distancias Náuticas** (`/routes`): Matriz de Millas Náuticas (NM) entre puertos de Perú y Chile.
4. 📍 **Maestro de Rutas Spot & Originación/Destino** (`/spot-routes`, `/sources-sinks`): Puntos de carga/descarga mineras (NEXA, Southern Perú, Marcobre).
5. 💼 **Maestro de Clientes** (`/clients`): Fichas de Clientes comerciales y refacturabilidad.
6. 📜 **Maestro de Contratos & Cláusulas** (`/contracts`): Tarifarios contractuales pactados (Convenio Flat Marcona $36k, Addenda PSA 39.31%).
7. 💰 **Maestro de Gastos Portuarios & Reglas** (`/port-costs`): Plantillas de reglas de agenciamiento por puerto.
8. 🏷️ **Maestro de Tarifas Marítimas** (`/port-tariffs`): Tarifarios de Remolcaje (PSA, Ultratug, Petranso), Practicaje, Lanchas, Amarre, Sanidad.
9. ⛽ **Maestro de Precios Bunker / Combustibles** (`/bunker-prices`): Precios históricos y vigentes VLSFO y LSMGO por puerto.
10. 🔑 **Maestro de Usuarios & Permisos** (`/users`): Control de Roles (Admin, Editor, Visor) y permisos JWT.

---

## 📐 Estructura Jerárquica del Flujograma (`rankdir=TB`)

```
   ┌──────────────────────────────────────────────────────────┐
   │ NIVEL 1: 10 MAESTROS & CATÁLOGOS BASE (Columna Vertical) │
   │ 1. Flota 🚢  | 2. Puertos ⚓ | 3. Distancias 🗺️          │
   │ 4. Rutas Spot 📍 | 5. Clientes 💼 | 6. Contratos 📜     │
   │ 7. Gastos Port. 💰 | 8. Tarifas 🏷️ | 9. Bunkers ⛽     │
   │ 10. Usuarios & Permisos 🔑                              │
   └──────────────────────────┬───────────────────────────────┘
                              │
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │ NIVEL 2: RUTEADOR SPOT & CÁLCULO DE VIAJE (Spot Engine)  │
   │ (Distancias NM, Δt Navegación, Bunkers VLSFO/LSMGO)      │
   └──────────────────────────┬───────────────────────────────┘
                              │
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │ NIVEL 3: MOTORES DEDICADOS COSTOS PORTUARIOS (P x Q)     │
   │ (Callao, Marcona, Matarani, Ilo, Mejillones, Barquito)   │
   └──────────────────────────┬───────────────────────────────┘
                              │
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │ NIVEL 4: CONSOLIDACIÓN VOYAGE LEDGER & MULTICOTIZADOR     │
   │ (P&L Viaje, Margen Bruto/Neto, Cotizador Multi-Cliente)   │
   └──────────────────────────┬───────────────────────────────┘
                              │
                              ▼
   ┌──────────────────────────────────────────────────────────┐
   │ NIVEL 5: AUDITORÍA NAVIERA DUAL & REPORTES EXPORTABLES    │
   │ (Visor Dual Split-View PDFs, PDF Actas Carga/Descarga)   │
   └──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Acciones a Ejecutar

1. **Actualización de `generar_flowchart_general_petral_v1.py`**:
   - Ajustar el ancho del lienzo a ~750px en columna vertical estilizada.
   - Declarar explícitamente los 10 Maestros en cajas individuales dentro del Nivel 1.
   - Regenerar los archivos vectoriales `FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.pdf` y `.svg`.

2. **Copia a Frontend Public**:
   - Copiar los artefactos SVG/PDF a `Geeksoft_Frontend/public/`.

3. **Verificación de Compilación Frontend**:
   - Ejecutar `npm run build` en `Geeksoft_Frontend`.
