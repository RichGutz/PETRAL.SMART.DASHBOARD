import requests

url = "http://localhost:8000/api/v1/forecast/multicotizador/calculate"

def test():
    # Vamos a simular un viaje de 3 tramos para CONCON_TRADER:
    # Tramo 1: ILO -> MATARANI (BALLAST / Vacio)
    # Tramo 2: MATARANI -> MEJILLONES (LADEN, carga 19,000 MT, flete 22.50 USD/MT)
    # Tramo 3: MEJILLONES -> CONCON (BALLAST / Vacio)
    
    payload = {
        "vessel_id": "CONCON_TRADER",
        "bunker_price_ifo": 650.0,
        "bunker_price_mdo": 950.0,
        "tramos": [
            {
                "origin_port_id": "ILO",
                "destination_port_id": "MATARANI",
                "type": "BALLAST",
                "quantity": 0,
                "freight_rate": 0
            },
            {
                "origin_port_id": "MATARANI",
                "destination_port_id": "MEJILLONES",
                "type": "LADEN",
                "quantity": 19000.0,
                "freight_rate": 22.50
            },
            {
                "origin_port_id": "MEJILLONES",
                "destination_port_id": "CONCON",
                "type": "BALLAST",
                "quantity": 0,
                "freight_rate": 0
            }
        ]
    }
    
    print("Enviando petición de prueba al endpoint del Multicotizador...")
    try:
        res = requests.post(url, json=payload)
        if res.status_code == 200:
            data = res.json()
            print("=== SIMULACIÓN COMPLETADA CON ÉXITO ===")
            print(f"Distancia Total: {data['consolidated']['total_distance']} NM")
            print(f"Días de Viaje Totales: {data['consolidated']['total_days']:.2f} d")
            print(f"Costo Bunker Total: ${data['consolidated']['total_bunker_costs']:,.2f} USD")
            print(f"Costos Puerto Total: ${data['consolidated']['total_port_costs']:,.2f} USD")
            print(f"Ingresos Flete Total: ${data['consolidated']['total_freight_revenue']:,.2f} USD")
            print(f"Utilidad Net Utility P&L: ${data['consolidated']['pnl_net_utility']:,.2f} USD")
            print(f"TCE Realizado: ${data['consolidated']['tce_real']:,.2f} USD/día")
            print("\nDetalle por Tramo:")
            for idx, tr in enumerate(data['tramos']):
                print(f"  Tramo {idx+1}: {tr['origin_port_id']} -> {tr['destination_port_id']} ({tr['type']})")
                print(f"    - Distancia: {tr['distance']} NM")
                print(f"    - Días Mar/Puerto: {tr['sea_days']:.2f} d / {tr['port_days']:.2f} d")
                print(f"    - Costo Bunker: ${tr['bunker_costs']:,.2f} USD")
                print(f"    - Costos Puerto: ${tr['port_costs']:,.2f} USD")
                print(f"    - Ingresos Flete: ${tr['net_income']:,.2f} USD")
                print(f"    - P&L del Tramo: ${tr['pnl_tramo']:,.2f} USD")
        else:
            print(f"Error {res.status_code}: {res.text}")
    except Exception as e:
        print("Error conectando con el servidor:", e)

if __name__ == "__main__":
    test()
