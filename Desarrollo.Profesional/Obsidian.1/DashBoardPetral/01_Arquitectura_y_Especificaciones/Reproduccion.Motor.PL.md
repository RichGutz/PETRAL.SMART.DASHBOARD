# 🏗️ Manual de Reproducción del Motor P&L (Versión 1)

Este documento contiene las instrucciones exactas, comandos y scripts utilizados para construir la arquitectura base de datos (Supabase) y el motor backend en Python (FastAPI + ReportLab) que genera el Ledger en PDF de 9 páginas. 

Si en el futuro la lógica de negocio cambia, se creará un directorio `Obsidian.2` y la IA de turno podrá usar este manual para reconstruir todo el ecosistema en minutos.

---

## 1. Inicialización de la Base de Datos (Supabase)
**Directorio de trabajo:** `Geeksoft_Engine`

**Comandos CLI:**
```powershell
npx supabase init
# Llenar variables en .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_PASSWORD)
npx supabase link --project-ref <ID_PROYECTO> --password <PASSWORD>
npx supabase db push
```

---

## 2. Dependencias del Motor de Python
**Comando de instalación:**
```powershell
pip install fastapi uvicorn supabase python-dotenv pytest reportlab pandas openpyxl pydantic
```

---

## 3. Scripts del Backend (Lógica y Conexión)

### Archivo: `backend/database.py`
```python
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
_supabase_client = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        _supabase_client = create_client(url, key)
    return _supabase_client
```

### Archivo: `backend/engine.py` (Lógica P&L Central)
```python
from backend.database import get_supabase

def calculate_voyage_pnl(inputs: dict) -> dict:
    Q = float(inputs.get("quantity", 0))
    F = float(inputs.get("freight_rate", 0))
    dist = float(inputs.get("route_distance", 0))
    speed = float(inputs.get("vessel_speed", 0))
    w_factor = float(inputs.get("weather_factor", 0))
    overhead = float(inputs.get("port_overhead_hours", 0))
    
    c_load = float(inputs.get("contract_agreed_load_rate") or 99999.0)
    v_intake = float(inputs.get("vessel_max_load_intake_limit", 0))
    t_load_rate = float(inputs.get("max_terminal_load_rate", 0))
    
    c_disch = float(inputs.get("contract_agreed_discharge_rate") or 99999.0)
    v_pump = float(inputs.get("vessel_pump_discharge_rate", 0))
    p_disch_limit = float(inputs.get("port_max_discharge_limit", 0))
    
    actual_load_rate = min(c_load, v_intake, t_load_rate)
    actual_discharge_rate = min(c_disch, v_pump, p_disch_limit)

    # 4. Cálculos de Tiempos (Itinerario Simulado)
    trip_multiplier = 2 if inputs.get("is_round_trip", True) else 1
    sea_days = ((dist * trip_multiplier) * (1 + w_factor)) / (speed * 24)
    
    # Granularidad Portuaria
    load_days = (Q / actual_load_rate) / 24
    disch_days = (Q / actual_discharge_rate) / 24
    idle_days = (overhead * 2) / 24
    port_days = load_days + disch_days + idle_days
    
    total_duration = sea_days + port_days

    # 5. Cálculos Financieros
    net_income = Q * F
    total_port_costs = float(inputs.get("agency_costs_origin", 0)) + float(inputs.get("agency_costs_destination", 0))
    
    # Consumo Dual-Fuel Granular
    ifo_tonnage = (sea_days * float(inputs.get("consumption_sea_ifo", 0))) + \
                  (idle_days * float(inputs.get("consumption_idle_ifo", 0))) + \
                  (load_days * float(inputs.get("consumption_load_ifo", 0))) + \
                  (disch_days * float(inputs.get("consumption_disch_ifo", 0)))
                  
    mdo_tonnage = (sea_days * float(inputs.get("consumption_sea_mdo", 0))) + \
                  (idle_days * float(inputs.get("consumption_idle_mdo", 0))) + \
                  (load_days * float(inputs.get("consumption_load_mdo", 0))) + \
                  (disch_days * float(inputs.get("consumption_disch_mdo", 0)))
    
    p_ifo = float(inputs.get("bunker_price_ifo", 0))
    p_mdo = float(inputs.get("bunker_price_mdo", 0))
    
    total_bunker_costs = (ifo_tonnage * p_ifo) + (mdo_tonnage * p_mdo)
    voyage_result = net_income - total_port_costs - total_bunker_costs

    return {
        "actual_load_rate": actual_load_rate, "actual_discharge_rate": actual_discharge_rate,
        "sea_days": sea_days, "port_days": port_days, "total_duration": total_duration,
        "total_bunker_costs": total_bunker_costs, "voyage_result": voyage_result
    }
```

---

## 4. Prueba Autorreplicable (Generador del PDF Ledger)
**Comando de Ejecución:**
```powershell
$env:PYTHONPATH="."; pytest backend/tests/test_voyage_ledger.py
```

### Archivo: `backend/tests/test_voyage_ledger.py`
Se itera sobre una matriz de `3 Barcos x 3 Rutas = 9 combinaciones`. En cada iteración, se inyectan las variables, se calcula el resultado con `calculate_voyage_pnl` y se instancia una nueva página `c.showPage()` en orientación `landscape(letter)` usando `ReportLab` para dibujar la grilla conceptual (izquierda) vs la grilla aritmética (derecha).

*Nota: El código fuente completo de la suite de pruebas se debe mantener en el repositorio para regenerar los reportes ante cualquier cambio.*
