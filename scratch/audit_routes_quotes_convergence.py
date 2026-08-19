import json
import urllib.request
import math
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://hjjxooxcpvlvbaxgifbn.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc'

def calculate_voyage_engine(tramos, puertos_config, vessel_params, bunker_price_ifo, bunker_price_mdo, address_comm_pct=0, broker_comm_pct=0, refacturar_muellaje_map=None):
    if refacturar_muellaje_map is None:
        refacturar_muellaje_map = {}
        
    ifo_sea = float(vessel_params.get('consumption_sea_ifo', 0) or 0)
    mdo_sea = float(vessel_params.get('consumption_sea_mdo', 0) or 0)
    ifo_idle = float(vessel_params.get('consumption_idle_ifo', 0) or 0)
    mdo_idle = float(vessel_params.get('consumption_idle_mdo', 0) or 0)
    ifo_load = float(vessel_params.get('consumption_load_ifo', 0) or ifo_idle)
    mdo_load = float(vessel_params.get('consumption_load_mdo', 0) or mdo_idle)
    ifo_disch = float(vessel_params.get('consumption_disch_ifo', 0) or 0)
    mdo_disch = float(vessel_params.get('consumption_disch_mdo', 0) or mdo_idle)

    # 1. Fila 0 (POL)
    p0 = puertos_config[0] if len(puertos_config) > 0 else {}
    action0 = p0.get('action', 'NONE')
    q0 = float(p0.get('quantity', 0) or 0)
    rate0 = float(p0.get('op_rate', 0) or 0)
    if rate0 <= 0:
        rate0 = 500.0 if action0 == 'CARGAR' else (450.0 if action0 == 'DESCARGAR' else 0.0)
    rate_factor0 = 1.0 if p0.get('rate_unit') == 'TD' else 24.0

    raw_ttc0 = p0.get('time_to_count')
    if raw_ttc0 is None or raw_ttc0 == '':
        raw_ttc0 = p0.get('overhead', 6.0)
    ttc0_hrs = float(raw_ttc0 or 0) if (action0 in ['CARGAR', 'DESCARGAR']) else 0.0

    raw_pos0 = p0.get('positioning')
    if raw_pos0 is None or raw_pos0 == '':
        raw_pos0 = 1.0 if action0 == 'CARGAR' else (0.0 if action0 == 'DESCARGAR' else 0.0)
    pos0_hrs = float(raw_pos0 or 0) if (action0 in ['CARGAR', 'DESCARGAR']) else 0.0

    idle_days0 = (ttc0_hrs + pos0_hrs) / 24.0
    op_days0 = (q0 / rate0 / rate_factor0) if (action0 in ['CARGAR', 'DESCARGAR'] and rate0 > 0) else 0.0
    port_days0 = idle_days0 + op_days0

    ifo_days_rate0 = ifo_load if action0 == 'CARGAR' else (ifo_disch if action0 == 'DESCARGAR' else 0.0)
    mdo_days_rate0 = mdo_load if action0 == 'CARGAR' else (mdo_disch if action0 == 'DESCARGAR' else 0.0)
    ifo_tons0 = (idle_days0 * ifo_idle) + (op_days0 * ifo_days_rate0)
    mdo_tons0 = (idle_days0 * mdo_idle) + (op_days0 * mdo_days_rate0)

    port_cost0 = float(p0.get('manual_port_cost', 0) or 0) if action0 != 'NONE' else 0.0
    muellaje0 = float(p0.get('muellaje_cost', 0) or 0) if action0 != 'NONE' else 0.0

    # 2. Tramos 1..N
    total_dist = 0.0
    total_sea_days = 0.0
    total_port_days = port_days0
    total_quantity = 0.0
    total_freight = 0.0
    total_port_costs = port_cost0
    total_ifo_tons = ifo_tons0
    total_mdo_tons = mdo_tons0
    total_refacturacion_muellaje = muellaje0 if (refacturar_muellaje_map.get(0, True) and muellaje0 > 0) else 0.0

    for idx, tr in enumerate(tramos):
        dist = float(tr.get('route_distance', 0) or 0)
        speed = float(tr.get('speed', 0) or 11.0)
        if speed <= 0: speed = 11.0
        
        raw_wf = float(tr.get('weather_factor', 0) or 0)
        wf_pct = raw_wf if raw_wf > 1.0 else (raw_wf * 100.0 if raw_wf > 0 else 3.0)
        
        sea_days = (dist * (1.0 + wf_pct / 100.0)) / (speed * 24.0)
        total_dist += dist
        total_sea_days += sea_days

        p_dest = puertos_config[idx + 1] if idx + 1 < len(puertos_config) else {}
        action_dest = p_dest.get('action', 'NONE')
        q_dest = float(p_dest.get('quantity', 0) or 0)
        freight_rate_dest = float(p_dest.get('freight_rate', 0) or tr.get('freight_rate', 0) or 0)
        
        rate_dest = float(p_dest.get('op_rate', 0) or 0)
        if rate_dest <= 0:
            rate_dest = 500.0 if action_dest == 'CARGAR' else (450.0 if action_dest == 'DESCARGAR' else 0.0)
        rate_factor_dest = 1.0 if p_dest.get('rate_unit') == 'TD' else 24.0

        raw_ttc = p_dest.get('time_to_count')
        if raw_ttc is None or raw_ttc == '':
            raw_ttc = p_dest.get('overhead', 6.0)
        ttc_hrs = float(raw_ttc or 0) if (action_dest in ['CARGAR', 'DESCARGAR']) else 0.0

        raw_pos = p_dest.get('positioning')
        if raw_pos is None or raw_pos == '':
            raw_pos = 1.0 if action_dest == 'CARGAR' else (0.0 if action_dest == 'DESCARGAR' else 0.0)
        pos_hrs = float(raw_pos or 0) if (action_dest in ['CARGAR', 'DESCARGAR']) else 0.0

        idle_days = (ttc_hrs + pos_hrs) / 24.0
        op_days = (q_dest / rate_dest / rate_factor_dest) if (action_dest in ['CARGAR', 'DESCARGAR'] and rate_dest > 0) else 0.0
        port_days = idle_days + op_days
        total_port_days += port_days

        ifo_dest_rate = ifo_load if action_dest == 'CARGAR' else (ifo_disch if action_dest == 'DESCARGAR' else 0.0)
        mdo_dest_rate = mdo_load if action_dest == 'CARGAR' else (mdo_disch if action_dest == 'DESCARGAR' else 0.0)

        tr_ifo_tons = (sea_days * ifo_sea) + (idle_days * ifo_idle) + (op_days * ifo_dest_rate)
        tr_mdo_tons = (sea_days * mdo_sea) + (idle_days * mdo_idle) + (op_days * mdo_dest_rate)
        total_ifo_tons += tr_ifo_tons
        total_mdo_tons += tr_mdo_tons

        freight_rev = (q_dest * freight_rate_dest) if action_dest == 'DESCARGAR' else 0.0
        total_freight += freight_rev
        if action_dest == 'DESCARGAR':
            total_quantity += q_dest

        p_cost = float(p_dest.get('manual_port_cost', 0) or 0) if action_dest != 'NONE' else 0.0
        total_port_costs += p_cost

        muellaje_val = float(p_dest.get('muellaje_cost', 0) or 0) if action_dest != 'NONE' else 0.0
        if refacturar_muellaje_map.get(idx + 1, True) and muellaje_val > 0:
            total_refacturacion_muellaje += muellaje_val

    # 3. Totales Financieros
    total_days = total_sea_days + total_port_days
    ifo_cost = total_ifo_tons * float(bunker_price_ifo or 0)
    mdo_cost = total_mdo_tons * float(bunker_price_mdo or 0)
    grand_bunker_total = ifo_cost + mdo_cost
    gross_revenue = total_freight + total_refacturacion_muellaje

    address_comm_usd = total_freight * (float(address_comm_pct or 0) / 100.0)
    broker_comm_usd = total_freight * (float(broker_comm_pct or 0) / 100.0)
    total_comm_usd = address_comm_usd + broker_comm_usd

    tce_req = float(vessel_params.get('tce_required', 13000.0) or 13000.0)
    hire_usd = tce_req * total_days

    voyage_pnl = gross_revenue - (hire_usd + grand_bunker_total + total_port_costs + total_comm_usd)
    net_voyage_margin = gross_revenue - (grand_bunker_total + total_port_costs + total_comm_usd)
    tce_realizado = (net_voyage_margin / total_days) if total_days > 0 else 0.0
    tce_diff = tce_realizado - tce_req

    return {
        'totalDist': total_dist,
        'totalSeaDays': total_sea_days,
        'totalPortDays': total_port_days,
        'totalDays': total_days,
        'totalQuantity': total_quantity,
        'totalFreight': total_freight,
        'refacturacionMuellaje': total_refacturacion_muellaje,
        'grossRevenueTotal': gross_revenue,
        'totalPortCosts': total_port_costs,
        'totalIfoTons': total_ifo_tons,
        'totalMdoTons': total_mdo_tons,
        'ifoCost': ifo_cost,
        'mdoCost': mdo_cost,
        'grandBunkerTotal': grand_bunker_total,
        'addressCommUsd': address_comm_usd,
        'brokerCommUsd': broker_comm_usd,
        'totalCommUsd': total_comm_usd,
        'hireUsd': hire_usd,
        'tceReq': tce_req,
        'voyageResultPnl': voyage_pnl,
        'tceRealizado': tce_realizado,
        'tceDiff': tce_diff
    }

def run_convergence_test():
    req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/routes_quotes?select=*&order=created_at.desc', headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
    with urllib.request.urlopen(req) as resp:
        quotes = json.loads(resp.read().decode('utf-8'))

    print(f'═══════════════════════════════════════════════════════════════════════════════════════════')
    print(f'🕵️ AUDITORÍA BENOIT BLANC: TEST DE CONVERGENCIA ({len(quotes)} RUTAS EN routes_quotes)')
    print(f'═══════════════════════════════════════════════════════════════════════════════════════════\n')

    converged_count = 0
    total_evaluated = 0

    for idx, q in enumerate(quotes, 1):
        name = q.get('name', 'SIN_NOMBRE')
        legs_data = q.get('legs_data') or {}
        saved_summary = legs_data.get('financial_summary')

        if not saved_summary:
            print(f'[{idx}/{len(quotes)}] ⚠️ {name}: Sin financial_summary guardado (Skipped)')
            continue

        total_evaluated += 1
        tramos = legs_data.get('tramos') or []
        puertos_config = legs_data.get('puertosConfig') or []
        vessel_params = legs_data.get('vesselParams') or {}
        bunker_ifo = float(legs_data.get('bunker_price_ifo') or 0)
        bunker_mdo = float(legs_data.get('bunker_price_mdo') or 0)
        address_comm = float(legs_data.get('addressCommPct') or 0)
        broker_comm = float(legs_data.get('brokerCommPct') or 0)
        refacturar_muellaje_map = legs_data.get('refacturarMuellajeMap') or {}

        # Ejecutar Motor Multicotizador
        calc = calculate_voyage_engine(
            tramos,
            puertos_config,
            vessel_params,
            bunker_ifo,
            bunker_mdo,
            address_comm,
            broker_comm,
            refacturar_muellaje_map
        )

        # Comparar métricas clave
        diff_freight = abs(calc['totalFreight'] - float(saved_summary.get('totalFreight', 0)))
        diff_bunker = abs(calc['grandBunkerTotal'] - float(saved_summary.get('grandBunkerTotal', 0)))
        diff_port_costs = abs(calc['totalPortCosts'] - float(saved_summary.get('totalPortCosts', 0)))
        diff_pnl = abs(calc['voyageResultPnl'] - float(saved_summary.get('voyageResultPnl', 0)))
        diff_tce = abs(calc['tceRealizado'] - float(saved_summary.get('tceRealizado', 0)))

        is_converged = (diff_freight < 0.05 and diff_bunker < 0.05 and diff_port_costs < 0.05 and diff_pnl < 0.05 and diff_tce < 0.05)

        if is_converged:
            converged_count += 1
            print(f'[{idx:02d}/{len(quotes):02d}] ✅ CONVERGE 100%: {name}')
            print(f'       Revenue: ${calc["grossRevenueTotal"]:,.2f} | Búnker: ${calc["grandBunkerTotal"]:,.2f} | P&L: ${calc["voyageResultPnl"]:,.2f} | TCE: ${calc["tceRealizado"]:,.2f}/d')
        else:
            print(f'[{idx:02d}/{len(quotes):02d}] ❌ DIFERENCIA: {name}')
            print(f'       Calc  -> Freight: ${calc["totalFreight"]:,.2f} | Bunker: ${calc["grandBunkerTotal"]:,.2f} | P&L: ${calc["voyageResultPnl"]:,.2f} | TCE: ${calc["tceRealizado"]:,.2f}/d')
            print(f'       Saved -> Freight: ${float(saved_summary.get("totalFreight", 0)):,.2f} | Bunker: ${float(saved_summary.get("grandBunkerTotal", 0)):,.2f} | P&L: ${float(saved_summary.get("voyageResultPnl", 0)):,.2f} | TCE: ${float(saved_summary.get("tceRealizado", 0)):,.2f}/d')

    print(f'\n═══════════════════════════════════════════════════════════════════════════════════════════')
    print(f'🎯 RESULTADO FINAL DE AUDITORÍA:')
    print(f'   Rutas Evaluadas: {total_evaluated}')
    print(f'   Convergencia Exitosa (100% Identidad Matemática): {converged_count} / {total_evaluated} ({converged_count/total_evaluated*100:.1f}%)')
    print(f'═══════════════════════════════════════════════════════════════════════════════════════════')

if __name__ == '__main__':
    run_convergence_test()
