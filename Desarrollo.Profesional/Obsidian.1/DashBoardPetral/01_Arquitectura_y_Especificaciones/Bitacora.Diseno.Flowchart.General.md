# 🗺️ Bitácora de Diseño: Flujograma General del Sistema PETRAL
> **Nota**: Esta bitácora documenta el proceso completo de creación del **Flujograma General de Arquitectura PETRAL** como herramienta visual de entrenamiento y referencia técnica.
> **Script definitivo**: `C:\Users\rguti\PETRAL.SMART.DASHBOARD\generar_flowchart_general_petral_v1.py`
> **Outputs**: `FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.pdf` y `.svg`
> **Tiempo real invertido**: ~90 minutos de iteración

---

## 🎯 Objetivo

Crear un **flujograma vertical Top-to-Bottom** de la arquitectura completa del sistema PETRAL, legible para un humano, con jerarquía de 5 niveles claramente separados y todos los 10 Maestros del sistema debidamente identificados y ordenados.

---

## 🚨 Problemas Encontrados y Cómo Se Resolvieron

### ❌ Problema 1: Texto Microscópico en Web
**Síntoma**: Se subía el `fontsize` en Graphviz pero la letra no crecía nada visualmente en el navegador.
**Causa raíz**: El componente React usaba `max-w-4xl` (~896px). Al ser el SVG de 3,000px de ancho, el navegador lo comprimía ~700%, dejando letras de 64pt reducidas a ~9pt visuales.
**Solución definitiva**: En `SystemFlowchartViewer_V2.tsx` se fijó `min-w-[1600px]` para impedir el encogimiento del SVG.

---

### ❌ Problema 2: Niveles Colapsados Horizontalmente
**Síntoma**: El Nivel 2 (Spot Engine) aparecía a la **misma altura** que partes del Nivel 1 (Maestros), generando un mapa ilegible.
**Causa raíz**: Graphviz optimiza para minimizar cruces de flechas, no para respetar jerarquías visuales. Si hay espacio horizontal libre al lado de un cluster alto, mete el siguiente cluster al costado.
**Solución definitiva**:
- `newrank=true` para activar ranking global.
- **Columna Vertebral Invisible**: Conexiones `[style=invis, weight=10]` desde un nodo ancla de cada nivel al siguiente: `M6_Contracts -> SpotCalculator -> CoreDispatcher -> VoyageLedger -> AuditViewer`.
- `ranksep=4.5` para separación vertical amplia entre niveles.

---

### ❌ Problema 3: Maestros en Orden Incorrecto (2 a la izquierda del 1)
**Síntoma**: El Maestro 2 aparecía a la **izquierda** del Maestro 1, y el Maestro 6 al centro con 7 y 8 a su izquierda.
**Causa raíz**: Graphviz reordena los nodos para acortar la longitud de las flechas de salida. Como M2→CoreDispatcher tenía un destino a la derecha, Graphviz movía M2 hacia la izquierda.
**Solución definitiva**: 
- Agrupar los 10 Maestros en **5 Columnas Explícitas** (`cluster_c1` a `cluster_c5`), cada columna con el maestro de Fila 1 encima y el de Fila 2 debajo, conectados con `[style=invis, weight=50]`.
- Cadenas horizontales de fuerza máxima: `M1->M2->M3->M4->M5 [style=invis, weight=100]` y `M6->M7->M8->M9->M10 [style=invis, weight=100]`.

---

### ❌ Problema 4: Nivel 3 Más Ancho que Nivel 1 (Desfase de Márgenes)
**Síntoma**: Los 8 motores de Perú y Chile en dos grupos lado a lado (4+4) generaban un ancho total mayor al del Nivel 1.
**Causa raíz**: Dos `subgraph cluster` lado a lado suman sus anchos más padding.
**Solución definitiva**: Eliminar los subgrafos de Perú y Chile y organizar los 8 motores en **2 filas de 4** con `rank=same`, comprimiendo el ancho horizontal del Nivel 3 para que quede bajo el paraguas del Nivel 1.

---

### ❌ Problema 5: Palabritas Flotando Fuera de los Boxes
**Síntoma**: Las etiquetas de flechas (`label="Dimensiones"`, `label="Distancia NM"`, etc.) aparecían flotando en el espacio vacío entre niveles.
**Causa raíz**: Con `splines=ortho` (aristas ortogonales), Graphviz no puede colocar las etiquetas sobre las líneas y las deposita en posiciones arbitrarias.
**Solución definitiva**: Eliminar **todas** las etiquetas de texto en los bordes. Las flechas solas comunican la relación jerárquica.

---

## ✅ Parámetros Definitivos que FUNCIONAN

```python
dot_code = """
digraph PetralSystemArchitectureV1 {
    rankdir=TB;
    splines=ortho;
    nodesep=1.5;
    ranksep=4.5;        # <-- Separación vertical amplia entre niveles
    dpi=300;
    newrank=true;       # <-- Ranking global para jerarquía estricta
    
    node [fontsize=22, height=1.3, margin="0.5,0.35"];
    edge [penwidth=2.5]; # <-- Sin labels en edges!

    # 5 Columnas explícitas para garantizar orden 1-10
    subgraph cluster_c1 { M1_Vessels -> M6_Contracts [style=invis, weight=50]; }
    # ... (5 columnas total)

    # Ranks horizontales
    { rank=same; M1..M5 }
    { rank=same; M6..M10 }
    M1->M2->M3->M4->M5 [style=invis, weight=100]; # <-- FUERZA MÁXIMA

    # Columna vertebral vertical invisible
    M6_Contracts -> SpotCalculator [style=invis, weight=10];
    SpotCalculator -> CoreDispatcher [style=invis, weight=10];
    CoreDispatcher -> VoyageLedger [style=invis, weight=10];
    VoyageLedger -> AuditViewer [style=invis, weight=10];
}
"""
```

---

## 📐 Estructura Final del Flujograma

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ NIVEL 1: MAESTROS & CATÁLOGOS BASE DEL SISTEMA (10 MÓDULOS)                  │
│  [1.Flota]  [2.Puertos&Q]  [3.Distancias]  [4.Rutas]  [5.Clientes]          │
│  [6.Contratos]  [7.GastosPort]  [8.Originación]  [9.Bunkers]  [10.Usuarios]  │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────────────────┐
│ NIVEL 2: MOTOR DE CÁLCULO DE VIAJE SPOT                                       │
│  [⚙️ Ruteador Spot]  [⛽ Bunkers Engine]  [💵 Estimador Flete]                │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────────────────┐
│ NIVEL 3: MOTORES DEDICADOS COSTOS PORTUARIOS P×Q                              │
│  [🔀 Core Dispatcher]                                                         │
│  [🇵🇪 Callao]  [🇵🇪 Marcona]  [🇵🇪 Matarani]  [🇵🇪 Ilo]                    │
│  [🇨🇱 Mejillones]  [🇨🇱 Interacid]  [🇨🇱 Terquim]  [🇨🇱 Barquito]           │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────────────────┐
│ NIVEL 4: CONSOLIDACIÓN COMERCIAL & VOYAGE LEDGER                              │
│  [📊 Voyage Ledger Universal]  [💼 Multicotizador Excel]                      │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────────────────┐
│ NIVEL 5: AUDITORÍA NAVIERA DUAL & REPORTES                                    │
│  [🔍 Auditoría Dual P×Q]  [📄 Acta PDF]  [📈 Excel Consolidado]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow de Actualización (Para Futuras Ediciones)

```powershell
# 1. Editar el script
code C:\Users\rguti\PETRAL.SMART.DASHBOARD\generar_flowchart_general_petral_v1.py

# 2. Regenerar PDF y SVG
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD
python generar_flowchart_general_petral_v1.py

# 3. Copiar al frontend
Copy-Item ".\FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.svg" ".\Desarrollo.Profesional\Geeksoft_Frontend\public\" -Force
Copy-Item ".\FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.pdf" ".\Desarrollo.Profesional\Geeksoft_Frontend\public\" -Force

# 4. Build frontend
cd .\Desarrollo.Profesional\Geeksoft_Frontend
npm run build

# 5. Deploy VPS (ver Lanzamiento.Local.y.VPS.md)
cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS
python deploy_forecast_kickoff.py
```

---

## 📁 Archivos Relacionados

- **Script**: [generar_flowchart_general_petral_v1.py](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/generar_flowchart_general_petral_v1.py)
- **PDF Output**: [FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.pdf](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/FLUJOGRAMA_ARQUITECTURA_GENERAL_PETRAL_V1.pdf)
- **Visor Web**: `SystemFlowchartViewer_V2.tsx` en `Geeksoft_Frontend/src/components/Tools/`
- **Lanzamiento VPS**: [Lanzamiento.Local.y.VPS.md](Lanzamiento.Local.y.VPS.md)
