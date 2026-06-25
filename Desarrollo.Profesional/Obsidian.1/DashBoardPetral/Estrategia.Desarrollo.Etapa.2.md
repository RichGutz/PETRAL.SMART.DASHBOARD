# 📑 Estrategia de Desarrollo Etapa 2: Conexión de Cables (Frontend & Infraestructura)

Este documento establece la metodología y directrices técnicas para la **Etapa 2** del proformador de **Geeksoft**. Una vez aprobado el motor matemático en la Etapa 1 mediante el método GUI-LESS, se inicia el despliegue de la infraestructura web definitiva y la interfaz de usuario en producción.

---

## 🛠️ 1. Arquitectura de Infraestructura y Despliegue (Producción)

Para garantizar un entorno robusto, escalable y aislado, se implementa la siguiente pila tecnológica:

* **Servidor VPS (Contabo):** Instancia Ubuntu Server dedicada administrada mediante Docker y Docker Compose para aislar microservicios.
* **Capa Backend (FastAPI):** Expone endpoints REST robustos, protegidos mediante CORS y tipados estrictamente usando esquemas Pydantic.
* **Capa Backend-as-a-Service (Supabase):** Aloja la base de datos PostgreSQL, gestiona las políticas de seguridad (RLS) y centraliza la autenticación JWT.
* **Capa Frontend (React + Vite):** Compila una Single Page Application (SPA) optimizada, utilizando Tailwind CSS con componentes premium de Shadcn UI para la interfaz y Apache ECharts para la analítica financiera.

---

## 🎨 2. Especificación de Componentes UI en Producción

El frontend interactúa con el motor del backend mediante tres componentes React modulares e interconectados:

### 🖥️ A. El Formulario de Ingreso Rápido de Viaje (`React / Tailwind`)
* **Campos de Entrada (Inputs Activos):** `quantity` (Toneladas), `client_id`, `origin_port_id` y `destination_port_id`.
* **Componente de Configuración Comercial de Ruta:** Implementar un switch de Tailwind CSS denominado **"Viaje Redondo (Round Trip)"** vinculado a la variable booleana `is_round_trip`.
  * **Comportamiento por defecto:** El switch inicializa encendido (`true`), forzando al backend a duplicar el cálculo de distancia y búnker de navegación para cubrir el retorno en lastre.
  * **Comportamiento alternativo:** Al apagarse manualmente (`false`), el motor recalcula el Unit Economics bajo la premisa de Solo Ida (One Way), reduciendo el costo de búnker y alterando las métricas en tiempo real.

### 📋 B. El Tablón Comparativo de Tráfico (`Shadcn Data Table`)
* **Propósito:** Renderizar una matriz interactiva que liste simultáneamente las tres rutas oficiales vigentes (Matarani, Marcona, Mejillones) calculadas bajo el parámetro del switch seleccionado.
* **Columnas Obligatorias:** `Destino`, `Flete Base (USD/MT)`, `Duración Total (Días)`, `Costo de Bunker (USD)`, `Utilidad (Voyage Result USD)` y `Rendimiento Diario (TCE USD/Día)`.

### 📊 C. Dashboard Ejecutivo de Unit Economics (`Apache ECharts`)
Las respuestas del JSON del motor backend se mapearán directamente a los siguientes componentes visuales en la interfaz web de producción:
* **Gauge Chart / Indicador de Aguja Principal:** Mapea el valor de `tce_real` fijando una línea roja de quiebre o umbral crítico en el límite exigido de `tce_required` ($15,000.00 USD/día).
* **Waterfall Chart / Gráfico de Cascada Avanzado:** Ilustra la degradación del dinero: `net_income` $\rightarrow$ menos costos portuarios $\rightarrow$ menos búnker $\rightarrow$ subtotal (`voyage_result`) $\rightarrow$ menos cargo fijo diario corporativo (`tce_required * total_duration`) $\rightarrow$ hasta cerrar la caja con la barra final del **P/L Neto** (`pl_vs_required`).

---

## 🔒 3. Directrices Generales de Cables y Conexión

1. **Persistencia Dinámica:** Cada vez que el usuario manipule el switch `is_round_trip` o altere el tonelaje en el formulario, el estado de React debe disparar una petición `POST` debounce al endpoint `/api/v1/calculate-voyage` para repintar las gráficas en menos de 150ms.
2. **Seguridad JWT:** Ninguna consulta al motor o lookup de maestros puede ejecutarse sin inyectar el Bearer Token provisto por las funciones nativas de Supabase Auth en las cabeceras HTTP.