import requests
import json

SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# 1. Fetch contracts (5)
res_c = requests.get(f"{SUPABASE_URL}/rest/v1/contracts?select=*", headers=headers)
contracts = res_c.json() if res_c.status_code == 200 else []

# 2. Fetch routes_quotes (11)
res_q = requests.get(f"{SUPABASE_URL}/rest/v1/routes_quotes?select=*", headers=headers)
quotes = res_q.json() if res_q.status_code == 200 else []

print(f"Contracts en DB: {len(contracts)}")
print(f"Quotes en DB: {len(quotes)}")

all_16 = []

for c in contracts:
    all_16.append({
        "name": c.get("name"),
        "client": c.get("client_id") or ("SPCC" if (c.get("name") or "").upper().startswith("SPCC") else "NEXA"),
        "source": "📜 contracts",
        "origin": c.get("origin_port_id") or "CALLAO",
        "dest": c.get("destination_port_id") or "MATARANI",
        "legs_data": c.get("legs_data") or {}
    })

for q in quotes:
    all_16.append({
        "name": q.get("name"),
        "client": q.get("client_id") or ("SPCC" if (q.get("name") or "").upper().startswith("SPCC") else "NEXA"),
        "source": "💼 routes_quotes",
        "origin": q.get("origin_port_id") or "CALLAO",
        "dest": q.get("destination_port_id") or "MEJILLONES",
        "legs_data": q.get("legs_data") or {}
    })

print(f"\nTotal combinado para simulación: {len(all_16)} rutas.")

# 3. Datos de buque MOQUEGUA
res_v = requests.get(f"{SUPABASE_URL}/rest/v1/vessels?vessel_id=eq.MOQUEGUA", headers=headers)
vessel_moquegua = res_v.json()[0] if res_v.status_code == 200 and res_v.json() else {
    "vessel_id": "MOQUEGUA", "vessel_name": "MOQUEGUA", "vessel_speed": 11.0,
    "consumption_sea_ifo": 14.5, "consumption_idle_ifo": 3.5, "consumption_load_ifo": 3.5, "consumption_disch_ifo": 5.0,
    "consumption_sea_mdo": 0.1, "consumption_idle_mdo": 0.1, "consumption_load_mdo": 0.1, "consumption_disch_mdo": 0.1
}

# Precios Matriz Búnker Spot (IFO: $967.26 / MDO: $1,528.26)
bunker_ifo = 967.26
bunker_mdo = 1528.26

# Matriz Portuaria Estática
port_costs_db = {
    "CALLAO": {"CARGA": 17000, "DESCARGA": 17000},
    "MEJILLONES": {"CARGA": 25000, "DESCARGA": 25000 + 33333},
    "MATARANI": {"CARGA": 18000, "DESCARGA": 18000},
    "ILO": {"CARGA": 15000, "DESCARGA": 15000},
    "MARCONA": {"CARGA": 16000, "DESCARGA": 16000}
}

# Matriz de Distancias (NM)
dist_map = {
    ("CALLAO", "MEJILLONES"): 690, ("MEJILLONES", "CALLAO"): 690,
    ("ILO", "MATARANI"): 69, ("MATARANI", "ILO"): 69,
    ("ILO", "MARCONA"): 220, ("MARCONA", "ILO"): 220,
    ("ILO", "MEJILLONES"): 230, ("MEJILLONES", "ILO"): 230,
    ("CALLAO", "MATARANI"): 457, ("MATARANI", "CALLAO"): 457
}

qc_table = []

for idx, r in enumerate(all_16):
    r_name = r["name"]
    client_id = r["client"]
    ld = r["legs_data"]
    tramos = ld.get("tramos") or []

    if tramos:
        laden_tr = next((t for t in tramos if t.get("type") == "LADEN"), tramos[0])
        orig = laden_tr.get("origin_port_id") or r.get("origin") or "CALLAO"
        dest = laden_tr.get("destination_port_id") or r.get("dest") or "MEJILLONES"
        qty = float(laden_tr.get("quantity") or 13500)
        fr_rate = float(laden_tr.get("freight_rate") or (30.0 if client_id == "NEXA" else 20.0))
    else:
        orig = r.get("origin") or "CALLAO"
        dest = r.get("dest") or "MEJILLONES"
        qty = 13500.0 if client_id == "SPCC" or "13" in r_name else 1100.0
        fr_rate = 30.0 if client_id == "NEXA" else 20.12

    # Ingreso Bruto y Comisiones
    gross_rev = qty * fr_rate
    addr_comm = float(ld.get("addressCommPct") or 0.0)
    broker_comm = float(ld.get("brokerCommPct") or 0.0)
    comm_usd = gross_rev * ((addr_comm + broker_comm) / 100.0)
    net_rev = gross_rev - comm_usd

    # Distancia Viaje Redondo
    one_way_dist = dist_map.get((orig, dest), 500)
    total_dist = one_way_dist * 2

    # Días de Mar (11 nudos, weather factor 3%)
    sea_days = (total_dist * 1.03) / (11.0 * 24.0)

    # Días de Puerto (Carga + Descarga)
    hrs_load = 6.0 + 1.0 + (qty / 500.0)
    hrs_disch = 6.0 + 0.0 + (qty / 350.0)
    port_days = (hrs_load + hrs_disch) / 24.0
    total_days = sea_days + port_days

    # Costo Búnker (Consumos MOQUEGUA: 14.5 t IFO mar / 3.5 t IFO pto / 0.1 t MDO)
    ifo_tons = (sea_days * 14.5) + (port_days * 3.5)
    mdo_tons = (sea_days + port_days) * 0.1
    bunker_cost = (ifo_tons * bunker_ifo) + (mdo_tons * bunker_mdo)

    # Gastos de Puerto Estáticos
    p_orig = port_costs_db.get(orig, {}).get("CARGA", 15000)
    p_dest = port_costs_db.get(dest, {}).get("DESCARGA", 18000)
    port_costs = p_orig + p_dest

    # PnL / Utilidad Neta y TCE ($/día)
    pnl = net_rev - port_costs - bunker_cost
    tce = pnl / total_days if total_days > 0 else 0.0

    qc_table.append({
        "num": idx + 1,
        "name": r_name,
        "source": r["source"],
        "client": client_id,
        "vessel": "MOQUEGUA",
        "cargo_mt": f"{qty:,.0f} MT",
        "freight_rate": f"${fr_rate:.2f}/MT",
        "gross_income": f"${gross_rev:,.2f}",
        "comm_usd": f"${comm_usd:,.2f}",
        "port_costs": f"${port_costs:,.2f}",
        "bunker_cost": f"${bunker_cost:,.2f}",
        "total_days": f"{total_days:.2f} d",
        "pnl": f"${pnl:,.2f}",
        "tce": f"${tce:,.2f}/día"
    })

print(json.dumps(qc_table, indent=2))
with open("scratch/moquegua_full_16_qc_table.json", "w") as f:
    json.dump(qc_table, f, indent=2)
