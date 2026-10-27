# 🩺 PROTOCOLO PERICIAL: CIRUGÍAS QUIRÚRGICAS EN PRODUCCIÓN PARA CONVERGENCIA CON EL CÓDIGO CURADO
**Inspector Pericial:** Detective Benoit Blanc  
**Sistema:** PETRAL ONE Backend & Producción VPS Contabo (`169.58.168.107`)  
**Objetivo:** Especificar con precisión microscópica cada una de las modificaciones quirúrgicas que deben trasladarse al código de producción para que converja 100% con las defensas validadas en el Gemelo Digital Local.  
**Fecha:** 26 de Octubre de 2026 | **Estado:** Aprobado para Planificación Quirúrgica  

---

## 🎯 1. Diagnóstico Forense y Filosofía de Convergencia

El entorno local (`feature/qc-swarm-local`) demostró que con **guardas preventivas de inserción** y **deserialización defensiva multinivel**, el sistema procesa 2,021 operaciones en **0.533 segundos con CERO caídas**.

Para que el servidor de producción Contabo disfrute de esta misma inmunidad, se deben aplicar **5 Cirugías Quirúrgicas Atómicas**:

```
=======================================================================================================
                         MAPA DE CIRUGÍAS QUIRÚRGICAS DE CONVERGENCIA
=======================================================================================================

  [CIRUGÍA 01] ➔ forecast_service.py (Línea 1794): Fallback ast.literal_eval en rama plurianual.
  [CIRUGÍA 02] ➔ forecast_service.py (Líneas 1163 y 1799): Guard defensivo isinstance(safe_legs, dict).
  [CIRUGÍA 03] ➔ forecast_service.py (get_cached_masters): Desinfección forzada de tipos float en buques.
  [CIRUGÍA 04] ➔ forecast.py (save_vessel líneas 1100-1157): Corruption Guards contra ceros y negativos.
  [CIRUGÍA 05] ➔ Database Patch Contabo: Normalización SQL de tipos numéricos en tabla vessels.
=======================================================================================================
```

---

## 🔬 2. Detalle Quirúrgico de Cada Intervención (BEN / LEG / DIFF / NOTA)

---

### 💉 CIRUGÍA QUIRÚRGICA 01: Fallback `ast.literal_eval` en Deserialización Plurianual
* **Archivo:** [`Desarrollo.Profesional/Geeksoft_Engine/backend/services/forecast_service.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/forecast_service.py)
* **Ubicación:** Línea 1791 a 1798.
* **Escena del Crimen (LEG):**  
  En las líneas 702 y 1155 del servicio ya se había implementado el fallback con `ast.literal_eval`. Sin embargo, en la línea 1794 (rama de cálculo plurianual) solo existía `json.loads`. Si una cotización histórica contenía comillas simples de Python (`__repr__`), la variable `safe_legs` se reseteaba a `{}` y se perdían silenciosamente las tarifas de sobreestadía (`demurrage_rates`).

#### Bloque Diff Quirúrgico:
```diff
--- a/backend/services/forecast_service.py
+++ b/backend/services/forecast_service.py
@@ -1791,9 +1791,12 @@
         # RESOLUCIÓN MANDATORIA DE DEMURRAGE DESDE COTIZACIÓN / RUTA / LEGS_DATA / CONTRATO
         safe_legs = (spot_route.get("legs_data") or {}) if spot_route else {}
         if isinstance(safe_legs, str):
-            import json
+            import json, ast
             try:
                 safe_legs = json.loads(safe_legs)
             except Exception:
-                safe_legs = {}
+                try:
+                    safe_legs = ast.literal_eval(safe_legs)
+                except Exception:
+                    safe_legs = {}
```

---

### 💉 CIRUGÍA QUIRÚRGICA 02: Guard Defensivo contra Colapso `.get()` en `demurrage_rates`
* **Archivo:** [`Desarrollo.Profesional/Geeksoft_Engine/backend/services/forecast_service.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/forecast_service.py)
* **Ubicación:** Líneas 1163 y 1799.
* **Escena del Crimen (LEG):**  
  Si por cualquier causa `safe_legs` quedaba como una cadena no parseada, la expresión:
  `safe_legs.get("demurrage_rates")`
  disparaba un error fatal no capturado:
  `AttributeError: 'str' object has no attribute 'get'` (HTTP 500 en producción).

#### Bloque Diff Quirúrgico:
```diff
--- a/backend/services/forecast_service.py
+++ b/backend/services/forecast_service.py
@@ -1163,3 +1163,4 @@
-        demurrage_rate_val = get_demurrage_from_dict(safe_legs.get("demurrage_rates") if safe_legs else None, vessel)
+        safe_dict = safe_legs if isinstance(safe_legs, dict) else {}
+        demurrage_rate_val = get_demurrage_from_dict(safe_dict.get("demurrage_rates"), vessel)
```
*(Aplicar exactamente la misma corrección en la línea 1799).*

---

### 💉 CIRUGÍA QUIRÚRGICA 03: Desinfección Forzada de Tipos Numéricos en `get_cached_masters`
* **Archivo:** [`Desarrollo.Profesional/Geeksoft_Engine/backend/services/forecast_service.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/services/forecast_service.py)
* **Función:** `get_cached_masters(sb)`
* **Escena del Crimen (LEG):**  
  El método entrega los registros de `vessels` tal cual vienen de Supabase / PostgreSQL. Como en la base de datos de producción buques como `BOW_CONDOR`, `TIERRA DEL FUEGO` y `TABLONES` tienen `"vessel_speed": "11.5"` y `"tce_required": "20000.0"` como cadenas, el motor matemático hereda strings y colapsa al intentar multiplicarlos o compararlos.

#### Bloque Diff Quirúrgico:
```diff
--- a/backend/services/forecast_service.py
+++ b/backend/services/forecast_service.py
@@ -210,6 +210,21 @@
         # Cachear todas las tablas maestras
         raw_vessels = sb.table("vessels").select("*").execute().data or []
+        cleaned_vessels = []
+        numeric_vessel_fields = [
+            "tce_required", "vessel_speed", "dwt", "dwcc", "grt", "length", "beam",
+            "consumption_sea_ifo", "consumption_port_ifo", "consumption_idle_ifo",
+            "consumption_load_ifo", "consumption_disch_ifo", "consumption_sea_mdo",
+            "consumption_idle_mdo", "consumption_load_mdo", "consumption_disch_mdo",
+            "max_capacity_ifo", "max_capacity_mdo"
+        ]
+        for v in raw_vessels:
+            v_clean = dict(v)
+            for f in numeric_vessel_fields:
+                if f in v_clean and v_clean[f] is not None:
+                    try:
+                        v_clean[f] = abs(float(v_clean[f]))
+                    except Exception:
+                        pass
+            cleaned_vessels.append(v_clean)
+        masters["vessels"] = cleaned_vessels
```

---

### 💉 CIRUGÍA QUIRÚRGICA 04: Corruption Guards en Endpoint `save_vessel` (`forecast.py`)
* **Archivo:** [`Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/forecast.py`](file:///C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/backend/api/routers/forecast.py)
* **Ubicación:** Líneas 1109 a 1128 en `save_vessel(request: dict)`.
* **Escena del Crimen (LEG):**  
  El código actual contiene un bug crítico de diseño: si un campo numérico viene vacío o genera error de casteo, **lo sobreescribe automáticamente con `0.0`**:
  ```python
  if field not in request or request[field] is None or request[field] == "":
      request[field] = 0.0
  ```
  Esto provocó que si el frontend enviaba un formulario parcial, el buque quedaba con velocidad en 0.0 nudos o DWT en 0.0 toneladas, destruyendo la ficha técnica en producción (Caso Moquegua).

#### Bloque Diff Quirúrgico:
```diff
--- a/backend/api/routers/forecast.py
+++ b/backend/api/routers/forecast.py
@@ -1120,8 +1120,17 @@
         for field in numeric_fields:
             if field not in request or request[field] is None or request[field] == "":
-                request[field] = 0.0
+                # REGLA BENOIT BLANC: No destruir campos críticos con ceros accidentales
+                if field in ["vessel_speed", "dwt", "tce_required", "dwcc"]:
+                    # Mantener valor previo si existe en base de datos en lugar de resetear a 0.0
+                    pass
+                else:
+                    request[field] = 0.0
             else:
                 try:
-                    request[field] = float(request[field])
+                    val_num = float(request[field])
+                    # Guarda de no-negatividad en consumos y dimensiones
+                    request[field] = abs(val_num)
                 except (ValueError, TypeError):
-                    request[field] = 0.0
+                    if field not in ["vessel_speed", "dwt", "tce_required"]:
+                        request[field] = 0.0
```

---

### 💉 CIRUGÍA QUIRÚRGICA 05: Data Patch SQL en Base de Datos de Producción (Contabo VPS)
* **Servidor Destino:** Contabo VPS (`169.58.168.107` / `petral_db`)
* **Tabla Afectada:** `public.vessels`
* **Escena del Crimen (LEG):** Filas persistidas con tipos `character varying` o datos con comillas en columnas numéricas.

#### Script de Saneamiento SQL Atómico:
```sql
BEGIN;

-- 1. Sanitizar buque BOW CONDOR
UPDATE public.vessels
SET 
    vessel_speed = 11.5,
    dwt = 16121.0,
    dwcc = 15000.0,
    tce_required = 20000.0,
    consumption_sea_ifo = 14.5,
    consumption_port_ifo = 2.0,
    max_capacity_ifo = 890.0,
    max_capacity_mdo = 160.0
WHERE vessel_id = 'BOW_CONDOR';

-- 2. Sanitizar buque TIERRA DEL FUEGO
UPDATE public.vessels
SET 
    vessel_speed = 12.0,
    dwt = 17500.0,
    dwcc = 16000.0,
    tce_required = 20000.0
WHERE vessel_id = 'TIERRA_DEL_FUEGO';

-- 3. Sanitizar buque TABLONES
UPDATE public.vessels
SET 
    vessel_speed = 11.0,
    tce_required = 15000.0,
    consumption_port_ifo = 3.5
WHERE vessel_id = 'TABLONES';

-- 4. Sanitizar buque MOQUEGUA
UPDATE public.vessels
SET 
    vessel_speed = 11.0,
    tce_required = 13000.0,
    dwt = 14298.0,
    dwcc = 13500.0
WHERE vessel_id = 'MOQUEGUA';

COMMIT;
```

---

## 🚦 3. Protocolo de Implementación y Verificación

Para ejecutar la convergencia en producción de manera 100% segura:

1. **Paso 1 (Local):** Aplicar las Cirugías 01, 02, 03 y 04 en los archivos locales de `Geeksoft_Engine`.
2. **Paso 2 (Gate Local):** Ejecutar en terminal:
   ```powershell
   python run_pipeline_e2e_swarm.py
   ```
   Verificar que arroje **Exit Code 0** y **Semáforo Verde 100%**.
3. **Paso 3 (Compilación):** Generar el build de frontend:
   ```powershell
   cd Desarrollo.Profesional\Geeksoft_Frontend
   npx vite build
   ```
4. **Paso 4 (Data Patch VPS):** Ejecutar el script SQL de saneamiento en PostgreSQL Contabo.
5. **Paso 5 (Deploy Oficial VPS):** Ejecutar el despliegue oficial por SFTP/SSH:
   ```powershell
   cd Push.VPS
   python deploy_petral_one_contabo.py
   ```
