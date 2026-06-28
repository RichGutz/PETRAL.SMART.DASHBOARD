# 📑 Acta de Constitución del Proyecto (Project Charter) — Sistema Geeksoft

---

## 🎯 1. Propósito y Objetivos de Negocio
El propósito de este proyecto es transformar y modernizar el proceso de inteligencia comercial de **Naviera Petral**, migrando la gestión de estimaciones desde herramientas tradicionales basadas íntegramente en hojas de cálculo (Legacy Excel) hacia un ecosistema web centralizado, seguro y escalable desarrollado por **Geeksoft**.

### Objetivos Principales:
* **Planificación Comercial:** Implementar una herramienta de Forecast multipaso indexada temporalmente para proyectar ventas y Gross Margin a lo largo de un horizonte dinámico. Incluye la proyección de demurrage y el cálculo del flete promedio (incluyendo demurrage).
* **Automatización del Pricing SPOT:** Desplegar una herramienta de cotización (Proformador SPOT) que capture las tarifas contractuales y calcule el Gross Margin de forma inmediata para maximizar la rentabilidad.
* **Control de Gestión (Medir y Mejorar):** Comparar las proyecciones comerciales con la ejecución operativa real a lo largo del tiempo, midiendo la precisión mediante KPIs y proponiendo estrategias para elevar las ventas y la rentabilidad.

---

## 📐 2. Alcance Definitivo del Proyecto

### ✅ DENTRO del Alcance (Entregables Financiados):
* **Módulo de Diseño:** Definición de la interfaz de usuario (UI) y la lógica relacional matemática para los módulos de Cotización SPOT y Forecast Comercial.
* **Módulo de Desarrollo:** Programación de APIs y algoritmos de cálculo avanzados conectando el stack tecnológico: **Supabase** (Base de Datos PostgreSQL) + **React / Vite** (Frontend) + **Tailwind CSS** + **Apache ECharts** (3 reportes gráficos ejecutivos).
* **Módulo ETL (Carga de Datos):** Extracción, transformación y carga exclusiva de la data operativa y comercial correspondiente a los meses transcurridos del **año 2026**.
* **Módulo Onboarding:** Capacitación directa y entrenamiento en la plataforma web para los cuatro (4) usuarios clave de la naviera.
* **Módulo In Situ (Go-Live):** Acompañamiento presencial en oficinas ejecutando la estrategia de **"Convivencia de Dos Mundos"**, conciliando los resultados del software vs. el Excel tradicional hasta la eliminación del 100% de inconsistencies o bugs.
* **Propiedad Intelectual:** Entrega del 100% del código fuente a PETRAL mediante repositorio en GitHub desde el inicio del desarrollo.

### ❌ FUERA del Alcance (Requerirán Adendum Adicional):
* Carga histórica de datos operativos de años anteriores (2025 hacia atrás).
* Módulos terrestres (camiones, distribución de última milla).
* Facturación electrónica real, contabilidad general o gestión de planillas de tripulación.
* Nuevos desarrollos o pantallas no contemplados en los 3 reportes gráficos iniciales.

---

## 👥 3. Gobernanza del Proyecto y Usuarios Clave

Para las coordinaciones operativas, revisiones de negocio y entrenamientos interactivos, se identifican las siguientes contrapartes oficiales de Naviera Petral:

* **Aprobador Principal (Sponsor):** Fernando Harten
* **Project Manager:** Iosef Zavala
* **Usuarios Clave de la Plataforma (Comercial / Operaciones):**
  * Jorge Neyra
  * Maria Elena Castro
  * Sandra Galvez

---

## ⏳ 4. Matriz de Distribución de Esfuerzo e Hitos (Milestones)

El proyecto se ejecutará bajo un esquema modular y secuencial, distribuyéndose el esfuerzo técnico de la siguiente manera:

| Fase / Hito | Descripción del Entregable | Acción Requerida (Petral) | Responsables | Estado Inicial |
| :--- | :--- | :--- | :--- | :--- |
| **H1: Diseño** | Interfaces y lógica de Forecast y Proformador SPOT | Verificar el método de cálculo a profundidad y brindar datos maestros faltantes. | Todos los usuarios clave | 🌗 En Ejecución |
| **H2: Desarrollo**| Programación de APIs en FastAPI, Supabase y Frontend React | Usar lo desarrollado y dar feedback continuo. | Fernando, Iosef | 🌗 En Ejecución |
| **H3: ETL** | Migración de data transcurrida del año 2026 | Alcanzar liquidaciones de viajes 2026 indicando Voyage Number. | Maria Elena, Jorge | 🔲 Pendiente |
| **H4: Onboarding**| Capacitación presencial a los 4 usuarios clave | Asistir a sesiones presenciales. | Todos los usuarios clave | 🔲 Pendiente |
| **H5: In Situ** | Go-Live y conciliación de "Dos Mundos" en vivo | Validación final en paralelo. | Todos los usuarios clave | 🔲 Pendiente |
| **TOTAL** | **Esfuerzo Consolidado de Implantación** | **150 hrs** | | |

### ⛽ 5. Condiciones del Servicio Continuo (Mantenimiento y Alojamiento)
* **Gatillo de Activación:** Vigente de forma mensual posterior al cierre exitoso del Hito 5 (In Situ).
* **Cobertura:** Operatividad continua de la plataforma, administración y monitoreo del servidor dedicado en la nube (Contabo), soporte de la base de datos centralizada (Supabase), respaldos periódicos de seguridad, soporte correctivo menor y emisión de reportes de auditoría de uso por usuario para asegurar la adopción definitiva del sistema. No incluye nuevas pantallas ni desarrollos fuera del alcance original.

---

## 🔒 6. Injunción de Control para el Consultor
> "Este documento constituye el marco técnico y de alcance inamovible frente al personal del cliente. Cualquier solicitud que exceda las 150 horas especificadas o altere las fases operativas descritas será derivada a una orden de cambio a ser aprobada de forma exclusiva por el Sponsor del proyecto."