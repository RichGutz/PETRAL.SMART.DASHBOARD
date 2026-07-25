# ⚙️ Flowchart: Motor P×Q (Cálculo Granular de Gastos Portuarios)
> **Herramienta**: Motor P×Q de Gastos Portuarios (Core Dispatcher & Tarificadores Dedicados)
> **Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_MOTOR_PXQ.py`
> **SVG**: `Geeksoft_Frontend/public/FLOWCHART_MOTOR_PXQ.svg`
> **Visor Web**: Herramientas ➔ 🗺️ Flowchart del Sistema ➔ Tab "Motor P×Q"

---

## 🎯 Propósito

El **Motor P×Q** es el motor algorítmico granular responsable de calcular minuciosamente cada concepto de costo portuario (Agenciamiento, Practicaje, Remolcadores, Derechos Portuarios, Amarradores y Muellaje). Multiplica la tarifa base $P$ por la variable física o de volumen $Q$ (GRT, DWT, LOA, Horas, MT) según las reglas específicas de cada terminal marítimo de Perú, Chile y Ecuador.

---

## 🔄 Flujo Estricto de 5 Pasos (Vertical Top-to-Bottom)

### PASO 1 — Inputs Técnicos y Parámetros del Buque & Puerto
- **Datos Buque**: LOA (Eslora), GRT (Tonelaje Registro Bruto), DWT, Calado.
- **Datos Maniobra**: Puerto, Terminal Específico, Tipo de Operación (Carga vs Descarga).
- **Variables de Operación**: Q Carga (MT), Horas de Practicaje, Cantidad de Remolques, Días en Muelle.

### PASO 2 — Core Dispatcher y Matriz de Conceptos Portuarios
- El **Core Dispatcher** evalúa el par `Puerto × Terminal` y recupera las reglas activas desde `port_cost_concepts` y `port_costs_matrix`.
- Identifica las tarifas aplicables: Agenciamiento, Practicaje, Remolques, Derechos Portuarios, Uso de Muelle y Amarradores.

### PASO 3 — Motor Calculador Granular P×Q
```
⚙️ MOTOR CALCULADOR P×Q (USD)
────────────────────────────
• P (Precio Unitario / Tarifa por Regla Tarifaria)
• Q (Cantidad: TRB, LOA, Horas, MT, Maniobras)
• Sumatoria Granular = Σ (P_i × Q_i)
• Aplicación de Impuestos & Retenciones Locales
```

### PASO 4 — Interfaz en Pantalla, Layout 4 PDFs (2x2) & Promediado Dinámico

Para proformar sin conocer la fecha/hora exacta de la maniobra, el panel muestra **4 PDFs** en 2 filas y computa el promedio dinámico:

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│ 📄 PDF 1: Carga Mínima (Horario Normal)       │ 📄 PDF 2: Descarga Mínima (Horario Normal)   │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 📄 PDF 3: Carga Máxima (Horario Recargo)      │ 📄 PDF 4: Descarga Máxima (Horario Recargo)  │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

**Costo Proforma Matriz = Promedio [(PDF 1 + PDF 3) / 2] + [(PDF 2 + PDF 4) / 2]**

| Componente | Tipo de Reporte / Analítica | Descripción |
|---|---|---|
| 📄 **Panel 4 PDFs (2×2)** | 2 Filas × 2 Escenarios | Muestra en paralelo PDF Carga/Descarga Mínima (Diurno) y Máxima (Nocturno/Feriado) |
| 📊 **Promedio Dinámico** | Cifra Proforma para Forecast | Asigna a la Matriz Financiera el costo promedio entre el escenario base y el escenario recargado |
| 🔍 **Audit Trail (Rastro)** | Rastro de Regla Aplicada | Indica exactamente qué tabla, tarifa y parámetro generó cada cobro |

### PASO 5 — Integración y Salidas
- 💼 **Inyección a Multicotizador & Voyage Ledger**: Alimenta el P&L del viaje comercial en tiempo real.
- ⚖️ **Comparación en Auditoría Dual P×Q**: Valida la liquidación del sistema contra la factura real del armador o agente.

---

## 🔗 Posición en la Cadena (Flujo Vertical)

```
PASO 1: INPUTS BUQUE & OPERACIÓN (LOA, GRT, MT, TERMINAL)
    │
    ▼ (1. Inyecta Parámetros)
PASO 2: CORE DISPATCHER & REGLAS TARIFARIAS
    │
    ▼ (2. Evalúa Mínimo Diurno vs Máximo Nocturno)
PASO 3: SIMULACIÓN DUAL (PDF 1..4 & PROMEDIO P×Q)
    │
    ▼ (3. Layout 2x2 en Pantalla)
PASO 4: INTERFAZ 4 PDFs & PROMEDIO DINÁMICO
    │
    ▼ (4. Alimenta P&L Comercial)
PASO 5: MULTICOTIZADOR / VOYAGE LEDGER / AUDITORÍA DUAL
```


---

## 📁 Archivos Relacionados
- **Script flowchart**: [FLOWCHART_MOTOR_PXQ.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Boiler.Plate/Flow.Charts/FLOWCHART_MOTOR_PXQ.py)
- **Motor Backend**: `Geeksoft_Engine/backend/core/port_engine_dispatcher.py`
- **Anterior**: [[Flowchart.Multicotizador]]
- **Siguiente**: [[Flowchart.Voyage.Ledger]]
