# 🕵️ El Método Benoit Blanc — Estandarización Visual y Doble Nivel de Drag & Drop Persistente
## Documento Pericial N° 34: Artefacto Centralizado `SharedYearlyRouteList.tsx` con Doble Nivel de Drag & Drop (Años y Rutas) y Persistencia Indestructible en Cierres, Cotizaciones y Presupuestos

> *"Cuando el armador examina sus contratos, cotizaciones y presupuestos, la jerarquía visual debe ser idéntica en toda la flota. No pueden existir pantallas huérfanas con agrupaciones dispares. La estandarización total de la arquitectura —tabs de cliente, acordeones de años y control táctil absoluto de ordenamiento— es la marca de una ingeniería naval de clase mundial."*  
> — **Detective Benoit Blanc**

---

## 📋 1. Resumen Ejecutivo y Dictamen Pericial

El objetivo de esta intervención fue resolver dos desafíos estructurales en la plataforma **PETRAL SMART DASHBOARD**:
1. **Estandarización del Look & Feel**: Homologar las tres pantallas maestras de gestión comercial de rutas:
   - 📜 **Maestro de Cierres (`ContractsMaster_V2.tsx`)**: `/contracts`
   - 💼 **Maestro de Cotizaciones (`RouteMaster_V2.tsx`)**: `/quotes`
   - 📊 **Maestro de Presupuestos (`BudgetsMaster_V2.tsx`)**: `/budgets`
2. **Doble Nivel de Drag & Drop con Persistencia Indestructible**:
   - **Nivel 1 (Macro - Años)**: Permitir reordenar los bloques anuales completos (`2027`, `2026`, etc.) arrastrando desde el handle `⋮⋮` en la cabecera del año.
   - **Nivel 2 (Micro - Rutas)**: Permitir reordenar los ribbons individuales de cada ruta dentro de su respectivo año.
   - **Persistencia**: Garantizar que el orden elegido se mantenga intacto entre sesiones, recargas de navegador (`F5`), cierres de sesión y cambios de pestaña mediante llaves desacopladas en `localStorage`.

---

## 🛡️ 2. Respaldo de Seguridad de Archivos Originales

Conforme al protocolo de control de daños y directivas del usuario, se generaron copias de seguridad `_legacy` antes de aplicar la refactorización:

| Pantalla | Archivo Activo en Producción | Archivo de Respaldo Seguro |
| :--- | :--- | :--- |
| **Cierres (COA)** | `src/pages/Masters/ContractsMaster_V2.tsx` | `src/pages/Masters/ContractsMaster_legacy.tsx` |
| **Cotizaciones (Spot)** | `src/components/Masters/RouteMaster_V2.tsx` | `src/components/Masters/RouteMaster_legacy.tsx` |
| **Presupuestos (PPTOS)** | `src/pages/Masters/BudgetsMaster_V2.tsx` | `src/pages/Masters/BudgetsMaster_legacy.tsx` |

---

## 🏗️ 3. Arquitectura del Artefacto Compartido (`SharedYearlyRouteList.tsx`)

Ubicación: `src/components/CommercialForecast/SharedYearlyRouteList.tsx`

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PANTALLA MAESTRA (V2)                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 👤 PESTAÑAS HORIZONTALES DE CLIENTES:                                                           │
│ [ 🏢 SPCC (10) ]   [ 🏢 NEXA (2) ]   [ 💼 SPOT / PROSPECTOS (4) ]   [ 🌐 TODOS (16) ]            │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  ═══════════════════ NIVEL 1: DRAG & DROP DE BLOQUES ANUALES (ACORDEONES) ════════════════════   │
│                                                                                                 │
│  [⋮⋮ Grip Año] 📅 AÑO DE VIGENCIA 2027 (10 Cierres)                   [↺ Restablecer] [Ocultar]  │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ═══════════════ NIVEL 2: DRAG & DROP DE RIBBONS DE RUTAS (DENTRO DEL AÑO) ═══════════════ │  │
│  │                                                                                           │  │
│  │ [⋮⋮ Grip] 📍 SPCC.ILO.MATARANI.2025-2027  [FIRME] [3 Tramos] [Ver Multicotizador ➔] [🗑️]   │  │
│  │   └── (Al hacer clic expande QuoteExecutiveCardSummary: Itinerario, Flete, Bunker, P&L)   │  │
│  │                                                                                           │  │
│  │ [⋮⋮ Grip] 📍 SPCC.ILO.MARCONA.2025-2027   [FIRME] [3 Tramos] [Ver Multicotizador ➔] [🗑️]   │  │
│  │   ↕ (Arrastrar y soltar con feedback visual de borde azul y sombra en tiempo real)        │  │
│  │                                                                                           │  │
│  │ [⋮⋮ Grip] 📍 SPCC.ILO.BARQUITO.2025-2027  [FIRME] [3 Tramos] [Ver Multicotizador ➔] [🗑️]   │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
│  [⋮⋮ Grip Año] 📅 AÑO DE VIGENCIA 2026 (4 Cierres)                    [↺ Restablecer] [Ocultar]  │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ... (Rutas del año 2026 ordenables independientemente)                                    │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ 4. Mecánica Técnica del Doble Drag & Drop y Persistencia

### 4.1. Esquema de Llaves de Persistencia (`localStorage`)

Para evitar colisiones entre pantallas y entre clientes, las llaves de almacenamiento se aíslan jerárquicamente:

1. **Orden de Años (Nivel 1)**:
   $$\text{Key} = \text{"petral\_year\_order\_"} + \text{storageKey} + \text{"\_"} + \text{clientId}$$
   - *Ejemplo*: `petral_year_order_contracts_SPCC` $\rightarrow$ `["2027", "2026", "2025"]`

2. **Orden de Rutas dentro de un Año (Nivel 2)**:
   $$\text{Key} = \text{"petral\_route\_order\_"} + \text{storageKey} + \text{"\_"} + \text{clientId} + \text{"\_"} + \text{year}$$
   - *Ejemplo*: `petral_route_order_contracts_SPCC_2027` $\rightarrow$ `["SPCC.ILO.MATARANI...", "SPCC.ILO.MARCONA...", "SPCC.ILO.BARQUITO..."]`

### 4.2. Tolerancia a Nuevas Cotizaciones (Algoritmo de Inserción Resiliente)

Cuando el usuario crea una nueva cotización en el Multicotizador y entra al Maestro correspondiente:
```typescript
// Reconstrucción resiliente del orden:
const rawRouteIds = rList.map(r => r.name || r.route_id || r.id || '');
const saved = localStorage.getItem(routeStorageKey);

if (saved) {
    const parsed: string[] = JSON.parse(saved);
    // 1. Filtrar elementos guardados que aún existan en la BD
    const validSaved = parsed.filter(id => rawRouteIds.includes(id));
    // 2. Detectar nuevas rutas creadas que no estaban en el orden previo
    const missing = rawRouteIds.filter(id => !validSaved.includes(id));
    // 3. Añadir las nuevas rutas limpiamente al final sin desordenar las existentes
    newRouteOrderMap[year] = [...validSaved, ...missing];
} else {
    newRouteOrderMap[year] = rawRouteIds;
}
```

---

## 💻 5. Código Fuente Completo del Artefacto Compartido (`SharedYearlyRouteList.tsx`)

```tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronRight, CheckCircle2, Clock, Trash2, ExternalLink, GripVertical, RotateCcw, Layers } from 'lucide-react';
import { QuoteExecutiveCardSummary } from './QuoteExecutiveCardSummary';

export interface EnrichedRouteItem {
    route_id?: string;
    spot_id?: string;
    id?: string;
    name: string;
    description?: string;
    client_id?: string;
    client?: string;
    is_contract?: boolean;
    contract_id?: string;
    table_source?: string;
    created_at?: string;
    created_by?: string;
    valid_from?: string;
    valid_to?: string;
    status?: string;
    approved_by?: string;
    approved_by_name?: string;
    approved_at?: string;
    approval_notes?: string;
    demurrage_rates?: Record<string, number>;
    demurrage_rate?: number;
    comments?: Array<{ text: string; date?: string; user?: string }>;
    legs_data?: any;
    financial_summary?: any;
}

interface SharedYearlyRouteListProps {
    storageKey: string; // 'contracts' | 'quotes' | 'budgets'
    clientId: string; // e.g. 'SPCC', 'NEXA', 'TODOS'
    routes: EnrichedRouteItem[];
    onDeleteRoute: (route: EnrichedRouteItem) => Promise<void> | void;
    onStatusClick?: (route: EnrichedRouteItem) => void;
    extraActionRenderer?: (route: EnrichedRouteItem) => React.ReactNode;
    emptyMessage?: string;
}

export const SharedYearlyRouteList: React.FC<SharedYearlyRouteListProps> = ({
    storageKey,
    clientId,
    routes,
    onDeleteRoute,
    onStatusClick,
    extraActionRenderer,
    emptyMessage = "No hay registros disponibles para el filtro seleccionado."
}) => {
    const [openYears, setOpenYears] = useState<Record<string, boolean>>({});
    const [expandedRouteName, setExpandedRouteName] = useState<string | null>(null);

    // Estado del Drag & Drop Nivel 1 (Años)
    const [draggedYear, setDraggedYear] = useState<string | null>(null);
    const [dragOverYear, setDragOverYear] = useState<string | null>(null);
    const [customYearOrder, setCustomYearOrder] = useState<string[]>([]);

    // Estado del Drag & Drop Nivel 2 (Rutas dentro de Años)
    const [draggedRoute, setDraggedRoute] = useState<{ id: string; year: string } | null>(null);
    const [dragOverRoute, setDragOverRoute] = useState<{ id: string; year: string } | null>(null);
    const [customRouteOrderMap, setCustomRouteOrderMap] = useState<Record<string, string[]>>({});

    // 1. Agrupar rutas por año de vigencia (extraído de valid_to, valid_from o nombre)
    const rawGroupsByYear = useMemo(() => {
        const groups: Record<string, EnrichedRouteItem[]> = {};

        routes.forEach(route => {
            const legs = route.legs_data || {};
            const meta = legs.contract_metadata || {};
            const validTo = route.valid_to || legs.valid_to || meta.valid_to || '';
            const validFrom = route.valid_from || legs.valid_from || meta.valid_from || '';
            const nameStr = route.name || '';

            let year = '';
            if (validTo && validTo.length >= 4) {
                year = validTo.substring(0, 4);
            } else if (validFrom && validFrom.length >= 4) {
                year = validFrom.substring(0, 4);
            }

            if (!year && nameStr) {
                const match = nameStr.match(/\b(20\d{2})\b/);
                if (match) year = match[1];
            }

            if (!year) {
                year = new Date().getFullYear().toString();
            }

            if (!groups[year]) groups[year] = [];
            groups[year].push(route);
        });

        return groups;
    }, [routes]);

    // 2. Cargar orden persistente de Años desde localStorage
    const yearStorageKey = `petral_year_order_${storageKey}_${clientId || 'ALL'}`;
    useEffect(() => {
        const rawYears = Object.keys(rawGroupsByYear).sort((a, b) => b.localeCompare(a));
        try {
            const saved = localStorage.getItem(yearStorageKey);
            if (saved) {
                const parsed: string[] = JSON.parse(saved);
                const validSaved = parsed.filter(y => rawYears.includes(y));
                const missing = rawYears.filter(y => !validSaved.includes(y));
                setCustomYearOrder([...validSaved, ...missing]);
            } else {
                setCustomYearOrder(rawYears);
            }
        } catch {
            setCustomYearOrder(rawYears);
        }
    }, [rawGroupsByYear, yearStorageKey]);

    // 3. Cargar orden persistente de Rutas por Año desde localStorage
    useEffect(() => {
        const newRouteOrderMap: Record<string, string[]> = {};
        Object.keys(rawGroupsByYear).forEach(year => {
            const rList = rawGroupsByYear[year] || [];
            const rawRouteIds = rList.map(r => r.name || r.route_id || r.id || '');
            const routeStorageKey = `petral_route_order_${storageKey}_${clientId || 'ALL'}_${year}`;

            try {
                const saved = localStorage.getItem(routeStorageKey);
                if (saved) {
                    const parsed: string[] = JSON.parse(saved);
                    const validSaved = parsed.filter(id => rawRouteIds.includes(id));
                    const missing = rawRouteIds.filter(id => !validSaved.includes(id));
                    newRouteOrderMap[year] = [...validSaved, ...missing];
                } else {
                    newRouteOrderMap[year] = rawRouteIds;
                }
            } catch {
                newRouteOrderMap[year] = rawRouteIds;
            }
        });
        setCustomRouteOrderMap(newRouteOrderMap);
    }, [rawGroupsByYear, storageKey, clientId]);

    // Auto-desplegar el primer año por defecto
    useEffect(() => {
        if (customYearOrder.length > 0) {
            const topYear = customYearOrder[0];
            setOpenYears(prev => (prev[topYear] !== undefined ? prev : { ...prev, [topYear]: true }));
        }
    }, [customYearOrder]);

    const toggleYear = (year: string) => {
        setOpenYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    const toggleRouteExpansion = (routeName: string) => {
        setExpandedRouteName(prev => (prev === routeName ? null : routeName));
    };

    // DRAG & DROP HANDLERS — NIVEL 1: AÑOS
    const handleYearDragStart = (e: React.DragEvent, year: string) => {
        setDraggedYear(year);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `YEAR:${year}`);
    };

    const handleYearDragOver = (e: React.DragEvent, year: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedYear && draggedYear !== year && dragOverYear !== year) {
            setDragOverYear(year);
        }
    };

    const handleYearDrop = (e: React.DragEvent, targetYear: string) => {
        e.preventDefault();
        if (draggedYear && draggedYear !== targetYear) {
            const newOrder = [...customYearOrder];
            const fromIdx = newOrder.indexOf(draggedYear);
            const toIdx = newOrder.indexOf(targetYear);
            if (fromIdx !== -1 && toIdx !== -1) {
                newOrder.splice(fromIdx, 1);
                newOrder.splice(toIdx, 0, draggedYear);
                setCustomYearOrder(newOrder);
                try {
                    localStorage.setItem(yearStorageKey, JSON.stringify(newOrder));
                } catch (err) {
                    console.error("Error saving year order:", err);
                }
            }
        }
        setDraggedYear(null);
        setDragOverYear(null);
    };

    const handleYearDragEnd = () => {
        setDraggedYear(null);
        setDragOverYear(null);
    };

    const handleResetYearOrder = (e: React.MouseEvent) => {
        e.stopPropagation();
        const defaultSorted = Object.keys(rawGroupsByYear).sort((a, b) => b.localeCompare(a));
        setCustomYearOrder(defaultSorted);
        try {
            localStorage.removeItem(yearStorageKey);
        } catch (err) {
            console.error("Error resetting year order:", err);
        }
    };

    // DRAG & DROP HANDLERS — NIVEL 2: RUTAS DENTRO DE UN AÑO
    const handleRouteDragStart = (e: React.DragEvent, routeId: string, year: string) => {
        e.stopPropagation();
        setDraggedRoute({ id: routeId, year });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `ROUTE:${routeId}`);
    };

    const handleRouteDragOver = (e: React.DragEvent, routeId: string, year: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (draggedRoute && draggedRoute.year === year && draggedRoute.id !== routeId) {
            if (dragOverRoute?.id !== routeId) {
                setDragOverRoute({ id: routeId, year });
            }
        }
    };

    const handleRouteDrop = (e: React.DragEvent, targetRouteId: string, year: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedRoute && draggedRoute.year === year && draggedRoute.id !== targetRouteId) {
            const currentYearList = customRouteOrderMap[year] || [];
            const newYearList = [...currentYearList];
            const fromIdx = newYearList.indexOf(draggedRoute.id);
            const toIdx = newYearList.indexOf(targetRouteId);

            if (fromIdx !== -1 && toIdx !== -1) {
                newYearList.splice(fromIdx, 1);
                newYearList.splice(toIdx, 0, draggedRoute.id);

                setCustomRouteOrderMap(prev => ({
                    ...prev,
                    [year]: newYearList
                }));

                const routeStorageKey = `petral_route_order_${storageKey}_${clientId || 'ALL'}_${year}`;
                try {
                    localStorage.setItem(routeStorageKey, JSON.stringify(newYearList));
                } catch (err) {
                    console.error("Error saving route order:", err);
                }
            }
        }
        setDraggedRoute(null);
        setDragOverRoute(null);
    };

    const handleRouteDragEnd = () => {
        setDraggedRoute(null);
        setDragOverRoute(null);
    };

    const handleResetRouteOrder = (e: React.MouseEvent, year: string) => {
        e.stopPropagation();
        const rList = rawGroupsByYear[year] || [];
        const rawRouteIds = rList.map(r => r.name || r.route_id || r.id || '');
        setCustomRouteOrderMap(prev => ({ ...prev, [year]: rawRouteIds }));
        const routeStorageKey = `petral_route_order_${storageKey}_${clientId || 'ALL'}_${year}`;
        try {
            localStorage.removeItem(routeStorageKey);
        } catch (err) {
            console.error("Error resetting route order:", err);
        }
    };

    if (customYearOrder.length === 0) {
        return (
            <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200 shadow-sm">
                <Layers size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {customYearOrder.map(year => {
                const isOpen = Boolean(openYears[year]);
                const rawRoutes = rawGroupsByYear[year] || [];
                const order = customRouteOrderMap[year] || [];

                // Reconstruir lista ordenada de rutas
                const sortedRoutesInYear = [...rawRoutes].sort((a, b) => {
                    const idA = a.name || a.route_id || a.id || '';
                    const idB = b.name || b.route_id || b.id || '';
                    const idxA = order.indexOf(idA);
                    const idxB = order.indexOf(idB);
                    if (idxA === -1 && idxB === -1) return 0;
                    if (idxA === -1) return 1;
                    if (idxB === -1) return -1;
                    return idxA - idxB;
                });

                const isYearDragging = draggedYear === year;
                const isYearDragOver = dragOverYear === year;

                return (
                    <div
                        key={year}
                        draggable
                        onDragStart={(e) => handleYearDragStart(e, year)}
                        onDragOver={(e) => handleYearDragOver(e, year)}
                        onDrop={(e) => handleYearDrop(e, year)}
                        onDragEnd={handleYearDragEnd}
                        className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-150 ${
                            isYearDragging ? 'opacity-40 scale-[0.99] border-dashed border-amber-400' : 'border-slate-200'
                        } ${isYearDragOver ? 'border-2 border-amber-500 ring-2 ring-amber-300/60 shadow-lg' : ''}`}
                    >
                        {/* CABECERA HORIZONTAL DEL BLOQUE ANUAL (DRAGGABLE NIVEL 1) */}
                        <div
                            onClick={() => toggleYear(year)}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between transition-colors cursor-pointer select-none"
                        >
                            <div className="flex items-center gap-3">
                                <span 
                                    className="p-1 text-slate-400 hover:text-amber-400 cursor-grab active:cursor-grabbing"
                                    title="Arrastra para reordenar este año"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <GripVertical size={16} />
                                </span>
                                <Calendar size={18} className="text-amber-400 shrink-0" />
                                <span className="text-sm font-black uppercase tracking-wider">
                                    📅 AÑO DE VIGENCIA {year}
                                </span>
                                <span className="bg-slate-700 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-600">
                                    {sortedRoutesInYear.length} {sortedRoutesInYear.length === 1 ? 'Ruta / Cierre' : 'Rutas / Cierres'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 text-slate-300 text-xs font-semibold">
                                <button
                                    onClick={(e) => handleResetYearOrder(e)}
                                    className="hover:text-amber-300 text-[11px] font-normal flex items-center gap-1 text-slate-400 hover:underline px-2 py-0.5 rounded"
                                    title="Restablecer orden cronológico de años"
                                >
                                    <RotateCcw size={11} />
                                    <span>Restablecer Años</span>
                                </button>
                                <span className="text-slate-600">|</span>
                                <span>{isOpen ? 'Ocultar Año' : 'Desplegar Año'}</span>
                                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </div>
                        </div>

                        {/* LISTADO DE RUTAS DEL AÑO (DRAGGABLE NIVEL 2) */}
                        {isOpen && (
                            <div className="p-4 space-y-3 bg-slate-50 border-t border-slate-200">
                                <div className="flex items-center justify-between pb-1 text-[11px] font-semibold text-slate-400 px-1">
                                    <span>Arrastra los ribbons (icono ⋮⋮) para personalizar el orden de las rutas:</span>
                                    <button
                                        onClick={(e) => handleResetRouteOrder(e, year)}
                                        className="hover:text-blue-600 flex items-center gap-1 text-slate-500 hover:underline cursor-pointer"
                                        title="Restablecer orden inicial de rutas para este año"
                                    >
                                        <RotateCcw size={11} />
                                        <span>Restablecer Rutas ({year})</span>
                                    </button>
                                </div>

                                {sortedRoutesInYear.map(route => {
                                    const routeId = route.name || route.route_id || route.id || '';
                                    const isExpanded = expandedRouteName === route.name;
                                    const legs = route.legs_data || {};
                                    const meta = legs.contract_metadata || {};
                                    const tramos = legs.tramos || [];
                                    const validFrom = route.valid_from || legs.valid_from || meta.valid_from || '—';
                                    const validTo = route.valid_to || legs.valid_to || meta.valid_to || '—';

                                    const rawStatus = ((route as any).status || meta.status || meta.contract_status || 'BORRADOR').toUpperCase();
                                    const isFirme = rawStatus === 'FIRME' || rawStatus === 'APROBADO' || rawStatus === 'ACTIVE';

                                    const portsList: string[] = [];
                                    tramos.forEach((tr: any) => {
                                        if (tr.origin_port_id && !portsList.includes(tr.origin_port_id)) portsList.push(tr.origin_port_id);
                                        if (tr.destination_port_id && !portsList.includes(tr.destination_port_id)) portsList.push(tr.destination_port_id);
                                    });
                                    const portsSequence = portsList.length > 0 ? portsList.join(' ➔ ') : 'Ruta Multicotizador';

                                    const isRouteDragging = draggedRoute?.id === routeId && draggedRoute.year === year;
                                    const isRouteDragOver = dragOverRoute?.id === routeId && dragOverRoute.year === year;

                                    return (
                                        <div
                                            key={routeId}
                                            draggable
                                            onDragStart={(e) => handleRouteDragStart(e, routeId, year)}
                                            onDragOver={(e) => handleRouteDragOver(e, routeId, year)}
                                            onDrop={(e) => handleRouteDrop(e, routeId, year)}
                                            onDragEnd={handleRouteDragEnd}
                                            className={`bg-white rounded-lg border shadow-xs overflow-hidden transition-all duration-150 ${
                                                isRouteDragging ? 'opacity-40 scale-[0.99] border-dashed border-blue-400' : 'border-slate-300'
                                            } ${isRouteDragOver ? 'border-2 border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-200' : ''}`}
                                        >
                                            <div
                                                onClick={() => toggleRouteExpansion(route.name)}
                                                className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className="p-1 text-slate-400 hover:text-blue-600 cursor-grab active:cursor-grabbing"
                                                        title="Arrastra para reordenar esta ruta"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <GripVertical size={16} />
                                                    </span>

                                                    <button className="text-slate-500 hover:text-blue-600">
                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                    </button>

                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                📍 {route.name}
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                                                isFirme ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                            }`}>
                                                                {isFirme ? <CheckCircle2 size={10} /> : <Clock size={10} />} {isFirme ? 'FIRME' : 'BORRADOR'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-3">
                                                            <span>Secuencia: <strong className="text-slate-800 font-mono">[{portsSequence}]</strong></span>
                                                            <span className="text-slate-400">|</span>
                                                            <span>Vigencia: <strong className="text-slate-700 font-mono">{validFrom} ➔ {validTo}</strong></span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                    <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono text-[11px]">
                                                        {tramos.length} Tramos
                                                    </span>

                                                    {/* ACCIONES EXTRA (EJ. IMPRESIÓN / AUDITORÍA PDF) */}
                                                    {extraActionRenderer && extraActionRenderer(route)}

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                sessionStorage.setItem('petral_load_quote', JSON.stringify(route));
                                                                window.open('/multicotizador', '_blank');
                                                            } catch (err) {
                                                                console.error("Error opening quote:", err);
                                                                window.open('/multicotizador', '_blank');
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer shadow-2xs"
                                                        title="Abrir esta ruta en vivo en el Multicotizador"
                                                    >
                                                        <ExternalLink size={12} />
                                                        <span>Ver en Multicotizador ➔</span>
                                                    </button>

                                                    <span 
                                                        className="text-slate-400 font-bold hover:underline cursor-pointer px-1 text-xs" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleRouteExpansion(route.name);
                                                        }}
                                                    >
                                                        {isExpanded ? '▲ Ocultar Ficha' : '▼ Detalle Rápido'}
                                                    </span>

                                                    {/* PAD DE ESTADO: BORRADOR vs FIRME */}
                                                    {onStatusClick && (
                                                        isFirme ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onStatusClick(route);
                                                                }}
                                                                className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ml-1"
                                                                title={`Aprobado por ${(route as any).approved_by_name || (route as any).approved_by || 'ADMIN'}. Clic para auditar.`}
                                                            >
                                                                <CheckCircle2 size={13} className="text-emerald-600" />
                                                                <span>FIRME</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onStatusClick(route);
                                                                }}
                                                                className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 hover:text-amber-950 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ml-1"
                                                                title="Cierre en estado BORRADOR. Clic para autorizar y pasar a FIRME (Solo Administrador con clave)"
                                                            >
                                                                <Clock size={13} className="text-amber-600" />
                                                                <span>BORRADOR</span>
                                                            </button>
                                                        )
                                                    )}

                                                    {/* PAD BORRAR */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteRoute(route);
                                                        }}
                                                        className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs ml-1"
                                                        title="Eliminar ruta de la base de datos"
                                                    >
                                                        <Trash2 size={13} />
                                                        <span>Eliminar</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* FICHA EXPANDIDA: UI UNIFICADA MULTICOTIZADOR */}
                                            {isExpanded && (
                                                <div className="p-4 bg-slate-50 border-t border-slate-200">
                                                    <QuoteExecutiveCardSummary route={route} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
```

---

## 🚀 6. Matriz de Validación en Producción

| Pantalla | URL en Producción | Look & Feel Estandarizado | Drag & Drop Años (Nivel 1) | Drag & Drop Rutas (Nivel 2) | Persistencia LocalStorage |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Maestro de Cierres** | `https://forecast.geeksoft.tech/contracts` | ✅ OK | ✅ OK (`contracts_clientId`) | ✅ OK (`contracts_clientId_year`) | ✅ Verificado |
| **Maestro de Cotizaciones** | `https://forecast.geeksoft.tech/quotes` | ✅ OK | ✅ OK (`quotes_clientId`) | ✅ OK (`quotes_clientId_year`) | ✅ Verificado |
| **Maestro de Presupuestos** | `https://forecast.geeksoft.tech/budgets` | ✅ OK | ✅ OK (`budgets_clientId`) | ✅ OK (`budgets_clientId_year`) | ✅ Verificado |

---

## 🏷️ 7. Registro de Versionamiento Git
* **Tag Pre-Cirugía**: `PRE.ARTEFACTO.DRAG.DROP`
* **Tag Oficial de Certificación Final**: `OK.DRAG.DROP.IZ`
* **Rama Activa**: `main`

---
*Documento pericial completado, auditado y sellado para la posteridad.*
