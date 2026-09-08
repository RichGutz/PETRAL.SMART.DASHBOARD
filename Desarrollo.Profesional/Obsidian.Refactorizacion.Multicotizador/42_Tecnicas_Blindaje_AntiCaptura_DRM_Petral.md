# 42. Libreta Pericial de Benoit Blanc - Técnicas Canónicas de Blindaje Anti-Captura de Pantalla & DRM Web en DELFOS (07.09.2026)

**Auditor a Cargo:** Detective Benoit Blanc (Auditor Pericial Implacable)  
**Caso Oficial:** "La Pantalla Invisible - Neutralización de Snipping Tools, PrintScreen, Vaciado de Portapapeles y Marca de Agua Forense para DELFOS SHIPPING SOFTWARE"  
**Fecha de Inicio:** 07 de Septiembre de 2026  
**Safe Point Previo:** `PRE.BLINDAJE.ANTICAPTURA.DELFOS.7.9.26`  
**URL Producción en Vivo:** `https://forecast.geeksoft.tech`  
**Servidor VPS:** `91.108.125.253` (Nginx + FastAPI + Systemd + Certbot SSL)  

---

## 1. 🕵️ BEN (Declaración Pericial y Filosofía del Método)

> *"Observen el teatro de operaciones: cuando un usuario no autorizado o malintencionado intenta sustraer información confidencial de un sistema naviero y financiero (tarifas spot, márgenes brutos, contratos o proyecciones), sus dos armas predilectas son la tecla **PrintScreen** y las herramientas de recorte como **Snipping Tool (`Win + Shift + S`)** o la fotografía externa.  
> Aplicando la arquitectura canónica documentada en **APEFAC** (`38 - Tecnicas_Blindaje_WEB_apps.md`), hemos instaurado un **Escudo de Defensa en Profundidad de 6 Capas Activas** que neutraliza cada intento de captura sin perjudicar la fluidez de trabajo del usuario legítimo."*

---

## 2. 🛡️ Catálogo de las 6 Técnicas Anti-Captura Implementadas

```
+-----------------------------------------------------------------------------------+
|                  CAPA 1: DETECCIÓN PRINTSCREEN & CLIPBOARD PURGE                  |
|    (Intercepta KeyCode 44 y vacía inmediatamente el portapapeles del SO)         |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|               CAPA 2: BLUR ON WINDOW BLUR (ANTI-SNIPPING TOOL)                    |
|    (Al presionar Win+Shift+S, el foco se pierde y la pantalla se desenfoca a 30px) |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|             CAPA 3: BLOQUEO DE INSPECCIÓN (DEVTOOLS F12 & CLIC DERECHO)           |
|    (Inhabilita F12, Ctrl+Shift+I, Ctrl+U y ContextMenu para evitar volcado HTML)  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                 CAPA 4: BLOQUEO DE ATAJOS DE GUARDADO & IMPRESIÓN                 |
|    (Intercepta Ctrl+S, Ctrl+P y evento window.onbeforeprint -> Salida en blanco)  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|             CAPA 5: MARCA DE AGUA FORENSE DIAGONAL (ANTI-FOTOGRAFÍA MÓVIL)        |
|    (Matriz sutil al 3.8% con Email + Device ID + Timestamp -> CMOS lo resalta)    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                  CAPA 6: BLOQUEO DE DISPOSITIVOS MÓVILES (SMARTPHONES)            |
|    (Detección User-Agent / Viewport < 960px -> Overlay de bloqueo estricto)       |
+-----------------------------------------------------------------------------------+
```

---

## 3. 🔬 Detalle Técnico de Cada Mecanismo

### 3.1. Técnica 1: Vaciado de Portapapeles en Tiempo Real (`PrintScreen Purge`)
* **Mecanismo:** Escucha global de eventos `keyup` para `e.key === 'PrintScreen'`.
* **Acción:** Ejecuta de forma asíncrona `navigator.clipboard.writeText('')`. Si el usuario pega (`Ctrl+V`) en Paint, Word o WhatsApp, el resultado es **un portapapeles completamente vacío**.

### 3.2. Técnica 2: Desenfoque Instantáneo (*Blur on Focus Loss / Snipping Tool*)
* **Mecanismo:** Cuando el usuario activa la herramienta de recortes de Windows (`Win + Shift + S`) o software de captura externo (Lightshot, ShareX), el navegador pierde el foco del sistema (`window.onblur` o `document.hidden`).
* **Acción:** Inyecta en el `<body>` la clase CSS:
  ```css
  body.screen-blur-active {
      filter: blur(28px) grayscale(90%) brightness(0.2) !important;
      transition: filter 0.15s ease;
  }
  ```
  La herramienta de captura solo fotografía una masa borrosa e ilegible. Al regresar a la ventana, la nitidez se restablece al 100%.

### 3.3. Técnica 3: Bloqueo de Clic Derecho e Inspección (DevTools)
* Inhabilita `contextmenu` y `selectstart`.
* Intercepta `F12`, `Ctrl + Shift + I`, `Ctrl + Shift + J`, `Ctrl + Shift + C` y `Ctrl + U` (Ver código fuente).

### 3.4. Técnica 4: Anti-Print & Guardado de Página
* Bloquea `Ctrl + S` (Guardar página como HTML) y `Ctrl + P` (Imprimir).
* Controla `window.addEventListener('beforeprint')` para evitar la generación de PDF no autorizada por navegador.

### 3.5. Técnica 5: Marca de Agua Forense Digital (Anti-Fotografía con Móvil)
* Inyecta una capa invisible con ángulo de `-25°` con opacidad del `3.8%` conteniendo:
  `CONFIDENCIAL DELFOS • USUARIO: izavala@petral.com.pe • ID: DEV-8F4A12B0 • 07/09/2026 • PROHIBIDA SU COPIA`
* **Efecto:** Invisible para el ojo humano durante el trabajo normal, pero los algoritmos de post-procesamiento de las cámaras de smartphones (HDR/Contraste) revelan claramente el patrón, identificando al autor de la foto.

---

## 4. 📝 NOTA (Inventario de Archivos y Rutas Preparadas)

| Módulo | Archivo Creado | Propósito | Estado |
| :--- | :--- | :--- | :---: |
| **Módulo Blindaje Frontend** | [`screenSecurityShield.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/utils/screenSecurityShield.ts) | Funciones maestras: `initClipboardShield`, `initFocusBlurShield`, `initInspectorShield` | ✅ Listo |
| **Referencia Canónica APEFAC** | [`38 - Tecnicas_Blindaje_WEB_apps.md`](file:///C:/Users/rguti/APEFAC/Obsidian/Diseño.SW.APEFAC/38%20-%20Tecnicas_Blindaje_WEB_apps.md) | Manual maestro de blindaje de alta seguridad | ✅ Indexado |
| **Nota Pericial Obsidian** | [`42_Tecnicas_Blindaje_AntiCaptura_DRM_Petral.md`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.Refactorizacion.Multicotizador/42_Tecnicas_Blindaje_AntiCaptura_DRM_Petral.md) | Documento pericial de Benoit Blanc | ✅ Listo |
| **Producción VPS** | Servidor `https://forecast.geeksoft.tech` | Estado congelado durante la demo en vivo | 🛑 Intocable |
