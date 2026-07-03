import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine

def test_tablones_forecast():
    print("=== SIMULANDO FORECAST DE PRUEBA PARA BT TABLONES ===")
    
    lines = [
        # Tramo ILO -> MATARANI
        ProjectionLine(
            client_id="SPCC",
            vessel_id="TABLONES",
            origin_port_id="ILO",
            destination_port_id="MATARANI",
            quantity=13500,
            month_index="1",
            monthly_frequency=1,
            forecast_bunker_price_ifo=450,
            forecast_bunker_price_mdo=800
        ),
        # Tramo ILO -> MEJILLONES (para validar promedio de terminales)
        ProjectionLine(
            client_id="SPCC",
            vessel_id="TABLONES",
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
        end_date="2026-12-31"
    )
    
    try:
        response = run_forecast_simulation(request)
        if response.get("status") == "success":
            agg_data = response["aggregated_data"]["SPCC"]
            
            # --- ILO -> MATARANI ---
            res_matarani = agg_data["ILO-MATARANI"]["TABLONES"]["1"]
            total_port_unit = res_matarani["total_port_costs_unit"]
            breakdown = res_matarani.get("port_costs_breakdown", {})
            raw_in = res_matarani.get("raw_inputs", {})
            
            print("\n--- Tramo: ILO - MATARANI ---")
            print(f"  -> Costo Portuario Unitario total: ${total_port_unit:,.2f} USD")
            print(f"  -> agency_costs_origin (ILO) inyectado: ${raw_in.get('agency_costs_origin'):,.2f} USD")
            print(f"  -> agency_costs_destination (MATARANI) inyectado: ${raw_in.get('agency_costs_destination'):,.2f} USD")
            print(f"  -> Desglose de Origen (ILO): {breakdown.get('origin')}")
            print(f"  -> Suma de Desglose Origen (ILO): ${sum(breakdown.get('origin', {}).values()):,.2f} USD")
            print(f"  -> Desglose de Destino (MATARANI): {breakdown.get('destination')}")
            print(f"  -> Suma de Desglose Destino (MATARANI): ${sum(breakdown.get('destination', {}).values()):,.2f} USD")
            
            # --- ILO -> MEJILLONES ---
            res_mejillones = agg_data["ILO-MEJILLONES"]["TABLONES"]["1"]
            total_port_unit_mej = res_mejillones["total_port_costs_unit"]
            breakdown_mej = res_mejillones.get("port_costs_breakdown", {})
            raw_in_mej = res_mejillones.get("raw_inputs", {})
            
            print("\n--- Tramo: ILO - MEJILLONES ---")
            print(f"  -> Costo Portuario Unitario total: ${total_port_unit_mej:,.2f} USD")
            print(f"  -> agency_costs_origin (ILO) inyectado: ${raw_in_mej.get('agency_costs_origin'):,.2f} USD")
            print(f"  -> agency_costs_destination (MEJILLONES) inyectado: ${raw_in_mej.get('agency_costs_destination'):,.2f} USD")
            print(f"  -> Desglose de Origen (ILO): {breakdown_mej.get('origin')}")
            print(f"  -> Desglose de Destino (MEJILLONES): {breakdown_mej.get('destination')}")
            print(f"  -> Suma de Desglose Destino (MEJILLONES Promedio): ${sum(breakdown_mej.get('destination', {}).values()):,.2f} USD")
            
            # Cálculo de promedio esperado para Mejillones
            # Mejillones A: $52,104.10
            # Interacid: $48,786.00
            # Terquim: $58,152.70
            # Promedio esperado = (52104.10 + 48786.00 + 58152.70) / 3 = 159042.80 / 3 = 53,014.2667
            print(f"\n  -> Promedio manual esperado para Mejillones: $(52,104.10 + 48,786.00 + 58,152.70) / 3 = $53,014.27 USD")
            
        else:
            print(f"Error en la simulación: {response}")
    except Exception as e:
        print(f"ERROR durante la simulación: {e}")

if __name__ == "__main__":
    test_tablones_forecast()
