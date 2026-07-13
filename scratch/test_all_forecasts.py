import sys
import os
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation, run_forecast_simulation_universal
from backend.models.forecast_models import ForecastRequest, ProjectionLine
from dotenv import load_dotenv

load_dotenv(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\.env")

sb = get_supabase()

def test_all_saved_forecasts():
    print("=== TESTEANDO TODOS LOS ESCENARIOS GUARDADOS EN LA BD ===")
    
    # 1. Listar escenarios
    res = sb.table("commercial_forecasts").select("*").execute()
    forecasts = res.data
    print(f"Encontrados {len(forecasts)} escenarios en la base de datos.")
    
    for f in forecasts:
        f_id = f["id"]
        f_name = f["name"]
        print(f"\n--- Probando Escenario: {f_name} (ID: {f_id}) ---")
        
        # 2. Cargar lineas del escenario
        raw_lines = f.get("projection_lines", [])
        print(f"  -> Contiene {len(raw_lines)} líneas de proyección.")
        
        # Limpiar/preparar lineas
        projection_lines = []
        for rl in raw_lines:
            # Castear como lo hace el frontend
            qty = float(rl.get("quantity")) if rl.get("quantity") is not None else 0.0
            freq = float(rl.get("monthly_frequency")) if rl.get("monthly_frequency") is not None else 1.0
            tariff = float(rl.get("custom_tariff")) if rl.get("custom_tariff") is not None else None
            
            p_line = ProjectionLine(
                month_index=rl.get("month_index"),
                client_id=rl.get("client_id"),
                origin_port_id=rl.get("origin_port_id"),
                destination_port_id=rl.get("destination_port_id"),
                vessel_id=rl.get("vessel_id"),
                quantity=qty,
                monthly_frequency=freq,
                custom_tariff=tariff
            )
            projection_lines.append(p_line)
            
        if not projection_lines:
            print("  -> Sin líneas de proyección. Saltando.")
            continue
            
        # 3. Correr simulación
        request = ForecastRequest(
            start_date=f.get("start_date", "2026-07-01"),
            end_date=f.get("end_date", "2026-12-31"),
            projection_lines=projection_lines,
            port_cost_mode="matrix"
        )
        
        try:
            response = run_forecast_simulation(request)
            if response.get("status") == "success":
                print(f"  -> SUCCESS: Simulación estática ejecutada correctamente.")
            else:
                print(f"  -> FAILED (status != success): {response}")
        except Exception as e:
            print(f"  -> ERROR en modo estático: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_all_saved_forecasts()
