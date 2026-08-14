import json

# Datos reales de las 5 rutas contractuales de la base de datos
routes_eval = [
    {
        "name": "SPCC.ILO.MATARANI.ILO.2025.V1",
        "client": "SPCC",
        "vessel": "MOQUEGUA",
        "origin": "ILO",
        "dest": "MATARANI",
        "cargo_mt": 13500,
        "freight_rate": 19.01,
        "comm_pct": 0.0,
        "dist_nm": 69 * 2,
        "port_costs_static": 15000 + 18000,
        "bunker_cost": 7290.94,
        "op_rate_load": 500,
        "op_rate_disch": 300,
        "ttc_load": 6.0,
        "pos_load": 1.0,
        "ttc_disch": 6.0,
        "pos_disch": 0.0
    },
    {
        "name": "SPCC.ILO.MARCONA.ILO.2025.V1",
        "client": "SPCC",
        "vessel": "MOQUEGUA",
        "origin": "ILO",
        "dest": "MARCONA",
        "cargo_mt": 13500,
        "freight_rate": 22.82,
        "comm_pct": 0.0,
        "dist_nm": 220 * 2,
        "port_costs_static": 15000 + 16000,
        "bunker_cost": 29480.77,
        "op_rate_load": 500,
        "op_rate_disch": 345,
        "ttc_load": 6.0,
        "pos_load": 1.0,
        "ttc_disch": 6.0,
        "pos_disch": 0.0
    },
    {
        "name": "SPCC.ILO.MEJILLONES.ILO.2025.V1",
        "client": "SPCC",
        "vessel": "MOQUEGUA",
        "origin": "ILO",
        "dest": "MEJILLONES",
        "cargo_mt": 13500,
        "freight_rate": 20.87,
        "comm_pct": 0.0,
        "dist_nm": 230 * 2,
        "port_costs_static": 15000 + 25000 + 33333,
        "bunker_cost": 35292.39,
        "op_rate_load": 500,
        "op_rate_disch": 350,
        "ttc_load": 6.0,
        "pos_load": 1.0,
        "ttc_disch": 6.0,
        "pos_disch": 0.0
    },
    {
        "name": "NEXA.CALLAO.MEJILLONES.CALLAO.2025.V1",
        "client": "NEXA",
        "vessel": "MOQUEGUA",
        "origin": "CALLAO",
        "dest": "MEJILLONES",
        "cargo_mt": 13500,
        "freight_rate": 30.00,
        "comm_pct": 3.75, # 2.5% Addr + 1.25% Broker
        "dist_nm": 690 * 2,
        "port_costs_static": 17000 + 25000 + 33333,
        "bunker_cost": 82208.01,
        "op_rate_load": 500,
        "op_rate_disch": 600,
        "ttc_load": 6.0,
        "pos_load": 1.0,
        "ttc_disch": 12.0,
        "pos_disch": 3.0
    },
    {
        "name": "NEXA.CALLAO.MATARANI.CALLAO.2027.V1",
        "client": "NEXA",
        "vessel": "MOQUEGUA",
        "origin": "CALLAO",
        "dest": "MATARANI",
        "cargo_mt": 1100,
        "freight_rate": 30.00,
        "comm_pct": 0.0,
        "dist_nm": 457 * 2,
        "port_costs_static": 17000 + 18000,
        "bunker_cost": 54916.17,
        "op_rate_load": 500,
        "op_rate_disch": 400,
        "ttc_load": 6.0,
        "pos_load": 1.0,
        "ttc_disch": 6.0,
        "pos_disch": 0.0
    }
]

qc_table = []

for r in routes_eval:
    gross_rev = r["cargo_mt"] * r["freight_rate"]
    comm_usd = gross_rev * (r["comm_pct"] / 100.0)
    net_rev = gross_rev - comm_usd
    
    # Días de mar (11 nudos, weather factor 3%)
    sea_days = (r["dist_nm"] * 1.03) / (11.0 * 24.0)
    
    # Días de puerto
    hrs_load = r["ttc_load"] + r["pos_load"] + (r["cargo_mt"] / r["op_rate_load"])
    hrs_disch = r["ttc_disch"] + r["pos_disch"] + (r["cargo_mt"] / r["op_rate_disch"])
    port_days = (hrs_load + hrs_disch) / 24.0
    
    total_days = sea_days + port_days
    port_costs = r["port_costs_static"]
    bunker_costs = r["bunker_cost"]
    
    pnl = net_rev - port_costs - bunker_costs
    tce = pnl / total_days if total_days > 0 else 0.0
    
    qc_table.append({
        "name": r["name"],
        "client": r["client"],
        "vessel": "MOQUEGUA",
        "cargo_mt": f"{r['cargo_mt']:,} MT",
        "rate": f"${r['freight_rate']:.2f}/MT",
        "gross_income": f"${gross_rev:,.2f}",
        "comm_usd": f"${comm_usd:,.2f}",
        "port_costs": f"${port_costs:,.2f}",
        "bunker_cost": f"${bunker_costs:,.2f}",
        "voyage_days": f"{total_days:.2f} d",
        "pnl": f"${pnl:,.2f}",
        "tce": f"${tce:,.2f}/día"
    })

print(json.dumps(qc_table, indent=2))
