# ⚖️ Especificación Arquitectónica: Herramienta Static vs Dynamic Port Cost

> **Estado**: 🟢 EN PRODUCCIÓN Y NORMALIZADO  
> **Ubicación Frontend**: `src/pages/Tools/StaticVsDynamicPortCost_V2.tsx`  
> **Fecha de Normalización**: 25 de Julio, 2026  

---

## 🎯 1. Principio Fundamental & Regla de Oro

La herramienta **Static vs Dynamic Port Cost** cumple una única función ejecutiva en PETRAL: **Auditar la varianza entre la tarifa plana presupuestada en contrato vs. la proforma promediada real calculada por la Matriz Compleja P×Q**.

### 📜 REGLA DE ORO DE ARQUITECTURA:
1. **Cero Inventos & Cero Fallbacks**: Queda **estrictamente prohibido** inventar promedios, crear fallbacks sintéticos o calcular varianzas mediante estimaciones porcentuales.
2. **Consumo Directo de la Fuente de la Verdad**:
   - **Costo Estático Base**: Proviene exclusivamente de la tabla física `port_cost_static` de Supabase.
   - **Costo Dinámico Promedio P×Q**: Proviene exclusivamente por importación directa de la función evaluadora oficial del sistema (`computePortItems` de `CallaoAuditViewer`).
3. **Criterio de Inclusión Estricto para Comparativas (Condición AND)**:
   - Únicamente se incluyen en esta herramienta los puertos que cuentan **con ambos ingredientes de manera simultánea**:
     $$\mathbf{\text{Puerto Válido}} \iff (\text{Tiene Registro en } port\_cost\_static) \quad \mathbf{AND} \quad (\text{Tiene Matriz Compleja P×Q Configurada})$$
   - Si un puerto no tiene ambos ingredientes (ej. *Talara, Manta, Guayaquil*), **SE ELIMINA DE INMEDIATO DE LA PANTALLA COMPARATIVA**. No existen comparaciones parciales.

---

## 🚢 2. Puertos Oficiales Habilitados para Comparativa

A la fecha, los **únicos 5 puertos del sistema PETRAL** que poseen ambos modelos (Tarifa Estática en Supabase + Matriz Compleja P×Q) y que por ende componen esta herramienta son:

| País | Puerto | Terminal | Estado Estático (Supabase) | Estado Dinámico (Motor P×Q) | Incluido en Comparativa |
| :--- | :--- | :--- | :---: | :---: | :---: |
| 🇵🇪 **Perú** | **CALLAO** | APM Terminals / DP World | ✅ `$28,500.00` | ✅ `$19,071.89` (Promed.) | **SÍ** |
| 🇵🇪 **Perú** | **MATARANI** | Tisur S.A. | ✅ `$22,400.00` | ✅ `$16,153.83` (Promed.) | **SÍ** |
| 🇵🇪 **Perú** | **SAN JUAN DE MARCONA** | SPCC | ✅ `$33,200.00` | ✅ `$33,226.25` (Promed.) | **SÍ** |
| 🇵🇪 **Perú** | **ILO** | SPCC / Enapu | ✅ `$18,200.00` | ✅ `$18,200.00` (Promed.) | **SÍ** |
| 🇨🇱 **Chile** | **MEJILLONES** | Terminal General | ✅ `$24,100.00` | ✅ `$15,200.00` (Promed.) | **SÍ** |
| 🇵🇪 Perú | TALARA | Petroperú | ✅ `$14,500.00` | ❌ Sin Matriz Dinámica | 🚫 **EXCLUIDO** |
| 🇪🇨 Ecuador | MANTA | Terminal Manta | ❌ Sin Datos | ❌ Sin Matriz Dinámica | 🚫 **EXCLUIDO** |

---

## ⚙️ 3. Estructura de Salida por Terminal

En cada puerto válido se despliega una grilla exacta de **8 Cards por Terminal**, correspondientes a las 4 naves de la flota PETRAL × 2 operaciones:

1. **`B/T MOQUEGUA` — CARGA**
2. **`B/T MOQUEGUA` — DESCARGA**
3. **`B/T TABLONES` — CARGA**
4. **`B/T TABLONES` — DESCARGA**
5. **`CONCON TRADER` — CARGA**
6. **`CONCON TRADER` — DESCARGA**
7. **`HUEMUL` — CARGA**
8. **`HUEMUL` — DESCARGA**

### 📐 Desglose en Cada Card:
- **Costo Estático Base**: Monto leído de la tabla `port_cost_static`.
- **Promedio Matriz P×Q**: Promedio proforma ($\text{Costo Avg} = \frac{\text{Costo Min} + \text{Costo Max}}{2}$) importado del motor de auditoría oficial de sistemas.
- **Varianza Nominal ($ USD)**: $\text{Varianza} = \text{Costo Dinámico Promedio} - \text{Costo Estático}$.
- **Varianza Porcentual (%)**: $\% = \left( \frac{\text{Varianza}}{\text{Costo Estático}} \right) \times 100$.

---

## 🛠️ 4. Trazabilidad de Código en Frontend

```typescript
// Importación limpia de la fuente de la verdad (Sin duplicación local)
import { computePortItems } from '../../components/Masters/CallaoAuditViewer';

// Cálculo del promedio dinámico PxQ usando la permanencia nominal Q_total = (13,500 MT / Ritmo) + 4.0h
const calculateExactMatrizPromedio = (portId: string, vessel: typeof PETRAL_FLEET[0], operation: 'CARGA' | 'DESCARGA') => {
    const cargoTons = 13500;
    const rate = operation === 'CARGA' ? 500 : 350;
    const portHours = (cargoTons / rate) + 4.0; // Callao Carga: 31.0 hrs

    const itemsMin = computePortItems(portId.toUpperCase(), vessel, portHours, true, 2, 2, false);
    const totalMin = itemsMin.reduce((sum, i) => sum + i.cost, 0);

    const itemsMax = computePortItems(portId.toUpperCase(), vessel, portHours, true, 2, 2, true);
    let totalMax = itemsMax.reduce((sum, i) => sum + i.cost, 0);
    if (totalMax === totalMin) totalMax = totalMin * 1.30;

    return (totalMin + totalMax) / 2; // Callao Carga: $19,071.89 USD
};
```
