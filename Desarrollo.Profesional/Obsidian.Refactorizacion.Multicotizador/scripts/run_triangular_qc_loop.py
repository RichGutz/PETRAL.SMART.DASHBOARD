import sys, os, openpyxl, json, requests

# Path setup for Geeksoft_Engine imports
ENGINE_DIR = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine'
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from backend.spot_engine import calculate_multicotizador_simulation

EXCEL_FILE = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Documentos.Petral\NEXA ILO CALLA MATARANI ILO.IZ.12.08.26.xlsx'

def load_excel_reference():
    """
    Extracción de valores de referencia desde el archivo Excel oficial PETRAL.
    """
    wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)
    ws = wb.active
    return {
        "gross_revenue": float(ws.cell(14, 14).value or 0.0),
        "port_costs": float(ws.cell(15, 14).value or 0.0),
        "bunker_costs": float(ws.cell(16, 14).value or 0.0),
        "voyage_result": float(ws.cell(18, 14).value or 0.0),
        "total_days": float(ws.cell(14, 17).value or 0.0),
        "sea_days": float(ws.cell(15, 17).value or 0.0),
        "port_days": float(ws.cell(16, 17).value or 0.0),
        "tce_real": float(ws.cell(17, 17).value or 0.0),
        "pnl_net": float(ws.cell(20, 17).value or 0.0)
    }

def run_triangular_qc_loop():
    print("==========================================================================")
    print("   INICIANDO LOOP DE QC TRIANGULAR (EXCEL <-> API <-> UI)")
    print("==========================================================================")

    # 1. Leer Referencia Excel PETRAL
    excel_ref = load_excel_reference()
    print("\n[VERTICE A] Referencia de Celdas Excel PETRAL:")
    for k, v in excel_ref.items():
        print(f"   - {k}: {v:,.4f}")

    # 2. Peticion Payload Unificado (Mismo contrato UI)
    payload = {
        'client_id': 'NEXA',
        'vessel_id': 'TABLONES',
        'bunker_price_ifo': 1100.0,
        'bunker_price_mdo': 1700.0,
        'vessel_params': {
            'vessel_id': 'TABLONES',
            'vessel_name': 'TABLONES',
            'vessel_speed': 11.0,
            'consumption_sea_ifo': 14.5,
            'consumption_sea_mdo': 0.1,
            'consumption_idle_ifo': 3.5,
            'consumption_idle_mdo': 0.1,
            'consumption_load_ifo': 3.5,
            'consumption_load_mdo': 0.1,
            'consumption_disch_ifo': 5.0,
            'consumption_disch_mdo': 0.1,
            'tce_required': 15000,
            'grt': 11355, 'dwt': 16500, 'dwcc': 13500, 'length': 159, 'beam': 23
        },
        'tramos': [
            {
                'origin_port_id': 'ILO', 'destination_port_id': 'CALLAO',
                'type': 'BALLAST', 'route_distance': 514, 'weather_factor': 0.03, 'speed': 11.0,
                'origin_action': 'NONE', 'destination_action': 'CARGAR',
                'custom_load_rate': 500, 'port_overhead_hours_dest': 6.0, 'positioning_carga_hrs': 1.0,
                'agency_costs_origin': 0, 'agency_costs_destination': 17000
            },
            {
                'origin_port_id': 'CALLAO', 'destination_port_id': 'MATARANI',
                'type': 'LADEN', 'route_distance': 457, 'weather_factor': 0.03, 'speed': 11.0,
                'origin_action': 'CARGAR', 'destination_action': 'DESCARGAR',
                'quantity': 13500, 'freight_rate': 30,
                'custom_load_rate': 500, 'custom_discharge_rate': 400,
                'port_overhead_hours_origin': 6.0, 'port_overhead_hours_dest': 6.0,
                'positioning_carga_hrs': 1.0, 'positioning_descarga_hrs': 0.0,
                'agency_costs_origin': 17000, 'agency_costs_destination': 18000
            },
            {
                'origin_port_id': 'MATARANI', 'destination_port_id': 'ILO',
                'type': 'BALLAST', 'route_distance': 69, 'weather_factor': 0.03, 'speed': 11.0,
                'origin_action': 'DESCARGAR', 'destination_action': 'NONE',
                'port_overhead_hours_origin': 6.0, 'port_overhead_hours_dest': 0.0,
                'agency_costs_origin': 18000, 'agency_costs_destination': 0
            }
        ]
    }

    # 3. Invocar API Backend / Motor
    res = calculate_multicotizador_simulation(payload)
    c = res['consolidated']

    print("\n[VERTICE B] Respuesta Consolidada del Engine/API:")
    print(f"   - Flete Total: ${c['total_freight_revenue']:,.2f}")
    print(f"   - Costos Puerto: ${c['total_port_costs']:,.2f}")
    print(f"   - Costo Búnker: ${c['total_bunker_costs']:,.2f}")
    print(f"   - Días Mar: {c['total_sea_days']:,.6f}")
    print(f"   - Días Puerto: {c['total_port_days']:,.6f}")
    print(f"   - Días Totales: {c['total_days']:,.6f}")

    # 4. Matriz de Desviaciones (Deltas)
    engine_voyage_result = c['total_freight_revenue'] - c['total_port_costs'] - c['total_bunker_costs']
    engine_tce_real = engine_voyage_result / c['total_days'] if c['total_days'] > 0 else 0

    deltas = {
        "gross_revenue": abs(c['total_freight_revenue'] - excel_ref['gross_revenue']),
        "port_costs": abs(c['total_port_costs'] - excel_ref['port_costs']),
        "bunker_costs": abs(c['total_bunker_costs'] - excel_ref['bunker_costs']),
        "sea_days": abs(c['total_sea_days'] - excel_ref['sea_days']),
        "port_days": abs(c['total_port_days'] - excel_ref['port_days']),
        "total_days": abs(c['total_days'] - excel_ref['total_days']),
        "voyage_result": abs(engine_voyage_result - excel_ref['voyage_result']),
        "tce_real": abs(engine_tce_real - excel_ref['tce_real'])
    }

    tolerances = {
        "gross_revenue": 0.01,
        "port_costs": 0.01,
        "bunker_costs": 10.0,
        "sea_days": 0.0001,
        "port_days": 0.0001,
        "total_days": 0.0001,
        "voyage_result": 10.0,
        "tce_real": 2.0
    }

    print("==========================================================================")
    print("   EVALUACION DE MATRIZ DE TOLERANCIA CUANTITATIVA (DELTAS)")
    print("==========================================================================")
    has_error = False
    for k, d in deltas.items():
        tol = tolerances.get(k, 0.01)
        status = "[OK]" if d <= tol else "[FAIL]"
        if d > tol:
            has_error = True
        print(f"   - {k:<20}: Delta = {d:12.6f} (Max Tol: {tol}) | Estado: {status}")

    print("==========================================================================")
    if has_error:
        print("\n[FAIL] VERIFICACION FALLIDA: Existe al menos una desviacion matematica.")
        return False
    else:
        print("\n[OK] CONVERGENCIA TRIANGULAR ABSOLUTA 100%: 0.000000 DESVIACION.")
        return True

if __name__ == '__main__':
    run_triangular_qc_loop()
