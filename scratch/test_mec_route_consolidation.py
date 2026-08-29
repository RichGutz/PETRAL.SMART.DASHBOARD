import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine
import json

sb = get_supabase()
res = sb.table("commercial_forecasts").select("*").eq("id", "57f506fd-6da4-44c0-92c8-2b9d5644fb6e").execute()
row = res.data[0]
raw_lines = row.get("projection_lines") or []

clean_lines = []
for l in raw_lines:
    freq_val = l.get("monthly_frequency")
    safe_freq = float(freq_val) if (freq_val is not None and str(freq_val).replace('.','',1).isdigit()) else 0.0
    clean_lines.append(ProjectionLine(
        client_id=l["client_id"],
        origin_port_id=l["origin_port_id"],
        destination_port_id=l["destination_port_id"],
        vessel_id=l["vessel_id"],
        month_index=l["month_index"],
        quantity=float(l.get("quantity", 13500)),
        monthly_frequency=safe_freq,
        custom_tariff=float(l["custom_tariff"]) if l.get("custom_tariff") is not None else None,
        quote_id=l.get("quote_id")
    ))

req = ForecastRequest(start_date="2027-01-01", end_date="2027-12-31", projection_lines=clean_lines)
sim = run_forecast_simulation(req)
agg = sim.get("aggregated_data", {})

routes_map = {}

for client, routes_dict in agg.items():
    for r_name, vessels_dict in routes_dict.items():
        route_upper = r_name.upper()
        route_key = f"{client.upper()}__{route_upper}"
        
        for v_name, months_dict in vessels_dict.items():
            clean_vessel = v_name.replace("_", " ").upper()
            
            tot_tm = 0.0
            tot_trips = 0.0
            tot_pnl = 0.0
            tot_days = 0.0
            last_qty = 13500.0
            
            for m_key, m_val in months_dict.items():
                freq = float(m_val.get("freq") or 0)
                if freq <= 0: continue
                qty = float(m_val.get("carga_unit") or 13500)
                pnl = float(m_val.get("voyage_result") or 0)
                dur = float(m_val.get("total_duration") or 0)
                
                tot_trips += freq
                tot_tm += (qty * freq)
                tot_pnl += pnl
                tot_days += dur
                last_qty = qty
                
            if tot_trips <= 0: continue
            
            v_detail = {
                "vessel": clean_vessel,
                "annualTons": tot_tm,
                "fullLoad": tot_tm / tot_trips if tot_trips > 0 else last_qty,
                "annualTrips": tot_trips,
                "pnlPerTrip": tot_pnl / tot_trips if tot_trips > 0 else 0,
                "totalGrossMargin": tot_pnl,
                "daysOccupation": tot_days
            }
            
            if route_key not in routes_map:
                routes_map[route_key] = {
                    "route": route_upper,
                    "client": client.upper(),
                    "annualTons": tot_tm,
                    "annualTrips": tot_trips,
                    "totalGrossMargin": tot_pnl,
                    "daysOccupation": tot_days,
                    "vesselDetails": [v_detail]
                }
            else:
                routes_map[route_key]["annualTons"] += tot_tm
                routes_map[route_key]["annualTrips"] += tot_trips
                routes_map[route_key]["totalGrossMargin"] += tot_pnl
                routes_map[route_key]["daysOccupation"] += tot_days
                routes_map[route_key]["vesselDetails"].append(v_detail)

print("=" * 80)
print("REPORTE CONSOLIDADO MEC POR RUTA CON SUBFILAS DE BUQUE")
print("=" * 80)

total_tm = sum(r["annualTons"] for r in routes_map.values())
total_trips = sum(r["annualTrips"] for r in routes_map.values())
total_margin = sum(r["totalGrossMargin"] for r in routes_map.values())
total_days = sum(r["daysOccupation"] for r in routes_map.values())

for k, r in routes_map.items():
    trips = r["annualTrips"]
    tm = r["annualTons"]
    margin = r["totalGrossMargin"]
    pnl_trip = margin / trips if trips > 0 else 0
    full_load = tm / trips if trips > 0 else 13500
    share_pct = (tm / total_tm) * 100 if total_tm > 0 else 0
    days = r["daysOccupation"]
    
    print(f"\n[RUTA] {r['route']} | TM: {tm:,.0f} | Full Load: {full_load:,.0f} | Viajes: {trips:.0f} | P/L x Vje: ${pnl_trip:,.2f} | Total Margin: ${margin:,.2f} | Share: {share_pct:.2f}% | Dias: {days:.1f}d")
    for v in r["vesselDetails"]:
        v_share = (v["annualTons"] / total_tm) * 100 if total_tm > 0 else 0
        print(f"   -> {v['vessel']}: TM={v['annualTons']:,.0f} | Viajes={v['annualTrips']:.0f} | P/L x Vje=${v['pnlPerTrip']:,.2f} | Margen=${v['totalGrossMargin']:,.2f} | Share={v_share:.2f}% | Dias={v['daysOccupation']:.1f}d")

print("\n" + "=" * 80)
print(f"TOTAL CONSOLIDADO: {total_tm:,.0f} TM | {total_trips:.0f} Viajes | Margen: ${total_margin:,.2f} | Dias: {total_days:.1f}d")
print("=" * 80)
