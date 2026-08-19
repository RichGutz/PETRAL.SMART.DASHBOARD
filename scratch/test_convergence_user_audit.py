import json
import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

def simulate_voyage(ld):
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
    port_days0 = 0.0
    bunker_cost0 = 0.0
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
        port_days0 = idle0 + op0
        tot_port_days += port_days0
        
        op_ifo0 = c_disch_ifo if p0.get('action') == 'DESCARGAR' else (c_load_ifo if p0.get('action') == 'CARGAR' else c_idle_ifo)
        op_mdo0 = c_disch_mdo if p0.get('action') == 'DESCARGAR' else (c_load_mdo if p0.get('action') == 'CARGAR' else c_idle_mdo)
        
        ifo_tons0 = (idle0 * c_idle_ifo) + (op0 * op_ifo0)
        mdo_tons0 = (idle0 * c_idle_mdo) + (op0 * op_mdo0)
        tot_ifo_tons += ifo_tons0
        tot_mdo_tons += mdo_tons0
        bunker_cost0 = (ifo_tons0 * p_ifo) + (mdo_tons0 * p_mdo)
        
        if p0.get('action') == 'DESCARGAR':
            f0 = float(p0.get('freight_rate') or 0.0)
            tot_qty += q0
            tot_freight += (q0 * f0)

    legs_bunker = []
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
        leg_bunker = (leg_ifo * p_ifo) + (leg_mdo * p_mdo)
        legs_bunker.append(leg_bunker)

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
        'bunker_cost0': bunker_cost0,
        'legs_bunker': legs_bunker,
        'grand_bunker': grand_bunker,
        'tot_days': tot_days,
        'tot_freight': tot_freight,
        'gross_total': gross_total,
        'tot_port_costs': tot_port_costs,
        'pnl': pnl,
        'tce_real': tce_real
    }

def test_convergence():
    print("=" * 80)
    print("🕵️‍♂️ BENOIT BLANC QC: TEST DE CONVERGENCIA CONTRA RUTAS AUDITADAS POR EL USUARIO")
    print("=" * 80 + "\n")

    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/routes_quotes?select=*",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
    )

    with urllib.request.urlopen(req) as resp:
        routes = json.loads(resp.read().decode('utf-8'))

    print(f"Total rutas analizadas en Supabase: {len(routes)}\n")

    passed_count = 0
    total_audited = 0

    for r in routes:
        name = r.get('name', 'SIN NOMBRE')
        ld = r.get('legs_data')
        if isinstance(ld, str):
            try:
                ld = json.loads(ld)
            except:
                continue
        elif not isinstance(ld, dict):
            continue

        fs = ld.get('financial_summary')
        if not fs or not isinstance(fs, dict):
            continue

        total_audited += 1

        sim = simulate_voyage(ld)

        # Verificación 1: Suma de Búnker Fila 0 + Filas 1..N === grandBunkerTotal
        sum_grid_bunker = sim['bunker_cost0'] + sum(sim['legs_bunker'])
        diff_grid_bunker = abs(sum_grid_bunker - sim['grand_bunker'])

        # Verificación 2: Comparación con Snapshot guardado por el usuario
        stored_bunker = float(fs.get('grandBunkerTotal') or 0)
        stored_pnl = float(fs.get('voyageResultPnl') or 0)
        stored_freight = float(fs.get('totalFreight') or 0)

        diff_stored_bunker = abs(sim['grand_bunker'] - stored_bunker)
        diff_stored_pnl = abs(sim['pnl'] - stored_pnl)
        diff_stored_freight = abs(sim['tot_freight'] - stored_freight)

        is_exact = (diff_grid_bunker < 0.01 and diff_stored_bunker < 0.5 and diff_stored_pnl < 0.5 and diff_stored_freight < 0.5)

        if is_exact:
            passed_count += 1
            print(f"[PASS ✓] {name[:48]:<48} | Bunker: ${sim['grand_bunker']:>8,.0f} | P&L: ${sim['pnl']:>9,.0f} | TCE: ${sim['tce_real']:>6,.0f}/d")
        else:
            print(f"[FAIL ✗] {name[:48]:<48} | Diff Bunker: {diff_stored_bunker:.2f} | Diff P&L: {diff_stored_pnl:.2f}")

    print("\n" + "=" * 80)
    print(f"🎯 RESULTADO FINAL DE CONVERGENCIA: {passed_count} / {total_audited} RUTAS AUDITADAS CONVERGEN AL 100%")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    test_convergence()
