# ⚡ AS-BUILT Flowchart 05 — Motor BAF (Bunker Adjustment Factor)

> **Herramienta**: Motor BAF de Indexación Tarifaria
> **Ruta UI**: `/contracts`
> **Componentes React**: `ContractsMaster.tsx`, `ContractsMaster_V2.tsx`
> **Script Python Diagrama**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Boiler.Plate\Flow.Charts\FLOWCHART_MOTOR_BAF.py`
> **Asset SVG Public**: `Geeksoft_Frontend/public/FLOWCHART_MOTOR_BAF.svg`

---

## 🧭 Navegación
| [← Flowchart Matriz Financiera](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/04_AS_BUILT_Flowchart_Matriz_Financiera.md) | 🏠 [[00_AS_BUILT_Indice_General_Dashboard]] | [Siguiente: Flowchart Motor PxQ →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/04_Flowcharts_y_Diagramas_AS_BUILT/06_AS_BUILT_Flowchart_Motor_PxQ.md) |

---

## 🔄 Flujo Estricto de 5 Pasos

```mermaid
graph TD
    P1["PASO 1: Ingesta de Parámetros de Contrato<br/>• Base Bunker Price IFO en contracts (ej. $450.00)<br/>• Umbral de disparo baf_trigger_delta"]
    P2["PASO 2: Lectura de Mercado de Búnker Vigente<br/>• Último precio IFO 180 / MDO en bunker_prices"]
    P3["PASO 3: Evaluación de la Variación Delta BAF<br/>• Delta = Precio_Mercado - Base_Contractual<br/>• Verificación de superación de umbral de disparo"]
    P4["PASO 4: Recálculo Polinómico de Tiers de Flete<br/>• Ajuste de la tarifa unitaria Flete_Ajustado = Flete_Base + Delta_BAF"]
    P5["PASO 5: Actualización del Gross Revenue en Matriz<br/>• Inyección inmediata de la tarifa ajustada en la Matriz Financiera"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P4 --> P5
```

---

## 🔗 Enlaces Relacionados
- [[AS_BUILT_Maestro_04_Contratos_ContractsMaster]] — Parámetros de contrato.
- [[AS_BUILT_Maestro_09_Precios_Bunker_BunkerMaster]] — Cotización de combustibles marinos.
