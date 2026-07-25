# 💼 Flowchart: Multicotizador Excel
> **Herramienta**: Multicotizador de Viajes Comerciales
> **Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_MULTICOTIZADOR.py`
> **SVG**: `Geeksoft_Frontend/public/FLOWCHART_MULTICOTIZADOR.svg`
> **Visor Web**: Herramientas ➔ 🗺️ Flowchart del Sistema ➔ Tab "Multicotizador"

---

## 🎯 Propósito

El **Multicotizador** es la herramienta comercial principal del sistema PETRAL. Permite calcular en tiempo real el **P&L de un viaje marítimo** (Ingresos - Bunkers - Gastos Portuarios) para cualquier combinación de Buque × Ruta × Cliente × Fecha.

---

## 🔄 Flujo de 7 Pasos

### PASO 1 — Datos de Entrada del Operador
| Input | Fuente |
|---|---|
| 👤 Cliente | Maestro de Clientes (condiciones de flete) |
| 🚢 Buque | Maestro de Flota (LOA, DWT, consumos) |
| 🗺️ Ruta | Origen (Puerto/Terminal) ➔ Destino (Puerto/Terminal) |
| 📅 Fecha Zarpe + Q Carga (MT) | Manual |

### PASO 2 — Validación de Maestros
El sistema verifica que existan datos en:
- ✅ **Maestro de Flota** → LOA, GRT, DWT, Velocidad, Consumos
- ✅ **Maestro de Puertos** → Terminales y capacidades Q
- ✅ **Maestro de Distancias** → Distancia NM entre puertos
- ✅ **Precios Bunker** → Cotización VLSFO/LSMGO vigente

### PASO 3 — Motor Spot (Navegación & Bunkers)
```
Δt Navegación = Distancia NM ÷ Velocidad (knots)
Costo Bunker  = Δt días × Consumo MT/día × Precio USD/MT
Ingreso Bruto = Q Carga (MT) × Tarifa Flete (USD/MT)
```

### PASO 4 — Motores de Costos Portuarios (P×Q)
- **Core Dispatcher** identifica qué motor dedicado corresponde al puerto de carga y al de descarga.
- Cada motor calcula: Agenciamiento + Practicaje + Remolques + Derechos Portuarios en base a los parámetros del buque (LOA, GRT, DWT) y el tipo de operación.

### PASO 5 — Voyage P&L Calculator
```
P&L Neto = Ingreso Flete
         − Costo Bunker (VLSFO + LSMGO)
         − Gastos Puerto Carga
         − Gastos Puerto Descarga
```

### PASO 6 — Visualización en Pantalla
| Componente | Descripción |
|---|---|
| 📋 Tabla Desglose | Cada ítem de costo con su valor en USD |
| 🔍 Rastro Auditoría | Qué motor y qué regla calculó cada ítem |
| 📦 Botón Exportar | Envía el viaje a la Matriz Financiera |

---

## ⚙️ Regla de Negocio: Modalidades de Cálculo de Costos Portuarios

El **Multicotizador** contempla dos modalidades para determinar los gastos portuarios del viaje:

1. 📌 **Método 1: Modelo Estático (Por Defecto)**:
   - **Fuente**: Maestro de Gastos Portuarios (tabla `port_cost_static`).
   - **Lógica**: Retorna una cifra fija plana basada únicamente en el par `Puerto × Buque`.
   - **Características**: Independiente de la fecha de maniobra, horas de permanencia o el volumen exacto de toneladas (MT). Es una consulta simple rápida.

2. ⚙️ **Método 2: Motor Dinámico P×Q (Cálculo Complejo por Desarrollar/Conectar)**:
   - **Fuente**: `Core Dispatcher` ➔ `port_engines`.
   - **Lógica**: Desglose minucioso tarifa por tarifa ($P \times Q$) evaluando parámetros del buque (LOA, GRT, DWT), toneladas exactas cargadas/descargadas, horas de permanencia, prácticos, remolques y terminal portuario específico.

---

## 💡 Regla de Negocio: Doble Funcionalidad de Guardado (Activos vs. Prospectos)


El **Multicotizador** cuenta con dos modalidades de persistencia diferenciadas según el destino seleccionado por el operador:

1. 📌 **Guardado en PROSPECTOS ➔ Registra una COTIZACIÓN (Snapshot Estático)**:
   - **Tabla Supabase**: `routes_quotes` (o `routes_prospects`).
   - **Naturaleza**: Es una **"foto del momento"** estática e inmutable.
   - **Comportamiento**: Guarda el movimiento geográfico de un buque específico bajo las condiciones comerciales y precios de bunker fijados en esa fecha exacta.

2. 🔄 **Guardado en ACTIVOS ➔ Registra una RUTA (Desplazamiento Dinámico / Vivo)**:
   - **Tabla Supabase**: `routes_clients`.
   - **Naturaleza**: Registra una **Ruta activa y viva** (desplazamiento geográfico dinámico).
   - **Comportamiento**: No es una foto fija; sus cifras **varían dinámicamente en el tiempo** al recalcularse en función de las fluctuaciones del precio del bunker y la cláusula de ajuste **BAF (Bunker Adjustment Factor)** *(funcionalidad BAF por desarrollar)*.

---

## 🔗 Conexiones con Otros Módulos

```
Maestro de Flota ──────────────────────┐
Maestro de Distancias ─────────────────┤──► SPOT CALCULATOR
Maestro de Rutas ──────────────────────┘

Maestro de Puertos ────────────────────┐
Maestro de Gastos Portuarios ──────────┤──► CORE DISPATCHER ──► MOTORES P×Q
Maestro de Contratos ──────────────────┘

Precios Bunker ────────────────────────────► BUNKER ENGINE

RESULTADO ─────────────────────────────────► MATRIZ FINANCIERA
                                             ├─ PROSPECTOS ➔ routes_quotes (Cotización)
                                             └─ ACTIVOS ────➔ routes_clients (Ruta)
```

---

## 📁 Archivos Relacionados
- **Script flowchart**: [FLOWCHART_MULTICOTIZADOR.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/Flow.Charts/FLOWCHART_MULTICOTIZADOR.py)
- **Componente SW**: `src/components/CommercialForecast/MultiCotizadorExcel.tsx`
- **Siguiente paso**: [[Flowchart.Matriz.Financiera]]

