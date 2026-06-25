import sys
import os

engine_path = "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine"
sys.path.append(engine_path)

from backend.engine import calculate_voyage_pnl

vessels_db = {
    "MOQUEGUA": {"speed": 12.0, "intake": 500, "pump": 400, "c_sea_ifo": 15.0, "c_idle_ifo": 4.0, "c_load_ifo": 4.0, "c_disch_ifo": 5.5, "c_sea_mdo": 0.0, "c_idle_mdo": 1.0, "c_load_mdo": 1.0, "c_disch_mdo": 1.5, "tce_req": 13000},
    "TABLONES": {"speed": 11.0, "intake": 500, "pump": 450, "c_sea_ifo": 14.0, "c_idle_ifo": 3.5, "c_load_ifo": 3.5, "c_disch_ifo": 5.0, "c_sea_mdo": 0.0, "c_idle_mdo": 0.0, "c_load_mdo": 0.0, "c_disch_mdo": 0.0, "tce_req": 15000}
}

routes_db = {
    "MATARANI": {"distance": 69, "freight": 19.01, "port_costs": 40000},
    "MARCONA": {"distance": 283, "freight": 22.82, "port_costs": 64500},
    "MEJILLONES": {"distance": 335, "freight": 20.87, "port_costs": 53000}
}

months = ["Jul 2026", "Ago 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Dic 2026"]

payload = [
    {"month": "Jul 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MATARANI", "freq": 3},
    {"month": "Jul 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MARCONA", "freq": 1},
    {"month": "Jul 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MEJILLONES", "freq": 2},
    {"month": "Jul 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MATARANI", "freq": 2},
    {"month": "Ago 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MEJILLONES", "freq": 2},
    {"month": "Ago 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MATARANI", "freq": 2},
    {"month": "Ago 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MARCONA", "freq": 3},
    {"month": "Ago 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MATARANI", "freq": 1},
    {"month": "Sep 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MATARANI", "freq": 4},
    {"month": "Sep 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MEJILLONES", "freq": 1},
    {"month": "Sep 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MARCONA", "freq": 2},
    {"month": "Sep 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MATARANI", "freq": 2},
    {"month": "Oct 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MARCONA", "freq": 2},
    {"month": "Oct 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MATARANI", "freq": 2},
    {"month": "Oct 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MEJILLONES", "freq": 1},
    {"month": "Oct 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MATARANI", "freq": 3},
    {"month": "Nov 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MEJILLONES", "freq": 3},
    {"month": "Nov 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MARCONA", "freq": 4},
    {"month": "Dic 2026", "client": "SPCC", "vessel": "MOQUEGUA", "dest": "MATARANI", "freq": 5},
    {"month": "Dic 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MEJILLONES", "freq": 2},
    {"month": "Dic 2026", "client": "SPCC", "vessel": "TABLONES", "dest": "MARCONA", "freq": 2},
]

flat_bunker_price = 430.0
quantity = 13500

agg_data = {"SPCC": {d: {v: {m: {"trips": 0, "rev": 0, "bunker": 0, "port": 0, "vr": 0} for m in months} for v in vessels_db.keys()} for d in routes_db.keys()}}

for line in payload:
    m = line["month"]
    c_name = line["client"]
    v_name = line["vessel"]
    d_name = line["dest"]
    freq = line["freq"]
    
    v = vessels_db[v_name]
    r = routes_db[d_name]
    
    inputs = {
        "quantity": quantity, "freight_rate": r["freight"], 
        "route_distance": r["distance"], "vessel_speed": v["speed"],
        "weather_factor": 0.03, "port_overhead_hours": 6, 
        "vessel_max_load_intake_limit": v["intake"], "max_terminal_load_rate": 500, 
        "vessel_pump_discharge_rate": v["pump"], "port_max_discharge_limit": 300,
        "agency_costs_origin": r["port_costs"] / 2, "agency_costs_destination": r["port_costs"] / 2, 
        "bunker_price_ifo": flat_bunker_price, "bunker_price_mdo": 1460.30,
        "tce_required": v["tce_req"], 
        "bunker_consumption_sea_ifo": v["c_sea_ifo"], "bunker_consumption_idle_ifo": v["c_idle_ifo"],
        "bunker_consumption_load_ifo": v["c_load_ifo"], "bunker_consumption_disch_ifo": v["c_disch_ifo"],
        "bunker_consumption_sea_mdo": v["c_sea_mdo"], "bunker_consumption_idle_mdo": v["c_idle_mdo"],
        "bunker_consumption_load_mdo": v["c_load_mdo"], "bunker_consumption_disch_mdo": v["c_disch_mdo"],
        "contract_agreed_load_rate": 500, "contract_agreed_discharge_rate": 450,
        "is_round_trip": True
    }
    
    res = calculate_voyage_pnl(inputs)
    
    agg_data[c_name][d_name][v_name][m]["trips"] += freq
    agg_data[c_name][d_name][v_name][m]["rev"] += (res["net_income"] * freq)
    agg_data[c_name][d_name][v_name][m]["bunker"] += (res["total_bunker_costs"] * freq)
    agg_data[c_name][d_name][v_name][m]["port"] += (res["total_port_costs"] * freq)
    agg_data[c_name][d_name][v_name][m]["vr"] += (res["voyage_result"] * freq)

# Pre-calcular filas totales
client_total_rows = 0
route_total_rows = {d: 0 for d in routes_db.keys()}

for c_name in ["SPCC"]:
    for d_name in routes_db.keys():
        for v_name in vessels_db.keys():
            has_trips = sum(agg_data[c_name][d_name][v_name][m]["trips"] for m in months) > 0
            if has_trips:
                route_total_rows[d_name] += 5
                client_total_rows += 5

html_path = "C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Obsidian.1/DashBoardPetral/Mockups/commercial_forecast_H2_2026.html"

html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Geeksoft Commercial Forecast</title>
<style>
    body {{
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8fafc;
        padding: 2rem;
        margin: 0;
        color: #0f172a;
    }}
    h2 {{
        color: #1e293b;
        margin-bottom: 1.5rem;
        font-weight: 600;
    }}
    .table-container {{
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        overflow: hidden;
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
    }}
    table {{
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }}
    th {{
        background-color: #1e3a8a;
        color: white;
        padding: 12px 8px;
        text-align: center;
        border: 1px solid #3b82f6;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    td {{
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
    }}
    .vertical-text {{
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        text-align: center;
        font-weight: bold;
        letter-spacing: 2px;
        white-space: nowrap;
        vertical-align: middle;
    }}
    .client-cell {{ background-color: #1e3a8a; color: white; border: 1px solid #1e3a8a; }}
    .route-MATARANI {{ background-color: #0369a1; color: white; border: 1px solid #0284c7; }}
    .route-MARCONA {{ background-color: #0f766e; color: white; border: 1px solid #0d9488; }}
    .route-MEJILLONES {{ background-color: #4338ca; color: white; border: 1px solid #4f46e5; }}
    .vessel-MOQUEGUA {{ background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }}
    .vessel-TABLONES {{ background-color: #ccfbf1; color: #0f766e; border: 1px solid #99f6e4; }}
    .metric-cell {{ text-align: left; font-weight: 500; color: #334155; }}
    .number-cell {{ text-align: right; font-variant-numeric: tabular-nums; }}
    .vr-row {{ background-color: #f1f5f9; font-weight: bold; color: #0f172a; border-top: 2px solid #cbd5e1; }}
    .vr-row td.number-cell {{ background-color: #f1f5f9; }}
    .grand-total-row {{ background-color: #0f172a; color: white; font-weight: bold; font-size: 14px; }}
    .grand-total-row td {{ border-color: #334155; padding: 14px 12px; }}
    
    /* Hover effects for rows */
    tbody tr:hover:not(.grand-total-row) {{
        background-color: #f8fafc;
    }}
    .vr-row:hover {{
        background-color: #e2e8f0 !important;
    }}
</style>
</head>
<body>
    <div style="max-width: 1400px; margin: 0 auto;">
        <h2>Geeksoft Commercial Forecast - Matriz P&L H2 2026</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;">Cliente</th>
                        <th style="width: 40px;">Ruta</th>
                        <th style="width: 40px;">Buque</th>
                        <th style="width: 150px; text-align: left;">Métricas</th>
"""

for m in months:
    html += f"                        <th>{m}</th>\n"

html += """                        <th>TOTAL H2</th>
                    </tr>
                </thead>
                <tbody>
"""

grand_total_months = {m: 0 for m in months}
grand_total_all = 0

routes_added = 0
for c_name in ["SPCC"]:
    if client_total_rows == 0: continue
    
    for d_name in routes_db.keys():
        if route_total_rows[d_name] == 0: continue
        route_vessels_added = 0
        
        for v_name in vessels_db.keys():
            has_trips = sum(agg_data[c_name][d_name][v_name][m]["trips"] for m in months) > 0
            if not has_trips: continue
            
            routes_added += 1
            route_vessels_added += 1
            
            metrics = [
                ("trips", "Viajes (freq)", ""),
                ("rev", "Gross Revenue", "$"),
                ("port", "Port Costs", "$"),
                ("bunker", "Bunker Costs", "$"),
                ("vr", "Voyage Result", "$")
            ]
            
            for i, (met_key, met_label, prefix) in enumerate(metrics):
                tr_class = "vr-row" if met_key == "vr" else ""
                html += f"                    <tr class='{tr_class}'>\n"
                
                # Celdas Jerarquicas con ROWSPAN
                if i == 0 and routes_added == 1 and route_vessels_added == 1:
                    html += f"                        <td rowspan='{client_total_rows}' class='vertical-text client-cell'>{c_name}</td>\n"
                
                if i == 0 and route_vessels_added == 1:
                    html += f"                        <td rowspan='{route_total_rows[d_name]}' class='vertical-text route-{d_name}'>ILO - {d_name}</td>\n"
                    
                if i == 0:
                    html += f"                        <td rowspan='5' class='vertical-text vessel-{v_name}'>{v_name}</td>\n"
                
                # Metrica
                html += f"                        <td class='metric-cell'>{met_label}</td>\n"
                
                row_total = 0
                for m in months:
                    val = agg_data[c_name][d_name][v_name][m][met_key]
                    row_total += val
                    if met_key == "vr":
                        grand_total_months[m] += val
                        
                    if val == 0:
                        html += "                        <td class='number-cell' style='color: #94a3b8;'>-</td>\n"
                    else:
                        if met_key == "trips":
                            html += f"                        <td class='number-cell'>{int(val)}</td>\n"
                        else:
                            html += f"                        <td class='number-cell'>{prefix}{val:,.0f}</td>\n"
                            
                # Total fila
                if met_key == "vr":
                    grand_total_all += row_total
                    
                if row_total == 0:
                    html += "                        <td class='number-cell' style='font-weight: bold; color: #94a3b8;'>-</td>\n"
                else:
                    if met_key == "trips":
                        html += f"                        <td class='number-cell' style='font-weight: bold;'>{int(row_total)}</td>\n"
                    else:
                        html += f"                        <td class='number-cell' style='font-weight: bold;'>{prefix}{row_total:,.0f}</td>\n"
                        
                html += "                    </tr>\n"

# Fila Grand Total
html += """                    <tr class="grand-total-row">
                        <td colspan="4" style="text-align: left; padding-left: 24px;">GRAND TOTAL VOYAGE RESULT</td>
"""
for m in months:
    html += f"                        <td class='number-cell'>${grand_total_months[m]:,.0f}</td>\n"
html += f"                        <td class='number-cell'>${grand_total_all:,.0f}</td>\n"
html += """                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)
    
print("Success HTML Layout")
