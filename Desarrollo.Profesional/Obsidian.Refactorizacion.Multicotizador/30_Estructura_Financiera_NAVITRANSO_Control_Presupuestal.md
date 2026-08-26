# 🏛️ Especificación Técnica & Plan Maestro: Integración Estándar NAVITRANSO en la Matriz Financiera

**Documento**: `30_Estructura_Financiera_NAVITRANSO_Control_Presupuestal.md`  
**Fuente de Verdad Corporativa**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Documentos.Petral\Control_Presupuestal_NAVITRANSO.xlsx`  
**Estado**: 🟢 Aprobado para Implementación Desacoplada y Auditoría Pericial Benoit Blanc  
**Fecha de Registro**: 26 de Agosto de 2026  

---

## 1. Contexto Estratégico y Objetivo

NAVITRANSO, como empresa matriz y dueña de NAVIERA PETRAL, rige el estándar contable y la presentación del Estado de Resultados (P&L) y Control Presupuestal.
El objetivo de esta integración es:
1. **Unificar el Wording y Agrupación Macro**: Que la Matriz Financiera de PETRAL refleje exactamente las mismas líneas, términos y jerarquía contable de Navitranso.
2. **Arquitectura Desacoplada (Nuevo Artefacto Exclusivo)**:
   - **`FinancialMatrixGridTable.tsx`** se mantiene 100% intacto para la vista clásica `PETRAL`.
   - **`FinancialMatrixNavitransoGridTable.tsx`** se crea como un nuevo artefacto independiente para la vista `NAVITRANSO`.
3. **Conmutador Simétrico en el Ribbon Superior**:
   - Selector **`Formato: [ PETRAL | NAVITRANSO ]`** junto a `Vista: [ UND | % ]`.
4. **Gestión de Filas N/A**:
   - Botón interactivo **`[ 👁️ Ocultar Filas N/A ]` / `[ 👁️ Mostrar Filas N/A ]`** en la cabecera para alternar entre la plantilla corporativa completa y la vista operativa limpia.

---

## 2. Wording y Estructura Literal 100% NAVITRANSO

A continuación se detalla la jerarquía exacta, su tipo contable y su conexión operativa con el motor de cálculo de PETRAL:

```
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 🟢 1. BLOQUE VENTAS (Ingresos Totales en Positivo)                                              │
 ├────────────────────────────┬─────────────┬──────────────────────────────────────────────────────┤
 │ Línea Literal Navitranso   │ Tipo Fila   │ Conexión Operativa y Desplegable PETRAL              │
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
 │ Línea Literal Navitranso   │ Tipo Fila   │ Conexión Operativa y Desplegable PETRAL              │
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

## 4. Plan de Ejecución Modular Desacoplado

1. **Paso 1**: Enriquecer `ForecastContext_V2.tsx` con el estado `matrixFormat: 'PETRAL' | 'NAVITRANSO'` (persistido en `sessionStorage`).
2. **Paso 2**: Enriquecer `ForecastBuilder_V2.tsx` con el conmutador simétrico `Formato: [ PETRAL | NAVITRANSO ]` en el Ribbon superior.
3. **Paso 3**: Crear el nuevo archivo independiente `FinancialMatrixNavitransoGridTable.tsx` con:
   - Las 17 filas oficiales de Navitranso.
   - Acordeones interactivos con desglose operativo PETRAL.
   - Botón toggle de cabecera `[ 👁️ Ocultar Filas N/A ]` / `[ 👁️ Mostrar Filas N/A ]`.
   - Compatibilidad total con edición de frecuencia mensual.
4. **Paso 4**: Conmutar en `FinancialMatrixMainContainer.tsx` entre `FinancialMatrixGridTable` y `FinancialMatrixNavitransoGridTable`.
5. **Paso 5**: Compilar con `npx vite build` y verificar cero errores.
6. **Paso 6**: Respaldar branch y tag de seguridad.
7. **Paso 7**: Desplegar al VPS de Producción (`https://forecast.geeksoft.tech`).
