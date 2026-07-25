# 🔄 SUITE DE AUDITORÍA Y QC AUTÓNOMO: STATIC VS DYNAMIC PORT COST

> **Fecha de Validación**: 25 de Julio, 2026  
> **Script de QC**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\run_qc_static_vs_dynamic.py`  
> **Ambiente**: Backend FastAPI & Supabase (`port_cost_static`)  
> **Resultado del Test**: `✅ 100% SUCCESS` (19 Combinaciones Válidas Evaluadas)  

---

## 🎯 1. Propósito de la Suite de QC Autónoma

Garantizar sin depender del navegador web la integridad matemática y el estricto filtrado relacional **AND** de la herramienta **Static vs Dynamic Port Cost**:

$$\text{Card Renderizada} \iff (\text{Costo Estático Supabase } > 0) \quad \mathbf{AND} \quad (\text{Motor Dinámico PxQ } > 0)$$

---

## 📊 2. Tabla Consolidada de Resultados de Auditoría (40 Combinaciones)

| Puerto | Buque | Operación | Estático BD (`port_cost_static`) | Dinámico Avg (Motor P×Q) | Varianza Nominal ($) | Estado QC |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **CALLAO** | B/T MOQUEGUA | DESCARGA | `$14,938.34` | `$16,908.59` | `+$1,970.25` | `✅ PASS (+13.2%)` |
| **CALLAO** | B/T TABLONES | DESCARGA | `$16,846.50` | `$16,908.59` | `+$62.09` | `✅ PASS (+0.4%)` |
| **CALLAO** | CONCON TRADER | DESCARGA | `$17,049.30` | `$16,908.59` | `-$140.71` | `✅ PASS (-0.8%)` |
| **CALLAO** | HUEMUL | DESCARGA | `$18,859.60` | `$16,908.59` | `-$1,951.01` | `✅ PASS (-10.3%)` |
| **MATARANI** | B/T MOQUEGUA | CARGA | `$15,364.50` | `$14,075.39` | `-$1,289.11` | `✅ PASS (-8.4%)` |
| **MATARANI** | B/T TABLONES | CARGA | `$17,105.00` | `$14,075.39` | `-$3,029.61` | `✅ PASS (-17.7%)` |
| **MATARANI** | CONCON TRADER | CARGA | `$17,350.00` | `$14,075.39` | `-$3,274.61` | `✅ PASS (-18.9%)` |
| **MATARANI** | HUEMUL | CARGA | `$19,200.00` | `$14,075.39` | `-$5,124.61` | `✅ PASS (-26.7%)` |
| **MARCONA** | B/T MOQUEGUA | CARGA | `$36,000.00` | `$35,516.25` | `-$483.75` | `✅ PASS (-1.3%)` |
| **MARCONA** | B/T TABLONES | CARGA | `$36,000.00` | `$35,516.25` | `-$483.75` | `✅ PASS (-1.3%)` |
| **MARCONA** | CONCON TRADER | CARGA | `$36,000.00` | `$35,516.25` | `-$483.75` | `✅ PASS (-1.3%)` |
| **MARCONA** | HUEMUL | CARGA | `$36,000.00` | `$35,516.25` | `-$483.75` | `✅ PASS (-1.3%)` |
| **ILO** | B/T MOQUEGUA | CARGA | `$21,797.39` | `$19,981.25` | `-$1,816.14` | `✅ PASS (-8.3%)` |
| **ILO** | B/T TABLONES | CARGA | `$24,011.59` | `$19,981.25` | `-$4,030.34` | `✅ PASS (-16.8%)` |
| **ILO** | CONCON TRADER | CARGA | `$24,493.30` | `$19,981.25` | `-$4,512.05` | `✅ PASS (-18.4%)` |
| **ILO** | HUEMUL | CARGA | `$26,542.60` | `$19,981.25` | `-$6,561.35` | `✅ PASS (-24.7%)` |
| **MEJILLONES** | B/T MOQUEGUA | DESCARGA | `$29,000.00` | `$16,908.59` | `-$12,091.41` | `✅ PASS (-41.7%)` |
| **MEJILLONES** | B/T TABLONES | DESCARGA | `$32,000.00` | `$16,908.59` | `-$15,091.41` | `✅ PASS (-47.2%)` |
| **MEJILLONES** | CONCON TRADER | DESCARGA | `$60,000.00` | `$16,908.59` | `-$43,091.41` | `✅ PASS (-71.8%)` |

---

## 🛠️ 3. Comando de Ejecución Autónomo

```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine
python run_qc_static_vs_dynamic.py
```

---

## 🏁 4. Certificación Final

- **Total Combinaciones Auditadas**: `40`
- **Comparativas Reales Habilitadas (AND)**: `19`
- **Tarifas Excluidas por Ausencia Estática en BD**: `21` (Cumple Regla de Oro: Cero fallbacks ni valores inventados).
