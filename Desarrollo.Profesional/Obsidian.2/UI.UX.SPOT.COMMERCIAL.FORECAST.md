## La Experiencia de Usuario Real (Lo que verás en pantalla)



### 📅 El Escenario del Forecast Comercial (El Planificador por Meses)

Ahora, imagina que el dueño te pide la proyección del segundo semestre del año. El comercial cambia de pestaña al **Commercial Forecast**:

1. Elige el rango: `Julio 2026 - Diciembre 2026`.
    
2. El sistema estira una grilla limpia de 6 filas (una por mes).
    
3. En la fila de **Julio**, el comercial selecciona `SPCC`, `Matarani`, `B/T Tablones`, digita `13,500 MT` y en **Frecuencia** pone `2` (significa que habrá dos viajes iguales ese mes).
    
4. Con un botón que dice **"Clonar a los meses siguientes"**, copia esa configuración para Agosto, Septiembre y Octubre.
    
5. Para Noviembre y Deciembre, cambia el barco al `B/T Moquegua` porque el Tablones entra a mantenimiento estallando de forma híbrida los consumos de IFO y MDO.
    
6. Arriba de la grilla, **Apache ECharts** empieza a dibujar una curva en tiempo real: las barras azules muestran las ventas escalando mes a mes y una línea verde brillante te muestra el Gross Margin consolidado del semestre.
Imagínate que estás sentado con Fernando Harten o Jorge Neyra revisando la pantalla del nuevo proformador web:

### 🏎️ El Escenario SPOT (La Cotización Rápida)

1. El comercial abre el sistema y ve un panel limpio con 4 menús desplegables y un cuadro de texto.
    
2. Selecciona **Cliente:** `SPCC`, **Destino:** `Matarani`, **Barco:** `B/T Tablones`, y digita **Toneladas:** `13,500`.
    
3. Al segundo de escribir el último número (sin hacer clic en "calcular" ni esperar a que cargue), **¡PUM!**, la pantalla parpadea sutilmente en verde y se llena de cifras crudas abajo.
    
4. En lugar de una masa gris de datos, el sistema le dibuja el flujo del viaje de forma idéntica a su cerebro:
    
    - **El bloque de ingresos:** Ve la multiplicación cruda: **$13,500 \times \$19.01$ = $256,635.00**.
        
    - **El bloque de muelle:** Le dice en letras grandes: _"Vas a pasar 27 horas cargando, 45 horas descargando y 12 horas en trámites burocráticos. Total en puerto: 3.5 días"_.
        
    - **El bloque de búnker:** Le muestra la barrita de combustible consumida: _"El buque quemará 22.60 toneladas de IFO, lo que equivale a $20,230.37"_.
        
    - **La rentabilidad:** En la esquina superior derecha, un indicador en negrita le dice: **Voyage Result: $195,404.63 USD** (TCE diario de **$48,386.54 USD/día**).
        

Si el comercial dice: _"Oye, ¿y si le metemos 14,000 toneladas a ver si pasamos al siguiente bracket de flete?"_, cambia el número a `14,000` y toda la pantalla se recalcula al instante, actualizando el consumo de las bombas, las horas de muelle y el margen neto en milisegundos. **Eso es lo que desplaza al Excel: la velocidad y la predictibilidad.**