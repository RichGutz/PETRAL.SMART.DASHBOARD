# Plan de Recolección de Data - Proyecto San Nicolás (Línea de Combustibles)

**Objetivo:** Validar y refinar la estimación de demanda de **400,000 TM/año** de combustibles y evaluar la viabilidad comercial del terminal de líquidos en San Nicolás.

## 1. Estrategia de Evaluación (Mandato del Cliente)

**Hipótesis de Negocio:**
El Proyecto San Nicolás propone abastecer de combustibles a las operaciones mineras del sur (Apurímac, Ica, Cusco, Arequipa) desde un nuevo terminal local, reemplazando el costoso transporte terrestre desde Lima/Callao o Pisco.

**Evaluación Preliminar (A validar con data):**
- **Pros (Upside):**
    - **Demanda Cautiva:** Las minas "ancla" (Ferrobamba, Strike, etc.) son grandes consumidores de Diésel. Integrar la logística de exportación (mineral) e importación (combustible) genera eficiencias masivas.
    - **Ahorro Logístico:** San Nicolás está geográficamente más cerca de los clústeres mineros del sur que Callao, reduciendo el flete terrestre (componente crítico del costo final).
- **Contras (Riesgos):**
    - **Escala:** 400k TM/año (~8.5k barriles/día) es un volumen bajo para atraer grandes tanqueros internacionales (MRs/Panamax). Probablemente requiera cabotaje desde refinerías locales o consolidación de carga.
    - **Competencia:** Terminales existentes en Pisco (Punta Pejerrey) y Matarani/Mollendo.

---

## 2. Plan de Recolección - SUPPLY (Oferta)

**Meta:** Mapear la cadena de suministro actual. ¿De dónde sacan el combustible hoy las minas de Apurímac/Cusco?

### A. Herramientas Existentes (Scraping)
- **Dashboard de Puertos (`Dashboard_Puertos`):**
    - **Acción:** Continuar el monitoreo de **Tankers** en puertos clave (Callao, Pisco, Matarani, Ilo).
    - **Objetivo:** Identificar frecuencia de arribo, tamaño de nave (DWT) y origen de la carga actual que abastece el sur.
    - **Mejora:** Filtrar específicamente por naves de "Productos Derivados" vs "Crudo" para no ensuciar la data.

### B. Data Externa (Veritrade 2025)
- **Acción:** Procesar la data de importaciones que conseguirá el cliente mañana.
- **Filtros Clave:**
    - **Importador:** Valero, Repsol, Petroperu, ExxonMobil (proveedores mineros típicos).
    - **Puerto de Ingreso:** ¿Cuánto entra por Pisco vs Matarani vs Callao?
    - **Producto:** Diésel B5 S-50 (el principal insumo minero).

### C. Análisis de Infraestructura
- **Gap Analysis:** Comparar la capacidad de almacenamiento propuesta (USD 20MM) con la rotación de inventarios necesaria.
- **Logística Terrestre:** Estimar el costo actual de flete Lima-Mina vs San Nicolás-Mina para cuantificar el "Ahorro" que justifica la tarifa de USD 20/TM.

---

## 3. Plan de Recolección - DEMAND (Demanda)

**Meta:** Proyectar el consumo de combustible al 2029+ basado en la expansión minera.

### A. Modelamiento Econométrico (Top-Down)
*Basado en metodología "La industria de los hidrocarburos líquidos en el Perú" (Vásquez, 2005).*

- **Modelo Log-Lineal Regional:**
  $$ \ln(Q_{sur}) = \alpha + \beta \ln(PBI_{minero}) + \gamma \ln(Precio) $$
- **Variables:**
    - **PBI Minero Regional:** Usar proyecciones de producción de hierro/cobre del mandato (Ferrobamba, Strike, etc.) como proxy del crecimiento económico sectorial.
    - **Factor de Intensidad:** Calcular el ratio *Galones de Diésel por TM de Mineral Movido*. (Benchmarking: una mina tajo abierto consume masivamente diésel en acarreo).

### B. Cálculo Bottom-Up (Por Proyecto - Horizonte 5 años)
*Enfoque específico para la demanda nueva/acrecional que NO sigue una tendencia histórica, sino hitos de inversión.*

**Zona de Influencia Económica:** Apurímac, Cusco, Arequipa y parte de Ica.

1.  **Minas en Operación (Expansiones):**
    - **Las Bambas (Ferrobamba):** 2.5 MM TM/año. Calcular consumo actual y expansión de flota.
    - **Marcobre (Mina Justa):** 130k TM/año Cobre.
    - **Shougang / Minsur:** (Si aplica).

2.  **Nuevos Proyectos (Pipeline 2025-2029):**
    - **Strike Resources (Apurímac Ferrum):** Inicio 2026. 2 MM TM/año proyección 2029.
    - **Mineradora Planoalto:** Inicio 2026. 1 MM TM/año proyección 2029.
    - **Los Chancas (Southern):** Inicio 2030 (Evaluar pre-stripping desde 2028).
    - **Zhonghui / Sesuveca:** 500k TM/año c/u.
    - **Otros:** Hierro Apurímac, Pampa de Pongo (si se reactiva).

**Metodología de Cálculo:**
- *Input:* TM de Mineral/Estéril a mover por año (según Plan de Minado).
- *Ratio:* Consumo de Diésel (Gln/TM) según tipo de mina (Tajo abierto > Subterránea) y distancia de acarreo.
- *Total:* Suma de demanda de proyectos nuevos = Demanda Acrecional Potencial para San Nicolás.

### C. Factor de Conversión Energética (Benchmark)
*Fuente: "Energías renovables en la minería del Perú" (6.6MB, PDF).*

- **Matriz Energética Minera (Gráfico 17, pág 10):**
    - Electricidad: **75.2%**
    - Diésel B5: **17.4%**
    - Otros: 7.4%

- **Fórmula de Extrapolación (Cross-Check):**
  Si tenemos la demanda eléctrica proyectada (GWh) de un proyecto nuevo (dato disponible en COES/Minem):
  $$ \text{Energía Total} = \frac{\text{Demanda Eléctrica (GWh)}}{0.752} $$
  $$ \text{Demanda Diésel (GWh)} = \text{Energía Total} \times 0.174 $$
  $$ \text{Volumen Diésel (TM)} \approx \frac{\text{Demanda Diésel (kWh)}}{40.7 \text{ kWh/gal}} \times 0.0032 \text{ TM/gal} $$

- **Aplicación Inmediata (Tabla 30 - PDF Zona Sur):**
    - Proyectos Nuevos (Quellaveco, Zafranal, Chancas, etc.): **7,836 GWh/año** (Eléctrico).
    - **Demanda Diésel Implícita:** ~145,000 TM/año adicionales.

### D. Hallazgos "Proyectos Mineros 2025" (Minem)
*Análisis de ventaja logística (San Nicolás):*

1.  **San Gabriel (Moquegua) - 2025 (Inminente):**
    *   *Estado:* Construcción (Reinicio). Puesta en marcha Q4 2025.
    *   *Logística:* Mina subterránea de Oro. Volumen de carga bajo, pero **demanda de insumos inmediata**.
    *   *Oportunidad:* Suministro de combustible para operación 2026.

2.  **Pampa de Pongo (Arequipa/Ica) - 2028 (El "Game Changer"):**
    *   *Ubicación:* Bella Unión/Lomas. Altitud baja (320 msnm). Muy cerca a Marcona.
    *   *Volumen:* **20 Millones TM/año** de Hierro (Fase II-III).
    *   *Ventaja:* Al ser hierro masivo, requiere puerto industrial cercano. Si su propio puerto (Jinzhao) se retrasa, **San Nicolás es la alternativa natural**.
    *   *Status:* Factibilidad / MEIA-d en evaluación.

---

## 4. Entregables Sugeridos

1.  **Mapa de Flujo de Calor:** Visualización en el Dashboard de dónde entra el combustible hoy y dónde se consume.
2.  **Reporte de Viabilidad de Líquidos:** Documento confirmando si los 400k TM justifican la inversión de USD 20MM.
3.  **Matriz de Precios:** Comparativo Precio Puesto en Mina (Callao vs San Nicolás).
