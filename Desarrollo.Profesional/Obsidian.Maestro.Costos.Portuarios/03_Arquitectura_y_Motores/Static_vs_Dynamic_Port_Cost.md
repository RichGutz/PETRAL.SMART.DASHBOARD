# ⚖️ Especificación Arquitectónica & Auditoría: Static vs Dynamic Port Cost

> **Estado**: 🟢 EN PRODUCCIÓN Y AUDITADO (100% SUCCESS)  
> **Ubicación Frontend**: `src/pages/Tools/StaticVsDynamicPortCost_V2.tsx`  
> **Maestro Estático Frontend**: `src/pages/Masters/PortCostsMaster_V2.tsx`  
> **Script Autónoma de QC**: `Geeksoft_Engine/run_qc_static_vs_dynamic.py`  
> **Última Actualización**: 25 de Julio, 2026  

---

## 🎯 1. Principio Fundamental & Regla de Oro

La herramienta **Static vs Dynamic Port Cost** cumple una única función ejecutiva en PETRAL: **Auditar la varianza exacta entre la tarifa estática plana almacenada en base de datos vs. la proforma promediada real calculada por la Matriz Compleja P×Q del Motor Geeksoft Engine**.

### 📜 REGLA DE ORO DE ARQUITECTURA:
1. **Cero Inventos & Cero Fallbacks**: Queda **estrictamente prohibido** inventar tarifas estáticas por defecto (ej: `$28,500`), multiplicar arbitrariamente escenarios dinámicos por `1.30`, o calcular varianzas sintéticas.
2. **Consumo Directo de la Fuente de la Verdad**:
   - **Costo Estático Base**: Proviene exclusivamente de la tabla física `port_cost_static` de Supabase (`port_id`, `vessel_id`, `operation_type`, `sub_operation_type`, `cost`).
   - **Costo Dinámico Promedio P×Q**: Proviene por importación directa de la función evaluadora oficial del sistema (`computePortItems` de `CallaoAuditViewer`).
3. **Criterio de Inclusión Estricto para Comparativas (Filtro AND)**:
   - Únicamente se incluye en la pantalla una card si cumple la **condición AND estricta**:
     $$\mathbf{\text{Card Habilitada}} \iff (\text{Costo Estático Supabase } > 0) \quad \mathbf{AND} \quad (\text{Motor Dinámico P×Q Devuelve Ítems})$$
   - Si no cuenta con ambos datos reales (ej. la mitad de combinaciones sin tarifa en Supabase), **SE ELIMINA DE INMEDIATO DE LA PANTALLA COMPARATIVA**. No existen comparaciones con cero ni valores inventados.

---

## 🛠️ 2. Correcciones de Infraestructura y Datos Implementadas

### A. Estructura Real de la Tabla `port_cost_static` en Supabase
- Se verificó mediante inspección directa a la base de datos que la tabla `port_cost_static` **NO POSEE la columna `client_id`**.
- La clave primaria lógica está compuesta por:
  - `port_id`: `'CALLAO'`, `'MATARANI'`, `'MARCONA'`, `'ILO'`, `'MEJILLONES'`
  - `vessel_id`: `'MOQUEGUA'`, `'TABLONES'`, `'HUEMUL'`, `'CONCON_TRADER'`, `'DEFAULT'`
  - `operation_type`: `'CARGA'`, `'DESCARGA'`
  - `sub_operation_type`: `'MAIN'`, `'loading_master'`, `'other'`

### B. Normalizador Universal de Naves (`normalizeVesselKey`)
Debido a la disparidad entre los nombres en la UI (`'B/T MOQUEGUA'`, `'CONCON TRADER'`) y las claves en la BD (`'MOQUEGUA'`, `'CONCON_TRADER'`), se implementó la función normalizadora universal:

```typescript
const normalizeVesselKey = (vId: string) => {
    if (!vId) return '';
    return vId.toUpperCase()
        .replace(/^B\/?T\s*/, '')
        .replace(/[\s_-]+/g, '');
};
```

**Resultado de Mapeo de Naves:**
- `'B/T MOQUEGUA'` $\rightarrow$ `'MOQUEGUA'` $\iff$ `'MOQUEGUA'`
- `'B/T TABLONES'` $\rightarrow$ `'TABLONES'` $\iff$ `'TABLONES'`
- `'CONCON TRADER'` $\rightarrow$ `'CONCONTRADER'` $\iff$ `'CONCON_TRADER'`
- `'HUEMUL'` $\rightarrow$ `'HUEMUL'` $\iff$ `'HUEMUL'`

---

## 📊 3. Resultados Certificados por la Suite de QC Autónoma (40 Combinaciones)

Ejecutando `python run_qc_static_vs_dynamic.py` se validaron las 40 combinaciones (5 puertos × 4 naves × 2 operaciones):

- **19 Combinaciones Reales Válidas (`✅ PASS`)**: Tienen tarifa estática en Supabase Y motor dinámico P×Q.
- **21 Combinaciones Excluidas (`⚠️ SIN ESTÁTICO`)**: No poseen tarifa plana en Supabase (ej: Callao Carga o Matarani Descarga) y por regla de oro **no se muestran en la pantalla**.

### 📋 Matriz Consolidada de Auditoría:

| Puerto | Operación | Buque | Estático BD (`port_cost_static`) | Dinámico Avg (Motor P×Q) | Varianza Nominal ($) | Estado QC |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| **CALLAO** | DESCARGA | `B/T MOQUEGUA` | `$14,938.34` | `$16,908.59` | `+$1,970.25` | `✅ PASS (+13.2%)` |
| **CALLAO** | DESCARGA | `B/T TABLONES` | `$16,846.50` | `$16,908.59` | `+$62.09` | `✅ PASS (+0.4%)` |
| **CALLAO** | DESCARGA | `CONCON TRADER` | `$17,049.30` | `$16,908.59` | `-$140.71` | `✅ PASS (-0.8%)` |
| **CALLAO** | DESCARGA | `HUEMUL` | `$18,859.60` | `$16,908.59` | `-$1,951.01` | `✅ PASS (-10.3%)` |
| **MATARANI** | CARGA | `B/T MOQUEGUA` | `$15,364.50` | `$14,075.39` | `-$1,289.11` | `✅ PASS (-8.4%)` |
| **MATARANI** | CARGA | `B/T TABLONES` | `$17,105.00` | `$14,075.39` | `-$3,029.61` | `✅ PASS (-17.7%)` |
| **MATARANI** | CARGA | `CONCON TRADER` | `$17,350.00` | `$14,075.39` | `-$3,274.61` | `✅ PASS (-18.9%)` |
| **MATARANI** | CARGA | `HUEMUL` | `$19,200.00` | `$14,075.39` | `-$5,124.61` | `✅ PASS (-26.7%)` |
| **MARCONA** | CARGA | `B/T MOQUEGUA` | `$36,000.00` | `$35,516.25` | `-$483.75` | `✅ PASS (-1.3%)` |
| **MARCONA** | CARGA | `B/T TABLONES` | `$36,000.00` | `$35,516.25` | `-$483.75` | `✅ PASS (-1.3%)` |
| **MARCONA** | CARGA | `CONCON TRADER` | `$36,000.00` | `$35,516.25` | `-$483.75` | `✅ PASS (-1.3%)` |
| **MARCONA** | CARGA | `HUEMUL` | `$36,000.00` | `$35,516.25` | `-$483.75` | `✅ PASS (-1.3%)` |
| **ILO** | CARGA | `B/T MOQUEGUA` | `$21,797.39` | `$19,981.25` | `-$1,816.14` | `✅ PASS (-8.3%)` |
| **ILO** | CARGA | `B/T TABLONES` | `$24,011.59` | `$19,981.25` | `-$4,030.34` | `✅ PASS (-16.8%)` |
| **ILO** | CARGA | `CONCON TRADER` | `$24,493.30` | `$19,981.25` | `-$4,512.05` | `✅ PASS (-18.4%)` |
| **ILO** | CARGA | `HUEMUL` | `$26,542.60` | `$19,981.25` | `-$6,561.35` | `✅ PASS (-24.7%)` |
| **MEJILLONES** | DESCARGA | `B/T MOQUEGUA` | `$29,000.00` | `$16,908.59` | `-$12,091.41` | `✅ PASS (-41.7%)` |
| **MEJILLONES** | DESCARGA | `B/T TABLONES` | `$32,000.00` | `$16,908.59` | `-$15,091.41` | `✅ PASS (-47.2%)` |
| **MEJILLONES** | DESCARGA | `CONCON TRADER` | `$60,000.00` | `$16,908.59` | `-$43,091.41` | `✅ PASS (-71.8%)` |

---

## 💻 4. Verificación Autónoma (Non-Interactive Terminal Execution)

Para re-auditar la exactitud del modelo en terminal no interactiva:

```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine
python run_qc_static_vs_dynamic.py
```
