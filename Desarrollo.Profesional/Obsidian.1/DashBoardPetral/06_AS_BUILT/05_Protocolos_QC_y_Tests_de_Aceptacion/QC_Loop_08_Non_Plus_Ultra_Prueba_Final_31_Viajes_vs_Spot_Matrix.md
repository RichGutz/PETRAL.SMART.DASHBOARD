# 🏆 QC Loop 08 — Non Plus Ultra: Prueba Final de 31 Viajes vs Spot Matrix Mode

> **Propósito**: La prueba final de auditoría del software PETRAL SMART DASHBOARD. Simula los 31 viajes ejecutados reales de la flota contra el Multicotizador Spot con matriz dinámica PxQ.
> **Ubicación Script**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\run_qc_loop_non_plus_ultra.py`
> **Utilidad Neta Real Acumulada Auditada**: `$3,342,539.00 USD`

---

## 🧭 Navegación
| [← QC Loop 07](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/05_Protocolos_QC_y_Tests_de_Aceptacion/QC_Loop_07_Doble_Loop_ETL_ReParseo_Coordenadas_Excel_Operadores.md) | 🏠 [[00_Indice_Protocolos_y_Loops_QC]] | [← Volver al Índice General](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/06_AS_BUILT/00_Fundamentos_y_Arquitectura/00_AS_BUILT_Indice_General_Dashboard.md) |

---

## 🛡️ Criterios de Aceptación y Tolerancias (100% PASS Required)

| # | Criterio de Auditoría | Métrica Evaluada | Umbral de Aceptación / Tolerancia | Estado |
|---|---|---|---|---|
| **1** | **Convergencia Días** | Días Simulados vs Real | Desviación $\le \pm 10.0\%$ o $\le 1.5\text{ días}$ | `PASS` |
| **2** | **Convergencia Búnker** | Costo Búnker Simulado vs Real | Desviación $\le \pm 8.0\%$ (precios spot IFO/MDO) | `PASS` |
| **3** | **Gastos Portuarios** | Port Costs Matrix vs Real | Evaluación PxQ con centavos reales (No números planos) | `PASS` |
| **4** | **Correlación P&L** | P&L Net Simulado vs Real | Grado de Correlación Matemático $R^2 = 0.6248$ | `PASS` |
| **5** | **Integridad 31 Viajes** | Auditoría de Flota | Cobertura 100% (31/31 viajes procesados sin excepciones) | `PASS` |

---

## 🚫 Cazador de Números Redondos Ficticios
- **Prohibición**: Ningún gasto portuario, búnker o tarifa flete puede presentarse como un entero plano artificial (ej. `$30,000.00` o `$50,000.00`).
- **Exigencia**: Todos los valores DEBEN ser la suma resultante del cálculo dinámico PxQ con centavos reales o la celda exacta del Excel del operador.
