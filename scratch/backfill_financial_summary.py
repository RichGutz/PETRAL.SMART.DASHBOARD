import os
import sys
import copy
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

supabase = get_supabase()

res = supabase.table('routes_quotes').select('*').execute()
routes = res.data or []

print(f"Total rutas a procesar en routes_quotes: {len(routes)}")

def calculate_financial_summary(ld):
    tramos = ld.get('tramos', [])
    puertos_config = ld.get('puertosConfig', [])
    vparams = ld.get('vesselParams') or {}
    
    speed = float(vparams.get('vessel_speed', 11.0) or 11.0)
    c_sea_ifo = float(vparams.get('consumption_sea_ifo', 14.0) or 14.0)
    c_sea_mdo = float(vparams.get('consumption_sea_mdo', 0.1) or 0.1)
    c_idle_ifo = float(vparams.get('consumption_idle_ifo', 2.5) or 2.5)
    c_idle_mdo = float(vparams.get('consumption_idle_mdo', 0.1) or 0.1)
    c_load_ifo = float(vparams.get('consumption_load_ifo', c_idle_ifo) or c_idle_ifo)
    c_load_mdo = float(vparams.get('consumption_load_mdo', c_idle_mdo) or c_idle_mdo)
    c_disch_ifo = float(vparams.get('consumption_disch_ifo', 3.5) or 3.5)
    c_disch_mdo = float(vparams.get('consumption_disch_mdo', c_idle_mdo) or c_idle_mdo)
    
    p_ifo = float(ld.get('bunker_price_ifo', 967.0) or 967.0)
    p_mdo = float(ld.get('bunker_price_mdo', 1528.0) or 1528.0)

    tot_dist = 0.0
    tot_sea_days = 0.0
    tot_port_days = 0.0
    tot_ifo_tons = 0.0
    tot_mdo_tons = 0.0
    tot_port_costs = 0.0
    tot_freight = 0.0
    tot_qty = 0.0
    tot_dockage_rev = 0.0

    # Puerto 0
    p0 = puertos_config[0] if puertos_config else {}
    if p0.get('action') and p0.get('action') != 'NONE':
        cost0 = float(p0.get('manual_port_cost') or 0.0)
        muell0 = float(p0.get('muellaje_cost') or 0.0)
        tot_port_costs += max(cost0, muell0)
        tot_dockage_rev += muell0
        
        q0 = float(p0.get('quantity') or 0.0)
        r0 = max(1.0, float(p0.get('op_rate') or 500.0))
        runit0 = p0.get('rate_unit', 'TH')
        factor0 = 1.0 if runit0 == 'TD' else 24.0
        tc0 = float(p0.get('time_to_count') if p0.get('time_to_count') not in [None, ''] else (p0.get('overhead') or 0.0))
        pos0 = float(p0.get('positioning') or 0.0)
        
        idle0 = (tc0 + pos0) / 24.0
        op0 = (q0 / r0) / factor0
        tot_port_days += (idle0 + op0)
        
        op_ifo0 = c_disch_ifo if p0.get('action') == 'DESCARGAR' else (c_load_ifo if p0.get('action') == 'CARGAR' else c_idle_ifo)
        op_mdo0 = c_disch_mdo if p0.get('action') == 'DESCARGAR' else (c_load_mdo if p0.get('action') == 'CARGAR' else c_idle_mdo)
        
        tot_ifo_tons += (idle0 * c_idle_ifo) + (op0 * op_ifo0)
        tot_mdo_tons += (idle0 * c_idle_mdo) + (op0 * op_mdo0)
        
        if p0.get('action') == 'DESCARGAR':
            f0 = float(p0.get('freight_rate') or 0.0)
            tot_qty += q0
            tot_freight += (q0 * f0)

    # Tramos 1..N
    for idx, tr in enumerate(tramos):
        dist = float(tr.get('route_distance') or 0.0)
        raw_wf = float(tr.get('weather_factor') or 0.0)
        wf_pct = raw_wf if raw_wf > 1.0 else (raw_wf * 100.0)
        tr_speed = max(1.0, float(tr.get('speed') or speed))
        calc_sea_days = (dist * (1.0 + (wf_pct / 100.0))) / (tr_speed * 24.0) if dist > 0 else 0.0

        p_dest = puertos_config[idx + 1] if idx + 1 < len(puertos_config) else {}
        q_dest = float(p_dest.get('quantity') or 0.0)
        r_dest = max(1.0, float(p_dest.get('op_rate') or 500.0))
        runit_dest = p_dest.get('rate_unit', 'TH')
        factor_dest = 1.0 if runit_dest == 'TD' else 24.0
        tc_dest = float(p_dest.get('time_to_count') if p_dest.get('time_to_count') not in [None, ''] else (p_dest.get('overhead') or 0.0))
        pos_dest = float(p_dest.get('positioning') or 0.0)

        idle_dest = ((tc_dest + pos_dest) / 24.0) if p_dest.get('action') != 'NONE' else 0.0
        op_dest = ((q_dest / r_dest) / factor_dest) if p_dest.get('action') != 'NONE' else 0.0
        calc_port_days = idle_dest + op_dest

        op_ifo_dest = c_disch_ifo if p_dest.get('action') == 'DESCARGAR' else (c_load_ifo if p_dest.get('action') == 'CARGAR' else c_idle_ifo)
        op_mdo_dest = c_disch_mdo if p_dest.get('action') == 'DESCARGAR' else (c_load_mdo if p_dest.get('action') == 'CARGAR' else c_idle_mdo)

        leg_ifo = (calc_sea_days * c_sea_ifo) + (idle_dest * c_idle_ifo) + (op_dest * op_ifo_dest)
        leg_mdo = (calc_sea_days * c_sea_mdo) + (idle_dest * c_idle_mdo) + (op_dest * op_mdo_dest)

        tot_dist += dist
        tot_sea_days += calc_sea_days
        tot_port_days += calc_port_days
        tot_ifo_tons += leg_ifo
        tot_mdo_tons += leg_mdo

        dest_cost = float(p_dest.get('manual_port_cost') or 0.0)
        dest_muell = float(p_dest.get('muellaje_cost') or 0.0)
        tot_port_costs += max(dest_cost, dest_muell)
        tot_dockage_rev += dest_muell

        if p_dest.get('action') == 'DESCARGAR':
            f_rate = float(p_dest.get('freight_rate') or 0.0)
            tot_qty += q_dest
            tot_freight += (q_dest * f_rate)

    tot_days = tot_sea_days + tot_port_days
    ifo_cost = tot_ifo_tons * p_ifo
    mdo_cost = tot_mdo_tons * p_mdo
    grand_bunker = ifo_cost + mdo_cost
    gross_total = tot_freight + tot_dockage_rev

    tce_req = float(vparams.get('tce_required', 13000) or 13000)
    hire_cost = tce_req * tot_days
    pnl = gross_total - hire_cost - grand_bunker - tot_port_costs
    tce_real = (gross_total - grand_bunker - tot_port_costs) / tot_days if tot_days > 0 else 0.0

    return {
        'totalDist': tot_dist,
        'totalSeaDays': tot_sea_days,
        'totalPortDays': tot_port_days,
        'totalDays': tot_days,
        'totalIfoTons': tot_ifo_tons,
        'totalMdoTons': tot_mdo_tons,
        'totalFuelTons': tot_ifo_tons + tot_mdo_tons,
        'ifoCost': ifoCost if 'ifoCost' in locals() else ifo_cost,
        'mdoCost': mdoCost if 'mdoCost' in locals() else mdo_cost,
        'grandBunkerTotal': grand_bunker,
        'totalQuantity': tot_qty,
        'totalFreight': tot_freight,
        'refacturacionMuellaje': tot_dockage_rev,
        'grossRevenueTotal': gross_total,
        'totalPortCosts': tot_port_costs,
        'tceReq': tce_req,
        'hireUsd': hire_cost,
        'addressCommUsd': 0.0,
        'brokerCommUsd': 0.0,
        'totalCommUsd': 0.0,
        'voyageResultPnl': pnl,
        'tceRealizado': tce_real,
        'tceDiff': tce_real - tce_req
    }

updated_count = 0
for r in routes:
    name = r.get('name')
    ld = r.get('legs_data') or {}
    
    fs = calculate_financial_summary(ld)
    ld['financial_summary'] = fs
    
    # Actualizar en Supabase
    up_res = supabase.table('routes_quotes').update({'legs_data': ld}).eq('name', name).execute()
    print(f"[OK] Enriquecida con financial_summary: {name} (P&L: ${fs['voyageResultPnl']:,.2f}, TCE: ${fs['tceRealizado']:,.2f}/d)")
    updated_count += 1

print(f"\nTotal rutas enriquecidas y selladas en Supabase: {updated_count}")
