# 🏛️ Especificación Técnica & Plan Maestro: Integración Estándar NAVITRANS en la Matriz Financiera

**Documento**: `30_Estructura_Financiera_NAVITRANS_Control_Presupuestal.md`  
**Fuente de Verdad Corporativa**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Documentos.Petral\Control_Presupuestal_NAVITRANSO.xlsx`  
**Estado**: 🟢 Aprobado para Implementación y Auditoría Pericial Benoit Blanc  
**Fecha de Registro**: 26 de Agosto de 2026  

---

## 1. Contexto Estratégico y Objetivo

NAVITRANS, como empresa matriz y dueña de NAVIERA PETRAL, rige el estándar contable y la presentación del Estado de Resultados (P&L) y Control Presupuestal.
El objetivo de esta integración es:
1. **Unificar el Wording y Agrupación Macro**: Que la Matriz Financiera de PETRAL refleje exactamente las mismas líneas, términos y jerarquía contable de Navitrans.
2. **Arquitectura de Doble Nivel (Drill-Down)**:
   - **Nivel 1 (Macro Navitrans)**: Líneas consolidadas para directorio y reportes corporativos.
   - **Nivel 2 (Micro PETRAL)**: Acordeones desplegables por viaje, puerto, tramo y consumo de búnker.
3. **Gestión de Filas N/A**: Conservar las filas que en el Excel están marcadas como `N/A` (`VENTA DE TERCEROS`, `OTROS INGRESOS`, `OTROS COSTOS DIRECTOS`) con un interruptor/botón interactivo para **ocultarlas o mostrarlas con un solo clic**.

---

## 2. Wording y Estructura Literal 100% NAVITRANS

A continuación se detalla la jerarquía exacta, su tipo contable y su conexión operativa con el motor de cálculo de PETRAL:

```
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 🟢 1. BLOQUE VENTAS (Ingresos Totales en Positivo)                                              │
 ├────────────────────────────┬─────────────┬──────────────────────────────────────────────────────┤
 │ Línea Literal Navitrans    │ Tipo Fila   │ Conexión Operativa y Desplegable PETRAL              │
 ├────────────────────────────┼─────────────┼──────────────────────────────────────────────────────┤
 │ VENTAS                     │ SUBTOTAL    │ Suma de HIRE + VENTA TERCEROS + DEMORAS + ING. PUERTO│
 │   • HIRE                   │ Operativa   │ Flete de Carga: Q (MT) × F ($/t) por cada viaje      │
 │   • VENTA DE TERCEROS      │ Fila N/A    │ $0.00 (Ocultable mediante toggle N/A)                │
 │   • DEMORAS                │ Operativa   │ Ingreso por Demoras: Días Demora × Tarifa Demurrage  │
 │   • INGRESOS DE PUERTO     │ Operativa   │ Muellaje refacturado al cliente ([RF] activo)        │
 │   • OTROS INGRESOS         │ Fila N/A    │ $0.00 (Ocultable mediante toggle N/A)                │
 └────────────────────────────┴─────────────┴──────────────────────────────────────────────────────┘
                                           │
                                           ▼ (-)
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 🔴 2. BLOQUE COSTOS DIRECTOS (Gastos del Viaje en Negativo)                                     │
 ├────────────────────────────┬─────────────┬──────────────────────────────────────────────────────┤
 │ Línea Literal Navitrans    │ Tipo Fila   │ Conexión Operativa y Desplegable PETRAL              │
 ├────────────────────────────┼─────────────┼──────────────────────────────────────────────────────┤
 │ COSTOS DIRECTOS            │ SUBTOTAL    │ Suma de COMBUSTIBLE + GASTOS PTO + DEMORA + COMISIÓN │
 │   • COMBUSTIBLE            │ Operativa   │ Búnkers IFO + MDO (Navegación + Puerto + Demoras)    │
 │   • GASTOS DE PUERTO       │ Operativa   │ Agenciamiento POL/PODs + Loading Master + Muellaje   │
 │   • COSTOS DE DEMORA       │ Operativa   │ Costo de Nave Parada: Días Demora × TCE Requerido    │
 │   • COMISIONES VARIAS      │ Operativa   │ Address Commission (%) + Broker Commission (%)       │
 │   • OTROS COSTOS DIRECTOS  │ Fila N/A    │ Gastos extraordinarios ($0.00 / Manual)              │
 └────────────────────────────┴─────────────┴──────────────────────────────────────────────────────┘
                                           │
                                           ▼ (=)
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 🔵 3. TIME CHARTER EQUIVALENT (TCE / Resultado Operacional del Viaje)                          │
 ├─────────────────────────────────────────────────────────────────────────────────────────────────┤
 │ ➔ TIME CHARTER EQUIVALENT = VENTAS (+) COSTOS DIRECTOS (Suma Algebraica Directa)               │
 ├────────────────────────────┬─────────────┬──────────────────────────────────────────────────────┤
 │ • COSTO DE ARRIENDO NAVES  │ Deducción   │ Costo de fletamento / arriendo de naves tercerizadas │
 ├────────────────────────────┴─────────────┴──────────────────────────────────────────────────────┤
 │ 🏆 MARGEN BRUTO = TIME CHARTER EQUIVALENT (+) COSTO DE ARRIENDO NAVES                           │
 └─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼ (-)
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ ⚪ 4. OPEX / COSTOS FIJOS DE FLOTA (Mensualizados)                                              │
 ├────────────────────────────┬─────────────┬──────────────────────────────────────────────────────┤
 │ • GTOS. PERSONAL A BORDO   │ Fijo/OPEX   │ Planilla tripulación, sueldos, beneficios y rancho   │
 │ • GASTOS DE LA NAVE        │ Fijo/OPEX   │ Mantenimiento, seguros P&I/Casco, lubricantes        │
 └────────────────────────────┴─────────────┴──────────────────────────────────────────────────────┘
```

---

## 3. Verificación Numérica Oficial (Muestras Enero a Mayo 2026)

Del archivo `Control_Presupuestal_NAVITRANSO.xlsx`, se confirman las fórmulas y relaciones matemáticas:

| Línea Financiera Literal | ENE 2026 | FEB 2026 | MAR 2026 | ABR 2026 | MAY 2026 |
|---|:---:|:---:|:---:|:---:|:---:|
| **HIRE** | $1,041,229 | $1,827,319 | $1,992,698 | $1,361,977 | $2,170,960 |
| **VENTA DE TERCEROS** *(N/A)* | $0 | $0 | $0 | $0 | $0 |
| **DEMORAS** | $604,689 | $215,350 | $562,537 | $484,965 | $465,646 |
| **INGRESOS DE PUERTO** | $76,148 | $68,523 | $103,740 | $76,378 | $66,224 |
| **OTROS INGRESOS** *(N/A)* | $0 | $0 | $0 | $0 | $0 |
| **VENTAS (Subtotal)** | **$1,722,067** | **$2,111,192** | **$2,658,975** | **$1,923,320** | **$2,702,829** |
| **COMBUSTIBLE** | -$177,692 | -$232,202 | -$187,359 | -$189,898 | -$237,923 |
| **GASTOS DE PUERTO** | -$315,780 | -$483,483 | -$390,235 | -$259,362 | -$330,840 |
| **COSTOS DE DEMORA** | $0 | $0 | $0 | $0 | -$112,500 |
| **COMISIONES VARIAS** | $0 | $0 | $0 | $0 | $0 |
| **OTROS COSTOS DIRECTOS** | $0 | $0 | -$3,450 | $0 | -$1,015 |
| **COSTOS DIRECTOS (Subtotal)** | **-$493,472** | **-$715,685** | **-$581,044** | **-$449,260** | **-$682,278** |
| **TIME CHARTER EQUIVALENT** | **$1,228,595** | **$1,395,507** | **$2,077,930** | **$1,474,060** | **$2,020,551** |
| **COSTO DE ARRIENDO NAVES** | $0 | $0 | $0 | $0 | -$417,912 |
| **MARGEN BRUTO** | **$1,228,595** | **$1,395,507** | **$2,077,930** | **$1,474,060** | **$1,602,639** |
| **GTOS. PERSONAL A BORDO** | -$307,129 | -$401,980 | -$337,687 | -$324,665 | -$343,380 |
| **GASTOS DE LA NAVE** | -$117,933 | -$220,527 | -$172,454 | -$251,079 | -$229,408 |

---

## 4. Diseño del Componente UI en la Matriz Financiera

### 4.1. Barra de Herramientas y Controles
- **Botón Toggle `[ 👁️ Ocultar Filas N/A ]` / `[ 👁️ Mostrar Filas N/A ]`**:  
  Permite al analista financiero filtrar con 1 clic las filas que están en `$0` / sin imputación operacional (`VENTA DE TERCEROS`, `OTROS INGRESOS`, `OTROS COSTOS DIRECTOS`).
- **Control de Frecuencia / Viajes**:  
  El input de frecuencia mensual alimenta directamente la multiplicación de todos los componentes operacionales del mes.

### 4.2. Acordeones Desplegables de Detalle Operativo (Micro PETRAL)
Al hacer clic en cualquier fila macro se despliega la sub-grilla operativa:
- **`HIRE`**: Tabla con lista de tramos, volumen en toneladas (`Q MT`), flete base (`F $/t`) y subtotal por tramo.
- **`DEMORAS`**: Tabla con desglose por cada puerto de escala (`Puerto`, `Días Demora`, `Tarifa Demurrage $/d`, `Subtotal Demoras $`).
- **`INGRESOS DE PUERTO`**: Detalle de los muellajes cobrados con bandera `[RF: Activo]`.
- **`COMBUSTIBLE`**: Tabla con desglose de días y toneladas:
  - Navegación Mar (días, consumo IFO/MDO, costo).
  - Operación Puerto (días, consumo IFO/MDO, costo).
  - Estadías Demoras (días, consumo IFO/MDO, costo).
- **`GASTOS DE PUERTO`**: Tabla con desglose de costos por puerto (POL, PODs, Loading Master Chile, Muellaje pagado).
- **`COSTOS DE DEMORA`**: Días totales de demora multiplicados por el TCE Requerido del buque (costo de nave detenida).

---

## 5. Protocolo Benoit Blanc: Caso Pericial de Auditoría

Para garantizar que la Matriz Financiera cumpla al 100% con los estándares periciales de auditoría:

| Caso Pericial | Escenario de Prueba | Comprobación Pericial Benoit Blanc |
|---|---|---|
| **CASO-NAV-01** | **Estructura y Wording Literal** | Verificar que los 17 nombres de filas coincidan exactamente carácter por carácter con `Control_Presupuestal_NAVITRANSO.xlsx`. |
| **CASO-NAV-02** | **Suma Algebraica TIME CHARTER EQUIVALENT** | Comprobar que `TIME CHARTER EQUIVALENT = VENTAS + COSTOS DIRECTOS` sin redondeos ni discrepancias de centavos. |
| **CASO-NAV-03** | **Deducción de Arriendo de Naves** | Verificar que cuando `charterHireCost > 0`, `MARGEN BRUTO = TCE + COSTO DE ARRIENDO NAVES` refleje la deducción exacta. |
| **CASO-NAV-04** | **Comportamiento del Toggle N/A** | Comprobar que al activar `Ocultar Filas N/A`, las filas de terceros y otros ingresos desaparezcan suavemente sin romper la alineación tabular. |
| **CASO-NAV-05** | **Consistencia con Multicotizador** | Comprobar que una cotización exportada desde el Multicotizador (`MultiCotizadorExcel.tsx`) cargue sus valores idénticos en las columnas mensuales de la Matriz Financiera. |

---

## 6. Plan de Ejecución

1. **Paso 1**: Refactorizar `FinancialMatrixGridTable.tsx` para implementar la agrupación oficial de Navitrans con el toggle interactivo de filas `N/A`.
2. **Paso 2**: Implementar los acordeones de detalle operativo (Micro PETRAL) en cada fila macro.
3. **Paso 3**: Probar la compilación con `npx vite build`.
4. **Paso 4**: Respaldar branch y tag de seguridad.
5. **Paso 5**: Desplegar al VPS de Producción (`https://forecast.geeksoft.tech`).
6. **Paso 6**: Ejecutar la auditoría Benoit Blanc punto por punto.
