# 📊 AS-BUILT: Maestro 07 — Tarifario Portuario PxQ (PortTariffsMaster)

> **Ruta UI**: `/port-tariffs`
> **Componente React**: `PortTariffsMaster.tsx`
> **Tablas Supabase**: `port_cost_concepts`, `port_costs_matrix`
> **Módulo Auth**: `maestro_costos_agencia`

---

## 🧭 Navegación
| [← Costos Portuarios](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_06_Costos_Portuarios_PortCostsMaster.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Sources Sinks →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/01_Maestros/AS_BUILT_Maestro_08_Sources_Sinks_SourcesSinksMaster.md) |

---

## 🎯 1. Propósito y Secciones A, B y C de Liquidación

El **Tarifario Portuario PxQ (`/port-tariffs`)** permite auditar y gestionar las tarifas unitarias y ecuaciones PxQ por cada rubro oficial de costo de puerto. Consolida el desglose de liquidación en 3 Secciones Oficiales:

### 📌 Estructura de Secciones:
1. **Sección A: SHIFTING EXPENSES**
   - Practicaje IN/OUT (Atraque y Zarpe).
   - Remolcaje Base (Petranso, PSA Marine, SAAM / Ultratug).
   - Cargo Acceso Terminal (APM / Tisur).
   - Linesmen (Amarre y Desamarre).
2. **Sección B: GENERAL PORT EXPENSES**
   - Derechos de Faro y Balisas ($P \times \text{GRT}$).
   - Muellaje / Dockage ($P \times \text{LOA} \times \text{Horas}$).
   - Inspección Sanitaria Marítima & Clearance.
   - Lanchas Operativas y Coordinador a Bordo.
3. **Sección C: AGENCY EXPENSES**
   - Honorarios Agenciamiento Marítimo (Base Agency Fee).
   - Movilidad, Transporte y Comunicaciones de Agencia.

---

## 🌙 2. Regla de Régimen Horario: Ordinario vs Casino (+25%)

```typescript
// Regla Casino Nocturno / Overtime (+25% a +50% en maniobras OUT, lanchas y practicaje)
const isCasinoNight = (exitDate: string) => {
    if (!exitDate) return false;
    const d = new Date(exitDate);
    const hour = d.getHours();
    return (hour >= 23 || hour < 6 || d.getDay() === 0); // Noche o Domingo/Feriado
};
```

---

## 🧹 3. Protocolo de Deduplicación de Tarifas

El componente `PortTariffsMaster.tsx` cuenta con un mecanismo automático de deduplicación que consolida registros duplicados por `port_id` + `vessel_id` + `concept`, evitando la distorsión del subtotal PxQ.

---

## 📤 Consumidores en el Sistema
- [[AS_BUILT_Herramienta_05_Auditoria_PDF_Liquidaciones_WeasyPrint]] — Impresión de Acta en PDF.
- [[AS_BUILT_Herramienta_09_Auditoria_Final_Dual]] — Comparativa de Actas de Auditoría.
