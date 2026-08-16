# 15. Arquitectura del Sistema de Telemetría VPS, Consola de Diagnóstico ADMIN y Corrección de Navegación

**Proyecto:** PETRAL Smart Dashboard & MultiCotizador  
**Fecha:** 16 de Agosto de 2026  
**Servidor de Producción (VPS):** `91.108.125.253` | `https://forecast.geeksoft.tech`  
**Autor:** Antigravity AI Engine & Equipo de Desarrollo PETRAL  

---

## 1. Resumen Ejecutivo

Durante el proceso de auditoría y pruebas del módulo multincumplimiento comercial (Matriz Financiera, Análisis Gráfico, Spaghetti Map y Análisis Gráfico de Liquidaciones Reales), se identificó un comportamiento de pantalla en blanco provocado por:
1. **Doble envolvente de rutas protegidas (`ProtectedRoute`)** en `App_V2.tsx` con la bandera `replace={true}`, ocasionando un bucle de redirección en el historial al utilizar el botón "Atrás" del navegador nativo.
2. **Dimensionamiento de canvas a 0px en ECharts** durante las transiciones animadas de CSS de React Router.
3. **Falta de visibilidad de excepciones en el servidor VPS** para diagnosticar en tiempo real cualquier excepción JavaScript o renderizado en runtime.

Para resolver esto de forma definitiva y garantizar la entrega oportuna del software, se diseñó e implementó un **Sistema de Telemetría en Vivo** con registro en servidor VPS y una **Consola de Diagnóstico Flotante** para usuarios con rol `ADMIN`.

---

## 2. Componentes Creados y Modificados

### 2.1. Backend FastAPI (`Geeksoft_Engine`)
- **Archivo:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\api\routers\forecast.py`
- **Endpoint:** `POST /api/v1/forecast/telemetry-log`
- **Comportamiento:** Recibe payloads JSON con nivel de severidad (`INFO`, `WARN`, `ERROR`), URL, usuario activo, mensaje y stack trace de la excepción.
- **Ruta del Log en VPS:** Escribe de manera persistente con marca de tiempo UTC en:
  ```bash
  /opt/geeksoft_engine/frontend_runtime_errors.log
  ```

### 2.2. Frontend React — Servicio de Telemetría (`TelemetryLogger.ts`)
- **Archivo:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\TelemetryLogger.ts`
- **Listeners Globales:**
  - `window.addEventListener('error', ...)`: Captura excepciones JavaScript no controladas.
  - `window.addEventListener('unhandledrejection', ...)`: Captura promesas rechazadas sin bloque `catch`.
- **Transmisión:** Envía en segundo plano los eventos al endpoint del VPS sin bloquear la interacción del usuario.

### 2.3. Consola Flotante para Administradores (`TelemetryConsoleModal.tsx`)
- **Archivo:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\common\TelemetryConsoleModal.tsx`
- **Visualización:** Botón flotante discreto en la esquina inferior izquierda **"Telemetría VPS"** que cambia a tono rojo pulsante ante errores no leídos.
- **Seguridad:** Filtrado exclusivo por rol `user.role === 'ADMIN'`.

### 2.4. Integración en Plantilla Maestra (`MasterTemplate_V2.tsx`)
- **Archivo:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\Masters\MasterTemplate_V2.tsx`
- Se montó `<TelemetryConsoleModal />` en la raíz de la plantilla comercial para que la consola esté disponible en todos los módulos comercial/logísticos.

### 2.5. Corrección en Capturador de Errores de Renderizado (`ErrorBoundary.tsx`)
- **Archivo:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\common\ErrorBoundary.tsx`
- El método `componentDidCatch` envía automáticamente la pila de componentes de React (`componentStack`) al `TelemetryLogger`.

### 2.6. Corrección de Rutas e Historial Navegador (`App_V2.tsx`)
- **Archivo:** `C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\App_V2.tsx`
- Se eliminó la duplicidad de `<ProtectedRoute>` dentro de la ruta layout `<ToolsLayout_V2>`.
- Se corrigió `replace={false}` en las redirecciones para preservar el historial nativo del navegador al usar el botón "Atrás".

### 2.7. Auto-Resize de ECharts en Gráficas
- **Archivos:**
  - `LiquidationsInteractiveChart.tsx`
  - `InteractiveChart.tsx`
  - `SpaghettiMap.tsx`
- Se integró `useRef` con disparadores temporizados (`50ms`, `150ms`, `350ms`, `600ms`, `800ms`) que aseguran la re-evaluación del tamaño del canvas cuando las transiciones CSS de React Router concluyen.

---

## 3. Protocolo de Inspección en Producción

### Consulta de Logs desde VPS vía SSH:
```bash
ssh root@91.108.125.253
tail -f -n 100 /opt/geeksoft_engine/frontend_runtime_errors.log
```

### Consulta de Logs desde la Interfaz Web:
1. Iniciar sesión en `https://forecast.geeksoft.tech` con usuario `ADMIN`.
2. Hacer clic en el botón flotante **"Telemetría VPS"** situado en la esquina inferior izquierda.
3. Filtrar los registros por nivel (`ERROR`, `WARN`, `INFO`) y revisar la pila de excepciones.

---

## 4. Registro de Cambios y Commits Git

- **Rama Git:** `NOCHE.15.08.26`
- **Commits Clave:**
  - `bded412`: *fix(frontend): unifica reactividad de contexto, auto-resize en charts/mapa y desactiva auto-carga inicial para iniciar 100% en blanco*
  - `208752a`: *feat(telemetry): integra logger de telemetria VPS, consola ADMIN flotante y reestructura navegacion de ProtectedRoute y ECharts auto-resize*
- **Script de Despliegue VPS:**
  ```bash
  cd C:\Users\rguti\PETRAL.SMART.DASHBOARD\Push.VPS
  python deploy_forecast_kickoff.py
  ```
