# 🏗️ AS-BUILT Flowchart 06 — Motor PxQ Portuario

> **Herramienta**: Motor PxQ de Tarifas y Liquidaciones Portuarias
> **Ruta UI**: `/port-tariffs`
> **Componentes React**: `PortTariffsMaster.tsx`, `DynamicAuditViewer.tsx`
> **Script Python Diagrama**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_MOTOR_PXQ.py`
> **Asset SVG Public**: `Geeksoft_Frontend/public/FLOWCHART_MOTOR_PXQ.svg`

---

## 🧭 Navegación
| [← Flowchart Motor BAF](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/05_AS_BUILT_Flowchart_Motor_BAF.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Flowchart Multicotizador →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/07_AS_BUILT_Flowchart_Multicotizador.md) |

---

## 🔄 Flujo Estricto de 5 Pasos

```mermaid
graph TD
    P1["PASO 1: Selección de Puerto & Buque Nombrado<br/>• Elección de puerto (Callao, Tisur, SPCC Ilo, Directemar Chile)<br/>• Lectura de LOA y GRT desde vessels"]
    P2["PASO 2: Determinación del Régimen Horario<br/>• Evaluación fecha/hora desatraque exitDate<br/>• Regla Casino: Noche (>=23h o <6h) o Domingo/Feriado (+25% OT)"]
    P3["PASO 3: Evaluación Ecuaciones PxQ por Sección<br/>• Sección A (Shifting): Practicaje, Remolcaje, Accesos, Linesmen<br/>• Sección B (General Port): Faro (P*GRT), Muellaje (P*LOA*hrs), Sanidad<br/>• Sección C (Agency): Agency Fee, Movilidad, Comunicaciones"]
    P4["PASO 4: Deduplicación y Encuadre de Bandas<br/>• Deduplicación automática de rubros<br/>• Evaluación simultánea de Mínimo (Ordinario) y Máximo (Casino)"]
    P5["PASO 5: Generación del Acta de Auditoría PDF<br/>• Generación PDF via FastAPI / WeasyPrint 69.0"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

---

## 🔗 Enlaces Relacionados
- [[AS_BUILT_Maestro_07_Tarifario_Portuario_PortTariffsMaster]] — Tarifario PxQ.
- [[AS_BUILT_Herramienta_05_Auditoria_PDF_Liquidaciones_WeasyPrint]] — Motor de generación PDF.
