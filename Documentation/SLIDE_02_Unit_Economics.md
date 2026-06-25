# Slide 2: Unit Economics & Cost Allocation

> **¿Qué son los Unit Economics?**
> La economía unitaria es el análisis financiero que te dice si tu modelo de negocio es rentable a nivel de una sola unidad. Es la radiografía que demuestra si ganas o pierdes dinero cada vez que realizas una sola venta, antes de meter a la bolsa los costos fijos globales de la empresa (como el alquiler de una oficina o los sueldos administrativos). En Petral, mi opinion es que el UNIT ECONOMICS debe ser el viaje. La razón es que solo con informacion a nivel viaje, podremos identificar problemas que ocurren en las rutas, ventanas de tiempo, etc y proponer oportunidades de mejora

## 1**Modelo Actual (Petral):** El Unit Economics se maneja a nivel **Buque por Mes**. (P&L a nivel Gross por barco).
* **Nuestra Propuesta:** Bajar un nivel de granularidad y llevar el Unit Economics a nivel **Viaje**.
Tener el P&L por viaje te permite sumar hacia arriba para ver el mes del barco, pero evita que viajes muy rentables escondan u oculten viajes que generaron pérdidas operativas.

## 2. El Reto: Cost Allocation (Asignación de Costos)
*Para lograr esta granularidad, debemos definir con lo users las reglas de negocio para dividir (allocar) los costos del buque hacia los viajes específicos:*

### Pregunta DIFICIL: La Llave de Prorrateo (Allocation Driver)
Para los costos fijos mensuales (ej. comisiones, seguros, arriendos fijos mensuales), ¿cómo los vamos a partir?
* ¿Los dividimos proporcionalmente a los **días** que duró cada viaje en el mes?
* ¿O proporcionalmente a las **toneladas** que transportó cada viaje?

### Pregunta 2: El "Tiempo Muerto" (Idle Time)
¿Qué pasa con el bunker o los días de arriendo que se gastan cuando un barco termina un viaje y se queda anclado o navegando en lastre (vacío) esperando el siguiente contrato?
* ¿Ese costo de "espera" se lo cargamos al Viaje que acaba de terminar?
* ¿Se le carga al Viaje que va a empezar?
* ¿O se queda en una bolsa separada de "Costo de Buque No Asignable a Viaje"?

### Pregunta 3: Múltiples Clientes en un viaje
En caso de COA, ¿Existen escenarios donde un mismo barco en un solo viaje transporte carga para Nexa y para Southern al mismo tiempo?
* De ser así, el *Cost Allocation* tendría que bajar un nivel más (de Viaje a Cliente/Contrato).
