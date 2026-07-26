# ESTRATEGIA Y ARQUITECTURA DEL MÓDULO ETL (FORECAST VS EJECUCIÓN REAL)

> **NAVIERA PETRAL S.A.**  
> **Módulo:** ETL & Conciliación de Viajes Reales (P&L Forecast vs P&L Real)  
> **Flota Propietaria:** B/T Moquegua & B/T Tablones  

---

## 1. OBJETIVO DEL MÓDULO ETL

El módulo **ETL (Extract, Transform, Load)** representa la fase final del ecosistema PETRAL SHIPPING.SOFT V2.5. Su propósito central es **medir la precisión del modelo comercial (Forecast)** contrastándolo directamente contra los desembolsos e ingresos de la **Ejecución Real** de cada viaje.

```
┌──────────────────────────┐       ┌──────────────────────────┐
│  MODELO FORECAST (SPOT)  │       │  EJECUCIÓN REAL (EXCEL)  │
│  - Flete Estimado        │       │  - Liquidaciones Reales  │
│  - Búnker Estimado       │  VS   │  - Búnker Real Pagado    │
│  - Gastos P×Q Estimados  │       │  - Facturas de Agencia   │
└────────────┬─────────────┘       └────────────┬─────────────┘
             │                                  │
             └───────────────┬──────────────────┘
                             ▼
              ┌────────────────────────────┐
              │   MATRIZ FINANCIERA P&L    │
              │  (Pronosticado vs Real)    │
              └────────────────────────────┘
```

---

## 2. ETAPAS DEL PROYECTO ETL

### Fase 1: Ingesta y Desglose Campo por Campo
- Recepción de imágenes y archivos Excel de liquidaciones reales de las naves **B/T Moquegua** y **B/T Tablones**.
- Mapeo y desmenuzado de cada campo: Ingresos por flete, demurrages cobrados, consumos reales de IFO/MDO, facturas de agenciamiento y practicaje/remolque.

### Fase 2: Motor Parser ETL (Python Extractor)
- Creación de un script parser inteligente en Python/Node que interprete la estructura flexible de los Exceles de liquidación.
- Normalización de nombres de puertos, naves, fechas de zarpe/arribo y rubros contables.

### Fase 3: Tabla de Ejecución Real (`voyage_execution_real`)
- Diseño de la tabla en PostgreSQL / Supabase para almacenar la ejecución real por viaje (NVR), buque y ruta.

### Fase 4: Integración en Matriz Financiera (Voyage Ledger P&L)
- Habilitación de la funcionalidad en la pantalla de Matriz Financiera para conmutar entre **Vista Forecast**, **Vista Ejecución Real** y **Tablero Comparativo de Desviación (Variance)** a nivel de Venta y Profit Neto.
