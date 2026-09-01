import requests
import json
import os
import openpyxl
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side

list_url = 'https://forecast.geeksoft.tech/api/v1/forecast/list'
load_url = 'https://forecast.geeksoft.tech/api/v1/forecast/load'
run_url = 'https://forecast.geeksoft.tech/api/v1/forecast/run'

res = requests.get(list_url)
scenarios = res.json()

print(f"=== INICIANDO AUDITORÍA REAL MULTI-ESCENARIO MATRIZ FINANCIERA (TOTAL: {len(scenarios)} ESCENARIOS) ===")

output_dir = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Exceles.Petral/QC_Auditoria_Escenarios'
os.makedirs(output_dir, exist_ok=True)

audit_summary = []

for idx, sc in enumerate(scenarios, 1):
    sc_id = sc['id']
    sc_name = sc['name']
    print(f"\n[{idx}/{len(scenarios)}] Procesando Escenario: '{sc_name}' (ID: {sc_id})...")

    load_res = requests.get(f"{load_url}/{sc_id}")
    sc_data = load_res.json()

    s_date = sc_data.get('start_date', '2027-01-01')
    e_date = sc_data.get('end_date', '2027-12-31')
    p_lines = sc_data.get('projection_lines', [])

    if not p_lines:
        print("  ! Advertencia: Sin líneas de proyección. Saltando...")
        continue

    sim_res = requests.post(run_url, json={
        'start_date': s_date,
        'end_date': e_date,
        'projection_lines': p_lines
    })

    if sim_res.status_code != 200:
        print(f"  ! Error en simulación: {sim_res.status_code}")
        continue

    sim_data = sim_res.json()
    agg_data = sim_data.get('aggregated_data', {})
    clients = list(agg_data.keys())

    # Derivar meses en formato YYYY-MM
    s_year, s_month = map(int, s_date.split('-')[:2])
    e_year, e_month = map(int, e_date.split('-')[:2])
    month_keys = []
    month_labels = []
    cy, cm = s_year, s_month
    month_names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
    while cy < e_year or (cy == e_year and cm <= e_month):
        month_keys.append(f"{cy}-{cm:02d}")
        month_labels.append(f"{month_names[cm-1]} {cy}")
        cm += 1
        if cm > 12:
            cm = 1
            cy += 1

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Matriz Financiera'
    ws.views.sheetView[0].showGridLines = True

    # Cabecera THEAD
    header_cols = ['CLIENTE', 'RUTA', 'BUQUE', 'MÉTRICA'] + month_labels + ['TOTAL ACUM']
    ws.append(header_cols)
    ws.row_dimensions[1].height = 25

    slate_fill = PatternFill(start_color='FF1E293B', end_color='FF1E293B', fill_type='solid')
    sky_fill = PatternFill(start_color='FF0C4A6E', end_color='FF0C4A6E', fill_type='solid')
    white_bold = Font(name='Segoe UI', size=9, bold=True, color='FFFFFFFF')
    center_align = Alignment(horizontal='center', vertical='center', wrap_text=True)
    thin_border = Border(
        left=Side(style='thin', color='FFE2E8F0'),
        right=Side(style='thin', color='FFE2E8F0'),
        top=Side(style='thin', color='FFE2E8F0'),
        bottom=Side(style='thin', color='FFE2E8F0')
    )

    for c_idx in range(1, len(header_cols) + 1):
        cell = ws.cell(row=1, column=c_idx)
        cell.fill = sky_fill if c_idx == len(header_cols) else slate_fill
        cell.font = white_bold
        cell.alignment = center_align
        cell.border = thin_border

    current_row = 2
    total_trips_scenario = 0
    total_net_rev_scenario = 0
    total_pl_scenario = 0

    for client in clients:
        routes_data = agg_data[client]
        client_start_row = current_row

        for route in routes_data.keys():
            vessels_data = routes_data[route]
            route_start_row = current_row

            for vessel in vessels_data.keys():
                node = vessels_data[vessel]
                vessel_start_row = current_row

                trips_series = []
                days_series = []
                tons_series = []
                net_rev_series = []
                hire_series = []
                bunker_series = []
                port_series = []
                pl_series = []
                tce_series = []

                for m_key in month_keys:
                    md = node.get(m_key, {})
                    t = md.get('freq', 0)
                    trips_series.append(t)
                    days_series.append(md.get('total_duration', 0) if t > 0 else 0)
                    carga = md.get('carga_unit', 13500)
                    tons_series.append(carga * t if t > 0 else 0)
                    net_rev_series.append(md.get('net_income', 0) if t > 0 else 0)
                    hire_series.append(md.get('charter_hire_cost', 0) if t > 0 else 0)
                    bunker_series.append(md.get('total_bunker_costs', 0) if t > 0 else 0)
                    port_series.append(md.get('total_port_costs', 0) if t > 0 else 0)
                    pl_series.append(md.get('voyage_result', 0) if t > 0 else 0)
                    tce_series.append(md.get('tce_real', 0) if t > 0 else 0)

                sum_fn = lambda l: sum(l)
                avg_fn = lambda l: (sum(l) / len([x for x in l if x > 0])) if any(x > 0 for x in l) else 0

                node_metrics = [
                    ('Viajes (freq)', trips_series, sum_fn(trips_series), '0.0', False),
                    ('Días-Buque', days_series, sum_fn(days_series), '0.0', False),
                    ('Toneladas', tons_series, sum_fn(tons_series), '#,##0', False),
                    ('Net Revenue', net_rev_series, sum_fn(net_rev_series), '$#,##0', True),
                    ('(-) Hire (TCE x días)', hire_series, sum_fn(hire_series), '$#,##0', False),
                    ('(-) Bunker Costs', bunker_series, sum_fn(bunker_series), '$#,##0', False),
                    ('(-) Port Costs', port_series, sum_fn(port_series), '$#,##0', False),
                    ('(=) VOYAGE RESULT / P&L', pl_series, sum_fn(pl_series), '$#,##0', True),
                    ('Métricas TCE ($/d)', tce_series, avg_fn(tce_series), '$#,##0.00', False),
                ]

                total_trips_scenario += sum_fn(trips_series)
                total_net_rev_scenario += sum_fn(net_rev_series)
                total_pl_scenario += sum_fn(pl_series)

                for m_name, vals, tot_val, num_fmt, is_bold in node_metrics:
                    row_vals = [
                        client if current_row == client_start_row else '',
                        route if current_row == route_start_row else '',
                        vessel if current_row == vessel_start_row else '',
                        m_name
                    ] + vals + [tot_val]
                    ws.append(row_vals)
                    ws.row_dimensions[current_row].height = 19

                    for c_idx in range(5, len(header_cols) + 1):
                        cell = ws.cell(row=current_row, column=c_idx)
                        cell.number_format = num_fmt
                        cell.font = Font(name='Segoe UI', size=8.5, bold=is_bold or c_idx == len(header_cols))
                        cell.alignment = Alignment(horizontal='right', vertical='center')
                        cell.border = thin_border

                    m_cell = ws.cell(row=current_row, column=4)
                    m_cell.font = Font(name='Segoe UI', size=8.5, bold=is_bold)
                    m_cell.alignment = Alignment(horizontal='left', vertical='center')
                    m_cell.border = thin_border

                    current_row += 1

                # Merge de Buque
                v_end_row = current_row - 1
                if v_end_row > vessel_start_row:
                    ws.merge_cells(start_row=vessel_start_row, start_column=3, end_row=v_end_row, end_column=3)
                v_cell = ws.cell(row=vessel_start_row, column=3)
                v_color = 'FFDC2626' if 'TABLONES' in vessel else 'FF16A34A'
                v_cell.fill = PatternFill(start_color=v_color, end_color=v_color, fill_type='solid')
                v_cell.font = white_bold
                v_cell.alignment = Alignment(horizontal='center', vertical='center', text_rotation=90)

            # Merge de Ruta
            r_end_row = current_row - 1
            if r_end_row > route_start_row:
                ws.merge_cells(start_row=route_start_row, start_column=2, end_row=r_end_row, end_column=2)
            r_cell = ws.cell(row=route_start_row, column=2)
            r_cell.fill = PatternFill(start_color='FFA855F7', end_color='FFA855F7', fill_type='solid')
            r_cell.font = white_bold
            r_cell.alignment = Alignment(horizontal='center', vertical='center', text_rotation=90)

        # Merge de Cliente
        c_end_row = current_row - 1
        if c_end_row > client_start_row:
            ws.merge_cells(start_row=client_start_row, start_column=1, end_row=c_end_row, end_column=1)
        c_cell = ws.cell(row=client_start_row, column=1)
        c_color = 'FF0369A1' if client == 'SPCC' else 'FF0F4C81'
        c_cell.fill = PatternFill(start_color=c_color, end_color=c_color, fill_type='solid')
        c_cell.font = white_bold
        c_cell.alignment = Alignment(horizontal='center', vertical='center', text_rotation=90)

    # Anchos de columna
    ws.column_dimensions['A'].width = 7
    ws.column_dimensions['B'].width = 7
    ws.column_dimensions['C'].width = 7
    ws.column_dimensions['D'].width = 30
    for col_letter in [openpyxl.utils.get_column_letter(i) for i in range(5, len(header_cols) + 1)]:
        ws.column_dimensions[col_letter].width = 16

    safe_filename = "".join(c for c in sc_name if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    file_path = f"{output_dir}/Matriz_{safe_filename}.xlsx"
    wb.save(file_path)

    audit_summary.append({
        'name': sc_name,
        'clients': clients,
        'rows': current_row - 1,
        'cols': len(header_cols),
        'trips': total_trips_scenario,
        'net_revenue': total_net_rev_scenario,
        'voyage_margin': total_pl_scenario,
        'file': file_path
    })

print("\n=== RESUMEN EJECUTIVO DE AUDITORÍA MULTI-ESCENARIO (REAL DATA) ===")
for res in audit_summary:
    print(f" - Escenario: {res['name']}")
    print(f"   Filas: {res['rows']} | Cols: {res['cols']} | Total Viajes: {res['trips']} | Net Revenue: ${res['net_revenue']:,.0f} | P/L: ${res['voyage_margin']:,.0f}")
    print(f"   Archivo verificado: {res['file']}")
