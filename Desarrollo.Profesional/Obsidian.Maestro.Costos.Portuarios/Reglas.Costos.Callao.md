# ⚓ Reglas de Costos Portuarios: CALLAO (Nacional)

> **Contexto:** Basado en los comentarios y observaciones extraídos del liquidador (Patricia/Usuario). Estas reglas sirven como base teórica para la matriz dinámica de costos portuarios a nivel Perú, usando Callao como puerto de referencia inicial.

---

## 1. Gastos de Maniobra (Shifting Expenses)

### A. Pilotaje (Práctico)
Se requiere dividir este concepto en **dos operaciones distintas (IN y OUT)** en lugar de agruparlas, debido a que la tarifa del práctico es altamente sensible a la fecha y hora exacta en la que se realiza cada maniobra.

**Regla de Oro para el Cálculo (Lógica de Máximos y Horarios):**
El costo final del pilotaje (para cada maniobra IN y OUT de manera independiente) requiere un proceso de dos pasos:
1.  **Evaluación de Horario:** Recibir el `día` y la `hora` exactos de la maniobra para seleccionar la "Tarifa Fija" que corresponda (Ej. Regular: $750, Nocturno/Feriado: Monto mayor).
2.  **Lógica de Máximos:** Comparar esa Tarifa Fija seleccionada contra la **Fórmula Dinámica (`$0.055 x GRT`)**. El sistema cobrará el **valor que resulte mayor**.

*   **Pilotaje IN (Ingreso):** `MAX( Tarifa Fija(Día, Hora) , 0.055 x GRT )`
*   **Pilotaje OUT (Salida):** `MAX( Tarifa Fija(Día, Hora) , 0.055 x GRT )`

### B. Remolcaje (Towage)
*   **Proveedor**: Petranso Remolcadores.
*   **Regla de Oro para el Cálculo (Lógica de Máximos):**
    El costo final del remolque (para cada unidad/maniobra) será **el valor que resulte mayor** entre dos escenarios:
    1.  **Fórmula Dinámica (GRT):** `$0.065 x GRT`.
    2.  **Tarifa Fija según Horario:** `$800` por remolcador/maniobra en horario regular.
*   **Fórmula del Motor**: `MAX($800 [o tarifa horario], $0.065 x GRT)`
*   **Cálculo Estándar**: Típicamente requiere **4 maniobras** (2 para el IN y 2 para el OUT).

---

## 2. Gastos Generales de Puerto (General Port Expenses)

### A. Derecho de Faro y Balizas (Lighthouse Dues)
Depende estrictamente de la procedencia de la nave (último puerto).
*   **Procedencia Nacional (Cabotaje)**: `$0.03 x GRT (TRB)`.
*   **Procedencia Extranjera**: `$0.12 x GRT (TRB)`.

### B. Muellaje (Dockage)
*   **Proveedor**: APM Terminals.
*   **Fórmula**: `$1.50 x Eslora (LOA) x Horas de Puerto`.
*   *Nota: Las "Horas de Puerto" se deben calcular de manera dinámica cruzando la cantidad de carga a operar (Q) con el Ritmo (Rate) más horas estándar operativas.*

### C. Lanchas de Amarre / Desamarre (Launch Hire)
*   **Proveedor**: Transtotal.
*   **Cálculo**: `$85` por lancha por maniobra. (Típicamente 4 usos en una operación normal).

### D. Autoridades e Inspecciones
*   **Clearance (In/Out)**: Tarifa plana de `$200`.
*   **Sanitary Inspection (Recepción/Despacho)**: Tarifa plana de `$520` (Sanidad Marítima).

---

## 3. Gastos de Agenciamiento (Agency Expenses)

Son tarifas planas cobradas por el Agente Marítimo (ej. Transtotal) por sus honorarios y servicios logísticos anexos durante la recalada.

*   **Agency Fee**: Tarifa plana fija de `$1000`.
*   **Transportation**: Autoridades, coordinador y personal operativo. Tarifa plana de `$200`.
*   **Comunication**: Tarifa plana de `$250`.
*   **Coordinator on board**: `$225` por turno/día. (Ej. 2 turnos = `$450`).

---
> 💡 *Siguiente Paso: Validar si estos conceptos y divisiones (como el Pilotaje IN/OUT) aplican idénticamente para el resto de puertos nacionales (Ilo, Matarani) o si existen variaciones exclusivas.*
