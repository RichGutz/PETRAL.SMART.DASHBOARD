# ⚓ CALLAO — Reglas de Costos Portuarios (Modelo JSONB)
> **Terminal**: APM Terminals | **País**: Perú 🇵🇪
> **Fuente PNG**: [[PNG_Callao_Layout]] | **DB**: `port_id=CALLAO`, `terminal=APM`
> **Agente**: Transtotal | **t/c referencia**: 3.42
> **Buque ref (Moquegua)**: Eslora 134 | GRT 8,259

---

## 🎯 Principio de Operación: La Regla del Casino
En el Callao, los servicios que dependen de una maniobra física (Práctico, Remolcadores, Lanchas) están sujetos a variaciones de precio (fijos o porcentuales) dependiendo de la **fecha y hora exacta en que TERMINA la maniobra**. Por lo tanto:
1. Los conceptos genéricos (ej. "Pilotage x 2") se **desdoblan** en eventos independientes de IN y OUT.
2. Cada concepto se evalúa contra su propia `hora_termino` (`end_time`).
3. Las tarifas se extraen de un campo `JSONB` que contiene la tarifa base y un array de reglas de recargo (`absolute` o `percentage`).

---

## A) Shifting Expenses — Conceptos Desdoblados (IN / OUT)

### 🚢 Pilotaje (Practicaje)
> **Fórmula Backend**: `MAX( [Tarifa_Extraída_JSONB], 0.055 * GRT )`

| Concepto ID | Tipo Cálculo | JSONB `default_rate` | Reglas de Recargo (Casino Rule) |
|---|---|---|---|
| **Pilotage_IN** | `CONDITIONAL_MAX` | $750.00 | • Overtime: `+ $ Fijo` (absolute) o `+ %` (percentage)<br>• Feriado/Domingo: `$ Fijo` (absolute) |
| **Pilotage_OUT** | `CONDITIONAL_MAX` | $750.00 | *(Mismo JSONB, pero evaluado con hora de salida)* |

### 🚤 Remolcaje (Towage)
> **Fórmula Backend**: `MAX( [Tarifa_Extraída_JSONB], 0.065 * GRT ) × Remolcadores_Usados`

| Concepto ID | Tipo Cálculo | JSONB `default_rate` | Reglas de Recargo (Casino Rule) |
|---|---|---|---|
| **Towage_IN** | `CONDITIONAL_MAX` | $800.00 | • Overtime: `$ TBD` o `% TBD`<br>• Feriado/Domingo: `$ TBD` |
| **Towage_OUT** | `CONDITIONAL_MAX` | $800.00 | *(Mismo JSONB, pero evaluado con hora de salida)* |

### 🛥️ Lanchas Operativas (Launch Hire)
> **Fórmula Backend**: `[Tarifa_Extraída_JSONB] × Lanchas_Usadas`

| Concepto ID | Tipo Cálculo | JSONB `default_rate` | Reglas de Recargo (Casino Rule) |
|---|---|---|---|
| **Launch_IN** | `PER_QTY` | $85.00 | • Overtime: `$ TBD`<br>• Feriado/Domingo: `$ TBD` |
| **Launch_OUT** | `PER_QTY` | $85.00 | *(Mismo JSONB, pero evaluado con hora de salida)* |

---

## B) General Port Expenses — Tarifas Estándar

*Estos ítems NO están sujetos a la Regla del Casino de las maniobras, por lo que su JSONB no tiene `time_rules` complejas, solo el `default_rate`.*

| Concepto ID | Tipo Cálculo | JSONB `default_rate` | Condición / Observación |
|---|---|---|---|
| **Lighthouse_Dues** | `PER_GRT` | $0.03 (Nac) / $0.12 (Ext) | Condicionado a la procedencia del último puerto. |
| **Dockage_APM** | `PER_LOA_HOUR` | $1.50 | Fórmula: `1.50 × LOA × Horas_Totales`. |
| **Coordinator** | `PER_QTY` | $225.00 | Por número de días o turnos. |
| **Clearance** | `FIXED_FLAT` | $200.00 | Solo aplica en viajes internacionales. |
| **Sanitary** | `FIXED_FLAT` | $520.00 | Tarifa plana fija. |

---

## C) Agency Expenses — Tarifas Estándar

| Concepto ID | Tipo Cálculo | JSONB `default_rate` | Condición / Observación |
|---|---|---|---|
| **Agency_Fee** | `FIXED_FLAT` | $1,000.00 | Tarifa plana agencia. |
| **Transportation** | `FIXED_FLAT` | $200.00 | Tarifa plana logística (autoridades). |
| **Comunication** | `FIXED_FLAT` | $250.00 | Tarifa plana comunicación. |

---

## 🛠️ Estructura JSONB y Ejemplo Matemático 
**(Para el ítem `Pilotage_IN`)**

```json
{
  "default_rate": 750.00,
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

**Escenario de Prueba (Buque Moquegua: GRT 8,259)**
* La maniobra de Ingreso (IN) termina a las **19:00 hrs un Jueves hábil**.
* El motor identifica que cae en la condición `Fuera de Horario` (17:00 a 08:00) y que el `value_type` es porcentaje (`25.0`).
* Calcula tarifa temporal: `750 * 1.25 = $937.50`
* Ejecuta la lógica matemática asignada al concepto (`CONDITIONAL_MAX`):
  * `MAX(937.50, 0.055 × 8259)`
  * `MAX(937.50, 454.25) = $937.50`
* **Costo final de Pilotage_IN = $937.50**
