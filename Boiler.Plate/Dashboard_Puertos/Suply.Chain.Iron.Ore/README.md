# Supply Chain Iron Ore Module - README

## 📦 Descripción
Módulo de visualización del flujo completo de mineral de hierro desde la Isla (recepción) hasta el Puerto (embarque).

## 🎯 Características
- **Esquema Geográfico 2D**: SVG interactivo con coordenadas reales
- **Vistas Detalladas**: Modales con screenshots reales del proceso
- **Componentes Visualizados**:
  - Isla: Volcadores (camión/tren), tolvas, stockpiles, reclaimers
  - Faja Transportadora: 4 km de longitud
  - Puerto: Finger pier, shiploader, buque Cape Size

## 📂 Estructura de Archivos
```
Suply.Chain.Iron.Ore/
├── index.html              # Página principal con esquema SVG
├── schematic_renderer.js   # Lógica de renderizado e interactividad
├── style.css               # Estilos modernos
├── supply_chain_3d.html    # Vista 3D alternativa (experimental)
├── supply_chain_3d.js      # Lógica 3D con Plotly
├── assets/
│   └── images/             # Screenshots del video de referencia
│       ├── truck_dumper.jpg
│       ├── train_dumper.jpg
│       ├── underground_conveyor.jpg
│       ├── stockpile_flow.jpg
│       ├── conveyor_to_pier.jpg
│       ├── shiploader.jpg
│       └── pier_vessel.jpg
└── .gitignore              # Excluye archivos de video (.mp4)
```

## 🚀 Navegación
Desde el dashboard principal (`index.html`), hacer click en el botón **"Supply Chain"** en el panel de filtros superior izquierdo.

## 🎬 Fuente de Imágenes
Las imágenes fueron extraídas del video de referencia:
**"Bulk Material Handling Systems - From Mine to End User | EMS-Tech Inc."**
YouTube: https://youtu.be/JHhwITxx4mE

### Timestamps de Extracción:
- `truck_dumper.jpg` → 1:50
- `train_dumper.jpg` → 1:03
- `underground_conveyor.jpg` → 2:02
- `stockpile_flow.jpg` → 4:12
- `conveyor_to_pier.jpg` → 4:37
- `shiploader.jpg` → 5:23
- `pier_vessel.jpg` → 4:50

## ⚠️ Importante para Git
El archivo de video original **NO** se sube a Git (está en `.gitignore`).
Solo se suben las imágenes JPG extraídas (mucho más livianas).

## 🔧 Dependencias
- Font Awesome (íconos)
- Google Fonts (Oswald, Inter, Roboto)
- Datos geográficos del proyecto padre:
  - `shougang_polygon.js`
  - `perimeter_sides.js`
  - `coastal_route.js`

## 📱 Uso
1. Click en zonas interactivas del esquema (Isla, Triángulo Petral)
2. Se abre modal con imágenes reales del proceso
3. Botón "X" para cerrar modal
4. Navegación fluida entre vistas

## 🎨 Diseño
- Tema oscuro profesional
- Gradientes modernos
- Cards con sombras y bordes
- Responsive design
