# 🗺️ Maestro — Rutas y Factores Climáticos (Tramos Marítimos)

Este archivo maestro indexa las distancias náuticas oficiales entre los puertos de operación y el factor de tolerancia ambiental (`weather_factor`). Estos valores alimentan de forma directa el cálculo de `sea_days` y el consumo proyectado de bunker en navegación marítima dentro de **Geeksoft**.

## 📊 1. Matriz de Rutas y Distancias Oficiales

El sistema realizará un lookup relacional utilizando la combinación de las llaves primarias `origin_port_id` + `destination_port_id`.

|**Origen (origin_port_id)**|**Destino (destination_port_id)**|**Distancia (route_distance)**|**Factor de Clima (weather_factor)**|**Descripción de la Ruta**|
|---|---|---|---|---|
|**ILO**|**MATARANI**|69.0 NM|0.03 (3%)|Tramo corto de cabotaje sur (Perú)|
|**ILO**|**SAN_JUAN_DE_MARCONA**|283.0 NM|0.03 (3%)|Tramo intermedio de cabotaje (Perú)|
|**ILO**|**MEJILLONES**|335.0 NM|0.03 (3%)|Tramo internacional de exportación (Chile)|
|**ILO**|**CALLAO**|430.0 NM|0.04 (4%)|Tramo largo cabotaje centro (Subida contra corriente)|

_Nota: Las distancias están expresadas en Millas Náuticas (NM)._

## 📐 2. Impacto Matemático en el Motor de Cálculo P&L

El agente de desarrollo debe asegurar que estas variables se inyecten automáticamente en la **Fase I (Simulación de Tiempos)** de la nota `[[CT-01-Motor-Calculo-PL-Simetrico]]`.

El `weather_factor` actúa como un multiplicador directo sobre la distancia, simulando que el barco recorre más millas reales debido al efecto del viento, oleaje y corrientes:

$$\text{sea\_days} = \frac{\text{route\_distance} \times (1 + \text{weather\_factor})}{\text{vessel\_speed} \times 24}$$

### 🧭 Ejemplo de Impacto Real (Ruta Ilo - Matarani):

- Distancia base: $69\text{ NM}$
    
- Distancia corregida por clima ($+3\%$): $69 \times 1.03 = 71.07\text{ NM}$ real operativa.
    
- Esto garantiza que el cálculo de `total_bunker_costs` absorba el bunker extra consumido en condiciones climáticas estándar de la costa.
    

## 💻 3. Lógica de Consulta en Base de Datos (SQL/Supabase)

Plaintext

```
FUNCTION get_route_parameters(origin, destination):
    route = DB.query("""
        SELECT route_distance, weather_factor 
        FROM routes_master 
        WHERE origin_port_id = @origin 
          AND destination_port_id = @destination
    """)
    
    // Fallback de contingencia técnica
    IF route IS NULL THEN
        // Si no existe la ruta en la matriz, el sistema intenta buscar la ruta inversa
        route = DB.query("""
            SELECT route_distance, weather_factor 
            FROM routes_master 
            WHERE origin_port_id = @destination 
              AND destination_port_id = @origin
        """)
    ENDIF
    
    IF route IS NULL THEN
        THROW ERROR "Ruta marítima no cartografiada en el Maestro de Rutas."
    ENDIF
    
    RETURN route
END FUNCTION
```

## 🔗 Relaciones Lógicas en Obsidian

- Esta nota elimina la necesidad de digitar manualmente la distancia en el `[[Módulo UI - Ingreso Rápido de Viaje]]`. Se autocompleta al definir el origen y destino.
    
- Inyecta argumentos críticos e inamovibles al backend de simulación: `[[CT-01-Motor-Calculo-PL-Simetrico]]`.
    

## 💡 Instrucción de Contexto para el Agente (Antigravity IDE):

> "Cuando el usuario seleccione el puerto de origen y el puerto de destino en la interfaz gráfica, el frontend debe disparar un lookup automático a esta nota. El sistema bloqueará los campos de `route_distance` y `weather_factor` convirtiéndolos en parámetros automáticos de solo lectura.
> 
> Para pasar el test unitario inamovible de la ruta Ilo-Matarani, la base de datos debe proveer exactamente `route_distance = 69.0` y `weather_factor = 0.03`, permitiendo que el cálculo de `sea_days` converja con total precisión matemática en **0.538409 días**."