# 📑 Método de Desarrollo GUI-LESS y Generación de Ledger Matemático (PDF)

Este documento establece la metodología de desarrollo de **Geeksoft** para la validación del backend del proyecto Petral. Se descarta el uso de interfaces gráficas temporales (Streamlit) para enfocar el 100% del esfuerzo en la consistencia del motor de cálculo y la automatización de la auditoría mediante un reporte técnico en PDF.

## 🛠️ 1. Arquitectura del Método GUI-LESS

El proceso de desarrollo e integración se ejecutará de forma directa en el backend, desacoplado del frontend visual definitivo:

Plaintext

```
 [Supabase DB] ◄──► [FastAPI Engine] ──► [Automated Pytest] ──► [Generación de PDF Ledger]
                                                                        │
                                                                        ▼
                                                             Auditoría Visual (Gerencia)
```

1. **Base de Datos (Supabase):** Inicialización de tablas y constraints relacionales completos (`vessels`, `routes`, `agency_matrix`, `contract_tariffs`).
    
2. **Motor de Cálculo (FastAPI):** Ingesta del JSON de viaje y resolución matemática del P&L.
    
3. **Suite de Pruebas (`pytest`):** Ejecución programática del caso de prueba inamovible (Ilo-Matarani, 13,500 MT, B/T Tablones).
    
4. **Output de Auditoría (PDF):** Compilación automatizada de un reporte técnico detallado de trazabilidad matemática.
    

## 📊 2. Especificación del Output Esperado: El PDF Ledger

El backend de FastAPI debe incluir una librería de generación de documentos (como `ReportLab` o `WeasyPrint`) para escupir un único PDF estructurado en 4 secciones de ingeniería:

### 🧩 Sección I: Modelo de Datos y Esquema E/R

- Impresión del diagrama Entidad-Relación oficial en formato vectorial.
    
- Mapeo de llaves primarias (PK) y foráneas (FK) que se cruzaron en Supabase para el viaje ejecutado.
    

### 📋 Sección II: Formulario de Variables (Datos Maestros Inyectados)

- Diccionario completo indicando de qué tabla y columna exacta de Supabase provienen los datos inyectados al viaje:
    
    - `vessel_id` $\rightarrow$ Extraído de `vessels.vessel_id` (`"TABLONES"`).
        
    - `route_distance` $\rightarrow$ Extraído de `routes.route_distance` (`69.0`).
        
    - `freight_rate` $\rightarrow$ Extraído de `contract_tariffs.freight_rate` (`19.01`).
        

### 🧠 Sección III: Racionalidad y Reemplazo Numérico en Fórmulas

- Desglose secuencial de las fórmulas del motor, mostrando primero la teoría y luego el reemplazo numérico real de las variables para auditar la aritmética:
    
    **Ejemplo en Puerto ( port_days ):**
    
    - _Racionalidad:_ Suma de las horas de carga en origen y descarga en destino basadas en los cuellos de botella físicos (mínimos), más las horas muertas fijas de maniobra por puerto, todo convertido a días.
        
    - _Fórmula Teórica:_
        
        $$\text{port\_days} = \frac{\left(\frac{\text{quantity}}{\text{actual\_load\_rate}} + \text{port\_overhead\_hours}\right) + \left(\frac{\text{quantity}}{\text{actual\_discharge\_rate}} + \text{port\_overhead\_hours}\right)}{24}$$
        
    - _Reemplazo Numérico Real:_
        
        $$\text{port\_days} = \frac{\left(\frac{13500}{500} + 6\right) + \left(\frac{13500}{300} + 6\right)}{24} = \frac{(27 + 6) + (45 + 6)}{24} = \frac{33 + 51}{24} = \mathbf{3.500000\text{ días}}$$
        

### 🏁 Sección IV: Estado de Resultados y KPIs (Cierre de Caja)

- Matriz final con los outputs calculados (`net_income`, `total_bunker_costs`, `voyage_result`, `tce_real`) impresos lado a lado con el margen de variación frente a Petral corporativo.
    

## 💡 Instrucción de Contexto para el Agente (Antigravity IDE):

> "Se prohíbe terminantemente la inversión de horas de desarrollo en interfaces gráficas (GUI) web o locales para la fase de pruebas. El hito de validación del backend se completará mediante pruebas automatizadas sin cabeza (headless).
> 
> El agente debe programar un script de post-ejecución en el archivo de test (`pytest`) que capture el estado de las variables y genere un archivo PDF consolidado (`voyage_ledger_test.pdf`). Este PDF debe estructurarse con la rigurosidad de un informe de auditoría de ingeniería, mostrando de manera explícita el origen relacional del dato en Supabase, la fórmula matemática empleada y el reemplazo numérico detallado de cada ecuación para permitir el control de calidad visual por parte de la gerencia financiera."

## 🔗 Relaciones Lógicas en Obsidian

- Esta metodología redefine el pipeline de entrega planteado en `[[000 — MAPA DE ARQUITECTURA GENERAL]]`.
    
- Vincula los criterios de aceptación numéricos de `[[Voyage.Calculation.Tablones_3]]` con un entregable documental físico.