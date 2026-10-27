# ⚡ GUÍA OPERATIVA: PIPELINE E2E, ORQUESTACIÓN Y COMANDOS DE EJECUCIÓN
**Componente:** Orquestador Unificado de Dos Enjambres  
**Script Principal:** [`run_pipeline_e2e_swarm.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/QC.SWARM.SELF.HEALING.AGENTS/run_pipeline_e2e_swarm.py)  
**Ambiente:** Git Worktree Local (`feature/qc-swarm-local`)  
**Directorio:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\QC.SWARM.SELF.HEALING.AGENTS`  

---

## 🎯 1. La Filosofía del Paso de Estafeta In-Memory

El verdadero poder de la arquitectura radica en el **encadenamiento determinístico de dos enjambres sin almacenamiento intermedio en disco ni peticiones a la nube**:

```
                          EL PASO DE ESTAFETA DETERMINÍSTICO
                          
  [17 Tablas Vacías] ──▶ [FASE 1: Master Ingest Swarm]
                                  │
                                  ▼
                         • 1,779 registros curados
                         • 4 fallos auto-sanados
                         • Guardas navales validadas
                                  │
                                  ▼ (Paso de Estafeta: curated_masters en RAM)
                         ┌─────────────────────────────────┐
                         │ fs.get_cached_masters = sandbox │
                         └────────────────┬────────────────┘
                                          │
                                          ▼
                         [FASE 2: QC Swarm & Benoit Blanc]
                                  │
                                  ▼
                         • 6 Agentes de Negocio
                         • Replay Histórico 177 Celdas
                         • Sentinel ABIDE (0 Violaciones)
                                  │
                                  ▼
                      🟢 SEMÁFORO VERDE 100% (APPROVED)
```

Al operar 100% en la memoria RAM del proceso de Python, el pipeline completo se ejecuta en **0.334 segundos**, eliminando el 100% de las fallas transitorias de red o bloqueos de PostgreSQL.

---

## 💻 2. Catálogo de Scripts y Cuándo Ejecutar Cada Uno

El repositorio dispone de 3 ejecutables especializados según la necesidad del desarrollador o auditor:

| Script Ejecutable | Enjambres Involucrados | Cuándo Utilizarlo | Tiempo Típico |
|---|:---:|---|:---:|
| [`run_master_builder_swarm.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/QC.SWARM.SELF.HEALING.AGENTS/run_master_builder_swarm.py) | **Solo Fase 1** (Maestros) | Al modificar endpoints de mutación (`UPSERT`), añadir nuevas columnas a tablas maestras o calibrar guardas de integridad. | ~0.21 s |
| [`run_qc_swarm.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/QC.SWARM.SELF.HEALING.AGENTS/run_qc_swarm.py) | **Solo Fase 2** (Simulaciones) | Al realizar cambios en la lógica financiera de `forecast_service.py`, fórmulas de flete, búnker o sobreestadías. | ~0.15 s |
| [`run_pipeline_e2e_swarm.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/QC.SWARM.SELF.HEALING.AGENTS/run_pipeline_e2e_swarm.py) | **Fase 1 + Fase 2** (Pipeline E2E) | **OBLIGATORIO antes de cualquier commit o deploy a producción**. Valida todo el ciclo de vida desde cero. | ~0.33 s |

---

## 🛠️ 3. Guía Paso a Paso de Comandos en PowerShell

### Paso 1: Navegar al Worktree Aislado
Abrir una terminal de PowerShell y posicionarse en el directorio del enjambre:
```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\QC.SWARM.SELF.HEALING.AGENTS
```

### Paso 2: Ejecutar el Pipeline E2E Completo
Lanzar la corrida de los dos enjambres encadenados:
```powershell
python run_pipeline_e2e_swarm.py
```

### Salida Esperada en Consola (Semáforo Verde):
```text
=====================================================================================
🛸 GEEKSOFT | PIPELINE END-TO-END QC SWARM + SELF-HEALING (GEMELO DIGITAL LOCAL)
   Cadena: Maestros Vacíos ➔ Ingesta + Auto-Curación ➔ Simulación y Auditoría QC
=====================================================================================

🔹 FASE 1: ENJAMBRE DE MAESTROS (REPLICACIÓN DESDE CERO + SELF-HEALING)
  [1.1] Tablas maestras inicializadas en estado 100% VACÍO.
  [1.2] Desplegando Master Ingest & Healer Agent...
  [1.3] Ingesta completada: 1779 registros.
  [1.4] Telemetría de Fallos: 4 inyectados | 4 auto-remediados (100% HEALED).
  [1.5] Tiempo de Fase 1: 0.232 segundos.
  [1.6] Bitácora de Curación en Caliente:
        ✓ [1] PORTS:ILO -> Sanitización upper().strip() -> 'ILO'
        ✓ [2] DISTANCES:MANTA-TALARA -> Casteo defensivo float(distance_nm) -> 138.0 NM
        ✓ [3] VESSELS:TABLONES -> Conversión a valor absoluto positivo (+3.5 t/d)
        ✓ [4] VESSELS:MOQUEGUA -> Restitución canónica de Speed (11.0 kn) y casteo float de TCE (13000.0 USD/día)

🔹 CONEXIÓN PIPELINE: ALIMENTANDO MOTOR MATEMÁTICO CON MAESTROS CURADOS
  ✓ Motor forecast_service conectado directamente al Sandbox Curado de Fase 1.
  ✓ Tablas maestras activas: 17 | Cero dependencias externas.

🔹 FASE 2: ENJAMBRE DE SIMULACIÓN Y AUDITORÍA PERICIAL BENOIT BLANC
  [2.1] Ejecutando agentes de simulación dinámica...
        ✅ [⚓ SPCC Charterer        ]:  9 líneas simuladas en 2.1ms
        ✅ [🧪 Nexa Acid Operator    ]:  6 líneas simuladas en 0.0ms
        ✅ [🃏 Wildcard Allocator    ]:  8 líneas simuladas en 0.0ms
        ✅ [⛽ Bunker Stresstest     ]:  3 líneas simuladas en 0.0ms
        ✅ [📊 Matrix Scenario Builder]: 72 líneas simuladas en 33.3ms

  [2.2] Ejecutando Historical Replayer Agent (Escenarios Reales PB 2027 / 2028)...
        ✅ [🕰️ Historical Replayer]: Replay 'PB 2027' (72 líneas) en 33.4ms
        ✅ [🕰️ Historical Replayer]: Replay '2028 +10% DEM 22/26K' (72 líneas) en 33.4ms

=====================================================================================
⚖️ VEREDICTO PERICIAL BENOIT BLANC - PIPELINE E2E COMPLETO
=====================================================================================
  • Tiempo Total Pipeline  : 0.334 segundos
    - Fase 1 (Maestros)    : 0.232 s
    - Fase 2 (Simulaciones): 0.102 s
  • Celdas/Líneas auditadas: 242
  • Invariantes validados  : 177
  • Violaciones detectadas : 0

  🟢 RESULTADO GLOBAL: SEMÁFORO VERDE 100% (APPROVED)
     El sistema fue capaz de inicializar maestros desde cero, replicar la carga humana,
     cometer y auto-curar errores, y ejecutar 177 cotizaciones con exactitud matemática.
=====================================================================================
```

---

## 🛑 4. Criterios de Parada y Protocolo ante Fallos

Si durante la ejecución del pipeline el veredicto es **🔴 RECHAZADO**:

1. **Parada Inmediata:** Queda terminantemente prohibido hacer commit o push a la rama `main` o al VPS Contabo.
2. **Revisión de Violaciones:** El reporte final de Benoit Blanc listará exactamente qué agente, fila o invariante falló:
   ```text
   [!] {'agent': 'Bunker Stresstest', 'rule': 'INVARIANT_ARITHMETIC_CONSISTENCY', 'detail': 'Descalce en Net Revenue'}
   ```
3. **Diagnóstico Aislado:** Ejecutar el runner específico (`run_master_builder_swarm.py` si el fallo es de maestros, o `run_qc_swarm.py` si es de cálculo) para depurar la función afectada.
4. **Repetición del Ciclo:** Corregir el código hasta que `run_pipeline_e2e_swarm.py` concluya con **Exit Code 0** y Semáforo Verde 100%.
