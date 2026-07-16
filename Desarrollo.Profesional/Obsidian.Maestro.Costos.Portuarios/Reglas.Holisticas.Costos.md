# 🧠 Lógica Holística de Costos Portuarios

> **Fuente de Análisis**: Excel `Costos.SUA % 2026 01.07.2026 REV AL 03.07.CALLAO.xlsx`
> **Objetivo**: Estructurar las tarifas planas y manuales del liquidador en fórmulas sistémicas que permitan un cálculo automatizado y dinámico basado en las propiedades del buque y la operación.

El excel analizado depende excesivamente de celdas "hardcodeadas" y multiplicaciones manuales (el liquidador inserta "2 maniobras" o "34 horas" a mano). Para construir la **Matriz Dinámica**, debemos separar las tarifas de las cantidades.

## 2. Principios de Diseño (Anti-Hardcoding)
> **REGLA DE ORO:** Queda **estrictamente prohibido** esconder números mágicos o multiplicadores fijos (ej. un `* 2`) dentro del código de las fórmulas. Todas las variables matemáticas (Cantidad de Remolcadores, Cantidad de Maniobras, Días, Horas, Porcentaje de Descuento) deben ser **parámetros explícitos (inputs)** en la base de datos y visibles para el usuario en la interfaz.

---

## 1. Clasificación de Variables Multiplicadoras (Cantidades)
Para que el sistema calcule el costo holísticamente, la tarifa del proveedor debe cruzarse con una de estas dimensiones extraídas del buque o la ruta:

1. **Atributos Físicos del Buque**:
   - `GRT (TRB)`: Tonelaje de Registro Bruto.
   - `LOA (Eslora)`: Longitud del buque en metros.
2. **Atributos de Tiempo**:
   - `Horas de Puerto Totales`: Tiempo de estadía completo en el muelle. Se calcula sumando el tiempo teórico de operación y los tiempos de maniobra periféricos introducidos manualmente por el liquidador:
     * *Cálculo:* `Tiempo de amarre a inicio de carga` + `(Cantidad / Ritmo Operativo Buque-Terminal)` + `Tiempo de término de carga a desamarre`.
     * **OJO con el Ritmo:** No existe un único "ritmo". El nombre correcto debe reflejar que existe un **Ritmo de Carga** y un **Ritmo de Descarga**, los cuales varían drásticamente dependiendo de la combinación exacta del **Buque + Puerto + Terminal Específico**. El liquidador deberá seleccionar o ingresar este `Ritmo Operativo (Buque-Terminal-Operación)` puntual.
   - `Días / Turnos`: Días de operación para ciertos cobros (ej. Muellaje en Ilo).
3. **Atributos Operativos**:
   - `Maniobras`: Número de movimientos (generalmente 2: entrada y salida, o 4 si hay shifting).
   - `Lanchas / Unidades`: Número de recursos físicos despachados.
4. **Condiciones del Viaje**:
   - `Nacional / Cabotaje vs Extranjero`
   - `Horario Hábil vs Nocturno/Feriado`

---

## 2. Desglose de Fórmulas y Reglas por Proveedor/Servicio

### A) Shifting & Towage (Maniobras y Remolcaje)
> **Regla del Casino (Traslape de Horarios):** ¡La casa siempre gana! Si una maniobra (práctico o remolcador) comienza en un horario normal (barato) pero cruza o termina en un horario extraordinario/nocturno/feriado (caro), se aplicará la tarifa **más alta** a toda la maniobra.
* **Practicaje (Pilotage)**
  * *Callao (Transtotal)*: `Tarifa Fija por maniobra` x `Maniobras`. Ej: $750 x 2 = $1500.
  * *Mejillones (Todos los Terminales)*: 
    - **Pilotage**: `Tarifa Plana (Número Duro)` x `Maniobras`. Ej: $1,151.01 x 1.
    - **Pilot Insurance**: Seguro por maniobra. Ej: $110 x 3 = $330.
  * *Marcona (Bundle)*: Empaqueta `Practicaje + Lancha de Práctico` x `Maniobras`. Ej: $4980 x 2 = $9960.
  * *Fórmula Alternativa*: `$0.055 x GRT`.
* **Linesmen (Amarre y Desamarre)**
  * *Por Maniobra*: Ej. Callao `$170 x 4`, Marcona `$4450 x 2`, Mejillones (Gen) `$1000 x 2`, Mejillones (Interacid) `$870 x 2`, Mejillones (Terquim) `$801 x 2`.
  * *Tarifa Única (Matarani)*: Tarifa plana por todo el servicio. Ej: `$357.30 x 1 = $357.30`.
* **Remolcadores (Towage)**
  * *Callao (Petranso)*: `Tarifa Mínima` x `Maniobras`. Ej: $800 x 4 maniobras = $3200.
  * *Marcona (PSA Marine)*: `Tarifa Plana` x `Maniobras`. Ej: $18,000 x 2 = $36,000. *(Nota: Existe un comodín de "Remolcaje Stand by por maniobra" de $16,000, además de la regla de penalidad de $3,000/día pasadas las 60h).*
  * *Ilo (Opciones: PSA Marine o Petranso)*: Tienen una estructura compuesta por dos cobros paralelos por cada maniobra (In o Out):
    1. **Tarifa Base**: `Factor x GRT x Cantidad de Remolcadores`. (Ej: PSA=$0.16, Petranso=$0.15).
    2. **Posicionamiento**: Tarifa plana extra por la maniobra. (Ej: PSA=$700, Petranso=$600).
    * *Nota Horaria*: Ambas tarifas (Factor y Posicionamiento) varían dependiendo de la hora y el día (aplicando siempre la Regla del Casino si hay traslape). Además, las tarifas de entrada (In) y salida (Out) se calculan de manera independiente ya que pueden ocurrir en distintos horarios o requerir diferente cantidad de remolcadores.
  * *Mejillones (Todos los Terminales)*:
    1. **Maniobra Regular**: `Tarifa Fija por maniobra`. Ej: Genérico `$6,500 x 5` / Interacid y Terquim `$2,800 x 4`.
    2. **Stand by**: `Tarifa por hora` x `Horas`. Ej: $648 x 28h = $18,144.
    3. **Navigation**: `Tarifa por hora` x `Horas`. Ej: $745 x 8h = $5,960.
* **Servicio Integral (Matarani: Pilot + Tugs + Lancha)**
  * Matarani empaqueta Práctico, Remolcadores y Lancha en una sola tarifa base: `Tarifa Base` x `Cantidad de Maniobras`. (Ej: $5550 x 2 = $11,100).
  * **Regla de Recargos (Porcentual)**: A diferencia de otros puertos donde el recargo es fijo, aquí se cobra un **porcentaje sobre la tarifa base**, dependiendo del horario:
    * **+25%**: Lunes a Sábado (18:00 a 24:00 hrs).
    * **+50%**: Lunes a Sábado (00:00 a 07:00 hrs), Domingos y Feriados.
* **Port Toll / Land Transport / Cargo de Acceso**
  * *Port Toll*: Tarifa plana por movimiento (maniobra). Ej: `$75 x 2 movimientos = $150`.
  * *Cargo de Acceso (Matarani)*: Tarifa plana multiplicada por cantidad. Ej: `$70 x 4 = $280`.

### B) General Port Expenses (Gastos Generales)
* **Garbage Disposal (Recojo de Basura)**
  * *Callao*: Tarifa plana. Ej: $300.
* **Coordinator on board (Exclusivo Ilo)**
  * Tarifa plana multiplicada por cantidad de maniobras o turnos (Ej: `$200 x 2 = $400`).
* **Lighthouse Dues (Faro y Balizas)**
  * *Callao*: No aplica o tarifa plana.
  * *Ilo*: Fórmula condicional por `GRT` basada en procedencia.
    * Si origen = **Nacional**: `$0.03 x GRT`
    * Si origen = **Extranjero**: `$0.12 x GRT`
  * *Perú (Nacional)*: `$0.03 x GRT`.
  * *Perú (Extranjero)*: `$0.12 x GRT`.
  * *Chile (Light Dues)*: `$3.74 x GRT / Año`. (Requiere lógica para prorratear por viajes anuales).
  * *Mejillones (Genérico / Barquito)*: `Fórmula x GRT`. Ej: $1.56 x 8259 = $12,884.04.
* **Dockage / Muellaje**
  * *Callao (APM)*: `Tarifa por hora/metro` x `LOA` x `Horas de Puerto`. Ej: $1.50 x LOA x Horas.
  * *Ilo (SPCC)*: `Amarre Fijo` + (`Tarifa Diaria/GRT` x `GRT` x `Días`). Ej: $300 + ($0.05 x GRT x Días).
  * *Matarani (Tisur)*: `Tarifa por hora/metro` x `LOA` x `Horas de Puerto`. Ej: $0.65 x LOA x Horas. *(Nota: Las Horas de Puerto deben sumar rigurosamente los tiempos periféricos de amarre/desamarre al tiempo neto de operación).*
  * *Mejillones (Genérico / Barquito)*: `Tarifa Fija x Horas (TH)`. Ej: $71.92 x 28h = $2013.76.
  * *Mejillones (Interacid)*: `Tarifa Fija x Horas (TH)`. Ej: $702 x 36h = $25,272. **IMPORTANTE:** Introduce la variable **Pass Through (Toggle/Checkbox)** en el Frontend. Esto permite al usuario decidir si el costo es asumido directamente por el cliente (costo $0 para la agencia) o si se liquida normalmente.
  * *Mejillones (Terquim)*: `Tarifa x LOA x Horas (TH)`. Ej: $5.72 x LOA x 30h. También aplica la regla de **Pass Through (Toggle)**.
* **Launch Hire (Lanchas)**
  * *Callao (Transtotal)*: `Tarifa por Lancha` x `Cant. Lanchas`. Ej: $85 x 4 lanchas = $340.
  * *Matarani (Autoridades)*: `Tarifa por Hora` x `Horas` (**Regla de Mínimo 2 horas**). Ej: $155 x 2h = $310.
  * *Marcona*:
    1. **Autoridades**: Tarifa plana única. Ej: `$200 x 1 = $200`.
    2. **Stand By**: `Tarifa por hora` x `Horas`. Ej: `$40 x 32h = $1280`.
  * *Mejillones (Todos los Terminales)*:
    1. **Amarre y Desamarre / Recepción**: Tarifa plana x Cantidad. (Ej: Genérico `$720x6`, Interacid `$450x4`).
    2. **Stand by**: Tarifa por hora x Horas. Ej: `$100 x 28h`.
    3. **Anchorage at roads / Anchorage**: Tarifa plana. (Ej: Genérico `$430x1`, Interacid `$390x1`).
    4. **Inward/Outward clearances**: Tarifa plana x Cantidad.
    5. **Pier Usage / Embarcadero (Interacid y Terquim)**: Tarifas planas únicas. Ej: Pier Usage `$420x1`, Embarcadero `$280x1`.
  * *Ilo*: El servicio se subdivide en 4 rubros con lógicas de cobro mixtas:
    1. **Autoridades / Práctico (In/Out)**: `Tarifa por Hora` x `Horas` (**Regla de Mínimo 4 horas**). Ej: $90 x 4h = $360.
    2. **Coordinador**: `Tarifa por Hora` x `Horas` (**Regla de Mínimo 4 horas**). Ej: $85 x 4h = $340.
    3. **Amarre / Desamarre**: `Tarifa plana` x `Cantidad de Maniobras` (ej. 2 In / 2 Out = 4). Ej: $375 x 4 = $1500.
    4. **Posicionamiento**: `Tarifa plana` x `Cantidad de Maniobras` (Si es aplicable). Ej: $100 x 4 = $400.
* **Inspecciones y Clearance**
  * *Clearance In/Out*: Tarifa plana (Ej. $200). **Regla Condicional:** Solo se paga si el barco viene o va al extranjero. Si tiene origen o destino peruano (cabotaje), el costo es $0.
  * *Sanitary Inspection*: Tarifa plana (Ej. $520). **Regla Condicional:** Aplica igual que el Clearance; solo se paga en viajes internacionales (extranjero).
  * *Gastos Estándar*: Coordinator, Sanitary Inspection, Clearance son tarifas planas x viaje.
* **Gastos Logísticos y de Autoridades Extra (Mejillones)**
  * En Mejillones, el rubro logístico está muy detallado (transportes separados por actor) pero todos funcionan como **Tarifas Planas puras**:
    * **Transporte**: *Pilot Transport*, *Linesmen*, *Authorities*.
    * **Port Toll / Terminal Fee (Barquito)**: Tarifa plana adicional. Ej: `$75 x 1`.
    * **Autoridades**: *Authorities Charges*, *Immigration*, *Health*.
    * **ISPS Fee**: Tarifa de Seguridad Portuaria (Plana). Ej: Interacid `$1,273`, Terquim `$1,191`.
* **Recargos Operativos (Mejillones / B&M)**
  * *Stand by Fondeo (Horario Hábil)*: `Tarifa/Hora` x `Horas`. (Ej. $340/hr).
  * *Stand by Fondeo (Festivos/Nocturno)*: `Tarifa/Hora` x `Horas`. (Ej. $510/hr).

### C) Agency Expenses (Agenciamiento)
Estos suelen ser **tarifas planas** por servicio (Tarifa Fija x 1 viaje).
* **Agency Fee**: Honorarios del agenciamiento (Ej Callao=$1000, Ilo=$900, Matarani=$1100, Marcona=$1400, Mejillones=$1200).
* **Coordinator / Loading Master**: 
  * *Coordinator*: `Tarifa x Turno/Día`. (Ej: $225 x 2).
  * *Loading Master*: En Mejillones (Gen) y Terquim es una `Tarifa Plana` ($2450 / $2923). En Mejillones (Interacid) es `Tarifa por Hora` ($86 x 36h).
* **Hose Connection / Portalon (Terquim)**: Cobro opcional bajo Agency Expenses ("Solo si requiere"). Funciona como un **Checkbox de Tarifa Plana** en el Frontend. Ej: $2500 x 1.
* **Transportation / Comunication**: Tarifa Plana por viaje. (Ej Callao = $250, Ej Ilo = $200, Ej Marcona = $250).

---

## 3. Conclusión Arquitectónica para la BD

El Maestro de Tarifas Portuarias que crearemos no solo debe guardar un monto (`amount`), sino la **fórmula** (`calculation_type` o `multiplier`) que utilizará el motor, por ejemplo:
- `FLAT`: Solo sumar.
- `PER_GRT`: Multiplicar tarifa por GRT del buque.
- `PER_LOA_HOUR`: Multiplicar tarifa por (LOA x Horas en Puerto).
- `PER_MANEUVER`: Multiplicar tarifa por número de maniobras.
- `CONDITIONAL_FOREIGN`: Validar la condición del puerto anterior.

Esto eliminará la dependencia del excel manual y permitirá que, si cambia la eslora del barco, el muellaje se recalcule matemáticamente de forma holística.
