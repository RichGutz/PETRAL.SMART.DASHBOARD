# 23 — Plan Maestro de Demoras Históricas, Formato Excel y Modos P / M / C

> **Fecha de Elaboración:** 24 de Agosto de 2026  
> **Estado:** 🚀 Aprobado para Ejecución  
> **Origen del Requerimiento:** Audio `maestro.demoras.ogg` y Base de Datos Histórica [`Demoras historicos Naves.xlsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Documentos.Petral/Demoras%20historicos%20Naves.xlsx)  
> **Tag / Branch de Respaldo:** `PRE.MAESTRO.DEMORAS.24.08.26`

---

## 1. 🎯 Objetivos Principales

1. **Desacoplar Demoras del Maestro de Gastos Portuarios:**
   * Retirar la cuadrícula de demoras mensuales de [`PortCostsMaster_V2.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Masters/PortCostsMaster_V2.tsx) para mantenerlo estrictamente enfocado en costos fijos de *Carga*, *Descarga* y *Bunkering*.
2. **Crear el Maestro de Demoras (`DemurrageMaster_V2.tsx`):**
   * Vista integral dentro de *Maestros de Costos* (`/demurrage`) que visualice:
     * **Matriz Consolidada de Demoras:** Promedios Anuales y Desglose Mensual (ENE a DIC) por par `(Buque, Puerto)`.
     * **Bitácora de Viajes Históricos:** Grilla detallada con los 161+ viajes registrados (SPCC, NEXA, etc.).
3. **Formato Excel Bidireccional (Exportación / Ingesta):**
   * **Bajar Excel (Plantilla con Datos):** Descargar la data histórica en un formato `.xlsx` estandarizado y limpio.
   * **Subir Excel (Carga Masiva):** Permitir al usuario agregar nuevos viajes/recaladas al archivo y subirlo para actualizar la base de datos en tiempo real.
4. **Soporte de 3 Modos de Demoras en el Multicotizador (`P` / `M` / `C`):**
   * **Modo `P` (Promedio):** Sugiere automáticamente la media histórica consolidada para el buque y puerto (`annual_average`).
   * **Modo `M` (Mensual):** Sugiere el valor correspondiente al mes de la validez de la oferta (`validFrom`).
   * **Modo `C` (Cero):** Sugiere $0.00$ días (no jala ni sugiere estadías).

---

## 2. 📊 Diagnóstico del Archivo Excel Histórico

* **Ubicación:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Documentos.Petral\Demoras historicos Naves.xlsx`
* **Total de recaladas:** 161 viajes (Años 2024, 2025, 2026).
* **Naves operadas:** *Moquegua*, *Tablones*, *Bomar Lynx*, *Huemul*, *Concon Trader*.
* **Puertos cubiertos:** `Puerto ILO`, `Callao`, `Marcona`, `Matarani`, `Mejillones`.
* **Métricas:** Horas de demora y Días equivalentes ($\text{Días} = \text{Horas} / 24$).

### 📌 Promedios Históricos Consolidados (en Días):

| Nave | Puerto ILO | Callao | Marcona | Matarani | Mejillones |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **B/T Moquegua** | $1.49\text{ d}$ ($35.7\text{ h}$) | $0.26\text{ d}$ ($6.3\text{ h}$) | $1.97\text{ d}$ ($47.3\text{ h}$) | $1.46\text{ d}$ ($35.1\text{ h}$) | $1.69\text{ d}$ ($40.6\text{ h}$) |
| **B/T Tablones** | $2.10\text{ d}$ ($50.4\text{ h}$) | $1.65\text{ d}$ ($39.6\text{ h}$) | $2.84\text{ d}$ ($68.3\text{ h}$) | $0.84\text{ d}$ ($20.3\text{ h}$) | $2.45\text{ d}$ ($58.9\text{ h}$) |
| **Bomar Lynx** | $1.99\text{ d}$ ($47.7\text{ h}$) | — | — | — | $5.46\text{ d}$ ($131.0\text{ h}$) |
| **Huemul** | $5.01\text{ d}$ ($120.2\text{ h}$) | — | — | — | $0.52\text{ d}$ ($12.4\text{ h}$) |
| **Concon Trader** | $0.02\text{ d}$ ($0.5\text{ h}$) | — | — | — | $-0.27\text{ d}$ ($-6.5\text{ h}$) |

---

## 3. 🛠️ Arquitectura Técnica y Pasos de Implementación

### Paso 1: Limpieza del Maestro de Gastos Portuarios
* En `PortCostsMaster_V2.tsx`, remover la sección de *Demoras Mensuales* para eliminar ruido visual y redundancia operativa.

### Paso 2: Construcción del Maestro de Demoras (`DemurrageMaster_V2.tsx`)
* **Ubicación:** `src/pages/Masters/DemurrageMaster_V2.tsx`
* **Ruta Frontend:** `/demurrage`
* **Sidebar:** Enlace con icono `⏳ Maestro de Demoras` bajo *Maestros de Costos* en `MasterTemplate_V2.tsx`.
* **Componentes Clave:**
  1. *KPI Cards Superiores:* Total Viajes Registrados, Demora Promedio Flota, Puerto Crítico (Mayor Fondeo).
  2. *Tab 1 - Matriz de Perfiles (Buque × Puerto × Meses):* Vista resumida de 12 meses + promedio anual.
  3. *Tab 2 - Historial Granular de Viajes:* Grilla interactiva con búsqueda por nave, cliente, año y puerto.
  4. *Herramientas de Archivo:*
     * Botón `Bajar Formato / Data Excel`: Exporta archivo `.xlsx` listo para edición.
     * Botón `Cargar Excel`: Importador drag-and-drop con validación y guardado instantáneo.

### Paso 3: Servicio Reactivo de Demoras (`portDemurrageRatesService.ts`)
* Actualización para centralizar la resolución de demoras bajo los 3 modos:
  ```typescript
  public static resolveDemurrageDays(
      portId: string,
      vesselId: string,
      mode: 'P' | 'M' | 'C',
      dateString: string | undefined | null,
      demurrageData: any[]
  ): number {
      if (mode === 'C') return 0;
      if (mode === 'P') return this.getAnnualAverage(portId, vesselId, demurrageData);
      if (mode === 'M') return this.getMonthValue(portId, vesselId, dateString, demurrageData);
      return 0;
  }
  ```

### Paso 4: Integración en Multicotizador (`MultiCotizadorExcel.tsx`)
* Selector visual de modos de demora en la cabecera de la sección de estadías:
  * Botones segmentados `[ P: Promedio ]` `[ M: Mensual ]` `[ C: Cero ]`.
  * Inyección automática del valor sugerido (en texto gris con posibilidad de override manual en negro).
  * Computación reactiva en el motor financiero:
    $$\text{Días Demurrage} \times \text{Tarifa Demurrage} = \text{Ingreso Estadías}$$
    $$\text{Días Demurrage} \times \text{Consumo IDLE (IFO + MDO)} = \text{Costo Búnker Fondeo}$$

---

## 4. 🔄 Flujo Operativo del Usuario (Ciclo Excel)

```
[ Usuario en Maestro de Demoras ] 
         │
         ├──> [ Clic "Bajar Excel" ] ───> Descarga `Demoras_Historicas_Petral.xlsx`
         │                                               │
         │                                               ▼
         │                                  [ Abre Excel y añade nuevos viajes ]
         │                                               │
         │                                               ▼
         └──<── [ Clic "Cargar Excel" ] <──── Guarda y arrastra archivo al sistema
                         │
                         ▼
        [ Sistema actualiza base de datos y recalcula promedios a 0ms ]
                         │
                         ▼
        [ Multicotizador refleja de inmediato los nuevos promedios ]
```

---

## 5. 🔍 Criterios de Aceptación y QC

1. **Maestro de Gastos Portuarios:** Carga limpia sin referencias a demoras.
2. **Maestro de Demoras:**
   * Carga inicial completa de los 161 viajes históricos.
   * Exporta archivo `.xlsx` legible y formateado.
   * Permite importar nuevas filas sin corromper registros existentes.
3. **Multicotizador:**
   * Al pulsar `P`, sugiere el promedio histórico.
   * Al pulsar `M`, sugiere el promedio del mes de la fecha de validez.
   * Al pulsar `C`, fija la sugerencia en `0.00`.
   * El cálculo del impacto en búnker IDLE y margen financiero concilia con la Fila TOTAL Azul.
