# 🕵️ CATÁLOGO FORENSE: ESCENAS DEL CRIMEN LEGACY Y PATRONES DE CURA DEFENSIVA
**Autor:** Detective Benoit Blanc  
**Entorno Investigado:** Base de Datos Real de Producción Contabo (`petral_db`)  
**Archivos Analizados:** `Local_Database/json_tables/vessels.json`, `routes_quotes.json`, `forecast_service.py`  
**Estado:** Todos los casos resueltos, tipificados y documentados con código de cura.

---

## 🎯 1. Introducción: La Escena del Crimen en Producción

Durante el despliegue del Gemelo Digital Local, el equipo no inventó datos sintéticos: **extrajo directamente las 31 tablas de producción de PostgreSQL**. Al someter estos datos a las guardas estrictas de validación, salieron a la luz los vicios y malas prácticas que históricamente provocaron caídas silenciosas en el Multicotizador y la Matriz Financiera.

A continuación se detalla cada escena del crimen pericial, su impacto y el patrón de código exacto utilizado para neutralizarla.

---

## 🔬 2. Los 4 Casos Forenses Identificados

### 🩸 CASO FORENSE 01: El Vicio de las Fichas Técnicas Navales como Texto (`str`) en `vessels`

#### A. Evidencia Material (LEG):
Al examinar la primera línea de `Local_Database/json_tables/vessels.json`, se constató que prácticamente **todos los campos de ingeniería naval estaban almacenados como texto con comillas**:
```json
[
  {
    "vessel_id": "BOW_CONDOR",
    "vessel_name": "BOW CONDOR",
    "dwt": "16121.0",
    "vessel_speed": "11.5",
    "consumption_sea_ifo": "14.5",
    "consumption_port_ifo": "2.0",
    "tce_required": "20000.0",
    "dwcc": "15000.0",
    "length": "133.0",
    "beam": "22.7",
    "grt": "9232.0"
  },
  {
    "vessel_id": "MOQUEGUA",
    "vessel_speed": "11.0",
    "tce_required": "13000.0"
  }
]
```

#### B. Mecánica del Colapso:
* En Python, `"11.5" * 2` no es `23.0`, sino `"11.511.5"`.
* Comparaciones del tipo `vessel_speed <= 0` lanzaban excepciones inmediatas:
  `TypeError: '<=' not supported between instances of 'str' and 'int'`.
* Formularios o scripts de migración antiguos insertaban directamente los strings del frontend sin conversión numérica previa en el backend.

#### C. Patrón de Cura Defensiva (BEN):
Se implementó en `agent_master_ingest.py` el desinfector preventivo `_sanitize_vessel_payload`:
```python
def _sanitize_vessel_payload(self, v_dict: Dict[str, Any]) -> Dict[str, Any]:
    clean = dict(v_dict)
    numeric_fields = [
        "tce_required", "vessel_speed", "dwt", "dwcc", "grt", "length", "beam",
        "consumption_sea_ifo", "consumption_port_ifo", "consumption_idle_ifo",
        "consumption_load_ifo", "consumption_disch_ifo", "consumption_sea_mdo",
        "consumption_idle_mdo", "consumption_load_mdo", "consumption_disch_mdo",
        "max_capacity_ifo", "max_capacity_mdo"
    ]
    for f in numeric_fields:
        if f in clean and clean[f] is not None:
            try:
                clean[f] = abs(float(clean[f]))
            except Exception:
                pass
    return clean
```

---

### 🩸 CASO FORENSE 02: Corrupción de Serialización en `legs_data` (`routes_quotes`)

#### A. Evidencia Material (LEG):
En la tabla `routes_quotes`, la columna `legs_data` (que almacena la secuencia de tramos, puertos y toneladas) contenía cadenas serializadas con comillas simples (representación `__repr__` de dicts en Python):
```text
"{'tramos': [{'port_id': 'ILO', 'type': 'LADEN', 'cargo_mt': 13500.0, 'draft_limit': 9.5}], 'demurrage_rates': {'spcc': 22000.0}}"
```

#### B. Mecánica del Colapso:
El estándar JSON **prohíbe estrictamente las comillas simples**. Al invocar `json.loads(legs_data)`, Python disparaba:
```text
json.decoder.JSONDecodeError: Expecting property name enclosed in double quotes: line 1 column 2
```
Al fallar la deserialización, la variable quedaba como un `str` crudo, y llamadas posteriores colapsaban con:
```text
AttributeError: 'str' object has no attribute 'get'
```

#### C. Patrón de Cura Defensiva (BEN):
Se incorporó en `local_twin_adapter.py` un parser de doble compuerta con fallback automático:
```python
import json
import ast

def safe_parse_json(val_str: str) -> Any:
    val_clean = val_str.strip()
    try:
        return json.loads(val_clean)
    except Exception:
        try:
            return ast.literal_eval(val_clean)
        except Exception:
            return {}
```

---

### 🩸 CASO FORENSE 03: Falla de Deserialización en `demurrage_rates` (`forecast_service.py`)

#### A. Evidencia Material (LEG):
En `forecast_service.py`, líneas 1150 y 1785, el código asumía que `safe_legs` era invariablemente un diccionario:
```python
# Código vulnerable legacy:
rate = safe_legs.get("demurrage_rates", {}).get(client_id, 20000.0)
```
Si `safe_legs` era una cadena (por el fallo del Caso 02), el servidor FastAPI arrojaba un **Error HTTP 500 fatal no capturado**.

#### B. Patrón de Cura Defensiva (BEN):
Blindaje defensivo garantizando que la entidad sea dict antes de la invocación:
```python
if isinstance(safe_legs, str):
    safe_legs = safe_parse_json(safe_legs)
if not isinstance(safe_legs, dict):
    safe_legs = {}

dem_rates = safe_legs.get("demurrage_rates") if isinstance(safe_legs.get("demurrage_rates"), dict) else {}
rate = dem_rates.get(client_id, 20000.0)
```

---

### 🩸 CASO FORENSE 04: Invariante Roto de Frecuencia Cero en la Matriz Financiera

#### A. Evidencia Material (LEG):
En la Matriz Financiera de 12 meses, cuando un cliente no tenía viaje programado en un mes específico (`monthly_frequency = 0`), ciertos cálculos heredados arrastraban días fijos de estadía portuaria (ej. 2.5 días), inflando ficticiamente los costos de arriendo de la nave (`Hire Expense`) para un viaje inexistente.

#### B. Regla Comercial Inviolable (Rúbrica ABIDE):
> **Si `monthly_frequency == 0`, el buque no navega ese mes para esa ruta. Por lo tanto, `total_duration` DEBE ser exactamente `0.0` días y todos los costos asociados deben ser `0.00` USD.**

#### C. Patrón de Verificación del QC Sentinel (BEN):
```python
# Auditoría en agent_qc_sentinel.py:
freq = float(m_data.get("freq", 1.0))
duration = m_data.get("total_duration", 0.0)

if freq == 0:
    if duration != 0.0:
        self.violations.append({
            "agent": agent_name,
            "rule": "INVARIANT_ZERO_FREQUENCY_DURATION",
            "detail": f"freq=0 pero total_duration={duration} (requiere 0.0)"
        })
        all_ok = False
```

---

## 🏛️ 3. Mandamientos para Desarrolladores

Para que PETRAL ONE mantenga su robustez de clase mundial:

1. **Nunca confiar en el tipo de dato que llega del cliente:** Forzar siempre `float(x)` o `int(x)` en los DTOs de Pydantic.
2. **Nunca serializar objetos con comillas simples:** Usar siempre `json.dumps()` estándar en los servicios de guardado.
3. **Validar antes de persistir:** Toda mutación de buques o puertos debe pasar por los validadores del Sandbox antes de tocar la base de datos.
4. **Correr el Pipeline E2E antes de cada deploy:**
   ```powershell
   python run_pipeline_e2e_swarm.py
   ```
   Si la terminal no arroja **Semáforo Verde 100%**, el deploy a producción está terminantemente vetado.
