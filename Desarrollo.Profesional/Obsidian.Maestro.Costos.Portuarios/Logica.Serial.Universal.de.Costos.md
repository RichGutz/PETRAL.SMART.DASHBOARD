# 🧮 Lógica Serial Universal de Costos Portuarios (Modelo JSONB)

> **Objetivo**: Estandarizar la inmensa complejidad y variabilidad de las tarifas portuarias (Perú y Chile) en una arquitectura predecible, escalable y auditable.
> **Diseño Central**: El "Pipeline de 3 Filtros" (Tubería Serial). Cada ítem de costo pasa por una secuencia estricta de filtros que mutan y calculan su valor final basándose en las propiedades del viaje, la hora de la maniobra y las matemáticas del barco.
> **Regla de Oro**: Ningún concepto genérico agrupa eventos que ocurren en distintos tiempos. Los servicios que dependen de la hora exacta de la maniobra se **desdoblan** en Base de Datos (ej. `Pilotage IN` y `Pilotage OUT`).

---

## 🏗️ La Tubería de 3 Filtros (Pipeline Serial)

El algoritmo del motor de cálculo procesará *absolutamente todos* los ítems tarifarios pasando su tarifa base (`default_rate`) por el siguiente proceso en serie:

### 1️⃣ Filtro 1: Reglas de Propiedad (Viaje / Operación)
> **¿De dónde viene, a dónde va o qué características estáticas tiene el viaje?**

Este filtro intercepta el ítem y modifica su Tarifa Base dependiendo de atributos fijos del viaje (no relacionados con el tiempo).
- **Mecanismo**: Busca coincidencias en el array `property_rules` del JSONB.
- **Acción**: Si hay coincidencia, puede reemplazar (pisotear) la tarifa base absoluta.
- **Ejemplo Clásico**: `Lighthouse Dues` / `Clearance`.
  * *Si la procedencia (`last_port`) es Extranjero*, la tarifa pasa de $0.03 a $0.12.
  * *Si el destino (`next_port`) es Nacional*, la tarifa de Clearance pasa de $200 a $0.

---

### 2️⃣ Filtro 2: Reglas de Tiempo ("La Regla del Casino")
> **¿A qué hora exacta terminó esta maniobra específica?**

Dado que el desdoblamiento nos garantiza que cada ítem (ej. `Towage IN`) tiene un `end_time` preciso e individual, este filtro evalúa si esa hora cae en un rango penalizado.
- **Mecanismo**: Busca coincidencias en el array `time_rules` del JSONB evaluando contra el `end_time` de la maniobra.
- **Acción**: 
  - Si el `value_type` es `absolute`, se pisa el valor (Ej. tarifa plana de $1700 por Feriado).
  - Si el `value_type` es `percentage`, se aplica un recargo sobre la tarifa que sobrevivió al Filtro 1 (Ej. +25% por Overtime).
- **Ejemplo Clásico**: `Pilotage IN`
  * Termina a las 19:00 hrs. Cae en Overtime. El Filtro 2 agarra la tarifa base de $750 y la convierte en $937.50 (+25%).

---

### 3️⃣ Filtro 3: Reglas Matemáticas Base (Las 7 Categorías)
> **¿Cuál es el multiplicador físico de este servicio?**

Una vez que la tarifa superó el Filtro 1 y el Filtro 2, llega como un valor "limpio y final" a la ecuación matemática asignada a ese concepto en la base de datos (`calculation_type`). El motor cruza esa tarifa final con las dimensiones físicas del buque o de la operación.

Las 7 fórmulas matemáticas posibles son:

1. **`FIXED_FLAT` (Tarifa Plana)**
   * `Costo = Tarifa (del Filtro 2)`
   * Ej: Agency Fee, Sanitary Inspection.
2. **`PER_QTY` (Por Maniobra/Unidad)**
   * `Costo = Tarifa (del Filtro 2) × Cantidad (QTY)`
   * Ej: Remolcadores (multiplicado por cantidad de Tugs), Lanchas.
3. **`PER_HOUR` (Por Tiempo/StandBy)**
   * `Costo = Tarifa (del Filtro 2) × Horas Totales`
   * Ej: Tugboat Stand By, Launch Stand By.
4. **`PER_GRT` (Por Tonelaje Bruto)**
   * `Costo = Tarifa (del Filtro 2) × GRT`
   * Ej: Lighthouse Dues, Pilotage (Chile).
5. **`PER_LOA_HOUR` (Doble Variable: Eslora × Tiempo)**
   * `Costo = Tarifa (del Filtro 2) × LOA × Horas`
   * Ej: Dockage / Muellaje (APM, Tisur, TGN).
6. **`CONDITIONAL_MAX` (Regla del Mayor Valor)**
   * `Costo = MAX(Tarifa (del Filtro 2), Multiplicador × GRT)`
   * Ej: Pilotage Callao (`MAX(Tarifa, 0.055*GRT)`).
7. **`PERCENTAGE_SURCHARGE` (Global)**
   * Absorbe cualquier recargo integral (como el de Matarani sobre el servicio completo) tras procesar sus propios filtros.

---

## 💾 Estructura de Datos (El Modelo JSONB)

Esta "serialidad" se sustenta en una única columna de base de datos (`tariffs` de tipo `jsonb`) que acompaña a cada concepto tarifario. Su diseño permite que el motor de Python realice los 3 filtros sin hardcodear excepciones ni llenar la base de datos de tablas cruzadas y magic numbers.

```json
{
  "default_rate": 750.00,
  "property_rules": [
    {
      "name": "Procedencia Extranjera",
      "condition_type": "last_port",
      "condition_value": "FOREIGN",
      "value_type": "absolute",
      "value": 200.00
    }
  ],
  "time_rules": [
    {
      "name": "Domingos y Feriados",
      "condition_type": "is_holiday_or_sunday",
      "value_type": "absolute",
      "value": 1700.00
    },
    {
      "name": "Fuera de Horario (Overtime)",
      "condition_type": "time_range",
      "start_time": "17:00",
      "end_time": "08:00",
      "value_type": "percentage",
      "value": 25.0
    }
  ]
}
```

---

> 🎯 **Conclusión Analítica Final**: 
> Este documento es la **Biblia Lógica del Sistema**. Cuando la experta liquidadora traiga las reglas finales de todos los puertos, el analista solo debe tomar cada ítem del Excel y hacerse 4 preguntas:
> 1. ¿Requiere desdoblamiento (IN/OUT) porque depende de una hora de maniobra?
> 2. ¿Aplica al Filtro 1 (Propiedades del viaje como bandera o procedencia)? 
> 3. ¿Aplica al Filtro 2 (Regla del Casino / Horarios)? 
> 4. ¿Qué Filtro 3 (Fórmula Matemática Base de las 7) usa?
> 
> **Con esas 4 respuestas, cualquier costo portuario del mundo puede ser configurado y absorbido por el motor.**

---

## 🤖 Instrucciones para Agentes AI (Next Gemini)
Si estás leyendo este documento porque el usuario te pidió mapear un **NUEVO PUERTO** o leer un nuevo **EXCEL TARIFARIO**, sigue estas reglas obligatorias:
1. **NO asumas lógicas planas.** Todo debe ser pasado por la tubería de 3 filtros.
2. **Desdobla operaciones:** Si un ítem como "Práctico" o "Remolcador" involucra un ingreso y una salida, despídelo en tu análisis creando `Concepto IN` y `Concepto OUT`.
3. **Mapea en JSONB:** Presenta tu solución escribiendo el JSONB de cada concepto, especificando sus `property_rules` y `time_rules`.
4. **Respeta el Orden:** Jamás alteres el orden secuencial de los ítems mostrados en el documento fuente (Regla Global del Sistema).
5. **Genera Flujogramas:** Si te piden diagramar, usa `graphviz` con el modelo `V4` lineal, obligando a los nodos a mantenerse en una misma columna usando `rank=same` e `invis edges`.
