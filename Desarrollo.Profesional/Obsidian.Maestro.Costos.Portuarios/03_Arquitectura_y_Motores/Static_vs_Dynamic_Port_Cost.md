# ⚖️ Herramienta: Static.vs.Dynamic.Port.Cost

**Módulo:** Herramientas Analíticas PETRAL (PETRAL SMART DASHBOARD)  
**Ruta Frontend:** `/static-vs-dynamic-port-cost`  
**Componente:** `StaticVsDynamicPortCost_V2.tsx`  
**Bóveda Obsidian:** `03_Arquitectura_y_Motores\Static_vs_Dynamic_Port_Cost.md`  

---

## 🎯 Propósito y Descripción General
La herramienta **`Static.vs.Dynamic.Port.Cost`** es un motor de auditoría comparativa en tiempo real diseñado para confrontar las **tarifas portuarias estáticas fijas** (contratadas o presupuestadas por operación) contra el **promedio de los costos dinámicos** generados por las reglas polinómicas del motor P×Q y las proformas itemizadas en cada puerto y terminal.

Esta herramienta permite a las gerencias Comerciales, Financieras y de Operaciones detectar **desviaciones presupuestales**, sobrecostos por demoras o descalibres entre las tarifas planas de los contratos y las liquidaciones reales.

---

## 📊 Arquitectura de Datos y Fuentes
La herramienta extrae y procesa automáticamente la información directamente desde la base de datos Supabase a través de `ForecastService`:

1. **Valores Estáticos Base ($N-1$)** $\rightarrow$ `ForecastService.getPortCostsStatic()` (`/forecast/port_costs_static`):
   - Extrae el costo estático fijo registrado por puerto, terminal y tipo de operación (Carga vs Descarga).
   - Ejemplo: Callao APMT ($28,500 USD), Matarani TISUR ($22,400 USD), Ilo SPCC ($18,200 USD).

2. **Promedio de Costos Dinámicos ($N$)** $\rightarrow$ `ForecastService.getPortCostsMatrix()` (`/forecast/port_costs_matrix`):
   - Agrupa y suma la matriz polinómica de rubros itemizados:
     - Practicaje ($/operación)
     - Remolque ($/hora x caballos de fuerza)
     - Agenciamiento Marítimo ($/escala)
     - Amarre y Desamarre
     - Uso de Muelle / Port Dues
     - Amarradores y Lanchas

---

## 🧮 Fórmulas y Mecánica Analítica

### 1. Varianza Absoluta en Dólares ($\Delta \text{ USD}$)
$$\Delta \text{ USD} = \text{Promedio Costo Dinámico} - \text{Costo Estático Base}$$

---

### 2. Varianza Porcentual ($\Delta \text{ \%}$)
$$\Delta \text{ \%} = \left( \frac{\text{Promedio Costo Dinámico} - \text{Costo Estático Base}}{\text{Costo Estático Base}} \right) \times 100$$

---

### 3. Clasificación de Auditoría por Semáforo
- 🟢 **ALIGNED (Alineado):** $|\Delta \text{ \%}| < 5\%$ (El costo dinámico coincide con la tarifa estática fijada).
- 🟡 **MODERATE (Variación Moderada):** $5\% \le |\Delta \text{ \%}| \le 15\%$ (Requiere revisión de rubros secundarios).
- 🔴 **CRITICAL (Desviación Crítica):** $|\Delta \text{ \%}| > 15\%$ (Ajuste requerido en tarifas portuarias o adenda contractual).

---

## 🖥️ Componentes de la Interfaz de Usuario (UI)

1. **Tarjetas Ejecutivas de KPIs**:
   - Promedio Estático Base Global ($/op).
   - Promedio Dinámico P×Q Global ($/op).
   - Desviación Promedio del Sistema (%).
   - Contador de Puertos Alineados vs. Críticos.

2. **Controles de Filtro & Búsqueda**:
   - Búsqueda en tiempo real por nombre de puerto o terminal.
   - Filtro por Tipo de Operación (`CARGA`, `DESCARGA`, `TODAS`).
   - Filtro por Estado de Auditoría (`🟢 ALINEADOS`, `🟡 MODERADOS`, `🔴 CRÍTICOS`).

3. **Matriz Comparativa Granular**:
   - Tabla interactiva con badges de estado, desglose de rubros evaluados y resaltado de desviaciones.

4. **Exportación Integrada**:
   - Exportación directa a Excel (`.xlsx`) y PDF reportes ejecutivos.
