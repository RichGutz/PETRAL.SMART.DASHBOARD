# ⚓ CALLAO — Reglas de Costos Portuarios `_Claude`
> **Terminal**: APM Terminals | **País**: Perú 🇵🇪
> **Fuente PNG**: [[PNG_Callao_Layout]] | **DB**: `port_id=CALLAO`, `terminal=APM`
> **Agente**: Transtotal | **t/c referencia**: 3.42
> **Buque ref (Moquegua)**: Eslora 134 | GRT 8,259 | DW 14,298

---

## A) Shifting Expenses — Reglas y Tarifas

### 🚢 Pilotaje (Pilotage)
> **Lógica**: Dos pasos — evaluar horario → aplicar MAX(tarifa, fórmula GRT)

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Pilotage.($750 + OT) | $750.00 / maniobra | `MAX(750, 0.055 * GRT) × QTY` | Tarifa Transtotal Fija. Práctico por maniobra. |
| Pilotage ($ 0.055 *GRT) | $0.055 / GRT | `0.055 × GRT` | Solo aplica si resulta mayor a $750. |

**Regla de Oro**: `MAX($750, $0.055 × GRT)` — la casa siempre cobra el mayor.
- Horario normal: $750 fijo
- Si cruza horario nocturno/feriado: aplica tarifa extraordinaria (Regla del Casino)

### 🚤 Remolcaje (Towage)
> **Proveedor**: Petranso Remolcadores | **Configuración**: 2 in 2 out = 4 maniobras

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Remolcaje | $800.00 / maniobra | `MAX(800, 0.065*GRT) × QTY × TUGS` | Tarifa mínima $800 por maniobra. |
| Remolcaje($ 0.065*GRT) | $0.065 / GRT | `0.065 × GRT × TUGBOATS` | Solo aplica si resulta mayor a $800. |

**Regla**: `MAX($800, $0.065 × GRT)` aplicado por cada maniobra × por cada remolcador.

---

## B) General Port Expenses — Reglas y Tarifas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Lighthouse Dues (Puerto Nacional) | $0.03 / GRT | `0.03 × GRT` | **Condicional**: Solo si viene de puerto PE. |
| Lighthouse Dues (Puerto Extranjero) | $0.12 / GRT | `0.12 × GRT` | **Condicional**: Solo si viene del extranjero. |
| Dockage /Muellaje ($1.50×LOA×Hr) | $1.50 / LOA×Hr | `1.50 × LOA × HOURS` | APM Terminals. $1.50 por hora o fracción. |
| Launch Hire. | $85.00 fijo | `85 × QTY` | Mooring/unmooring por maniobra/por lancha. |
| Coordinator on board | $225.00 / día | `225 × DAYS` | Tarifa fija Transtotal. Por Nave/Turno x día. |
| Clearance ( In/Out ) | $200.00 fijo | `200` | Aplica solo en viajes internacionales. |
| Sanitary Inspection | $520.00 fijo | `520` | Tarifa fija según Sanidad Marítima. |

### 🔑 Reglas Condicionales Clave
- **Lighthouse**: Nacional `$0.03` vs Extranjero `$0.12` — siempre verificar último puerto
- **Clearance + Sanitary**: Solo aplican en viajes internacionales (no cabotaje)
- **Horas de Puerto**: `Tiempo amarre → inicio carga + (Q/Ritmo) + término carga → desamarre`

---

## C) Agency Expenses — Tarifas Planas

| Concepto | Tarifa | Fórmula | Observaciones |
|---|---|---|---|
| Agency Fee | $1,000.00 fijo | `1000` | Tarifa fija Transtotal por Agenciamiento. |
| Transportation | $200.00 fijo | `200` | Autoridades, coordinador y personal operativo. |
| Comunication | $250.00 fijo | `250` | Tarifa fija Transtotal. |

---

## 📊 Ejemplo de Cálculo — Buque Moquegua (GRT 8,259 | LOA 134 | 32 hrs)

| Ítem | Cálculo | Total |
|---|---|---|
| Pilotage (2 maniobras) | MAX(750, 0.055×8259) × 2 = MAX(750,454) × 2 | $1,500.00 |
| Remolcaje (4 maniobras) | MAX(800, 0.065×8259) × 4 = MAX(800,537) × 4 | $3,200.00 |
| Lighthouse Nacional | 0.03 × 8,259 | $247.77 |
| Dockage APM | 1.50 × 134 × 32 | $6,432.00 |
| Launch Hire (4 lanchas) | 85 × 4 | $340.00 |
| Coordinator (2 turnos) | 225 × 2 | $450.00 |
| Clearance | 200 × 1 | $200.00 |
| Sanitary | 520 × 1 | $520.00 |
| Agency Fee | 1,000 | $1,000.00 |
| Transportation | 200 | $200.00 |
| Comunication | 250 | $250.00 |

---
> 🔗 **Ver tabla completa PNG**: [[PNG_Callao_Layout]]
> 🗄️ **DB**: `SELECT * FROM port_costs_matrix WHERE port_id='CALLAO' AND terminal='APM'`
