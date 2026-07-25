# 📊 Flowchart: Voyage Ledger Universal
> **Herramienta**: Voyage Ledger Universal — Simulador de P&L por Viaje
> **Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_VOYAGE_LEDGER.py`
> **SVG**: `Geeksoft_Frontend/public/FLOWCHART_VOYAGE_LEDGER.svg`
> **Visor Web**: Herramientas ➔ 🗺️ Flowchart del Sistema ➔ Tab "Voyage Ledger"

---

## 🎯 Propósito

El **Voyage Ledger Universal** es el motor de cálculo individual de un viaje. A diferencia del Multicotizador (que gestiona múltiples cotizaciones simultáneas), el Ledger se enfoca en **la simulación detallada y el desglose ítem por ítem** de un único viaje, con capacidad de análisis de sensibilidad.

---

## 🔄 Flujo del Voyage Ledger

### Configuración del Viaje
| Parámetro | Descripción |
|---|---|
| 🚢 Buque | Trae automáticamente LOA, DWT, velocidad y consumos |
| 👤 Cliente | Carga condiciones contractuales de flete |
| 🗄️ Matriz de Costos | Elige entre modelo **Simple** (tarifas planas) o **Compleja** (P×Q granular por ítem) |

> **Nota**: La selección de la Matriz determina qué motor de costos portuarios se activa. La Matriz Compleja usa el Core Dispatcher con el motor dedicado por terminal.

### Motor de Cálculo Automático
El recálculo se **dispara automáticamente** cada vez que el usuario cambia cualquier input:

```
Δt Navegación  = Distancia NM entre puertos ÷ Velocidad buque (knots)
Costo Bunker   = Δt días × Consumo MT/día × Precio VLSFO vigente
Costos Puerto  = P×Q calculados por motor dedicado (vía Core Dispatcher)
```

### P&L Desglosado (Resultado)
```
┌────────────────────────────────────────────────┐
│  + Ingreso Flete               USD             │
│  ─ Bunker VLSFO (navegación)   USD             │
│  ─ Bunker LSMGO (puerto)       USD             │
│  ─ Gastos Puerto Carga         USD             │
│  ─ Gastos Puerto Descarga      USD             │
│  ══════════════════════════════════            │
│  = P&L NETO                    USD             │
│  = P&L / MT                    USD/MT          │
│  = P&L / DWT                   USD/DWT         │
└────────────────────────────────────────────────┘
```

### Visualización y Acciones
| Componente | Función |
|---|---|
| 📋 Tabla Desglose | Cada ítem de costo con fórmula y valor |
| 📐 Análisis Sensibilidad | ¿Qué pasa si el flete sube/baja X USD/MT? |
| 📦 Exportar | Envía el viaje a la Matriz Financiera |

---

## 🔑 Diferencia con el Multicotizador

| Característica | Multicotizador | Voyage Ledger |
|---|---|---|
| Propósito | Multi-cliente simultáneo | Un viaje en profundidad |
| Análisis Sensibilidad | ❌ | ✅ |
| Modelo Costos | Automático | Elegible (Simple / Compleja) |
| Exportación | ➔ Matriz Financiera | ➔ Matriz Financiera |

---

## 📁 Archivos Relacionados
- **Script flowchart**: [FLOWCHART_VOYAGE_LEDGER.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/Flow.Charts/FLOWCHART_VOYAGE_LEDGER.py)
- **Componente SW**: `src/components/CommercialForecast/VoyageLedgerFinal.tsx`
- **Anterior**: [[Flowchart.Multicotizador]]
- **Siguiente**: [[Flowchart.Matriz.Financiera]]
