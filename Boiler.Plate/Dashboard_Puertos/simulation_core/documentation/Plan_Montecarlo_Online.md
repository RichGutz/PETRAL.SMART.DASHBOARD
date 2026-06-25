# Plan de Trabajo: Simulación Montecarlo - Optimización de Inventarios Proyecto TANK

## 1. Objetivo General
Determinar la configuración óptima de tanques (Base vs. Buffer) en el Terminal de Ácido Sulfúrico, simulando el comportamiento estocástico de los arribos de buques para garantizar la continuidad operativa de la planta y minimizar la capacidad ociosa.

---

## 2. Parámetros del Modelo

### A. Ingreso de Ácido (Suministro)
- **Modo:** Ferrocarril Central (Cajamarquilla -> Callao).
- **Capacidad por Vagón:** 80 TM.
- **Variables de Control:** 
  - Número de vagones por día.
  - Días de operación por semana (5 vs 7 días).
  - Semanas operativas al año (52 semanas).
- **Lógica de Almacenamiento:**
  1. Llenado prioritario de 3 Tanques Base (Capacidad total: ~18,768 MT).
  2. Uso de 2 Tanques Buffer ante saturación de Base (Capacidad adicional: ~12,512 MT).

### B. Salida de Ácido (Despacho)
- **Buque Referencia:** BOW CONDOR.
- **Lote de Despacho:** 16,000 MT por embarque.
- **Variable Aleatoria (Montecarlo):** Frecuencia de arribo del buque (Inter-arrival time).
- **Distribución:** Se asumirá una **Distribución Normal** (basada en el análisis histórico de 6 viajes únicos en 4 meses) para modelar las ventanas de llegada.

---

## 3. Metodología de Simulación
Se ejecutará un modelo de **Balance de Masas Diario** durante 365 días, repetido en 10,000 iteraciones (Montecarlo):

1.  **Día N:** Sumar ingreso por tren y restar despacho por buque (si el buque está en puerto).
2.  **Evaluación de Inventario:** 
    - Si el inventario supera la capacidad total (31,280 MT) -> **Riesgo de Parada de Planta**.
    - Si el inventario es insuficiente para cargar el buque -> **Demoras y Sobrecostos de Puerto**.
3.  **Análisis de Rotación:** Cálculo mensual de vueltas por tanque según el uso efectivo de los buffers.

---

## 4. Entregables y Fases
- **Fase 3: Visualización Dinámica (Dashboard Web)**
  - Implementación en `C:\Users\rguti\Petral.MARK\Dashboard_Puertos`.
  - **Gráfico de "Respiración" del Terminal:** Una línea de tiempo que muestra el llenado diario.
  - **Visualización Estocástica (5 tanques):**
    - 3 Tanques Base (Borde Azul).
    - 2 Tanques Buffer (Borde Rojo).
    - **Indicadores de Flujo (Dinámicos):**
        - **Tren (Izquierda):** Silueta que se ilumina cada día de operación ferroviaria. Muestra el tonelaje ingresado (Vagones x 80).
        - **Barco (Derecha):** Silueta que se ilumina el día del arribo y despacho (16,000 MT).
    - Animación de llenado progresivo con relleno verde.
  - **Modo Playback:** Animación de 365 días para observar los cuellos de botella en tiempo real.

- **Fase 4: Alertas de Riesgo Crítico**
  - Contador de "Días de Parada de Planta" (cuando el inventario llega a tope y sigue llegando tren).
  - Análisis de "Probabilidad de Quiebre Logístico" según la configuración elegida.

---

## 5. Especificaciones de Implementación Técnica

### Motor de Simulación (Frontend/JS)
- **Bucle Diario:** `Inventario[d+1] = Inventario[d] + (Vagones * 80) - (16000 si Barco_en_Puerto)`.
- **Lógica de Saturación:** Si `Inventario > 31,280`, el excedente se marca como "Acumulación en Planta" y dispara la alerta de parada.
- **Montecarlo:** Generación de 10,000 escenarios en segundo plano para calcular la curva de campana de riesgos.

### Interfaz de Usuario (UI)
1. **Controles (Sidebar):**
   - Slider: Vagones de Tren por Día (0 - 20).
   - Selector: Días de operación (Lu-Vi / Lu-Do).
   - Slider: Frecuencia de Buque (Días promedio entre arribos).
   - Slider: Variabilidad (Desviación estándar de los arribos).
2. **Visualización Central (Componente de Simulación):**
   - **Cilindros de Inventario (Vista Frontal):**
     - Representación de 5 rectángulos verticales ("parados").
     - **Tanques Base (3):** Borde **Azul**. Relleno **Verde** dinámico según nivel.
     - **Tanques Buffer (2):** Borde **Rojo**. Relleno **Verde** dinámico según nivel.
   - **Dinámica de Llenado:** Cada día de la simulación actualiza visualmente la altura del relleno verde representando el nivel de $H_2SO_4$.
   - **Gráfico de Área:** Evolución del stock total a lo largo de 365 días en sincronía con los tanques.
3. **Métricas de Éxito (KPIs):**
   - % de tiempo en zona de saturación.
   - Rotación anual estimada por tanque.
   - Costo de oportunidad por demora de buque.

---

## 6. Inventario de Scripts de Referencia (Fuentes de Datos)
Para asegurar la trazabilidad de los números base (Lead Times, Frecuencias, DWT), los siguientes scripts deben ser considerados como el motor de datos:

1.  **`preparar_ciclo_bow.py`**: El "cerebro" que calcula los ciclos (Lead Times) y las estadías reales del BOW Condor. Es la base para la distribución normal de la simulación.
2.  **`reporte_vessels_consolidado.py`**: Consolida los viajes únicos de toda la flota, eliminando duplicados por formatos de escala (ship_due).
3.  **`fetch_apm_tankers.py`**: Filtra la data de Supabase específicamente para APM Terminals, aislando el ruido de otros puertos y tipos de buque.
4.  **`fetch_tankers.py`**: Extractor general de buques tipo "tanque" en el Callao.

---
**Elaborado por:** Gemini Antigravity
**Fecha:** 2026-05-04
