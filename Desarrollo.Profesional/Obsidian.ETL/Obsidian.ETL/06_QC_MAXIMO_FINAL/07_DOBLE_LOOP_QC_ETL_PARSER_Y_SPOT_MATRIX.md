# 🔄 DOBLE LOOP DE AUDITORÍA QC: ETL PARSER RE-SCRAPEO Y SIMULACIÓN SPOT MATRIX MODE

> **Estado**: 🛠️ ESPECIFICACIÓN & PROTOCOLO DE RE-PARSEO EN PROCESO  
> **Ubicación del Módulo ETL**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.ETL\Obsidian.ETL`  
> **Carpeta de QC**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.ETL\Obsidian.ETL\06_QC_MAXIMO_FINAL`  
> **Script de QC Autónomo**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\run_qc_loop_non_plus_ultra.py`  

---

## 1. ⚙️ Propósito del Doble Loop de Auditoría

Tras la auditoría detallada de la flota y el análisis visual en el visor **Auditoría PDF Liquidaciones**, se identificó que los datos históricos almacenados en la tabla `voyage_liquidations` de Supabase DB contenían **imprecisiones heredadas por el primer scrapeo del motor ETL** sobre los Exceles de los operadores navieros.

Por ejemplo, en el **Viaje `v.045` (`B/T TABLONES ILO → MATARANI`)**:
- **Celdas Reales en el Excel del Operador**:
  - `Port Costs`: **`$34,674.67 USD`**
  - `Bunker Costs`: **`$30,913.56 USD`**
  - `Gross Revenue`: **`$241,783.00 USD`**
  - `Utilidad Neta Real`: **`$90,121.00 USD`**
- **Error del Primer Scrapeo ETL**:
  - Leyó montos provisionales por defecto (`$18,000.00` y `$42,500.00`) en lugar de extraer las celdas finales de la liquidación del barco.

El **Doble Loop de Auditoría** corrige de raíz esta desviación estableciendo dos bucles interconectados.

---

## 2. 🔁 Diagrama de Flujo del Doble Loop

```
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                                    EXCELES MAESTROS                                    │
  │                  Liquidaciones de Operadores (Exceles.Petral / Flota)                │
  └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │  🔄 LOOP 1: AUDITORÍA & CORRECCIÓN DEL ETL PARSER / SCRAPER (`Obsidian.ETL`)           │
  │  • Re-procesar las celdas reales de Port Costs ($34,674.67) y Bunker Costs ($30,913.56) │
  │  • Actualizar la base de datos Supabase `voyage_liquidations` con 100% de fidelidad.    │
  └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                              │
                                              ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │  🔄 LOOP 2: SIMULACIÓN & CONVERGENCIA MULTICOTIZADOR SPOT MATRIX MODE                  │
  │  • Ejecutar `spot_engine.py` para los 31 viajes usando el modelo P×Q dinámico.          │
  │  • Desplegar en la herramienta "Auditoría PDF Liquidaciones" la comparativa side-by-side│
  │    con 0% de descuadres contables y total transparencia.                                │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🛡️ Protocolo Operativo del Loop 1 (ETL Re-Parser)

1. **Auditoría de Coordenadas de Celdas (`Obsidian.ETL / 03_Motor_ETL_y_Parser`)**:
   - Ajustar el script en Python/Pandas para buscar de forma exacta los encabezados `Port Costs` y `Bunker Costs` en el resumen final de la hoja del barco.
2. **Validación de Ecuación Financiera**:
   $$\text{Utilidad Neta Real} = \text{Gross Revenue} - \text{Port Costs} - \text{Bunker Costs} - \text{Comisiones} - (\text{Días} \times \text{TCE Requerido})$$
3. **Re-Sincronización de Supabase DB**:
   - Ejecutar la actualización en `voyage_liquidations` sobre la columna `details` (asegurando `details.port_expenses.total_agency_usd = 34674.67` y `details.bunker_expenses.total_bunker_cost_usd = 30913.56`).

---

## 4. 🛡️ Protocolo Operativo del Loop 2 (Spot Matrix & PDF HTA)

1. **Simulación del Motor Spot Matrix Mode**:
   - Ejecutar `run_qc_loop_non_plus_ultra.py` consumiendo los registros saneados de Supabase.
2. **Renderizado en la Herramienta "Auditoría PDF Liquidaciones"**:
   - Desplegar viaje por viaje las fichas side-by-side en formato sobrio impreso `A4 Landscape` con fuente de **$15\text{px} - 20\text{px}$** y scroll en pantalla.
3. **Impresión & Acta de Junta Directiva**:
   - Generación de reportes limpios con los logos corporativos de **PETRAL** (izquierda) y **GEEKSOFT** (derecha).
