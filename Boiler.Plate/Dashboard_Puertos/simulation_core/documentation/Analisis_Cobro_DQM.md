# Análisis Tarifas Contrato DQM (Odfjell) a NEXA 2022

Este análisis describe la estructura de facturación actual que aplica el operador **DQM (Odfjell)** a **NEXA**, basada en el benchmark de datos reales ("Input Tejerina").

---

## 1. El Concepto de "Composite" Mensual
DQM no aplica una tarifa única por tonelada. Su facturación es un **modelo híbrido** que combina cargos por capacidad reservada (fijos) y cargos por actividad logística (variables).

### Estructura de la Factura:
$$Factura Total = [Cargos Fijos (Capacidad)] + [Cargos Variables (Flujo)] + [Cargos Adicionales (Penalidades)] $$

---

## 2. Cargos Fijos: Los Bloques de Capacidad
DQM segmenta el cobro del almacenaje en función de la antigüedad de la infraestructura (Contrato Inicial vs. Adendas).

| Bloque de Capacidad | Configuración | Capacidad ($m^3$) | Capacidad ($MT$) | Tarifa Mensual | Tarifa Unit. (USD/MT) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bloque 1 (Base)** | 3 Tanques (Original) | 10,200 | 18,768 | USD 86,902 | **USD 4.63** |
| **Bloque 2 (Adenda)** | Por cada Tanque Adic. | 3,400 | 6,256 | USD 53,696 | **USD 8.58** |

**Nota sobre la Derivación:** 
La tarifa normalizada se obtiene dividiendo la *Tarifa Mensual* entre la *Capacidad ($MT$)*. El tonelaje se calcula multiplicando los $m^3$ por la densidad crítica de **1.84**.

**Análisis de la Brecha:** 
DQM cobra un **85% más caro** el almacenaje en los tanques adicionales que en los originales. Esta diferencia responde a la **función operativa de "Buffer"** que cumplen estas unidades:
1.  **Baja Rotación:** A diferencia de los tanques base que mantienen el flujo constante, los adicionales absorben las demoras de puerto y picos de stock.
2.  **Costo de Disponibilidad:** Al estar subutilizados gran parte del tiempo, la tarifa unitaria compensa la reserva de capacidad necesaria para la seguridad logística de NEXA.

---

## 3. La Normalización por Densidad (1.84)
DQM cotiza internamente por volumen ($m^3$), pero factura a NEXA por peso (MT). 

*   **Tanque Estándar:** 3,400 $m^3$
*   **Capacidad en Toneladas:** $3,400 \times 1.84 = 6,256 \, MT$.

Al usar la densidad de **1.84**, DQM maximiza el rendimiento por metro cúbico ocupado, ya que el ácido sulfúrico es casi el doble de pesado que el agua.

---

## 4. Cargos Variables: El Impuesto a la Actividad
Una vez pagado el "derecho" a tener el tanque, DQM cobra por cada movimiento:

1.  **Variable por Despacho (Embarque):** **USD 3.62 / MT**. Este es el costo por bombear el producto del tanque al buque.
2.  **Tarifa de Recepción en Cisternas:** **USD 6.25 / MT**. Esta es una tarifa punitiva; DQM prefiere la recepción por vagón. Si el ácido llega en camión, el costo de recepción se dispara un 72% por encima del costo de embarque.
3.  **Exceso sobre Mínimo Garantizado:** **USD 2.50 / MT**. Si NEXA supera un volumen acordado, DQM aplica un cargo adicional de "congestión".
4.  **Sobretiempo en Vagones:** **USD 4.02 / MT**. Penalidad por ineficiencia en la descarga de trenes.

---

## 5. Simulación de un Mes "Tipo" (5 Tanques / 40k MT)
Para entender por qué NEXA siente que el costo es alto, veamos la composición de una factura típica:

*   **Almacenaje Fijo (3 Base + 2 Adic.):** USD 194,294 (57.6%)
*   **Embarque Variable (40,000 MT):** USD 144,800 (42.4%)
*   **TOTAL MENSUAL:** **USD 339,094**

### Indicador Clave para NEXA:
El costo efectivo que NEXA paga por tonelada "todo incluido" es de **USD 8.47 / MT**. 

> **Conclusión para PETRAL:** Nuestra propuesta inicial de USD 16.00 solo en almacenaje (sin contar variables) triplicaba el costo fijo actual de NEXA. El objetivo de negociación debe ser presentar una tarifa plana competitiva con el promedio de USD 6.21 que ellos pagan hoy solo por almacenaje.

---

## 6. Análisis de Rotación (Turnover) y Dinámica Operativa
La eficiencia del terminal se mide por la rotación, pero esta no es uniforme entre todos los tanques. El modelo de DQM separa la infraestructura en unidades de flujo constante (Base) y unidades de seguridad (Buffer).

### Asimetría de Rotación:
*   **Tanques Base (Verdes):** Diseñados para la recepción continua del Ferrocarril Central. Tienen una rotación alta y son el motor del flujo mensual.
*   **Tanques Buffer (Rojos):** Funcionan como pulmones logísticos. Su rotación es mucho menor, pues su objetivo es garantizar que siempre haya espacio disponible para absorber la producción de la planta ante demoras en el arribo de buques.

![Logística Tanques vs Buque](chart_logistica_nexa.png)

### El Desafío del Buque:
Como se observa en la infografía, un buque típico de ácido sulfúrico tiene una capacidad de **15,000 MT**. 
*   **Impacto:** Un solo embarque consume el **48% de la capacidad estática total** del terminal (5 tanques) y drena casi **2.4 tanques** de una sola vez.
*   **Necesidad de Buffer:** Sin los tanques rojos (Buffer), el terminal no tendría capacidad de maniobra para seguir recibiendo producto de la planta mientras se espera el atraque y conexión del buque.

**Resumen Operativo:**
$$Rotación \, Promedio: \mathbf{1.07} \, (400k \, TM / 12 \, meses / 31.3k \, Capacidad)$$
Aunque el promedio es bajo, los tanques Base operan a ritmos mucho más intensos para compensar la pasividad estratégica de los Buffers.

---
**Elaborado por:** Gemini (Coding Assistant)
**Fecha:** 2026-05-04
