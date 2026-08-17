from typing import Dict, Any
import time
from backend.models.forecast_models import ForecastRequest
from backend.database import get_supabase
from backend.engine import calculate_voyage_pnl, calculate_baf_adjusted_rate
from backend.engine_universal import calculate_voyage_pnl_universal, calculate_baf_adjusted_rate_universal

from concurrent.futures import ThreadPoolExecutor

# --- MEMORY CACHE FOR MASTER DATA ---
_masters_cache = {}
_cache_time = 0.0
CACHE_TTL = 5.0  # 5 segundos TTL para forzar lectura fresca de Supabase

def clear_forecast_cache():
    global _masters_cache, _cache_time
    _masters_cache = {}
    _cache_time = 0.0

def get_cached_masters(supabase) -> Dict[str, Any]:
    global _masters_cache, _cache_time
    now = time.time()
    if not _masters_cache or (now - _cache_time) > CACHE_TTL:
        tables = [
            "vessels", "distances", "routes_clients", "routes_quotes",
            "bunker_prices", "ports", "contracts", "contract_tariffs",
            "port_costs_matrix", "port_cost_static", "vessel_terminal_operations"
        ]
        with ThreadPoolExecutor(max_workers=11) as executor:
            future_to_table = {executor.submit(safe_fetch, supabase, t): t for t in tables}
            new_cache = {}
            for future in future_to_table:
                t = future_to_table[future]
                try:
                    new_cache[t] = future.result()
                except Exception as e:
                    print(f"Warning: Error al cargar tabla {t} en paralelo: {e}")
                    new_cache[t] = []
        _masters_cache = new_cache
        _cache_time = now
    return _masters_cache


def safe_fetch(supabase, table_name):
    try:
        return supabase.table(table_name).select("*").execute().data
    except Exception as e:
        print(f"Warning: Could not fetch table {table_name}: {e}")
        return []

def get_latest_bunker_prices() -> Dict[str, Any]:
    try:
        supabase = get_supabase()
        res = supabase.table("bunker_prices").select("*").execute()
        if res.data and len(res.data) > 0:
            ifo_row = next((r for r in res.data if r.get("fuel_type") == "IFO"), None)
            mdo_row = next((r for r in res.data if r.get("fuel_type") == "MDO"), None)
            ifo_p = float(ifo_row.get("market_price_usd") or ifo_row.get("ifo_price") or 967.26) if ifo_row else 967.26
            mdo_p = float(mdo_row.get("market_price_usd") or mdo_row.get("mdo_price") or 1528.26) if mdo_row else 1528.26
            dt = ifo_row.get("date") if ifo_row else "2026-07-02"
            return {
                "bunker_price_ifo": ifo_p,
                "bunker_price_mdo": mdo_p,
                "quote_date": dt
            }
    except Exception as e:
        print(f"Warning: Error fetching latest bunker prices: {e}")
    return {
        "bunker_price_ifo": 967.26,
        "bunker_price_mdo": 1528.26,
        "quote_date": "2026-07-02"
    }

def calculate_detailed_port_costs(client_id: str, port_id: str, operation_type: str, vessel_id: str, port_costs_data: list, agency_matrix_data: list, port_cost_mode: str = "static", v_data: dict = None, quantity: float = 0.0, contract: dict = None, ports_db: dict = None) -> dict:
    if port_cost_mode == "dynamic" and v_data is not None and ports_db is not None:
        from backend.port_engines.core import calculate_dynamic_port_costs
        country = ports_db.get(port_id, {}).get("country", "PE")
        
        # Inyectar matriz de operaciones barco-terminal en v_data (clonado)
        vt_ops_data = _masters_cache.get("vessel_terminal_operations", [])
        op_row = next((op for op in vt_ops_data if op.get("vessel_id") == vessel_id and op.get("port_id") == port_id), None)
        if op_row:
            v_data = dict(v_data)
            v_data.update(op_row)

        
        # Estimate PORT_HOURS exactly as engine.py audit ledger calculates it
        port_hours = 24.0
        if operation_type == 'CARGA':
            rate = contract.get("load_rate") if contract else ports_db.get(port_id, {}).get("max_load_rate", 0)
            actual_rate = float(rate) if rate and float(rate) > 0 else 9999.0
            overhead = float(contract.get("time_to_count_carga_hrs", 6.0) if contract else 6.0)
            maneuver = float(contract.get("maneuver_carga_hrs", 0.0) if contract else 0.0)
            port_hours = (quantity / actual_rate) + overhead + maneuver
        else:
            rate = contract.get("discharge_rate") if contract else ports_db.get(port_id, {}).get("max_disch_rate", 0)
            actual_rate = float(rate) if rate and float(rate) > 0 else 9999.0
            overhead = float(contract.get("time_to_count_descarga_hrs", 6.0) if contract else 6.0)
            maneuver = float(contract.get("maneuver_descarga_hrs", 0.0) if contract else 0.0)
            port_hours = (quantity / actual_rate) + overhead + maneuver
            
        # Filtros iniciales de port_costs_data
        candidatos = [
            c for c in port_costs_data
            if c.get("port_id") == port_id 
            and c.get("operation_type") == operation_type
            and c.get("terminal") == "GENERAL" 
        ]
        filas_cliente = [c for c in candidatos if c.get("client_id") == client_id]
        if not filas_cliente:
            filas_cliente = [c for c in candidatos if c.get("client_id") == "DEFAULT"]
            
        return calculate_dynamic_port_costs(port_id, country, v_data, port_hours, filas_cliente)

    """
    Calcula los costos de puerto basándose en números duros (campo 'cost') configurados en port_costs_matrix.
    Si no encuentra datos desglosados en port_costs_matrix, busca el costo plano consolidado en agency_matrix como fallback.
    Para MEJILLONES, promedia aritméticamente las terminales TERMINAL_A, INTERACID y TERQUIM.
    """
    is_mejillones = (port_id == "MEJILLONES")
    
    # 1. Intentar buscar desglose detallado en port_costs_matrix
    def get_terminal_costs_from_matrix(term_id):
        candidatos = [
            c for c in port_costs_data
            if c.get("port_id") == port_id 
            and c.get("terminal") == term_id
            and c.get("operation_type") == operation_type
        ]
        
        conceptos = set(c.get("concept_id") for c in candidatos if c.get("concept_id"))
        costs = []
        for concept in conceptos:
            concept_rows = [c for c in candidatos if c.get("concept_id") == concept]
            
            # Fallback A: client_id específico + vessel_id específico
            row = next((c for c in concept_rows if c.get("client_id") == client_id and c.get("vessel_id") == vessel_id), None)
            
            # Fallback B: client_id específico + vessel_id == 'DEFAULT'
            if not row:
                row = next((c for c in concept_rows if c.get("client_id") == client_id and c.get("vessel_id") == "DEFAULT"), None)
                
            # Fallback C: client_id == 'DEFAULT' + vessel_id == 'DEFAULT'
            if not row:
                row = next((c for c in concept_rows if c.get("client_id") == "DEFAULT" and c.get("vessel_id") == "DEFAULT"), None)
                
            # Fallback D: client_id == 'DEFAULT' + vessel_id específico
            if not row:
                row = next((c for c in concept_rows if c.get("client_id") == "DEFAULT" and c.get("vessel_id") == vessel_id), None)
                
def compute_dynamic_port_scenarios(port_id: str, vessel_id: str, vparams: dict, port_hrs: float = 48.0):
    port_code = (port_id or "").strip().upper()
    
    # Extraer LOA y GRT del buque con fallbacks seguros
    loa = float(vparams.get("length") or vparams.get("loa") or 134.16)
    grt = float(vparams.get("gross_tonnage") or vparams.get("grt") or 8259)
    stay_days = max(1, int((port_hrs + 23.999) // 24.0))

    def calculate_scenario(is_casino: bool):
        dockage_rate_p = 1.50
        towage_rate_p = 800.00
        launch_rate_p = 85.00
        agency_fee_p = 1000.00
        tugs_in, tugs_out = 2, 2
        is_national = True

        if port_code == "MARCONA":
            extra_standby = 3000.00 if port_hrs > 48.0 else 0.0
            lighthouse_rate = 0.03 if is_national else 0.12
            total_lighthouse = round(lighthouse_rate * grt, 2)
            standby_base = min(1800.00, port_hrs * 40.0)

            items = [
                {'cost': 30508.48}, # SIA PSA
                {'cost': 150.00},   # Toll
                {'cost': total_lighthouse},
                {'cost': 450.00},   # Coord
                {'cost': 670.00},   # Sanidad
                {'cost': 400.00},   # Lancha
                {'cost': standby_base + extra_standby},
                {'cost': 1400.00},  # Agencia
                {'cost': 450.00}    # Gastos
            ]
        elif port_code == "MATARANI":
            base_psa = 3368.00
            psa_ot = base_psa * 0.25 if is_casino else 0.0
            total_psa = (base_psa * 2) + psa_ot
            lighthouse_rate = 0.03 if is_national else 0.12
            total_lighthouse = round(lighthouse_rate * grt, 2)
            total_dockage = round(0.65 * loa * port_hrs, 2)

            items = [
                {'cost': total_psa},
                {'cost': 787.30},   # Acceso/Amarre
                {'cost': total_lighthouse},
                {'cost': total_dockage},
                {'cost': 670.00},   # Sanidad
                {'cost': 960.00},   # Lanchas/Coord
                {'cost': 1100.00},  # Agencia
                {'cost': 450.00}    # Gastos
            ]
        elif port_code == "ILO":
            pilotage_total = 3000.00
            dockage_spcc = round(300.00 + (0.05 * grt * stay_days), 2)
            psa_towage = max(3600.00, 0.16 * grt * 2)
            psa_pos = 1400.00
            petranso_towage = round(0.18 * grt * 2 * 0.90, 2)
            petranso_pos = 1260.00
            ot_tugs = 1643.31 if is_casino else 0.0
            lighthouse_rate = 0.03 if is_national else 0.12
            total_lighthouse = round(lighthouse_rate * grt, 2)

            items = [
                {'cost': pilotage_total},
                {'cost': psa_towage + petranso_towage + ot_tugs},
                {'cost': psa_pos + petranso_pos + 680.00 + 150.00},
                {'cost': dockage_spcc},
                {'cost': total_lighthouse},
                {'cost': 2600.00},  # Lanchas
                {'cost': 1120.00},  # Sanidad
                {'cost': 900.00},   # Agencia
                {'cost': 400.00}    # Gastos
            ]
        elif port_code == "MEJILLONES":
            items = [
                {'cost': 12500.00}, # Practicaje y Remolque Chile
                {'cost': 4500.00},  # Amarre y Desamarre
                {'cost': 3200.00},  # Muelle / Uso Muelle
                {'cost': 1800.00},  # Lanchas
                {'cost': 2500.00},  # Agencia y Despacho
                {'cost': 1500.00 if is_casino else 0.0} # Recargo Overtime/Nocturno
            ]
        else:
            # CALLAO / GENERAL
            base_pilotage = max(750.00, 0.055 * grt)
            pilotage_out = base_pilotage * 1.25 if is_casino else base_pilotage
            total_pilotage = round(base_pilotage + pilotage_out, 2)
            towage_out_rate = towage_rate_p * 1.25 if is_casino else towage_rate_p
            total_towage = (towage_rate_p * tugs_in) + (towage_out_rate * tugs_out)
            total_access = 70.00 * 2
            lighthouse_rate = 0.03 if is_national else 0.12
            total_lighthouse = round(lighthouse_rate * grt, 2)
            total_dockage = round(dockage_rate_p * loa * port_hrs, 2)

            items = [
                {'cost': total_pilotage},
                {'cost': total_towage},
                {'cost': total_access},
                {'cost': total_lighthouse},
                {'cost': total_dockage},
                {'cost': launch_rate_p * 4},
                {'cost': 450.00},   # Coord
                {'cost': 200.00},   # Clearance
                {'cost': 520.00},   # Sanidad
                {'cost': agency_fee_p},
                {'cost': 450.00}    # Gastos
            ]

        return sum(item['cost'] for item in items)

    high_cost = calculate_scenario(is_casino=True)
    low_cost = calculate_scenario(is_casino=False)
    avg_cost = round((high_cost + low_cost) / 2.0, 2)
    return high_cost, low_cost, avg_cost


def calculate_detailed_port_costs(
    client_id: str,
    port_id: str,
    operation_type: str,
    vessel_id: str,
    port_costs_data: list,
    agency_matrix_data: list,
    port_cost_mode: str,
    vparams: dict,
    quantity: float,
    contract: dict,
    ports_db: dict
) -> dict:
    is_mejillones = (port_id or "").upper() == "MEJILLONES"

    def normalize_v_key(v_str: str) -> str:
        if not v_str:
            return ""
        return v_str.upper().replace("B/T", "").replace("BT", "").replace(" ", "").replace("_", "").replace("-", "").strip()

    # 1. MODO STATIC: Estricto desde port_cost_static por nave especifica sin fallbacks ficticios a DEFAULT
    if port_cost_mode == "static":
        target_v_clean = normalize_v_key(vessel_id)
        target_port_clean = (port_id or "").strip().upper()
        target_op_clean = (operation_type or "").strip().upper()

        matching_rows = [
            a for a in agency_matrix_data
            if (a.get("port_id") or "").strip().upper() == target_port_clean
            and (a.get("operation_type") or "").strip().upper() == target_op_clean
            and normalize_v_key(a.get("vessel_id")) == target_v_clean
        ]

        if matching_rows:
            breakdown = {}
            for r in matching_rows:
                sub_type = r.get("sub_operation_type") or "MAIN"
                breakdown[sub_type] = float(r.get("cost", 0.0))
            total_val = sum(breakdown.values())
            return {
                "total_cost": round(total_val, 2),
                "breakdown": breakdown
            }

        # Si NO existe tarifa estática para esa nave en la DB, retornar $0.00 estricto
        return {
            "total_cost": 0.0,
            "breakdown": {"agency_fee": 0.0}
        }

    # 2. MODO MATRIX: Modelo Matriz Compleja PxQ (Promedio entre Escenario Alto y Escenario Bajo)
    if port_cost_mode == "matrix":
        high_val, low_val, avg_val = compute_dynamic_port_scenarios(port_id, vessel_id, vparams, port_hrs=48.0)
        return {
            "total_cost": avg_val,
            "breakdown": {
                "escenario_alto": round(high_val, 2),
                "escenario_bajo": round(low_val, 2),
                "promedio_matriz": avg_val
            }
        }

    def get_terminal_costs_from_matrix(term_id: str):
        costs = [
            c for c in port_costs_data
            if c.get("client_id") == client_id 
            and c.get("port_id") == port_id 
            and c.get("terminal") == term_id
            and c.get("operation_type") == operation_type 
            and c.get("vessel_id") == vessel_id
        ]
        if not costs:
            costs = [
                c for c in port_costs_data
                if c.get("client_id") == client_id 
                and c.get("port_id") == port_id 
                and c.get("terminal") == term_id
                and c.get("operation_type") == operation_type 
                and c.get("vessel_id", "DEFAULT") == "DEFAULT"
            ]
        return costs

    def get_flat_cost_from_agency_matrix():
        target_v_clean = normalize_v_key(vessel_id)
        target_port_clean = (port_id or "").strip().upper()
        target_op_clean = (operation_type or "").strip().upper()

        matching = [
            a for a in agency_matrix_data
            if (a.get("port_id") or "").strip().upper() == target_port_clean
            and (a.get("operation_type") or "").strip().upper() == target_op_clean
            and normalize_v_key(a.get("vessel_id")) == target_v_clean
        ]
        if matching:
            breakdown = {}
            for r in matching:
                sub_type = r.get("sub_operation_type") or "MAIN"
                breakdown[sub_type] = float(r.get("cost", 0.0))
            return sum(breakdown.values()), breakdown
        return None

    # 3. Si es Mejillones, resolver las tres terminales
    if is_mejillones:
        terminals = ["TERMINAL_A", "INTERACID", "TERQUIM"]
        terminal_breakdowns = []
        
        for term in terminals:
            term_costs = get_terminal_costs_from_matrix(term)
            breakdown = {}
            for item in term_costs:
                concept = item["concept_id"]
                breakdown[concept] = float(item.get("cost", 0.0))
                
            # Si no hay desglose para esta terminal en port_costs_matrix, intentar fallback plano en agency_matrix
            if not breakdown:
                flat_res = get_flat_cost_from_agency_matrix()
                if flat_res is not None:
                    _, breakdown = flat_res
            
            # Asegurar que Mejillones conserve el costo de Loading Master si no está desglosado en la matriz
            if breakdown and "loading_master" not in breakdown:
                flat_res = get_flat_cost_from_agency_matrix()
                if flat_res is not None:
                    _, flat_breakdown = flat_res
                    lm_val = flat_breakdown.get("loading_master", 0.0)
                    if lm_val > 0:
                        breakdown["loading_master"] = lm_val
            
            if breakdown:
                terminal_breakdowns.append(breakdown)
                
        # Promediar
        avg_breakdown = {}
        if terminal_breakdowns:
            all_concepts = set()
            for b in terminal_breakdowns:
                all_concepts.update(b.keys())
                
            for concept in all_concepts:
                total_val = sum(b.get(concept, 0.0) for b in terminal_breakdowns)
                avg_breakdown[concept] = round(total_val / len(terminal_breakdowns), 2)
                
        total_cost = sum(avg_breakdown.values())
        # Si todo falló, retornar default
        if total_cost == 0:
            # Sin datos en matriz: retornar 0 como señal de dato faltante
            avg_breakdown = {}
            
        return {
            "total_cost": round(total_cost, 2),
            "breakdown": avg_breakdown
        }
    else:
        # Para otros puertos
        # Intentar obtener desglose de port_costs_matrix
        costs = get_terminal_costs_from_matrix("GENERAL")
        if not costs:
            # Intentar cualquier terminal en port_costs_matrix
            active_terminals = set(c.get("terminal") for c in port_costs_data if c.get("port_id") == port_id)
            if active_terminals:
                first_term = list(active_terminals)[0]
                costs = get_terminal_costs_from_matrix(first_term)
                
        breakdown = {}
        for item in costs:
            concept = item["concept_id"]
            breakdown[concept] = float(item.get("cost", 0.0))
            
        # Si no hay desglose detallado en port_costs_matrix, buscar fallback consolidado en agency_matrix
        if not breakdown:
            flat_res = get_flat_cost_from_agency_matrix()
            if flat_res is not None:
                _, breakdown = flat_res
                
        # Si sigue sin haber datos, usar los defaults de port_costs_matrix
        if not breakdown:
            def_costs = [
                c for c in port_costs_data
                if c.get("client_id") == client_id 
                and c.get("port_id") == port_id 
                and c.get("terminal") == "GENERAL"
                and c.get("operation_type") == operation_type 
                and c.get("vessel_id", "DEFAULT") == "DEFAULT"
            ]
            if not def_costs:
                def_costs = [
                    c for c in port_costs_data
                    if c.get("client_id") == "DEFAULT" 
                    and c.get("port_id") == port_id 
                    and c.get("terminal") == "GENERAL"
                    and c.get("operation_type") == operation_type 
                    and c.get("vessel_id", "DEFAULT") == "DEFAULT"
                ]
            for item in def_costs:
                concept = item["concept_id"]
                breakdown[concept] = float(item.get("cost", 0.0))
                
        # Si todo falló por completo, retornar 0 como señal de dato faltante en maestros
        if not breakdown:
            breakdown = {"agency_fee": 0.0}
            
        total_cost = sum(breakdown.values())
        return {
            "total_cost": round(total_cost, 2),
            "breakdown": breakdown
        }

def run_forecast_simulation(request: ForecastRequest) -> Dict[str, Any]:
    supabase = get_supabase()
    
    # Pre-cargar maestros usando el cache global
    masters = get_cached_masters(supabase)
    
    vessels_data = masters["vessels"]
    vessels_db = {}
    for v in vessels_data:
        v_id = (v.get("vessel_id") or "").strip().upper()
        v_name = (v.get("vessel_name") or "").strip().upper()
        if v_id:
            vessels_db[v_id] = v
            vessels_db[v_id.replace("_", " ")] = v
        if v_name:
            vessels_db[v_name] = v
            vessels_db[v_name.replace("_", " ")] = v
    
    routes_data = masters.get("distances") or []
    routes_db = {}
    for r in routes_data:
        p_a = str(r['port_a']).strip().upper()
        p_b = str(r['port_b']).strip().upper()
        routes_db[f"{p_a}-{p_b}"] = r
        routes_db[f"{p_b}-{p_a}"] = r
    
    routes_clients_data = masters.get("routes_clients") or []
    routes_prospects_data = masters.get("routes_quotes") or []
    contracts_data = masters.get("contracts") or []
    routes_master_data = routes_clients_data + routes_prospects_data + contracts_data
    
    bunker_data = masters["bunker_prices"]
    # Asegurar que se tome el precio con la fecha más reciente ordenando ascendentemente
    bunker_data = sorted(bunker_data, key=lambda x: x.get("date", "2000-01-01"))
    bunker_db = {b["fuel_type"]: b["market_price_usd"] for b in bunker_data}
    bunker_dates_db = {b["fuel_type"]: str(b["date"]) if b.get("date") else "N/A" for b in bunker_data}
    
    # Maestro de Puertos (tabla nueva) — límites físicos de terminales
    ports_data = masters["ports"]
    ports_db = {p["port_id"]: p for p in ports_data}
    
    # Maestro de Contratos — tasas operativas que impone el cliente (c_load, c_disch)
    # Llave: (client_id, origin_port_id, destination_port_id) — solo contratos activos
    contracts_data = masters["contracts"]
    contracts_db = {
        (c["client_id"], c.get("origin_port_id", "ILO"), c["destination_port_id"]): c
        for c in contracts_data
        if c.get("is_active", True)  # Solo contratos vigentes
    }
    
    # Tarifas de flete por bracket de tonelaje
    tariffs_data = masters["contract_tariffs"]
    
    port_costs_data = masters["port_costs_matrix"]
    agency_matrix_data = masters["port_cost_static"]
    
    agg_data = {}
    
    for line in request.projection_lines:
        client = line.client_id
        vessel = line.vessel_id
        month = line.month_index
        
        # 1. Fetching Vessel Data
        clean_vessel_key = (vessel or "").strip().upper()
        v_data = vessels_db.get(clean_vessel_key) or vessels_db.get(clean_vessel_key.replace("_", " ")) or {}
        
        # 2. Fetching Route Data
        p1, p2 = sorted([line.origin_port_id, line.destination_port_id])
        route_key = f"{p1}-{p2}"
        r_data = routes_db.get(route_key, {})

        # 3. Fetching Contract Data — tasas operativas (c_load / c_disch) desde tabla `contracts`
        # Llave completa: cliente + puerto_origen + puerto_destino (solo activos)
        contract = contracts_db.get((client, line.origin_port_id, line.destination_port_id))
        # Fallback legacy (si origin_port_id aún no existe en DB): buscar solo por cliente+destino
        if contract is None:
            contract = next(
                (c for c in contracts_data if c["client_id"] == client and c["destination_port_id"] == line.destination_port_id and c.get("is_active", True)),
                None
            )
        
        # 4. Buscar Tarifa en contract_tariffs según quantity (cache pre-cargado)
        # NOTA: Tras migración 20260624000008, contract_tariffs ya NO tiene client_id/destination_port_id.
        #       Ahora se filtra por contract_id obtenido del contrato padre.
        contract_tariff_val = 0
        matching_tariffs = []

        if contract:
            contract_id_val = contract.get("contract_id")
            if contract_id_val:
                matching_tariffs = [
                    t for t in tariffs_data
                    if str(t.get("contract_id", "")) == str(contract_id_val)
                    and (not t.get("origin_port_id") or t.get("origin_port_id") == line.origin_port_id)
                    and (not t.get("destination_port_id") or t.get("destination_port_id") == line.destination_port_id)
                ]

        if not matching_tariffs:
            matching_tariffs = [
                t for t in tariffs_data
                if t.get("client_id") == client
                and t.get("destination_port_id") == line.destination_port_id
            ]

        if matching_tariffs:
            matching_tariffs = sorted(matching_tariffs, key=lambda x: x.get("min_tonnage", 0))
            for tariff in matching_tariffs:
                if tariff.get("min_tonnage", 0) <= line.quantity <= tariff.get("max_tonnage", 999999):
                    contract_tariff_val = float(tariff.get("freight_rate", 0))
                    break
            if contract_tariff_val == 0:
                for tariff in matching_tariffs:
                    if line.quantity <= tariff.get("max_tonnage", 999999):
                        contract_tariff_val = float(tariff.get("freight_rate", 0))
                        break
            if contract_tariff_val == 0:
                highest_bracket = max(matching_tariffs, key=lambda x: x.get("max_tonnage", 0))
                contract_tariff_val = float(highest_bracket.get("freight_rate", 0))

        if contract_tariff_val > 0:
            freight_rate = contract_tariff_val
        elif getattr(line, 'custom_tariff', None) is not None:
            freight_rate = float(line.custom_tariff)
        else:
            freight_rate = 0
        
        if contract and contract.get("bunker_baseline_price_ifo") and float(contract.get("bunker_baseline_price_ifo")) > 0:
            p_ifo = float(contract.get("bunker_baseline_price_ifo"))
        elif line.forecast_bunker_price_ifo:
            p_ifo = float(line.forecast_bunker_price_ifo)
        else:
            p_ifo = float(bunker_db.get("IFO", 450))

        if contract and contract.get("bunker_baseline_price_mdo") and float(contract.get("bunker_baseline_price_mdo")) > 0:
            p_mdo = float(contract.get("bunker_baseline_price_mdo"))
        elif line.forecast_bunker_price_mdo:
            p_mdo = float(line.forecast_bunker_price_mdo)
        else:
            p_mdo = float(bunker_db.get("MDO", 800))
        
        # Determinar si es una ruta spot o cotización
        quote_id = getattr(line, 'quote_id', None)
        is_spot_route = (line.origin_port_id == "SPOT") or (quote_id is not None)
        spot_route = None
        spot_id = None
        
        if quote_id is not None:
            # Buscar directamente por spot_id en routes_quotes, routes_clients y contracts
            spot_route = next((s for s in routes_master_data if s and (
                str(s.get("spot_id")) == str(quote_id) or 
                str(s.get("id")) == str(quote_id) or 
                str(s.get("route_id")) == str(quote_id) or 
                str(s.get("contract_id")) == str(quote_id) or 
                str(s.get("name")) == str(quote_id)
            )), None)
            if spot_route:
                is_spot_route = True
                spot_id = quote_id
        
        if not spot_route:
            if (line.origin_port_id == "SPOT"):
                spot_id = line.destination_port_id
                spot_route = next((s for s in routes_master_data if s and (s.get("route_id") == spot_id or s.get("name") == spot_id or s.get("client_route_id") == spot_id or s.get("prospect_route_id") == spot_id)), {})
            else:
                lookup_key = f"{client.upper()}.{line.origin_port_id.upper()}.{line.destination_port_id.upper()}.{line.origin_port_id.upper()}.{vessel.upper()}"
                spot_route = next((s for s in routes_master_data if s and (s.get("name", "").upper() == lookup_key)), None)
                
                if not spot_route:
                    for s in routes_master_data:
                        if not s:
                            continue
                        s_name = (s.get("name") or "").upper()
                        if not s_name.startswith(f"{client.upper()}."):
                            continue
                        tramos_list = (s.get("legs_data") or {}).get("tramos", [])
                        laden_tramos = [t for t in tramos_list if t and t.get("type", "").upper() == "LADEN"]
                        if laden_tramos:
                            first_o = (laden_tramos[0].get("origin_port_id") or "").upper()
                            last_d = (laden_tramos[-1].get("destination_port_id") or "").upper()
                            if last_d == line.destination_port_id.upper() or (first_o == line.origin_port_id.upper() and last_d == line.destination_port_id.upper()):
                                spot_route = s
                                break

                if spot_route:
                    is_spot_route = True
                    spot_id = spot_route.get("route_id") or spot_route.get("client_route_id") or spot_route.get("prospect_route_id") or spot_route.get("name")
        
        if is_spot_route and spot_route:
            legs_data = spot_route.get("legs_data") or {}
            
            import copy
            tce_req = v_data.get("tce_required", 0)
            total_laden_qty = 0.0      # Se calcula en bloque multicotizador; 0 en SpotRouter tradicional
            total_laden_revenue = 0.0  # Ídem
            
            if "tramos" in legs_data:
                # -- ESCENARIO MULTICOTIZADOR / ESTIMADOR EXCEL (Fase 2) --
                # Los tramos ya vienen enriquecidos desde handleSaveRoute (Fase 1).
                # Política: respetar los datos grabados y solo recalcular lo que falte.
                tramos_copy = copy.deepcopy(legs_data.get("tramos", []))
 
                # --- VESSEL PARAMS: usar los de la nave seleccionada en la matriz (BUQUE COMODÍN) ---
                # Si el usuario cambió la nave en la grilla del Forecast (vessel != nave original de la cotización),
                # ignoramos saved_vparams y usamos v_data (nueva nave).
                original_vessel_id = legs_data.get("vessel_id") or legs_data.get("vesselParams", {}).get("vessel_id", "")
                if vessel and original_vessel_id and vessel.upper() != original_vessel_id.upper():
                    # El usuario cambió la nave -> Usar especificaciones de la nueva nave (v_data)
                    vparams = copy.deepcopy(v_data)
                else:
                    # Usar buque original/guardado con sus custom params si los hay
                    saved_vparams = legs_data.get("vesselParams", {})
                    vparams = copy.deepcopy(v_data)
                    if saved_vparams:
                        for k, v in saved_vparams.items():
                            if v is not None and v != "":
                                vparams[k] = v
                                if k.startswith("bunker_consumption_"):
                                    short_k = k.replace("bunker_consumption_", "consumption_")
                                    vparams[short_k] = v

                # --- BUNKER: usar precios cotizados guardados en legs_data (o fallbacks dinámicos si no existen) ---
                saved_vparams = legs_data.get("vesselParams", {})
                saved_ifo = float(saved_vparams.get("bunker_price_ifo") or legs_data.get("bunker_price_ifo") or 0)
                saved_mdo = float(saved_vparams.get("bunker_price_mdo") or legs_data.get("bunker_price_mdo") or 0)
                final_p_ifo = saved_ifo if saved_ifo > 0 else p_ifo
                final_p_mdo = saved_mdo if saved_mdo > 0 else p_mdo
                vparams["bunker_price_ifo"] = final_p_ifo
                vparams["bunker_price_mdo"] = final_p_mdo
                vparams["tce_required"] = tce_req

                # --- TRAMOS: enriquecer solo lo necesario ---
                total_laden_qty = 0.0
                total_laden_revenue = 0.0
                puertos_cfg = legs_data.get("puertosConfig", [])

                for idx, tr in enumerate(tramos_copy):
                    tr["bunker_price_ifo"] = final_p_ifo
                    tr["bunker_price_mdo"] = final_p_mdo

                    # Normalización de Weather Factor (3.0 -> 0.03)
                    wf = float(tr.get("weather_factor", 0))
                    if wf > 1.0:
                        tr["weather_factor"] = wf / 100.0

                    # Mapeo de puertosConfig a cada tramo de la ruta
                    p_orig = puertos_cfg[idx] if idx < len(puertos_cfg) else {}
                    p_dest = puertos_cfg[idx + 1] if (idx + 1) < len(puertos_cfg) else {}

                    c_orig = float(p_orig.get("manual_port_cost") or 0)
                    c_dest = float(p_dest.get("manual_port_cost") or 0)

                    if float(tr.get("agency_costs_origin", 0)) <= 0 and c_orig > 0:
                        tr["agency_costs_origin"] = c_orig
                    if float(tr.get("agency_costs_destination", 0)) <= 0 and c_dest > 0:
                        tr["agency_costs_destination"] = c_dest

                    tr["origin_action"] = p_orig.get("action", tr.get("origin_action", "NONE"))
                    tr["destination_action"] = p_dest.get("action", tr.get("destination_action", "NONE"))
                    tr["muellaje_cost_origin"] = float(p_orig.get("muellaje_cost") or 0)
                    tr["muellaje_cost_dest"] = float(p_dest.get("muellaje_cost") or 0)
                    tr["refacturar_muellaje"] = True

                    tr["port_overhead_hours_origin"] = float(p_orig.get("time_to_count") or p_orig.get("overhead") or 0)
                    tr["port_overhead_hours_dest"] = float(p_dest.get("time_to_count") or p_dest.get("overhead") or 0)

                    if p_dest.get("action") == "CARGAR":
                        tr["positioning_carga_hrs"] = float(p_dest.get("positioning") or 0)
                    elif p_dest.get("action") == "DESCARGAR":
                        tr["positioning_descarga_hrs"] = float(p_dest.get("positioning") or 0)

                    tipo = tr.get("type", "").upper()
                    if tipo == "LADEN":
                        # PRIORIDAD ABSOLUTA: Tarifa contractual de Supabase
                        if contract_tariff_val > 0:
                            tr["freight_rate"] = float(contract_tariff_val)
                        elif line.custom_tariff is not None:
                            tr["freight_rate"] = float(line.custom_tariff)
                        elif freight_rate > 0:
                            tr["freight_rate"] = float(freight_rate)
                        # Acumular para yield ponderado
                        total_laden_qty += float(tr.get("quantity", 0))
                        total_laden_revenue += float(tr.get("quantity", 0)) * float(tr.get("freight_rate", 0))

                        orig_port = tr.get("origin_port_id")
                        dest_port = tr.get("destination_port_id")

                        # Respetar costos de puerto cotizados si existen (> 0); de lo contrario calcular
                        if orig_port and tr.get("origin_action", "NONE") != "NONE" and float(tr.get("agency_costs_origin", 0)) <= 0:
                            tr["agency_costs_origin"] = calculate_detailed_port_costs(
                                client, orig_port, "CARGA", vessel,
                                port_costs_data, agency_matrix_data, request.port_cost_mode,
                                vparams, float(tr.get("quantity", 0)), contract, ports_db
                            )["total_cost"]

                        if dest_port and tr.get("destination_action", "NONE") != "NONE" and float(tr.get("agency_costs_destination", 0)) <= 0:
                            tr["agency_costs_destination"] = calculate_detailed_port_costs(
                                client, dest_port, "DESCARGA", vessel,
                                port_costs_data, agency_matrix_data, request.port_cost_mode,
                                vparams, float(tr.get("quantity", 0)), contract, ports_db
                            )["total_cost"]

                # --- YIELD PONDERADO: tarifa representativa para la Matriz ---
                yield_flete = (total_laden_revenue / total_laden_qty) if total_laden_qty > 0 else 0.0

                # --- INYECCIÓN DE PRECIOS BÚNKER GUARDADOS EN LEGS_DATA AL PAYLOAD DE SIMULACIÓN ---
                b_ifo = float(legs_data.get("bunker_price_ifo") if legs_data.get("bunker_price_ifo") is not None else (legs_data.get("bunker_ifo") if legs_data.get("bunker_ifo") is not None else (contract.get("bunker_baseline_price_ifo") if contract and contract.get("bunker_baseline_price_ifo") is not None else 0.0)))
                b_mdo = float(legs_data.get("bunker_price_mdo") if legs_data.get("bunker_price_mdo") is not None else (legs_data.get("bunker_mdo") if legs_data.get("bunker_mdo") is not None else (contract.get("bunker_baseline_price_mdo") if contract and contract.get("bunker_baseline_price_mdo") is not None else 0.0)))

                payload = {
                    "vessel_params": vparams,
                    "tramos": tramos_copy,
                    "puertosConfig": legs_data.get("puertosConfig", []),
                    "bunker_price_ifo": b_ifo,
                    "bunker_price_mdo": b_mdo,
                    "port_cost_mode": request.port_cost_mode,
                    "client_id": client,
                    "vessel_id": vessel
                }

                from backend.spot_engine import calculate_multicotizador_simulation
                spot_res = calculate_multicotizador_simulation(payload)
                consolidated = spot_res.get("consolidated", {})

                # --- COMISIONES: aplicar addressCommPct y brokerCommPct del legs_data ---
                addr_comm_pct = float(legs_data.get("addressCommPct", 0))
                broker_comm_pct = float(legs_data.get("brokerCommPct", 0))
                total_comm_pct = addr_comm_pct + broker_comm_pct
                gross_revenue = consolidated.get("gross_revenue_total") or (consolidated.get("total_freight_revenue", 0) + consolidated.get("total_refacturacion_muellaje", 0))
                total_commissions = gross_revenue * (total_comm_pct / 100)
                net_revenue = gross_revenue - total_commissions
                pnl_after_comm = net_revenue - consolidated.get("total_port_costs", 0) - consolidated.get("total_bunker_costs", 0)
                total_days = consolidated.get("total_days", 0)
                tce_real = (pnl_after_comm / total_days) if total_days > 0 else 0

                unit_result = {
                    "gross_income": round(gross_revenue, 2),
                    "gross_income_unit": round(gross_revenue, 2),
                    "total_commissions": round(total_commissions, 2),
                    "net_income": round(net_revenue, 2),
                    "total_port_costs": consolidated.get("total_port_costs", 0),
                    "total_bunker_costs": consolidated.get("total_bunker_costs", 0),
                    "voyage_result": round(pnl_after_comm, 2),
                    "pl_vs_required": round(pnl_after_comm - (total_days * tce_req), 2),
                    "tce_real": round(tce_real, 2),
                    "tce_required_unit": tce_req,
                    "flete_unit": yield_flete if yield_flete > 0 else freight_rate,
                    "carga_unit": total_laden_qty if total_laden_qty > 0 else line.quantity,
                    "total_duration": total_days,
                    "total_distance": consolidated.get("total_distance", 0),
                    "sea_days": consolidated.get("total_sea_days", 0),
                    "port_days": consolidated.get("total_port_days", 0),
                    "bunker_ifo_tonnage": consolidated.get("bunker_ifo_tonnage", 0),
                    "bunker_mdo_tonnage": consolidated.get("bunker_mdo_tonnage", 0),
                    "pcm_projected": round(tce_real - tce_req, 2),
                    "audit_trail": {
                        "bunker_costs": {
                            "formula": "Multi-tramo: Suma de consumos por cada tramo (Laden/Ballast)",
                            "values": f"IFO: {consolidated.get('bunker_ifo_tonnage', 0)} t, MDO: {consolidated.get('bunker_mdo_tonnage', 0)} t"
                        },
                        "commissions": {
                            "formula": f"Gross Revenue × ({addr_comm_pct}% addr + {broker_comm_pct}% broker)",
                            "values": f"Gross: {round(gross_revenue,2)} | Comm: {round(total_commissions,2)} | Net: {round(net_revenue,2)}"
                        }
                    }
                }
                # Guardar yield ponderado para usar en inputs de salida
                freight_rate = yield_flete
            else:
                # -- ESCENARIO SPOT ROUTER TRADICIONAL --
                legs = legs_data.get("legs", {})
                legs_copy = copy.deepcopy(legs)
                
                laden_leg = legs_copy.get("laden", {})
                if laden_leg:
                    laden_leg["quantity"] = line.quantity
                    laden_leg["freight_rate"] = freight_rate
                    
                    orig_port = laden_leg.get("origin_port_id")
                    dest_port = laden_leg.get("destination_port_id")
                    if orig_port:
                        laden_leg["agency_costs_origin"] = calculate_detailed_port_costs(
                            "DEFAULT", orig_port, 'CARGA', "DEFAULT", port_costs_data, agency_matrix_data, request.port_cost_mode,
                            v_data, line.quantity, contract, ports_db
                        )["total_cost"]
                    if dest_port:
                        laden_leg["agency_costs_destination"] = calculate_detailed_port_costs(
                            "DEFAULT", dest_port, 'DESCARGA', "DEFAULT", port_costs_data, agency_matrix_data, request.port_cost_mode,
                            v_data, line.quantity, contract, ports_db
                        )["total_cost"]
                    
                legs_copy["bunker_price_ifo"] = p_ifo
                legs_copy["bunker_price_mdo"] = p_mdo
                
                payload = {
                    "vessel_params": v_data,
                    "legs": legs_copy
                }
                from backend.spot_engine import calculate_spot_multileg
                spot_res = calculate_spot_multileg(payload)
                consolidated = spot_res.get("consolidated", {})
                
                tce_real = consolidated.get("tce_real", 0)
                
                unit_result = {
                    "net_income": consolidated.get("total_freight_revenue", 0),
                    "total_port_costs": consolidated.get("total_port_costs", 0),
                    "total_bunker_costs": consolidated.get("total_bunker_costs", 0),
                    "voyage_result": consolidated.get("pnl_net_utility", 0),
                    "pl_vs_required": consolidated.get("pnl_net_utility", 0) - (consolidated.get("total_days", 0) * tce_req),
                    "tce_real": tce_real,
                    "total_duration": consolidated.get("total_days", 0),
                    "sea_days": consolidated.get("total_sea_days", 0),
                    "port_days": consolidated.get("total_port_days", 0),
                    "bunker_ifo_tonnage": consolidated.get("bunker_ifo_tonnage", 0),
                    "bunker_mdo_tonnage": consolidated.get("bunker_mdo_tonnage", 0),
                    "pcm_projected": tce_real - tce_req,
                    "audit_trail": {
                        "bunker_costs": {
                            "formula": "Tons IFO = (sea_d * cons_sea) + (idle_d_norm * cons_idle) + (load_d * cons_load) + (disch_d * cons_disch)<br/>"
                                       "Tons MDO = (sea_d * cons_sea) + (idle_d_norm * cons_idle) + (load_d * cons_load) + (disch_d * cons_disch)<br/>"
                                       "Costo Tránsito = (Tons IFO * price_IFO) + (Tons MDO * price_MDO)",
                            "values": f"IFO Consolidado: {consolidated.get('bunker_ifo_tonnage', 0)} t<br/>MDO Consolidado: {consolidated.get('bunker_mdo_tonnage', 0)} t<br/>Costo: {consolidated.get('total_bunker_costs', 0)}"
                        }
                    }
                }
            
            inputs = {
                "route_distance": consolidated.get("total_distance", 0),
                # Para rutas multicotizador: cantidad total cargada y yield ponderado
                # Para SpotRouter tradicional: quantity y freight_rate de la línea del forecast
                "quantity": total_laden_qty if ("tramos" in legs_data and total_laden_qty > 0) else line.quantity,
                "freight_rate": freight_rate  # yield ponderado (multi) o custom_tariff (tradicional)
            }
            
            if line.origin_port_id == "SPOT":
                route_key = f"SPOT-{spot_id}"
            else:
                route_key = f"{line.origin_port_id}-{line.destination_port_id}"
            
        else:
            # Calcular costos detallados usando el nuevo helper
            orig_result = calculate_detailed_port_costs(client, line.origin_port_id, 'CARGA', vessel, port_costs_data, agency_matrix_data, request.port_cost_mode, v_data, line.quantity, contract, ports_db)
            dest_result = calculate_detailed_port_costs(client, line.destination_port_id, 'DESCARGA', vessel, port_costs_data, agency_matrix_data, request.port_cost_mode, v_data, line.quantity, contract, ports_db)
            
            ag_orig = orig_result["total_cost"]
            ag_dest = dest_result["total_cost"]

            # Construir Inputs para engine
            inputs = {
                "quantity": line.quantity,
                "freight_rate": freight_rate,
                "route_distance": r_data.get("route_distance", 0),
                "vessel_speed": v_data.get("vessel_speed", 0),
                "weather_factor_laden": r_data.get("weather_factor_laden", r_data.get("weather_factor", 0)),
                "weather_factor_ballast": r_data.get("weather_factor_ballast", r_data.get("weather_factor", 0)),
                "port_overhead_hours_origin": float(contract.get("time_to_count_carga_hrs") if contract and contract.get("time_to_count_carga_hrs") is not None else 6.0),
                "port_overhead_hours_dest": float(contract.get("time_to_count_descarga_hrs") if contract and contract.get("time_to_count_descarga_hrs") is not None else 6.0),
                "positioning_carga_hrs": float(contract.get("maneuver_carga_hrs") if contract and contract.get("maneuver_carga_hrs") is not None else 0.0),
                "positioning_descarga_hrs": float(contract.get("maneuver_descarga_hrs") if contract and contract.get("maneuver_descarga_hrs") is not None else 0.0),
                "vessel_max_load_intake_limit": v_data.get("vessel_max_load_intake_limit", 0),
                # Limites fisicos de terminales desde tabla `ports`
                "max_terminal_load_rate": ports_db.get(line.origin_port_id, {}).get("max_load_rate", 0),
                "vessel_pump_discharge_rate": v_data.get("vessel_pump_discharge_rate", 0),
                "port_max_discharge_limit": ports_db.get(line.destination_port_id, {}).get("max_disch_rate", 0),
                "agency_costs_origin": ag_orig,
                "agency_costs_destination": ag_dest,
                "loading_master_dest": dest_result["breakdown"].get("loading_master", 0.0),
                "bunker_price_ifo": p_ifo,
                "bunker_price_mdo": p_mdo,
                "bunker_price_date": bunker_dates_db.get("IFO", "N/A"),
                "tce_required": v_data.get("tce_required", 0),
                "bunker_consumption_sea_ifo": v_data.get("consumption_sea_ifo", 0),
                "bunker_consumption_idle_ifo": v_data.get("consumption_idle_ifo", 0),
                "bunker_consumption_load_ifo": v_data.get("consumption_load_ifo", 0),
                "grt": v_data.get("grt", 0),
                "dwt": v_data.get("dwt", 0),
                "dwcc": v_data.get("dwcc", 0),
                "length": v_data.get("length", 0),
                "beam": v_data.get("beam", 0),
                "bunker_consumption_disch_ifo": v_data.get("consumption_disch_ifo", 0),
                "bunker_consumption_sea_mdo": v_data.get("consumption_sea_mdo", 0),
                "bunker_consumption_idle_mdo": v_data.get("consumption_idle_mdo", 0),
                "bunker_consumption_load_mdo": v_data.get("consumption_load_mdo", 0),
                "bunker_consumption_disch_mdo": v_data.get("consumption_disch_mdo", 0),
                "contract_agreed_load_rate": contract.get("load_rate") if contract else None,
                "contract_agreed_discharge_rate": contract.get("discharge_rate") if contract else None,
                "address_commission": float(contract.get("address_commission", 0.0)) if contract else 0.0,
                "broker_commission": float(contract.get("broker_commission", 0.0)) if contract else 0.0,
                "is_round_trip": True
            }
            
            # BAF Logic si es necesario
            if contract and contract.get("bunker_baseline_price_ifo") and line.forecast_bunker_price_ifo:
                 inputs["freight_rate"] = calculate_baf_adjusted_rate(inputs, contract, line.forecast_bunker_price_ifo)

            unit_result = calculate_voyage_pnl(inputs)
            route_key = f"{line.origin_port_id}-{line.destination_port_id}"
        
        freq = line.monthly_frequency
        
        # Apply Frequency for aggregate totals, but keep unit values for the Ledger view
        monthly_result = {
            "freq": freq,
            "vessel_demurrage_rate": float(contract.get("demurrage_rates", {}).get(vessel, 0.0)) if contract and isinstance(contract.get("demurrage_rates"), dict) else 0.0,
            "gross_income": unit_result.get("gross_income", inputs["quantity"] * inputs["freight_rate"]) * freq,
            "total_commissions": unit_result.get("total_commissions", 0.0) * freq,
            "net_income": unit_result["net_income"] * freq,
            "total_port_costs": unit_result["total_port_costs"] * freq,
            "total_bunker_costs": unit_result["total_bunker_costs"] * freq,
            "voyage_result": unit_result["voyage_result"] * freq,
            "pl_vs_required": unit_result["pl_vs_required"] * freq,
            "tce_real": unit_result["tce_real"],
            "total_duration": unit_result["total_duration"] * freq,
            # Unit details for Ledger
            "distancia_total": unit_result.get("total_distance", inputs.get("route_distance")),
            "carga_unit": inputs["quantity"],
            "flete_unit": inputs["freight_rate"],
            "gross_income_unit": unit_result.get("gross_income", inputs["quantity"] * inputs["freight_rate"]),
            "address_comm_pct": inputs.get("address_commission", 0.0),
            "broker_comm_pct": inputs.get("broker_commission", 0.0),
            "total_commissions_unit": unit_result.get("total_commissions", 0.0),
            "net_income_unit": unit_result["net_income"],
            "sea_days_unit": unit_result["sea_days"],
            "port_days_unit": unit_result["port_days"],
            "total_duration_unit": unit_result["total_duration"],
            "price_ifo_unit": float(p_ifo),
            "bunker_ifo_tonnage_unit": unit_result["bunker_ifo_tonnage"],
            "bunker_ifo_cost_unit": float(unit_result["bunker_ifo_tonnage"] * p_ifo),
            "price_mdo_unit": float(p_mdo),
            "bunker_mdo_tonnage_unit": unit_result["bunker_mdo_tonnage"],
            "bunker_mdo_cost_unit": float(unit_result["bunker_mdo_tonnage"] * p_mdo),
            "total_bunker_costs_unit": unit_result["total_bunker_costs"],
            "total_port_costs_unit": unit_result["total_port_costs"],
            "voyage_result_unit": unit_result["voyage_result"],
            "tce_real_unit": unit_result["tce_real"],
            "tce_required_unit": float(v_data.get("tce_required", 13000.0)),
            "tce_cost_total_unit": float(unit_result["total_duration"] * float(v_data.get("tce_required", 13000.0))),
            "pcm_projected": unit_result["pcm_projected"],
            "pl_vs_required_unit": unit_result["pl_vs_required"],
            "actual_load_rate": unit_result.get("actual_load_rate", 0.0),
            "actual_discharge_rate": unit_result.get("actual_discharge_rate", 0.0),
            "audit_trail": unit_result.get("audit_trail", {}),
            "raw_inputs": inputs,
            "route_name": spot_route.get("name") if is_spot_route else None,
            "port_costs_breakdown": {
                "origin": {} if is_spot_route else orig_result.get("breakdown", {}),
                "destination": {} if is_spot_route else dest_result.get("breakdown", {})
            },
            "port_costs_audit": {
                "origin": {} if is_spot_route else orig_result.get("audit_trail", {}),
                "destination": {} if is_spot_route else dest_result.get("audit_trail", {})
            }
        }
        
        if client not in agg_data:
            agg_data[client] = {}
        if route_key not in agg_data[client]:
            agg_data[client][route_key] = {}
        if vessel not in agg_data[client][route_key]:
            agg_data[client][route_key][vessel] = {}
            
        agg_data[client][route_key][vessel][month] = monthly_result
        
    return {
        "status": "success",
        "aggregated_data": agg_data
    }

def run_forecast_simulation_universal(request: ForecastRequest) -> Dict[str, Any]:
    supabase = get_supabase()
    clear_forecast_cache()
    masters = get_cached_masters(supabase)
    
    vessels_data = masters["vessels"]
    vessels_db = {v["vessel_id"]: v for v in vessels_data}
    
    routes_data = masters.get("distances") or []
    routes_db = {}
    for r in routes_data:
        p_a = str(r['port_a']).strip().upper()
        p_b = str(r['port_b']).strip().upper()
        routes_db[f"{p_a}-{p_b}"] = r
        routes_db[f"{p_b}-{p_a}"] = r
    
    routes_clients_data = masters.get("routes_clients") or []
    routes_prospects_data = masters.get("routes_quotes") or []
    contracts_data = masters.get("contracts") or []
    routes_master_data = routes_clients_data + routes_prospects_data + contracts_data
    
    bunker_data = masters["bunker_prices"]
    bunker_data = sorted(bunker_data, key=lambda x: x.get("date", "2000-01-01"))
    bunker_db = {b["fuel_type"]: b["market_price_usd"] for b in bunker_data}
    bunker_dates_db = {b["fuel_type"]: str(b["date"]) if b.get("date") else "N/A" for b in bunker_data}
    
    ports_data = masters["ports"]
    ports_db = {p["port_id"]: p for p in ports_data}
    
    contracts_data = masters["contracts"]
    contracts_db = {
        (c["client_id"], c.get("origin_port_id", "ILO"), c["destination_port_id"]): c
        for c in contracts_data
        if c.get("is_active", True)
    }
    
    tariffs_data = masters["contract_tariffs"]
    
    port_costs_data = masters["port_costs_matrix"]
    agency_matrix_data = masters["port_cost_static"]
    
    agg_data = {}
    
    for line in request.projection_lines:
        client = line.client_id
        vessel = line.vessel_id
        month = line.month_index
        
        v_data = vessels_db.get(vessel, {})
        
        p1, p2 = sorted([line.origin_port_id, line.destination_port_id])
        route_key = f"{p1}-{p2}"
        r_data = routes_db.get(route_key, {})

        contract = contracts_db.get((client, line.origin_port_id, line.destination_port_id))
        if contract is None:
            contract = next(
                (c for c in contracts_data if c["client_id"] == client and c["destination_port_id"] == line.destination_port_id and c.get("is_active", True)),
                None
            )
        
        contract_tariff_val = 0
        matching_tariffs = []

        if contract:
            contract_id_val = contract.get("contract_id")
            if contract_id_val:
                matching_tariffs = [
                    t for t in tariffs_data
                    if str(t.get("contract_id", "")) == str(contract_id_val)
                    and (not t.get("origin_port_id") or t.get("origin_port_id") == line.origin_port_id)
                    and (not t.get("destination_port_id") or t.get("destination_port_id") == line.destination_port_id)
                ]

        if not matching_tariffs:
            matching_tariffs = [
                t for t in tariffs_data
                if t.get("client_id") == client
                and t.get("destination_port_id") == line.destination_port_id
            ]

        if matching_tariffs:
            matching_tariffs = sorted(matching_tariffs, key=lambda x: float(x.get("min_tonnage", 0)))
            for tariff in matching_tariffs:
                min_t = float(tariff.get("min_tonnage", 0))
                max_t = float(tariff.get("max_tonnage", 999999))
                if min_t <= float(line.quantity) <= max_t:
                    contract_tariff_val = float(tariff.get("freight_rate", 0))
                    break
            if contract_tariff_val == 0:
                for tariff in matching_tariffs:
                    if float(line.quantity) <= float(tariff.get("max_tonnage", 999999)):
                        contract_tariff_val = float(tariff.get("freight_rate", 0))
                        break
            if contract_tariff_val == 0:
                highest_bracket = max(matching_tariffs, key=lambda x: float(x.get("max_tonnage", 0)))
                contract_tariff_val = float(highest_bracket.get("freight_rate", 0))

        if contract_tariff_val > 0:
            freight_rate = contract_tariff_val
        elif getattr(line, 'custom_tariff', None) is not None:
            freight_rate = float(line.custom_tariff)
        else:
            freight_rate = 0
        
        if contract and contract.get("bunker_baseline_price_ifo") and float(contract.get("bunker_baseline_price_ifo")) > 0:
            p_ifo = float(contract.get("bunker_baseline_price_ifo"))
        elif getattr(line, 'forecast_bunker_price_ifo', None) is not None and float(line.forecast_bunker_price_ifo) > 0:
            p_ifo = float(line.forecast_bunker_price_ifo)
        else:
            p_ifo = 0.0

        if contract and contract.get("bunker_baseline_price_mdo") and float(contract.get("bunker_baseline_price_mdo")) > 0:
            p_mdo = float(contract.get("bunker_baseline_price_mdo"))
        elif getattr(line, 'forecast_bunker_price_mdo', None) is not None and float(line.forecast_bunker_price_mdo) > 0:
            p_mdo = float(line.forecast_bunker_price_mdo)
        else:
            p_mdo = 0.0
        
        is_spot_route = (line.origin_port_id == "SPOT")
        spot_route = None
        spot_id = None
        
        if is_spot_route:
            spot_id = line.destination_port_id
            spot_route = next((s for s in routes_master_data if s.get("route_id") == spot_id or s.get("name") == spot_id or s.get("client_route_id") == spot_id or s.get("prospect_route_id") == spot_id), {})
        else:
            lookup_key = f"{client.upper()}.{line.origin_port_id.upper()}.{line.destination_port_id.upper()}.{line.origin_port_id.upper()}.{vessel.upper()}"
            spot_route = next((s for s in routes_master_data if s.get("name", "").upper() == lookup_key), None)
            
            if not spot_route:
                for s in routes_master_data:
                    s_name = (s.get("name") or "").upper()
                    if not s_name.startswith(f"{client.upper()}."):
                        continue
                    tramos_list = s.get("legs_data", {}).get("tramos", [])
                    laden_tramos = [t for t in tramos_list if t.get("type", "").upper() == "LADEN"]
                    if laden_tramos:
                        first_o = (laden_tramos[0].get("origin_port_id") or "").upper()
                        last_d = (laden_tramos[-1].get("destination_port_id") or "").upper()
                        if last_d == line.destination_port_id.upper() or (first_o == line.origin_port_id.upper() and last_d == line.destination_port_id.upper()):
                            spot_route = s
                            break

            if spot_route:
                is_spot_route = True
                spot_id = spot_route.get("route_id") or spot_route.get("client_route_id") or spot_route.get("prospect_route_id") or spot_route.get("name")
        
        if is_spot_route and spot_route:
            legs_data = spot_route.get("legs_data", {})
            
            import copy
            tce_req = v_data.get("tce_required", 0)
            total_laden_qty = 0.0
            total_laden_revenue = 0.0
            
            if "tramos" in legs_data:
                tramos_copy = copy.deepcopy(legs_data.get("tramos", []))
                saved_vparams = legs_data.get("vesselParams", {})
                if saved_vparams and saved_vparams.get("vessel_id"):
                    vparams = copy.deepcopy(saved_vparams)
                else:
                    vparams = copy.deepcopy(v_data)

                # --- BUNKER: usar precios dinámicos de la simulación ---
                final_p_ifo = p_ifo
                final_p_mdo = p_mdo
                vparams["bunker_price_ifo"] = final_p_ifo
                vparams["bunker_price_mdo"] = final_p_mdo
                vparams["tce_required"] = tce_req

                total_laden_qty = 0.0
                total_laden_revenue = 0.0
                for tr in tramos_copy:
                    tr["bunker_price_ifo"] = final_p_ifo
                    tr["bunker_price_mdo"] = final_p_mdo
                    tipo = tr.get("type", "").upper()
                    if tipo == "LADEN":
                        if contract_tariff_val > 0:
                            tr["freight_rate"] = float(contract_tariff_val)
                        elif line.custom_tariff is not None:
                            tr["freight_rate"] = float(line.custom_tariff)
                        elif freight_rate > 0:
                            tr["freight_rate"] = float(freight_rate)
                        total_laden_qty += float(tr.get("quantity", 0))
                        total_laden_revenue += float(tr.get("quantity", 0)) * float(tr.get("freight_rate", 0))
                        orig_port = tr.get("origin_port_id")
                        dest_port = tr.get("destination_port_id")

                        if float(tr.get("agency_costs_origin", 0)) == 0.0:
                            if orig_port and tr.get("origin_action", "NONE") != "NONE":
                                tr["agency_costs_origin"] = calculate_detailed_port_costs(
                                    client, orig_port, "CARGA", vessel,
                                    port_costs_data, agency_matrix_data, request.port_cost_mode,
                                    vparams, float(tr.get("quantity", 0)), contract, ports_db
                                )["total_cost"]

                        if float(tr.get("agency_costs_destination", 0)) == 0.0:
                            if dest_port and tr.get("destination_action", "NONE") != "NONE":
                                tr["agency_costs_destination"] = calculate_detailed_port_costs(
                                    client, dest_port, "DESCARGA", vessel,
                                    port_costs_data, agency_matrix_data, request.port_cost_mode,
                                    vparams, float(tr.get("quantity", 0)), contract, ports_db
                                )["total_cost"]

                yield_flete = (total_laden_revenue / total_laden_qty) if total_laden_qty > 0 else 0.0

                payload = {
                    "vessel_params": vparams,
                    "tramos": tramos_copy
                }

                from backend.spot_engine import calculate_multicotizador_simulation
                spot_res = calculate_multicotizador_simulation(payload)
                consolidated = spot_res.get("consolidated", {})

                addr_comm_pct = float(legs_data.get("addressCommPct", 0))
                broker_comm_pct = float(legs_data.get("brokerCommPct", 0))
                total_comm_pct = addr_comm_pct + broker_comm_pct
                gross_revenue = consolidated.get("total_freight_revenue", 0)
                total_commissions = gross_revenue * (total_comm_pct / 100)
                net_revenue = gross_revenue - total_commissions
                pnl_after_comm = net_revenue - consolidated.get("total_port_costs", 0) - consolidated.get("total_bunker_costs", 0)
                total_days = consolidated.get("total_days", 0)
                tce_real = (pnl_after_comm / total_days) if total_days > 0 else 0

                unit_result = {
                    "net_income": gross_revenue,
                    "total_commissions": round(total_commissions, 2),
                    "net_revenue_after_comm": round(net_revenue, 2),
                    "total_port_costs": consolidated.get("total_port_costs", 0),
                    "total_bunker_costs": consolidated.get("total_bunker_costs", 0),
                    "voyage_result": round(pnl_after_comm, 2),
                    "pl_vs_required": round(pnl_after_comm - (total_days * tce_req), 2),
                    "tce_real": round(tce_real, 2),
                    "total_duration": total_days,
                    "sea_days": consolidated.get("total_sea_days", 0),
                    "port_days": consolidated.get("total_port_days", 0),
                    "bunker_ifo_tonnage": consolidated.get("bunker_ifo_tonnage", 0),
                    "bunker_mdo_tonnage": consolidated.get("bunker_mdo_tonnage", 0),
                    "pcm_projected": round(tce_real - tce_req, 2),
                    "audit_trail": {
                        "bunker_costs": {
                            "formula": "Multi-tramo: Suma de consumos por cada tramo (Laden/Ballast)",
                            "values": f"IFO: {consolidated.get('bunker_ifo_tonnage', 0)} t, MDO: {consolidated.get('bunker_mdo_tonnage', 0)} t"
                        },
                        "commissions": {
                            "formula": f"Gross Revenue × ({addr_comm_pct}% addr + {broker_comm_pct}% broker)",
                            "values": f"Gross: {round(gross_revenue,2)} | Comm: {round(total_commissions,2)} | Net: {round(net_revenue,2)}"
                        }
                    }
                }
                freight_rate = yield_flete
            else:
                legs = legs_data.get("legs", {})
                legs_copy = copy.deepcopy(legs)
                
                laden_leg = legs_copy.get("laden", {})
                if laden_leg:
                    laden_leg["quantity"] = line.quantity
                    laden_leg["freight_rate"] = freight_rate
                    
                    orig_port = laden_leg.get("origin_port_id")
                    dest_port = laden_leg.get("destination_port_id")
                    if orig_port:
                        laden_leg["agency_costs_origin"] = calculate_detailed_port_costs(
                            "DEFAULT", orig_port, 'CARGA', "DEFAULT", port_costs_data, agency_matrix_data, request.port_cost_mode,
                            v_data, line.quantity, contract, ports_db
                        )["total_cost"]
                    if dest_port:
                        laden_leg["agency_costs_destination"] = calculate_detailed_port_costs(
                            "DEFAULT", dest_port, 'DESCARGA', "DEFAULT", port_costs_data, agency_matrix_data, request.port_cost_mode,
                            v_data, line.quantity, contract, ports_db
                        )["total_cost"]
                    
                legs_copy["bunker_price_ifo"] = p_ifo
                legs_copy["bunker_price_mdo"] = p_mdo
                
                payload = {
                    "vessel_params": v_data,
                    "legs": legs_copy
                }
                from backend.spot_engine import calculate_spot_multileg
                spot_res = calculate_spot_multileg(payload)
                consolidated = spot_res.get("consolidated", {})
                
                tce_real = consolidated.get("tce_real", 0)
                
                unit_result = {
                    "net_income": consolidated.get("total_freight_revenue", 0),
                    "total_port_costs": consolidated.get("total_port_costs", 0),
                    "total_bunker_costs": consolidated.get("total_bunker_costs", 0),
                    "voyage_result": consolidated.get("pnl_net_utility", 0),
                    "pl_vs_required": consolidated.get("pnl_net_utility", 0) - (consolidated.get("total_days", 0) * tce_req),
                    "tce_real": tce_real,
                    "total_duration": consolidated.get("total_days", 0),
                    "sea_days": consolidated.get("total_sea_days", 0),
                    "port_days": consolidated.get("total_port_days", 0),
                    "bunker_ifo_tonnage": consolidated.get("bunker_ifo_tonnage", 0),
                    "bunker_mdo_tonnage": consolidated.get("bunker_mdo_tonnage", 0),
                    "pcm_projected": tce_real - tce_req,
                    "audit_trail": {
                        "bunker_costs": {
                            "formula": "Tons IFO = (sea_d * cons_sea) + (idle_d_norm * cons_idle) + (load_d * cons_load) + (disch_d * cons_disch)<br/>"
                                       "Tons MDO = (sea_d * cons_sea) + (idle_d_norm * cons_idle) + (load_d * cons_load) + (disch_d * cons_disch)<br/>"
                                       "Costo Tránsito = (Tons IFO * price_IFO) + (Tons MDO * price_MDO)",
                            "values": f"IFO Consolidado: {consolidated.get('bunker_ifo_tonnage', 0)} t<br/>MDO Consolidado: {consolidated.get('bunker_mdo_tonnage', 0)} t<br/>Costo: {consolidated.get('total_bunker_costs', 0)}"
                        }
                    }
                }
            
            inputs = {
                "route_distance": consolidated.get("total_distance", 0),
                "quantity": total_laden_qty if ("tramos" in legs_data and total_laden_qty > 0) else line.quantity,
                "freight_rate": freight_rate
            }
            if line.origin_port_id == "SPOT":
                route_key = f"SPOT-{spot_id}"
            else:
                route_key = f"{line.origin_port_id}-{line.destination_port_id}"
            
        else:
            orig_result = calculate_detailed_port_costs(client, line.origin_port_id, 'CARGA', vessel, port_costs_data, agency_matrix_data, request.port_cost_mode, v_data, line.quantity, contract, ports_db)
            dest_result = calculate_detailed_port_costs(client, line.destination_port_id, 'DESCARGA', vessel, port_costs_data, agency_matrix_data, request.port_cost_mode, v_data, line.quantity, contract, ports_db)
            
            ag_orig = orig_result["total_cost"]
            ag_dest = dest_result["total_cost"]
 
            inputs = {
                "quantity": line.quantity,
                "freight_rate": freight_rate,
                "route_distance": r_data.get("route_distance", 0),
                "vessel_speed": v_data.get("vessel_speed", 0),
                "weather_factor_laden": r_data.get("weather_factor_laden", r_data.get("weather_factor", 0)),
                "weather_factor_ballast": r_data.get("weather_factor_ballast", r_data.get("weather_factor", 0)),
                "port_overhead_hours_origin": float(contract.get("time_to_count_carga_hrs") if contract and contract.get("time_to_count_carga_hrs") is not None else 6.0),
                "port_overhead_hours_dest": float(contract.get("time_to_count_descarga_hrs") if contract and contract.get("time_to_count_descarga_hrs") is not None else 6.0),
                "positioning_carga_hrs": float(contract.get("maneuver_carga_hrs") if contract and contract.get("maneuver_carga_hrs") is not None else 0.0),
                "positioning_descarga_hrs": float(contract.get("maneuver_descarga_hrs") if contract and contract.get("maneuver_descarga_hrs") is not None else 0.0),
                "vessel_max_load_intake_limit": v_data.get("vessel_max_load_intake_limit", 0),
                "max_terminal_load_rate": ports_db.get(line.origin_port_id, {}).get("max_load_rate", 0),
                "vessel_pump_discharge_rate": v_data.get("vessel_pump_discharge_rate", 0),
                "port_max_discharge_limit": ports_db.get(line.destination_port_id, {}).get("max_disch_rate", 0),
                "agency_costs_origin": ag_orig,
                "agency_costs_destination": ag_dest,
                "loading_master_dest": dest_result["breakdown"].get("loading_master", 0.0),
                "bunker_price_ifo": p_ifo,
                "bunker_price_mdo": p_mdo,
                "bunker_price_date": bunker_dates_db.get("IFO", "N/A"),
                "tce_required": v_data.get("tce_required", 0),
                "bunker_consumption_sea_ifo": v_data.get("consumption_sea_ifo", 0),
                "bunker_consumption_idle_ifo": v_data.get("consumption_idle_ifo", 0),
                "bunker_consumption_load_ifo": v_data.get("consumption_load_ifo", 0),
                "grt": v_data.get("grt", 0),
                "dwt": v_data.get("dwt", 0),
                "dwcc": v_data.get("dwcc", 0),
                "length": v_data.get("length", 0),
                "beam": v_data.get("beam", 0),
                "bunker_consumption_disch_ifo": v_data.get("consumption_disch_ifo", 0),
                "bunker_consumption_sea_mdo": v_data.get("consumption_sea_mdo", 0),
                "bunker_consumption_idle_mdo": v_data.get("consumption_idle_mdo", 0),
                "bunker_consumption_load_mdo": v_data.get("consumption_load_mdo", 0),
                "bunker_consumption_disch_mdo": v_data.get("consumption_disch_mdo", 0),
                "contract_agreed_load_rate": contract.get("load_rate") if contract else None,
                "contract_agreed_discharge_rate": contract.get("discharge_rate") if contract else None,
                "address_commission": float(contract.get("address_commission", 0.0)) if contract else 0.0,
                "broker_commission": float(contract.get("broker_commission", 0.0)) if contract else 0.0,
                "is_round_trip": True
            }
            
            if contract and contract.get("bunker_baseline_price_ifo") and line.forecast_bunker_price_ifo:
                 inputs["freight_rate"] = calculate_baf_adjusted_rate(inputs, contract, line.forecast_bunker_price_ifo)
 
            unit_result = calculate_voyage_pnl(inputs)
            route_key = f"{line.origin_port_id}-{line.destination_port_id}"
        
        freq = line.monthly_frequency
        
        hire_cost_val = unit_result.get("hire_cost", unit_result.get("total_duration", 0) * float(v_data.get("tce_required", 15000.0))) * freq
        gross_rev_total_val = unit_result.get("gross_revenue_total", unit_result.get("gross_income", 0)) * freq
        refact_muell_val = unit_result.get("refacturacion_muellaje", 0.0) * freq

        monthly_result = {
            "freq": freq,
            "vessel_demurrage_rate": float(contract.get("demurrage_rates", {}).get(vessel, 0.0)) if contract and isinstance(contract.get("demurrage_rates"), dict) else 0.0,
            "gross_income": unit_result.get("gross_income", inputs["quantity"] * inputs["freight_rate"]) * freq,
            "gross_revenue_total": gross_rev_total_val,
            "refacturacion_muellaje": refact_muell_val,
            "hire_cost": hire_cost_val,
            "total_commissions": unit_result.get("total_commissions", 0.0) * freq,
            "net_income": unit_result["net_income"] * freq,
            "total_port_costs": unit_result["total_port_costs"] * freq,
            "total_bunker_costs": unit_result["total_bunker_costs"] * freq,
            "voyage_result": unit_result["voyage_result"] * freq,
            "pl_vs_required": unit_result.get("pl_vs_required", unit_result["voyage_result"] - hire_cost_val) * freq,
            "tce_real": unit_result["tce_real"],
            "total_duration": unit_result["total_duration"] * freq,
            "sea_days": unit_result.get("sea_days", 0) * freq,
            "port_days": unit_result.get("port_days", 0) * freq,
            "total_days": unit_result.get("total_duration", 0) * freq,
            # Unit details for Ledger
            "distancia_total": unit_result.get("total_distance", inputs.get("route_distance")),
            "carga_unit": inputs["quantity"],
            "flete_unit": inputs["freight_rate"],
            "gross_income_unit": unit_result.get("gross_income", inputs["quantity"] * inputs["freight_rate"]),
            "refacturacion_muellaje_unit": unit_result.get("refacturacion_muellaje", 0.0),
            "gross_revenue_total_unit": unit_result.get("gross_revenue_total", unit_result.get("gross_income", 0)),
            "address_comm_pct": inputs.get("address_commission", 0.0),
            "broker_comm_pct": inputs.get("broker_commission", 0.0),
            "total_commissions_unit": unit_result.get("total_commissions", 0.0),
            "net_income_unit": unit_result["net_income"],
            "sea_days_unit": unit_result["sea_days"],
            "port_days_unit": unit_result["port_days"],
            "total_duration_unit": unit_result["total_duration"],
            "hire_cost_unit": unit_result.get("hire_cost", unit_result["total_duration"] * float(v_data.get("tce_required", 15000.0))),
            "price_ifo_unit": float(p_ifo),
            "bunker_ifo_tonnage_unit": unit_result["bunker_ifo_tonnage"],
            "bunker_ifo_cost_unit": float(unit_result["bunker_ifo_tonnage"] * p_ifo),
            "price_mdo_unit": float(p_mdo),
            "bunker_mdo_tonnage_unit": unit_result["bunker_mdo_tonnage"],
            "bunker_mdo_cost_unit": float(unit_result["bunker_mdo_tonnage"] * p_mdo),
            "total_bunker_costs_unit": unit_result["total_bunker_costs"],
            "total_port_costs_unit": unit_result["total_port_costs"],
            "voyage_result_unit": unit_result["voyage_result"],
            "tce_real_unit": unit_result["tce_real"],
            "tce_required_unit": float(v_data.get("tce_required", 15000.0)),
            "tce_cost_total_unit": float(unit_result["total_duration"] * float(v_data.get("tce_required", 15000.0))),
            "pcm_projected": unit_result["pcm_projected"],
            "pl_vs_required_unit": unit_result["pl_vs_required"],
            "actual_load_rate": unit_result.get("actual_load_rate", 0.0),
            "actual_discharge_rate": unit_result.get("actual_discharge_rate", 0.0),
            "audit_trail": unit_result.get("audit_trail", {}),
            "raw_inputs": inputs,
            "route_name": spot_route.get("name") if is_spot_route else None,
            "port_costs_breakdown": {
                "origin": {} if is_spot_route else orig_result.get("breakdown", {}),
                "destination": {} if is_spot_route else dest_result.get("breakdown", {})
            },
            "port_costs_audit": {
                "origin": {} if is_spot_route else orig_result.get("audit_trail", {}),
                "destination": {} if is_spot_route else dest_result.get("audit_trail", {})
            }
        }
        
        if client not in agg_data:
            agg_data[client] = {}
        if route_key not in agg_data[client]:
            agg_data[client][route_key] = {}
        if vessel not in agg_data[client][route_key]:
            agg_data[client][route_key][vessel] = {}
            
        agg_data[client][route_key][vessel][month] = monthly_result
        
    return {
        "status": "success",
        "aggregated_data": agg_data
    }

