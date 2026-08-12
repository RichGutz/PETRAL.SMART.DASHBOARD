# LOOP DE QC - MULTICOTIZADOR SPOT V3

Estado: EN PROGRESO
Baseline Commit: f062e8d
Norma Estricta: ZERO FALLBACKS

## METODOLOGIA LOOP ATOMICO
1. DIAGNOSTICO COMPLETO - Escuchar todos los puntos primero
2. PLAN - Registrar con causa raiz
3. EJECUCION ATOMICA - Un cambio / build / deploy / verificacion del usuario

## PUNTOS A CORREGIR

### PUNTO 1 - Fallbacks en consumos del buque (spot_engine.py)
Descripcion: spot_engine.py tiene fallbacks numericos (500, 300, 6.0) que ignoran los datos del Maestro de Buques.
Causa Raiz: or 500 / or 300 / else 500.0 / else 300.0 en lineas 384,385,391,401,365
Correccion: Eliminar fallbacks numericos. Si no hay dato del Maestro, retornar 0.
Estado: PENDIENTE

### PUNTO 2 - Ritmos de Carga/Descarga del Maestro de Contratos
Descripcion: actual_load_rate / actual_discharge_rate deben jalarse de contracts->Operaciones y Tiempos. Sin fallbacks.
Causa Raiz: Cadena de resolucion termina en fallback numerico 500/300 prohibido.
Correccion: custom_rate -> contract_agreed_rate -> 0 (sin fallback numerico)
Estado: PENDIENTE

### PUNTO 3 - Precio de Bunker jalado con precision desde Maestro de Contratos
Descripcion: Los precios IFO/MDO tienen multiples fuentes posibles pero el ruteo no es preciso.
Regla de Negocio:
  1. Si el MAESTRO DE CONTRATOS tiene precio de bunker -> usar ese precio
  2. Si no hay nada en contratos -> precio = 0 (no inventar)
  3. Si el USUARIO lo modifica manualmente en la UI -> ese override prevalece sobre todo
  NUNCA usar un precio de una fuente aleatoria sin trazar el origen.
Archivos Afectados: forecast.py (endpoint /multicotizador/calculate), MultiCotizadorExcel.tsx
Causa Raiz: get_latest_bunker_prices() se aplica como fallback indiscriminado sin respetar jerarquia de fuentes.
Correccion: Jerarquia estricta: 1) Override usuario -> 2) Maestro Contratos -> 3) 0.00 (NO market price auto)
Estado: PENDIENTE
### PUNTO 4 - Distancia en millas jalada del Maestro de Distancias sin fallbacks
Descripcion: La distancia (NM) entre puertos debe venir exclusivamente de la tabla distances (Maestro de Distancias).
Regla de Negocio:
  - Si existe el par origen-destino en distances -> usar ese valor
  - Si NO existe el par -> distancia = 0 (no inventar distancia)
  - El usuario puede editar manualmente la distancia en UI -> ese override prevalece
Archivos Afectados: forecast.py (logica de matched_route), MultiCotizadorExcel.tsx
Causa Raiz: Si matched_route no encuentra el par, usa el valor que vino en el request o defaults no controlados.
Correccion: Si no hay match en distances -> route_distance = 0 (no fallback a valor del request)
Estado: PENDIENTE
### PUNTO 5 - Eliminar flechitas spinner de inputs numericos editables
Descripcion: Los inputs type=number muestran controles de incremento del browser (flechitas arriba/abajo) que avanzan de 0.1 en 0.1. Son molestos y bloquean la edicion libre del usuario.
Regla: El usuario debe poder escribir cualquier valor libremente sin restriccion de step.
Archivos Afectados: MultiCotizadorExcel.tsx (todos los inputs editables de la tabla)
Causa Raiz: input type=number sin definicion de step=any o sin ocultar el spinner nativo del browser.
Correccion: Agregar CSS global para ocultar spinners: input[type=number]::-webkit-inner-spin-button { appearance: none; } O cambiar a type=text con validacion numerica.
Estado: PENDIENTE

## SEGUIMIENTO

| # | Punto | Commit | Build | Deploy | User OK |
|---|-------|--------|-------|--------|---------|
| 1 | Fallbacks buque | - | - | - | - |
| 2 | Ritmos Contratos | - | - | - | - |

### PUNTO 6 - Hacer editables los costos portuarios en la UI
Descripcion: Los costos portuarios (agencia, practicaje, remolque, etc.) se auto-rellenan desde la BD pero el usuario no puede sobreescribirlos manualmente para hacer ajustes o simulaciones.
Regla de Negocio:
  - El sistema carga el costo portuario desde la BD como valor inicial sugerido
  - El usuario puede editar el campo y su valor override prevalece sobre el valor de BD
  - Si el usuario borra el campo -> vuelve al valor de BD (o 0 si no hay nada en BD)
Archivos Afectados: MultiCotizadorExcel.tsx (seccion de Port Costs / costos por puerto)
Causa Raiz: El campo de costo portuario se renderiza como texto estatico (no editable) o como input bloqueado.
Correccion: Convertir el display de costo portuario en un input editable con valor inicial de BD y estado local de override.
Estado: PENDIENTE

### PUNTO 7 - Discrepancia entre Total Estimado y suma aritmetica de tramos
Descripcion: Los totales de columnas (Dias Mar, Dias Puerto) muestran un valor diferente a la suma simple de los tramos individuales. Ejemplo: 1.42 + 3.06 muestra 5.56 en total estimado.
Regla de Negocio:
  - NO se reemplaza el Total Estimado (viene del backend, se deja intacto).
  - SE AGREGA una columna adicional Total Aritmetico = suma simple de los valores por tramo visibles en la tabla.
  - Ambas columnas conviven. Si difieren, la diferencia es visible para el usuario.
  - MI TRABAJO DE DEBUGGING: identificar por que difieren y corregir la causa raiz en spot_engine.py o forecast.py.
Archivos Afectados: MultiCotizadorExcel.tsx (agregar columna Total Aritmetico en fila de totales)
Correccion Fase 1 (UI): Agregar columna Total Aritmetico = sum(tramos.sea_days) / sum(tramos.port_days)
Correccion Fase 2 (Motor): Diagnosticar y corregir el origen de la diferencia en spot_engine.py
Estado: PENDIENTE

### PUNTO 8 - Cards Bunker Expenses y Port Costs: expansion en altura sin scroll interno
Descripcion: Los cards de Bunker Expenses y Port Costs tienen un rastro de auditoria expandible. Al hacer clic para expandirlo, el card muestra scroll vertical interno en vez de expandirse en altura y empujar el contenido siguiente hacia abajo.
Regla de Negocio:
  - Al abrir el rastro de auditoria, el card crece en altura naturalmente
  - El ribbon del punto 6 (y todo lo que sigue) se empuja hacia abajo
  - CERO overflow-y: scroll / auto dentro del card de auditoria
  - El comportamiento es accordion/expand natural del DOM
Archivos Afectados: MultiCotizadorExcel.tsx (seccion de cards Bunker Expenses / Port Costs y su toggle de auditoria)
Causa Raiz: El contenedor del card tiene height o max-height fijo con overflow-y:auto/scroll en vez de height:auto
Correccion: Remover max-height fijo y overflow-y del card. Usar transicion CSS de height:0 -> height:auto con animacion si se desea.
Estado: PENDIENTE

### PUNTO 9 - CARD 5 Calculos Detallados: POL/POD port costs mal mapeados
Descripcion: El CARD 5 (Puertos y Agencia) del tab Calculos Detallados muestra valores incorrectos.
Ejemplo observado:
  Agencia Carga (ILO): 0 USD    <- INCORRECTO (ILO no tiene costo de agencia)
  Agencia Descarga (MATARANI): 17,000 USD  <- INCORRECTO (deberia ser 18,000)
  Total Port Costs: 33,000 USD  <- INCORRECTO (deberia ser 35,000)
Valores correctos del Multicotizador:
  Callao (POL - Carga): 17,000 USD
  Matarani (POD - Descarga): 18,000 USD
  Total: 35,000 USD
Causa Raiz: El Card 5 mapea agency_costs_origin/destination de los tramos individuales sin respetar la logica POL/POD por accion de puerto (CARGAR/DESCARGAR). Toma el primer tramo como origen y el ultimo como destino, pero en rutas multi-escala esto falla.
Correccion: El Card 5 debe consumir la misma logica getDynamicPortCostItems() del Estimador Excel que ya asigna correctamente POL/POD por accion de puerto (action === CARGAR / DESCARGAR) y NO por posicion en el array de tramos.
Archivos Afectados: MultiCotizadorExcel.tsx (renderizacion de CARD 5 en tab Calculos Detallados)
Estado: PENDIENTE

### PUNTO 10 - Desglose de Auditoria al final / PDF repite Agencia Carga (CALLAO): 0 USD
Descripcion: Tanto en el bloque de texto de auditoria final (textBlock) como en la exportacion/renderizado PDF, los costos de agencia y puerto se vuelven a mostrar desfasados en 0 (ej. Agencia Carga (CALLAO): 0 USD) porque consumen mapeos estáticos tramo a tramo en lugar de la lista dinámica unificada.
Causa Raiz: handlePrintCalculosDetalladosHtml y el generador de textBlock usan tr.agency_costs_origin en vez de iterar sobre los puertos reales con sus acciones (CARGAR/DESCARGAR).
Correccion: Unificar la generacion del textBlock y del HTML para PDF consumiendo directamente getDynamicPortCostItems(), garantizando que Callao muestre ,000 y Matarani ,000 de forma consistente en todas partes.
Estado: PENDIENTE

### PUNTO 11 - Fila de Port Costs en PDF de Auditoria / Calculos Detallados no jala todos los costos portuarios
Descripcion: En la tabla oficial del PDF de auditoria / Calculos Detallados (fila de Port Costs / Gastos Portuarios), el valor mostrado no esta jalando ni conectando la totalidad de los costos portuarios ingresados/editados en la UI.
Causa Raiz: El generador HTML del PDF consulta tr.port_costs individual o una propiedad desfasada del tramo en lugar de conectar directamente con el estado reactivo de la UI (la suma completa de los puertos configurados o result.consolidated.total_port_costs).
Correccion: Conectar la fila de Port Costs del PDF / Audit Trail a la fuente reactiva unificada de la UI para que incluya el 100% de los rubros portuarios.
Estado: PENDIENTE

### PUNTO 12 - 3er Tab en UI: 'Auditoría Raw (JSON)' para inspección y copia directa
Descripcion: El usuario necesita inspeccionar y copiar exactamente todos los valores calculados que alimentan la UI y el PDF sin depender de PDFs basados en imagenes.
Regla de Negocio:
  - Crear un 3er Tab al lado de 'Cálculos Detallados (PDF)': 'Auditoría Raw (JSON)'.
  - Este tab renderizara un bloque de texto JSON formateado (pretty-print 2 spaces) y copiable con boton 'Copiar JSON'.
  - Incluira: inputs del buque, tramos calculados, consumos de bunker, desglose dinamico POL/POD, consolidados finales y payload exacto del motor.
  - No es imprimible; su unico fin es permitir al usuario copiar/pegar los datos en texto plano directamente al chat para diagnostico inmediato.
Archivos Afectados: MultiCotizadorExcel.tsx (sistema de tabs y renderizado de Tab 3)
Estado: PENDIENTE

  EJEMPLO REAL CONCRETO DETECTADO POR EL USUARIO:
  Fila 9 del PDF / Audit Trail muestra:
  Formula: Sum(agency_origin + agency_dest)
  Ecuacion explicita: Puertos Origen + Puertos Destino ( + ,000)
  Total mostrado: -,000  <-- INCONSISTENCIA TOTAL ( +  != 33k, y la realidad con Matarani es ,000)
  Solucion: Reconstruir la string de auditoria de la Fila 9 construyendo la ecuacion real sumando todos los puertos dinámicos activos (Callao ,000 + Matarani ,000 = ,000 USD).

  DIAGNOSTICO ARQUITECTONICO DE CAUSA RAIZ (CONFIRMADO):
  El error ocurre porque el codigo antiguo asumia un viaje simple de 1 solo tramo (1 Origen + 1 Destino) y sumaba rigidamente (agency_origin + agency_dest).
  Sin embargo, el Multicotizador Spot es MULTI-PIERNA (multi-leg / multi-puerto). Puede haber multiples POLs y multiples PODs (ej. Callao CARGA + Matarani DESCARGA).
  CORRECCION ARQUITECTONICA:
  La formula debe ser una iteracion dinamica N-puertos: Total Port Costs = Sum(costo_puerto_i para i en puertos_activos).
  La string explicativa debe renderizar la suma real de todos los puertos activos: 'Callao (,000) + Matarani (,000) = ,000 USD'.

---

## 🏛️ MATRIZ MAESTRA DE AUDITORÍA (13 FILAS) PARA ESCENARIO MULTIPIERNA

A continuación se define la formulación oficial estricta para las 13 filas del resumen de auditoría en escenarios MULTIPIERNA (multi-leg):

| # | Ítem / Fila | Fórmula Estricta Multi-Pierna | Explicación / Ecuación Concatenada en Audit Trail |
|:-:|:---|:---|:---|
| **1** | **Ritmo Carga (ct_load)** | custom_load_rate o contract_load_rate por POL activo. | Muestra el ritmo por puerto de carga activo (ej. Callao: 500 T/h). |
| **2** | **Ritmo Descarga (ct_disch)** | custom_discharge_rate o contract_discharge_rate por POD activo. | Muestra el ritmo por puerto de descarga activo (ej. Matarani: 400 T/h). |
| **3** | **Días de Puerto (port_days)** | $\sum rac{Q_i}{	ext{RitmoCarga}_i \cdot 24} + \sum rac{Q_j}{	ext{RitmoDesc}_j \cdot 24} + \sum rac{	ext{Overhead}_k + 	ext{Posic}_k}{24}$ | Carga + Descarga + Overheads/Posic acumulados de **TODOS** los puertos activos (ej. 1.13d + 1.41d + 0.54d = 3.07d). |
| **4** | **Días de Mar (sea_days)** | $\sum rac{	ext{Dist}_m \cdot (1 + 	ext{WF}_m)}{	ext{Speed} \cdot 24}$ | Suma de días de navegación de **TODOS** los tramos con su Weather Factor individual. |
| **5** | **Días de Viaje (	ot_dur)** | sea_days + port_days | Suma directa de Días de Mar + Días de Puerto totales (ej. 4.06d + 3.07d = 7.13d). |
| **6** | **Income (income)** | $\sum (Q_k \cdot F_k)$ para todas las descargas activas | Suma de ingresos facturados por tonelada en puertos de descarga (ej. 13,500 MT x  = ,000). |
| **7** | **(-) Hire (hire_req)** | 	ce_req * tot_dur | Costo de oportunidad del buque (ej. $15,000/d x 7.13d = -,957). |
| **8** | **(-) Costo Búnker (unker)** | Tons_IFO * P_IFO + Tons_MDO * P_MDO | Consumo real total de IFO y MDO acumulado en mar y puerto por sus precios respectivos. |
| **9** | **(-) Port Costs (port_costs)** | $\sum 	ext{CostoPuerto}_k$ para todos los puertos activos | **Suma dinámica N-puertos**: Callao (,000) + Matarani (,000) = -,000. |
| **10**| **(-) Comisiones (commissions)** | income * (address_comm + broker_comm) | Porcentaje total de comisiones sobre el ingreso bruto flete. |
| **11**| **Voyage Result / P&L** | income - bunker - port_costs - commissions | **Utilidad Neta Real**: Flete - Búnker - Port Costs - Comisiones. |
| **12**| **TCE Realizado (	ce_real)** | pnl_neto / tot_dur | Rendimiento diario real del viaje (P&L / Días Totales). |
| **13**| **Diferencia TCE (+/-)** | 	ce_real - tce_req | Margen de sobre/sub rendimiento sobre el TCE objetivo. |


## 🏛️ MATRIZ MAESTRA DE AUDITORIA Y CRITERIO DE FORMULAS (13 FILAS MULTI-PIERNA)

| # | Item / Fila | Formula Estricta Multi-Pierna | Criterio & Entendimiento del Por Que de la Formula | Ejemplo Ruta NEXA (Tablones) |
|:-:|:---|:---|:---|:---|
| **1** | **Ritmo Carga (act_load)** | custom_load_rate o contract_load_rate por POL activo (T/h). | Mide la velocidad de transferencia en el puerto de embarque. Determina las horas efectivas que el buque estara bombeando/recibiendo carga. | Callao: 500 T/h |
| **2** | **Ritmo Descarga (act_disch)** | custom_discharge_rate o contract_discharge_rate por POD activo (T/h). | Mide la velocidad de descarga en destino. Define las horas operativas de descarga en bombas de la nave o terminal. | Matarani: 400 T/h |
| **3** | **Dias de Puerto (port_days)** | Sum(Q_i / (RitmoCarga_i * 24)) + Sum(Q_j / (RitmoDesc_j * 24)) + Sum((Overhead_k + Posic_k)/24) | El buque acumula tiempo inmovilizado en muelle. Suma las horas efectivas de carga, descarga y overheads/posicionamientos de TODOS los puertos de la ruta. | 1.125d (Carga) + 1.406d (Desc) + 0.542d (Overheads) = 3.0729 Dias |
| **4** | **Dias de Mar (sea_days)** | Sum(Dist_m * (1 + WF_m) / (Speed * 24)) | Tiempo de transito nautico. Incorpora el Weather Factor (1 + WF) porque el clima real en el mar siempre alarga el trayecto o reduce velocidad. | 4.0576 Dias (514NM: 2.01d + 457NM: 1.78d + 69NM: 0.27d) |
| **5** | **Dias de Viaje (tot_dur)** | sea_days + port_days | Ciclo total del viaje comercial. Representa el tiempo total transcurrido desde el lastre inicial hasta la entrega final para prorratear costos por dia. | 4.0576d + 3.0729d = 7.1305 Dias |
| **6** | **Income (income)** | Sum(Q_k * F_k) para todas las descargas activas | El ingreso bruto de flete facturado al fletador por transportar las toneladas de carga real. | 13,500 MT x  = ,000 USD |
| **7** | **(-) Hire (hire_req)** | tce_req * tot_dur | Costo de oportunidad del buque. Mide cuanto cuesta mantener la nave operando en este viaje respecto a haberla alquilado en Time Charter a la tasa requerida ($/dia). | ,000/d x 7.1305d = -,957 USD |
| **8** | **(-) Costo Bunker (bunker)** | Tons_IFO * P_IFO + Tons_MDO * P_MDO | Combustible consumido. Separa navegacion (regimen de mar) y puerto (idle/auxiliares) para IFO y MDO multiplicados por sus precios reales. | 71.699t IFO x ,100 = -,869 USD |
| **9** | **(-) Port Costs (port_costs)** | Sum(CostoPuerto_k) para todos los puertos de la ruta | Gastos a agencias, remolques, practicos y servicios de muelle. Debe ser una suma abierta N-puertos porque en multi-pierna hay multiples POLs y PODs. | Callao (,000) + Matarani (,000) = -,000 USD |
| **10**| **(-) Comisiones (commissions)** | income * (address_comm + broker_comm) | Descuentos contractuales de la linea (Address Comm) y brokeres calculados sobre el flete bruto. | ,000 x 0.00% = - USD |
| **11**| **Voyage Result / P&L** | income - bunker - port_costs - commissions | Utilidad Neta Real: Excedente comercial en efectivo que le queda a la naviera tras pagar costos operativos directos. | ,000 - ,869 - ,000 -  = ,130.62 USD |
| **12**| **TCE Realizado (tce_real)** | pnl_neto / tot_dur | Convierte el resultado en dolares a una tasa diaria equivalente ($/dia). Permite comparar este viaje con cualquier otro viaje de diferente duracion. | ,130.62 / 7.1305d = ,828.96 / dia |
| **13**| **Diferencia TCE (+/-)** | tce_real - tce_req | Rendimiento neto sobre el estandar. Muestra el sobre-rendimiento (ganancia de valor) o sub-rendimiento diario contra la meta comercial. | ,828.96 - ,000 = +,828.96 / dia |


## 🏷️ MANDATO COMERCIAL: REESTRUCTURACION DE OVERHEAD A TIME TO COUNT

1. **Renombrado Oficial:** El termino Overhead queda sustituido oficialmente por TIME TO COUNT en todo el software (UI, PDF, audit trail, codigo).
2. **Trazabilidad sin Fallbacks Hardcodeados (Eliminacion de 6.0):**
   La cadena de resolucion de TIME TO COUNT sera:
   TIME TO COUNT = Override UI -> Maestro Contratos -> Maestro Puertos (default_overhead_hours) -> 0.0
   (Si no existe registro en ninguna tabla ni fue escrito por el usuario, su valor es 0.0 horas, NUNCA 6.0 inventado).


## 🧮 MANDATO DE AUDITABILIDAD CALCULADORA EN MANO (PDF & JSON)

1. **Disgregacion Aritmetica Absoluta:**
   Tanto en el PDF de auditoria como en el 3er Tab JSON (Auditoria Raw), cada numero final debe mostrar todos sus factores intermedios desglosados paso a paso (factores P, Q, tasas, horas, WF multipliers, velocidades y precios), de forma que cualquier auditor o usuario con una calculadora de mano pueda multiplicar y sumar linea por linea y obtener exactamente la cifra mostrada en la UI.

2. **Detalle de Pasos Obligatorios por Fila:**
   - Sea Days: (Distancia * (1 + WF)) / (Speed * 24) = Subtotal Dias
   - Port Days: Carga (Q / RitmoCarga)/24 + Descarga (Q / RitmoDesc)/24 + TIME TO COUNT/24 + Posic/24 = Subtotal Dias
   - Bunker IFO/MDO: (Dias Mar * ConsSea + Dias Puerto * ConsIdle + HorasOp * ConsOp) * PrecioTon = Costo USD
   - Port Costs: Lista explicita puerto por puerto Puerto_1 () + Puerto_2 () + ... = Total USD


## 🔬 INVESTIGACION PREVIA DE CAUSA RAIZ & MODULARIZACION DE SERVICIOS

1. **Investigacion Previa Obligatoria:** Antes de escribir una sola linea de codigo en cada punto, investigar y documentar la causa raiz exacta (origen en Supabase backend/frontend).
2. **Modularizacion Frontend:** Crear src/services/multicotizadorService.ts para desacoplar todas las consultas Supabase (vessels, contracts, distances, ports, port_costs_matrix, bunker_prices) del componente React MultiCotizadorExcel.tsx.


## 🔒 COMMIT DE SEGURIDAD BASELINE ESTABLECIDO
- Commit oficial: PRE.MODULARIZACION.MULTICOTIZADOR (Hash: b90e5c8)

## 🌳 ARQUITECTURA WORK TREE MODULARIZADO
Geeksoft_Frontend/src/
├── services/
│   └── multicotizadorService.ts        <-- Capa de Servicios: Consultas Supabase (vessels, contracts, distances, ports, port_costs_matrix, bunker_prices)
├── components/CommercialForecast/
│   ├── MultiCotizadorExcel.tsx         <-- Componente Principal Layout (Tab Switcher + Grid Excel)
│   ├── MultiCotizadorTabs/
│   │   ├── EstimadorSpotTab.tsx        <-- Tab 1: Vista Tabla Excel Estandar
│   │   ├── CalculosDetalladosTab.tsx   <-- Tab 2: Vista Formateada PDF / Audit Trail 13 Filas
│   │   └── AuditoriaRawJsonTab.tsx     <-- Tab 3: Vista Inspector JSON Raw (Pretty-print + Copiar JSON)
│   └── types/
│       └── multicotizadorTypes.ts      <-- Types TypeScript
