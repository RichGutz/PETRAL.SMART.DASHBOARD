# PROPUESTA COMERCIAL: PETRAL SMART DASHBOARD & ERP

**Contexto:** Propuesta a presentar en la reunión del lunes con Naviera Petral (con el dueño, Fernando Jarten).

---

## 1. FASE DE DISEÑO Y DEFINICIÓN DE ALCANCE

### Etapa 1: Herramienta de Forecast Comercial (Mandatoria)
*   **Objetivo:** Pronosticar el budget comercial y la rentabilidad (Gross Margin) esperada.
*   **Alcance:** Implementación de la lógica de negocio ya mapeada en los flujogramas para:
    *   Buques propios (Moquegua, Tablones).
    *   Buques charteados (Concon Trader, Huemel).
*   **Beneficio:** Permite a la gerencia tener visibilidad financiera proyectada antes de ejecutar el viaje.

### Etapa 2: Control de Ejecución Real (Opcional, pero recomendada)
*   **Objetivo:** Medir la precisión de los pronósticos (Forecast vs. Realidad).
*   **Alcance:** Interfaz operativa para que los responsables (María Elena y Jorge) ingresen la ejecución real:
    *   Fletes cobrados reales.
    *   Gastos ejecutados reales por barco.
*   **Sustento Estratégico:** *"No se puede establecer ningún tipo de meta ni mejorar el Forecast sin ver el espejo retrovisor"*. Es imposible auditar la veracidad del pronóstico si no se contrasta con lo realmente operado. Se presenta como opcional por respeto a la cultura actual, pero se aconseja firmemente.

---

## 2. FASE DE DESARROLLO DEL SISTEMA
Desarrollo ágil de la plataforma utilizando una arquitectura moderna y robusta:
*   **Backend & Interfaz de Usuario (UI):** **Streamlit** (Python). Permite un desarrollo ultra-rápido de dashboards de datos interactivos.
*   **Base de Datos:** **Supabase** (PostgreSQL). Actuará como la única fuente de verdad, estructurada y segura.
*   **Infraestructura (Servidor):** **Contabo**. Servidor VPS dedicado donde se alojará la aplicación para acceso continuo de la naviera.

---

## 3. FASE DE IMPLEMENTACIÓN Y CAPACITACIÓN
*   **Despliegue:** Puesta en producción de la herramienta.
*   **Pruebas:** Periodo de pruebas (Testing) con datos en vivo.
*   **Onboarding:** Capacitación directa e involucramiento de todo el equipo operativo y gerencial para asegurar la adopción correcta del sistema.

---

## 4. FASE DE ACOMPAÑAMIENTO (SOPORTE POST-LANTZAMIENTO)
*   **Duración:** 1 Mes.
*   **Modalidad:** Acompañamiento cercano (trabajo codo a codo viendo cómo operan el sistema en su día a día).
*   **Objetivos:**
    *   Identificar y corregir bugs de manera inmediata.
    *   Mejorar continuamente la Interfaz de Usuario (UI) y la Experiencia de Usuario (UX).
    *   Agregar funcionalidades menores o ajustes descubiertos durante el uso real.
