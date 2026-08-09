# MEJORA.UI.PRE.WALKTHROUGH.10.08.26

Documento de propuesta de micro-mejoras de Interfaz de Usuario (UI) y Experiencia de Usuario (UX) para el sistema PETRAL.SMART.DASHBOARD.

> [!IMPORTANT]
> **ESTADO**: Documento de planificación exclusivamente informativa. **NINGÚN CAMBIO DE CÓDIGO HA SIDO EJECUTADO**. Los ítems se aplicarán uno por uno únicamente tras la instrucción explícita del usuario.

---

## ÍTEMS DE MEJORA UI/UX PROPUESTOS

### 1. Header Global y Barra de Navegación (`App.tsx`, `App_V2.tsx`)
- [ ] **1.1. Indicador de Conexión en Vivo**: Agregar un micro-badge responsivo con pulso sutil (Cyan/Verde) que indique el estado de sincronización con la base de datos Supabase.
- [ ] **1.2. Tooltips Enriquecidos**: Agregar información contextual al posicionar el cursor sobre los íconos de la barra superior (ej. "Ir a Auditoría Dual", "Configuración de Maestros").
- [ ] **1.3. Elevación de Barra al Scroll**: Aplicar una sombra sutil de cristal con desenfoque (`backdrop-blur-md` + `box-shadow`) en la barra superior durante la navegación vertical.

---

### 2. Matriz Financiera / Commercial Forecast (`ForecastGrid.tsx`, `CommercialForecast.tsx`)
- [ ] **2.1. Hover Glow en Filas/Tarjetas de Matriz**: Efecto visual de resaltado suave al pasar el mouse sobre las filas de rutas y cotizaciones para facilitar la lectura.
- [ ] **2.2. Micro-Badges de Margen Neto**: Indicadores de color diferenciados y de alto contraste (Verde Esmeralda para PnL positivo, Rojo Ámbar para negativo/breakeven).
- [ ] **2.3. Transición Suave en Filtros**: Animación tipo *fade-in* de 150ms al cambiar la selección de Cliente o Buque para evitar saltos bruscos en pantalla.
- [ ] **2.4. Formato de Moneda en Inputs**: Alineación a la derecha y distintivo de divisa (`$ USD`) en los campos numéricos editables de Flete y Bunker.

---

### 3. Auditoría Final Dual (`VoyageLedgerFinal.tsx`)
- [ ] **3.1. Badge de Origen de Precio de Bunker**: Mostrar una etiqueta sutil (ej. `[Contrato SPCC]` vs `[Entrada Manual]`) en las casillas de IFO/MDO para que el usuario sepa de inmediato la fuente de la tarifa.
- [ ] **3.2. Feedback Visual al Editar Tarifa**: Breve cambio de color de borde (Cyan Glow) en la casilla de combustible cuando el valor ha sido modificado manualmente por el usuario.
- [ ] **3.3. Estado de Carga en Botón de PDF**: Mostrar un spinner animado ("Generando Vista Previa...") dentro del botón al procesar la actualización del PDF de auditoría.
- [ ] **3.4. Refinado de Tarjetas de KPI Resumen**: Ajuste de padding, tamaño de fuente y separación en los bloques de *TCE Real $/día*, *Margen Neto USD* y *Bunker Total USD* para mayor impacto visual.

---

### 4. Maestro de Contratos (`ContractsMaster_V2.tsx`)
- [ ] **4.1. Resaltado de Puertos de Origen y Destino**: Coloreado sutil distintivo en los desplegables de los 12 puertos de la Costa Oeste de Sudamérica al seleccionar rutas.
- [ ] **4.2. Visualización de Cláusulas de Bunker**: Iconografía clara en la tabla resumen indicando si el contrato es *Bunker Included* o *Bunker Adjustment Factor (BAF)*.

---

### 5. Visualizador de Rutas y Spaghetti Map (`SpaghettiMap_V2.tsx`)
- [ ] **5.1. Tooltip Enriquecido en Nodos Marítimos**: Al pasar el mouse sobre un puerto en el mapa, mostrar un cuadro flotante estilizado con el nombre oficial del puerto, país y coordenadas.
- [ ] **5.2. Panel Flotante de Controles de Zoom**: Botones compactos flotantes estilo *glassmorphism* para hacer zoom/reset en el mapa interactivo.

---

### 6. Estilos Globales y Componentes Base (`index.css`, `DataTable.tsx`)
## 6. Estilos Globales y Componentes Base (`index.css`, `DataTable.tsx`)
- [ ] **6.1. Scrollbars Personalizados (Dark Glass)**: Reemplazar los scrollbars por defecto del navegador por barritas delgadas y estilizadas acordes al modo oscuro del sistema.
- [ ] **6.2. Consistencia en Modales y Diálogos**: Asegurar bordes redondeados unificados (`rounded-xl`) y sombras sutiles en todos los modales de confirmación o edición.

---

## 7. Multicotizador (`MultiCotizadorExcel.tsx`, `SpotRouter.tsx`, `CommercialForecast.tsx`)
- [ ] **7.1. Título Visual en UI (Sin Cambiar Scripts)**: Quitar la palabra "SPOT" en la UI (mostrando solo "MULTICOTIZADOR").
- [ ] **7.2. Consolidación en 1 Sola Fila Única**: Todos los pasos de control `1. SELECCIONAR CLIENTE`, `2. CARGAR RUTA`, `3. CARGAR COTIZACIÓN`, `4. SELECCIONAR BUQUE` y `5. COSTOS PUERTO` se agrupan en **una única fila horizontal**.
- [ ] **7.3. Estilo Estándar en Mayúsculas Azules**: Todos los botones de pasos usan el estilo uniforme `text-blue-700 bg-blue-50 border-blue-200 font-black uppercase`.
- [ ] **7.4. Eliminación de Selector Duplicado en Fact Sheet**: Se elimina el desplegable repetido en la celda `VESSEL` de la tabla Fact Sheet. En su lugar se despliega la foto miniatura oficial del buque tal como en el Maestro de Flota.

```text
====================================================================================================================================================================
[ FILA 1: UNIFICADA TOTAL DE CONTROLES (UNA SOLA FILA HORIZONTAL) ]
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  MULTICOTIZADOR  |  1. SELECCIONAR CLIENTE [Activos][Prospectos] [Select Cliente v]  |  2. CARGAR RUTA  |  3. CARGAR COTIZACIÓN  |  4. SELECCIONAR BUQUE [Select Buque v]  |  5. COSTOS PUERTO [STATIC][MATRIX]  |  [ + Agregar Tramo ]  [ - Borrar Tramo ]
====================================================================================================================================================================
[ FILA 2: ESPECIFICACIONES DE BUQUE (FACT SHEET) - SIN SELECTOR DUPLICADO EN LA CELDA VESSEL ]
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  VESSEL (Foto Miniatura Oficial de Flota) | GRT | DWT | DWCC | SPEED | LOA | BEAM | SEA | IDLE | LOAD | DISCH | IFO ($/T) | MDO ($/T)
====================================================================================================================================================================
[ FILA 3: REJILLA DE TRAMOS Y PUERTAS DEL VIAJE (MÍNIMO 3 FILAS) ]
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
  - Leg 1, Leg 2, Leg 3 ...
====================================================================================================================================================================
[ FILA 4: ACCIONES FINALES Y EXPORTACIÓN AL PIE ]
--------------------------------------------------------------------------------------------------------------------------------------------------------------------
                                           [ 💾 Grabar ]   [ 📊 Exportar a Matrix ]
====================================================================================================================================================================
```
