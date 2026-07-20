# Especificación Auditoría Final

Se desarrollará la herramienta **"Auditoría Final"** que reemplazará a las auditorías *Ledger* y *Motor*, integrando las rutas guardadas desde el Multicotizador y el motor de cálculo detallado.

## ¿Cómo funcionará?
1. **Selección de Ruta:** El sistema listará todas las rutas guardadas en el **Maestro de Rutas** (`routes_master`).
2. **Selección de Buque:** Se solicitará al usuario a qué barco se va a aplicar la ruta.
3. **Cantidad de Toneladas:** Se ingresará la cantidad de toneladas que van en el viaje.
4. **Tarifa (Contratos):**
   - El sistema extraerá el nombre del cliente desde la nomenclatura de la ruta (Ej. `SPCC` de `SPCC.ILO.MATARANI`).
   - Buscará si existe una tarifa registrada en el **Maestro de Contratos** para ese cliente.
   - Si la tiene, se mostrará automáticamente. Si no, se dejará editable con valor `0`.
   - El sistema **no avanzará** ni permitirá calcular si la tarifa es `0`.
5. **Cálculo y Desmembramiento P a P':** 
   - Utilizando el boilerplate visual y el motor de la *Auditoría Motor* actual (`VoyageLedgerUniversal.tsx`), se desmembrará el viaje de principio a fin, mostrando absolutamente todos los cálculos (Combustible, Costos Portuarios, Demoras, Tiempos, y PnL).
6. **Matriz de Costos Portuarios Estática:** Inicialmente se forzará la evaluación leyendo únicamente desde la "matriz estática" (modo estático), ya que la dinámica aún está en construcción.

## Puntos de validación a conversar
1. **Extracción de la Tarifa:** El maestro de contratos actual maneja una tarifa global por cliente (`freight_rate`). ¿Asumo que se utiliza este valor único independientemente del destino, o hay una tabla de tarifas específicas por ruta destino que deba considerar?
2. **Distribución de Toneladas:** En una ruta compleja (multitramo) como la de NEXA, si ingresas "15000" toneladas, ¿ese valor reemplaza la cantidad de **todos los tramos de carga (LADEN)** para la simulación?

*Nota creada para revisión conjunta antes de iniciar código.*
