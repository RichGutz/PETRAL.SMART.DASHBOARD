# ANÁLISIS Y MAPEO DE CAMPOS (B/T MOQUEGUA & B/T TABLONES)

> **Módulo:** ETL - Ingesta de Liquidaciones Reales  
> **Flota Evaluada:** B/T Moquegua & B/T Tablones  

---

## 1. CAMPOS OPERATIVOS Y COMERCIALES A EXTRAER

Para cada viaje real ejecutado por las embarcaciones de Naviera Petral, el motor ETL debe identificar y extraer los siguientes bloques de datos:

### A. Cabecera e Identificación de Viaje (NVR)
- **NVR (Número de Viaje Real):** Código correlativo del viaje (ej. `NVR-MOQ-2026-01`).
- **Buque:** Nombre oficial de la nave (`B/T Moquegua` o `B/T Tablones`).
- **Cliente:** Cliente comercial fletador (`SPCC` o `NEXA`).
- **Producto / Carga:** Tipo de carga transportada (ej. *Ácido Sulfúrico*, *Diésel*).
- **Toneladas Cargadas (MT):** Volumen real embarcado ($Q_{real\_MT}$).
- **Fechas Clave:** Fecha Inicio Viaje, Zarpe Origen, Arribo Destino, Fin de Descarga.

---

### B. Ingresos por Flete & Demurrage
- **Flete Unitario ($USD/MT$):** Tarifa real facturada.
- **Ingreso Bruto Flete ($USD$):** Total $MT \times \text{Flete Base}$.
- **Demurrage / Sobrestadías ($USD$):** Monto cobrado por exceso de Laytime en muelle.
- **Ingreso Total Real ($USD$):** Ingreso Flete + Demurrage.

---

### C. Costos Reales de Búnker (Combustibles)
- **Consumo IFO 380 / VLSFO Real (MT):** Toneladas consumidas en lastre y cargado.
- **Precio IFO 380 Real ($USD/MT$):** Costo por tonelada facturada por el proveedor de búnker.
- **Consumo Diesel MDO Real (MT):** Toneladas de MDO consumidas en navegación y operaciones de puerto.
- **Precio MDO Real ($USD/MT$):** Costo por tonelada de MDO.
- **Gasto Total Búnker ($USD$):** $\text{Costo IFO Real} + \text{Costo MDO Real}$.

---

### D. Gastos Portuarios & Agenciamiento
- **Gastos Puerto Origen ($USD$):** Factura de agencia marítima, practicaje, remolcaje y amarradores.
- **Gastos Puerto Destino ($USD$):** Factura de agencia marítima, practicaje, remolcaje y uso de muelle.
- **Otros Gastos Operativos ($USD$):** Inspectores de carga, canal de Panamá (si aplica), comisiones de corretaje.

---

## 2. MATRIZ DE COMPARACIÓN FORECAST VS REAL

$$\text{Variación Flete \%} = \frac{\text{Ingreso Real} - \text{Ingreso Forecast}}{\text{Ingreso Forecast}} \times 100$$

$$\text{Variación Profit \%} = \frac{\text{Profit Real} - \text{Profit Forecast}}{\text{Profit Forecast}} \times 100$$
