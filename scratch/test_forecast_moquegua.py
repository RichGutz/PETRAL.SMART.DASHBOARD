import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def test_moquegua_forecast():
    print("=== SIMULANDO FORECAST DE PRUEBA PARA BT MOQUEGUA ===")
    
    lines = [
        ProjectionLine(
            client_id="SPCC",
            vessel_id="MOQUEGUA",
            origin_port_id="ILO",
            destination_port_id="MEJILLONES",
            quantity=13500,
            month_index="1",
            monthly_frequency=1,
            forecast_bunker_price_ifo=450,
            forecast_bunker_price_mdo=800
        )
    ]
    
    request = ForecastRequest(
        projection_lines=lines,
        start_date="2026-07-01",
        end_date="2026-12-31",
        port_cost_mode="static"
    )
    
    try:
        response = run_forecast_simulation(request)
        if response.get("status") == "success":
            agg_data = response["aggregated_data"]["SPCC"]
            res_mejillones = agg_data["ILO-MEJILLONES"]["MOQUEGUA"]["1"]
            total_port_unit = res_mejillones["total_port_costs_unit"]
            breakdown = res_mejillones.get("port_costs_breakdown", {})
            raw_in = res_mejillones.get("raw_inputs", {})
            
            print("\n--- Tramo: ILO - MEJILLONES ---")
            print(f"  -> Costo Portuario Unitario total: ${total_port_unit:,.2f} USD")
            print(f"  -> agency_costs_origin (ILO) inyectado: ${raw_in.get('agency_costs_origin'):,.2f} USD")
            print(f"  -> agency_costs_destination (MEJILLONES) inyectado: ${raw_in.get('agency_costs_destination'):,.2f} USD")
            print(f"  -> Desglose de Origen (ILO): {breakdown.get('origin')}")
            print(f"  -> Suma de Desglose Origen (ILO): {sum(breakdown.get('origin', {}).values())}")
            print(f"  -> Desglose de Destino (MEJILLONES): {breakdown.get('destination')}")
            print(f"  -> Suma de Desglose Destino (MEJILLONES): {sum(breakdown.get('destination', {}).values())}")
            
        else:
            print(f"Error en la simulación: {response}")
    except Exception as e:
        print(f"ERROR durante la simulación: {e}")

if __name__ == "__main__":
    test_moquegua_forecast()
