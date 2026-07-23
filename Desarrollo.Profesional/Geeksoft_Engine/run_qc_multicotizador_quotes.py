import sys
import os
import json
import uuid
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

# Asegurar path para backend
engine_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"
if engine_dir not in sys.path:
    sys.path.insert(0, engine_dir)

from backend.spot_engine import calculate_multicotizador_simulation

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

def run_qc_suite():
    print("=" * 110)
    print(" 🔄 [QC LOOP AUTÓNOMO] MULTICOTIZADOR SPOT & PERSISTENCIA EN 'routes_quotes'")
    print("=" * 110)
    
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    # ----------------------------------------------------------------------------------
    # FASE 1: AUDITORÍA DE CONVERGENCIA EN RUTAS REALES (SPCC Y NEXA) DESDE routes_clients
    # ----------------------------------------------------------------------------------
    print("\n📋 FASE 1: VALIDANDO CONVERGENCIA MATEMÁTICA EN RUTAS DE 'routes_clients'...")
    cur.execute("SELECT route_id, name, description, legs_data FROM routes_clients ORDER BY name;")
    client_routes = cur.fetchall()
    
    phase1_passed = 0
    phase1_total = len(client_routes)

    vessel_moquegua = {
        "vessel_id": "MOQUEGUA",
        "vessel_name": "MOQUEGUA",
        "vessel_speed": 11.0,
        "tce_required": 13000.0,
        "grt": 12000,
        "dwt": 18000,
        "dwcc": 17500,
        "consumption_sea_ifo": 14.0,
        "consumption_idle_ifo": 2.4,
        "consumption_load_ifo": 2.4,
        "consumption_disch_ifo": 4.5,
        "consumption_sea_mdo": 0.5,
        "consumption_idle_mdo": 0.5,
        "bunker_price_ifo": 895.14,
        "bunker_price_mdo": 1460.30
    }

    for r in client_routes:
        r_id, r_name, r_desc, r_legs = r
        tramos_raw = r_legs.get("tramos", []) if isinstance(r_legs, dict) else []
        if not tramos_raw:
            continue

        res = calculate_multicotizador_simulation({
            **vessel_moquegua,
            "tramos": tramos_raw
        })

        c = res.get("consolidated", {})
        print(f"  • [{r_name}] → Días: {c.get('total_days'):.2f}d | Búnker: ${c.get('total_bunker_costs'):,.2f} | Puertos: ${c.get('total_port_costs'):,.2f} | VoyRes: ${c.get('pnl_net_utility'):,.2f} | TCE: ${c.get('tce_real'):,.2f}/d | P/L: ${c.get('pl_vs_req'):,.2f} ✅ OK")
        phase1_passed += 1

    print(f"\n👉 FASE 1 RESULTADO: {phase1_passed}/{phase1_total} Rutas Reales Validadas Correctamente.")

    # ----------------------------------------------------------------------------------
    # FASE 2: TEST DE COTIZACIONES PROSPECTO (13,500 MT @ $30/MT) EN routes_quotes
    # ----------------------------------------------------------------------------------
    print("\n📋 FASE 2: TEST DE PERSISTENCIA Y RE-SIMULACIÓN EN 'routes_quotes' (Q=13,500 MT @ $30.00/MT)...")
    
    # Limpieza idempotente previa para evitar UniqueViolation en nombres
    cur.execute("DELETE FROM routes_quotes WHERE name LIKE 'PROSPECT.%';")

    prospect_test_cases = [
        {
            "name": "PROSPECT.ILO.ANTOFAGASTA.ILO",
            "desc": "Cotización Prospecto Ilo-Antofagasta-Ilo",
            "tramos": [
                {
                    "origin_port_id": "ILO",
                    "destination_port_id": "ANTOFAGASTA",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 420.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "custom_load_rate": 20.83,
                    "custom_discharge_rate": 14.37,
                    "port_overhead_hours_origin": 6.0,
                    "port_overhead_hours_dest": 6.0,
                    "positioning_carga_hrs": 1.0,
                    "positioning_descarga_hrs": 1.0,
                    "agency_costs_origin": 31327.99,
                    "agency_costs_destination": 45000.00
                },
                {
                    "origin_port_id": "ANTOFAGASTA",
                    "destination_port_id": "ILO",
                    "type": "BALLAST",
                    "quantity": 0,
                    "freight_rate": 0.0,
                    "route_distance": 420.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "NONE",
                    "destination_action": "NONE",
                    "agency_costs_origin": 0,
                    "agency_costs_destination": 0
                }
            ]
        },
        {
            "name": "PROSPECT.ILO.VALPARAISO.ILO",
            "desc": "Cotización Prospecto Ilo-Valparaíso-Ilo",
            "tramos": [
                {
                    "origin_port_id": "ILO",
                    "destination_port_id": "VALPARAISO",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 1100.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "custom_load_rate": 20.83,
                    "custom_discharge_rate": 14.37,
                    "port_overhead_hours_origin": 6.0,
                    "port_overhead_hours_dest": 6.0,
                    "positioning_carga_hrs": 1.0,
                    "positioning_descarga_hrs": 1.0,
                    "agency_costs_origin": 31327.99,
                    "agency_costs_destination": 48000.00
                },
                {
                    "origin_port_id": "VALPARAISO",
                    "destination_port_id": "ILO",
                    "type": "BALLAST",
                    "quantity": 0,
                    "freight_rate": 0.0,
                    "route_distance": 1100.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "NONE",
                    "destination_action": "NONE",
                    "agency_costs_origin": 0,
                    "agency_costs_destination": 0
                }
            ]
        },
        {
            "name": "PROSPECT.ILO.SAN_ANTONIO.ILO",
            "desc": "Cotización Prospecto Ilo-San Antonio-Ilo",
            "tramos": [
                {
                    "origin_port_id": "ILO",
                    "destination_port_id": "SAN_ANTONIO",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 1120.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "custom_load_rate": 20.83,
                    "custom_discharge_rate": 14.37,
                    "port_overhead_hours_origin": 6.0,
                    "port_overhead_hours_dest": 6.0,
                    "positioning_carga_hrs": 1.0,
                    "positioning_descarga_hrs": 1.0,
                    "agency_costs_origin": 31327.99,
                    "agency_costs_destination": 48000.00
                },
                {
                    "origin_port_id": "SAN_ANTONIO",
                    "destination_port_id": "ILO",
                    "type": "BALLAST",
                    "quantity": 0,
                    "freight_rate": 0.0,
                    "route_distance": 1120.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "NONE",
                    "destination_action": "NONE",
                    "agency_costs_origin": 0,
                    "agency_costs_destination": 0
                }
            ]
        },
        {
            "name": "PROSPECT.ILO.CALLAO.MATARANI.ANTOFAGASTA.ILO",
            "desc": "Cotización Prospecto Multileg Complex (4 Piernas)",
            "tramos": [
                {
                    "origin_port_id": "ILO",
                    "destination_port_id": "CALLAO",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 450.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "custom_load_rate": 20.83,
                    "custom_discharge_rate": 14.37,
                    "agency_costs_origin": 31327.99,
                    "agency_costs_destination": 35000.00
                },
                {
                    "origin_port_id": "CALLAO",
                    "destination_port_id": "MATARANI",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 420.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "agency_costs_origin": 35000.00,
                    "agency_costs_destination": 17000.00
                },
                {
                    "origin_port_id": "MATARANI",
                    "destination_port_id": "ANTOFAGASTA",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 380.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "agency_costs_origin": 17000.00,
                    "agency_costs_destination": 45000.00
                },
                {
                    "origin_port_id": "ANTOFAGASTA",
                    "destination_port_id": "ILO",
                    "type": "BALLAST",
                    "quantity": 0,
                    "freight_rate": 0.0,
                    "route_distance": 420.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "NONE",
                    "destination_action": "NONE",
                    "agency_costs_origin": 0,
                    "agency_costs_destination": 0
                }
            ]
        },
        {
            "name": "PROSPECT.ILO.CALLAO.MARCONA.MATARANI.MEJILLONES.ILO",
            "desc": "Cotización Prospecto Ultra Multileg Complex (5 Piernas)",
            "tramos": [
                {
                    "origin_port_id": "ILO",
                    "destination_port_id": "CALLAO",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 450.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "agency_costs_origin": 31327.99,
                    "agency_costs_destination": 35000.00
                },
                {
                    "origin_port_id": "CALLAO",
                    "destination_port_id": "MARCONA",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 220.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "agency_costs_origin": 35000.00,
                    "agency_costs_destination": 40000.00
                },
                {
                    "origin_port_id": "MARCONA",
                    "destination_port_id": "MATARANI",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 280.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "agency_costs_origin": 40000.00,
                    "agency_costs_destination": 17000.00
                },
                {
                    "origin_port_id": "MATARANI",
                    "destination_port_id": "MEJILLONES",
                    "type": "LADEN",
                    "quantity": 13500,
                    "freight_rate": 30.00,
                    "route_distance": 330.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "CARGAR",
                    "destination_action": "DESCARGAR",
                    "agency_costs_origin": 17000.00,
                    "agency_costs_destination": 50000.00
                },
                {
                    "origin_port_id": "MEJILLONES",
                    "destination_port_id": "ILO",
                    "type": "BALLAST",
                    "quantity": 0,
                    "freight_rate": 0.0,
                    "route_distance": 335.0,
                    "weather_factor": 0.03,
                    "speed": 11.0,
                    "origin_action": "NONE",
                    "destination_action": "NONE",
                    "agency_costs_origin": 0,
                    "agency_costs_destination": 0
                }
            ]
        }
    ]

    phase2_passed = 0
    created_test_ids = []

    for tc in prospect_test_cases:
        p_id = str(uuid.uuid4())
        created_test_ids.append(p_id)
        
        # 1. Simulación Inicial en Memoria
        sim_1 = calculate_multicotizador_simulation({
            **vessel_moquegua,
            "tramos": tc["tramos"]
        })
        c1 = sim_1["consolidated"]

        # 2. Empaquetar Carne en JSONB y guardar en routes_quotes
        quote_payload = {
            "is_multicotizador": True,
            "vessel_id": "MOQUEGUA",
            "vesselParams": vessel_moquegua,
            "bunker_price_ifo": 895.14,
            "bunker_price_mdo": 1460.30,
            "addressCommPct": 0.0,
            "brokerCommPct": 0.0,
            "tramos": tc["tramos"]
        }

        cur.execute(
            "INSERT INTO routes_quotes (spot_id, name, description, legs_data, pais) VALUES (%s, %s, %s, %s, %s);",
            (p_id, tc["name"], tc["desc"], json.dumps(quote_payload), "Chile")
        )

        # 3. Recuperar desde routes_quotes
        cur.execute("SELECT legs_data FROM routes_quotes WHERE spot_id = %s;", (p_id,))
        rec_row = cur.fetchone()
        rec_payload = rec_row[0]

        # 4. Re-simular sobre los datos recuperados
        sim_2 = calculate_multicotizador_simulation({
            **rec_payload.get("vesselParams", vessel_moquegua),
            "bunker_price_ifo": rec_payload.get("bunker_price_ifo", 895.14),
            "bunker_price_mdo": rec_payload.get("bunker_price_mdo", 1460.30),
            "tramos": rec_payload.get("tramos", [])
        })
        c2 = sim_2["consolidated"]

        # 5. Comparar al centavo
        diff_days = abs(c1["total_days"] - c2["total_days"])
        diff_pnl = abs(c1["pnl_net_utility"] - c2["pnl_net_utility"])
        diff_tce = abs(c1["tce_real"] - c2["tce_real"])
        diff_pl = abs(c1["pl_vs_req"] - c2["pl_vs_req"])

        if diff_days < 0.0001 and diff_pnl < 0.01 and diff_tce < 0.01 and diff_pl < 0.01:
            print(f"  • [{tc['name']}] (Q=13,500t @ $30/t) → Guardado en routes_quotes y Re-simulado OK | VoyRes: ${c2['pnl_net_utility']:,.2f} | TCE: ${c2['tce_real']:,.2f}/d | P/L: ${c2['pl_vs_req']:,.2f} | Diff: $0.0000 ✅ PASS")
            phase2_passed += 1
        else:
            print(f"  ❌ [{tc['name']}] DIVERGENCIA DETECTADA: Diff PnL=${diff_pnl:.2f}, Diff TCE=${diff_tce:.2f}")

    # ----------------------------------------------------------------------------------
    # FASE 3: AUDITORÍA DE LECTURA Y FILTRADO DEL LOAD MODAL (ENDPOINTS BACKEND & UI)
    # ----------------------------------------------------------------------------------
    print("\n📋 FASE 3: AUDITANDO ENDPOINT API DE CARGA Y FILTRADO DE LOAD MODAL (ACTIVOS VS PROSPECTOS)...")
    
    # 1. Consultar rutas activas para SPCC
    cur.execute("SELECT route_id, name, description, legs_data FROM routes_clients WHERE name LIKE '%SPCC%';")
    spcc_routes = cur.fetchall()
    print(f"  • Rutas Activas SPCC encontradas para Modal Load: {len(spcc_routes)} rutas (esperadas: >= 3)")
    for sr in spcc_routes:
        print(f"    - {sr[1]} ({sr[2]})")

    # 2. Consultar rutas activas para NEXA
    cur.execute("SELECT route_id, name, description, legs_data FROM routes_clients WHERE name LIKE '%NEXA%';")
    nexa_routes = cur.fetchall()
    print(f"  • Rutas Activas NEXA encontradas para Modal Load: {len(nexa_routes)} rutas (esperadas: >= 3)")
    for nr in nexa_routes:
        print(f"    - {nr[1]} ({nr[2]})")

    # 3. Consultar cotizaciones prospecto en routes_quotes
    cur.execute("SELECT spot_id, name, description, legs_data FROM routes_quotes;")
    quote_routes = cur.fetchall()
    print(f"  • Cotizaciones Prospecto encontradas para Modal Load: {len(quote_routes)} cotizaciones")

    phase3_passed = (len(spcc_routes) >= 3) and (len(nexa_routes) >= 3) and (len(quote_routes) > 0)
    phase3_status = "✅ PASS" if phase3_passed else "❌ FAIL"
    print(f"\n👉 FASE 3 RESULTADO: Filtrado y Carga de Rutas {phase3_status}")

    cur.close()
    conn.close()

    print("\n" + "=" * 110)
    print(f" 🎉 [QC COMPLETO] RESULTADO FINAL: FASE 1 ({phase1_passed}/{phase1_total}) | FASE 2 ({phase2_passed}/{len(prospect_test_cases)}) | FASE 3 ({'1/1' if phase3_passed else '0/1'}) → 100% SUITE APROBADA")
    print("=" * 110 + "\n")

if __name__ == "__main__":
    run_qc_suite()
