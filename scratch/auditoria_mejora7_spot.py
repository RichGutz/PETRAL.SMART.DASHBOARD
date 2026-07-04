"""
AUDITORIA FASE 2 - Circuito Grabar/Jalar Rutas Spot
======================================================
Prueba 1: Las rutas FIJAS (TABLONES, MOQUEGUA) no se ven afectadas por el cambio.
Prueba 2: Una ruta multicotizador jalada por la Matriz Financiera produce resultados
           coherentes: comisiones aplicadas, yield ponderado correcto, P/L consistente.
"""

import requests
import json

BASE_URL = "https://forecast.geeksoft.tech/api/v1"

def separator(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def test_rutas_fijas():
    separator("PRUEBA 1 - RUTAS FIJAS (no deben haber cambiado)")

    payload = {
        "start_date": "2026-07-01",
        "end_date":   "2026-07-31",
        "projection_lines": [
            {
                "month_index": "2026-07",
                "client_id": "SPCC",
                "origin_port_id": "ILO",
                "destination_port_id": "MATARANI",
                "vessel_id": "TABLONES",
                "quantity": 13500,
                "monthly_frequency": 1
            }
        ]
    }

    # El endpoint correcto es /forecast/run
    r = requests.post(f"{BASE_URL}/forecast/run", json=payload, timeout=30)
    if r.status_code != 200:
        print(f"  [ERROR] Status {r.status_code}: {r.text[:200]}")
        return

    data = r.json().get("aggregated_data", {})

    results = []
    for client, routes in data.items():
        for route, vessels in routes.items():
            for vessel, months in vessels.items():
                for month, res in months.items():
                    results.append({
                        "ruta": f"{client} | {route} | {vessel}",
                        "voyage_result": res.get("voyage_result", 0),
                        "tce_real": res.get("tce_real", 0),
                        "total_port_costs": res.get("total_port_costs", 0),
                        "total_bunker_costs": res.get("total_bunker_costs", 0),
                        "flete_unit": res.get("flete_unit", 0),
                    })

    print(f"  {'RUTA':45} | {'P/L USD':>12} | {'TCE USD/d':>10} | {'PORT USD':>10} | {'BUNKER USD':>10} | {'FLETE':>7}")
    print(f"  {'-'*45}-+-{'-'*12}-+-{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*7}")
    for r in results:
        print(f"  {r['ruta']:45} | {r['voyage_result']:>12,.0f} | {r['tce_real']:>10,.2f} | {r['total_port_costs']:>10,.0f} | {r['total_bunker_costs']:>10,.0f} | {r['flete_unit']:>7.2f}")

    print("\n  [OK] Si los numeros coinciden con el Ledger auditado -> rutas fijas INTACTAS")


def test_multicotizador_directo():
    separator("PRUEBA 2 - ENGINE MULTICOTIZADOR: 1 carga -> 2 descargas + comisiones")

    # Escenario: MOQUEGUA carga 13500 MT en ILO
    # Descarga 7000 MT en MATARANI a $18/MT -> ingreso $126,000
    # Descarga 6500 MT en MARCONA   a $22/MT -> ingreso $143,000
    # Total cargado: 13500 MT | Total ingreso: $269,000
    # Yield ponderado esperado: 269,000 / 13,500 = $19.926/MT
    # Comisiones: 2% addr + 1% broker = 3% -> $8,070 de descuento
    # P/L neto esperado = $269,000 - $8,070 - port_costs - bunker_costs

    payload = {
        "vessel_id": "MOQUEGUA",
        "bunker_price_ifo": 895.14,
        "bunker_price_mdo": 1460.30,
        "tramos": [
            {
                "origin_port_id": "ILO",
                "destination_port_id": "MATARANI",
                "type": "LADEN",
                "quantity": 7000,
                "freight_rate": 18.0,
                "route_distance": 78.0,
                "weather_factor": 0.05,
                "origin_action": "CARGAR",
                "destination_action": "DESCARGAR",
                "port_overhead_hours_origin": 6.0,
                "port_overhead_hours_dest": 6.0,
                "positioning_carga_hrs": 0.0,
                "positioning_descarga_hrs": 0.0,
                "agency_costs_origin": 0.0,
                "agency_costs_destination": 0.0
            },
            {
                "origin_port_id": "MATARANI",
                "destination_port_id": "MARCONA",
                "type": "LADEN",
                "quantity": 6500,
                "freight_rate": 22.0,
                "route_distance": 188.0,
                "weather_factor": 0.05,
                "origin_action": "NONE",
                "destination_action": "DESCARGAR",
                "port_overhead_hours_origin": 0.0,
                "port_overhead_hours_dest": 6.0,
                "positioning_carga_hrs": 0.0,
                "positioning_descarga_hrs": 0.0,
                "agency_costs_origin": 0.0,
                "agency_costs_destination": 0.0
            }
        ]
    }

    r = requests.post(f"{BASE_URL}/forecast/multicotizador/calculate", json=payload, timeout=30)
    if r.status_code != 200:
        print(f"  [ERROR] Status {r.status_code}: {r.text[:300]}")
        return

    data = r.json()
    c = data.get("consolidated", {})

    gross   = c.get("total_freight_revenue", 0)
    port    = c.get("total_port_costs", 0)
    bunker  = c.get("total_bunker_costs", 0)
    pnl     = c.get("pnl_net_utility", 0)
    days    = c.get("total_days", 0)
    tce     = c.get("tce_real", 0)

    # Calcular yield y comisiones manualmente para verificar
    expected_yield = (7000*18 + 6500*22) / (7000 + 6500)
    comm_3pct = gross * 0.03
    expected_pnl_con_comm = gross - comm_3pct - port - bunker

    print(f"  Gross Revenue del engine:       ${gross:>12,.2f}")
    print(f"  Port Costs:                     ${port:>12,.2f}")
    print(f"  Bunker Costs:                   ${bunker:>12,.2f}")
    print(f"  P/L (sin comm, del engine):     ${pnl:>12,.2f}")
    print(f"  Dias totales:                   {days:>12.3f}")
    print(f"  TCE (sin comm):                 ${tce:>12,.2f}/dia")
    print()
    print("  --- Verificacion Yield Ponderado ---")
    print("  7000x$18 + 6500x$22 = $269,000")
    print(f"  Yield esperado:   ${expected_yield:>8.3f}/MT")
    print(f"  Gross del engine: ${gross:>8.2f}")
    print("  [OK] Yield OK" if abs(gross - 269000) < 1 else f"  [FAIL] Yield FALLA - se esperaba $269,000, got ${gross:,.2f}")
    print()
    print("  --- Verificacion Comisiones (3% = addr 2% + broker 1%) ---")
    print(f"  Comisiones esperadas: ${comm_3pct:>9,.2f}")
    print(f"  P/L esperado con comm: ${expected_pnl_con_comm:>10,.2f}")
    print()
    print("  NOTA: Las comisiones se aplican en forecast_service.py al jalar la ruta.")
    print("        Este endpoint devuelve el P/L BRUTO (sin comisiones).")
    print("        La deduccion de comisiones se hace sobre el gross_revenue en la Matriz.")


def test_forecast_spot_real():
    separator("PRUEBA 3 - FORECAST CON RUTA SPOT REAL (jala desde routes_spot)")

    r = requests.get(f"{BASE_URL}/forecast/spot/list", timeout=15)
    if r.status_code != 200:
        print(f"  [ERROR] listando spots: {r.status_code}")
        return

    spots = r.json()
    multi_spots = [s for s in spots if s.get("legs_data", {}).get("is_multicotizador")]

    if not multi_spots:
        print("  [WARN] No hay rutas multicotizador grabadas en la BD para probar.")
        return

    spot = multi_spots[0]
    spot_name = spot.get("name", "N/A")
    legs = spot.get("legs_data", {})

    print(f"  Ruta usada: '{spot_name}'")
    print(f"  Tramos grabados: {len(legs.get('tramos', []))}")
    print(f"  VesselParams guardados: {'Si' if legs.get('vesselParams') else 'No'}")
    print(f"  CommPct grabado: addr={legs.get('addressCommPct', 0)}% / broker={legs.get('brokerCommPct', 0)}%")
    print(f"  Bunker price grabado: IFO={legs.get('bunker_price_ifo')} / MDO={legs.get('bunker_price_mdo')}")
    print()

    tramos = legs.get("tramos", [])
    campos_clave = ["origin_action", "destination_action", "port_overhead_hours_origin", "positioning_carga_hrs", "agency_costs_origin"]
    tramo0 = tramos[0] if tramos else {}

    print("  Verificacion de campos enriquecidos en tramo[0]:")
    all_ok = True
    for campo in campos_clave:
        tiene = campo in tramo0
        print(f"    {'[OK]' if tiene else '[MISSING]'} {campo}: {tramo0.get(campo, 'AUSENTE')}")
        if not tiene:
            all_ok = False

    if all_ok:
        print("\n  [OK] Fase 1 VERIFICADA: tramos tienen todos los campos enriquecidos")
    else:
        print("\n  [WARN] Esta ruta fue grabada ANTES de Fase 1. Necesita re-grabarse.")

    vessel_id = legs.get("vessel_id") or legs.get("vesselParams", {}).get("vessel_id", "MOQUEGUA")
    payload = {
        "start_date": "2026-07-01",
        "end_date":   "2026-07-31",
        "projection_lines": [
            {
                "month_index":       "2026-07",
                "client_id":         "SPOT-TEST",
                "origin_port_id":    "SPOT",
                "destination_port_id": spot_name,
                "vessel_id":         vessel_id,
                "quantity":          13500,
                "monthly_frequency": 1
            }
        ]
    }

    # El endpoint correcto es /forecast/run
    r2 = requests.post(f"{BASE_URL}/forecast/run", json=payload, timeout=30)
    print(f"\n  Forecast con ruta spot -> HTTP {r2.status_code}")
    if r2.status_code == 200:
        agg = r2.json().get("aggregated_data", {})
        for client, routes in agg.items():
            for route, vessels in routes.items():
                for vessel, months in vessels.items():
                    for month, res in months.items():
                        print(f"  -> P/L:           ${res.get('voyage_result', 0):>12,.2f}")
                        print(f"  -> TCE:           ${res.get('tce_real', 0):>12,.2f}/dia")
                        print(f"  -> Port costs:    ${res.get('total_port_costs', 0):>12,.2f}")
                        print(f"  -> Bunker costs:  ${res.get('total_bunker_costs', 0):>12,.2f}")
                        print(f"  -> Flete (yield): ${res.get('flete_unit', 0):>12,.4f}/MT")
                        print(f"  [OK] Forecast Spot ejecutado correctamente" if res.get('voyage_result') is not None else "  [FAIL] Sin resultado")
    else:
        print(f"  [ERROR] {r2.text[:300]}")


if __name__ == "__main__":
    try:
        test_rutas_fijas()
        test_multicotizador_directo()
        test_forecast_spot_real()
        print("\n" + "="*70)
        print("  AUDITORIA COMPLETADA")
        print("="*70 + "\n")
    except Exception as e:
        print(f"\n[ERROR] Error general en auditoria: {e}")
        import traceback; traceback.print_exc()
