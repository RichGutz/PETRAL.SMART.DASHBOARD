# 📑 Especificación del Motor Algorítmico — Voyage.Calculation.Tablones

Este documento técnico detalla las ecuaciones físicas, las reglas de negocio de fricción operativa y las capas lógicas que componen el núcleo del motor algorítmico del proformador. Su correcta implementación garantiza simular con precisión el P&L y el Unit Economics de la flota (Geeksoft) bajo un modelo de consumo portuario granular por fases operativas.

---

## 🛠️ 1. Arquitectura del Motor (El Tablero de Variables Macroscópicas y Navales)

El motor opera de forma determinista recibiendo un objeto JSON de viaje y resolviendo el itinerario mediante la interacción de las variables operativas de la nave, las restricciones de tierra y el perfil físico del buque:

1. **`quantity`**: Volumen total de Ácido Sulfúrico a transportar (MT).
2. **`vessel_speed`**: Velocidad operativa real de navegación del buque (Nudos).
3. **`route_distance`**: Distancia náutica pura entre puertos de origen y destino (NM).
4. **`weather_factor`**: Factor de fricción y tolerancia ambiental por oleaje/corrientes (%).
5. **`port_overhead_hours`**: Horas muertas burocráticas fijas por cada evento de puerto (Horas). Actúa como la base temporal de la fase pasiva o muerta (`idle`).
6. **`is_round_trip`**: Flag condicional para alternar el costeo del itinerario entre **Viaje Redondo (Round Trip - Default: true)** o **Solo Ida (One Way - false)**.

### 🚢 Perfil Estructural y de Dimensiones del Buque (Soporte Dashboard Dash):
* `cbm`: Capacidad volumétrica total en metros cúbicos de los tanques de carga.
* `loa`: Eslora total del buque (Length Overall) medida en metros.
* `beam`: Manga máxima del buque medida en metros.
* `draft`: Calado operativo máximo del buque medido en metros.

---

## 📐 2. Ecuaciones Base y Leyes Físicas del Motor (Consumo Granular)

La simulación matemática se divide en fases consecutivas que el agente debe implementar de forma estricta, mapeando el desgaste y gasto de búnker de forma microscópica por cada ventana de tiempo:

### Fase I: Simulación de Tiempos e Itinerario Segmentado
1. **Factor de Ruta (`route_factor`):** Determinado de acuerdo al switch de selección comercial.
   $$\text{route\_factor} = \text{if } \text{is\_round\_trip} == \text{true then } 2.0 \text{ else } 1.0$$

2. **Días de Mar (`sea_days`):** Tiempo puro de navegación en mar abierto.
   $$\text{sea\_days} = \frac{(\text{route\_distance} \times \text{route\_factor}) \times (1 + \text{weather\_factor})}{\text{vessel\_speed} \times 24}$$

3. **Tasas de Flujo Reales y Cuellos de Botella (Regla del Triple Mínimo - MIN):**
   * **Tasa de Carga Real (`actual_load_rate`):**
     $$\text{actual\_load\_rate} = \min(\text{contract\_agreed\_load\_rate}, \text{vessel\_max\_load\_intake\_limit}, \text{max\_terminal\_load\_rate})$$
   * **Tasa de Descarga Real (`actual_discharge_rate`):**
     $$\text{actual\_discharge\_rate} = \min(\text{contract\_agreed\_discharge\_rate}, \text{vessel\_pump\_discharge\_rate}, \text{port\_max\_discharge\_limit})$$

4. **Desglose Algebraico de Tiempos en Puerto (Días por Fase):**
   En lugar de una masa temporal promediada, el tiempo total en puerto (`port_days`) se calcula sumando de forma exacta la duración de cada fase operativa de la misión:
   * **Días de Carga Activa (`load_days`):** Basado en el flujo de inyección real en el puerto de origen.
     $$\text{load\_days} = \frac{\text{quantity} / \text{actual\_load\_rate}}{24}$$
   * **Días de Descarga Activa (`disch_days`):** Basado en el esfuerzo de bombeo del buque hacia tierra en destino.
     $$\text{disch\_days} = \frac{\text{quantity} / \text{actual\_discharge\_rate}}{24}$$
   * **Días Pasivos o Muertos (`idle_days`):** Derivado de las horas fijas de overhead burocrático y maniobras en ambos puertos (origen y destino).
     $$\text{idle\_days} = \frac{\text{port\_overhead\_hours} \times 2.0}{24}$$
   * **Días Totales en Puerto (`port_days`):**
     $$\text{port\_days} = \text{load\_days} + \text{disch\_days} + \text{idle\_days}$$

5. **Duración Total de la Misión (`total_duration`):**
   $$\text{total\_duration} = \text{sea\_days} + \text{port\_days}$$

### Fase II: Cálculo de Bunker por Matriz de Desgaste (`SUM(t_fase * c_fase)`)
El costo final de bunker cruza de manera exacta cada ventana temporal calculada con su respectivo factor de consumo de ingeniería (agresivo o pasivo):

1. **Consumo Total de Bunker Pesado IFO (`bunker_tonnage_ifo`):**
   $$\text{bunker\_tonnage\_ifo} = (\text{sea\_days} \times \text{bunker\_consumption\_sea\_ifo}) + (\text{load\_days} \times \text{bunker\_consumption\_load\_ifo}) + (\text{disch\_days} \times \text{bunker\_consumption\_disch\_ifo}) + (\text{idle\_days} \times \text{bunker\_consumption\_idle\_ifo})$$

2. **Consumo Total de Diésel Marítimo MDO (`bunker_tonnage_mdo`):**
   $$\text{bunker\_tonnage\_mdo} = (\text{sea\_days} \times \text{bunker\_consumption\_sea\_mdo}) + (\text{load\_days} \times \text{bunker\_consumption\_load\_mdo}) + (\text{disch\_days} \times \text{bunker\_consumption\_disch\_mdo}) + (\text{idle\_days} \times \text{bunker\_consumption\_idle\_mdo})$$

3. **Costo Consolidado de Búnker (`total_bunker_costs`):**
   $$\text{total\_bunker\_costs} = (\text{bunker\_tonnage\_ifo} \times \text{bunker\_price\_ifo}) + (\text{bunker\_tonnage\_mdo} \times \text{bunker\_price\_mdo})$$

### Fase III: Margen Operativo e Indicadores Corporativos
1. **Margen de Utilidad Operativa (`voyage_result`):**
   $$\text{net\_income} = \text{quantity} \times \text{freight\_rate}$$
   $$\text{voyage\_result} = \text{net\_income} - \text{total\_port\_costs} - \text{total\_bunker\_costs} - \text{other\_costs}$$

2. **Time Charter Equivalent Real (`tce_real`):**
   $$\text{tce\_real} = \frac{\text{voyage\_result}}{\text{total\_duration}}$$

3. **Cierre de Caja Corporativo (`pl_vs_required`):**
   $$\text{pl\_vs\_required} = \text{voyage\_result} - (\text{tce\_required} \times \text{total\_duration})$$

---

## 💻 3. Pseudocódigo Base para el Backend (FastAPI - engine.py)

```python
def calculate_voyage_pl_granular(inputs):
    # Control de Itinerario Comercial (Por defecto: Viaje Redondo)
    is_round_trip = True if inputs.is_round_trip is None else inputs.is_round_trip
    route_factor = 2.0 if is_round_trip else 1.0
    
    # 1. Resolución de cuellos de botella (Regla del Triple Mínimo)
    actual_load_rate = min(inputs.contract_agreed_load_rate, inputs.vessel_max_load_intake_limit, inputs.max_terminal_load_rate)
    actual_discharge_rate = min(inputs.contract_agreed_discharge_rate, inputs.vessel_pump_discharge_rate, inputs.port_max_discharge_limit)
    
    # 2. Segmentación granular de tiempos (Lógica Física de Itinerario)
    sea_days = ((inputs.route_distance * route_factor) * (1.0 + inputs.weather_factor)) / (inputs.vessel_speed * 24.0)
    
    load_days = (inputs.quantity / actual_load_rate) / 24.0
    disch_days = (inputs.quantity / actual_discharge_rate) / 24.0
    idle_days = (inputs.port_overhead_hours * 2.0) / 24.0
    
    port_days = load_days + disch_days + idle_days
    total_duration = sea_days + port_days
    
    # 3. Cálculo de Bunker Micro-Desglosado (SUM(t_fase * c_fase))
    tonnage_ifo = (
        (sea_days * inputs.bunker_consumption_sea_ifo) +
        (load_days * inputs.bunker_consumption_load_ifo) +
        (disch_days * inputs.bunker_consumption_disch_ifo) +
        (idle_days * inputs.bunker_consumption_idle_ifo)
    )
    
    tonnage_mdo = (
        (sea_days * inputs.bunker_consumption_sea_mdo) +
        (load_days * inputs.bunker_consumption_load_mdo) +
        (disch_days * inputs.bunker_consumption_disch_mdo) +
        (idle_days * inputs.bunker_consumption_idle_mdo)
    )
    
    total_bunker_costs = (tonnage_ifo * inputs.bunker_price_ifo) + (tonnage_mdo * inputs.bunker_price_mdo)
    
    # 4. Estructura Financiera de Resultados
    net_income = inputs.quantity * inputs.freight_rate
    voyage_result = net_income - inputs.total_port_costs - total_bunker_costs - inputs.get("other_costs", 0)
    
    # 5. Outputs Estratégicos de Oficina
    tce_real = voyage_result / total_duration
    pcm_projected = tce_real * 30.42
    pl_vs_required = voyage_result - (inputs.tce_required * total_duration)
    
    return {
        "sea_days": sea_days,
        "port_days": port_days,
        "total_duration": total_duration,
        "total_bunker_costs": total_bunker_costs,
        "voyage_result": voyage_result,
        "tce_real": tce_real,
        "pcm_projected": pcm_projected,
        "pl_vs_required": pl_vs_required
    }
    
    
    ## 🏁 4. Criterio de Aceptación Inamovible (Casos de Control para pytest)

La suite de pruebas automatizadas en `pytest` valida que bajo este nuevo nivel microscópico, las ecuaciones coincidan al centavo con los libros de contabilidad de gerencia (Ruta Ilo-Matarani, 13,500 MT, Solo Ida para control base):

### 🎯 CASO DE CONTROL 1: B/T TABLONES (`is_round_trip = false`)

- `total_duration` → **3.769205 días**
    
- `total_bunker_costs` → **$14,459.61 USD**
    
- `voyage_result` → **$201,175.39 USD**
    
- `tce_real` → **$53,373.43 USD/día**
    
- `pl_vs_required` (Meta: $15,000/d) → **$144,637.32 USD**
    

### 🎯 CASO DE CONTROL 2: B/T MOQUEGUA (`is_round_trip = false`)

- `total_duration` → **4.080076 días**
    
- `total_bunker_costs` → **$18,560.53 USD**
    
- `voyage_result` → **$199,074.47 USD**
    
- `tce_real` → **$48,791.86 USD/día**
    
- `pl_vs_required` (Meta: $13,000/d) → **$146,033.49 USD**
    

> **Injunción para el Agente:** "El motor de pruebas verificará la integridad matemática cruzando las tres ventanas temporales de puerto de forma segregada. Desviaciones mayores a $0.01 USD causarán el rechazo inmediato del código en producción."