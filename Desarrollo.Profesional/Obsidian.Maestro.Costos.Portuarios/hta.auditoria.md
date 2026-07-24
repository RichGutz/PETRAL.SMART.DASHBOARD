# 🖥️ Especificación Técnica: Herramienta de Auditoría & Cotizador Dinámico (Modelo P x Q)

> **Ubicación en Bóveda**: `Obsidian.Maestro.Costos.Portuarios/hta.auditoria.md`  
> **Ubicación en Código**: `Geeksoft_Frontend/src/pages/Masters/MatrixComplexPanel.tsx` & `CallaoAuditViewer.tsx`  
> **Acceso en UI**: Módulo **Maestro Gastos Portuarios** (`/port-costs`) ➔ Pestaña **"Modelo Matriz Compleja"**  
> **Filosofía**: Cotizador Dinámico y Auditoría Naviera basado en la **Ecuación Fundamental $\text{Costo Portuario} = P \times Q$**, con estructura de **Doble Escala (Carga vs Descarga)** y **Visor Dual de PDFs Lado a Lado (Split-View)** en una sola ventana.

---

## 📐 1. Ecuación Fundamental: Costo Portuario = P x Q

Todo rubro en el puerto se descompone en un **Precio Unitario Contractual ($P$)** multiplicado por una **Cantidad o Dimensión Operativa ($Q$)**:

$$\text{Costo Componente USD} = P_{\text{tarifario (fijo)}} \times Q_{\text{operativo/físico}}$$

### 1.1. Origen y Naturaleza de las Cantidades ($Q$)
Los precios ($P$) se mantienen fijos según los contratos a largo plazo pactados en el Maestro Tarifario. Lo que cambia y varía de un viaje a otro son las **Cantidades ($Q$)**:

* **$Q_{\text{buque}}$ (Maestro de Buques `VESSELS`)**:
  - `LOA` (Eslora total en metros): ej. `134.16m` (`BT MOQUEGUA`).
  - `GRT` (Gross Register Tonnage): ej. `8,259 TRB`.
  - `DWT` (Deadweight Tonnage): ej. `14,298 MT`.
  - **Trazabilidad en Auditoría**: `[Jalado de Maestro de Buques]`
* **$Q_{\text{terminal}}$ (Maestro Puertos & Terminales `TERMINALS` / `OPERATIONS`)**:
  - `Ritmo Carga/Descarga` ($\text{MT/h}$): ej. $500\text{ MT/h}$ en Callao APM, $350\text{ MT/h}$ en Matarani Tisur.
  - `Ventana Temporal de Maniobra`: Atraque (Inicio) ➔ Desatraque (Fin).
  - `Remolques Exigidos`: ej. 2 IN / 2 OUT = 4 Total.
  - **Trazabilidad en Auditoría**: `[Jalado de Maestro Puertos/Terminales]`
* **$Q_{\text{horas}}$ (Calculado dinámicamente de la Ventana Temporal)**:
  $$\Delta t = \text{Fecha/Hora Desatraque (Zarpe)} - \text{Fecha/Hora Atraque (Inicio)}$$

### 1.2. Regla del Casino / Recargo Nocturno (+25%)
Si la hora de zarpe/desatraque cae en horario nocturno ($23:00 - 06:00$) o en domingo/feriado, el motor evalúa en vivo y aplica la **Regla del Casino**, sumando un $+25\%$ de recargo sobre la maniobra de salida de **Practicaje** y **Remolcaje**.

---

## 📊 2. Agrupamiento Oficial en 3 Bloques Navieros

Cada escala portuaria (tanto Carga como Descarga) agrupa sus 11 conceptos bajo las tres categorías oficiales de la UI de Tarifas (`port-tariffs`):

1. **`A) SHIFTING EXPENSES`**: Practicaje (IN + OUT), Remolcaje (IN + OUT), Acceso Atraque/Desatraque.
2. **`B) GENERAL PORT EXPENSES`**: Derechos de Faro y Balisas, Muellaje, Lanchas, Coordinador a Bordo, Clearance, Sanidad Marítima.
3. **`C) AGENCY EXPENSES`**: Honorarios de Agenciamiento (Agency Fee Base), Movilidad y Comunicaciones.

---

## 🎨 3. Arquitectura Visual: Visor Dual Lado a Lado (Split-View)

La interfaz presenta en **una sola ventana sin pestañas** los controles de ambas escalas arriba y el visor de dos PDFs en paralelo abajo:

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ 1. BARRA GENERAL VOYAGE: Ruta [NEXA Callao ➔ Matarani] | Buque [BT MOQUEGUA]│
 │    Carga: [ 13,500 MT ]  |  TOTAL ESCALA VOYAGE: $28,845.75 USD            │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 2. PANEL DE INPUTS CANTIDADES (Q) CARGA VS DESCARGA                         │
 │    • CARGA (CALLAO APM):   Ritmo: 500 MT/h | Ventana: 25/07 08:00 ➔ 26/07 23:30│
 │                            Perm: 39.5h 🌙 | Remolques: 2 IN/2 OUT | [ 🖨️ PDF ]│
 │    • DESCARGA (MATARANI):  Ritmo: 350 MT/h | Ventana: 28/07 10:00 ➔ 29/07 21:30│
 │                            Perm: 35.5h    | Remolques: 2 IN/2 OUT | [ 🖨️ PDF ]│
 ├─────────────────────────────────────────────────────────────────────────────┤
 │ 3. VISOR DUAL DE PDFs LADO A LADO (SPLIT-VIEW 50% / 50%)                    │
 │ ┌────────────────────────────────────┐ ┌──────────────────────────────────┐ │
 │ │ 📄 ACTA CARGA — CALLAO APM         │ │ 📄 ACTA DESCARGA — MATARANI      │ │
 │ │ Total: $13,481.25 USD              │ │ Total: $15,364.50 USD            │ │
 │ │ [Iframe PDF Carga Callao]          │ │ [Iframe PDF Descarga Matarani]   │ │
 │ └────────────────────────────────────┘ └──────────────────────────────────┘ │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔀 4. Próximo Paso: Desarrollo de Motores Específicos por Puerto Peruano

- **Motor Callao**: 100% Operativo y Dinámico (APM Terminals / DP World).
- **Próximos Motores a Desarrollar**:
  - `calculator_matarani.py` (TISUR Matarani)
  - `calculator_marcona.py` (Shougang Hierro Perú)
  - `calculator_ilo.py` (Southern Perú SPCC & ENAPU Ilo)
  - `calculator_paita.py` (TPA Paita)
