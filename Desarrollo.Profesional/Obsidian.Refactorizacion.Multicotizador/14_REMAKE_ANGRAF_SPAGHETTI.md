# 📑 14 Plan Maestro: Reconstrucción Incremental Local & Conexión de Herramientas

> **Ubicación Oficial:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\14_REMAKE_ANGRAF_SPAGHETTI.md`  
> **Ubicación Secundaria:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\Refactorizacion.Multicotizador.Matriz.Financiera.ANGRAF.SPA\14_REMAKE_ANGRAF_SPAGHETTI.md`  
> **Origen del Plan:** Transcripción Completa del Audio `REDO.TOOLS.MENU.ogg` (Whisper AI)  
> **Fecha:** 15 de Agosto de 2026  
> **Estado:** 🎯 **ESPECIFICACIÓN Y PASOS INNEGOCIABLES DICTADOS POR EL USUARIO**

---

## 🎙️ 1. Transcripción Oficial Completa del Audio (`REDO.TOOLS.MENU.ogg`)

> *"Gemini, ya estoy harto de ti, ya no te aguanto ya. Siempre errático, todo lo hace mal.  
> **Escucha, vamos a hacer esto exactamente:**  
> Primero, vamos a simular que estamos empezando a construir todo el paquete de herramientas. Tú tienes las herramientas guardadas, las tenemos en git, ya.  
> **Entonces, primero, ¿qué herramientas funcionan ahorita? Funcionan: Multicotizador Multirutas y Matriz Financiera. Su conexión es perfecta, ¿ok? Esas son las dos únicas herramientas que vas a dejar en herramientas.**  
> Luego vas a agarrar la data que produce Matriz Financiera en el arreglo en el que está y vas a probar la herramienta de **Análisis Gráfico** con esa data **EN LOCAL**, ¿ok?  
> **En local con un escenario que yo te voy a pasar, el escenario llamado `unofasi` (primer modelo modular).**  
> Luego que podamos ver en Análisis Gráfico la data del primer modelo modular, vamos a subir Análisis Gráfico y luego vamos a proceder igual con Spaghetti Map.  
> Entiende, ya no tengo más tiempo que perder contigo, todo lo haces mal."*

---

## 📋 2. Pasos Estrictos Dictados por el Usuario

### PASO 1: Menú Inicialmente Limpio
- Dejar únicamente las **dos herramientas comprobadas y perfectas**:
  1. ⛴️ **Multicotizador Multirutas**
  2. 📊 **Matriz Financiera**

### PASO 2: Prueba en Local de Análisis Gráfico (`GraphicAnalysis`)
- Probar **exclusivamente en entorno LOCAL** la herramienta de Análisis Gráfico alimentándola con la data en el arreglo nativo de Matriz Financiera.
- Cargar y validar con el escenario de prueba oficial: **`unofasi` (primer modelo modular)**.

### PASO 3: Despliegue Incremental
- Solo tras verificar el correcto funcionamiento visual de Análisis Gráfico en LOCAL con el escenario `unofasi`, proceder al despliegue a VPS.
- Repetir exactamente el mismo procedimiento incremental controlado para **Spaghetti Map**.

---

## 🌊 3. Plan Técnico: Curvaturas Inteligentes y Sincronización Cronológica Multitramo en Spaghetti Map

### 3.1. Curvaturas Inteligentes (`getSmartCurveness`)
- **Regla 1 (No Tocar Continente Sudamericano)**:
  - Rutas Rumbo Sur ($\text{lat}_{\text{destino}} < \text{lat}_{\text{origen}}$): Signo **Positivo ($+$)** $\rightarrow$ Abre el arco al Océano Pacífico (Oeste).
  - Rutas Rumbo Norte ($\text{lat}_{\text{destino}} > \text{lat}_{\text{origen}}$): Signo **Negativo ($-$)** $\rightarrow$ Abre el arco al Océano Pacífico (Oeste).
- **Regla 2 (Curvatura Proporcional a la Distancia)**:
  - Rutas Cortas ($D < 2^{\circ}$, ej. Ilo $\leftrightarrow$ Matarani): Magnitud base $= 0.15$.
  - Rutas Medianas ($2^{\circ} \le D < 6^{\circ}$, ej. Ilo $\leftrightarrow$ Mejillones): Magnitud base $= 0.35$.
  - Rutas Largas ($D \ge 6^{\circ}$, ej. Callao $\leftrightarrow$ Mejillones / Valparaíso): Magnitud base $= 0.60 + 0.05 \times (D - 6)$.
- **Escalonamiento Anti-Solapamiento**:
  - $\text{curveness} = \text{signo} \times (\text{magnitudBase} + \text{index} \times 0.08)$.

### 3.2. Sincronización Cronológica Multitramo ($i \times \frac{T}{N}$ delay)
- Para rotaciones de $N$ piernas (ej. $N = 3$: `ILO` $\rightarrow$ `CALLAO` $\rightarrow$ `MEJILLONES` $\rightarrow$ `ILO`), cada pierna $i$ ($0, 1, \dots, N-1$) recibe:
  - `period`: $T$ (tiempo total de rotación).
  - `delay`: $i \times \frac{T}{N} \times 1000$ ms.
- El misil recorre la pierna 0, al llegar al puerto destino sale el misil de la pierna 1, luego el misil de la pierna 2, **tocando el puerto origen al final y cerrando el loop completo del viaje**.

---

## ⚡ 4. Arquitectura de Trayectorias Polilineales Continuas en Bucle Cerrado y Contabilidad LADEN

### 4.1. Misil Unificado por Buque en Bucle Cerrado (`polyline: true`)
- **Concatenación de Puntos Bézier**: Para cada rotación completa del buque (ej. `Callao` $\rightarrow$ `Mejillones` $\rightarrow$ `Callao`), se concatenan los 20 puntos Bézier de la pierna de ida con los 20 puntos Bézier de la pierna de regreso en un **único arreglo de coordenadas polilineales** (`fullPolyCoords`).
- **Color Unificado de Buque**: El misil mantiene de forma ininterrumpida el **color de buque asignado** (ej. `#16A34A` Verde para Moquegua, `#DC2626` Rojo para Tablones, `#0EA5E9` Cían para rutas spot) durante toda la trayectoria.
- **Óvalo Elíptico en Mar Abierto**: Forma una elipse continua en el Océano Pacífico. El misil parte del puerto base, navega por el mar exterior, gira en el puerto destino, retorna por el mar interior y **toca el puerto origen cerrando el bucle redondo sin cambiar de color ni desaparecer**.

### 4.2. Contabilidad Estricta de Carga LADEN (Sin Inflación de Tonelaje)
- **Asignación Exclusiva LADEN**: Únicamente la pierna de salida/carga paga (Pierna 0 - **LADEN**) contabiliza y reporta el tonelaje de carga real contratado (ej. 180,000 MT).
- **Piernas de Lastre / Reposicionamiento (BALLAST)**: Las piernas de regreso/intermedias en vacío contabilizan `0 MT Paga`.
- **Tooltip Contextualizado**:
  - **Pierna LADEN**: Muestra `Carga Paga Transportada: N MT` y `Viajes Redondos Cerrados: N viajes`.
  - **Pierna BALLAST**: Muestra `Estado: Re-posicionamiento en Vacío (0 MT Paga)` y `Viajes Redondos Cerrados: N viajes`.
- **Resultado**: Elimina al 100% el error de multiplicación de tonelajes ($180,000 \times 3 = 540,000$ MT) y refleja con fidelidad el contrato charter party real.

### 4.3. Autopistas Marítimas Paralelas Concéntricas (`curvenessOffset`)
- Para evitar que rutas o rotaciones que comparten el mismo tramo de mar (ej. `ILO` $\leftrightarrow$ `MEJILLONES`) se solapen en pantalla, se aplica un offset dinámico de curvatura `(vIdx * 0.08 * offsetSign)`.
- Cada ruta navega en un **carril concéntrico paralelo independiente** en el Océano Pacífico, evitando el superposicionado.

### 4.4. Solución a la Condición de Carrera en React Context (`isBatchLoadingRef`)
- **Mutex `isBatchLoadingRef`**: Se implementó una referencia booleana en `ForecastContext_V2.tsx` que bloquea la ejecución duplicada del `useEffect` cuando el usuario carga un escenario desde el modal catálogo.
- **Arranque Limpio/Vacío**: Se eliminó la precarga automática hardcodeada de `PRIMER.MODELO.MODULAR` al abrir la app. La aplicación arranca 100% vacía y limpia.
- **Persistencia Global de Escenario**: Una vez cargado un escenario, este permanece activo en el `ForecastProvider_V2` al navegar libremente entre el Dashboard (`/dashboard`), Spaghetti Map (`/spaghetti-map`), Análisis Gráfico (`/graphic-analysis`) y Voyage Ledger (`/audit-ledger`), eliminando la pantalla en blanco y conservando limpia la pila de historial del navegador (Brave / Chrome).

---

## 🧐 5. Protocolo Benoit Blanc de Auditoría Pericial Visual (Rondas de Control de Calidad)

### 5.1. Ronda 1 — Auditoría Pericial Visual de Spaghetti Map y Navegación Contextual (15 de Agosto de 2026)

| # | ID / Punto Auditado | Observación del Usuario / Hallazgo Pericial | Causa Raíz Técnica Identificada | Solución Aplicada en Código | Estado Final |
|---|---|---|---|---|---|
| 1 | **Trazado de Pierna de Regreso** | Viaje solo mostraba pierna de ida; no se apreciaba el cierre del viaje redondo. | Las aristas se generaban en un solo sentido sin vincular la vuelta al puerto base. | Se estructuró la rotación como lista de piernas `[{A->B}, {B->A}]` con timing secuenciado. | 🟢 **RESUELTO** |
| 2 | **Invasión de Continente (Regla 1)** | Las curvas abombaban hacia el este cruzando la masa terrestre de Sudamérica. | Signos de curvatura en ECharts dependían de $+Y$ hacia abajo en SVG, invirtiendo la proyección terrestre. | Se estableció `sign = dLat <= 0 ? -1 : 1`, garantizando 100% de curvas abombando al Pacífico (Oeste). | 🟢 **RESUELTO** |
| 3 | **Continuidad Visual del Misil** | El misil cambiaba de color a mitad de camino, pareciendo dos buques distintos. | Cada pierna tenía asignada una serie `lines` independiente con colores por pierna. | Se unificaron las piernas en un único `polyline: true` con el color oficial del buque (`#16A34A` para Moquegua). | 🟢 **RESUELTO** |
| 4 | **Línea Gris Estática Misteriosa** | Aparecía una línea recta gris estática atravesando el mapa entre puertos. | La serie `graph` de ECharts estaba renderizando `links: edges` con la curvatura por defecto `0.2`. | Se vació `links: []` en la serie `graph` durante la vista de 1 mes, eliminando la línea gris. | 🟢 **RESUELTO** |
| 5 | **Duplicación de Tonelaje en Tooltip** | En viajes de 3 piernas con 180,000 MT, el tooltip mostraba 180,000 MT en cada pierna (pareciendo 540,000 MT). | El acumulador sumaba `effectiveTons` a todas las piernas por igual. | Se restringió la contabilidad de carga a la pierna **LADEN** (Pierna 0), asignando 0 MT paga a piernas **BALLAST**. | 🟢 **RESUELTO** |
| 6 | **Superposición de Rutas Compartidas** | Rutas directas e intermedias que compartían tramos (`ILO-MEJILLONES`) se dibujaban encimadas. | La curvatura base para el mismo par de puertos era idéntica para todas las rotaciones. | Se agregó un offset dinámico de curvatura `(vIdx * 0.08 * offsetSign)` para crear carriles concéntricos paralelos. | 🟢 **RESUELTO** |
| 7 | **Escenario Hardcodeado al Iniciar** | Al abrir `/dashboard` aparecía precargado `PRIMER.MODELO.MODULAR` sin haberlo seleccionado. | El `useEffect` inicial de `ForecastContext_V2` llamaba a `loadForecast` automáticamente al arrancar. | Se eliminó el bloque de auto-carga hardcodeada. La app inicia 100% limpia y vacía. | 🟢 **RESUELTO** |
| 8 | **Pantalla en Blanco al Cambiar de Herramienta** | Al cargar un escenario y pasar a ANGRAF o Spaghetti Map, la vista aparecía en blanco. | Carrera de peticiones: `handleLoadSelected` y el `useEffect` reactivo disparaban 2 simulaciones simultáneas abortándose mutuamente. | Se implementó el mutex `isBatchLoadingRef` en `ForecastContext_V2.tsx`, asegurando 1 sola simulación limpia y persistencia total. | 🟢 **RESUELTO** |
| 9 | **Desorientación del Botón Atrás (Brave)** | Presionar el botón Atrás nativo de Brave no regresaba al Dashboard. | Las redirecciones por estado nulo usaban `replace: true`, sobrescribiendo la pila de historial del navegador. | Se corrigió el flujo de estado y redirecciones sin `replace`, preservando la pila histórica intacta en Brave/Chrome. | 🟢 **RESUELTO** |
| 10 | **Despliegue a Producción (VPS)** | Despliegue de los parches y paquete de producción al VPS `91.108.125.253`. | Necesidad de actualizar el servidor de producción. | Ejecución del script `python deploy_forecast_kickoff.py` en `Push.VPS` con bundle compilado limpio `dist/`. | 🟢 **PUBLICADO** |

---

### 📷 Copias de Respaldos de Capturas PNG Asociadas:
1. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\spaghetti_map_round_trip_loop_issue.png`
2. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA\spaghetti_map_round_trip_loop_issue.png`
3. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs\spaghetti_map_green_vessel_and_grey_line_issue.png`
4. `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA\spaghetti_map_green_vessel_and_grey_line_issue.png`

---

*Documentación pericial actualizada y sincronizada en el repositorio maestro del proyecto PETRAL.*
