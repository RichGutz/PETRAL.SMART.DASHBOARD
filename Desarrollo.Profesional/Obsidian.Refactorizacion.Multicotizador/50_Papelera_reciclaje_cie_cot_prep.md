# 🗑️ ARQUITECTURA MAESTRA: Papelera de Reciclaje Transversal para Maestros Comerciales (Cierres, Cotizaciones, Presupuestos y Matrices) y Protocolo de Restauración Forense

> **Documento:** Especificación Técnica, Modelo de Datos y Plan de Ejecución (Benoit Blanc Protocol)  
> **Sistema:** PETRAL ONE (`SHIPPING.SOFT ENTERPRISE`)  
> **Módulos Afectados:** Maestros Comerciales (Cierres / COA, Cotizaciones / Spot, Presupuestos / PPTOS, Matrices Comerciales)  
> **Servidor Oficial de Producción:** VPS Contabo (`169.58.168.107` / `petral-backend` / PostgreSQL `petral_db`)  
> **Fecha de Emisión:** 15 de Octubre de 2026  
> **Estado:** 📋 Plan Estructurado para Aprobación y Ejecución  

---

## 1. 📌 Diagnóstico Forense y Escena del Crimen (LEG)

### 1.1 El Problema Estructural
Actualmente en el sistema PETRAL ONE, cuando un usuario hace clic en el botón de eliminar de cualquier documento en los Maestros Comerciales:
- **Maestro de Cierres (`/contracts`)**
- **Maestro de Cotizaciones (`/forecast`)**
- **Maestro de Presupuestos (`/budgets`)**
- **Maestro de Matrices (`/contract_tariffs`, `/port_costs_matrix`)**

El endpoint backend [`DELETE /api/v1/forecast/spot/{spot_id}`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/forecast.py#L790) ejecuta un **Hard Delete (borrado destructivo e irreversible)** directo con SQL:
```sql
DELETE FROM routes_quotes WHERE name = '...';
DELETE FROM routes_clients WHERE name = '...';
DELETE FROM contracts WHERE name = '...';
```
No existía ningún mecanismo de contención, respaldo previo, ni reversión (Undo). Si un usuario operativo comete un error, el documento desaparece de la base de datos de producción instantáneamente.

### 1.2 El Incidente Forense de la Capacitación
Durante la capacitación con el equipo comercial de Petral, el usuario **Jorge Neyra** (`jneyra@petral.com.pe`) eliminó accidentalmente **3 documentos de Cierres (COA)**. 
Tras la auditoría forense en los respaldos (`scratch/all_quotes.json` y `supabase_emergency_backup_20260921`), se identificaron con precisión los registros eliminados que deben ser restituidos:
1. `SPCC.MARCONA.CALLAO.MARCONA.18.09 BUNKER` (COA Cliente Activo - Creado por Jorge Neyra)
2. `SPCC.ILO.CALLAO.MEJILLONES.ILO.18.09 TABLONES 2` (COA Cliente Activo - Creado por Jorge Neyra)
3. Cierres estándar de la serie COA 2025-2027 Tablones/Moquegua presentes en los backups locales.

---

## 2. 🏛️ Diseño de Arquitectura: Papelera de Reciclaje Transversal (`commercial_trash_bin`)

En lugar de borrar físicamente los registros, el sistema implementará un **Intercambiador de Borrado Seguro (Safe Soft-Delete Interceptor)** respaldado por una tabla canónica en PostgreSQL.

### 2.1 Modelo E-R de la Tabla `commercial_trash_bin`

```sql
CREATE TABLE IF NOT EXISTS commercial_trash_bin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,       -- 'CIERRE', 'COTIZACION', 'PRESUPUESTO', 'MATRIZ'
    entity_id VARCHAR(255) NOT NULL,        -- Clave original (name, contract_id, rule_id, etc.)
    source_table VARCHAR(100) NOT NULL,     -- 'routes_quotes', 'routes_clients', 'contracts', 'contract_tariffs'
    document_name VARCHAR(255) NOT NULL,    -- Nombre visible para el operador
    client_name VARCHAR(100),               -- SPCC, NEXA, etc.
    vessel_id VARCHAR(100),                 -- Buque asignado si aplica
    payload JSONB NOT NULL,                 -- Snapshot completo del registro con piernas (legs_data), tarifas, etc.
    deleted_by VARCHAR(150) NOT NULL,       -- Email del usuario que ejecutó el borrado
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    restored BOOLEAN DEFAULT FALSE,         -- Flag de si ya fue recuperado
    restored_at TIMESTAMP WITH TIME ZONE,
    restored_by VARCHAR(150)
);

-- Índices para búsqueda ultra-rápida en la UI de papelera
CREATE INDEX IF NOT EXISTS idx_trash_entity_type ON commercial_trash_bin(entity_type);
CREATE INDEX IF NOT EXISTS idx_trash_restored ON commercial_trash_bin(restored);
CREATE INDEX IF NOT EXISTS idx_trash_deleted_at ON commercial_trash_bin(deleted_at DESC);
```

### 2.2 Clasificación de Documentos en la Papelera
| Tipo (`entity_type`) | Módulo de Origen | Tabla de Origen | Criterio de Identificación |
|---|---|---|---|
| **`CIERRE`** | Maestro de Cierres | `routes_quotes` / `contracts` | `description = 'COA Cliente Activo'` o COA |
| **`COTIZACION`** | Maestro de Cotizaciones | `routes_quotes` | `description = 'Cotización Prospecto'` o `category = 'SPOT'` |
| **`PRESUPUESTO`** | Maestro de Presupuestos | `routes_quotes` | `description = 'Presupuesto'` o `is_budget = true` |
| **`MATRIZ`** | Matrices Comerciales | `contract_tariffs` | Tarifas contractuales cliente-destino |

---

## 3. 🔄 Flujos Operativos y Transición de Estados

### Flujo 1: Borrado Seguro (Move to Trash)
```mermaid
sequenceDiagram
    autonumber
    actor Operador as Usuario Comercial
    participant UI as Maestro Comercial (UI)
    participant API as FastAPI Backend (/spot/{id})
    participant Trash as commercial_trash_bin
    participant Source as Tabla Origen (routes_quotes)

    Operador->>UI: Clic en "Eliminar Documento"
    UI->>API: DELETE /api/v1/forecast/spot/{spot_id} (con auth header)
    API->>Source: SELECT * WHERE name = spot_id
    Source-->>API: Retorna Snapshot Completo (JSON)
    API->>Trash: INSERT INTO commercial_trash_bin (entity_type, payload, deleted_by)
    API->>Source: DELETE FROM routes_quotes WHERE name = spot_id
    API-->>UI: 200 OK {"status": "moved_to_trash", "trash_id": "..."}
    UI-->>Operador: Notificación: "Documento movido a la Papelera de Reciclaje"
```

### Flujo 2: Restauración a Origen (Undo / Restore)
```mermaid
sequenceDiagram
    autonumber
    actor Operador as Usuario Comercial
    participant UI as Vista Papelera de Reciclaje
    participant API as FastAPI Backend (/trash/restore/{id})
    participant Trash as commercial_trash_bin
    participant Source as Tabla Origen (routes_quotes)

    Operador->>UI: Clic en "Restaurar" en el documento
    UI->>API: POST /api/v1/forecast/trash/{trash_id}/restore
    API->>Trash: SELECT source_table, payload FROM commercial_trash_bin WHERE id = trash_id
    Trash-->>API: Retorna payload JSONB
    API->>Source: UPSERT INTO {source_table} VALUES (payload)
    API->>Trash: UPDATE commercial_trash_bin SET restored = TRUE, restored_at = NOW()
    API-->>UI: 200 OK {"status": "restored"}
    UI-->>Operador: Notificación: "Documento retornado exitosamente a su Maestro de origen"
```

---

## 4. 🖥️ Especificación de la Interfaz UI (Frontend)

### 4.1 Ubicación en la Navegación
- **Ribbon Superior de Maestros Comerciales:**
  - Agregar un botón accesible y elegante con icono `Trash2`: **"Papelera de Reciclaje"**, con un badge numérico que muestre la cantidad de elementos eliminados recuperables.
- **Ruta Dedicada:** `/commercial-trash` o Modal Integrado en Maestros Comerciales.

### 4.2 Controles y Grilla Forense de la Papelera
1. **Filtros Rápidos:**
   - Tabs: `Todos`, `Cierres (COA)`, `Cotizaciones`, `Presupuestos`, `Matrices`.
   - Selector de Cliente (`SPCC`, `NEXA`, etc.).
   - Filtro por Usuario que eliminó (`Jorge Neyra`, `Iosef Zavala`, etc.).
   - Barra de búsqueda por nombre de documento o buque.
2. **Columnas de la Tabla:**
   - `Tipo` (Badge con color: Verde para Cierre, Azul para Cotización, Ámbar para Presupuesto, Púrpura para Matriz).
   - `Nombre del Documento`.
   - `Cliente` y `Buque`.
   - `Eliminado Por` (Usuario).
   - `Fecha de Eliminación` (Hace X días / fecha exacta).
   - `Acciones`:
     - **Botón "Restaurar" (Verde):** Devuelve el documento de inmediato a su maestro activo.
     - **Botón "Ver Snapshot" (Azul):** Modal emergente de solo lectura para inspeccionar las piernas, costos y flete antes de restaurar.
     - **Botón "Purgar Definitivo" (Rojo - Solo ADMIN):** Eliminación permanente de la base de datos tras confirmación explícita.

---

## 5. 🚀 Plan de Ejecución Paso a Paso

### Fase 1: Creación de la Tabla `commercial_trash_bin` en Producción
- Ejecutar script SQL en PostgreSQL (`petral_db` en Contabo y local) creando la tabla `commercial_trash_bin` con soporte JSONB e índices.

### Fase 2: Implementación de Endpoints en el Backend (`forecast.py`)
1. `GET /api/v1/forecast/trash`: Lista documentos eliminados (con filtros por `entity_type`, `client`, etc.).
2. `POST /api/v1/forecast/trash/{trash_id}/restore`: Restaura el registro a su tabla de origen usando `TableQuery.upsert()`.
3. `DELETE /api/v1/forecast/trash/{trash_id}/purge`: Borrado permanente (restringido a rol ADMIN).
4. **Modificación del endpoint actual `DELETE /forecast/spot/{spot_id}`**: Antes de borrar, capturar el registro completo y guardarlo en `commercial_trash_bin`.

### Fase 3: Ingesta y Restauración de los 3 Cierres Borrados por Jorge Neyra
- Inyectar los 3 registros identificados desde el backup directamente a la papelera (o restaurarlos a `routes_quotes` con flag de trazabilidad), garantizando que ningún dato comercial se haya perdido.

### Fase 4: Construcción de la Vista Frontend
- Crear componente [`CommercialTrashMaster.tsx`](file:///c:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/pages/Masters/CommercialTrashMaster.tsx) integrado en la navegación de Maestros Comerciales con diseño moderno (IBM Carbon + Tailwind).

### Fase 5: Verificación Empírica y Despliegue a VPS Contabo
- Probar el flujo completo en terminal y navegador: Crear coti/cierre $\rightarrow$ Borrar $\rightarrow$ Aparece en Papelera $\rightarrow$ Restaurar $\rightarrow$ Reaparece intacto en el maestro.
- Compilar bundle con `npx vite build` y desplegar a Contabo con `deploy_petral_one_contabo.py`.

---

## 6. ✅ Criterios de Aceptación (QC Gate)
- [ ] Todo borrado en Cierres, Cotis, Pptos o Matrices almacena el snapshot completo en `commercial_trash_bin`.
- [ ] Ningún dato se pierde por error humano u operativo.
- [ ] Cualquier operador puede restaurar un documento a su maestro de origen con un solo clic.
- [ ] Los 3 cierres eliminados por Jorge Neyra quedan 100% restablecidos en la plataforma.
