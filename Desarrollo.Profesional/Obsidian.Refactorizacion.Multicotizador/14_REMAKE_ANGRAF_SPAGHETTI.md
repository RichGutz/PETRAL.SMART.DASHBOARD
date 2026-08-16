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
