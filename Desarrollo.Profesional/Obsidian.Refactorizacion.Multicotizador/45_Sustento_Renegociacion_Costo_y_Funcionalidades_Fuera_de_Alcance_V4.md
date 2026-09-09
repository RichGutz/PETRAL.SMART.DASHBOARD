# Sustento Pericial de Renegociación de Costos & Módulos Fuera de Alcance (Scope Creep)

**Documento de Control y Registro:** `45_Sustento_Renegociacion_Costo_y_Funcionalidades_Fuera_de_Alcance_V4.md`  
**Fecha de Apertura:** 09 de Septiembre, 2026  
**Auditor a Cargo:** Detective Benoit Blanc  
**Objetivo:** Registrar formalmente todas las funcionalidades, motores de cálculo, subsistemas de reporte, seguridad y arquitectura que están actualmente implementados en el software PETRAL SMART DASHBOARD y que **nunca formaron parte del alcance contractual inicial**, sirviendo de sustento técnico para la actualización de la PPT / informe de renegociación económica (`presentation_V4.html` / `Informe_Sustento_Modificacion_Alcance_Petral_V4.html`).

---

## 📋 1. Resumen Ejecutivo del Desbalance Contractual

| Dimensión | Alcance Original Contratado | Alcance Realmente Construido | Estado en el Software |
|---|---|---|:---:|
| **Visión de Producto** | Dashboard básico de cotizaciones spot y visualización de rutas | Suite ERP Marítimo / Financiero con Matrices Multi-Escenario, Auditoría Forense y Motores de Simulación | 🚀 En Producción |
| **Volumen de Módulos** | ~3 módulos base | > 14 módulos avanzados interconectados | 🚀 En Producción |
| **Módulos Fuera de Alcance** | 0 | En proceso de catalogación detallada | 🚀 En Producción |

---

## 📦 2. Catálogo de Funcionalidades y Módulos Fuera de Alcance

### 🔹 Ítem 1: Análisis Estadístico de Demoras en el Maestro de Demurrage
- **Nombre de la Funcionalidad:** Módulo y Motor de Análisis Estadístico de Demoras Históricas y Proyectadas (Maestro de Demurrage / Demurrage Analytics).
- **Descripción Técnica y Operativa:** Subsistema analítico que procesa la dispersión, promedios, percentiles y frecuencias estadísticas de estadías por puerto, cliente, terminal y buque, calculando métricas de impacto de fondeo/espera en muelle y su repercusión matemática en costos de combustible idle, días de ocupación y dilución de TCE.
- **Por qué NO era parte del alcance original:** El requerimiento original contemplaba únicamente un campo plano o entrada estática de tarifa de demora por día en la cotización básica, sin procesamiento estadístico avanzado, cruce multi-puerto ni distribuciones probabilísticas.
- **Valor Comercial & Impacto en el Negocio de Petral:** Permite a la gerencia comercial y de operaciones anticipar riesgos de congestión portuaria con base matemática, justificar penalidades y cotizar tarifas de demurrage ajustadas al comportamiento real histórico de cada terminal.
- **Evidencia en Código / Módulos Afectados:**
  - `Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Masters/DemurrageMaster_V2.tsx`
  - `Desarrollo.Profesional/Geeksoft_Engine/backend/services/demurrage_service.py`
### 🔹 Ítem 2: Módulo de Análisis de Liquidaciones de Viaje (Voyage Liquidations & P&L Real vs Estimado)
- **Nombre de la Funcionalidad:** Módulo de Liquidaciones de Viaje Post-Operativas (Maestro de Liquidaciones / Voyage Actuals vs Budget).
- **Descripción Técnica y Operativa:** Subsistema de conciliación contable y financiera que compara el viaje presupuestado contra la liquidación real post-zarpe (gastos de búnker consumidos, facturas de agenciamiento portuario reales, demoras cobradas vs pagadas y cálculo de varianza de P&L).
- **El Problema de Alcance & Retrabajo Crítico:**
  - Se subió y reestructuró **al menos 3 veces consecutivas** debido a que los datos, planillas y formatos enviados por el cliente carecían de estructura estándar, contenían criterios contables cambiantes y reglas de negocio contradictorias.
  - Generó un sobrecosto severo en horas de ingeniería forense para intentar normalizar planillas heterogéneas que nunca formaron parte de la especificación inicial.
- **Por qué NO era parte del alcance original:** El proyecto original era estrictamente una herramienta de **estimación/cotización pre-viaje** (*Pre-Voyage Estimation & Commercial Forecast*), NO un sistema de **liquidación contable post-mortem** (*Post-Voyage Actuals Reconciliation ERP*).
- **Evidencia en Código / Módulos Afectados:**
  - `Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Masters/LiquidationsMaster_V2.tsx`
  - `Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/liquidations.py`
### 🔹 Ítem 3: Módulo de Documentación Corporativa, Organigrama Interactivo y Manual MOF
- **Nombre de la Funcionalidad:** Módulo de Gestión Documental Institucional, Organigrama Estructural Interactivo y Manual de Organización y Funciones (MOF).
- **Descripción Técnica y Operativa:** Subsistema integrado en la plataforma que digitaliza, modela y renderiza la estructura jerárquica de la empresa (organigrama por áreas, puestos y dependencias) junto con la documentación operativa, perfiles de puesto y responsabilidades del Manual MOF.
- **Por qué NO era parte del alcance original:** El contrato contemplaba exclusivamente desarrollo de software analítico marítimo (cálculo de fletes, búnker y puertos). La consultoría de procesos organizacionales, diagramación de organigramas corporativos y digitalización de manuales de recursos humanos/MOF constituye un entregable administrativo y de gestión corporativa totalmente ajeno al scope tecnológico contratado.
- **Valor Comercial & Impacto en el Negocio de Petral:** Centraliza la gobernanza corporativa, inductivo y normativo del personal de Petral dentro de una suite unificada sin haber pagado consultoría externa de RRHH/Procesos.
### 🔹 Ítem 4: Bóveda de Dispositivos Confiables (Device Vault) & Libro de Auditoría Forense Transaccional
- **Nombre de la Funcionalidad:** Arquitectura de Ciberseguridad de Grado Bancario: Device Vault (Device Fingerprinting & Binding) y Audit Ledger (Libro Mayor de Auditoría Forense Transaccional).
- **Descripción Técnica y Operativa:**
  1. **Device Vault:** Sistema de validación de hardware y huella digital criptográfica de dispositivos confiables que restringe el acceso de usuarios a terminales expresamente autorizadas, blindando la plataforma contra robo de credenciales y accesos concurrentes no permitidos.
  2. **Libro de Auditoría Forense (Audit Ledger):** Mecanismo de trazabilidad inmutable que registra cada creación, alteración, sobreescritura de tarifa o recálculo en la Matriz y cotizaciones, protegiendo la integridad absoluta de la data dinámica y evitando manipulaciones silenciosas.
- **Por qué NO era parte del alcance original:** El contrato inicial estipulaba un inicio de sesión convencional con usuario y contraseña plano (`login básico`). La ingeniería de Device Fingerprinting, vinculación criptográfica de dispositivos y registro transaccional forense inmutable es una capa de ciberseguridad avanzada propia de software bancario o de misión crítica.
- **Valor Comercial & Impacto en el Negocio de Petral:** Garantiza cumplimiento de compliance, evita filtraciones de información comercial confidencial de fletes y otorga auditoría pericial ante cualquier controversia interna sobre quién modificó un número.
- **Evidencia en Código / Módulos Afectados:**
  - `Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Admin/`
  - `Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth.py`
  - Tablas de auditoría y vinculación de dispositivos en Supabase.
### 🔹 Ítem 5: Suite de Reportería Premium (13 Exportadores en PDF y ExcelJS) Formateados con Identidad Cromática del Cliente y Listos para Impresión Directa
- **Nombre de la Funcionalidad:** Motor de Generación y Maquetación de Reportes Ejecutivos Vectoriales en PDF y Libros Financieros en ExcelJS con Estilo Corporativo e Ink-Save.
- **Descripción Técnica y Operativa:**
  - **13 Tipos de Reportes Desarrollados:**
    1. *Ficha Técnica Multicotizador Spot (PDF).*
    2. *Matriz Financiera PETRAL 12 Meses (PDF).*
    3. *Matriz Financiera NAVITRANSO (PDF).*
    4. *Informe Consolidado Individual MEC (PDF).*
    5. *Informe Consolidado Multi-Escenario MEC (PDF).*
    6. *Auditoría de Liquidaciones de Viaje (PDF).*
    7. *Proformas Oficiales de Costos Portuarios por Terminal (PDF).*
    8. *Flujogramas Vectoriales de Arquitectura (PDF Graphviz/DOT).*
    9. *Matriz Financiera PETRAL (.xlsx con ExcelJS).*
    10. *Matriz Financiera NAVITRANSO (.xlsx con ExcelJS).*
    11. *Informe Consolidado Individual (.xlsx con ExcelJS).*
    12. *Informe Consolidado Multi-Escenario (.xlsx con ExcelJS).*
    13. *Exportador Estructurado de Catálogos y Maestros (.xlsx).*
  - **Identidad Cromática del Cliente (Matriz de Colores Cliente • Flota • Ruta):**
    - Todos los reportes aplican la paleta corporativa homologada:
      - **Clientes:** SPCC (`#0369A1` / Pastel `#C0DAE8`), NEXA (`#0F4C81` / Pastel `#C3D2E0`).
      - **Rutas:** MATARANI (`#06B6D4` / `#C1EDF4`), MARCONA (`#A855F7` / `#E9D5FD`), MEJILLONES (`#D946EF` / `#F6D1FB`), CALLAO (`#475569` / `#D1D5DA`).
      - **Buques:** TABLONES (`#DC2626` / `#F6C9C9`), MOQUEGUA (`#16A34A` / `#C5E8D2`), CONCON (`#1E293B` / `#D1D5DA`), HUEMUL (`#4F46E5` / `#D3D1F9`), BOW CONDOR (`#0284C7`).
  - **Ingeniería *Ink-Save* (Ahorro del 75% de Tinta/Tóner):** Celdas coloreadas atenuadas al 25% de opacidad sobre fondo blanco con texto oscuro de alto contraste.
  - **Diseño *Print-Ready* (Listos para Impresión):** Encaje milimétrico al 100% de páginas A4 Landscape y Portrait, tipografía tabular `tnum` limpia (sin puntos centrales en ceros `0`), sin símbolos de texto `$ ` desalineados, cabeceras `C`/`R`/`B` vectoriales y Ribbon azul dinámico continuo.
- **Por qué NO era parte del alcance original:** El contrato contemplaba una visualización estándar en pantalla con una exportación plana sin diseño. La ingeniería de 13 maquetadores visuales avanzados con lógica de ahorro de tinta, vectores SVG, sanitización OpenXML y diseño a la medida representa un desarrollo de diseño editorial y reportería ejecutiva de nivel corporativo.
- **Evidencia en Código / Módulos Afectados:**
  - `src/services/exportFinancialMatrixPdf.ts`
  - `src/services/exportFinancialMatrixNavitransoPdf.ts`
  - `src/services/exportFinancialMatrixExcel.ts`
  - `src/services/exportFinancialMatrixNavitransoExcel.ts`
  - `src/services/exportMecConsolidatedExcel.ts`
  - `src/services/providers/multicotizadorPdfPrintService.ts`

### 🔹 Ítem 6: Eficiencia Operativa Extrema y Ahorro Masivo de Horas para el Project Manager de Petral (Iosef Zavala)
- **Concepto:** Modelo de Desarrollo Ágil Proactivo y Reducción Drástica de Carga de Gestión para la Contraparte.
- **Descripción Operativa & Sustento:**
  - El 100% de los requerimientos, iteraciones de negocio, cambios de reglas y validaciones se resolvieron de forma directa, ágil y autónoma mediante llamadas cortas y coordinación por WhatsApp.
  - **Ahorro de Carga Gerencial para Petral:** Liberó por completo a Iosef Zavala de la pesada elaboración de pliegos técnicos formales (TDRs), diagramación de wireframes/mockups, redacción de minutas o comités técnicos diarios desgastantes.
  - **Inversión Mínima de la Contraparte:** Se estima que la concepción, refinamiento y puesta en marcha de toda la suite (más de 14 módulos ERP, matrices financieras, multicotizador y reportería) demandó **únicamente ~50 horas-hombre de Iosef Zavala**, lo que representa una eficiencia excepcional y un costo de gestión prácticamente nulo para Naviera Petral frente a proyectos de software corporativo tradicionales.
- **Impacto para la Renegociación:** Demuestra que el equipo de desarrollo absorbió no solo la codificación, sino la consultoría de negocio, diseño de arquitectura y especificación funcional completa.

### 🔹 Ítem 7: Rutas Complejas Multi-Drop y Aprovisionamiento Bunkering vs. Alcance Original de Rutas Redondas Base Ilo (Ajuste Específico Slide 2)
- **Concepto / Diferencial de Alcance:**
  - **Alcance Original Contratado:** Se asumió que el 100% de la operación se basaba en **rutas redondas simples con origen y retorno a base Ilo** ($\text{ILO} \rightarrow \text{Puerto X} \rightarrow \text{ILO}$), con un solo puerto de carga y un solo puerto de descarga lineal.
  - **Realidad Construida Fuera de Alcance:**
    1. **Rutas Multi-Drop ($\text{POL} \rightarrow \text{POD 1} \rightarrow \text{POD 2}$):** Cotizaciones complejas con un puerto de carga y múltiples puertos de descarga sucesivos con tonelajes y tarifas distintas (ej. Carga Callao 13,500 MT, Descarga 1 en Marcona 10,500 MT y Descarga 2 en Matarani 3,000 MT).
    2. **Paradas Técnicas de Suministro Bunkering (`CALLAO (B)`):** Rutas de reaprovisionamiento de combustible sin carga comercial (0 MT) que requerían evitar colisiones de tarifas con contratos comerciales estándar.
    3. **Rutas Triangulares y Multi-Cliente:** Rotaciones internacionales y cabotajes cruzados (NEXA / SPCC) conviviendo en la misma flota.
- **Impacto para la Renegociación:** Exigió el rediseño completo del motor de resolución de itinerarios (`forecast_service.py` y `spot_engine.py`), creación de llaves unívocas canónicas y algoritmos de yield flete ponderado que nunca estuvieron contemplados en la cotización inicial de rutas circulares simples.

---

## 📊 3. Bitácora de Registro y Control de Cambios

| # | Módulo / Funcionalidad Fuera de Alcance | Fecha Registro | Impacto en Horas / Complejidad | Estado |
|:---:|---|:---:|:---:|:---:|
| **1** | **Análisis Estadístico de Demoras** (Maestro de Demurrage, distribución histórica y modelación de estadías) | 09/09/2026 | Alta Complejidad (Frontend Analytics + Backend Engine) | 📝 REGISTRADO |
| **2** | **Análisis de Liquidaciones de Viaje** (Post-Voyage Actuals vs Budget, 3 subidas/retrabajos por datos y criterios cambiantes) | 09/09/2026 | Severo Sobrecosto / Triple Retrabajo (Módulo ERP Post-Viaje no cotizado) | 📝 REGISTRADO |
| **3** | **Documentación Institucional, Organigrama y MOF** (Estructura corporativa, perfiles de puesto y manual de funciones) | 09/09/2026 | Media-Alta Complejidad (Consultoría Organizacional + UI) | 📝 REGISTRADO |
### 🔹 Ítem 8: Ausencia de Liquidaciones Correctas a la Fecha por Parte del Cliente (Ajuste Específico Slide 5)
- **Declaración Pericial Crítica:**
  - Debe dejarse taxativamente claro en el **Slide 5** que, a pesar de los 3 ciclos de desarrollo y reingeniería absorbidos por Geeksoft, **hasta la fecha Naviera Petral NO dispone de liquidaciones de viaje matemáticamente correctas, consistentes ni verificables** por parte de sus operadores comerciales y agencias marítimas.
  - **Causa Raíz:** Las planillas suministradas continúan mezclando gastos no operacionales, omiten timings reales de atraque/desatraque, carecen de respaldo en facturas de agenciamiento y aplican fórmulas arbitrarias que difieren de viaje en viaje.
  - **Estado en la Plataforma:** El software ya tiene construida y desplegada la arquitectura receptora de liquidaciones, pero el módulo se encuentra bloqueado exclusivamente por la **inconsistencia de los datos fuente provistos por el cliente**.

### 🔹 Ítem 9: Desglose Explícito y Nombramiento de los 13 Reportes en Slide 8 (Aprovechamiento Espacial Vertical)
- **Ajuste de Diseño y Contenido en Slide 8:**
  - Se debe utilizar el amplio espacio vertical disponible en el Slide 8 para nombrar taxativamente cada uno de los **13 reportes desarrollados**, organizados en dos columnas visuales elegantes:
    - **Columna 1: 8 Reportes PDF Vectoriales Print-Ready:**
      1. *Ficha Técnica Multicotizador Spot (Pre-Viaje).*
      2. *Matriz Financiera PETRAL (12 Meses Landscape A4).*
      3. *Matriz Financiera NAVITRANSO (Control Presupuestal).*
      4. *Informe Consolidado Individual (Formato MEC).*
      5. *Informe Multi-Escenario Consolidado (MEC Multi-Escenario).*
      6. *Auditoría de Liquidaciones de Viaje (Post-Zarpe).*
      7. *Proformas Oficiales de Costos Portuarios por Terminal.*
      8. *Flujogramas Vectoriales de Arquitectura (Graphviz/DOT).*
    - **Columna 2: 5 Libros Excel (.xlsx con ExcelJS & OpenXML):**
      1. *Matriz Financiera PETRAL (.xlsx contable).*
      2. *Matriz Financiera NAVITRANSO (.xlsx contable).*
      3. *Informe Consolidado Individual (.xlsx ejecutivo).*
      4. *Informe Multi-Escenario Consolidado (Hojas sanitizadas).*
      5. *Catálogos y Maestros de Datos (Buques, Puertos y Rutas).*

### 🔹 Ítem 10: Slide Exclusivo de Alto Impacto — Matriz Financiera NAVITRANSO & Reportería Contable Dual (100% Fuera de Alcance)
- **Concepto / Justificación de Alto Impacto:**
  - El contrato inicial solo consideraba un presupuesto comercial simple. A requerimiento posterior se exigió la construcción de una **segunda matriz financiera completa e independiente: la Matriz NAVITRANSO**, diseñada bajo los estándares de control presupuestal de Navitranso / holding naviero.
- **Complejidad Técnica y Operativa Incorporada:**
  1. **Estructura Contable en 4 Bloques Reclasificados:**
     - *Bloque 1: Ingresos de Operación* (Ventas Flete, Demoras e Ingresos de Puerto).
     - *Bloque 2: Costos Directos de Viaje* (Combustible Búnker IFO/MDO, Gastos de Puerto, Costos de Demora y Comisiones).
     - *Bloque 3: Time Charter Equivalent (TCE)* (Ventas netas de costos directos).
     - *Bloque 4: Margen Bruto (P&L)* (TCE deducido el arriendo diario de nave).
  2. **Espejo Puro de Reporting:** Visualización en modo solo lectura para número de viajes, eliminando inputs de frecuencia y asegurando no duplicación matemática (`freq²`).
  3. **Generadores de Reportería Dual Dedicados:**
     - *PDF NAVITRANSO:* Columna de métrica ampliada a 132px, tipografía tabular 10pt y Ribbon continuo.
     - *ExcelJS NAVITRANSO:* Hoja de cálculo con 4 bloques contables, filas de 20pt y paleta *Ink-Save*.

### 🔹 Ítem 11: Benchmark Internacional de Industria (PMI / Software Engineering Heuristics) para Ratio PM vs. Desarrollo (Slide 9)
- **Marco Teórico y Fuentes de Industria (PMI / Heurísticas de Software):**
  - **Estándar Internacional de Esfuerzo de Gestión:** En proyectos de software a medida y plataformas ERP, la regla de oro reconocida por el *Project Management Institute (PMI)* y la industria de ingeniería de software sitúa el esfuerzo de **Project Management / Product Owner / Contraparte Técnica entre el 10% y el 20% del esfuerzo total de desarrollo** (Ratio **1 : 5** a **1 : 10**). En proyectos de alta complejidad o reingeniería de procesos, la dedicación de la contraparte suele elevarse al **20%–30%** (Ratio **1 : 3** a **1 : 5**).
- **Contraste Pericial con el Caso Naviera Petral:**
  - **Esfuerzo Total de Ingeniería Desarrollado:** **`510.68 horas-hombre`**.
  - **Dedicación Real de Iosef Zavala:** **`~50 horas-hombre`** ($\approx \mathbf{9.79\%}$ del esfuerzo total, Ratio $\mathbf{1 : 10.2}$).
  - **Diagnóstico:** La dedicación del Project Manager de Petral se situó en el **umbral óptimo más bajo y eficiente del estándar mundial (menos del 10%)**.
  - **Ahorro Cuantificable para Petral:** Si el proyecto se hubiese ejecutado bajo gobernanza tradicional (redacción de TDRs formales, diseño de mockups, comités de control de cambios y actas diarias), Iosef Zavala habría tenido que destinar entre **80 y 130 horas** de su tiempo gerencial. Geeksoft le ahorró a Petral entre **30 y 80 horas de alta dirección** absorbiendo la consultoría de negocio, especificación funcional y control pericial.

### 🔹 Ítem 12: Slide Final — Extracto Detallado Forense Día por Día (114 Jornadas de Trabajo)
- **Concepto / Estructura del Slide Final:**
  - Incorporación de una **tabla cronológica completa con scroll interactivo** que lista día por día las más de 70 jornadas de trabajo (114 días auditados):
    - Columna 1: # Jornada & Fecha (`YYYY-MM-DD`).
    - Columna 2: Eventos / Commits Git inmutables.
    - Columna 3: Horas trabajadas en la jornada.
    - Columna 4: Detalle mínimo y conciso de lo que se construyó o auditó ese día.
  - **Fila Totalizadora Destacada:** Cierre pericial con el gran total acumulado: **`510.68 Horas Totales` | `3,813 Eventos Inmutables` | `$30,640.89 USD Devengados`**.

---

## 📊 3. Bitácora de Registro y Control de Cambios

| # | Módulo / Funcionalidad Fuera de Alcance | Fecha Registro | Impacto en Horas / Complejidad | Estado |
|:---:|---|:---:|:---:|:---:|
| **1** | **Análisis Estadístico de Demoras** (Maestro de Demurrage, distribución histórica y modelación de estadías) | 09/09/2026 | Alta Complejidad (Frontend Analytics + Backend Engine) | 📝 REGISTRADO |
| **2** | **Análisis de Liquidaciones de Viaje** (Post-Voyage Actuals vs Budget, 3 subidas/retrabajos por datos y criterios cambiantes) | 09/09/2026 | Severo Sobrecosto / Triple Retrabajo (Módulo ERP Post-Viaje no cotizado) | 📝 REGISTRADO |
| **3** | **Documentación Institucional, Organigrama y MOF** (Estructura corporativa, perfiles de puesto y manual de funciones) | 09/09/2026 | Media-Alta Complejidad (Consultoría Organizacional + UI) | 📝 REGISTRADO |
| **4** | **Device Vault & Libro de Auditoría Forense** (Huella digital criptográfica de hardware y trazabilidad inmutable de data) | 09/09/2026 | Muy Alta Complejidad (Ciberseguridad Grado Bancario) | 📝 REGISTRADO |
| **5** | **Suite de 13 Reportes PDF/ExcelJS Ink-Save Print-Ready** (Matriz de colores Cliente/Flota/Ruta, maquetación A4 y ExcelJS con OpenXML) | 09/09/2026 | Muy Alta Complejidad (Ingeniería de Reportería y Diseño Editorial) | 📝 REGISTRADO |
| **6** | **Ahorro Masivo de Gestión para PM Petral (Iosef Zavala)** (Desarrollo ágil proactivo vía llamadas/WhatsApp, solo ~50 HH invertidas por la contraparte) | 09/09/2026 | Alto Valor Agregado / Absorción Total de Consultoría y Especificación | 📝 REGISTRADO |
| **7** | **Rutas Complejas Multi-Drop y Bunkering vs Rutas Redondas Ilo** (Ajuste Slide 2: POL ➔ POD1 ➔ POD2 y Callao B vs rutas circulares simples base Ilo) | 09/09/2026 | Muy Alta Complejidad (Rediseño de Motor de Itinerarios y Yield Ponderado) | 📝 REGISTRADO |
| **8** | **Ausencia de Liquidaciones Correctas a la Fecha** (Ajuste Slide 5: Inconsistencia y descalces persistentes en datos fuente del cliente) | 09/09/2026 | Dictamen Forense Crítico / Bloqueo por Datos Fuente de Naviera | 📝 REGISTRADO |
| **9** | **Desglose Explícito de los 13 Reportes en Slide 8** (Ajuste Slide 8: Nombramiento taxativo de 8 PDF y 5 ExcelJS aprovechando espacio vertical) | 09/09/2026 | Diseño Editorial Ejecutivo / Trazabilidad Total de Reportes | 📝 REGISTRADO |
| **10** | **Slide Exclusivo: Matriz Financiera NAVITRANSO** (Nuevo Slide: Segundo modelo presupuestal en 4 bloques contables y reportería dual PDF/ExcelJS) | 09/09/2026 | Muy Alta Complejidad (Segundo Motor Financiero y Suite Contable) | 📝 REGISTRADO |
| **11** | **Benchmark PMI de Ratio PM vs. Desarrollo (Slide 9)** (Validación científica: 9.8% vs 10%-20% estándar internacional, ratio 1:10) | 09/09/2026 | Sustento Metodológico / Evidencia de Máxima Eficiencia para Petral | 📝 REGISTRADO |
| **12** | **Slide Final: Extracto Día por Día (114 Jornadas)** (Auditoría cronológica completa de horas y tareas con total acumulado destacado) | 09/09/2026 | Trazabilidad Absoluta / Trazabilidad Pericial Inmutable | 📝 REGISTRADO |

---

## 📍 4. Entregables Generados & Scripts del Motor V4

| Archivo / Entregable | Ubicación | Descripción |
|---|---|---|
| 📜 **Script Generador V4** | [generar_sustento_slide_by_slide_v4.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/scratch/generar_sustento_slide_by_slide_v4.py) | Motor de cálculo forense de horas (Git + IDE + Logs) y maquetación de 10 diapositivas. |
| 🌐 **Presentación Interactiva V4 (Raíz)** | [presentation.html](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/presentation.html) | Deck interactivo de 10 diapositivas listo para navegar con teclado (`←`/`→`/Espacio). |
| 🌐 **Copia en Obsidian V4** | [Informe_Sustento_Modificacion_Alcance_Petral_V4.html](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/Informe_Sustento_Modificacion_Alcance_Petral_V4.html) | Respaldo formal en la base de conocimiento de Obsidian. |
| 🌐 **Copia en Frontend Public V4** | [presentation_V4.html](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/public/presentation_V4.html) | Disponible como activo público en el frontend web. |

---
