# 🧭 ÍNDICE MAESTRO: ARQUITECTURA DE DOS ENJAMBRES (QC SWARM & SELF-HEALING)
**Bóveda Oficial:** `QC.SWARM.SELF.HEALING.AGENTS`  
**Sistema:** PETRAL SMART DASHBOARD / PETRAL ONE ERP  
**Autor:** Detective Benoit Blanc & Geeksoft Architecture Squad  
**Estado:** ✅ 100% OPERATIVO EN LOCAL (Exit Code 0)  
**Fecha:** 26 de Octubre de 2026  

---

## 🎯 1. Propósito de la Bóveda

Esta bóveda documental contiene la especificación exhaustiva, matemática y operacional del sistema de **Dos Enjambres Multi-Agente Autónomos** diseñado para blindar a PETRAL ONE frente a regresiones, errores humanos de carga y corrupciones en tablas maestras.

El sistema funciona como un **Gemelo Digital Local (Digital Twin)** que opera 100% offline en la memoria de la máquina de desarrollo, procesando miles de registros y auditando cientos de escenarios financieros en fracciones de segundo (tiempo total: **0.334 segundos**).

```
=======================================================================================================
                         ARQUITECTURA DEL PIPELINE DE DOS ENJAMBRES
=======================================================================================================

   ┌────────────────────────────────────────────────────────────────────────┐
   │                    TABLAS MAESTRAS EN ESTADO CERO                      │
   │           (17 Tablas Vacías en RAM: Buques, Puertos, Distancias...)     │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │ 🏗️ FASE 1: ENJAMBRE DE MAESTROS & AUTO-REMEDIACIÓN                     │
   │  • Agente Ingestor: MasterIngestHealerAgent                           │
   │  • Carga Manual Humana: 1,779 registros canónicos replicados           │
   │  • Inyección de 4 Fallos: Espacios, strings, speed 0, consumo negativo │
   │  • Guardas de Sandbox: MasterSandboxTwin intercepta en caliente        │
   │  • Self-Healing Loop: 100% de registros auto-remediados (0.232s)       │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │ (Entrega de Tablas Curadas en RAM)
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │ 🛸 FASE 2: ENJAMBRE DE SIMULACIÓN OPERATIVA & AUDITORÍA BENOIT BLANC   │
   │  • Motor Matemático: forecast_service.py alimentado con datos curados │
   │  • 6 Agentes de Negocio: SPCC, Nexa, Comodín, Búnker, Matriz, Replay  │
   │  • Agente 7 (QC Sentinel): Benoit Blanc audita 242 celdas de negocio   │
   │  • Verificación Rúbrica ABIDE: 177 invariantes validados, 0 violaciones│
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │ 🟢 VEREDICTO FINAL: SEMÁFORO VERDE 100% (APPROVED)                      │
   │        Compuerta abierta para despliegue seguro al VPS Contabo         │
   └────────────────────────────────────────────────────────────────────────┘
=======================================================================================================
```

---

## 📚 2. Mapa de Navegación de la Bóveda

La suite documental está estructurada en los siguientes tomos hiper-detallados:

1. **[[01_Enjambre_Fase_1_Master_Ingest_y_Self_Healing]]**:
   * Arquitectura del **Sandbox de Tablas Vacías** (`MasterSandboxTwin`).
   * Cómo opera el **Master Ingest & Healer Agent** simulando a un usuario humano.
   * La mecánica de inyección de los 4 fallos reales y su auto-curación defensiva.
   * Telemetría de curación de 1,779 registros en 0.232 segundos.

2. **[[02_Enjambre_Fase_2_Simulacion_Operativa_y_Auditoria_Benoit_Blanc]]**:
   * Despliegue de los 6 agentes comerciales y operativos (SPCC, Nexa, Comodín, Búnker, Matriz, Histórico).
   * El rol supervisor y pericial del **Agente 7: QC Sentinel (Inspector Benoit Blanc)**.
   * La **Rúbrica ABIDE** y los invariantes comerciales inviolables.
   * Replay histórico determinístico de los escenarios reales `PB 2027` y `2028 +10%`.

3. **[[03_Pipeline_E2E_Orquestacion_y_Guia_de_Ejecucion]]**:
   * El orquestador unificado: [`run_pipeline_e2e_swarm.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/QC.SWARM.SELF.HEALING.AGENTS/run_pipeline_e2e_swarm.py).
   * El protocolo de paso de estafeta en memoria sin tocar PostgreSQL de producción.
   * Guía de comandos de terminal de PowerShell para ejecución y verificación local.
   * Tiempos de ejecución empíricos y criterios de parada ante errores.

4. **[[04_Catalogo_Forense_Escena_del_Crimen_Legacy_y_Patrones_de_Cura]]**:
   * Análisis forense de los datos corruptos encontrados en la base de datos de producción:
     - Strings con comillas en campos numéricos (`vessels.json`).
     - Diccionarios de Python con comillas simples en `legs_data` (`routes_quotes.json`).
     - Colapsos por llamadas `.get()` sobre cadenas no deserializadas.
     - Invariante de duración cero cuando la frecuencia mensual es nula.
   * Patrones de codificación defensiva y reglas para no volver a romper las tablas maestras.

5. **[[05_Acta_Oficial_Corrida_Serial_E2E_Swarm]]**:
   * Acta oficial pericial de la **corrida serial completa** de ambos grupos de agentes desde cero.
   * Registro literal de la terminal, tiempos de cómputo por agente y telemetría de 2,021 operaciones en 0.533 segundos.
   * Dictamen pericial y certificación de Semáforo Verde 100%.

---

## ⏱️ 3. Ficha Técnica Consolidada

| Métrica | Valor Empírico Medido en Terminal |
|---|---|
| **Ambiente de Ejecución** | Git Worktree Local (`feature/qc-swarm-local`) |
| **Dependencia de Red / Nube** | **0% (100% In-Memory Offline)** |
| **Tiempo Fase 1 (Maestros)** | **0.232 segundos** (1,779 registros + 4 fallos auto-curados) |
| **Tiempo Fase 2 (Simulaciones)** | **0.102 segundos** (242 celdas de negocio auditadas) |
| **Tiempo Total Pipeline E2E** | **0.334 segundos** |
| **Invariantes Comerciales Verificados** | **177 comprobaciones matemáticas** |
| **Violaciones Detectadas** | **0 violaciones (Cero tolerancia)** |
| **Semáforo Oficial** | 🟢 **APPROVED (VERDE 100%)** |
