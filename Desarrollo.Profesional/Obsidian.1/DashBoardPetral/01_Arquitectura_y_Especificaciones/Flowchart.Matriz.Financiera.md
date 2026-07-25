# 📋 Flowchart: Matriz Financiera (Forecast Comercial)
> **Herramienta**: Forecast Comercial — Matriz Financiera
> **Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_MATRIZ_FINANCIERA.py`
> **SVG**: `Geeksoft_Frontend/public/FLOWCHART_MATRIZ_FINANCIERA.svg`
> **Visor Web**: Herramientas ➔ 🗺️ Flowchart del Sistema ➔ Tab "Matriz Financiera"

---

## 🎯 Propósito

La **Matriz Financiera** es el repositorio central del Forecast Comercial. Agrupa todos los viajes exportados desde el Multicotizador/Voyage Ledger en una **grilla mensual multi-cliente**, permitiendo análisis de P&L por cliente, por mes y por horizonte temporal.

---

## 🔄 Flujo de la Matriz Financiera

### Origen: Viajes Exportados
Cada viaje que el operador exporta desde el Multicotizador llega a la Matriz con:
- Cliente
- Ruta (Origen ➔ Destino)
- Fecha de Zarpe
- Q Carga (MT)
- P&L detallado (Ingreso / Bunker / Puertos / Neto)

### Estructura de la Grilla

```
           | ENE 2025 | FEB 2025 | MAR 2025 | ... |
───────────┼──────────┼──────────┼──────────┼─────┤
SHOUGANG   │ Viaje 1  │ Viaje 3  │          │     │
MARCOBRE   │          │ Viaje 2  │ Viaje 5  │     │
SPCC       │ Viaje 4  │          │ Viaje 6  │     │
───────────┴──────────┴──────────┴──────────┴─────┘
```

**Filas** = Clientes Comerciales
**Columnas** = Meses del horizonte de forecast
**Celdas** = Σ viajes del cliente en ese mes (con suma de P&L)

### Vistas Disponibles

| Tab Interno | Descripción |
|---|---|
| 📊 Matriz Financiera | Grilla interactiva editable por cliente/mes |
| 📈 Análisis Gráfico | Bar charts de P&L por cliente o por mes |
| 🧪 Auditoría Ledger | Desglose por viaje individual con rastro de cálculo |

### Acciones del Operador

| Acción | Descripción |
|---|---|
| 💾 Guardar | Snapshot del estado actual del Forecast |
| 📂 Cargar | Recuperar un Forecast guardado previo |
| 🔍 Filtrar | Por cliente, mes, buque o ruta |

### Salidas
- **📈 Export Excel** — Matriz completa con todos los detalles por ítem
- **🔍 Ir a Auditoría Dual** — Para validar un viaje específico contra la factura del armador

---

## 🔗 Posición en la Cadena

```
MULTICOTIZADOR / VOYAGE LEDGER
    │
    ▼ (Exportar Viaje)
MATRIZ FINANCIERA ──► ANÁLISIS GRÁFICO
    │               └► AUDITORÍA LEDGER
    ▼
AUDITORÍA DUAL P×Q
```

---

## 📁 Archivos Relacionados
- **Script flowchart**: [FLOWCHART_MATRIZ_FINANCIERA.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/Flow.Charts/FLOWCHART_MATRIZ_FINANCIERA.py)
- **Componente SW**: `src/pages/CommercialForecast/CommercialForecast_V1.tsx`
- **Anterior**: [[Flowchart.Voyage.Ledger]]
- **Siguiente**: [[Flowchart.Analisis.Grafico]]

