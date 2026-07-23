# ⚙️ Especificación Técnica: Motores de Cálculo Complejo por Puerto

> **Ubicación en Bóveda**: `Obsidian.Maestro.Costos.Portuarios/motores.calculo.complejo.md`
> **Ubicación en Código**: `Geeksoft_Engine/backend/port_engines/`
> **Propósito**: Especificar la arquitectura modular backend y las ecuaciones matemáticas exactas que procesan los 5 inputs operativos para liquidar o proyectar el costo portuario en Perú con 100% de transparencia.

---

## 🏗️ 1. Arquitectura Modular Backend (`port_engines`)

Dado que cada puerto en Perú posee un marco regulatorio, tarifas y convenios comerciales disímiles, el backend de `Geeksoft_Engine` desacopla la lógica en calculadores dedicados:

```
Geeksoft_Engine/backend/port_engines/
 ├── core.py                 # Tubería Orquestadora Base & Endpoint FastAPI
 ├── calculator_callao.py    # Motor Dedicado: Callao (APM Terminals)
 ├── calculator_matarani.py  # Motor Dedicado: Matarani (Tisur S.A. / Addenda PSA)
 ├── calculator_marcona.py   # Motor Dedicado: Marcona (San Juan / SPCC Flat $36k)
 └── calculator_ilo.py       # Motor Dedicado: Ilo (Enapu / SPCC / Port Operations)
```

---

## 📥 2. Estructura del Payload de Entrada (5 Inputs Clave)

El endpoint `POST /api/v2/port-costs/calculate-audit` recibe la estructura de datos unificada:

```json
{
  "route_id": "CALLAO_MATARANI",
  "vessel_id": "MOQUEGUA",
  "cargo_tons": 13500.0,
  "entry_datetime": "2026-07-25T08:00:00Z",
  "exit_datetime": "2026-07-26T11:00:00Z",
  "last_port_country": "PE",
  "next_port_country": "PE"
}
```

### 🔍 Extracción Automática de Parámetros Físicos del Buque (`vessels`):
- `LOA` (Eslora total en metros): ej. `134.16m` (Moquegua)
- `GRT` (Gross Register Tonnage): ej. `8,259` (Moquegua)
- `DWT` (Deadweight Tonnage): ej. `14,298.00` (Moquegua)

---

## 🧮 3. Lógicas Específicas por Calculador Dedicado

### 3.1. 🇵🇪 `calculator_callao.py` (APM Terminals)
- **Tiempos en Puerto**: $\Delta t = \text{exit\_datetime} - \text{entry\_datetime}$ (horas totales).
- **Muellaje APM**: $\text{Dockage} = \$1.50 \times \text{LOA} \times \Delta t$.
- **Practicaje IN / OUT**: $\max(\$750.00, 0.055 \times \text{GRT}) + \text{Overtime}$.
- **Remolcaje IN / OUT**: $\$800.00 \times \text{tugboats\_in}$ / $\text{tugboats\_out}$.
- **Faro y Balisas**: $\$0.03 \times \text{GRT}$ (si `last_port_country == 'PE'`) ó $\$0.12 \times \text{GRT}$ (Extranjero).
- **Inspección Sanitaria**: $\$520.00\text{ USD Flat}$ (solo si procedencia/destino es extranjero).
- **Agency Fee**: $\$1,000.00\text{ USD Flat}$ (hasta 5 días) $+ \$150.00\text{/día}$ adicional.

### 3.2. 🇵🇪 `calculator_matarani.py` (Tisur S.A. / PSA Marine)
- **Servicio Integral PSA (Addenda 39.31%)**: $\$3,368.00\text{ USD}$ por maniobra ($\$6,736.00\text{ escala}$).
- **Overtime PSA**: $+25\%$ ($\$842.00$) si ingreso entre $18\text{--}24\text{h}$; $+50\%$ ($\$1,684.00$) entre $00\text{--}07\text{h}$ o festivos.
- **Dockage Tisur**: $\$0.65 \times \text{LOA} \times \Delta t$.
- **Sanidad Marítima**: $\$670.00\text{ USD Flat}$ (Moquegua/Arequipa).
- **Agency Fee**: $\$1,100.00\text{ USD Flat}$.

### 3.3. 🇵🇪 `calculator_marcona.py` (SPCC / San Juan)
- **Tarifa Acuerdo Petral / Southern**: $\$36,000.00\text{ USD Flat}$ por escala completa.
- **Servicio Integral de Atraque**: $\$30,508.48\text{ USD}$.
- **Agency Fee**: $\$1,400.00\text{ USD Flat}$.

### 3.4. 🇵🇪 `calculator_ilo.py` (Enapu / SPCC)
- **Dockage SPCC**: $\$300.00 + (\$0.05 \times \text{GRT} \times \text{Días Muelle})$.
- **Remolcaje PSA Marine**: $\max(\$1,800.00, 0.16 \times \text{GRT}) \times 2\text{ remolcadores}$.
- **Remolcaje Petranso**: $0.18 \times \text{GRT} \times 2\text{ remolcadores}$ ($-10\%$ desc. comercial).
- **Agency Fee**: $\$900.00\text{ USD Flat}$.

---

## 📤 4. Respuesta Estructurada de Auditoría (`audit_trail`)

El motor retorna el objeto de liquidación con cada celda de cálculo explícitamente resuelta:

```json
{
  "total_scale_cost_usd": 30302.84,
  "load_port_cost_usd": 14938.34,
  "disch_port_cost_usd": 15364.50,
  "total_port_hours": 60.0,
  "load_port_audit": [
    {
      "concept": "Muellaje APM Terminals",
      "supplier": "APM Terminals",
      "formula_evaluated": "1.50 USD * 134.16m (LOA) * 27h (Puerto)",
      "amount_usd": 5758.48,
      "category": "general_port"
    }
  ]
}
```
