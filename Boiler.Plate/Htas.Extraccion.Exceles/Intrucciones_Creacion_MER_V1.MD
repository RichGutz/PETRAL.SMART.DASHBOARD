# Instrucciones para la CreaciÃ³n y Renderizado de Informes (MER) - V52

**Aviso para futuros Agentes Gemini:** 
Sigan **ESTRICTAMENTE** el siguiente proceso para generar los archivos `.pdf` y `.html` a partir de un informe redactado en Markdown (`.md`). Esta versiÃ³n (V52) consolida iteraciones avanzadas que incluyen la separaciÃ³n dinÃ¡mica de escenarios, generaciÃ³n automatizada de mapas, y reglas rigurosas de manejo de Excel.

---

## 1. Regla de Oro: Versionamiento Estricto y Rutas Actuales

*   **Ruteo de Versiones Oficiales (Â¡LO QUE FUNCIONA!):** Nunca asumas en quÃ© versiÃ³n estamos. Actualmente, los archivos estables y que debes usar como base son:
    - **Markdown Base:** `Informe_Terreno_San_Miguel_V52.md`
    - **Compilador:** `build_from_template.py` (Debe estar ruteado internamente hacia la V52 o la Ãºltima versiÃ³n creada).
*   **Backups Inmediatos:** "Cada cosa que modifiquemos creamos una nueva versiÃ³n". Nunca sobreescribas el Markdown principal si vas a hacer cambios sustanciales; clÃ³nalo (ej. V53).
*   **Scripts Emparejados:** El script generador `build_from_template.py` debe evolucionar apuntando a la Ãºltima versiÃ³n del Markdown.
*   **VerificaciÃ³n Terminal:** Todo cambio debe probarse ejecutando el script en terminal y notificando que el PDF se compilÃ³ correctamente.

---

## 2. El Ecosistema de Scripts (Â¡DETALLADO!)

Para evitar errores y asegurar un flujo lÃ³gico, debes conocer exactamente quÃ© hace cada script:

1.  **`build_from_template.py`**: Es el compilador principal. Su **Ãºnica** labor es tomar el archivo `.md` actual, inyectarlo en la plantilla `Informe_Milagros_Rodriguez.html`, y llamar a Weasyprint para escupir el `.pdf` final.
2.  **`create_vXX.py`**: Scripts desechables (Ad-hoc) que los agentes crean temporalmente para migrar de una versiÃ³n a otra (ej. reemplazar cadenas exactas de texto, alterar estilos, actualizar versiones).
3.  **Scraping Financiero (`get_financial_summary.py` / etc)**: Lee el archivo Excel maestro para extraer las variables del *Scenario Summary*. **VER REGLA DE EJECUCIÃ“N EN SECCIÃ“N 3**.
4.  **GeneraciÃ³n de Mapas HD**: PequeÃ±os scripts con *Playwright* (ej. incrustados en `create_vXX.py`) que abren `Mapa_Ubicacion_Terreno.html`, inyectan marcadores en coordenadas exactas, y toman capturas de pantalla para generar PNGs que se referencian en el Markdown.

---

## 3. IntegraciÃ³n Financiera y "Scenario Manager" (Scraping de Excel)

En la V52, el corazÃ³n del anÃ¡lisis es el **Tab "Scenario Manager"**.

### 3.1. REGLA INQUEBRANTABLE SOBRE EL SCRAPING
**NO CORRAS EL SCRIPT DE EXCEL DE FORMA AUTOMÃ�TICA O PROACTIVA.** 
El script que busca los nÃºmeros en el escenario manager **SE CORRE SOLO CUANDO EL USUARIO TE LO ORDENE**. No vale la pena ir a buscar todo al Excel e intentar sobreescribir el informe si el usuario no te ha confirmado que el Excel se modificÃ³. Correr esto a ciegas rompe la integridad de los datos pulidos a mano en el Markdown.

### 3.2. Estructura de Slides Financieros
La estructura actual presenta un slide para Inputs y luego desglosa los P&L:
*   **Slides Separados:** Existe un slide independiente para el P&L BASE, otro para OPTIMISTA y otro para PESIMISTA.
*   **No Dobles Saltos de PÃ¡gina:** Los tÃ­tulos `##` en Weasyprint automÃ¡ticamente generan un salto de pÃ¡gina. **PROHIBIDO** poner `<div style="page-break-before: always;"></div>` inmediatamente antes de un tÃ­tulo `##`, ya que esto genera diapositivas en blanco o "fantasmas".
*   **Nomenclatura:** Las columnas de valores monetarios deben mantener el tÃ­tulo **"Soles sin IGV"**.

---

## 4. DiseÃ±o Premium y Reglas Weasyprint (MetodologÃ­a V52)

### 4.1. Quirks CrÃ­ticos de Weasyprint
*   **PROHIBIDO CSS Shorthands:** `weasyprint` falla silenciosamente con mÃ¡rgenes resumidos (ej. `margin: 60px auto 0 auto`). Usa propiedades explÃ­citas para alto/ancho de cajas.
*   **Ajuste MatemÃ¡tico de ImÃ¡genes:** Si configuras un marco (border) para una imagen con un `max-height` determinado, asegÃºrate de aplicar `width: auto;` y `display: block; margin: 0 auto;` (o similares) para que el borde abrace exactamente la foto en el centro, sin dejar espacios vacÃ­os por culpa de un width al 100%.

### 15. Errores Críticos y Lecciones Aprendidas (V3-V5)
Para evitar los loops de corrección interminables, **NUNCA** se deben repetir los siguientes errores de agente:

1. **Extracción de Excel con Pandas (Celdas Combinadas):** 
   Al usar `df.iloc[row]` sobre el Tab 0 para extraer los metrajes de los departamentos, NO se debe iterar sobre un rango de índices fijos (ej. `range(2, 9)`). Las celdas combinadas generan columnas `NaN` o vacías en pandas, desplazando los índices (ej. las columnas reales pueden ser 2, 4, 6, 7, 8, 9, 10). 
   *Solución:* Iterar sobre toda la fila (hasta la col 15) y filtrar los valores que sean `float` o `int` válidos menores a 100 para extraer todas las unidades reales.
2. **Generación de Mapa Leaflet:** 
   El mapa de ubicación NO es una simple imagen estática reemplazable mediante `replace()` en el Markdown. Es exportado desde un archivo HTML Leaflet.
   Además, se debe usar la plantilla específica del usuario (ej. `Mapa_Ubicacion_Terreno_RUBIO.html`), la cual ya contiene lógica pre-programada (como pines adicionales para obras previas). NUNCA usar la plantilla base genérica `Mapa_Ubicacion_Terreno.html` si existe una plantilla personalizada superior, y si hay problemas de CORS al exportar localmente, copiar las imágenes JPG a la misma carpeta del HTML.

### 4.2. "El Bonito Detalle" - Marcos en las ImÃ¡genes
*   Toda foto de comparables, renders, o mapas capturados debe llevar obligatoriamente este estilo institucional para separarse del fondo:
    `style="display: block; max-height: 350px; width: auto; margin: 5px auto; border: 2px solid #0f2c59; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"`

### 4.3. Mapas Interactivos (Coordenadas)
*   Cuando necesites aÃ±adir hitos geogrÃ¡ficos (ej. *Proyecto Huaca Castilla*), edita directamente el HTML fuente (`Mapa_Ubicacion_Terreno.html`).
*   Configura el `setView` (Centro y Zoom) para que abarque todos los marcadores necesarios.
*   Usa Playwright para automatizar la captura de este mapa en resoluciÃ³n HD a un archivo `.png` para que Weasyprint pueda empaquetarlo estÃ¡ticamente en el PDF final.

---
**FIN DEL DOCUMENTO V52**

## [NUEVO V2] REGLAS CRÍTICAS DE MIGRACIÓN ENTRE PREDIOS
1. **Validación de Slide 4 (Marco Normativo):** No basta con actualizar el número de departamentos. Se DEBE leer de la hoja '0.Harrison X Pisos VIS' del Excel los valores de 'Área Vendible Techada' y 'Áreas techadas' (construida) para reemplazar los viejos valores en el Markdown.
2. **Validación de Layout Slide 5 (Cabida):** Si la tipología crece (ej. entra un bloque de 3 dormitorios), la tabla puede empujar la "Nota Comercial" y generar un salto de página vacío indeseado. Ajustar el CSS en línea (font-size: 11pt, padding reducido) en el Markdown es mandatorio.
3. **Re-codificación Visual del Perfil de Elevación (Slide 5):** No es solo texto. El gráfico HTML/SVG está construido con bloques div proporcionales. Al migrar a otro predio, el AI DEBE recrear todo el bloque HTML dinámicamente:
   - Sótano 1 = Lote M2 (Full)
   - Sótano 2 = Cisterna + Tierra
   - Pisos = Crear div de proporciones (width %) según el metraje de las nuevas tipologías de departamentos que encajen en el 'Área Techada Útil' (Ej. 525m2 para 750m2 con 30% A.Libre).
4. **P&L Scenario Summary:** Ejecutar script extractor en Python para raspar la pestaña 'Scenario Summary' e inyectar dinámicamente todo el bloque HTML en los slides 8, 9 y 10 para garantizar cero error de tipeo.

## [NUEVO V3] REGLAS ABSOLUTAS DE MIGRACIÃ“N ENTRE PREDIOS
1. **ValidaciÃ³n de Slide 3 (Huella Techada):** Actualizar el Ã¡rea mÃ¡xima de huella techada segÃºn el 30% de Ã�rea Libre del nuevo predio (Ej. 750 * 0.7 = 525 mÂ²). NO arrastrar cifras antiguas como 420 mÂ².
2. **RevisiÃ³n de OrtografÃ­a y Nombres Propios:** Validar celosamente cÃ³mo estÃ¡ escrito en los archivos originales (ej. Castro.Harrison vs Harrinson) y corregirlo globalmente en el Markdown.
3. **PrevenciÃ³n de Slides VacÃ­os (Slide 5):** Es mandatorio comprimir el padding (4px max) y margin-top/bottom del Perfil de ElevaciÃ³n para garantizar que AMBOS entren en el MISMO slide (junto a la Nota Comercial) sin desbordar hacia una pÃ¡gina vacÃ­a.
4. **Re-codificaciÃ³n Visual del Perfil de ElevaciÃ³n:** El Perfil de ElevaciÃ³n SIEMPRE se debe codificar dinÃ¡micamente raspando las Ã¡reas del Tab 0 del Excel (Leyendo cada celda de Ã¡rea de los departamentos). NO usar tamaÃ±os ni distribuciones hardcodeadas o inventadas.
5. **Actualizar FotografÃ­a de Fachada:** Reemplazar obligatoriamente la ruta de la foto de la fachada del predio antiguo por el nuevo predio.
6. **ConfirmaciÃ³n del Archivo Financiero:** Confirmar SIEMPRE que el script extractor estÃ© apuntando al archivo Excel correcto (con el nombre que incluye la direcciÃ³n, ej. ACI.345.GRPY.xlsx) antes de inyectar las mÃ©tricas financieras.
