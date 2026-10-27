# 🛸 ENJAMBRE FASE 2: SIMULACIÓN OPERATIVA Y AUDITORÍA BENOIT BLANC
**Componente:** Fase 2 del Pipeline E2E  
**Archivos Fuente:** [`run_qc_swarm.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/QC.SWARM.SELF.HEALING.AGENTS/run_qc_swarm.py) y [`swarm_engine/agents/`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/QC.SWARM.SELF.HEALING.AGENTS/swarm_engine/agents/)  
**Auditor Pericial:** Inspector Benoit Blanc (QC Sentinel)  
**Resultado:** 242 celdas y 177 invariantes comerciales auditados en 0.102 segundos con 0 violaciones (🟢 APPROVED).

---

## 🎯 1. Filosofía de la Fase 2: Simulación Agéntica sin Nube (Zero-Cloud)

Una vez que las tablas maestras han sido consolidadas y curadas en la **Fase 1**, el motor matemático del ERP (`forecast_service.py`) es conectado directamente a las tablas curadas en memoria RAM.

```python
# Intercepción total de la base de datos de producción (Zero Cloud Dependency)
fs.get_supabase = lambda: None
fs.get_cached_masters = lambda sb=None: curated_masters
```

Esto permite ejecutar el motor a **velocidad nativa de CPU** (sin latencias de red ni bloqueos de transacciones), simulando contratos mineros complejos, tramos de navegación, consumo de combustible, sobreestadías y matrices financieras plurianuales.

---

## 🤖 2. La Flota de 7 Agentes Autónomos

La Fase 2 despliega un enjambre de **6 agentes de negocio** que estresan el sistema desde diferentes ángulos comerciales, supervisados por un **séptimo agente pericial (QC Sentinel)**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          ENJAMBRE DE SIMULACIÓN (FASE 2)                        │
└─────────────────────────────────────────────────────────────────────────────────┘
     │                    │                   │                     │
     ▼                    ▼                   ▼                     ▼
[Agente 1]           [Agente 2]          [Agente 3]            [Agente 4]
⚓ SPCC Charterer    🧪 Nexa Acid        🃏 Wildcard Fleet     ⛽ Bunker +15%
 (9 líneas)           (6 líneas)          (8 líneas)            (3 líneas)
     │                    │                   │                     │
     └────────────────────┼───────────────────┴─────────────────────┘
                          │
                          ▼
                     [Agente 5]
             📊 Matrix Scenario Builder
                     (72 líneas)
                          │
                          ▼
                     [Agente 6]
              🕰️ Historical Replayer
          (Replay PB 2027 & 2028 +10%: 144 líneas)
                          │
                          ▼
            ══════════════════════════════
               [Agente 7: QC Sentinel]
             🕵️ INSPECTOR BENOIT BLANC
            ══════════════════════════════
              • Rúbrica ABIDE
              • 177 Invariantes Comerciales
              • Cero Tolerancia a Errores
                          │
                          ▼
             🟢 SEMÁFORO VERDE 100%
```

---

## 🔬 3. Detalle Operativo de Cada Agente

### ⚓ Agente 1: SPCC Charterer Agent (`agent_spcc_charterer.py`)
* **Rol Comercial:** Emula las operaciones de fletamento del mayor cliente minero de PETRAL (Southern Peru Copper Corporation).
* **Misión:** Genera 9 líneas de proyección cubriendo el cabotaje nacional de Ácido Sulfúrico ($H_2SO_4$) entre Ilo, Matarani, Callao y Conchán.
* **Prueba de Estrés:** Valida que el motor asigne correctamente los buques asignados (`MOQUEGUA` y `TABLONES`), respetando el tonelaje estándar de 13,500 MT y los fletes contractuales.
* **Tiempo de Ejecución:** **2.1 ms** (9 líneas).

### 🧪 Agente 2: Nexa Acid Operator (`agent_nexa_acid.py`)
* **Rol Comercial:** Simula la logística de exportación y cabotaje de Nexa Resources (Refinería de Cajamarquilla).
* **Misión:** Genera 6 líneas de proyección de ácido hacia el norte (Callao ➔ Salaverry / Paita) y rutas internacionales.
* **Prueba de Estrés:** Evalúa el impacto de tiempos de bombeo diferenciados y ventanas de muelle restringidas.
* **Tiempo de Ejecución:** **0.0 ms** (6 líneas).

### 🃏 Agente 3: Wildcard Fleet Allocator (`agent_wildcard_fleet.py`)
* **Rol Comercial:** Evalúa el comportamiento del ERP ante la incorporación de **Buques Comodín** (`WILDCARD_1`, `WILDCARD_2`) para atender picos de demanda que superan la capacidad de la flota propia.
* **Misión:** Genera 8 líneas asignando buques externos con TCE de mercado ($20,000 USD/día).
* **Prueba de Estrés:** Verifica que el motor no asuma fichas técnicas de buques inexistentes ni rompa la continuidad de la grilla.
* **Tiempo de Ejecución:** **0.0 ms** (8 líneas).

### ⛽ Agente 4: Bunker Stresstest Agent (`agent_bunker_stresstest.py`)
* **Rol Comercial:** Analista de riesgo de combustible.
* **Misión:** Genera 3 líneas aplicando un **incremento agresivo del +15% en los precios de búnker** IFO ($1,112/t) y MDO ($1,757/t).
* **Prueba de Estrés:** Comprueba la traslación matemática de costos de combustible al Net Revenue y la contracción proporcional del TCE diario del armador.
* **Tiempo de Ejecución:** **0.0 ms** (3 líneas).

### 📊 Agente 5: Matrix Scenario Builder (`agent_matrix_builder.py`)
* **Rol Comercial:** Director de Planificación Financiera.
* **Misión:** Construye una **Matriz Financiera anual completa de 72 líneas** (12 meses x 6 combinaciones clave buque/ruta).
* **Prueba de Estrés:** Estresa la capacidad de agregación multidimensional del backend: cálculo simultáneo de Gross Freight, Port Costs, Bunker Expense, Hire Expense, Net Revenue y TCE para toda la flota en un ejercicio fiscal completo.
* **Tiempo de Ejecución:** **33.3 ms** (72 líneas).

### 🕰️ Agente 6: Historical Replayer Agent (`agent_historical_replayer.py`)
* **Rol Pericial:** Auditor de Escenarios Históricos Reales de PETRAL.
* **Misión:** Extrae los escenarios históricos persistidos en la base de datos de producción y los re-ejecuta desde cero:
  1. `PB 2027` (Presupuesto Base 2027 con 72 líneas).
  2. `2028 +10% DEM 22/26K` (Presupuesto 2028 estresado con demoras y escalamiento de fletes con 72 líneas).
* **Prueba de Estrés:** Valida que el motor actual arroje exactamente los mismos resultados numéricos sin desvíos ni regresiones respecto a lo aprobado por la Gerencia.
* **Tiempo de Ejecución:** **61.7 ms** (144 líneas combinadas).

---

## ⚖️ 4. El Agente 7: QC Sentinel (Inspector Benoit Blanc)

El **QC Sentinel** no simula rutas: **audita implacablemente** cada celda calculada por los otros 6 agentes aplicando la **Rúbrica ABIDE**:

```
=======================================================================================================
                            RÚBRICA ABIDE DE AUDITORÍA BENOIT BLANC
=======================================================================================================
 [A] - Arithmetic Consistency: Gross Freight = Freight Rate * Cargo MT.
 [B] - Bunker & Expense Integrity: Bunker Cost = (Sea Days * Sea Cons + Port Days * Port Cons) * Price.
 [I] - Invariant of Frequency: If monthly_frequency == 0 ➔ total_duration == 0.0 (Obligatorio).
 [D] - Demurrage Non-Negativity: Demurrage Days >= 0, Demurrage Revenue >= 0.
 [E] - Economic Realism: Hire Expense = Charter Rate * Total Vessel Days.
=======================================================================================================
```

### Telemetría de Auditoría Pericial:
* **Celdas / Líneas Auditadas:** **242 líneas** en total.
* **Invariantes Matemáticos Comprobados:** **177 comprobaciones formales**.
* **Violaciones Detectadas:** **0 violaciones**.
* **Veredicto Oficial:** 🟢 **SEMÁFORO VERDE 100% (APPROVED)**.

---

## 📈 5. Tabla Resumen de Rendimiento Empírico de la Fase 2

| Agente / Escenario | Líneas Auditadas | Tiempo de Cómputo | Estado |
|---|:---:|:---:|:---:|
| ⚓ SPCC Charterer Agent | 9 | 2.1 ms | ✅ OK |
| 🧪 Nexa Acid Operator | 6 | 0.0 ms | ✅ OK |
| 🃏 Wildcard Allocator | 8 | 0.0 ms | ✅ OK |
| ⛽ Bunker Stresstest | 3 | 0.0 ms | ✅ OK |
| 📊 Matrix Scenario Builder | 72 | 33.3 ms | ✅ OK |
| 🕰️ Replay Histórico PB 2027 | 72 | 33.4 ms | ✅ OK |
| 🕰️ Replay Histórico 2028 +10% | 72 | 28.3 ms | ✅ OK |
| **TOTAL FASE 2** | **242** | **0.102 segundos** | 🟢 **100% APPROVED** |

---

## 🏛️ 6. Conclusión de la Fase 2

La Fase 2 certifica que el motor financiero de PETRAL ONE no solo es matemáticamente exacto, sino hiper-eficiente: procesa 242 escenarios anuales y plurianuales en **una décima de segundo**, garantizando que ninguna actualización de código cause regresiones en las cotizaciones de los clientes.
