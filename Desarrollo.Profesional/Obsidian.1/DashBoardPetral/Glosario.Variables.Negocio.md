# 📖 Glosario de Variables de Negocio — Proyecto Petral/Moquegua (Geeksoft)

Este documento define la semántica comercial, operativa y naval de las variables inyectadas en el motor de cálculo P&L. Actúa como la fuente única de verdad para el entendimiento del negocio, traduciendo el lenguaje naviero al modelo relacional de datos en Supabase.

---

## 📦 1. Capa Comercial y Contractual (Inputs de Negocio)

### `quantity` (Toneladas Métricas - MT)
* **Definición de Negocio:** Es el volumen total de carga de Ácido Sulfúrico líquida que el cliente (ej. SPCC) solicita transportar en un viaje específico. Determina los ingresos base y define qué escala de tarifas se dispara.

### `freight_rate` (Tarifa de Flete - USD/MT)
* **Definición de Negocio:** El precio pactado por tonelada métrica transportada. Proviene de una matriz comercial basada en el volumen del viaje. Si la cláusula BAF está apagada, es una tarifa fija; si está encendida, actúa como el punto de partida antes del ajuste de mercado.

### `contract_agreed_load_rate` / `contract_agreed_discharge_rate` (Tasa Comercial Pactada - MT/Hora)
* **Definición de Negocio:** Es el flujo de bombeo por hora que Naviera Petral le garantiza contractualmente al cliente para cargar (origen) o descargar (destino). Representa un compromiso comercial de velocidad operativa.

### `is_round_trip` (Flag de Tipo de Itinerario - Booleano)
* **Definición de Negocio:** Parámetro de control ingresado en el frontend que permite al usuario alternar la simulación comercial entre dos escenarios operativos: **Viaje Redondo (Round Trip)** o **Solo Ida (One Way)**. Por defecto para la operación con ácido sulfúrico, el sistema debe inicializarse en `TRUE` (Viaje Redondo) para blindar el costo de retorno en lastre. Si se selecciona `FALSE` (Solo Ida), el motor asume que existe un contrato de retorno garantizado que absorbe el tramo de vuelta.

---

## 🚢 2. Capa Naval y "Fierro" del Buque (Perfil Técnico de Bunker Dual)

### `vessel_speed` (Velocidad de Navegación - Nudos)
* **Definición de Negocio:** La velocidad promedio real a la que navega el barco en mar abierto cargado. Un nudo equivale a una milla náutica por hora. Determina el tiempo puro de tránsito.

### `vessel_max_load_intake_limit` (Límite de Recepción del Barco - MT/Hora)
* **Definición de Negocio:** La capacidad física máxima de las tuberías y manifolds a bordo del buque para recibir carga desde tierra sin reventar o causar un problema de seguridad hidrodinámica.

### `vessel_pump_discharge_rate` (Capacidad de Bombeo del Buque - MT/Hora)
* **Definición de Negocio:** La fuerza y caudal físico máximo que tienen las bombas centrífugas del buque para empujar el ácido hacia los tanques de tierra en el puerto de destino.

### `bunker_consumption_sea_ifo` / `bunker_consumption_sea_mdo` (Consumo de Navegación - MT/Día)
* **Definición de Negocio:** El gasto de bunker navegando en el mar (`sea`), cubriendo la propulsión principal. Nota marítima: En el entorno de la naviera, **Bunker = Fuel**, y puede componerse de Bunker IFO y Bunker MDO.

### Consumo Granular en Puerto (Idle, Load, Disch - MT/Día)
* **Definición de Negocio:** El consumo de Bunker IFO y MDO en el puerto dividido en 3 fases exactas:
  - `bunker_consumption_idle_ifo` / `_mdo`: Espera en fondeadero o tiempos muertos.
  - `bunker_consumption_load_ifo` / `_mdo`: Operaciones de carga.
  - `bunker_consumption_disch_ifo` / `_mdo`: Operaciones de descarga (exige mayor potencia a las bombas).

### Especificaciones Físicas y Navales
* **Definición de Negocio:**
  - `dwt` (Deadweight Tonnage): Tonelaje de peso muerto total de la nave.
  - `dwcc` (Deadweight Cargo Capacity): Las "toneladas útiles", es decir, la porción comercial neta disponible para llenar de carga después de restar los consumibles y el bunker.
  - `cbm` (Cubic Meters): Capacidad volumétrica.
  - `loa` (Length Overall): Eslora total.
  - `beam`: Manga (Ancho máximo).
  - `draft`: Calado (Profundidad sumergida).

---

## ⚓ 3. Capa Portuaria, Geográfica y Ambiental

### `route_distance` (Distancia Marítima - NM / Millas Náuticas)
* **Definición de Negocio:** La extensión oficial medida en el mar para el tramo directo de ida entre el puerto de origen y el de destino según las cartas de navegación. Si `is_round_trip` es verdadero, el motor multiplica esta distancia por 2 de forma automática para cubrir el regreso del buque en lastre (vacío) al puerto base de carga.

### `sea_days` (Días de Mar / Tiempo en Navegación)
* **Definición de Negocio:** El tiempo total expresado en días que el buque pasa en navegación marítima abierta. Depende directamente del flag `is_round_trip`. Si es verdadero, aplica un multiplicador de distancia factor = 2 (ida y vuelta); si es falso, factor = 1 (solo ida).
* **Fórmula Matemática Dinámica:** `sea_days = ((route_distance * (is_round_trip ? 2 : 1)) * (1 + weather_factor)) / (vessel_speed * 24)`

### `weather_factor` (Factor Climático / Tolerancia Ambiental)
* **Definición de Negocio:** Un porcentaje de fricción operativa (ej. 3% o 4%) que simula el impacto de las corrientes en contra, vientos o marejadas de la costa peruana. Actúa estirando virtualmente la distancia recorrida para no subestimar el consumo de bunker real.

### `port_overhead_hours` (Horas Muertas de Maniobra)
* **Definición de Negocio:** El tiempo fijo burocrático e irreversible en cada puerto (muestreo de laboratorios, trámites aduaneros, conexión de mangueras, práctico y remolcadores). Son horas que el buque pasa detenido obligatoriamente, independientes del volumen de la carga.

### `max_terminal_load_rate` / `port_max_discharge_limit` (Capacidad de Tierra - MT/Hora)
* **Definición de Negocio:** Los límites físicos de la infraestructura del puerto. En origen, es qué tan rápido bombea la planta de tierra; en destino, es qué tanta presión aguanta la tubería de recepción del cliente en su terminal.

---

## 📊 4. Parámetros y Outputs Financieros (Unit Economics)

### `bunker_price_ifo` / `bunker_price_mdo` (Precios de Inventario de Bunker - USD/MT)
* **Definición de Negocio:** El costo promedio ponderado por tonelada métrica de cada tipo de bunker en los tanques del buque. Permite valorar de manera independiente el gasto económico de IFO frente al diésel MDO (el cual suele ser sustancialmente más costoso en el mercado internacional).

### `total_port_costs` / `agency_costs` (Costos de Agencia - USD)
* **Definición de Negocio:** El desembolso total de dinero fijo que se le paga a las autoridades marítimas y aduanas por operar en los puertos. Se calcula mediante una matriz cruzada porque depende del volumen histórico que ese cliente específico maneje en ese puerto.

### `voyage_result` (Margen Bruto del Viaje - USD)
* **Definición de Negocio:** La utilidad neta líquida que le queda a la oficina de Naviera Petral después de restarle al ingreso por flete todos los costos portuarios, los costos de bunker (Suma de Bunker IFO + Bunker MDO) y gastos adicionales del itinerario. Es el indicador final de rentabilidad.

### `tce_real` (Time Charter Equivalent Real - USD/Día)
* **Definición de Negocio:** El indicador financiero supremo de la industria naviera. Divide la utilidad operativa total (`voyage_result`) entre la duración total del viaje en días (`total_duration`). Representa cuánto dinero rinde el buque por cada día que pasa operando.
* **Fórmula Matemática:** `tce_real = voyage_result / total_duration`

### `tce_required` (TCE Requerido / Costo Fijo Diario - USD/Día)
* **Definición de Negocio:** El piso financiero o costo de oportunidad por día fijado por la gerencia (OPEX + Costo de Capital). Es lo mínimo que el barco debe rendir por día para no perder dinero a nivel corporativo. [Valor base corporativo: $15,000.00 USD/día para Tablones | $13,000.00 USD/día para Moquegua].

### `pcm_projected` (Proyección Comercial Mensualizada - USD)
* **Definición de Negocio:** Una proyección estandarizada que simula los ingresos operativos mensuales brutos que generaría el contrato si el barco operara de forma continua durante un mes promedio bajo el mismo rendimiento de TCE. Usa el multiplicador global naviero de 30.42 días.
* **Fórmula Matemática:** `pcm_projected = tce_real * 30.42`

### `pl_vs_required` (P/L Neto Corporativo - USD)
* **Definición de Negocio:** El resultado final neto del viaje ("Cierre de Caja Corporativo"). Resta de la utilidad del viaje el costo operativo diario consolidado por los días reales que duró la operación. Si es positivo, el viaje superó las expectativas de la oficina.
* **Fórmula Matemática:** `pl_vs_required = voyage_result - (tce_required * total_duration)`

---
## 💡 Instrucción de Contexto para el Agente (Antigravity IDE):
> "El agente debe usar este glosario como el diccionario semántico oficial. Al programar constraints, validaciones o excepciones en el backend, la lógica de negocio descrita aquí prevalece sobre cualquier inferencia genérica. Los nombres técnicos de las variables deben respetarse al milímetro en todas las capas del software."