# Plan de Mejoras — Gráfico 1 (Ferrobamba)
**Archivo local de trabajo:** `C:\Users\rguti\Petral.MARK\Dashboard_Puertos\Graficos.25.05.26\`
**Fecha sesión:** 2026-05-25
**Regla de Oro:** Cero modificaciones a archivos fuera de esta carpeta.

---

## Modificaciones pendientes (solo en `script_local.js`)

### MOD-01 | Ícono/etiqueta "Ferrobamba" en el origen de las rutas

**Qué:** Agregar un marcador con etiqueta "Ferrobamba" al inicio de las rutas, con el mismo estilo visual que las etiquetas de proyectos mineros existentes.

---

### MOD-02 | Eliminar indicador de tanquero en etiquetas de puerto

**Qué:** Las etiquetas de los puertos muestran `(N 🛢️)` en rojo cuando hay tanqueros. Para el Gráfico 1 esto no aplica.

---

### MOD-03 | Enriquecer la burbuja de calado con nombre de puerto y tipo de buque

**Qué:** Solo para el Gráfico 1, la "burbuja de calado" debe mostrar el nombre del puerto y el tipo de buque que puede recibir.

---

## Estado del plan

| ID | Descripción | Estado |
|---|---|---|
| MOD-01 | Ícono + etiqueta "Ferrobamba" | ✅ Implementado (V3) |
| MOD-02 | Eliminar indicador de tanquero + contador de barcos | ✅ Implementado (V3) |
| MOD-03 | Enriquecer burbuja de calado con nombre y buque | ✅ Implementado (V3) |
| MOD-04 | Mostrar distancia/horas de viaje terrestres en burbujas de puertos | ✅ Implementado (V4) |
| MOD-05 | Ajustes estéticos de visualización y pulido de burbujas/etiquetas | ✅ Implementado (V5) |
| MOD-06 | Callouts (Leader Lines), Wrap Text y Filtro de Carreteras | ✅ Implementado (V5) |
| MOD-07 | Ocultar y desactivar el panel lateral flotante (Sidebar) | ✅ Implementado (V6) |
| MOD-08 | Ocultar paneles flotantes de Herramientas y Capas de la UI | ✅ Implementado (V6) |
| MOD-09 | Ajustes Microestéticos (Pixel Perfect) y Emojis | ✅ Implementado (V8) |

---

## Modificaciones V6 Final (Despejar el mapa completo de UI)

### MOD-08 | Ocultar los paneles flotantes izquierdos (Herramientas y Capas)

**Qué:** Ocultar los paneles de control flotantes `"🛠️ FUNCIONES Y HERRAMIENTAS (LOCAL)"` y `"🗺️ CAPAS Y PERÍMETROS (VISTA REDUCIDA)"` para liberar por completo el espacio en pantalla del mapa y permitir capturas sin elementos de interfaz de usuario.

**Cómo:**
1. En el callback `DOMContentLoaded` en `script_local.js`, buscar los contenedores DOM `#port-filter-ribbon` y `#layer-controls-panel`.
2. Asignarles un estilo `display: none !important` para ocultarlos de forma inmediata y persistente.
3. Esto dejará únicamente el mapa con las líneas, etiquetas y burbujas viales visibles en pantalla, eliminando todo ruido de controles y botones.

---

## Archivos a modificar

| Archivo | Acción | ¿Dentro de Graficos.25.05.26? |
|---|---|---|
| `script_local.js` | Ocultar paneles flotantes en DOMContentLoaded (MOD-08) | ✅ SÍ |

**Ningún archivo fuera de `Graficos.25.05.26\` será tocado.**

---

## Modificaciones V8 Final (Microestética y Correcciones UTF-8)

### MOD-09 | Ajustes Estéticos "Pixel Perfect" y Fix de Emojis

**Qué:** Refinar al milímetro la presentación visual de las etiquetas y solucionar problemas de codificación introducidos por PowerShell.

**Cómo (Implementado):**
1. **Coordenadas Manuales:** Se aislaron las rutas (Vía de los Libertadores, Nasca-Abancay, San Juan de Marcona, Paracas) para sobrescribir la posición que entrega OSRM con coordenadas manuales exactas solicitadas por el usuario.
2. **Geometría Custom (Paracas 30°):** Se creó una directiva de renderizado exclusivo (`renderParacas30`) que rota la línea conectora exactamente `30deg` en sentido horario.
3. **Distribución de Textos (Wrap):** Se forzó el salto de línea matemático (`<br>` + `white-space: nowrap`) para la *Carretera Panamericana Sur* y la *Longitudinal de la Sierra Sur* (dejando exactamente "Sur" en su posición ideal).
4. **Legibilidad:** Aumento general de fuentes en todo el código base a un tamaño predeterminado de `15px-16px` para facilitar lectura.
5. **Micro-ajustes de Anclaje:** Desplazamiento quirúrgico del tooltip del puerto "San Nicolás" 20px adicionales hacia el Oeste (`iconAnchor: [280, 55]`).
6. **Recuperación UTF-8:** Restauración manual de los emojis (`🚢`, `🛣️`, `⏳`, `⚠️`) y tildes (`Vía`, `Martín`) que se habían corrompido durante el reemplazo automatizado de textos.
