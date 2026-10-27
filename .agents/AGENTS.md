# Reglas de Despliegue para el Proyecto PETRAL

<RULE[deployment_vps]>
- **PROHIBICIÓN TOTAL RAILWAY**: NUNCA utilizar comandos de Railway (`git push railway main`). Este proyecto se despliega ÚNICAMENTE al VPS Oficial de Producción Contabo (`169.58.168.107`).
- **DISTINCIÓN LOCAL VS VPS**: Cuando el usuario pida "lanzar en local", NUNCA desplegar al VPS. Solo desplegar al VPS cuando el usuario lo ordene explícitamente ("pushea al VPS", "despliega al VPS", "sube a producción").
- **PROTOCOLO DE DESPLIEGUE DIRECTO A PRODUCCIÓN (VPS CONTABO)**:
  Ejecutar INMEDIATAMENTE esta secuencia exacta de 3 pasos sin perder tiempo investigando:
  1. **Merge a Main y Git Push**:
     `git checkout main; git merge <branch_actual>; git push origin main`
  2. **Compilar Frontend Bundle**:
     `cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend`
     `npx vite build`
  3. **Deploy Automatizado SFTP/SSH a Contabo**:
     `cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS`
     `python deploy_petral_one_contabo.py`
  - URL Oficial de Producción en Vivo: `https://petral.one.geeksoft.tech`
</RULE[deployment_vps]>

<RULE[markdown_pdf_conversion]>
- **NO** convertir archivos Markdown (.md) a PDF automáticamente. Solo generar o convertir a PDF cuando el usuario lo solicite de manera explícita y directa.
</RULE[markdown_pdf_conversion]>

<RULE[png_local_storage]>
- **SIEMPRE** copiar y respaldar de inmediato cada captura de pantalla PNG enviada por el usuario en las rutas locales:
  1. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\`
  2. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA\`
</RULE[png_local_storage]>

<RULE[bunker_mdo_mgo_homologation]>
- En todo el software PETRAL, las siglas **MGO** (Marine Gas Oil / Diesel Marino) que figuran en facturas o cotizaciones equivalen y se registran unificadamente bajo el estándar **MDO**.
</RULE[bunker_mdo_mgo_homologation]>

<RULE[macro_plan_adherence]>
- **Alineación con Plan Macro**: Cuando exista un Plan Macro General (documentado en Obsidian o especificaciones), el agente debe razonar en cada paso para NO perder de vista el objetivo global del plan macro. Todo cambio puntual debe alinearse y contribuir directamente a la visión estratégica general del proyecto.
</RULE[macro_plan_adherence]>

<RULE[benoit_blanc_audit_protocol]>
- **Protocolo Benoit Blanc de Auditoría (Método BEN / LEG / DIFF / NOTA)**:
  - **BEN (Personificación)**: Personificar a Benoit Blanc (auditor pericial implacable y analítico).
  - **LEG (Legacy)**: Capturar y grabar con exactitud el estado legacy previo / escena del crimen (cómo está el código y qué valores arroja hoy).
  - **DIFF (Diferencias)**: Hallar y contrastar las diferencias exactas entre el legacy y el nuevo archivo / requerimiento comercial real.
  - **NOTA (Tomar Nota)**: Documentar al máximo detalle en una **tabla pericial nueva e independiente** (ej. 5.1 Vuelta 1, 5.2 Vuelta 2, etc.) en Obsidian: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\07_Especificaciones_Comerciales_Grilla_y_Puertos.md`, registrando el resultado final (éxito, error o ajuste) tras recibir el feedback del usuario.
</RULE[benoit_blanc_audit_protocol]>

<RULE[flowchart_pdf_only]>
- **Generación de Flujogramas y Diagramas de Arquitectura (Graphviz / DOT)**:
  - **NUNCA** generar archivos de imagen PNG como output de flujogramas o diagramas de arquitectura.
  - Generar **ÚNICAMENTE** la salida en formato **PDF** (junto con el archivo fuente `.dot` / `.py`).
</RULE[flowchart_pdf_only]>

<RULE[ask_first_token_efficiency]>
- **PREGUNTAR ANTES DE INVESTIGAR (EFICIENCIA TOTAL DE TOKENS & NO REINVENTAR LA RUEDA)**:
  - **PROHIBIDO QUEMAR TOKENS**: Ante cualquier lógica de negocio, campo ambiguo o requerimiento comercial, el agente **DEBE PREGUNTAR DIRECTAMENTE AL USUARIO PRIMERO**.
  - **EL HUMANO CONOCE EL NEGOCIO**: NUNCA asumir, deducir a ciegas ni hacer investigaciones profundas en bucle en segundo plano cuando una pregunta simple de una línea al usuario aclara el requerimiento en 5 segundos.
</RULE[ask_first_token_efficiency]>

<RULE[no_browser_subagent]>
- **PROHIBICIÓN TOTAL DE ABRIR EL NAVEGADOR / BROWSER SUBAGENT**: NUNCA utilizar la herramienta `browser_subagent` ni abrir ventanas de navegador en la máquina del usuario bajo ninguna circunstancia. Toda verificación debe realizarse mediante terminal, scripts headless, inspección de código o consultando al usuario.
</RULE[no_browser_subagent]>

<RULE[software_factory_harness]>
- **MANDATO OPERATIVO DE LA SOFTWARE FACTORY Y HARNESS DE ANTIGRAVITY (AGY)**:
  1. **Paso 1: Spec & Layout (STACK MASTER + PM Agent)**: Parafrasear el requerimiento y aclarar asunciones antes de tocar código. Prohibición estricta de monolitos HTML (`React 19 + TypeScript + Vite + Tailwind CSS` modular en `src/components/`, `src/data/`, `src/lib/`).
  2. **Paso 2: Surgical & Stdlib Audit (K0 Karpathy #146 + P0 Ponytail #107)**: Declara asunciones, riesgos y archivos exactos a modificar antes de codificar. *Stdlib-First Policy* con reducción de bloat ≥50%. Separación estricta de `.md` (leyes) y `.json` (estados de instancia/configuración).
  3. **Paso 3: Modular Coding (Engineering Squad + C0 Carbon #147)**: Utilizar design tokens de IBM Carbon, DataTables de alto rendimiento y accesibilidad WCAG AAA. Cirugía de código (*Surgical Changes*): preservar docstrings, comentarios y código funcional adyacente.
  4. **Paso 4 & 5: Adversarial Audit & Empirical Verification Gate (QC Auditor #126)**: NUNCA declarar finalización sin prueba empírica en terminal (`npm run build`, `tsc -b`, `pytest`, `git diff`). Si hay errores en terminal, corregir de inmediato hasta build 100% limpio.
</RULE[software_factory_harness]>

<RULE[qc_swarm_protocol]>
- **MANDATO OPERATIVO DEL SISTEMA DE QC (QC SWARM & SELF-HEALING)**:
  - **Identidad:** `QC.SWARM.SELF.HEALING.AGENTS` es un **SISTEMA DE CONTROL DE CALIDAD (QC)**. No es una carpeta pasiva. Opera mediante un Gemelo Digital Local en RAM con tablas vacías, auto-remediación en caliente y auditoría pericial.
  - **Activación:** Cada vez que el usuario reporte un fallo, discrepancia o pida probar/auditar con el enjambre de agentes, el agente DEBE seguir de forma obligatoria este ciclo de 5 fases:
    1. **Detección Humana & Parafraseo:** Escuchar al usuario, parafrasear y NUNCA parchar a ciegas en producción.
    2. **Creación del Agente Tester:** Crear o especializar un agente en `swarm_engine/agents/` que encarne la acción exacta y fije la invariante comercial.
    3. **Clonación de BD a Local:** Ejecutar `python sync_prod_masters_to_local.py` para trabajar sobre datos comerciales 100% reales.
    4. **Reconstrucción en Cero (Self-Healing Loop):** Ejecutar `python run_pipeline_e2e_swarm.py` (vaciado a cero de 17 tablas, re-ingesta con inyección de errores, curación en caliente y auditoría Benoit Blanc ABIDE).
    5. **Cirugía Quirúrgica & Despliegue:** Aplicar la cirugía en local, obtener Semáforo Verde 100% (APPROVED), compilar bundle (`npx vite build`), crear tag Git (`git tag PRE.CIRUGIA...`) y desplegar a VPS Contabo ÚNICAMENTE bajo orden directa y explícita del usuario.
  - **Skill de Referencia:** Ver `.agents/skills/qc-swarm/SKILL.md` y la bóveda documental en `QC.SWARM.SELF.HEALING.AGENTS/QC.SWARM.SELF.HEALING.AGENTS/Bienvenido.md`.
</RULE[qc_swarm_protocol]>
