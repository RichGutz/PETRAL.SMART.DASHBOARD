# 🎨 Plan Etapa 2: Mockups y Organización del Frontend

Este documento detalla la estrategia inicial para arrancar la Etapa 2 (Frontend) del proyecto Geeksoft, enfocándonos en el prototipado visual de las pantallas maestras antes de generar el código React.

## 1. Organización del Worktree (Árbol de Trabajo)

Para mantener una separación estricta entre el motor algorítmico y la interfaz de usuario, la arquitectura de archivos se dividirá en:

```text
C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\
├── Geeksoft_Engine/    <-- (Ya existe) Backend Python, Supabase, Motor P&L
└── Geeksoft_Frontend/  <-- (NUEVO) Aplicación React SPA (Vite + TailwindCSS + ECharts)
```

> **Advertencia:** No inicializaremos la aplicación React (`npx create-vite`) hasta que el usuario haya aprobado los diseños conceptuales de las pantallas maestras.

## 2. Alcance del Prototipado Visual (Mocks)

La primera fase consistirá en la generación de mockups de alta fidelidad. Empezaremos por el núcleo administrativo, diseñando las siguientes pantallas:

1. **Pantalla Maestro Flota:** Una vista (tabla + formulario lateral) para registrar buques, sus especificaciones de ingeniería y curvas granulares de consumo de bunker.
2. **Pantalla Maestro Rutas & Precios:** Una interfaz de configuración para gestionar distancias náuticas, factores climáticos (`weather_factor`) y los precios de mercado del Bunker IFO/MDO.

## 3. Aprobación Estética (User Feedback)

Antes de generar las imágenes de concepto, el usuario debe proveer sus preferencias estéticas en base a:
- **Esquema de Colores:** Modo Oscuro (elegante/moderno) vs Modo Claro (corporativo ERP).
- **Acento Visual:** Colores insignia (Azul Naviero, Verde Financiero).
- **Estilo General:** Minimalista/plano vs Glassmorphism/Dashboard flotante.

## 4. Base de Datos de Flota (Specs Reales)

Para alimentar los mockups y el posterior desarrollo en React con datos reales, hemos extraído las características de los 4 buques operativos de Petral:

| Embarcación | Tipo | IMO | DWT (MT) | LOA (m) |
| :--- | :--- | :--- | :--- | :--- |
| **B/T MOQUEGUA** | Propio | 9262869 | 14,298 | 134.00 |
| **B/T TABLONES** | Propio | 9043093 | 16,533 | 158.11 |
| **CONCON TRADER** | Charteado | 9800037 | 19,823 | 146.00 |
| **HUEMUL** | Charteado | 9371775 | 22,062 | 161.00 |

Estos datos se usarán por defecto en el estado (state) inicial de React en la etapa de prototipado del componente `Maestro Flota`.
