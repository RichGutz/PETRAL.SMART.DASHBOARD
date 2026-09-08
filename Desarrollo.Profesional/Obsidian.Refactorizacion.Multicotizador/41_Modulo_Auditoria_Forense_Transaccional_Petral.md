# 41. Libreta Pericial de Benoit Blanc - Módulo de Auditoría Forense Transaccional & Trazabilidad de 3 Capas en DELFOS (07.09.2026)

**Auditor a Cargo:** Detective Benoit Blanc (Auditor Pericial Implacable)  
**Caso Oficial:** "El Gran Libro Contable y la Huella Imborrable - Trazabilidad Integral en Base de Datos, Backend y Frontend para DELFOS SHIPPING SOFTWARE"  
**Fecha de Inicio:** 07 de Septiembre de 2026  
**Safe Point Previo:** `PRE.AUDIT.LEDGER.DELFOS.7.9.26`  
**URL Producción en Vivo:** `https://forecast.geeksoft.tech`  
**Servidor VPS:** `91.108.125.253` (Nginx + FastAPI + Systemd + Certbot SSL)  

---

## 1. 🕵️ BEN (Declaración Pericial y Filosofía del Método)

> *"Damas y caballeros: un sistema de gestión y cotizaciones de millones de dólares no puede depender de la buena fe. En auditoría forense, **si un cambio no tiene autor, timestamp y registro exacto del valor anterior contra el valor nuevo, el hecho no existe**.  
> Para blindar **DELFOS SHIPPING SOFTWARE**, diseñamos una arquitectura de trazabilidad en **3 Capas Complementarias**:  
> 1. **Capa Base de Datos (PostgreSQL Triggers + JSONB)**: Inviolable. Registra cada `INSERT`, `UPDATE` y `DELETE` calculando el delta matemático (`diff_data`), incluso si se modifica directamente la base de datos por consola.  
> 2. **Capa Backend (FastAPI Transaccional)**: Intercepta peticiones de negocio, inyecta la identidad del usuario en la transacción y guarda metadatos contextuales (IP, User-Agent, entidad afectada).  
> 3. **Capa Frontend (React + TypeScript)**: Telemetría no invasiva que rastrea exportaciones a Excel/PDF, cierres de mes y mutaciones de escenarios antes de persistir."*

---

## 2. 🔎 LEG (Legacy - La Escena del Crimen Previa)

### Archivos Auditados en el Estado Previo:
1. **Modelos y Routers:** [`Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/auth.py)
2. **Servicios Frontend:** [`Desarrollo.Profesional/Geeksoft_Frontend/src/services/api.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/api.ts)

### Cuadro Forense de Patologías Detectadas (LEGACY):
```
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| #   | LUGAR DEL CRIMEN           | EVIDENCIA EXTRAÍDA DE LA ESCENA (LEGACY)             | RIESGO & CAUSA TÉCNICA RAÍZ                    |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
| 1   | Modificación de Tarifas    | Solo se guardaba el valor final en la tabla          | Pérdida total del historial de precios previos |
| 2   | Acciones de Usuarios       | Cero trazabilidad de quién aprobó o modificó un dato | Imposibilidad de deslindar responsabilidades   |
| 3   | Exportaciones de Datos     | Descargas de Excel/PDF no registraban bitácora       | Fuga de información confidencial sin alertas   |
| 4   | Detección de Cambios       | No existía cálculo de delta o diff campo por campo   | Se desconocía qué atributo específico mutó     |
+-----+----------------------------+------------------------------------------------------+------------------------------------------------+
```

---

## 3. 🛡️ CLON (Respaldo y Puntos de Seguridad Inmutables)

* **Branch de Desarrollo Local:** `feature/audit-ledger-engine`
* **Safe Point Tag:** `git tag -a "PRE.AUDIT.LEDGER.DELFOS.7.9.26" -m "Safe Point: Previo a modulo de auditoria transaccional"`
* **Producción:** 🛑 **VPS Congelado durante la demo en vivo.**

---

## 4. 📐 DIFF (Cirugía Quirúrgica y Módulos Desarrollados)

### 4.1. Opción 2: Base de Datos PostgreSQL (Máxima Seguridad Pericial)
📁 **Archivo:** [`Desarrollo.Profesional/Geeksoft_Engine/migrations/create_audit_logs_engine.sql`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/migrations/create_audit_logs_engine.sql)

* **Tabla `audit_logs`**:
  ```sql
  CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      table_name VARCHAR(64) NOT NULL,
      record_id VARCHAR(64),
      action VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'EVENT'
      user_email VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
      ip_address VARCHAR(64),
      user_agent TEXT,
      old_data JSONB,
      new_data JSONB,
      diff_data JSONB,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```
* **Trigger PL/pgSQL (`process_audit_log_trigger`)**:
  Calcula automáticamente el objeto `diff_data` comparando clave por clave `OLD` vs `NEW` e inyecta el usuario activo de la sesión:
  ```sql
  SET LOCAL app.current_user_email = 'izavala@petral.com.pe';
  ```

---

### 4.2. Opción 1: Backend FastAPI / Python
📁 **Archivo:** [`Desarrollo.Profesional/Geeksoft_Engine/backend/services/audit_service.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/audit_service.py)

* **Métodos Principales:**
  * `AuditService.log_event(...)`: Registra eventos y diferencias de cualquier entidad de negocio.
  * `AuditService.get_audit_trail(...)`: Permite consultar el libro de auditoría filtrado por tabla, registro o correo de usuario.

---

### 4.3. Opción 3: Trazabilidad Frontend (React + TypeScript)
📁 **Archivo:** [`Desarrollo.Profesional/Geeksoft_Frontend/src/services/auditTracker.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/auditTracker.ts)

* **Eventos Rastreados:**
  * `EXPORT_EXCEL` / `EXPORT_PDF`: Con nombre de archivo y escenario.
  * `CIERRE_MES`: Registro de aprobación de cierres contables.
  * `SCENARIO_MUTATION`: Modificación de variables clave de viaje o bunker.
  * `LOGIN_ATTEMPT`: Trazabilidad de accesos y equipos.

---

## 5. 🔬 QC (Quality Control & Protocolo de Verificación en Terminal)

📁 **Script de Prueba:** [`Desarrollo.Profesional/Geeksoft_Engine/test_qc_audit_engine.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/test_qc_audit_engine.py)

```bash
=================================================================
  QC AUDIT: SIMULACIÓN DE MOTOR DE AUDITORÍA FORENSE
=================================================================

[1. Estado Anterior (OLD_DATA)]
  >> freight_rate: 24.50, demurrage_daily: 8500.0, status: DRAFT

[2. Estado Posterior (NEW_DATA)]
  >> freight_rate: 26.80, demurrage_daily: 9200.0, status: APPROVED

[3. Cálculo Pericial de Diferencias (DIFF_DATA)]
  >> freight_rate: {"old": 24.5, "new": 26.8}
  >> demurrage_daily: {"old": 8500.0, "new": 9200.0}
  >> status: {"old": "DRAFT", "new": "APPROVED"}

[4. Verificación de Inmutabilidad del Registro]
  >> Entrada de Auditoría Sellada: QUOTE-2026-089 por izavala@petral.com.pe ✓

=================================================================
  [EXITO] MOTOR DE AUDITORÍA Y TRAZABILIDAD VALIDADO (100% OK)
=================================================================
```

---

## 6. 📝 NOTA (Inventario de Archivos y Rutas Preparadas)

| Capa | Archivo Creado / Modificado | Propósito | Estado |
| :--- | :--- | :--- | :---: |
| **BD (Opción 2)** | [`create_audit_logs_engine.sql`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/migrations/create_audit_logs_engine.sql) | DDL Tabla `audit_logs` + Triggers PL/pgSQL con diff JSONB | ✅ Listo |
| **Backend (Opción 1)** | [`audit_service.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/audit_service.py) | Servicio interceptor y visor de bitácora forense | ✅ Listo |
| **Frontend UI Tabs** | [`UserAuditLedgerViewer.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/Audit/UserAuditLedgerViewer.tsx) | Interfaz visual interactiva con tabs por usuario y diffs | ✅ Listo |
| **Vista Audit Ledger** | [`AuditLedger_V2.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Tools/AuditLedger_V2.tsx) | Sub-navegación integrada: Trazabilidad de Usuarios vs Liquidaciones | ✅ Listo |
| **Frontend Telemetría** | [`auditTracker.ts`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/services/auditTracker.ts) | Telemetría fire-and-forget de acciones de usuario | ✅ Listo |
| **Prueba QC** | [`test_qc_audit_engine.py`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/test_qc_audit_engine.py) | Suite automatizada en terminal con cálculo de deltas | ✅ 100% OK |
| **Despliegue VPS** | Servidor de Producción | Estado de congelamiento durante demo | 🛑 Protegido |
