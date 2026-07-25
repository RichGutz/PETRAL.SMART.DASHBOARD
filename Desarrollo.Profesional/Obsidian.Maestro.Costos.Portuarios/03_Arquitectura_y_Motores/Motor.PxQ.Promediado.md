# ⚙️ Motor P×Q Promediado (Forecast & Proforma Dinámica)

> **Ubicación en Bóveda**: `Obsidian.Maestro.Costos.Portuarios/03_Arquitectura_y_Motores/Motor.PxQ.Promediado.md`  
> **Backend Python**: `Geeksoft_Engine/backend/port_engines/core.py`  
> **Componente Frontend**: `Geeksoft_Frontend/src/components/PortCosts/PxQPdfQuadViewer.tsx`  
> **Propósito**: Resolver la incertidumbre de la fecha/hora exacta de maniobra en la proformación comercial mediante la generación de 4 escenarios en PDF (2×2: Mínimos vs Máximos) y el promediado automático para la Matriz Financiera.

---

## 🎯 1. Problema de la Proforma sin Fecha/Hora Fija

Al proformar viajes futuros en el Forecast Comercial o Multicotizador:
- Se conoce el buque (`LOA`, `GRT`, `DWT`), puerto y terminal.
- Se conoce el volumen $Q$ (MT a cargar/descargar).
- **Incertidumbre**: No se conoce la fecha y hora exacta de entrada/salida. Tarifas como practicaje, remolcadores, lanchas y amarre aplican recargos del **25% al 50%** en horario nocturno (18:00h - 07:00h), domingos y feriados.

---

## 📐 2. Solución: Layout Dual de 4 PDFs (2 Filas × 2 Columnas)

El motor simula internamente 4 cotizaciones y las presenta organizadas en un panel 2x2:

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│ 📄 PDF 1: Carga Mínima (Horario Normal)       │ 📄 PDF 2: Descarga Mínima (Horario Normal)   │
│   • Titulo: [NIVEL BAJO - HORARIO ORDINARIO] │   • Titulo: [NIVEL BAJO - HORARIO ORDINARIO] │
│   • Maniobra Diurna Ordinaria (07:00-18:00h)  │   • Maniobra Diurna Ordinaria (07:00-18:00h)  │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ 📄 PDF 3: Carga Máxima (Horario Recargo)      │ 📄 PDF 4: Descarga Máxima (Horario Recargo)  │
│   • Titulo: [NIVEL ALTO - HORARIO RECARGO]   │   • Titulo: [NIVEL ALTO - HORARIO RECARGO]   │
│   • Maniobra Nocturna/Feriado (00:00-07:00h) │   • Maniobra Nocturna/Feriado (00:00-07:00h) │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 📊 3. Regla de Promediado Dinámico para la Matriz

$$\text{Costo Carga Proforma} = \frac{\text{PDF 1 (Carga Mínima) } + \text{ PDF 3 (Carga Máxima)}}{2}$$

$$\text{Costo Descarga Proforma} = \frac{\text{PDF 2 (Descarga Mínima) } + \text{ PDF 4 (Descarga Máxima)}}{2}$$

$$\text{Gasto Portuario Asignado a Matriz} = \text{Costo Carga Proforma} + \text{Costo Descarga Proforma}$$

---

## 🧮 4. Desglose Explícito de la Grilla Uniforme de 6 Variables $Q$

Las variables $Q$ provienen 100% automáticamente del **Maestro de Puertos y Terminales** y del **Maestro de Buques**:

1. **1. Ritmo Operativo ($Q_{\text{rate}}$)**: Ritmo nominal del terminal (ej. $500\text{ MT/h}$ Carga Callao APM, $350\text{ MT/h}$ Descarga Matarani Tisur).
2. **2. Componente Operativo ($Q_{\text{op}}$)**: $\frac{\text{Volumen MT}}{\text{Ritmo MT/h}}$ (ej. $\frac{13500}{500} = 27.0\text{ hrs}$).
3. **3. Componente Fijo ($Q_{\text{fijo}}$)**: Horas fijas de maniobra registradas en el Maestro (`4.0 hrs`: Atraque/Amarre $1.5\text{h}$ + Inspección Sanidad/APN $1.0\text{h}$ + Desamarre/Zarpe $1.5\text{h}$).
4. **4. Permanencia Total ($Q_{\text{total}}$)**: $Q_{\text{op}} + Q_{\text{fijo}}$ (ej. $27.0\text{h} + 4.0\text{h} = 31.0\text{ hrs}$).
5. **5. Remolques ($Q_{\text{tugs}}$)**: $2\text{ IN} / 2\text{ OUT}$.
6. **6. Nave ($Q_{\text{buque}}$)**: Eslora `LOA` (m) y Arqueo `GRT` (TRB).

---

## 🗓️ 5. Cronogramas Narrativos Realistas en los PDFs

- **Escenario Mínimo (Office Hours / Días Útiles)**:
  - **Atraque**: Lunes 07:00 hrs
  - **Desatraque**: Martes 14:00 hrs ($31.0\text{ hrs}$ Carga) / Miércoles 01:36 hrs ($42.6\text{ hrs}$ Descarga).
  - **Régimen**: $100\%$ Horario Ordinario Diurno de Oficina (sin recargos).
- **Escenario Máximo (Domingo / Día Feriado Overtime)**:
  - **Atraque**: Domingo 07:00 hrs (Día Dominical)
  - **Desatraque**: Lunes Feriado 14:00 hrs ($31.0\text{ hrs}$ Carga) / Lunes Feriado 01:36 hrs ($42.6\text{ hrs}$ Descarga).
  - **Régimen**: Recargo Nocturno / Dominical / Feriado ($+25\%$ a $+50\%$ Overtime & Regla Casino).

---

## 🔀 6. Diagrama de Flujo de Arquitectura (Flowchart P×Q)

```mermaid
graph TD
    classDef master fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef calc fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef pdf fill:#ffffff,stroke:#059669,stroke-width:2px,color:#065f46;
    classDef matrix fill:#dcfce7,stroke:#16a34a,stroke-width:3px,color:#14532d;

    subgraph MAESTROS["1. FUENTES DE DATOS DE ENTRADA (MAESTROS)"]
        MP["Maestro de Tarifas P<br/>(port_costs_matrix)"]:::master
        MQ["Maestro de Puertos & Terminales Q<br/>(ports_master)"]:::master
        MB["Maestro de Buques Q_nave<br/>(LOA, GRT, DWT)"]:::master
    end

    subgraph ENGINE["2. MOTOR DE EVALUACIÓN Y PARÁMETROS Q"]
        QCOMP["Desglose Variables Q:<br/>1. Ritmo MT/h<br/>2. Q_op (MT/Ritmo)<br/>3. Q_fijo (1.5h Amarre + 1.0h Insp + 1.5h Desamarre)<br/>4. Perm. Total (Q_op + Q_fijo)<br/>5. Remolques (2 IN / 2 OUT)"]:::calc
    end

    subgraph SCENARIOS["3. EVALUACIÓN PARALELA DE 4 ESCENARIOS (2x2)"]
        PDF1["📄 PDF 1: Carga Mínima<br/>(Lunes 07:00h Office Hours)"]:::pdf
        PDF2["📄 PDF 2: Carga Máxima<br/>(Domingo 07:00h Overtime/Casino)"]:::pdf
        PDF3["📄 PDF 3: Descarga Mínima<br/>(Lunes 07:00h Office Hours)"]:::pdf
        PDF4["📄 PDF 4: Descarga Máxima<br/>(Domingo 07:00h Overtime/Casino)"]:::pdf
    end

    subgraph CONSOLIDATION["4. MATRIZ FINANCIERA VOYAGE PROFORMA"]
        CARGA_AVG["Promedio Carga:<br/>(PDF 1 + PDF 2) / 2"]:::calc
        DISCHARGE_AVG["Promedio Descarga:<br/>(PDF 3 + PDF 4) / 2"]:::calc
        TOTAL_MATRIZ["💰 TOTAL VOYAGE PROFORMA P×Q MATRIZ<br/>(Promedio Carga + Promedio Descarga)"]:::matrix
    end

    MP --> QCOMP
    MQ --> QCOMP
    MB --> QCOMP

    QCOMP --> PDF1
    QCOMP --> PDF2
    QCOMP --> PDF3
    QCOMP --> PDF4

    PDF1 --> CARGA_AVG
    PDF2 --> CARGA_AVG
    PDF3 --> DISCHARGE_AVG
    PDF4 --> DISCHARGE_AVG

    CARGA_AVG --> TOTAL_MATRIZ
    DISCHARGE_AVG --> TOTAL_MATRIZ
```
