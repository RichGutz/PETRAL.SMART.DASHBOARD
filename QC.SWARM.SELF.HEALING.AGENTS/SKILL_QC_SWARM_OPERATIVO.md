# 🛸 GUÍA RÁPIDA (SKILL): CÓMO OPERAR EL SISTEMA DE QC & SELF-HEALING SWARM

**Ubicación:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\QC.SWARM.SELF.HEALING.AGENTS\QC.SWARM.SELF.HEALING.AGENTS`  
**Referencia Técnica:** `.agents/skills/qc-swarm/SKILL.md`  
**Estado:** ✅ ACTIVO Y LISTO PARA EJECUCIÓN INMEDIATA  

---

## 🎯 ¿Qué hacer cuando el usuario reporta un problema o pide probar algo?

El agente **NUNCA** improvisa ni toca producción directamente. Sigue esta secuencia exacta de 5 pasos:

```
  ┌───────────────────────────────────────────────────────────────────────────────┐
  │                        EL CICLO DE VIDA DEL SISTEMA DE QC                     │
  ├───────────────────────────────────────────────────────────────────────────────┤
  │                                                                               │
  │  1. 👤 DETECCIÓN DEL USUARIO                                                  │
  │     El usuario detecta algo en producción (ej. distancia en 0, error 500,     │
  │     grilla descuadrada) y nos lo reporta directamente.                        │
  │                                   │                                           │
  │                                   ▼                                           │
  │  2. 🤖 CREACIÓN DEL AGENTE TESTER                                             │
  │     Creamos o especializamos a un Agente Tester que personifica exactamente   │
  │     la acción del usuario y establece la invariante matemática a cumplir.     │
  │                                   │                                           │
  │                                   ▼                                           │
  │  3. 📦 COPIA DE LA BASE DE DATOS DE PRODUCCIÓN A LOCAL                        │
  │     Clonamos en caliente la BD viva de producción a local (sync_prod_masters) │
  │     para trabajar sobre los datos comerciales reales de la empresa.           │
  │                                   │                                           │
  │                                   ▼                                           │
  │  4. 🏗️ RECONSTRUCCIÓN EN CERO CON TODO EL CICLO DE AGENTES                   │
  │     Vaciamos la memoria (estado cero), reingestamos las 17 tablas maestras,    │
  │     inyectamos fallos humanos, curamos en caliente (Self-Healing) y corremos  │
  │     el enjambre completo (8 agentes + Benoit Blanc) para estresar el sistema. │
  │                                   │                                           │
  │                                   ▼                                           │
  │  5. 🩺 CIRUGÍA QUIRÚRGICA, VERIFICACIÓN Y CORRECCIÓN                          │
  │     Aplicamos la cirugía en local, logramos Semáforo Verde 100% (APPROVED),    │
  │     y solo con la orden del usuario desplegamos atómicamente a producción.    │
  │                                                                               │
  └───────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Comandos Rápidos de Terminal (Cheat Sheet Ejecutable)

### 🔹 Paso 1: Clonar BD viva de Producción a Local
```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\QC.SWARM.SELF.HEALING.AGENTS
python sync_prod_masters_to_local.py
```

### 🔹 Paso 2: Crear o adaptar el Agente Tester
Ubicación de agentes:
`C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\QC.SWARM.SELF.HEALING.AGENTS\swarm_engine\agents\`
* Si es sobre distancias/rutas: adaptar `Smart Distance Bridge` y agentes de simulación.
* Si es sobre forecasts/catálogo: adaptar `agent_historical_replayer.py` (Agente 6).
* Si es sobre resúmenes de `/financial-projections`: adaptar `agent_financial_projections_summary.py` (Agente 8).

### 🔹 Paso 3: Reconstruir desde Cero (Tablas Vacías ➔ Ingesta ➔ Self-Healing ➔ Auditoría ABIDE)
```powershell
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\QC.SWARM.SELF.HEALING.AGENTS
python run_pipeline_e2e_swarm.py
```
O para correr solo el enjambre de 8 agentes:
```powershell
python run_qc_swarm.py
```

### 🔹 Paso 4: Cirugía Quirúrgica en Local
* Modificar únicamente los archivos necesarios (Backend FastAPI o Frontend React).
* Re-ejecutar `python run_qc_swarm.py` hasta obtener **Semáforo Verde 100% (APPROVED), 0 violaciones**.

### 🔹 Paso 5: Compilación y Despliegue (SOLO con orden del usuario)
```powershell
# 1. Compilar Frontend
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend
npx vite build

# 2. Tag de Resguardo Git
git tag PRE.CIRUGIA.<NOMBRE>
git push origin tag PRE.CIRUGIA.<NOMBRE>

# 3. Despliegue Automatizado a Contabo VPS (169.58.168.107)
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS
python deploy_petral_one_contabo.py
```
