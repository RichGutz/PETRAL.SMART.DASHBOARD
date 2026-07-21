# QC de Auditoría (Loop de Verificación)
**Objetivo:** Establecer los criterios automatizados (loop de Quality Control) que deben cumplirse para todas las rutas calculadas por el `multicotizador` de GEEKSOFT. Estas directrices aseguran que los cálculos coincidan con el Excel y previenen errores visuales en las Actas HTML/PDF (Voyage Ledger).

## 1. Reglas Generales del Loop QC
El script automatizado (`run_qc_loop.py`) iterará a través de todas las rutas definidas en el sistema, fijando los siguientes parámetros de control:
- **Buque:** Fijo (`SIN_NOMBRE` / TBN_02).
- **Modo de Costos Portuarios:** Siempre `static`.
- **Acción:** Presionar "Calcular" tras llenar la ruta (vía API backend).

Para que la prueba sea exitosa, la ruta simulada DEBE cumplir todos los siguientes criterios.

## 2. Criterios de Validación (Las "Pruebas")

### A. Detalle de Piernas y Tramos (Legs)
1. **El Acta HTML DEBE detallar TODAS las piernas del viaje:** 
   - No importa si es ruta redonda o multiruta (no redonda), todas las piernas (BALLAST y LADEN) deben listarse en el cuadro Maestro Rutas con origen, destino y distancia en millas náuticas (`NM`).
2. **Distancia Consolidada vs Individual:** 
   - La suma de las distancias de todas las piernas debe coincidir con `Dist. TOTAL VIAJE`.
   - Las distancias nunca pueden renderizarse como `0 NM` si el tramo es válido y el puerto existe.

### B. Rendimiento de Costos y Port Costs (Agencia)
1. **Desglose de Costos de Agencia (Origen/Destino):**
   - El sistema DEBE mostrar correctamente los port costs incurridos en **cada puerto de carga (Origen)** y **cada puerto de descarga (Destino)**, listando el breakdown correctamente cuando se agregan rutas complejas.
   - Si una pierna es puramente BALLAST (solo tránsito), sus costos portuarios asociados no pueden ser duplicados si no hay carga/descarga real en esos nodos (dependiendo de la regla de tarifas de agencia).

### C. Consistencia de Ingresos (Income)
1. **Validación de Flete (Income vs Tarifa):**
   - **Regla de Oro:** Si en una pierna hay carga a bordo (`Cantidad > 0 MT`) Y se definió un flete base (`Flete Base > $0.00/MT`), **el Income Total del viaje (Freight Revenue) NO PUEDE SER CERO**.
   - El cálculo debe ser `Σ (Q × F)` y coincidir con el Ingreso.

### D. Tiempos (Días de Puerto y Mar)
1. **Días de Puerto Consolidado:** 
   - Los días de puerto agregados deben ser **únicamente** la suma de los tiempos de estadía por maniobras de carga (en origen) y descarga (en destino), más tiempos muertos aplicables (Time to Count).
2. **Días de Mar Consolidado:** 
   - Los días de mar (`sea_days`) deben ser la suma de los tiempos de navegación de **TODAS** las piernas de la ruta, tanto las de posicionamiento (Ballast) como las comerciales (Laden).

---
*Este documento servirá de guía (Checklist de QC) cada vez que modifiquemos el core del motor de cálculo `spot_engine.py` o el generador de Actas en el frontend.*
