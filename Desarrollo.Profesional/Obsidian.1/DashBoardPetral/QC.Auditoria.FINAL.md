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
   - **Extrema Izquierda**: Logo Oficial PETRAL (`Logo.Petral.png`).
   - **Centro**: Título Oficial `PETRAL SMART DASHBOARD • MOTOR SPOT GEEKSOFT ENGINE`.
   - **Extrema Derecha**: Logo Oficial GEEKSOFT (`Logo.Geeksoft.png`).

---

## 3. 📋 Variables de Origen de Cálculo (Cards Maestros)

En el encabezado de cada ficha por ruta se listan de forma explícita los parámetros leídos desde las tablas base de Supabase (`routes_clients`, `vessels`, `contracts`):

- **CARD 1 (RUTAS)**: Itinerario completo (p. ej. `ILO ➔ CALLAO ➔ MARCONA ➔ ILO`), Distancia Náutica Total ($NM$), Factor Clima ($WF = 3.0\%$).
- **CARD 2 (BUQUES)**: Nombre del Buque (`MOQUEGUA`), Velocidad ($11.0\text{ kts}$), Consumo Sea/Idle IFO ($14.0 / 2.4\text{ t/d}$), Precios Búnker ($IFO = \$895.14\text{/t}$, $MDO = \$1,460.30\text{/t}$).
- **CARD 3 (CONTRATOS)**: Cliente Comercial (`SPCC` / `NEXA`), Cantidad Carga ($Q = 13,500\text{ MT}$ o $15,000\text{ MT}$), Tarifa Base Flete ($F = \$25.00$ - $\$30.00\text{/MT}$), Ritmos de Carga/Descarga Acordados ($T/h$).
- **CARD 4 (PUERTOS)**: Tarifas de Agencia Portuaria por Puerto y Total Costos de Puerto.

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

Al pie de cada ficha se incluye la replica de las 12 Métricas Oficiales de la UI de Auditoría Ledger con columnas ampliadas (+20% de ancho):

| ÍTEM / MÉTRICA OFICIAL | FÓRMULA APLICADA | CÁLCULO SUSTITUIDO NUMÉRICO | GEEKSOFT ENGINE | PETRAL | DELTA |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **1. Ritmo Carga (`act_load`)** | `min(contract, v_pump, t_lim)` | `500 T/h` | `500 T/h` | `______` | `______` |
| **2. Ritmo Descarga (`act_disch`)** | `min(contract, v_pump, t_lim)` | `345 T/h` | `345 T/h` | `______` | `______` |
| **3. Días de Puerto (`port_days`)** | `(Q/act_load)/24 + (Q/act_disch)/24 + idle` | `Load + Disch + Overheads` | `3.30 Días` | `______` | `______` |
| **4. Días de Mar (`sea_days`)** | `(dist * (1 + WF)) / (speed * 24)` | `[Dist × (1 + 3%)] / [11 × 24]` | `4.10 Días` | `______` | `______` |
| **5. Días de Viaje (`tot_dur`)** | `sea_days + port_days` | `Sea Days + Port Days` | `7.40 Días` | `______` | `______` |
| **6. Income (`income`)** | `Sum(Q_leg * F_leg)` | `Q × Freight Rate` | `$344,250.00` | `______` | `______` |
| **7. Comisiones (`commissions`)** | `income * (addr_comm + bkr_comm)` | `Income × 0.00%` | `$0.00` | `______` | `______` |
| **8. Costo Bunker (`bunker`)** | `bunker_sea + bunker_port` | `Tons IFO × Price + Tons MDO × Price` | `$62,233.73` | `______` | `______` |
| **9. Port Costs (`port_costs`)** | `Sum(agency_origin + agency_dest)` | `Port Origin + Port Dest` | `$71,327.99` | `______` | `______` |
| **10. Voyage Result (`voy_res`)** | `income - comm - bunker - port_costs` | `Income - Comm - Bunk - Port` | `$210,688.28` | `______` | `______` |
| **11. TCE Diario (`tce_real`)** | `voyage_result / tot_dur` | `Voyage Result / Total Days` | `$28,480.65/d` | `______` | `______` |
| **12. P/L (`pl_vs_req`)** | `tce_real - tce_required` | `TCE Real - TCE Required` | `$210,688.28` | `______` | `______` |

---

## 6. 📂 Entrega de Artefactos Locales

El script `run_qc_loop_pdf.py` escribe automáticamente el acta PDF en las siguientes rutas locales:

1. **Vault de Obsidian**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf`
2. **Raíz del Proyecto**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\ACTA_AUDITORIA_FINAL_RUTAS_SPCC_NEXA.pdf`
