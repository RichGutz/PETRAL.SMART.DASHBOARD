import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.api.routers.forecast import calculate_multicotizador
from backend.models.forecast_models import MultiCotizadorRequest, MultiCotizadorTramo

def test():
    # Creamos un request del tipo MultiCotizadorRequest
    tramos = [
        MultiCotizadorTramo(
            origin_port_id="ILO",
            destination_port_id="MATARANI",
            type="BALLAST",
            quantity=0,
            freight_rate=0
        ),
        MultiCotizadorTramo(
            origin_port_id="MATARANI",
            destination_port_id="MEJILLONES",
            type="LADEN",
            quantity=19000.0,
            freight_rate=22.50
        ),
        MultiCotizadorTramo(
            origin_port_id="MEJILLONES",
            destination_port_id="CONCON",
            type="BALLAST",
            quantity=0,
            freight_rate=0
        )
    ]
    request = MultiCotizadorRequest(
        vessel_id="CONCON_TRADER",
        tramos=tramos,
        bunker_price_ifo=650.0,
        bunker_price_mdo=950.0
    )
    
    print("Iniciando simulación del Multicotizador (Offline)...")
    res = calculate_multicotizador(request)
    
    print("\n=== RESULTADOS DE SIMULACIÓN COMPLETADA (OFFLINE) ===")
    print(f"Distancia Total: {res['consolidated']['total_distance']} NM")
    print(f"Días de Viaje Totales: {res['consolidated']['total_days']:.2f} d")
    print(f"Costo Bunker Total: ${res['consolidated']['total_bunker_costs']:,.2f} USD")
    print(f"Costos Puerto Total: ${res['consolidated']['total_port_costs']:,.2f} USD")
    print(f"Ingresos Flete Total: ${res['consolidated']['total_freight_revenue']:,.2f} USD")
    print(f"Utilidad Net Utility P&L: ${res['consolidated']['pnl_net_utility']:,.2f} USD")
    print(f"TCE Realizado: ${res['consolidated']['tce_real']:,.2f} USD/día")
    print("\nDetalle por Tramo:")
    for idx, tr in enumerate(res['tramos']):
        print(f"  Tramo {idx+1}: {tr['origin_port_id']} -> {tr['destination_port_id']} ({tr['type']})")
        print(f"    - Distancia: {tr['distance']} NM")
        print(f"    - Días Mar/Puerto: {tr['sea_days']:.2f} d / {tr['port_days']:.2f} d")
        print(f"    - Costo Bunker: ${tr['bunker_costs']:,.2f} USD")
        print(f"    - Costos Puerto: ${tr['port_costs']:,.2f} USD")
        print(f"    - Ingresos Flete: ${tr['net_income']:,.2f} USD")
        print(f"    - P&L del Tramo: ${tr['pnl_tramo']:,.2f} USD")

if __name__ == "__main__":
    test()
