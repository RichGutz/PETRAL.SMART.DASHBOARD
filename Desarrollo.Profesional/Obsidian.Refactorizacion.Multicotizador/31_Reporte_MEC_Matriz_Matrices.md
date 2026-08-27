# 📊 Reporte Ejecutivo MEC vs. Matriz Financiera PETRAL

**Documento Técnico & Financiero de Homologación**  
**Fecha de Auditoría:** 26 de Agosto de 2026  
**Origen de Datos:** `FORMATO.MEC.BUDGETS.2026.xlsx` & Motor Financiero PETRAL

---

## 1. 🎯 Objetivo Estratégico

Homologar y vincular estructuralmente el **Formato Presupuestal MEC (Budgets 2026)** utilizado por la alta dirección con la **Matriz Financiera y Comercial** del ecosistema PETRAL SMART DASHBOARD, permitiendo la generación automática de reportes ejecutivos de asignación de capacidad de flota y control presupuestal.

---

## 2. 🏛️ Arquitectura del Formato MEC Budget

El formato MEC se compone de **dos bloques analíticos interconectados**:

```mermaid
graph TD
    A[Motor Financiero PETRAL / Forecast] --> B[Bloque 1: Resumen Macro de Tráfico]
    A --> C[Bloque 2: Matriz Anual de Rutas y Capacidad]
    B --> B1[Cabotaje Nacional]
    B --> B2[Exportación Internacional]
    C --> C1[Volumen TM & Full Load]
    C --> C2[Frecuencia Anual de Viajes]
    C --> C3[Margen Bruto Total - Gross Margin]
    C --> C4[Días Ocupación - Días-Buque]
    C --> C5[Días Disponibles - Capacidad Remanente]
```

---

## 3. 📑 Bloque 1: Distribución Macro por Tipo de Tráfico (Cabotaje vs. Exportación)

Este bloque consolida el balance operativo de la flota agrupando las rutas según su régimen comercial:

| Tipo de Tráfico | Nº Viajes ($N$) | Volumen Anual ($TM$) | Participación ($\%$) |
| :--- | :---: | :---: | :---: |
| **Viajes Cabotaje** | $33$ | $400,000\text{ TM}$ | $50.00\%$ |
| **Viajes Exportación** | $30$ | $400,000\text{ TM}$ | $50.00\%$ |
| **TOTAL GENERAL CONSOLIDADO** | **$63$** | **$800,000\text{ TM}$** | **$100.00\%$** |

### 📐 Lógica de Clasificación en PETRAL:
- **Cabotaje:** Puertos de Origen y Destino situados en el litoral peruano (ej. `ILO-MATARANI`, `CALLAO-BAYOVAR`, `PISCO-CALLAO`).
- **Exportación / Internacional:** Rutas con puertos fuera de la jurisdicción nacional (ej. `ILO-MARCONA-EXPORT`, `CALLAO-ANTOFAGASTA`, etc.).

---

## 4. 🔬 Bloque 2: Matriz de Desglose por Ruta y Rendimiento Anual

A continuación se detalla la matriz exacta del Excel `FORMATO.MEC.BUDGETS.2026.xlsx` y su homologación matemática 1:1 con las métricas del motor PETRAL:

| Parámetro MEC | Fila 1 (Ruta 1) | Fila 2 (Ruta 2) | Fila 3 (Ruta 3) | Fila 4 (Ruta 4) | TOTAL BUDGET 2026 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **TM Anual** | $138,000$ | $250,000$ | $12,000$ | $400,000$ | **$800,000\text{ TM}$** |
| **Full Load (TM/Viaje)** | $13,500$ | $13,500$ | $3,000$ | $13,500$ | **$12,698\text{ TM (prom)}$** |
| **Nº Viajes** | $10$ | $19$ | $4$ | $30$ | **$63\text{ Viajes}$** |
| **P/L x Viaje (USD)** | $\$144,587.20$ | $\$129,998.05$ | $\$85,191.00$ | $\$104,138.27$ | **$\$117,154.72\text{ (prom)}$** |
| **Total Gross Margin (USD)** | **$\$1,445,872.00$** | **$\$2,469,962.96$** | **$\$340,764.00$** | **$\$3,124,148.15$** | **$\$7,380,747.11$** |
| **$\%$ Participación** | $17.25\%$ | $31.25\%$ | $1.50\%$ | $50.00\%$ | **$100.00\%$** |
| **Días Ocupación (Días-Buque)** | $51\text{ días}$ | $148\text{ días}$ | $24\text{ días}$ | $207\text{ días}$ | **$431\text{ Días-Buque}$** |
| **Días Disponibles** | — | — | — | — | **$289\text{ Días Libres}$** |

> **Nota sobre Capacidad de Flota:**  
> Para una flota de 2 buques operativos ($2 \times 360\text{ días} = 720\text{ días-buque/año}$):  
> $$\text{Días Disponibles} = 720 - 431 = 289\text{ días libres para mantenimiento o viajes Spot}.$$

---

## 5. 🔗 Matriz de Mapeo 1:1: Formato MEC ↔ Motor PETRAL SMART DASHBOARD

| Campo Formato MEC | Variable en PETRAL Backend (`Geeksoft_Engine`) | Campo Frontend React (`ForecastGrid.tsx`) | Fórmula / Mapeo |
| :--- | :--- | :--- | :--- |
| **Ruta** | `route_name` | `row.routeName` | Identificador de la ruta comercial |
| **TM Anual** | `annual_tonnage` | Columna `TOTAL ACUM` de `Toneladas` | $\sum_{m=1}^{12} \text{Carga Unit.} \times \text{Viajes}(m)$ |
| **Full Load** | `unit_cargo` | `carga_unit` (Multicotizador) | Capacidad nominal de carga del buque |
| **Nº Viajes** | `annual_trips` | Columna `TOTAL ACUM` de `Viajes (freq)` | $\sum_{m=1}^{12} \text{Viajes}(m)$ |
| **P/L x Viaje** | `voyage_pnl` | `voyage_result_unit` | $\text{Gross Revenue} - \text{Hire} - \text{Bunker} - \text{Ports}$ |
| **Total Gross Margin** | `annual_gross_margin` | Columna `TOTAL ACUM` de `(=) P&L` | $\sum_{m=1}^{12} \text{P/L Mensual}$ |
| **$\%$ Participación** | `volume_share_pct` | Cálculo dinámico | $\frac{\text{TM Anual Ruta}}{\text{Total TM Flota}} \times 100$ |
| **Días Ocupación** | `annual_ship_days` | Columna `TOTAL ACUM` de `Días-Buque` | $\sum_{m=1}^{12} \text{Días Duración} \times \text{Viajes}(m)$ |
| **Días Disponibles** | `available_ship_days` | Balance de capacidad | $(\text{Nº Buques} \times 360) - \text{Días Ocupación}$ |

---

## 6. 💡 Propuesta de Integración en la Interfaz de Usuario

Para que la alta dirección de PETRAL visualice este reporte de forma instantánea sin hojas de cálculo externas, se proponen dos alternativas en la plataforma:

1. **Tercer Modo de Matriz (Tab Switcher):**
   ```
   [ FORMATO:  PETRAL  |  NAVITRANSO  |  MEC BUDGET 2026 ]
   ```
   Al seleccionar `MEC BUDGET`, la grilla proyectada se transforma instantáneamente en la tabla resumida de 2 bloques (Cabotaje/Exportación y Matriz Anual de 8 columnas).

2. **Panel / Tarjeta de Resumen Presupuestal Anual (MEC Summary Card):**
   Un widget colapsable situado inmediatamente sobre la grilla que muestra las 3 tarjetas de control ejecutivo:
   - 📦 **Volumen Total:** `800,000 MT`
   - 💰 **Margen Bruto Total:** `$7,380,747.11 USD`
   - ⏱️ **Utilización de Flota:** `431 / 720 Días-Buque (59.8% Ocupación - 289 Días Libres)`

---
*Documento registrado en el repositorio maestro de auditoría PETRAL.*
