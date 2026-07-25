# Pedidos Finales - Proyecto SMART DASHBOARD

**Basado en la Presentación Kick-off 2026 (El Motor de Petral)**

## 1. Ruta Crítica hacia el Hito 3 (ETL)

Para poder migrar la data histórica exitosamente (Hito 3), debemos seguir este orden estricto de tareas:

### Paso 1: Matriz de Roles y Permisos
*   [ ] **Acción:** Definir lista de usuarios y cruzarla con los Maestros/Módulos del sistema, estableciendo el nivel de acceso de cada usuario: **Editor**, **Visor** o **Nulo** (sin acceso).
*   **Responsable:** Iosef Zavala.

### Paso 2: Completar Maestros de Datos (Data Faltante)
*   [ ] **Acción:** Una vez definidos los roles, los encargados designados deben ingresar al sistema y completar la data técnica y operativa faltante.
*   **Crítico (Tabla `vessels`):** Faltan parámetros operativos obligatorios para el buque **HUEMUL**:
    *   Velocidad (nudos)
    *   Consumo IFO (Sea/Port)
    *   Consumo MDO (Load/Disch)
    *   Capacidad de Bombas (T/h)
    *   TCE Requerido (Umbral de rentabilidad)

### Paso 3: Ejecución del Hito 3 - ETL (Migración de data 2026)
*   [ ] **Acción:** Alcanzar el Excel oficial de viajes históricos, asegurando que incluya la columna de **Voyage No.** Con este Excel y los maestros del Paso 2 llenos, el sistema podrá calcular e importar el historial.
*   **Responsables:** Maria Elena, Jorge.

### Paso 4: Definir Reportes Descargables
*   [ ] **Acción:** Definir el formato y la información exacta a exportar. Tanto el **Multicotizador** como la **Matriz Financiera** deben permitir arrojar un resultado imprimible o descargable en formato Excel.
*   **Responsable:** Iosef Zavala.

---

## 2. Hitos Posteriores (Cierre del Proyecto)

*   [ ] **Hito 4 - Onboarding (Capacitación):**
    *   **Acción:** Asistir a sesiones presenciales de capacitación sobre la nueva plataforma.
    *   **Responsables:** Usuarios Clave (Jorge Neyra, Maria Elena Castro, Sandra Galvez).
*   [ ] **Hito 5 - In Situ (Go-Live):**
    *   **Acción:** Validación final en paralelo y conciliación (Excel vs. Motor en la nube).
    *   **Responsables:** Todos los usuarios clave.

---

## 3. Próximos Pasos Técnicos (Equipo Geeksoft)

*   **BAF (Bunker Adjustment Factor):** Asegurar que la arquitectura de ajuste futuro esté lista para activarse cuando los precios de mercado superen el umbral pactado en contrato.
*   **Monitoreo del Voyage Result:** Validar la precisión de la fórmula en el backend `forecast_service.py` frente a la lógica manual actual: `VR = (Q × F) − (ag_carga + ag_descarga) − Σ(t_fase × c_fase × p_bunker)`.

---
*Documento generado automáticamente a partir de la revisión del estado actual de la plataforma Forecast.*
