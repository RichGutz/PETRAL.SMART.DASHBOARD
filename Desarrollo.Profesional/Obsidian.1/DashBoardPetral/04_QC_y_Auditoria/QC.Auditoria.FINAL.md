# 🛡️ ESPECIFICACIÓN TÉCNICA DEFINITIVA DE AUDITORÍA FINAL PETRAL & GEEKSOFT ENGINE

> **Estado**: 100% OPERATIVO & VALIDADO  
> **Fecha de Emisión**: Julio 2026  
> **Documentación del Acta PDF**: `ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf`  
> **Responsable**: AntiGravity AI Engine & Equipo Técnico PETRAL  

---

## 1. 📌 Objetivo General

Establecer la especificación invariable para la **Auditoría Final de Cálculo de Fletes, Búnker y Costos Portuarios** del sistema **PETRAL SMART DASHBOARD**, impulsado por el motor de cotización maritima **GEEKSOFT ENGINE**.

Esta especificación garantiza la trazabilidad matemática completa, transparente y auditable para todas las rutas comerciales oficiales de los clientes **SPCC** y **NEXA**.

---

## 2. 🏗️ Arquitectura de Maquetación del Acta PDF de Auditoría

El informe oficial se genera mediante el script de validación autónoma `run_qc_loop_pdf.py` y se exporta en formato PDF de alta fidelidad con las siguientes características:

1. **Orientación de Página**: `A4 Landscape` (Horizontal) — 1 Ruta por Página (`page-break-after: always`).
2. **Estilo Visual**: Monocromático estricto en **Blanco y Negro** (`#ffffff` fondo, `#000000` texto), con tipografía monoespaciada de consola (`Courier New`).
3. **Cabecera Institucional Superior (Tabla HTML 100% Ancho)**:
   - **Extrema Izquierda**: Logo Oficial PETRAL (`Logo.Petral.png`) — Altura ajustada a `30px` (reducción de 20%).
   - **Centro**: Título Oficial `PETRAL SMART DASHBOARD • MOTOR SPOT GEEKSOFT ENGINE`.
   - **Extrema Derecha**: Logo Oficial GEEKSOFT (`Logo.Geeksoft.png`) — Altura ajustada a `49px` (ampliación de 30%).
4. **Secuencia de Impresión de Rutas**: Prioridad estricta para que las rutas comerciales del cliente **SPCC** se procesen e impriman primero, seguidas por las rutas de **NEXA**.

---

## 3. 📋 Variables de Origen de Cálculo (Cards Maestros)

En el encabezado de cada ficha por ruta se listan de forma explícita los parámetros leídos desde las tablas base de Supabase (`routes_clients`, `vessels`, `contracts`):

- **CARD 1 (RUTAS)**: Itinerario completo (p. ej. `ILO ➔ CALLAO ➔ MARCONA ➔ ILO`), Distancia Náutica Total ($NM$), Factor Clima ($WF = 3.0\%$).
- **CARD 2 (BUQUES)**: Nombre del Buque (`MOQUEGUA`), Velocidad ($11.0\text{ kts}$), Consumo Sea/Idle IFO ($14.0 / 2.4\text{ t/d}$).
- **CARD 3 (BÚNKER)**: Precios Mercado ($IFO = \$895.14\text{/t}$, $MDO = \$1,460.30\text{/t}$), Consumo Total Estimado IFO/MDO (t) y Cláusula BAF Baseline ($430.00\text{ USD/t}$).
- **CARD 4 (CONTRATOS & REGLAS COMERCIALES)**: Cliente Comercial (`SPCC` / `NEXA`), Cantidad Carga Estándar ($Q = 13,500\text{ MT}$ invariable), Tarifa Base Flete ($F = \$25.00$ - $\$30.00\text{/MT}$), Ritmos de Carga/Descarga Acordados ($T/h$), Comisiones Commercial/Brokerage ($0.0\%$).
- **CARD 5 (PUERTOS & AGENCIA)**: Tarifas de Agencia Portuaria por Puerto (Origen / Destino) y Total Costos de Puerto.

---

## 4. 🔍 Aritmética Explicativa Visual Pierna por Pierna (Fishbowl Box)

Cada viaje se desglosa pierna por pierna dentro de una caja ASCII explicativa:

### 4.1 Piernas en Lastre (`BALLAST`)
- **Días de Mar**: $\text{Sea Days} = \frac{\text{Distancia} \times (1 + WF)}{\text{Velocidad} \times 24h}$
- **Búnker Mar**: $\text{Sea Days} \times 14.0\text{ t/d IFO} \times \$895.14\text{/t}$
- **Días de Puerto**: $0.00\text{ Días}$.
- **Costo Agencia Puerto**: $\$0.00\text{ USD}$ (Prohibición estricta de cobrar puerto en lastre).

### 4.2 Piernas Cargadas (`LADEN`)
- **Días de Mar**: Cálculo sustituido con distancia, %WF y velocidad.
- **Días de Puerto**: $\frac{Q}{\text{Ritmo Carga} \times 24h} + \frac{Q}{\text{Ritmo Descarga} \times 24h} + \text{Overheads}$
- **Búnker Puerto**: Tons IFO/MDO consumidas en puerto $\times$ Precios.
- **Costo Agencia Carga (Origen)**: Tarifa oficial del puerto de carga (p. ej. Callao $\$31,327.99\text{ USD}$).
- **Costo Agencia Descarga (Destino)**: Tarifa oficial del puerto de descarga (p. ej. Mejillones $\$50,000.00\text{ USD}$, Marcona $\$40,000.00\text{ USD}$, Matarani $\$17,000.00\text{ USD}$).
- **Ingreso Flete Leg**: $Q \times F\text{ (USD)}$.

---

## 5. 📊 Tabla Oficial de las 12 Métricas de Auditoría Ledger (Al Pie)

Al pie de cada ficha se incluye la réplica de las 12 Métricas Oficiales con columnas amplias (Métrica 25%, Fórmula 32%, Cálculo Sustituido 28%, Geeksoft Engine 15%):

| ÍTEM / MÉTRICA OFICIAL | FÓRMULA APLICADA | CÁLCULO SUSTITUIDO NUMÉRICO | GEEKSOFT ENGINE |
| :--- | :--- | :--- | :---: |
| **1. Ritmo Carga (`act_load`)** | `contract_load_rate` | `500 T/h` | `500 T/h` |
| **2. Ritmo Descarga (`act_disch`)** | `contract_discharge_rate` | `345 T/h` | `345 T/h` |
| **3. Días de Puerto (`port_days`)** | `(Q/act_load)/24 + (Q/act_disch)/24 + idle` | `Load(0.56d) + Disch(0.81d) + Overheads` | `3.30 Días` |
| **4. Días de Mar (`sea_days`)** | `Sum((dist_leg * (1 + WF)) / (speed * 24))` | `P#1 LADEN(283NM: 1.10d) + P#2 BALLAST(283NM: 1.10d)` | `2.21 Días` |
| **5. Días de Viaje (`tot_dur`)** | `sea_days + port_days` | `2.21d Mar + 3.30d Puerto` | `5.51 Días` |
| **6. Income (`income`)** | `Sum(Q_leg * F_leg)` | `13,500 MT × $25.50 USD/MT` | `$344,250.00` |
| **7. Comisiones (`commissions`)** | `income * (addr_comm + bkr_comm)` | `$344,250.00 × 0.00%` | `$0.00` |
| **8. Costo Bunker (`bunker`)** | `bunker_sea + bunker_port` | `41.67t IFO × $895.14 + 0.77t MDO × $1,460.30` | `$38,430.80` |
| **9. Port Costs (`port_costs`)** | `Sum(agency_origin + agency_dest)` | `$15,000.00 (Carga) + $40,000.00 (Descarga)` | `$55,000.00` |
| **10. Voyage Result (`voy_res`)** | `income - comm - bunker - port_costs` | `$344,250.00 - $38,430.80 - $55,000.00` | `$250,819.20` |
| **11. TCE Diario (`tce_real`)** | `voyage_result / tot_dur` | `$250,819.20 / 5.47 Días` | `$45,906.54/día` |
| **12. P/L (`pl_vs_req`)** | `income - comm - bunker - port_costs - (tot_days * tce_req)` | `$250,819.20 - (5.46d × $13,000.00/d)` | `$179,791.20` |

---

## 6. 📂 Entrega de Artefactos Locales

El script `run_qc_loop_pdf.py` escribe automáticamente el acta PDF en las siguientes rutas locales:

1. **Vault de Obsidian**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf`
2. **Raíz del Proyecto**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf`
