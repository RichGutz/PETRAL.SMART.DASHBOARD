# 08: Refactorización Triángulo Multicotizador, Contratos y Matriz Comercial

**Fecha de Creación**: 14 de Agosto de 2026  
**Origen**: Acuerdo y especificaciones de la reunión con el cliente Joseph Zabala (Joseph Sabala RG)  
**Proyecto**: PETRAL Smart Dashboard / Geeksoft Engine  

---

## 1. Diagnóstico y Visión del Cambio

En la reunión del 14/08/2026 se identificó una desconexión crítica entre la riqueza de información que calcula el **Multicotizador** (tramos, piernas, tarifas, costos portuarios por terminal, consumo de búnker y vigencias) y la estructura estática de la tabla de contratos antigua (`contracts`).

### Decisiones Estratégicas de Diseño:
1. **Eliminación de la Creación Manual de Contratos**: Se elimina el botón "Agregar Contrato" y la vista "Libros de Contrato". Los contratos ya no se ingresarán como registros planos estáticos.
2. **El Multicotizador como Fuente Única de Verdad**: Los contratos nacen directamente de la cotización enriquecida en el Multicotizador y se "empujan" (*push*) a la tabla `contracts` conservando el 100% de la riqueza de data.
3. **Homologación de Esquema**: La tabla `contracts` adopta la misma estructura base que `routes_clients` y `routes_quotes` (`name`, `description`, `legs_data`, `pais`, `created_at`, `created_by`), permitiendo que todos los servicios y scripts realicen consultas polimórficas sin modificar lógica interna.

---

## 2. Resguardo de Control de Daños (Pasos A y B)

| Paso | Descripción | Estado | Detalle |
| :--- | :--- | :---: | :--- |
| **Paso A** | Rama de Resguardo Git | **COMPLETADO** | Rama `reunion-joseph-sabala-1408` creada; trabajo activo en `main`. |
| **Paso B** | Resguardo de Base de Datos Supabase | **COMPLETADO** | Tablas `contracts_backup` (5 registros) y `contract_tariffs_backup` (13 registros) creadas en PostgreSQL. Respaldo JSON en `scratch/backup_contracts_14_08_2026/`. |

---

## 3. Homologación de Esquema de la Tabla `contracts` (Paso C)

Se ejecutó la migración SQL [`20260814000012_homologate_contracts_schema.sql`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/supabase/migrations/20260814000012_homologate_contracts_schema.sql) para añadir las columnas estándar:

```sql
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS legs_data JSONB;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS pais VARCHAR(10) DEFAULT 'PE';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'izavala@petral.com.pe';
```

### Estructura del JSONB `legs_data` (Complejidad Enbebiendo Metadatos de Contrato):
```json
{
  "is_multicotizador": true,
  "contract_metadata": {
    "contract_id": "CTR-MARCONA-2026-01",
    "client_id": "MARCONA",
    "valid_from": "2026-01-01",
    "valid_to": "2028-12-31",
    "validity_years": 3,
    "contract_status": "ACTIVE"
  },
  "tramos": [ ... ],
  "puertosConfig": [ ... ],
  "vesselParams": { ... }
}
```

---

## 4. UI Multicotizador y Flujo de Validación

1. **Paso 5 (`5. VALIDEZ`)**:
   - Incorporado en la barra superior de pasos comerciales en [`MultiCotizadorExcel.tsx`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Frontend/src/components/CommercialForecast/MultiCotizadorExcel.tsx).
   - Incluye calendarios para fecha de **Inicio** (`validFrom`) y **Fin** (`validTo`).
   - Sin scrollbar horizontal (layout adaptativo compacto).
2. **Validación Estricta de Guardado**:
   - `handleSaveRoute` valida obligatoriamente que `validFrom` y `validTo` estén completadas antes de permitir el guardado.

---

## 5. Publicación en Producción VPS

- **Script Ejecutado**: `python deploy_forecast_kickoff.py` en `Push.VPS/`.
- **URL en Vivo**: [https://forecast.geeksoft.tech](https://forecast.geeksoft.tech)
- **Resultado**: Compilación limpia en 3.06s (Exit Code 0), reinicio de servicio `geeksoft-engine` y Nginx HTTPS desplegado.
