# 🛡️ MANIFIESTO OPERATIVO: EL SISTEMA DE CONTROL DE CALIDAD ACTIVO (QC SWARM & SELF-HEALING)

**Sistema:** PETRAL SMART DASHBOARD / PETRAL ONE ERP  
**Bóveda:** `QC.SWARM.SELF.HEALING.AGENTS`  
**Arquitectura:** Gemelo Digital Local Multi-Agente con Auto-Curación y Auditoría Forense  
**Autor:** Detective Benoit Blanc & Geeksoft Architecture Squad  
**Estado:** ✅ 100% OPERATIVO, DESPLEGADO Y CERTIFICADO  

---

## 🎯 1. La Identidad Fundamental del Sistema: ¿Qué es esto?

> 💡 **DEFINICIÓN MAESTRA:**  
> Este directorio **NO es una simple carpeta de scripts ni un repositorio pasivo de documentación**.  
> **ESTO ES UN SISTEMA ACTIVO DE CONTROL DE CALIDAD (QC SYSTEM) Y AUTO-CURACIÓN CONTINUA**.

Su misión fundamental es erradicar el viejo vicio del desarrollo de software donde los programadores "parchean a ciegas en producción", rompen funcionalidades adyacentes o ignoran los datos reales del negocio.

Aquí opera una fábrica de calidad basada en un **Gemelo Digital Local (Digital Twin)** que permite clonar la realidad comercial de producción, reconstruirla desde cero en memoria, someterla al juicio implacable de un enjambre de agentes autónomos y solo liberar a producción código matemáticamente certificado.

---

## 🔄 2. El Ciclo Virtuoso de QC en 6 Fases (Cómo Funciona el Sistema)

Cuando una anomalía o necesidad comercial surge en la operación marítima de PETRAL, el sistema sigue de forma estricta, disciplinada y sistemática este ciclo cerrado de 6 fases:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             CICLO DE VIDA CERRADO DEL SISTEMA QC SWARM                           │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   [FASE 1: DETECCIÓN HUMANA] ➔ El usuario/negocio detecta un fallo o necesidad en producción.   │
│                 │                                                                                │
│                 ▼                                                                                │
│   [FASE 2: CREACIÓN DEL AGENTE TESTER] ➔ Se diseña un agente autónomo que encarna la prueba.     │
│                 │                                                                                │
│                 ▼                                                                                │
│   [FASE 3: CLONACIÓN DE BD A LOCAL] ➔ sync_prod_masters_to_local.py extrae datos reales.       │
│                 │                                                                                │
│                 ▼                                                                                │
│   [FASE 4: RECONSTRUCCIÓN EN CERO] ➔ MasterSandboxTwin (Tablas vacías ➔ Ingesta ➔ Self-Healing).│
│                 │                                                                                │
│                 ▼                                                                                │
│   [FASE 5: CORRIDA DEL ENJAMBRE COMPLETO] ➔ 8 Agentes estresan el sistema + Benoit Blanc.       │
│                 │                                                                                │
│                 ▼                                                                                │
│   [FASE 6: CIRUGÍA & DESPLIEGUE CERTIFICADO] ➔ Cirugía local ➔ Semáforo Verde ➔ Deploy VPS.    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 📍 Fase 1: Detección Humana y Feedback Comercial
* **Quién actúa:** El usuario final, el operador comercial o el administrador de flota.
* **Qué sucede:** El usuario nota que algo no responde en producción (`https://petral.one.geeksoft.tech`).  
  * *Ejemplo 1:* Las distancias de puertos chilenos o brasileños en el Voyage Calculator se muestran en `0 NM`.
  * *Ejemplo 2:* Al hacer clic en *"Cargar"* en la Matriz Financiera, sale la alerta `Error al cargar la lista de forecasts`, y en `/financial-projections` no aparecen los resúmenes.
* **Regla de Oro:** **CERO PARCHES DIRECTOS EN PRODUCCIÓN**. El agente escucha, parafrasea y traslada la anomalía al laboratorio forense local.

---

### 📍 Fase 2: Forja del Agente Tester Especializado
* **Quién actúa:** El Ingeniero de IA / Agente Arquitecto.
* **Qué sucede:** En vez de escribir código desordenado, **se crea o especializa un Agente Tester** dentro de la suite `swarm_engine/agents/`.
* **Propósito:** El agente debe emular con precisión quirúrgica exactamente la acción que el usuario intentó hacer y verificar su invariante comercial:
  * *Para el caso distancias:* Se creó el **Smart Distance Bridge** y pruebas de resolución $O(1)$ bidireccional.
  * *Para el caso forecasts:* Se mejoró el **Agente 6 (`agent_historical_replayer.py`)** con validación estricta de esquemas de catálogo y se creó el **Agente 8 (`agent_financial_projections_summary.py`)**, encargado de auditar que el resumen MEC en `/financial-projections` sea 1:1 con la Matriz Financiera detallada.

---

### 📍 Fase 3: Clonación Automática de la BD de Producción a Local
* **Quién actúa:** Script de sincronización [`sync_prod_masters_to_local.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/QC.SWARM.SELF.HEALING.AGENTS/sync_prod_masters_to_local.py).
* **Qué sucede:**  
  * Se conecta en modo **solo lectura** a la base de datos PostgreSQL de producción (Contabo VPS `169.58.168.107`).
  * Extrae el 100% de los registros canónicos de las 17 tablas vivas: `distances`, `ports`, `vessels`, `routes_quotes`, `commercial_forecasts`, `contracts`, `port_costs_matrix`, etc.
  * Guarda copias idénticas en archivos JSON en `Local_Database/json_tables/`.
* **Resultado:** El laboratorio local cuenta con los datos reales exactos del negocio **sin riesgo alguno de modificar o degradar la base de datos viva**.

---

### 📍 Fase 4: Reconstrucción desde Cero (Tablas Vacías ➔ Ingesta ➔ Self-Healing)
* **Quién actúa:** `MasterSandboxTwin` y `MasterIngestHealerAgent`.
* **Qué sucede:**
  1. Se inicializa el entorno con las **17 tablas maestras en estado 100% VACÍO (Cero Datos en RAM)**.
  2. El **Agente Ingestor** simula a un usuario humano cargando masivamente los registros.
  3. Se inyectan deliberadamente **fallos humanos típicos** (espacios en blanco, caracteres numéricos como strings, velocidades en cero, consumos negativos).
  4. Los interceptores de **Self-Healing** detectan y curan en caliente cada anomalía en microsegundos (sanitización, casteo numérico defensivo, valores absolutos).
* **Resultado:** Se entrega al motor matemático un conjunto de tablas 100% purificadas, sanas e inmunes a fallos de formato.

---

### 📍 Fase 5: Corrida del Enjambre Completo y Auditoría Benoit Blanc
* **Quién actúa:** El Enjambre Multi-Agente (`run_qc_swarm.py` y `run_pipeline_e2e_swarm.py`).
* **Qué sucede:**
  * **Agente 1 (SPCC Charterer):** Estresa contratos de flete y tonelajes masivos de ácido sulfúrico.
  * **Agente 2 (Nexa Acid Operator):** Prueba rotaciones complejas Callao-Cajamarquilla con puertos alternos.
  * **Agente 3 (Wildcard Fleet Allocator):** Evalúa fletes comodines y asignaciones dinámicas de buques.
  * **Agente 4 (Bunker Stresstest):** Somete la matriz a fluctuaciones severas de precios IFO y MDO.
  * **Agente 5 (Matrix Scenario Builder):** Construye grillas multianuales de 72 celdas completas.
  * **Agente 6 (Historical Replayer):** Valida la carga del catálogo y re-ejecuta los escenarios reales (`PB 2027` y `2028 +10%`) garantizando cero regresión contable.
  * **Agente 8 (Financial Projections Auditor):** Comprueba que la sumatoria detallada de la Matriz equivalga al Resumen Ejecutivo MEC en `/financial-projections`:
    $$\sum(\text{Líneas Matriz Financiera}) \equiv \text{MEC Summary de Proyecciones Financieras}$$
  * **Agente 7: QC Sentinel (Inspector Forense Benoit Blanc):**
    Aplica la **Rúbrica ABIDE** y audita cada celda calculada. Si hay una sola violación matemática o colapso de tipos, **ENCIENDE EL SEMÁFORO ROJO** y bloquea la entrega.

---

### 📍 Fase 6: Cirugía Quirúrgica en Local, Certificación y Despliegue
* **Quién actúa:** Antigravity AI + Aprobación del Usuario Humano.
* **Qué sucede:**
  1. **Cirugía Local:** Se corrige la causa raíz en el código fuente (Backend FastAPI o Frontend React).
  2. **Verificación Terminal:** Se re-ejecuta el Swarm hasta obtener **Semáforo Verde 100% (APPROVED)** con `Exit Code 0`.
  3. **Build Frontend:** Se compila el bundle con `npx vite build` asegurando cero errores de compilación.
  4. **Punto de Restauración Git:** Se crea la branch y tag de resguardo (`git tag PRE.CIRUGIA...`).
  5. **Despliegue a Producción:** Solo tras la orden expresa del usuario (*"Procede / Pushea al VPS"*), se ejecuta el despliegue automatizado por SSH/SFTP al VPS Contabo (`deploy_petral_one_contabo.py`).
  6. **Smoke Test UAT en Vivo:** Scripts headless prueban en tiempo real los endpoints públicos y la interfaz en `https://petral.one.geeksoft.tech`.

---

## 🔬 3. Casos Reales Resueltos con este Sistema

| Caso Forense | Síntoma Reportado por el Usuario | Agente Tester Involucrado | Prueba en el Gemelo Digital Local | Resultado en Producción |
| :--- | :--- | :--- | :--- | :--- |
| **Caso 1: Distancias Cono Sur en 0 NM** | En Voyage Calculator, piernas chilenas/brasileñas (`ANCUD`, `POSESION`, `RIO_GRANDE`) arrojaban `0 NM`. | **Smart Distance Bridge** + `test_route_resolver.mjs` | Indexación bidireccional $O(1)$ de la tabla `distances` (74 filas clonadas). Resolución de **7,808.0 NM** y **30.46 días mar**. | Voyage Calculator resuelve automáticamente cualquier par de puertos del Maestro sin fallas. |
| **Caso 2: Error 500 al Cargar Escenarios** | En Matriz Financiera, alerta `Error al cargar la lista de forecasts`. En `/financial-projections`, pantalla en blanco. | **Agente 6** (Catalog Auditor) + **Agente 8** (Financial Projections Auditor) | Diagnóstico de `ResponseValidationError` en Pydantic 2 por timestamps de Postgres. Tipado tolerante y serializadores automáticos. | Carga instantánea de los 6 escenarios grabados y cálculo del resumen MEC 1:1 en vivo. |

---

## 🛡️ 4. Reglas Inmutables de Operación

1. **Nunca probar en producción:** Todo experimento, inyección de fallos o test de estrés ocurre en memoria en el Gemelo Digital Local.
2. **Los datos son sagrados:** Las tablas descargadas representan la verdad fáctica de la empresa. Ningún modelo se considera válido si no puede reproducir con éxito los escenarios históricos reales.
3. **El Humano manda:** Ninguna línea de código viaja a Contabo VPS sin la orden explícita y directa del usuario.
4. **Todo cambio genera un Agente Guardián:** Cada nuevo bug reportado se convierte en una prueba automatizada permanente dentro del enjambre para que el error jamás vuelva a repetirse en el futuro.
