import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

url = "https://forecast.geeksoft.tech/api/v1/forecast/multicotizador/calculate"

payload = {
  "vessel_id": "TABLONES",
  "vessel_speed": 11,
  "bunker_price_ifo": 1100,
  "bunker_price_mdo": 1700,
  "bunker_source": "SOBREESCRITURA",
  "client_id": "NEXA",
  "port_cost_mode": "static",
  "tramos": [
    {
      "type": "BALLAST",
      "origin_port_id": "ILO",
      "destination_port_id": "CALLAO",
      "quantity": 0,
      "freight_rate": 0,
      "port_delay_hours_loading": 0,
      "port_delay_hours_discharging": 0,
      "route_distance": 514,
      "weather_factor": 3,
      "speed": 11,
      "origin_action": "NONE",
      "destination_action": "CARGAR",
      "port_overhead_hours_origin": 0,
      "port_overhead_hours_dest": 6,
      "positioning_carga_hrs": 1,
      "positioning_descarga_hrs": 0,
      "custom_load_rate": 500,
      "agency_costs_origin": 0,
      "agency_costs_destination": 17000
    },
    {
      "type": "LADEN",
      "origin_port_id": "CALLAO",
      "destination_port_id": "MATARANI",
      "quantity": 13500,
      "freight_rate": 30,
      "port_delay_hours_loading": 0,
      "port_delay_hours_discharging": 0,
      "route_distance": 457,
      "weather_factor": 3,
      "speed": 11,
      "origin_action": "CARGAR",
      "destination_action": "DESCARGAR",
      "port_overhead_hours_origin": 0,
      "port_overhead_hours_dest": 6,
      "positioning_carga_hrs": 0,
      "positioning_descarga_hrs": 0,
      "custom_load_rate": 500,
      "custom_discharge_rate": 400,
      "agency_costs_origin": 0,
      "agency_costs_destination": 18000
    },
    {
      "type": "BALLAST",
      "origin_port_id": "MATARANI",
      "destination_port_id": "ILO",
      "quantity": 0,
      "freight_rate": 0,
      "port_delay_hours_loading": 0,
      "port_delay_hours_discharging": 0,
      "route_distance": 69,
      "weather_factor": 3,
      "speed": 11,
      "origin_action": "DESCARGAR",
      "destination_action": "NONE",
      "port_overhead_hours_origin": 0,
      "port_overhead_hours_dest": 0,
      "positioning_carga_hrs": 0,
      "positioning_descarga_hrs": 0,
      "agency_costs_origin": 0,
      "agency_costs_destination": 0
    }
  ]
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("STATUS: 200 OK")
        print("\nTRAMOS RESULT:")
        for idx, tr in enumerate(res.get("tramos", [])):
            print(f"Tramo {idx+1} ({tr.get('origin_port_id')} -> {tr.get('destination_port_id')}, {tr.get('type')}): sea_days={tr.get('sea_days'):.4f}, port_days={tr.get('port_days'):.4f}")
        
        cons = res.get("consolidated", {})
        print("\nCONSOLIDATED:")
        print(f"total_sea_days  : {cons.get('total_sea_days')}")
        print(f"total_port_days : {cons.get('total_port_days')}")
        print(f"total_days      : {cons.get('total_days')}")
except Exception as e:
    print("API ERROR:", e)
