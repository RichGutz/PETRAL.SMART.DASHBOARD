---
titulo: Especificación - Módulo de Configuración de Estilos (Design System Manager)
estado: Planeado
fecha_creacion: 2026-06-27
---

# Módulo de Configuración de Estilos

## 1. Visión General
El **Módulo de Configuración de Estilos** (Design System Manager) será una interfaz de administración dentro del PETRAL Smart Dashboard. Su objetivo es centralizar y gobernar la identidad visual de la aplicación, extrayendo las definiciones visuales (códigos HEX, opacidades, radios de borde) del código duro (hardcode) y trasladándolas a una base de datos relacional. 

Esto permitirá que los administradores modifiquen dinámicamente el aspecto de la plataforma sin necesidad de despliegues de software.

## 2. Alcance Funcional
El panel de control debe permitir gestionar los siguientes elementos:

### 2.1. Branding Corporativo Global (Theme Base)
- **Primary Color:** Color principal para barras superiores, headers y botones primarios de alta jerarquía (Actualmente: *Petral Blue* `#1E3A8A`).
- **Accent Color:** Color de acción para destacar procesos positivos o llamadas a la acción importantes (Actualmente: *Petral Teal* `#0D9488`).
- **Modo de Interfaz:** Selector global de Forzar Light Theme, Forzar Dark Theme, o Sistema.
- **Roundness (Border Radius):** Control deslizante o botones para alternar entre bordes Cuadrados (`0px`), Suaves (`6px - 8px`), o Pastilla (`9999px`).

### 2.2. Colores de Entidades Maestras (Data Viz)
Para asegurar que los gráficos, cuadros de mando y tablas financieras sean consistentes, el administrador podrá establecer el color representativo de cada entidad:
- **Catálogo de Clientes:** Color picker para asignar un color representativo a cada cuenta (ej. SPCC = Azul Cielo, SPOT = Naranja).
- **Catálogo de Rutas:** Color picker para identificar tráficos en mapas y gráficos (ej. Ilo-Matarani = Cyan).
- **Catálogo de Buques (Flota):** Color picker con tonos industriales para cada embarcación (ej. Tablones = Rojo, Moquegua = Verde).

## 3. Arquitectura y Persistencia
- Los datos visuales se guardarán en Supabase, posiblemente en una tabla de configuración `sys_ui_preferences` o directamente extendiendo las tablas maestras (`dim_vessels`, `dim_clients`, `dim_routes`) añadiendo la columna `display_color_hex`.
- En el *Frontend*, al cargar la aplicación, se efectuará un *fetch* inicial que inyectará dinámicamente estos valores HEX en las variables CSS del `:root` (`--primary`, `--accent`, etc.), logrando que toda la librería de Shadcn UI y TailwindCSS responda inmediatamente al nuevo estilo.

## 4. Requerimientos de UI/UX
- El módulo se construirá como una página de configuración (ej. `/admin/settings/theme`).
- Deberá contar con un "Preview" en tiempo real: al modificar un color o el redondeo de los botones, un panel lateral o *mockup* mostrará cómo se verá un botón, una tarjeta o un gráfico de barras con los nuevos parámetros, antes de pulsar "Guardar Cambios".
