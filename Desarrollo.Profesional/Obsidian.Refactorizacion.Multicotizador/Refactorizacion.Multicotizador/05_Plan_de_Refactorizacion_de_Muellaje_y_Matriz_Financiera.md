# 05 Plan de Refactorización UI & Backend: Muellaje y Matriz Financiera

> **Documento Oficial de Especificaciones y Plan de Implementaciones Pendientes**  
> **Ubicación:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\Refactorizacion.Multicotizador\05_Plan_de_Refactorizacion_de_Muellaje_y_Matriz_Financiera.md`  
> **Fecha:** 13/08/2026  
> **Punto de Restauración Seguro:** `MULTICOTIZADOR_CONVERGENTE_12.08.26.tsx` | `spot_engine_CONVERGENTE_12.08.26.py`

---

## 📌 1. Resumen Ejecutivo del Requerimiento

Se incorporará la gestión dinámica del costo de **MUELLAJE (Wharfage)** en el Multicotizador del **PETRAL SMART DASHBOARD**. El muellaje es un gasto portuario que puede ser asumido por PETRAL o refacturado directamente al cliente.

---

## 🏛️ 2. Especificación Detallada de Cambios

### 🛠️ 2.1. Maestro de Gastos Portuarios (UI & Supabase)
* **Incorporación de 4ta Columna:** En la configuración del Maestro de Gastos Portuarios por buque/puerto, se añadirá el concepto **MUELLAJE** tanto para **CARGAR** como para **DESCARGAR**.
* **Estructura de Columnas:**
  $$\text{AGENCIA} \quad\mid\quad \text{LOAD MASTER} \quad\mid\quad \mathbf{\text{MUELLAJE}} \quad\mid\quad \text{OTROS}$$
* **Soporte Backend & Supabase:** Actualización de esquemas de datos (`muellaje_carga`, `muellaje_descarga` / `wharfage_load`, `wharfage_disch`).

---

### 🎨 2.2. Grilla Principal del Multicotizador (`MultiCotizadorExcel.tsx`)
* **Eliminación:** Se elimina la columna **`BODEGA (T)`**.
* **NUEVA Columna:** Se crea la columna **`MUELLAJE`**.
* **Componente Interactivo:** Cada celda contendrá **únicamente un Checkbox** con estado inicial marcado **`[x]` (True por defecto)**.

---

### 💰 2.3. Lógica Financiera & Tarjeta `FINANCIAL VOYAGE RESULT`

#### 🔴 Escenario A: Checkbox MARCADO `[x]` (Refacturado al Cliente — Por Defecto)
1. **Costo de Puerto:** El monto de Muellaje de la recalada se incluye dentro de los `Port Costs`.
2. **Ingreso Adicional:** El monto de Muellaje se cobra al cliente como un ingreso refacturado.
3. **Card `FINANCIAL VOYAGE RESULT`:** Se añade una línea de ingreso independiente:
   $$\text{Revenue (Tons } \times \$ /\text{MT)}$$
   $$\mathbf{\text{(+) Refacturación Muellaje (USD)}}$$
4. **Efecto Matemático en Utilidad (P/L):** El impacto neto en la utilidad del viaje es **$\$0.00$** ($\text{Ingreso Muellaje} - \text{Gasto Muellaje} = 0$), pero la **Facturación Bruta Total se incrementa** y es registrada en la matriz financiera.

#### ⚪ Escenario B: Checkbox DESMARCADO `[ ]` (Asumido por PETRAL — Sin Refacturar)
1. El Muellaje se registra **únicamente como Costo de Puerto** (`Port Cost`).
2. NO se genera la línea de ingreso por refacturación en la tarjeta financiera.

---

## 🎨 3. Mockup del Nuevo Layout de Cards Inferiores

Se reestructurará el bloque inferior ubicado debajo de la grilla del Multicotizador para optimizar el espacio vertical e incorporar **COMMENTS** y **DEMURRAGE**:

```text
+------------------------------------+------------------------------------+------------------------------------+------------------------------------+
| BUNKER EXPENSES (COMBUSTIBLE)      | PORT COSTS (GASTOS DE PUERTO)      | COMISIONES DE VIAJE                | FINANCIAL VOYAGE RESULT            |
| (Altura Reducida: Compacto)        | (Altura Reducida: Compacto)        | (Altura Reducida: Compacto)        | (Panel Lateral Derecho)            |
+------------------------------------+------------------------------------+------------------------------------+                                    |
| COMMENTS                                                                | DEMURRAGE                          |                                    |
| (Card Combinado Ancho: Columna 1 + Columna 2)                           | (Card Columna 3: Bajo Comisiones)  |                                    |
+-------------------------------------------------------------------------+------------------------------------+------------------------------------+
```

### 📐 Detalle de la Estructura en Grid Tailwind CSS:

1. **Fila Superior (Cards de Altura Reducida):**
   * **Columna 1:** `BUNKER EXPENSES (COMBUSTIBLE)` con altura ajustada (padding compacto).
   * **Columna 2:** `PORT COSTS (GASTOS DE PUERTO)` con altura ajustada.
   * **Columna 3:** `COMISIONES DE VIAJE` con altura ajustada.
   * **Columna 4:** `FINANCIAL VOYAGE RESULT` (Panel financiero de altura completa).

2. **Fila Inferior (Nuevos Cards):**
   * **`COMMENTS` (Card Combinado):** Ocupa `col-span-2` (abarcando las Columnas 1 y 2). Es un área de texto/comentarios para registrar observaciones del viaje.
   * **`DEMURRAGE` (Card Individual):** Ocupa `col-span-1` (Columna 3, ubicado exactamente debajo de `COMISIONES DE VIAJE`).

---

## 📋 3. Lista de Tareas e Implementación Pendiente

- [x] **Tarea 1:** Actualizar componente Maestro de Gastos Portuarios con la columna `MUELLAJE`.
- [x] **Tarea 2:** Reemplazar columna `BODEGA (T)` por Checkbox `MUELLAJE` en la grilla del Multicotizador.
- [x] **Tarea 3:** Actualizar `payloadTramos` y Backend Engine (`spot_engine.py`) para calcular la Refacturación de Muellaje, Comments y Demurrage.
- [x] **Tarea 4:** Renderizar la línea `(+) Refacturación Muellaje` en la tarjeta `FINANCIAL VOYAGE RESULT` y estructurar el nuevo layout de cards inferiores (`COMMENTS` y `DEMURRAGE`).
- [x] **Tarea 5:** Ejecutar QC Loop y desplegar a VPS (`python deploy_forecast_kickoff.py`).
- [ ] **Tarea 6:** *(Pendiente de más requerimientos del usuario...)*

---
