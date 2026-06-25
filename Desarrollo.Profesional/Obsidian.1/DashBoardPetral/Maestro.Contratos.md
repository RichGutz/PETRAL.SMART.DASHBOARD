# 📑 Maestro — Contratos, Tarifas y Cláusula BAF (Lógica Financiera Goal Seek)

Este archivo maestro extiende la configuración contractual para incluir la **Cláusula de Ajuste por Bunker (BAF - Bunker Adjustment Factor)** mediante un modelo de optimización inversa (Goal Seek / Buscar Objetivo) en el motor de **Geeksoft**.

## ⛽ 1. Tabla Cabecera de Contratos (`contracts`)

La tabla cabecera agrupa las reglas y aloja un campo `JSONB` flexible para el mecanismo BAF.

- **bunker_baseline_price:** 430.00 // Precio base del IFO pactado en el contrato (USD/MT).
- **baf_rules:** `{"type": "goal_seek_inverse", "trigger_percentage": 0.05}` // JSONB para escalabilidad de lógica de ajustes.
- **load_rate** y **discharge_rate:** Tasas operativas (MT/hora) que determinan el laytime.
    

## 📐 2. Modelo Matemático: El Algoritmo Inverso (Goal Seek)

Cuando el precio del bunker del mercado real (`bunker_price_ifo_actual`) supera el precio base del contrato, el sistema ejecuta un proceso iterativo.

### El Problema Financiero:

Al aumentar el precio del bunker, el costo total de bunker aumenta ($\Delta \text{Bunker}$). Si el flete se mantiene constante, la utilidad de la proforma original cae por debajo de la meta contractual.

### El Objetivo del Algoritmo:

Encontrar la nueva tarifa de flete ajustada (`baf_adjusted_freight_rate`) tal que:

$$\text{voyage\_result}_{\text{con\_bunker\_nuevo}} = \text{voyage\_result}_{\text{original\_contractual}}$$

### Ecuación Despejada (Resolución Analítica Directa del Goal Seek):

Dado que el modelo de Geeksoft es determinista, no necesitamos un bucle iterativo pesado; podemos resolver el **Buscar Objetivo** directamente en el backend con una sola línea de código despejando la ecuación de utilidad:

$$\Delta\text{Bunker Costs} = \left[(\text{sea\_days} \times \text{bunker\_consumption\_sea\_ifo}) + (\text{port\_days} \times \text{bunker\_consumption\_idle\_ifo})\right] \times (\text{bunker\_price\_ifo\_actual} - \text{bunker\_baseline\_price\_ifo})$$

$$\text{baf\_adjusted\_freight\_rate} = \text{freight\_rate}_{\text{base}} + \frac{\Delta\text{Bunker Costs}}{\text{quantity}}$$

## 💻 3. Pseudocódigo para Antigravity IDE (Inyección en el Backend)

Plaintext

```
FUNCTION calculate_baf_adjusted_rate(trip_inputs, actual_bunker_price):
    // 1. Cargar tarifa base y precio base del contrato
    f_base       = trip_inputs.freight_rate_base
    p_base_ifo   = contract.bunker_baseline_price_ifo
    trigger_var  = contract.bunker_trigger_variance
    Q            = trip_inputs.quantity
    
    // 2. Verificar si se dispara la cláusula BAF
    variance = ABS(actual_bunker_price - p_base_ifo) / p_base_ifo
    
    IF variance < trigger_var THEN
        // Si no pasa del 5%, se mantiene la tarifa del contrato
        RETURN f_base 
    ENDIF

    // 3. Simular tiempos de la ruta (sea_days y port_days granulares usando el tablero de variables)
    times = calculate_voyage_times(trip_inputs)
    
    total_bunker_consumption = (times.sea_days * trip_inputs.bunker_consumption_sea_ifo) + (times.idle_days * trip_inputs.bunker_consumption_idle_ifo) + (times.load_days * trip_inputs.bunker_consumption_load_ifo) + (times.disch_days * trip_inputs.bunker_consumption_disch_ifo)
    
    // 4. Ejecución del Goal Seek: Calcular el sobrecosto absoluto del bunker
    delta_bunker_cost = total_bunker_consumption * (actual_bunker_price - p_base_ifo)
    
    // 5. Trasladar el sobrecosto exactamente a la tarifa por tonelada (Ajuste Target)
    freight_increase = delta_bunker_cost / Q
    baf_adjusted_freight_rate = f_base + freight_increase
    
    RETURN ROUND(baf_adjusted_freight_rate, 2)
END FUNCTION
```

## 🔗 Relaciones Lógicas en Obsidian

- Esta lógica altera el cálculo de ingresos netos en `[[CT-01-Motor-Calculo-PL-Simetrico]]` introduciendo la variable condicional `freight_rate = baf_adjusted_freight_rate`.
    
- Permite al usuario simular escenarios de volatilidad en el `[[Módulo UI - Ingreso Rápido de Viaje]]` añadiendo un campo input llamado: `bunker_price_ifo_actual`.
    

## 💡 Instrucción de Contexto para el Agente (Antigravity IDE):

> "El agente debe programar en el frontend un switch llamado **'Activar Cláusula BAF'**. Si está encendido, el sistema habilitará un campo para ingresar el precio de bunker actual del mercado.
> 
> Al procesar el P&L, el backend no usará la tarifa plana del contrato; primero ejecutará el algoritmo analítico de Goal Seek para ajustar el `freight_rate` protegiendo el `voyage_result` original de la ruta. Si el precio del bunker sube, el flete subirá automáticamente en la proporción exacta para que la utilidad final del viaje no se mueva ni un solo centavo frente al caso base."