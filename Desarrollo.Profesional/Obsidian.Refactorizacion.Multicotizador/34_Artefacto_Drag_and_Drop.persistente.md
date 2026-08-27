# 🕵️ El Método Benoit Blanc — Estandarización Visual y Doble Nivel de Drag & Drop Persistente
## Documento Pericial N° 34: Artefacto Centralizado de Agrupación por Cliente y Años con Reordenamiento Drag & Drop Persistente (Años y Rutas)

> *"Cuando el armador examina sus contratos, cotizaciones y presupuestos, la jerarquía visual debe ser idéntica en toda la flota. No pueden existir pantallas huérfanas con agrupaciones dispares. La estandarización total de la arquitectura —tabs de cliente, acordeones de años y control táctil absoluto de ordenamiento— es la marca de una ingeniería naval de clase mundial."*  
> — **Detective Benoit Blanc**

---

## 📋 1. El Diagnóstico y la Necesidad de Estandarización

Actualmente, las tres pantallas maestras comerciales de rutas presentan discrepancias en su diseño:
1. 📜 **Maestro de Cierres (`ContractsMaster_V2.tsx`)**:
   * ✅ Tiene pestañas superiores de **Clientes** (`SPCC`, `NEXA`, etc.).
   * ✅ Tiene acordeones horizontales por **Año de Vigencia** (`📅 AÑO DE VIGENCIA 2027`).
   * ❌ No permite reordenar años ni rutas interactivamente mediante arrastre.
2. 💼 **Maestro de Cotizaciones (`RouteMaster_V2.tsx`)**:
   * ❌ Agrupaba directamente por cliente sin estructura anual unificada.
   * ❌ No compartía el mismo contenedor estandarizado.
3. 📊 **Maestro de Presupuestos (`BudgetsMaster_V2.tsx`)**:
   * ❌ Estructura parcialmente divergente.

### 🎯 La Misión Unificadora:
Crear un **único artefacto compartido** (`SharedYearlyRouteList.tsx`) que garantice el **mismo Look & Feel en las 3 pantallas**, dotándolas de un **Doble Nivel de Drag & Drop con Persistencia Indestructible**.

---

## 🏗️ 2. Arquitectura del Artefacto Compartido (`SharedYearlyRouteList.tsx`)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             MAESTRO (Cierres / Cotizaciones / Presupuestos)                 │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 👤 PESTAÑAS HORIZONTALES DE CLIENTES:                                                       │
│ [ 🏢 SPCC (10) ]   [ 🏢 NEXA (2) ]   [ 💼 SPOT / PROSPECTOS (4) ]   [ 🌐 TODOS (16) ]        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ═══════════════ NIVEL 1: DRAG & DROP DE BLOQUES ANUALES (ACORDEONES) ════════════════════  │
│                                                                                             │
│  [⋮⋮ Grip Año] 📅 AÑO DE VIGENCIA 2027 (10 Cierres)                   [Ocultar / Desplegar] │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ═══════════ NIVEL 2: DRAG & DROP DE RIBBONS DE RUTAS (DENTRO DEL AÑO) ═══════════════ │  │
│  │                                                                                       │  │
│  │ [⋮⋮ Grip Ruta] 📍 SPCC.ILO.MATARANI.2025-2027  [FIRME] [Ver Multicotizador ➔] [🗑️]    │  │
│  │   └── (Al hacer clic expande QuoteExecutiveCardSummary: Itinerario, Flete, Bunker, P&L)│  │
│  │                                                                                       │  │
│  │ [⋮⋮ Grip Ruta] 📍 SPCC.ILO.MARCONA.2025-2027   [FIRME] [Ver Multicotizador ➔] [🗑️]    │  │
│  │   ↕ (Arrastrar y soltar con feedback visual de borde azul y sombra en tiempo real)    │  │
│  │                                                                                       │  │
│  │ [⋮⋮ Grip Ruta] 📍 SPCC.ILO.BARQUITO.2025-2027  [FIRME] [Ver Multicotizador ➔] [🗑️]    │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                             │
│  [⋮⋮ Grip Año] 📅 AÑO DE VIGENCIA 2026 (4 Cierres)                    [Ocultar / Desplegar] │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ... (Rutas del año 2026 ordenables entre sí)                                          │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ 3. Especificación Técnica del Doble Nivel de Drag & Drop

### 3.1. Nivel 1: Reordenamiento de Años (Macro)
* **Atributo**: La barra negra de cabecera del año tiene `draggable={true}` y un handle con icono `GripVertical` (`⋮⋮`).
* **Comportamiento**: Permite al usuario arrastrar el bloque de un año entero (ej. mover `2026` por encima de `2027`).
* **Persistencia**:
  $$\text{Key} = \text{"petral\_year\_order\_" + storageKey + "\_" + clientId}$$
  * Guarda: `['2027', '2026', '2025']`.

### 3.2. Nivel 2: Reordenamiento de Rutas (Micro)
* **Atributo**: Cada ribbon de ruta individual dentro de un año tiene `draggable={true}` y su handle `GripVertical`.
* **Comportamiento**: Permite mover una ruta hacia arriba o hacia abajo dentro del mismo año.
* **Persistencia**:
  $$\text{Key} = \text{"petral\_route\_order\_" + storageKey + "\_" + clientId + "\_" + year}$$
  * Guarda: `['SPCC.ILO.MATARANI...', 'SPCC.ILO.MARCONA...', 'SPCC.ILO.BARQUITO...']`.

---

## 🔒 4. Protocolo de Persistencia Indestructible y Resiliencia

1. **Persistencia Inmediata en `localStorage`**:
   * Toda acción de arrastrar y soltar (`onDrop`) actualiza el estado de React inmediatamente a **60 FPS** y se guarda en el storage del navegador.
   * Al cerrar la sesión, refrescar (`F5`) o volver desde otra pantalla, el componente recompone exactamente la disposición personalizada del usuario.
2. **Tolerancia a Nuevos Registros**:
   * Si el usuario crea una nueva cotización en el Multicotizador y entra a Cierres, el algoritmo inserta la nueva ruta **al final del año correspondiente** sin alterar el orden previamente establecido para las demás rutas.
3. **Botón de Restablecimiento Rápido**:
   * Cada cabecera de año incluye un botón sutil `↺ Orden Cronológico` para permitir al usuario volver al orden natural si lo desea.

---

## 🚀 5. Plan de Ejecución

| Paso | Acción | Archivo Afectado | Estado |
| :---: | :--- | :--- | :---: |
| **Paso 0** | Creación de Git Tag de Seguridad | `PRE.ARTEFACTO.DRAG.DROP` | ✅ COMPLETADO |
| **Paso 1** | Creación del Artefacto Compartido | `src/components/CommercialForecast/SharedYearlyRouteList.tsx` | ⏳ PENDIENTE |
| **Paso 2** | Integración en Maestro de Cierres | `src/pages/Masters/ContractsMaster_V2.tsx` | ⏳ PENDIENTE |
| **Paso 3** | Estandarización e Integración en Maestro de Cotizaciones | `src/components/Masters/RouteMaster_V2.tsx` | ⏳ PENDIENTE |
| **Paso 4** | Estandarización e Integración en Maestro de Presupuestos | `src/pages/Masters/BudgetsMaster_V2.tsx` | ⏳ PENDIENTE |
| **Paso 5** | Compilación, Verificación y Despliegue al VPS | `npx vite build` + `deploy_forecast_kickoff.py` | ⏳ PENDIENTE |

---

*Documento registrado y firmado para control pericial de cambios.*
