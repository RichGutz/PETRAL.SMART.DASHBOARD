---
name: qc-swarm
description: Protocolo operativo del Sistema de Control de Calidad Multi-Agente (QC Swarm & Self-Healing). Actívalo cuando el usuario reporte anomalías, bugs o solicite pruebas/auditorías en Voyage Calculator, Matriz Financiera, Forecasts o Maestros de PETRAL.
---

# 🛸 Protocolo Operativo del Sistema de Control de Calidad (QC Swarm & Self-Healing)

Este protocolo define el ciclo de vida inquebrantable de 5 pasos para reproducir, aislar, auto-curar y auditar cualquier anomalía detectada en PETRAL SMART DASHBOARD sin tocar producción a ciegas.

---

## 🎯 Identidad Fundamental
`QC.SWARM.SELF.HEALING.AGENTS` es un **SISTEMA DE CONTROL DE CALIDAD (QC)**. No es un repositorio pasivo. Opera bajo un **Gemelo Digital Local (Digital Twin)** en RAM.

---

## ⚡ Ciclo Operativo de 5 Fases

### 🔹 Fase 1: Detección Humana y Parafraseo
* El usuario reporta una anomalía observada en producción (ej. distancias en 0 NM, error 500 al cargar forecasts, resúmenes descuadrados).
* **Regla:** Parafrasear el problema y NUNCA parchar directamente en producción.

### 🔹 Fase 2: Creación / Especialización del Agente Tester
* Ir a `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\QC.SWARM.SELF.HEALING.AGENTS\swarm_engine\agents\`.
* Crear un nuevo agente tester (ej. `agent_x.py`) o especializar uno existente para personificar la acción exacta del usuario y definir su invariante comercial/matemática.

### 🔹 Fase 3: Clonación de la BD de Producción a Local
* Descargar los datos reales vivos de producción (PostgreSQL Contabo `169.58.168.107`) sin riesgo de modificación:
```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\QC.SWARM.SELF.HEALING.AGENTS
python sync_prod_masters_to_local.py
```
* Esto actualiza las tablas canónicas en `Local_Database/json_tables/`.

### 🔹 Fase 4: Reconstrucción desde Cero y Self-Healing Loop
* Ejecutar el pipeline de dos enjambres en memoria (las 17 tablas maestras se vacían a cero, se reingestan simulando carga humana con inyección de errores y se auto-curan en caliente):
```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\QC.SWARM.SELF.HEALING.AGENTS
python run_pipeline_e2e_swarm.py
```
* El **Inspector Forense Benoit Blanc** evalúa la Rúbrica ABIDE (177+ invariantes, cálculo exacto de métricas comerciales).

### 🔹 Fase 5: Cirugía Quirúrgica en Local y Despliegue Certificado
1. Aplicar la corrección precisa en el código fuente local (Backend FastAPI o Frontend React).
2. Volver a correr `python run_qc_swarm.py` y `python run_pipeline_e2e_swarm.py` hasta obtener **Semáforo Verde 100% (APPROVED), 0 violaciones, Exit Code 0**.
3. Compilar el frontend:
```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend
npx vite build
```
4. Crear branch y tag de resguardo:
```powershell
git tag PRE.CIRUGIA.<NOMBRE>
git push origin tag PRE.CIRUGIA.<NOMBRE>
```
5. **SOLO SI EL USUARIO LO AUTORIZA DIRECTAMENTE:** Desplegar al VPS Contabo con `python deploy_petral_one_contabo.py`.
