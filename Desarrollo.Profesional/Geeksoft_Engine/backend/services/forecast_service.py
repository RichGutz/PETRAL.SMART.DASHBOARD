from typing import Dict, Any
import time
from backend.models.forecast_models import ForecastRequest
from backend.database import get_supabase
from backend.engine import calculate_voyage_pnl, calculate_baf_adjusted_rate
from backend.engine_universal import calculate_voyage_pnl_universal, calculate_baf_adjusted_rate_universal

# --- MEMORY CACHE FOR MASTER DATA ---
_masters_cache = {}
_cache_time = 0.0
CACHE_TTL = 30.0  # 30 seconds TTL

def clear_forecast_cache():
    global _masters_cache, _cache_time
    _masters_cache = {}
    _cache_time = 0.0

def get_cached_masters(supabase) -> Dict[str, Any]:
    global _masters_cache, _cache_time
    now = time.time()
    if not _masters_cache or (now - _cache_time) > CACHE_TTL:
        _masters_cache = {
            "vessels": safe_fetch(supabase, "vessels"),
            "distances": safe_fetch(supabase, "distances"),
            "routes_clients": safe_fetch(supabase, "routes_clients"),
            "routes_prospects": safe_fetch(supabase, "routes_prospects"),
            "routes_master": safe_fetch(supabase, "routes_master"),
            "bunker_prices": safe_fetch(supabase, "bunker_prices"),
            "ports": safe_fetch(supabase, "ports"),
            "contracts": safe_fetch(supabase, "contracts"),
            "contract_tariffs": safe_fetch(supabase, "contract_tariffs"),
            "port_costs_matrix": safe_fetch(supabase, "port_costs_matrix"),
            "port_cost_static": safe_fetch(supabase, "port_cost_static"),
            "vessel_terminal_operations": safe_fetch(supabase, "vessel_terminal_operations")
        }
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
        res = supabase.table("bunker_prices").select("*").order("quote_date", desc=True).limit(1).execute()
        if res.data and len(res.data) > 0:
            row = res.data[0]
            return {
                "bunker_price_ifo": float(row.get("ifo_price") or row.get("price_ifo") or row.get("bunker_price_ifo") or 895.14),
                "bunker_price_mdo": float(row.get("mdo_price") or row.get("price_mdo") or row.get("bunker_price_mdo") or 1460.30),
                "quote_date": row.get("quote_date", "2026-06-26")
            }
    except Exception as e:
        print(f"Warning: Error fetching latest bunker prices: {e}")
    return {
        "bunker_price_ifo": 895.14,
        "bunker_price_mdo": 1460.30,
        "quote_date": "2026-06-26"
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
                
            if row:
                costs.append(row)
                
        return costs

    # 2. Fallback: Buscar costo plano consolidado en agency_matrix (port_cost_static)
    #    Suma TODOS los sub_operation_types (MAIN, loading_master, etc.)
    def get_flat_cost_from_agency_matrix():
        def find_rows(v_id=None):
            if v_id is not None:
                return [
                    a for a in agency_matrix_data
                    if a.get("port_id") == port_id
                    and a.get("operation_type") == operation_type
                    and a.get("vessel_id") == v_id
                ]
            else:
                # Sin filtro de vessel_id: cualquier registro para este puerto+operación
                return [
                    a for a in agency_matrix_data
                    if a.get("port_id") == port_id
                    and a.get("operation_type") == operation_type
                ]

        # Prioridad A: vessel_id especifico
        rows = find_rows(vessel_id)
        # Prioridad B: DEFAULT
        if not rows:
            rows = find_rows("DEFAULT")
        # Prioridad C (fallback final): cualquier barco con datos para este puerto+operación
        # Útil cuando la tabla tiene datos para MOQUEGUA pero se calcula para TABLONES
        if not rows:
            all_rows = find_rows(None)
            if all_rows:
                # Tomar el primer vessel_id disponible con datos
                first_vessel = all_rows[0].get("vessel_id")
                rows = [r for r in all_rows if r.get("vessel_id") == first_vessel]

        if not rows:
            return None

        # Sumar TODOS los sub_operation_types encontrados
        breakdown = {}
        for row in rows:
            sub_type = row.get("sub_operation_type") or "MAIN"
            cost_val = float(row.get("cost", 0.0))
            if sub_type in breakdown:
                breakdown[sub_type] += cost_val
            else:
                breakdown[sub_type] = cost_val

        total = sum(breakdown.values())
        return total, breakdown


    # 0. Si el modo es static, ir directo al costo plano consolidado
    if port_cost_mode == "static":
        flat_res = get_flat_cost_from_agency_matrix()
        if flat_res is not None:
            total_val, breakdown = flat_res
            return {
                "total_cost": round(total_val, 2),
                "breakdown": breakdown
            }
        return {
            "total_cost": 0.0,
            "breakdown": {"agency_fee": 0.0}
        }

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
    vessels_db = {v["vessel_id"]: v for v in vessels_data}
    
    routes_data = masters.get("distances") or []
    routes_db = {}
    for r in routes_data:
        routes_db[f"{r['port_a']}-{r['port_b']}"] = r
    
    routes_clients_data = masters.get("routes_clients") or []
    routes_prospects_data = masters.get("routes_prospects") or []
    routes_master_data = routes_clients_data + routes_prospects_data or masters.get("routes_master") or []
    
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
        v_data = vessels_db.get(vessel, {})
        
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
        freight_rate = 0
        
        if getattr(line, 'custom_tariff', None) is not None:
            freight_rate = line.custom_tariff
        else:
            matching_tariffs = []

            # PRIORIDAD 1: Buscar por contract_id + ruta (estructura nueva con FK compuesta)
            if contract:
                contract_id_val = contract.get("contract_id")
                if contract_id_val:
                    matching_tariffs = [
                        t for t in tariffs_data
                        if str(t.get("contract_id", "")) == str(contract_id_val)
                        and t.get("origin_port_id") == line.origin_port_id
                        and t.get("destination_port_id") == line.destination_port_id
                    ]

            # PRIORIDAD 2: Fallback legacy — client_id + destination_port_id (antes de la migración)
            # También actúa como safety net si contract_id no está en tariffs aún
            if not matching_tariffs:
                matching_tariffs = [
                    t for t in tariffs_data
                    if t.get("client_id") == client
                    and t.get("destination_port_id") == line.destination_port_id
                ]

            if matching_tariffs:
                # Ordenar brackets por tonelaje mínimo para iterar en orden ascendente
                matching_tariffs = sorted(matching_tariffs, key=lambda x: x.get("min_tonnage", 0))

                # Buscar bracket exacto: min_tonnage <= quantity <= max_tonnage
                for tariff in matching_tariffs:
                    if tariff.get("min_tonnage", 0) <= line.quantity <= tariff.get("max_tonnage", 999999):
                        freight_rate = tariff.get("freight_rate", 0)
                        break

                # Si cae en un gap entre brackets (ej: 13,550 entre 13,500 y 13,600)
                # tomar el primer bracket cuyo max_tonnage supere la cantidad
                if freight_rate == 0:
                    for tariff in matching_tariffs:
                        if line.quantity <= tariff.get("max_tonnage", 999999):
                            freight_rate = tariff.get("freight_rate", 0)
                            break

                # Último recurso: bracket con mayor tonelaje máximo (excede el rango superior)
                if freight_rate == 0:
                    highest_bracket = max(matching_tariffs, key=lambda x: x.get("max_tonnage", 0))
                    freight_rate = highest_bracket.get("freight_rate", 0)
        
        p_ifo = line.forecast_bunker_price_ifo if line.forecast_bunker_price_ifo else bunker_db.get("IFO", 450)
        p_mdo = line.forecast_bunker_price_mdo if line.forecast_bunker_price_mdo else bunker_db.get("MDO", 800)
        
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
                        if first_o == line.origin_port_id.upper() and last_d == line.destination_port_id.upper():
                            spot_route = s
                            break

            if spot_route:
                is_spot_route = True
                spot_id = spot_route.get("route_id") or spot_route.get("client_route_id") or spot_route.get("prospect_route_id") or spot_route.get("name")
        
        if is_spot_route and spot_route:
            legs_data = spot_route.get("legs_data", {})
            
            import copy
            tce_req = v_data.get("tce_required", 0)
            total_laden_qty = 0.0      # Se calcula en bloque multicotizador; 0 en SpotRouter tradicional
            total_laden_revenue = 0.0  # Ídem
            
            if "tramos" in legs_data:
                # -- ESCENARIO MULTICOTIZADOR / ESTIMADOR EXCEL (Fase 2) --
                # Los tramos ya vienen enriquecidos desde handleSaveRoute (Fase 1).
                # Política: respetar los datos grabados y solo recalcular lo que falte.
                tramos_copy = copy.deepcopy(legs_data.get("tramos", []))

                # --- VESSEL PARAMS: usar los del legs_data si existen (buque personalizado) ---
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

                # --- TRAMOS: enriquecer solo lo necesario ---
                total_laden_qty = 0.0
                total_laden_revenue = 0.0
                for tr in tramos_copy:
                    tipo = tr.get("type", "").upper()
                    if tipo == "LADEN":
                        # Respetar freight_rate grabado por tramo (cotización multi-descarga)
                        # Solo sobreescribir si el usuario pasó custom_tariff en la línea del forecast
                        if line.custom_tariff is not None:
                            tr["freight_rate"] = float(line.custom_tariff)
                        # Acumular para yield ponderado
                        total_laden_qty += float(tr.get("quantity", 0))
                        total_laden_revenue += float(tr.get("quantity", 0)) * float(tr.get("freight_rate", 0))

                        orig_port = tr.get("origin_port_id")
                        dest_port = tr.get("destination_port_id")

                        # Costo de puerto origen: respetar override grabado; recalcular solo si es 0
                        if float(tr.get("agency_costs_origin", 0)) == 0.0:
                            if orig_port and tr.get("origin_action", "NONE") != "NONE":
                                tr["agency_costs_origin"] = calculate_detailed_port_costs(
                                    client, orig_port, "CARGA", vessel,
                                    port_costs_data, agency_matrix_data, request.port_cost_mode,
                                    vparams, float(tr.get("quantity", 0)), contract, ports_db
                                )["total_cost"]

                        # Costo de puerto destino: respetar override grabado; recalcular solo si es 0
                        if float(tr.get("agency_costs_destination", 0)) == 0.0:
                            if dest_port and tr.get("destination_action", "NONE") != "NONE":
                                tr["agency_costs_destination"] = calculate_detailed_port_costs(
                                    client, dest_port, "DESCARGA", vessel,
                                    port_costs_data, agency_matrix_data, request.port_cost_mode,
                                    vparams, float(tr.get("quantity", 0)), contract, ports_db
                                )["total_cost"]

                # --- YIELD PONDERADO: tarifa representativa para la Matriz ---
                yield_flete = (total_laden_revenue / total_laden_qty) if total_laden_qty > 0 else 0.0

                payload = {
                    "vessel_params": vparams,
                    "tramos": tramos_copy
                }

                from backend.spot_engine import calculate_multicotizador_simulation
                spot_res = calculate_multicotizador_simulation(payload)
                consolidated = spot_res.get("consolidated", {})

                # --- COMISIONES: aplicar addressCommPct y brokerCommPct del legs_data ---
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
            "net_income_unit": unit_result["net_income"],
            "sea_days_unit": unit_result["sea_days"],
            "port_days_unit": unit_result["port_days"],
            "total_duration_unit": unit_result["total_duration"],
            "bunker_ifo_tonnage_unit": unit_result["bunker_ifo_tonnage"],
            "bunker_mdo_tonnage_unit": unit_result["bunker_mdo_tonnage"],
            "total_bunker_costs_unit": unit_result["total_bunker_costs"],
            "total_port_costs_unit": unit_result["total_port_costs"],
            "tce_real_unit": unit_result["tce_real"],
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
    
    # Pre-cargar maestros usando el cache global
    masters = get_cached_masters(supabase)
    
    vessels_data = masters["vessels"]
    vessels_db = {v["vessel_id"]: v for v in vessels_data}
    
    routes_data = masters.get("distances") or []
    routes_db = {}
    for r in routes_data:
        routes_db[f"{r['port_a']}-{r['port_b']}"] = r
    
    routes_clients_data = masters.get("routes_clients") or []
    routes_prospects_data = masters.get("routes_prospects") or []
    routes_master_data = routes_clients_data + routes_prospects_data or masters.get("routes_master") or []
    
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
        
        freight_rate = 0
        if getattr(line, 'custom_tariff', None) is not None:
            freight_rate = line.custom_tariff
        else:
            matching_tariffs = []
            if contract:
                contract_id_val = contract.get("contract_id")
                if contract_id_val:
                    matching_tariffs = [
                        t for t in tariffs_data
                        if str(t.get("contract_id", "")) == str(contract_id_val)
                        and t.get("origin_port_id") == line.origin_port_id
                        and t.get("destination_port_id") == line.destination_port_id
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
                        freight_rate = tariff.get("freight_rate", 0)
                        break

                if freight_rate == 0:
                    for tariff in matching_tariffs:
                        if line.quantity <= tariff.get("max_tonnage", 999999):
                            freight_rate = tariff.get("freight_rate", 0)
                            break

                if freight_rate == 0:
                    highest_bracket = max(matching_tariffs, key=lambda x: x.get("max_tonnage", 0))
                    freight_rate = highest_bracket.get("freight_rate", 0)
        
        p_ifo = line.forecast_bunker_price_ifo if line.forecast_bunker_price_ifo else bunker_db.get("IFO", 450)
        p_mdo = line.forecast_bunker_price_mdo if line.forecast_bunker_price_mdo else bunker_db.get("MDO", 800)
        
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
                        if first_o == line.origin_port_id.upper() and last_d == line.destination_port_id.upper():
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
                    tipo = tr.get("type", "").upper()
                    if tipo == "LADEN":
                        if line.custom_tariff is not None:
                            tr["freight_rate"] = float(line.custom_tariff)
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
                 inputs["freight_rate"] = calculate_baf_adjusted_rate_universal(inputs, contract, line.forecast_bunker_price_ifo)
 
            unit_result = calculate_voyage_pnl_universal(inputs)
            route_key = f"{line.origin_port_id}-{line.destination_port_id}"
        
        freq = line.monthly_frequency
        monthly_result = {
            "freq": freq,
            "vessel_demurrage_rate": float(contract.get("demurrage_rates", {}).get(vessel, 0.0)) if contract and isinstance(contract.get("demurrage_rates"), dict) else 0.0,
            "net_income": unit_result["net_income"] * freq,
            "total_port_costs": unit_result["total_port_costs"] * freq,
            "total_bunker_costs": unit_result["total_bunker_costs"] * freq,
            "voyage_result": unit_result["voyage_result"] * freq,
            "pl_vs_required": unit_result["pl_vs_required"] * freq,
            "tce_real": unit_result["tce_real"],
            "total_duration": unit_result["total_duration"] * freq,
            "distancia_total": unit_result.get("total_distance", inputs.get("route_distance")),
            "carga_unit": inputs["quantity"],
            "flete_unit": inputs["freight_rate"],
            "net_income_unit": unit_result["net_income"],
            "sea_days_unit": unit_result["sea_days"],
            "port_days_unit": unit_result["port_days"],
            "total_duration_unit": unit_result["total_duration"],
            "bunker_ifo_tonnage_unit": unit_result["bunker_ifo_tonnage"],
            "bunker_mdo_tonnage_unit": unit_result["bunker_mdo_tonnage"],
            "total_bunker_costs_unit": unit_result["total_bunker_costs"],
            "total_port_costs_unit": unit_result["total_port_costs"],
            "tce_real_unit": unit_result["tce_real"],
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

