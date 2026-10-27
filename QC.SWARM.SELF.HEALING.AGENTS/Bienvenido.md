# 🛸 BIENVENIDO AL SISTEMA DE QC & SELF-HEALING (PETRAL ONE)

> 💡 **DECLARACIÓN DE PRINCIPIOS:**  
> **ESTE ESPACIO ES UN SISTEMA ACTIVO DE CONTROL DE CALIDAD (QC SYSTEM).**  
> No es una librería pasiva ni un almacén de notas. Es una factoría automatizada de aseguramiento de calidad con agentes inteligentes que garantizan la salud comercial y contable del ERP marítimo PETRAL ONE.

---

## 🔄 ¿Cómo Funciona este Sistema de QC? (El Ciclo Operativo)

Cada vez que ocurre una anomalía o se requiere una nueva validación de negocio, el sistema sigue este ciclo estricto y repetible:

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

## 🧭 Documentos Clave de la Bóveda

* 🛠️ **[[SKILL_QC_SWARM_OPERATIVO]]:** Guía rápida (Skill) y cheat sheet de comandos para operar el QC Swarm.
* 📜 **[[00_MANIFIESTO_Y_CICLO_OPERATIVO_QC_SWARM]]:** Manifiesto detallado de las 6 fases del sistema de QC, casos forenses resueltos y reglas inmutables.
* 🗺️ **[[00_Indice_Maestro_QC_Swarm_Architecture]]:** Índice maestro y arquitectura técnica de los dos enjambres (Fase 1 y Fase 2).
* 🏗️ **[[01_Enjambre_Fase_1_Master_Ingest_y_Self_Healing]]:** Fase 1: Sandbox de tablas vacías y auto-remediación en caliente.
* 🛸 **[[02_Enjambre_Fase_2_Simulacion_Operativa_y_Auditoria_Benoit_Blanc]]:** Fase 2: Simulación operativa de negocio y auditoría ABIDE.
* ⚡ **[[03_Pipeline_E2E_Orquestacion_y_Guia_de_Ejecucion]]:** Guía de ejecución del pipeline unificado end-to-end en terminal (`run_pipeline_e2e_swarm.py`).
* 🩺 **[[09_Cirugia_Matriz_Dist_Desconectada]]:** Protocolo pericial de las cirugías aplicadas (Smart Distance Bridge y Carga de Escenarios de Forecasts).