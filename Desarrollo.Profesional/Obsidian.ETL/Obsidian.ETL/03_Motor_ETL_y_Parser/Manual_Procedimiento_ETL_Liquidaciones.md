# Manual de Procedimiento ETL: Ingesta y Normalización de Liquidaciones Reales de Flota

> **Proyecto**: PETRAL SMART DASHBOARD  
> **Módulo**: Obsidian ETL & Motor de Liquidaciones Reales  
> **Estado**: Estándar Operativo v1.0  
> **Fecha de Actualización**: 2026-07-26  

---

## 1. Propósito y Alcance

Este documento establece el procedimiento estándar e invariable para procesar, extraer, limpiar y normalizar los archivos Excel de **Liquidaciones Reales de Viaje** emitidos por los operadores de la flota (Jorge Neyra - JN y María Elena Castro - MEC).

Este circuito se ejecuta periódicamente cada vez que se cierran y liquidad nuevos viajes de la flota, asegurando la alimentación uniforme del Dashboard Financiero Comercial.

---

## 2. Reglas de Negocio e Identificación Obligatorias

### 2.1 Estandarización de Códigos de Viaje (`V.`)
- **Regla**: Todos los códigos de viaje de la flota PETRAL sin excepción deben ser estandarizados con el prefijo mayúscula **`V.`**.
- **Formato**:
  - B/T Tablones (Operado por JN): `V.038`, `V.039`, `V.040` ... `V.052` (se aplica padding a 3 dígitos numéricos).
  - B/T Moquegua (Operado por MEC): `V.761`, `V.762`, `V.763` ... `V.777`.

### 2.2 Homologación Estricta de Búnker (`MGO` $\rightarrow$ `MDO`)
- **Regla del Proyecto PETRAL**: En todo el ecosistema de software PETRAL, las siglas **MGO** (Marine Gas Oil / Diesel Marino) que figuren en facturas, vales de consumo o cotizaciones equivalen y se registran unificadamente bajo el estándar **MDO**.

---

## 3. Matriz de Extracción y Transformación de Datos

Al procesar una planilla de liquidación Excel, la función de ETL extrae los siguientes 8 indicadores clave:

| Indicador Financiero / Operativo | Campo en BD / JSON | Descripción |
| :--- | :--- | :--- |
| **Profit Real (P/L)** | `net_profit_usd` | Utilidad o Pérdida neta real del viaje en $USD. |
| **TCE Real ($/día)** | `tce_usd_day` | Time Charter Equivalent real diario ($USD/Día). |
| **Gross Revenue** | `gross_revenue_usd` | Facturación bruta total ingresada por el flete del viaje. |
| **Toneladas de Carga** | `cargo_quantity_mt` | Carga real transportada en Toneladas Métricas (MT). |
| **Gastos Portuarios** | `port_costs_usd` | Total desembolsado por agenciamiento, practicaje, remolque y tarifas portuarias. |
| **Gastos de Búnker** | `bunker_costs_usd` | Costo de consumo de combustible (VLSFO y MDO/MGO homologado). |
| **Yield de Flete** | `freight_rate_usd` | Tarifa de flete cobrada por tonelada ($USD/MT). |
| **Duración Total** | `total_duration_days` | Días totales de viaje (Navegación + Espera + Operaciones en Puerto). |

---

## 4. Clasificación Cronológica por Meses

Los viajes liquidados se agrupan en su mes de ejecución real respetando el siguiente mapeo cronológico continuo:

- **2026-01 (ENE 26)**: Viajes ejecutados en Enero 2026 (`V.038`, `V.039`, `V.040`, `V.761`, `V.762`).
- **2026-02 (FEB 26)**: Viajes ejecutados en Febrero 2026 (`V.041`, `V.042`, `V.043`, `V.763`, `V.764`, `V.765`).
- **2026-03 (MAR 26)**: Viajes ejecutados en Marzo 2026 (`V.044`, `V.045`, `V.766`, `V.767`, `V.768`).
- **2026-04 (ABR 26)**: Viajes ejecutados en Abril 2026 (`V.046`, `V.047`, `V.769`, `V.770`, `V.771`).
- **2026-05 (MAY 26)**: Viajes ejecutados en Mayo 2026 (`V.048`, `V.049`, `V.050`, `V.772`, `V.773`, `V.774`).
- **2026-06 (JUN 26)**: Viajes ejecutados en Junio 2026 (`V.051`, `V.052`, `V.775`, `V.776`, `V.777`).

---

## 5. Flujo de Re-Ingesta para Nuevas Liquidaciones

Cuando el equipo de operaciones entregue nuevas liquidaciones Excel:

1. Guardar el archivo Excel en la carpeta receptora de ETL: `Exceles.Petral/PORT.COSTS.PATRICIA/`
2. Correr el parser de actualización de estado real.
3. Verificar que el código de viaje contenga la letra mayúscula **`V.`**.
4. Confirmar que la compilación del Frontend reconozca el nuevo viaje dentro de su correspondiente mes cronológico.
