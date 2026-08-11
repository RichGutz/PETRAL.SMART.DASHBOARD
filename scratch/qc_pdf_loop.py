# -*- coding: utf-8 -*-
import sys
sys.path.append(r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine')

from backend.database import get_supabase
from backend.services.forecast_service import calculate_detailed_port_costs

def run_qc_audit():
    print('=======================================================')
    print('   PETRAL AUTOMATED QC LOOP - PDF AND UI AUDIT VALIDATOR')
    print('=======================================================')

    sb = get_supabase()
    pc_res = sb.table('port_costs_matrix').select('*').execute()
    ag_res = sb.table('port_cost_static').select('*').execute()
    bunker_res = sb.table('bunker_prices').select('*').execute()

    # 1. Inspect Static Port Costs Seed
    ilo_static = calculate_detailed_port_costs('SPCC', 'ILO', 'CARGA', 'MOQUEGUA', pc_res.data, ag_res.data, 'static', {}, 13500, {}, {})
    mat_static = calculate_detailed_port_costs('SPCC', 'MATARANI', 'DESCARGA', 'MOQUEGUA', pc_res.data, ag_res.data, 'static', {}, 13500, {}, {})

    ilo_cost = ilo_static.get('total_cost', 0)
    mat_cost = mat_static.get('total_cost', 0)
    tot_ports = ilo_cost + mat_cost

    # 2. Inspect Bunker Prices
    ifo_price = next((float(b['market_price_usd']) for b in bunker_res.data if b['fuel_type'] == 'IFO'), 0)
    mdo_price = next((float(b['market_price_usd']) for b in bunker_res.data if b['fuel_type'] == 'MDO'), 0)

    print(f'\n[CHECK 1] Agencia POL (ILO):  USD (Esperado: ,000.00)')
    print(f'[CHECK 2] Agencia POD (MATARANI):  USD (Esperado: ,000.00)')
    print(f'[CHECK 3] Total Port Costs:  USD (Esperado: ,000.00)')
    print(f'[CHECK 4] Bunker IFO: /t (Esperado: .26)')
    print(f'[CHECK 5] Bunker MDO: /t (Esperado: ,528.26)')

    errors = []
    if abs(ilo_cost - 22000.0) > 0.01:
        errors.append(f'ILO Port Cost is  instead of ,000.00')
    if abs(mat_cost - 17000.0) > 0.01:
        errors.append(f'MATARANI Port Cost is  instead of ,000.00')
    if abs(ifo_price - 967.26) > 0.01:
        errors.append(f'IFO price is  instead of .26')
    if abs(mdo_price - 1528.26) > 0.01:
        errors.append(f'MDO price is  instead of ,528.26')

    if errors:
        print('\n[FAILED] QC AUDIT RESULT: FAILED')
        for e in errors:
            print(f'  • ERROR: {e}')
        return False
    else:
        print('\n[SUCCESS] QC AUDIT RESULT: 100% SUCCESS - ALL ASSERTIONS PASSED!')
        return True

if __name__ == '__main__':
    success = run_qc_audit()
    sys.exit(0 if success else 1)
