# 🛸 BIENVENIDO A LA BÓVEDA DEL QC SWARM & SELF-HEALING SYSTEM

**Sistema:** PETRAL ONE / PETRAL SMART DASHBOARD  
**Propósito:** Fábrica de Control de Calidad (QC) y Auto-Curación Continua  
**Inspector General:** Detective Benoit Blanc  
**Estado:** ✅ ACTIVO, OPERATIVO Y VINCULADO AL GEMELO DIGITAL LOCAL  

---

## 📌 ¿Qué es este espacio?

Este entorno no es una simple carpeta de notas: **es el cerebro operacional del sistema de Control de Calidad (QC System)** de PETRAL ONE.

Aquí se implementa la metodología de **Gemelo Digital Local (Digital Twin)**:
1. **El usuario detecta un fallo o necesidad en producción** y nos la comunica.
2. **Creamos o especializamos a un Agente Tester** dentro del enjambre para representar exactamente la prueba que falló.
3. **Clonamos la base de datos de producción a local** (`sync_prod_masters_to_local.py`) para trabajar sobre datos comerciales 100% reales.
4. **Reconstruimos las tablas maestras desde cero (estado vacío)**, inyectando fallos humanos simulados y auto-curándolos en caliente con el Agente Ingestor.
5. **Corremos el enjambre completo de agentes** (SPCC, Nexa, Flota Comodín, Búnker, Matriz Financiera, Replay Histórico y Auditor de Resumen MEC) bajo la supervisión forense del Inspector Benoit Blanc (QC Sentinel).
6. **Aplicamos la cirugía en local**, logramos **Semáforo Verde (APPROVED)**, y solo bajo orden directa del usuario, desplegamos de forma atómica y segura al VPS Contabo.

---

## 🧭 Documentos Clave de Navegación

* 📜 **[[00_MANIFIESTO_Y_CICLO_OPERATIVO_QC_SWARM]]:** El Manifiesto Operativo con la explicación detallada de las 6 fases del ciclo de QC.
* 🗺️ **[[00_Indice_Maestro_QC_Swarm_Architecture]]:** Índice maestro y arquitectura técnica de los dos enjambres.
* 🏗️ **[[01_Enjambre_Fase_1_Master_Ingest_y_Self_Healing]]:** Fase 1: Sandbox de tablas vacías y auto-remediación en caliente.
* 🛸 **[[02_Enjambre_Fase_2_Simulacion_Operativa_y_Auditoria_Benoit_Blanc]]:** Fase 2: Simulación operativa de negocio y auditoría ABIDE.
* ⚡ **[[03_Pipeline_E2E_Orquestacion_y_Guia_de_Ejecucion]]:** Guía de ejecución del pipeline unificado end-to-end en terminal.
* 🩺 **[[09_Cirugia_Matriz_Dist_Desconectada]]:** Protocolo pericial de las cirugías aplicadas (Smart Distance Bridge y Carga de Escenarios de Forecasts).