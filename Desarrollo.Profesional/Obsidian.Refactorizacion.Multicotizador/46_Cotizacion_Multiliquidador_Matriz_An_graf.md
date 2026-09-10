# Plan de Alcance, Memoria Aritmética y Especificación Técnica: Módulo Voyage Liquidator, Matriz de Ejecución y Dashboard Comparativo (Presupuesto vs. Real)

> **Documento:** `46_Cotizacion_Multiliquidador_Matriz_An_graf.md`  
> **Proyecto:** PETRAL SMART DASHBOARD — Ecosistema Comercial Delfos  
> **Fuente:** Requerimiento Oficial de Audio (`cotizacion.multiliquidador.matriz.liq.AN.graf.comparativo.ogg`)  
> **Fecha:** 10 de Septiembre de 2026  
> **Estado:** Documento Maestro de Alcance, Aritmética Operacional & Propuesta Económica  

---

## 1. Resumen Ejecutivo y Visión General

El cliente ha solicitado el cierre integral del ciclo comercial y operativo marítimo: pasar de la **Planificación y Cotización Teórica (Antes del Zarpe)** al **Control Financiero y Liquidación Auditada en Caja (Post-Viaje)**, culminando en un **Dashboard de Variaciones Macro (Budget vs. Actuals)**.

```
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│       VOYAGE CALCULATOR (Multicotizador)     │       │       VOYAGE LIQUIDATOR (Multi-Liquidador)   │
│            [MODELO PREVIO AL ZARPE]          │       │            [MODELO POST-VIAJE REAL]          │
│  - Tarifa proforma por TM                    │       │  - B/L Date y Tonelaje Real Certificado      │
│  - Distancias de cartas y días teóricos      │       │  - Sondas de Tanques: ROB Inicial vs Final   │
│  - Precios de búnker de catálogo             │       │  - Eventos de Shifting (Desatraques Muelle)  │
│  - Costos portuarios proforma (PDA)          │       │  - Gastos Portuarios Finales (FDA)           │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
                       ▼                                                      ▼
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│          MATRIZ FORECAST COMERCIAL           │       │         MATRIZ DE VIAJES EJECUTADOS          │
│       (Presupuesto Anual Consolidado)        │       │       (Ledger Cronológico de Ejecución)      │
└──────────────────────┬───────────────────────┘       └──────────────────────┬───────────────────────┘
                       │                                                      │
                       └──────────────────────────┬───────────────────────────┘
                                                  ▼
       ┌─────────────────────────────────────────────────────────────────────────────┐
       │             DASHBOARD GRÁFICO COMPARATIVO MACRO (FORECAST VS. REAL)         │
       │                                                                             │
       │  1. Venta Total Facturada ($)             4. Margen Operativo (%)           │
       │  2. Toneladas Transportadas (TM)          5. Días Ocupados / Navegados (d)  │
       │  3. Resultado Neto P&L Real ($)                                             │
       └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Guía Conceptual: Multicotizador vs. Multi-Liquidador

| Dimensión | MULTICOTIZADOR (Voyage Calculator) | MULTILIQUIDADOR (Voyage Liquidator) |
| :--- | :--- | :--- |
| **Momento de Uso** | **Antes del Zarpe** (Fijación de tarifa y oferta comercial). | **Después del Zarpe / Fin de Viaje** (Cierre contable y auditoría). |
| **Pregunta Clave** | *¿A qué tarifa debo cotizar para ganar el margen proyectado?* | *¿Cuánto dinero y utilidad neta ingresó realmente a caja?* |
| **Carga / Tonelaje** | Capacidad teórica o requerimiento comercial (ej. $14,250\,\text{TM}$). | Carga oficial certificada en el Conocimiento de Embarque (**Bill of Lading**). |
| **Duración del Viaje** | Días teóricos calculados por distancia, velocidad y ritmos de bombeo. | Horas y días reales transcurridos desde el inicio oficial hasta el fin de viaje. |
| **Consumo de Búnker** | Estimación teórica: $\text{Días} \times \text{Consumo Diario (t/d)}$. | Medición real por **diferencia de sondas físicas en tanques (ROBs)**. |
| **Eventos Imprevistos** | No contemplados en proforma base. | **Shifting** (desatraque forzoso a bahía), demoras portuarias y **Demurrage**. |
| **Costos Portuarios** | Cotizaciones proforma estándar de agencia (**PDA**). | Facturación final auditada de servicios portuarios (**FDA**). |
| **Resultado Financiero** | **P&L Proforma** (Margen estimado de contribución). | **P&L Real en Caja** (Utilidad neta auditada e irrevocable). |

---

## 3. La Memoria Aritmética Explicativa del Multicotizador

El motor central del Multicotizador ejecuta una auditoría analítica pierna por pierna. Esta lógica es la base matemática sobre la cual se monta la liquidación:

```text
══════════════════════════════════════════════════════════════════════════════════════════════════════
📋 [INPUTS Y VARIABLES DE ORIGEN DE CÁLCULO - CARDS MAESTROS]:
  • CARD 1 (RUTAS):                 Itinerario: ILO ➔ MARCONA ➔ CALLAO | Dist. Total: 940.0 NM | Weather Factor: 3.0% (0.03)
  • CARD 2 (BUQUES):                Vessel: DON MOQUEGUA | Speed: 11.5 kts | Cons. Sea IFO: 12.0 t/d | Cons. Idle IFO: 1.5 t/d | TCE Requerido: $4,800.00/d
  • CARD 3 (BÚNKER):                Precio IFO: $680.00/t | Precio MDO: $950.00/t | Consumo Est.: 35.80 t IFO / 4.10 t MDO | BAF Baseline: $430.00/t
  • CARD 4 (CONTRATOS & COMERCIAL): Cliente: SPCC | Q: 14,250 MT | Freight Base: $15.00/MT | Ritmo Carga: 500 T/h | Ritmo Desc: 345 T/h | Comisiones: Address 0.0% / Broker 0.0%
  • CARD 5 (PUERTOS & AGENCIA):     Agencia Carga (ILO): $15,000.00 USD | Agencia Descarga (CALLAO): $18,500.00 USD | Total Port Costs: $33,500.00 USD
──────────────────────────────────────────────────────────────────────────────────────────────────────
  ┌──────────────────────────────────────────────────────────────────────────────────────────────────
  │ 📍 RESUMEN CONSOLIDADO: Distancia 940.0 NM | Días Totales 6.42d (3.34d Mar + 3.08d Puerto)
  │ ⛽ Búnker Total:  $28,239.00 USD (35.80 t IFO | 4.10 t MDO)
  │ ⚓ Puerto Total:  $33,500.00 USD
  │ 💰 Ingreso Flete: $213,750.00 USD | PnL Neto: $121,195.00 USD | TCE: $6,350.00 USD/Día
  ├──────────────────────────────────────────────────────────────────────────────────────────────────
  │ 🔍 ARITMÉTICA EXPLICATIVA Y ORIGEN DE LOS DÍAS (MAR VS PUERTO):
  │
  │   • PIERNA #1 [BALLAST]: ILO ➔ MARCONA | Distancia: 280.0 NM
  │       🌊 Días de Mar (1.04d): [280.0 NM × (1 + 3.0% WF)] / [11.5 kts × 24h] = 1.04 Días
  │          ↳ Búnker Mar: 1.04d × 12.0 t/d IFO × $680.00 = $8,486.40 USD
  │       ⚓ Días de Puerto: 0.00 Días (Pierna en Lastre)
  │       🔥 Búnker Total Pierna: $8,486.40 USD
  │
  │   • PIERNA #2 [LADEN]: MARCONA ➔ CALLAO | Distancia: 220.0 NM
  │       🌊 Días de Mar (0.82d): [220.0 NM × (1 + 3.0% WF)] / [11.5 kts × 24h] = 0.82 Días
  │          ↳ Búnker Mar: 0.82d × 12.0 t/d IFO × $680.00 = $6,691.20 USD
  │       ⚓ Días de Puerto (3.08d): Carga (14,250t / 500t/h / 24 = 1.19d) + Descarga (14,250t / 345t/h / 24 = 1.72d) + Overheads (0.17d) = 3.08 Días
  │          ↳ Búnker Puerto: 4.62 t IFO + 3.70 t MDO = $6,656.60 USD
  │       🔥 Búnker Total Pierna:  $6,691.20 + $6,656.60 = $13,347.80 USD
  │       🚢 Agencia Carga (MARCONA):   $15,000.00 USD
  │       🚢 Agencia Descarga (CALLAO): $18,500.00 USD
  │       💵 Ingreso Flete Leg:         $213,750.00 USD
  │
  │   • PIERNA #3 [BUNKERING / RETORNO]: CALLAO ➔ ILO | Distancia: 440.0 NM
  │       🌊 Días de Mar (1.48d): [440.0 NM × (1 + 3.0% WF)] / [11.5 kts × 24h] = 1.48 Días
  │          ↳ Búnker Mar: 1.48d × 12.0 t/d IFO × $680.00 = $12,076.80 USD
  │       ⚓ Días de Puerto (0.50d): Escala Técnica de Bunkering Callao (0.50d)
  │          ↳ Búnker Puerto: 0.75 t IFO + 0.60 t MDO = $1,080.00 USD
  │       🔥 Búnker Total Pierna:  $12,076.80 + $1,080.00 = $13,156.80 USD
  │       💵 Ingreso Flete Leg:          $0.00 USD
  └──────────────────────────────────────────────────────────────────────────────────────────────────
```

### 🧮 Fórmulas del Motor Teórico:
1. **Días de Mar por Pierna:**  
   $$\text{Días Mar} = \frac{\text{Distancia (NM)} \times (1 + \text{Weather Factor \%})}{\text{Velocidad (kts)} \times 24\,\text{h}}$$
2. **Días de Puerto por Pierna:**  
   $$\text{Días Puerto} = \left(\frac{\text{Carga (TM)}}{\text{Ritmo Carga (TM/h)} \times 24}\right) + \left(\frac{\text{Carga (TM)}}{\text{Ritmo Descarga (TM/h)} \times 24}\right) + \text{Esperas / Overheads (d)}$$
3. **Costo de Búnker:**  
   $$\text{Bunker Cost} = (\text{Días Mar} \times \text{Consumo Sea IFO} \times P_{\text{IFO}}) + (\text{Días Puerto} \times \text{Consumo Port IFO} \times P_{\text{IFO}}) + (\text{Días Totales} \times \text{Consumo MDO} \times P_{\text{MDO}})$$

---

## 4. Arquitectura y Nuevos Módulos de Liquidación

### 4.1. Módulo 1: Voyage Liquidator (Multi-Liquidador Post-Viaje)
Permite la sobreescritura de datos en caliente con recálculo instantáneo.

#### A. Campos de Captura Real:
- **`trip_no`**: Identificador correlativo del viaje por buque (ej. `DM-2026-042`).
- **`bl_date`**: Fecha oficial de emisión del *Bill of Lading*.
- **`actual_cargo_mt`**: Toneladas netas consignadas en el B/L.
- **`start_voyage` & `end_voyage`**: Fechas y horas reales de zarpe y término.
- **`bunker_init_ifo` / `bunker_final_ifo`**: Sondas iniciales y finales de IFO en tanques (*Initial/Final ROB*).
- **`bunker_init_mdo` / `bunker_final_mdo`**: Sondas iniciales y finales de MDO (*Initial/Final ROB*).

#### B. El Fenómeno de *Shifting* (Desatraque Forzoso en Muelle):
Cuando un barco habiendo atracado en muelle es obligado por la autoridad portuaria o el terminal a desatracar a bahía para dar prioridad a otro buque:
1. **Ingreso por Compensación ($):** El armador factura una compensación económica acordada (`+ shifting_revenue`).
2. **Tiempo Extra (Días):** Se incrementa la duración del viaje por las horas de espera fondeado (`+ shifting_hours / 24`).
3. **Búnker Adicional:** Se devenga consumo extra de MDO en generadores y maniobras auxiliares de desatraque/reatraque.

#### C. Ecuación de Liquidación Auditada:
$$\text{Gross Revenue Real} = (\text{Carga B/L} \times \text{Tarifa Flete}) + \text{Compensación Shifting} \pm \text{Demurrage/Despatch}$$
$$\text{Costo Búnker Real} = [(\text{ROB Init IFO} - \text{ROB Fin IFO}) \times P_{\text{IFO}}] + [(\text{ROB Init MDO} - \text{ROB Fin MDO}) \times P_{\text{MDO}}]$$
$$\text{P\&L Real en Caja} = \text{Gross Revenue Real} - \text{Costo Búnker Real} - \text{Gastos Puerto FDA} - (\text{Días Reales} \times \text{OPEX Diario})$$

---

### 4.2. Módulo 2: Matriz de Viajes Ejecutados (Ledger Cronológico)
Grilla interactiva tipo hoja financiera que lista y consolida cronológicamente la totalidad de viajes operados en el año (mes por mes), con sumatorias dinámicas de facturación, combustible, gastos de puerto y P&L neto.

---

### 4.3. Módulo 3: Dashboard Comparativo Macro (Forecast vs. Real)
> [!IMPORTANT]
> **Criterio de Agregación Macro en la Línea de Tiempo:**  
> Como en la práctica los buques y clientes pueden redistribuirse dinámicamente según disponibilidad de flota y ventanas de atraque, la comparación de control de gestión se realiza **agregada por mes sobre 5 Indicadores Clave**:

```
1. VENTA / FACTURACIÓN TOTAL ($)   ➔ Forecast ($) vs. Ejecutado Real ($) ➔ Desviación Δ%
2. VOLUMEN TRANSPORTADO (TM)       ➔ Presupuesto TM vs. B/L Real TM     ➔ Desviación Δ%
3. RESULTADO NETO P&L ($)          ➔ Utilidad Proforma vs. P&L Real     ➔ Desviación Δ%
4. MARGEN OPERATIVO (%)            ➔ % Margen Fcst vs. % Margen Real   ➔ Desviación Δpp
5. DÍAS OCUPADOS (Días)            ➔ Días Programados vs. Navegados     ➔ Desviación Δ Días
```

---

## 5. Entregables del Paquete en Carpeta `Cotizaciones/`

La carpeta [`Cotizaciones`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Cotizaciones) contiene:

```
C:\Users\rguti\PETRAL.SMART.DASHBOARD\Cotizaciones\
├── 📊 Plantilla_Voyage_Liquidator_Master.xlsx
│    ├── Pestaña 1: VOYAGE_CALCULATOR_UI      (Clon exacto de la UI del Multicotizador)
│    ├── Pestaña 2: VOYAGE_LIQUIDATOR_UI      (Clon exacto de la UI de Liquidación Real)
│    ├── Pestaña 3: MATRIZ_EJECUCION_LEDGER   (Bitácora anual de viajes ejecutados)
│    ├── Pestaña 4: COMPARATIVO_FORECAST_VS_REAL (Conciliación mensual de 5 indicadores)
│    └── Pestaña 5: GLOSARIO_Y_REGLAS        (Glosario técnico y reglas operativas)
│
├── 📄 PROPUESTA_Y_ALCANCE_VOYAGE_LIQUIDATOR_DELFOS.pdf
│    └── Documento ejecutivo formal para presentación al cliente con cronograma y costos.
│
├── 📝 Guia_Explicativa_Multicotizador_vs_MultiLiquidador.md
│    └── Resumen ejecutivo didáctico para el usuario y gerencia.
│
└── 📝 46_Cotizacion_Multiliquidador_Matriz_An_graf.md
     └── Especificación técnica y plan de arquitectura completo.
```

---

## 6. Cronograma y Propuesta Económica Modular

| Fase / Entregable | Alcance Técnico | Duración | Inversión (USD) |
| :--- | :--- | :---: | :---: |
| **Fase 1: Modelo Excel Maestro & Estructura BD** | Plantilla clon UI, glosario formulado y esquema de base de datos relacional. | 3 Días | $ 850.00 |
| **Fase 2: Motor Backend FastAPI de Liquidación** | Endpoints de cálculo de ROBs, shifting, B/L, demurrages y conciliación. | 5 Días | $ 1,450.00 |
| **Fase 3: Frontend Voyage Liquidator & Ledger** | Componente interactivo React con cálculo en caliente y grilla cronológica. | 6 Días | $ 1,750.00 |
| **Fase 4: Dashboard Comparativo (5 Indicadores)** | Gráficos superpuestos y análisis de variaciones ($\Delta\%$) mes a mes. | 4 Días | $ 1,150.00 |
| **Fase 5: Super Loop QC E2E & Deploy VPS** | Certificación con datos reales, auditoría y puesta en producción VPS. | 2 Días | $ 600.00 |
| **TOTAL INVERSIÓN PROYECTO** | **Solución Integral Llave en Mano** | **20 Días** | **$ 5,800.00** |

---
*Documento maestro aprobado y registrado en el repositorio institucional.*
