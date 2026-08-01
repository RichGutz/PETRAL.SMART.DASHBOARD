# 🎯 QC Loop 02 — Test de Oro de Convergencia: Matarani & BT MOQUEGUA

> **Propósito**: Test de calibración del Voyage Ledger Engine. Exige que el motor simule de forma idéntica al Excel benchmark original de PETRAL.
> **Caso de Prueba**: Carga de 13,500 MT a Matarani (Laden) con el barco BT MOQUEGUA.

---

## 🧭 Navegación
| [← QC Loop 01](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/05_Protocolos_QC_y_Tests_de_Aceptacion/QC_Loop_01_Validacion_Autonoma_7_Reglas_de_Negocio_y_PDF.md) | 🏠 [[00_Indice_Protocolos_y_Loops_QC]] | [Siguiente: QC Loop 03 →](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/05_Protocolos_QC_y_Tests_de_Aceptacion/QC_Loop_03_Auditoria_Grilla_31_Viajes_y_Yield_Ponderado.md) |

---

## 🎯 Criterios Invariables de Convergencia Exigidos:

| Métrica Calculada | Valor de Conversión Exigido | Estado de Verificación |
|---|---|---|
| **Permanencia Total** | `4.0801 días` (Mar: 0.5384 d, Puerto: 3.5417 d) | `PASS` |
| **Costos Portuarios Totales** | `$39,000.00 USD` | `PASS` |
| **Costo Total de Búnker** | `$18,560.53 USD` (IFO + MDO) | `PASS` |
| **Voyage Result Neto** | `$195,033.00 USD` | `PASS` |
| **TCE (Time Charter Equivalent)** | `$47,801.35 USD/día` | `PASS` |

> **Injunción de Calidad:**
> Si al realizar una refactorización de código el backend no entrega exactamente estos números, el motor se considerará descalzado y el código no podrá ser liberado a producción.
