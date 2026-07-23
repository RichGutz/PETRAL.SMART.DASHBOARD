# ⚓ MATARANI — Reglas de Costos Portuarios & Modelo JSONB
> **Vínculo con el Layout**: [[PNG_Matarani_Layout]]
> **Terminal**: Tisur S.A. 🇵🇪 | **Prácticos/Remolques**: PSA Marine | **Agente**: Trans Total

---

## 🏗️ 1. Desdoblamiento de Servicios e Identificación de Maniobras

- `Pilotage_IN` / `OUT`
- `Towage_IN` / `OUT`
- `Dockage_Tisur` (`$0.65 × LOA × Horas`)

---

## 🧮 2. Tubería de 3 Filtros Aplicada a Matarani

### 1️⃣ Filtro 1: Reglas de Propiedad del Viaje (`property_rules`)
- **Muellaje Tisur (`Dockage_Tisur`)**:
  - Fórmula: `0.65 USD × LOA (m) × Horas de Puerto`.

### 2️⃣ Filtro 2: Reglas de Tiempo & Recargo Brent (`time_rules`)
- **Overtime Horario**:
  - Lunes-Sábado (18:00–24:00): `+25%`.
  - Lunes-Sábado (00:00–07:00) y Domingos/Feriados: `+50%`.
- **Indexación Crudo Brent**:
  - Evaluación dinámica de tarifa según la tabla de precios del barril Brent.

### 3️⃣ Filtro 3: Descuentos Volumétricos por Frecuencia Anual

```json
{
  "Volume_Discounts": [
    { "min_voyages": 13, "max_voyages": 18, "discount_percentage": 6.0 },
    { "min_voyages": 19, "discount_percentage": 7.5 }
  ]
}
```

---

## 📊 3. Resumen de Liquidación (Moquegua)

- **Servicio Integral PSA (con Addenda 39.31%)**: `$6,736.00 USD`
- **Muellaje Tisur (33h)**: `$2,877.73 USD`
- **Total Liquidación Matarani (Moquegua)**: **`$15,364.50 USD`**
