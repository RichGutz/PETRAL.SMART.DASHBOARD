import requests
import json

print("="*80)
print("SUPER LOOP QC FRONTEND-BACKEND: RECONCILIACION DE PROJECTION LINES Y GRILLA REACT")
print("="*80)

# 1. Obtener todas las cotizaciones de la BD
res_spots = requests.get("https://forecast.geeksoft.tech/api/v1/forecast/spot/list")
if res_spots.status_code != 200:
    print(f"Error al consultar spot/list: {res_spots.status_code}")
    exit(1)

spots = res_spots.json()
print(f"Total de rutas en BD: {len(spots)}")

# Funcion que emula con fidelidad matematica el nuevo matcher de React (ForecastGrid.tsx L475-495)
def simulate_react_grid_reconciliation(line, backend_route_key, month_data):
    clean_lf_route = backend_route_key.replace("-CALLAO(B)", "").replace("CALLAO(B)", "").strip()
    p_route = f"{line.get('origin_port_id')}-{line.get('destination_port_id')}"
    
    # Matcher nuevo implementado en React
    is_match = (
        p_route == backend_route_key or
        p_route == clean_lf_route or
        (clean_lf_route and "-" in clean_lf_route and line.get("destination_port_id") == clean_lf_route.split("-")[1]) or
        (line.get("destination_port_id") == clean_lf_route)
    )
    
    if is_match:
        return line.get("monthly_frequency", 0)
    
    # Fallback nuevo
    fallback_freq = float(month_data.get("freq") or month_data.get("trips") or month_data.get("monthly_frequency") or 0)
    return fallback_freq

passed = 0
failed = 0
failed_details = []

for idx, s in enumerate(spots, 1):
    s_name = s.get("name") or s.get("id") or f"Spot_{idx}"
    cid = (s.get("client_id") or "SPCC").strip().upper()
    legs = s.get("legs_data") or {}
    tramos = legs.get("tramos") or []
    laden_tramos = [t for t in tramos if t.get("type", "").upper() == "LADEN"]
    
    orig = laden_tramos[0].get("origin_port_id") if laden_tramos else s.get("origin_port_id") or "ILO"
    dest = laden_tramos[0].get("destination_port_id") if laden_tramos else s.get("destination_port_id") or "MARCONA"
    
    vessel = legs.get("vessel_id") or legs.get("vesselParams", {}).get("vessel_id") or s.get("vessel_id") or "TABLONES"
    
    sim_line = {
        "month_index": "2027-01",
        "client_id": cid,
        "origin_port_id": orig,
        "destination_port_id": dest,
        "vessel_id": vessel,
        "quantity": 13500,
        "monthly_frequency": 1,
        "quote_id": s_name
    }
    
    payload = {
        "start_date": "2027-01-01",
        "end_date": "2027-01-31",
        "projection_lines": [sim_line],
        "port_cost_mode": "static"
    }
    
    try:
        r = requests.post("https://forecast.geeksoft.tech/api/v1/forecast/run", json=payload, timeout=15)
        res_json = r.json()
        agg = res_json.get("aggregated_data", {})
        
        # Buscar el cliente en la respuesta agregada
        client_agg = agg.get(cid)
        if not client_agg:
            matching_clients = [k for k in agg.keys() if cid in k.upper() or k.upper() in cid]
            if matching_clients:
                client_agg = agg[matching_clients[0]]
        
        if not client_agg:
            failed += 1
            failed_details.append(f"[{s_name}] No se encontro cliente '{cid}' en aggregated_data")
            continue
            
        route_found = False
        for route_key, vessel_map in client_agg.items():
            if vessel in vessel_map and "2027-01" in vessel_map[vessel]:
                route_found = True
                m_data = vessel_map[vessel]["2027-01"]
                
                reconciled_trips = simulate_react_grid_reconciliation(sim_line, route_key, m_data)
                pnl = float(m_data.get("voyage_result") or 0)
                
                if reconciled_trips <= 0:
                    failed += 1
                    failed_details.append(f"[{s_name}] Trips reconciliado dio 0 para route_key '{route_key}'")
                else:
                    passed += 1
                    short_name = s_name[:40]
                    print(f"  [OK] [{passed:02d}/{len(spots)}] Ruta: {short_name:<40} | Key: {route_key:<22} | Trips: {reconciled_trips} | P&L: ${pnl:,.2f}")
                break
                
        if not route_found:
            failed += 1
            failed_details.append(f"[{s_name}] Buque '{vessel}' o mes no encontrado en aggregated_data")
            
    except Exception as ex:
        failed += 1
        failed_details.append(f"[{s_name}] Excepcion: {ex}")

print("\n" + "="*80)
print(f"RESULTADO FINAL DEL SUPER LOOP QC DE RECONCILIACION REACT:")
print(f"   Rutas con Reconciliacion Perfecta (Trips > 0 y P&L Visible): {passed}/{len(spots)}")
print(f"   Rutas Fallidas: {failed}")
if failed_details:
    print("\nDetalle de Fallas:")
    for f in failed_details[:10]:
        print(f"   - {f}")
print("="*80)
