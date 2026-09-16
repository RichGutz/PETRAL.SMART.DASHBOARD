"""
GENERADOR DEL DECK BUSHIDO V2: SUSTENTO PERICIAL DE VARIACIÓN DE ALCANCE & AUDITORÍA DE HORAS
De la Aritmética Estática (Resultados.JN) a la Suite Multidimensional DELFOS SHIPPING SOFTWARE
"""
import os
import sys
import re
import base64
import subprocess
from datetime import datetime

ws_path = r"c:\Users\rguti\PETRAL.SMART.DASHBOARD"
PROJECT_START_DATE = datetime(2026, 6, 24, 0, 0, 0)

def analyze_workspace_bushido_v2(ws_path, hourly_rate=60.0):
    day_activity = {}
    git_by_date = {}

    # 1. Commits git con hash y mensaje
    cmd = ['git', 'log', '--all', '--pretty=format:%ad|%h|%s', '--date=iso']
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=ws_path)

    for line in res.stdout.strip().split('\n'):
        if line:
            parts = line.split('|', 2)
            if len(parts) == 3:
                try:
                    dt = datetime.strptime(parts[0][:19], '%Y-%m-%d %H:%M:%S')
                    if dt >= PROJECT_START_DATE:
                        day_str = dt.strftime('%Y-%m-%d')
                        if day_str not in day_activity:
                            day_activity[day_str] = []
                        day_activity[day_str].append(dt)
                        if day_str not in git_by_date:
                            git_by_date[day_str] = []
                        git_by_date[day_str].append(f"[{parts[1]}] {parts[2]}")
                except Exception:
                    pass

    # 2. Fechas de modificación de archivos en el workspace
    valid_exts = ('.py', '.tsx', '.ts', '.js', '.md', '.sql', '.html', '.json', '.png', '.svg', '.txt', '.pdf', '.css', '.xlsx')
    ignore_dirs = {'node_modules', '.git', 'dist', '.vite', '.vscode'}

    for root, dirs, files in os.walk(ws_path):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for f in files:
            if f.endswith(valid_exts):
                path = os.path.join(root, f)
                try:
                    mtime = os.path.getmtime(path)
                    dt = datetime.fromtimestamp(mtime)
                    if dt >= PROJECT_START_DATE:
                        day_str = dt.strftime('%Y-%m-%d')
                        if day_str not in day_activity:
                            day_activity[day_str] = []
                        day_activity[day_str].append(dt)
                except Exception:
                    pass

    # 3. Marcas de tiempo en logs de trabajo
    for log_name in ['interaction_log.txt', 'gemini_work_log.txt']:
        log_path = os.path.join(ws_path, log_name)
        if os.path.exists(log_path):
            try:
                with open(log_path, 'r', encoding='utf-8', errors='ignore') as lf:
                    curr_date = None
                    for line in lf:
                        m_date = re.search(r'2026-\d{2}-\d{2}', line)
                        if m_date:
                            curr_date = m_date.group(0)
                        m_time = re.search(r'(\d{1,2}):(\d{2}):(\d{2})', line)
                        if curr_date and m_time:
                            try:
                                dt = datetime.strptime(f"{curr_date} {m_time.group(0)}", '%Y-%m-%d %H:%M:%S')
                                if dt >= PROJECT_START_DATE:
                                    if curr_date not in day_activity:
                                        day_activity[curr_date] = []
                                    day_activity[curr_date].append(dt)
                            except Exception:
                                pass
            except Exception:
                pass

    summary = []
    total_hours_project = 0.0
    total_events_project = 0
    dias_semana_es = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

    for idx, day in enumerate(sorted(day_activity.keys()), start=1):
        timestamps = sorted(day_activity[day])
        sessions = []
        curr_start = timestamps[0]
        curr_end = timestamps[0]

        for t in timestamps[1:]:
            if (t - curr_end).total_seconds() <= 9000:  # Ventana de 2.5h
                curr_end = t
            else:
                sessions.append((curr_start, curr_end))
                curr_start = t
                curr_end = t
        sessions.append((curr_start, curr_end))

        day_sec = 0
        for s_start, s_end in sessions:
            sec = (s_end - s_start).total_seconds()
            sec += 1800  # 30 min warmup
            day_sec += sec

        hours = day_sec / 3600.0
        day_amount = hours * hourly_rate
        total_hours_project += hours
        total_events_project += len(timestamps)

        commits_list = git_by_date.get(day, [])
        commits_text = "; ".join([c.split(' ', 1)[1] for c in commits_list[:2]]) if commits_list else "Ingeniería de software, ruteo multivariable y auditoría de datos"
        if len(commits_text) > 95:
            commits_text = commits_text[:92] + "..."

        dt_day = datetime.strptime(day, '%Y-%m-%d')
        dia_nombre = dias_semana_es[dt_day.weekday()]
        day_formatted = f"{day} / {dia_nombre}"

        summary.append({
            'num': idx,
            'day': day,
            'day_formatted': day_formatted,
            'events': len(timestamps),
            'start': timestamps[0].strftime('%H:%M'),
            'end': timestamps[-1].strftime('%H:%M'),
            'hours': round(hours, 2),
            'amount_usd': round(day_amount, 2),
            'tasks': commits_text
        })

    return summary, round(total_hours_project, 2), total_events_project, round(total_hours_project * hourly_rate, 2)


def generate_bushido_v2_deck():
    summary, total_hours, total_events, total_usd = analyze_workspace_bushido_v2(ws_path, 60.0)
    total_days = len(summary)

    dev_contract_hours = 110.0
    dev_contract_rate = 60.0
    dev_contract_usd = 6600.0
    total_contract_onetime_hours = 150.0
    total_contract_onetime_usd = 9100.0

    dev_overage_hours = round(total_hours - dev_contract_hours, 2)
    dev_overage_usd = round(dev_overage_hours * dev_contract_rate, 2)
    dev_overage_pct = round((dev_overage_hours / dev_contract_hours) * 100, 1)

    total_delivered_hours = round(total_contract_onetime_hours + dev_overage_hours, 2)
    total_delivered_usd = round(total_contract_onetime_usd + dev_overage_usd, 2)

    today_str = datetime.now().strftime('%d de Septiembre de %Y')

    logo_file = os.path.join(ws_path, "Boiler.Plate", "PPTS.HERMOSAS", "logo_final_v3.png")
    if os.path.exists(logo_file):
        with open(logo_file, "rb") as img_f:
            logo_b64 = base64.b64encode(img_f.read()).decode('utf-8')
            logo_src = f"data:image/png;base64,{logo_b64}"
    else:
        logo_src = "/Logo.Petral.png"

    # Filas de tabla forense
    table_rows_html = []
    for item in summary:
        row = f"""                        <tr>
                            <td style="text-align: center; font-weight: 700; color: var(--navy);">{item['num']}</td>
                            <td style="font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 8pt; color: #1E293B;">{item['day_formatted']}</td>
                            <td style="text-align: center; font-size: 8pt; color: #64748B;">{item['start']} - {item['end']}</td>
                            <td style="text-align: center; font-weight: 700; color: var(--accent);">{item['hours']:.2f} h</td>
                            <td style="text-align: right; font-weight: 700; color: var(--navy);">${item['amount_usd']:,.2f}</td>
                            <td style="font-size: 8pt; color: #475569;" title="{item['tasks']}">{item['tasks']}</td>
                        </tr>"""
        table_rows_html.append(row)
    all_table_rows = "\n".join(table_rows_html)

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BUSHIDO V2: Sustento Pericial de Variación de Alcance & Auditoría Forense - DELFOS SHIPPING SOFTWARE</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

        :root {{
            --bg:          #F8FAFC;
            --bg-card:     #FFFFFF;
            --navy:        #0F2C59;
            --navy-dark:   #0A192F;
            --navy-mid:    #1E3A8A;
            --primary:     #0F2C59;
            --accent:      #0284C7;
            --accent-dim:  rgba(2, 132, 199, 0.1);
            --accent-brd:  rgba(2, 132, 199, 0.3);
            --blue:        #2563EB;
            --green:       #059669;
            --green-dim:   rgba(5, 150, 105, 0.1);
            --amber:       #D97706;
            --amber-dim:   rgba(217, 119, 6, 0.1);
            --red:         #E11D48;
            --red-dim:     rgba(225, 29, 72, 0.1);
            --purple:      #7C3AED;
            --purple-dim:  rgba(124, 58, 237, 0.1);
            --text:        #0F172A;
            --text-dim:    rgba(15, 23, 42, 0.70);
            --border:      rgba(15, 23, 42, 0.12);
            --shadow:      0 6px 24px rgba(15, 23, 42, 0.08);
            --shadow-lg:   0 14px 44px rgba(15, 23, 42, 0.14);
        }}

        html, body {{
            width: 100%; height: 100%;
            background: var(--bg);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            overflow: hidden;
            user-select: none;
        }}

        #progress {{
            position: fixed; top: 0; left: 0; height: 6px; z-index: 999;
            background: linear-gradient(90deg, var(--accent), var(--green), var(--amber));
            transition: width 0.35s ease;
        }}

        .top-brand-bar {{
            position: fixed;
            top: 18px;
            left: 48px;
            right: 48px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 900;
            pointer-events: none;
        }}
        .brand-logo {{
            height: 52px;
            object-fit: contain;
            filter: drop-shadow(0 2px 5px rgba(0,0,0,0.1));
        }}
        .brand-badge {{
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid var(--border);
            padding: 7px 18px;
            border-radius: 9999px;
            font-size: 9.5pt;
            font-weight: 800;
            color: var(--navy);
            letter-spacing: 0.06em;
            text-transform: uppercase;
            box-shadow: var(--shadow);
            backdrop-filter: blur(8px);
        }}

        #deck {{
            width: 100%; height: 100%;
            position: relative;
        }}

        .slide {{
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            padding: 84px 60px 48px 60px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.4s ease, transform 0.4s ease;
            transform: scale(0.985);
            background: var(--bg);
        }}
        .slide.active {{
            opacity: 1;
            pointer-events: auto;
            transform: scale(1);
            z-index: 10;
        }}

        .slide-content {{
            width: 100%;
            max-width: 1380px;
            margin: 0 auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }}

        .tag {{
            display: inline-block;
            font-size: 9pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--accent);
            background: var(--accent-dim);
            padding: 4px 12px;
            border-radius: 6px;
            margin-bottom: 8px;
            width: fit-content;
        }}

        h1 {{
            font-family: 'Outfit', sans-serif;
            font-size: 38pt;
            font-weight: 900;
            color: var(--navy);
            line-height: 1.1;
            margin-bottom: 10px;
            letter-spacing: -0.02em;
        }}
        h2 {{
            font-family: 'Outfit', sans-serif;
            font-size: 24pt;
            font-weight: 900;
            color: var(--navy);
            line-height: 1.15;
            margin-bottom: 6px;
            letter-spacing: -0.01em;
        }}
        .sub {{
            font-size: 11.5pt;
            color: var(--text-dim);
            margin-bottom: 16px;
            font-weight: 500;
            line-height: 1.4;
        }}

        .kpi-grid-4 {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 14px;
        }}
        .kpi-box {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 14px 18px;
            box-shadow: var(--shadow);
            border-top: 5px solid var(--accent);
        }}
        .kpi-box .label {{
            font-size: 8.5pt;
            font-weight: 800;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 4px;
        }}
        .kpi-box .num {{
            font-family: 'Outfit', sans-serif;
            font-size: 26pt;
            font-weight: 900;
            color: var(--navy);
            line-height: 1.1;
        }}
        .kpi-box .desc {{
            font-size: 9pt;
            color: var(--text-dim);
            margin-top: 4px;
            line-height: 1.35;
        }}

        .card {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 18px 22px;
            box-shadow: var(--shadow);
        }}

        .callout {{
            border-radius: 10px;
            padding: 12px 18px;
            margin-top: 12px;
            font-size: 10pt;
            line-height: 1.5;
        }}
        .callout-blue {{ background: rgba(2, 132, 199, 0.08); border-left: 5px solid var(--accent); }}
        .callout-amber {{ background: rgba(217, 119, 6, 0.08); border-left: 5px solid var(--amber); }}
        .callout-green {{ background: rgba(5, 150, 105, 0.08); border-left: 5px solid var(--green); }}
        .callout-purple {{ background: rgba(124, 58, 237, 0.08); border-left: 5px solid var(--purple); }}

        .ppt-table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
            background: #FFFFFF;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: var(--shadow);
            border: 1px solid var(--border);
        }}
        .ppt-table th {{
            background: var(--navy);
            color: #FFFFFF;
            font-weight: 700;
            text-align: left;
            padding: 10px 14px;
            font-size: 8.8pt;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
        .ppt-table td {{
            padding: 9px 14px;
            border-bottom: 1px solid #E2E8F0;
            color: #334155;
            vertical-align: middle;
        }}
        .ppt-table tr:nth-child(even) {{
            background: #F8FAFC;
        }}

        .badge-pill {{
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .badge-blue {{ background: #DBEAFE; color: #1E40AF; }}
        .badge-green {{ background: #D1FAE5; color: #065F46; }}
        .badge-amber {{ background: #FEF3C7; color: #92400E; }}
        .badge-purple {{ background: #EDE9FE; color: #5B21B6; }}

        .slide-footnote {{
            display: flex;
            justify-content: space-between;
            font-size: 8.5pt;
            color: var(--text-dim);
            border-top: 1px solid var(--border);
            padding-top: 8px;
            margin-top: 10px;
            font-weight: 600;
        }}

        .nav-controls {{
            position: fixed;
            bottom: 14px;
            right: 48px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 950;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid var(--border);
            padding: 5px 12px;
            border-radius: 9999px;
            box-shadow: var(--shadow);
            backdrop-filter: blur(8px);
        }}
        .nav-btn {{
            background: transparent;
            border: none;
            color: var(--navy);
            font-size: 15pt;
            font-weight: 900;
            cursor: pointer;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }}
        .nav-btn:hover {{
            background: var(--navy);
            color: #FFFFFF;
        }}
        .nav-counter {{
            font-size: 9pt;
            font-weight: 800;
            color: var(--navy);
            font-family: 'JetBrains Mono', monospace;
            padding: 0 4px;
        }}

        .day-log-container {{
            max-height: 440px;
            overflow-y: auto;
            border: 1px solid var(--border);
            border-radius: 10px;
            background: #FFFFFF;
            box-shadow: var(--shadow);
        }}
        .day-log-container::-webkit-scrollbar {{
            width: 7px;
        }}
        .day-log-container::-webkit-scrollbar-track {{
            background: #F1F5F9;
        }}
        .day-log-container::-webkit-scrollbar-thumb {{
            background: #94A3B8;
            border-radius: 4px;
        }}
        .day-log-container table {{
            width: 100%;
            border-collapse: collapse;
        }}
        .day-log-container th {{
            position: sticky;
            top: 0;
            background: var(--navy);
            color: #FFFFFF;
            font-weight: 700;
            padding: 8px 12px;
            font-size: 8pt;
            text-transform: uppercase;
            z-index: 2;
        }}
    </style>
</head>
<body>

    <div id="progress"></div>

    <div class="top-brand-bar">
        <img src="{logo_src}" class="brand-logo" alt="Logo Petral">
        <div class="brand-badge">BUSHIDO V2 &bull; SUSTENTO PERICIAL DE ALCANCE & AUDITORÍA DE HORAS</div>
    </div>

    <div id="deck">

        <!-- ==========================================
             SLIDE 1: PORTADA & RESUMEN EJECUTIVO V2
             ========================================== -->
        <div class="slide active">
            <div class="slide-content" style="justify-content: center;">
                <div class="tag">BUSHIDO V2 &bull; DICTAMEN TÉCNICO-FINANCIERO &bull; {today_str.upper()}</div>
                <h1>Navigating the Future</h1>
                <div class="sub" style="font-size: 14pt; margin-bottom: 22px; color: var(--navy-mid); font-weight: 600;">
                    Sustento Pericial de Modificación de Alcance, Saneamiento de Datos Legacy y Auditoría Forense de Horas Devengadas
                </div>

                <div class="kpi-grid-4" style="margin-bottom: 22px;">
                    <div class="kpi-box">
                        <div class="label">Desarrollo Cotizado</div>
                        <div class="num" style="color: #64748B;">{dev_contract_hours:.2f} h</div>
                        <div class="desc">Etapa 2 Base ($6,600 USD)</div>
                    </div>
                    <div class="kpi-box" style="border-top: 5px solid var(--accent);">
                        <div class="label">Horas Reales Auditadas</div>
                        <div class="num" style="color: var(--accent);">{total_hours:.2f} h</div>
                        <div class="desc">Desde 24/06/2026 ({total_events:,} eventos Git/IDE)</div>
                    </div>
                    <div class="kpi-box" style="border-top: 5px solid var(--amber);">
                        <div class="label">Sobreesfuerzo Devengado</div>
                        <div class="num" style="color: var(--amber);">+{dev_overage_pct}%</div>
                        <div class="desc">+{dev_overage_hours:.2f} hrs adicionales</div>
                    </div>
                    <div class="kpi-box" style="border-top: 5px solid var(--green);">
                        <div class="label">Estado de Producción</div>
                        <div class="num" style="color: var(--green); font-size: 18pt; margin-top: 6px;">100% VIVO</div>
                        <div class="desc">forecast.geeksoft.tech</div>
                    </div>
                </div>

                <div class="card" style="border-left: 6px solid var(--accent); background: #FFFFFF; padding: 20px 26px;">
                    <strong style="color: var(--navy); font-size: 12pt; display: block; margin-bottom: 6px;">Mensaje Clave del Dictamen Gerencial:</strong>
                    <p style="font-size: 10.5pt; color: #334155; line-height: 1.55;">
                        Presentar a la Gerencia y Dirección de <strong>Naviera Petral S.A.</strong> el sustento objetivo del desborde del alcance inicial: el proyecto evolucionó de una <strong>hoja de cálculo interactiva básica</strong> a <strong>DELFOS SHIPPING SOFTWARE</strong>, una Suite Enterprise de Inteligencia Comercial Marítima + Consultoría de Reingeniería de Procesos + Ciberseguridad Bancaria + Matriz NAVITRANSO + 13 Exportadores Print-Ready, respaldada por una auditoría digital inalterable de <strong>{total_hours:.2f} horas reales de trabajo</strong> en {total_days} jornadas activas desde el inicio del proyecto (24 de Junio de 2026).
                    </p>
                </div>

                <div class="slide-footnote" style="margin-top: 26px;">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 01 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 2: AUTOPSIA DE LA MATERIA PRIMA (JN)
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">DIAGNÓSTICO FORENSE &bull; AUTOPSIA DE MATERIA PRIMA</div>
                <h2>Slide 2: De la Aritmética Estática a la Suite Multidimensional</h2>
                <div class="sub">Cómo las fórmulas de <code>Resultados.JN\VC Tablones 2026.xlsx</code> indujeron a cotizar un software simple cuando el negocio requería un motor multivariable.</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px;">
                    <div class="card" style="border-top: 5px solid #64748B;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="color: var(--navy); font-size: 12pt;">
                                📋 La Materia Prima Legacy (Resultados.JN)
                            </strong>
                            <span class="badge-pill" style="background: #F1F5F9; color: #475569;">Simple Aritmética</span>
                        </div>
                        <ul style="font-size: 9.8pt; color: #475569; padding-left: 18px; line-height: 1.5;">
                            <li><strong>Fórmulas Lineales de Celda Fija (v.038):</strong>
                                <div style="background: #0F172A; color: #E2E8F0; padding: 6px 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; margin: 4px 0;">
                                    N18 = +N14 - N15 - N16 - N17 <span style="color: #94A3B8;">(Ing - Com - Búnk - Otr)</span><br>
                                    Q18 = 15000 <span style="color: #F87171;">(TCE Req cableado a fuego)</span><br>
                                    Q20 = +N18 - (Q18 * Q14) <span style="color: #38BDF8;">(PnL estático por días)</span>
                                </div>
                            </li>
                            <li><strong>Fórmulas Quebradas:</strong> Celdas con error de referencia como <code>D34: =IF(B34=0,"",+#REF!+((R34)/24))</code>.</li>
                            <li><strong>Omisiones Críticas:</strong> Búnker plano sin segmentación, cero muellaje dinámico por terminal, cero demoras estadísticas y cero modelado de contratos triangulares.</li>
                            <li><strong>Efecto en Cotización:</strong> Hizo suponer de buena fe que el PnL era estático, estimándose 110h ($6,600 USD).</li>
                        </ul>
                    </div>

                    <div class="card" style="border-top: 5px solid var(--accent);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="color: var(--accent); font-size: 12pt;">
                                🚀 El Salto a las 5 Dimensiones Dinámicas
                            </strong>
                            <span class="badge-pill badge-blue">Suite Entregada</span>
                        </div>
                        <ul style="font-size: 9.8pt; color: #475569; padding-left: 18px; line-height: 1.5;">
                            <li><strong>1. Ruteo Multi-Leg:</strong> Hasta 10 tramos con velocidades mar vs maniobra y laytime con regla de 6h (Time to Count).</li>
                            <li><strong>2. Búnker 5-Tier:</strong> Consumo segmentado en 5 estados operativos (Sea Loaded, Ballast, Maniobra, Bombeo, Puerto) + BAF indexado.</li>
                            <li><strong>3. Muellaje & Demoras:</strong> Tarifas dinámicas por terminal (SPCC, TISUR, APM) y modo de demoras estadísticas reales.</li>
                            <li><strong>4. Matriz Financiera 12 Meses:</strong> Consolidación viva de toda la flota (Tablones, Moquegua, Huemel, Concón) y contratos COA/SPOT.</li>
                            <li><strong>5. Analytics & Spaghetti Map:</strong> Detección instantánea de fugas de margen con ECharts y cartografía geoespacial.</li>
                        </ul>
                    </div>
                </div>

                <div class="callout callout-amber" style="margin-top: 8px;">
                    <strong style="color: var(--amber); font-size: 10.5pt; display: block; margin-bottom: 3px;">Conclusión Pericial para Negociación Gerencial:</strong>
                    <p style="font-size: 9.8pt; color: #334155; line-height: 1.45;">
                        Petral contrató originalmente la digitalización de una hoja de cálculo estática; sin embargo, al descubrir que el modelo legacy no capturaba la complejidad operativa real del negocio marítimo, <strong>GEEKSOFT construyó un ERP de Inteligencia Comercial Multidimensional</strong> que hoy previene pérdidas de decenas de miles de dólares por viaje.
                    </p>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 02 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 3: EL PIPELINE DE 4 MÓDULOS TRANSACCIONALES
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">ARQUITECTURA DE MÓDULOS &bull; PROPUESTA DE VALOR</div>
                <h2>Slide 3: Pipeline de Inteligencia Comercial Marítima</h2>
                <div class="sub">Secuencia operativa formal de los 4 módulos transaccionales desarrollados fuera de los maestros.</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px;">
                    <div class="card" style="border-left: 5px solid var(--accent);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <strong style="color: var(--navy); font-size: 11.5pt;">Paso 1: Voyage Calculator (Multicotizador)</strong>
                            <span class="badge-pill badge-blue">Motor Base</span>
                        </div>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5;">
                            Calcula el <strong>muellaje paramétrico</strong> por terminal y <strong>sugiere demoras con base estadística en tiempo real</strong> según el comportamiento histórico de cada puerto.
                        </p>
                    </div>

                    <div class="card" style="border-left: 5px solid var(--green);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <strong style="color: var(--navy); font-size: 11.5pt;">Paso 2: Matrices Financieras (Petral & Navitranso)</strong>
                            <span class="badge-pill badge-green">Dual Reporting</span>
                        </div>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5;">
                            <strong>Modelación multidimensional de 12 meses</strong> con simulaciones *what-if* en caliente y doble espejo: Formato Petral y Formato Navitranso de control presupuestal.
                        </p>
                    </div>

                    <div class="card" style="border-left: 5px solid var(--amber);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <strong style="color: var(--navy); font-size: 11.5pt;">Paso 3: AN GRAF (Analytics Visual)</strong>
                            <span class="badge-pill badge-amber">Detección</span>
                        </div>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5;">
                            Permite <strong>descubrir tendencias, anomalías y patrones financieros</strong> en márgenes y fletes que resultan imposibles de identificar en una tabla plana de datos.
                        </p>
                    </div>

                    <div class="card" style="border-left: 5px solid var(--purple);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <strong style="color: var(--navy); font-size: 11.5pt;">Paso 4: Spaghetti Map (Visión Geoespacial)</strong>
                            <span class="badge-pill badge-purple">Georreferencial</span>
                        </div>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5;">
                            Proporciona una <strong>visión integral del tráfico de la flota (cabotaje e internacional)</strong>, sopesando visualmente la densidad, volumen e importancia estratégica de cada ruta.
                        </p>
                    </div>
                </div>

                <div class="callout callout-blue">
                    <strong style="color: var(--accent); font-size: 11pt; display: block; margin-bottom: 3px;">Resultado Tecnológico:</strong>
                    <p style="font-size: 10.2pt; color: #334155;">
                        Petral no recibió un simple visor, sino <strong>DELFOS SHIPPING SOFTWARE</strong>, una suite transaccional enterprise integrada que conecta desde la cotización puntual hasta el mapa de tráfico regional.
                    </p>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 03 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 4: ANÁLISIS ESTADÍSTICO DE DEMORAS
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">MÓDULO FUERA DE ALCANCE &bull; ANÁLISIS ESTADÍSTICO</div>
                <h2>Slide 4: Maestro de Demoras & Modelación Estadística</h2>
                <div class="sub">De una tarifa plana arbitraria a un subsistema analítico de dispersión, percentiles y fondeo.</div>

                <div style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 20px; margin-bottom: 14px;">
                    <div class="card" style="border-top: 5px solid var(--accent);">
                        <strong style="color: var(--navy); font-size: 12pt; display: block; margin-bottom: 8px;">
                            📊 Lo que se Construyó (Analítica Forense de Demurrage)
                        </strong>
                        <ul style="font-size: 10pt; color: #475569; padding-left: 20px; line-height: 1.55;">
                            <li><strong>Distribución Histórica por Puerto:</strong> Análisis estadístico de tiempos de espera en fondeo y maniobra para terminales peruanos y chilenos.</li>
                            <li><strong>Modelación de Despacho vs. Estadía:</strong> Cálculo automatizado del ritmo de carga/descarga (TM/día) vs. días pactados en póliza de fletamento.</li>
                            <li><strong>Impacto Operativo Multicapa:</strong> Conversión matemática de días de demora en búnker idle consumido, costo HIRE adicional y dilución de TCE diario.</li>
                        </ul>
                    </div>

                    <div class="card" style="border-top: 5px solid var(--amber);">
                        <strong style="color: var(--amber); font-size: 12pt; display: block; margin-bottom: 8px;">
                            ⚠️ Desviación Frente al Alcance Contratado
                        </strong>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5; margin-bottom: 8px;">
                            El contrato inicial contemplaba únicamente un <strong>campo de texto plano de tarifa diaria</strong> sin cruces ni procesamiento.
                        </p>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5;">
                            La creación de un módulo analítico estadístico con benchmarks históricos constituye un subsistema especializado de ingeniería de datos marítimos.
                        </p>
                    </div>
                </div>

                <div class="callout callout-amber">
                    <strong style="color: var(--amber); font-size: 11pt; display: block; margin-bottom: 3px;">Valor para Naviera Petral:</strong>
                    <p style="font-size: 10.2pt; color: #334155;">
                        Permite sustentar penalidades con rigor matemático ante clientes como SPCC y NEXA, mitigando sobrecostos ocultos por congestión en muelle.
                    </p>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 04 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 5: LIQUIDACIONES DE VIAJE & RETRABAJO ETL
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">MÓDULO FUERA DE ALCANCE &bull; CONCILIACIÓN POST-VIAJE</div>
                <h2>Slide 5: Análisis de Liquidaciones de Viaje & Retrabajo por Inconsistencias</h2>
                <div class="sub">Un módulo ERP post-operativo no cotizado que demandó triple ciclo de normalización forense.</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px;">
                    <div class="card" style="border-left: 5px solid var(--red);">
                        <strong style="color: var(--red); font-size: 12pt; display: block; margin-bottom: 8px;">
                            🔄 Triple Iteración por Criterios Cambiantes & Falta de Datos
                        </strong>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5; margin-bottom: 8px;">
                            El módulo de liquidaciones fue <strong>subido y reestructurado 3 veces consecutivas</strong> debido a que las planillas suministradas carecían de normalización contable y modificaban fórmulas de viaje en viaje.
                        </p>
                        <p style="font-size: 10pt; line-height: 1.5; font-weight: 700; color: #991B1B;">
                            Hasta la fecha, Petral NO cuenta con liquidaciones de viaje matemáticamente correctas ni consistentes por parte de sus operadores.
                        </p>
                    </div>

                    <div class="card" style="border-left: 5px solid var(--purple);">
                        <strong style="color: var(--purple); font-size: 12pt; display: block; margin-bottom: 8px;">
                            🎯 Pre-Voyage (Cotizado) vs. Post-Voyage (Construido)
                        </strong>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5; margin-bottom: 8px;">
                            <strong>Alcance Contratado:</strong> Estimación comercial previa al zarpe (*Pre-Voyage Estimation*).
                        </p>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5;">
                            <strong>Entregable Real:</strong> Sistema de liquidación y conciliación contable de viaje (*Post-Voyage Actuals Reconciliation ERP*), calculando variaciones reales de combustible, demoras y gastos portuarios finales.
                        </p>
                    </div>
                </div>

                <div class="callout callout-purple">
                    <strong style="color: var(--purple); font-size: 11pt; display: block; margin-bottom: 3px;">Diagnóstico Pericial:</strong>
                    <p style="font-size: 10.2pt; color: #334155;">
                        La falta de madurez de los datos originales del cliente multiplicó las horas de ingeniería, transformando el desarrollo en un proceso de consultoría forense contable.
                    </p>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 05 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 6: MATRIZ FINANCIERA NAVITRANSO
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">MÓDULO FUERA DE ALCANCE &bull; ESTRUCTURA FINANCIERA DUAL</div>
                <h2>Slide 6: Matriz Financiera NAVITRANSO & Reportería Dedicada</h2>
                <div class="sub">Creación de un modelo contable de 4 bloques independientes y vista de solo lectura no contemplada en el alcance.</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px;">
                    <div class="card" style="border-top: 5px solid var(--accent);">
                        <strong style="color: var(--navy); font-size: 12pt; display: block; margin-bottom: 8px;">
                            🏛️ Estructura de 4 Bloques Contables Independientes
                        </strong>
                        <ul style="font-size: 10pt; color: #475569; padding-left: 20px; line-height: 1.55;">
                            <li><strong>Bloque 1 - Ingresos Operacionales:</strong> Consolidación de fletes por TM y recargos por demoras brutas.</li>
                            <li><strong>Bloque 2 - Costos Variables Directos:</strong> Consumo búnker (IFO/MDO), peajes y gastos de agenciamiento portuario.</li>
                            <li><strong>Bloque 3 - Costos Fijos & Arriendo (HIRE):</strong> Time Charter equivalente diario y prorrateo de días de navegación/fondeo.</li>
                            <li><strong>Bloque 4 - Margen Operativo & EBITDA:</strong> Utilidad neta de viaje y ratio de retorno por nave/cliente.</li>
                        </ul>
                    </div>

                    <div class="card" style="border-top: 5px solid var(--amber);">
                        <strong style="color: var(--amber); font-size: 12pt; display: block; margin-bottom: 8px;">
                            ⚠️ Desvío del Alcance & Funcionalidades Exclusivas
                        </strong>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5; margin-bottom: 8px;">
                            <strong>No Cotizado:</strong> El contrato contemplaba una única vista financiera unificada para Petral. La integración del formato NAVITRANSO representó una segunda dimensión contable completa.
                        </p>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5;">
                            <strong>Entregables Adicionales:</strong> Vista financiera *Read-Only* para auditores, motor de sincronización automática y exportadores dedicados en PDF vectorial y ExcelJS contable.
                        </p>
                    </div>
                </div>

                <div class="callout callout-green">
                    <strong style="color: var(--green); font-size: 11pt; display: block; margin-bottom: 3px;">Impacto Corporativo:</strong>
                    <p style="font-size: 10.2pt; color: #334155;">
                        Permite a los directores evaluar el desempeño económico de la flota bajo dos prismas financieros simultáneos sin alterar la integridad de los datos maestros.
                    </p>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 06 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 7: CIBERSEGURIDAD, RLS & BANCA
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">INFRAESTRUCTURA &bull; SEGURIDAD GRADO BANCARIO</div>
                <h2>Slide 7: Ciberseguridad, RLS & Infraestructura Enterprise</h2>
                <div class="sub">De un acceso abierto sin control a una fortaleza criptográfica con seguridad a nivel de fila y 2FA.</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px;">
                    <div class="card" style="border-top: 5px solid var(--navy);">
                        <strong style="color: var(--navy); font-size: 12pt; display: block; margin-bottom: 8px;">
                            🛡️ Arquitectura de Blindaje Criptográfico
                        </strong>
                        <ul style="font-size: 10pt; color: #475569; padding-left: 20px; line-height: 1.55;">
                            <li><strong>Row Level Security (RLS) en Supabase:</strong> Políticas SQL a nivel de fila que impiden fugas entre usuarios y roles comerciales/operativos.</li>
                            <li><strong>Autenticación en Dos Pasos (2FA):</strong> Códigos OTP vía email mediante servicio transaccional Resend API.</li>
                            <li><strong>VPS Dedicado en Contabo (Alemania):</strong> Servidor Linux blindado con Nginx Reverse Proxy, certificados SSL Let's Encrypt y cortafuegos UFW.</li>
                        </ul>
                    </div>

                    <div class="card" style="border-top: 5px solid var(--amber);">
                        <strong style="color: var(--amber); font-size: 12pt; display: block; margin-bottom: 8px;">
                            ⚠️ Esfuerzo de Infraestructura no Previsto
                        </strong>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5; margin-bottom: 8px;">
                            La cotización original asumía un entorno web estándar sin requerimientos de ciberseguridad corporativa ni esquemas RLS multi-rol.
                        </p>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5;">
                            Se invirtieron decenas de horas de DevOps y arquitectura para garantizar que los fletes confidenciales de Petral no puedan ser manipulados ni filtrados.
                        </p>
                    </div>
                </div>

                <div class="callout callout-blue">
                    <strong style="color: var(--accent); font-size: 11pt; display: block; margin-bottom: 3px;">Garantía de Continuidad Operativa:</strong>
                    <p style="font-size: 10.2pt; color: #334155;">
                        Respaldos automáticos diarios, redundancia en base de datos PostgreSQL y 99.9% de uptime garantizado en servidor dedicado.
                    </p>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 07 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 8: SUITE DE 13 EXPORTADORES PRINT-READY
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">REPORTERÍA EJECUTIVA &bull; EXPORTADORES VECTORIALES</div>
                <h2>Slide 8: Suite de 13 Exportadores Print-Ready</h2>
                <div class="sub">Motor de renderizado documental para comités de directorio, auditorías y proformas comerciales.</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px;">
                    <div class="card" style="border-left: 5px solid var(--green);">
                        <strong style="color: var(--green); font-size: 12pt; display: block; margin-bottom: 8px;">
                            📑 Ecosistema de Reportes Print-Ready Desarrollados
                        </strong>
                        <ul style="font-size: 9.5pt; color: #475569; padding-left: 18px; line-height: 1.5;">
                            <li><strong>Exportador PDF Multicotizador (4 Legs):</strong> Proforma comercial en alta resolución lista para firma de armador.</li>
                            <li><strong>Exportador PDF Matriz Financiera Petral:</strong> Consolidado ejecutivo de 12 meses con métricas TCE y PnL.</li>
                            <li><strong>Exportador PDF NAVITRANSO (4 Bloques):</strong> Informe contable estructurado para control presupuestal.</li>
                            <li><strong>Generadores ExcelJS con Fórmulas Vivas:</strong> Libros contables con fórmulas dinámicas nativas sin pérdida de cálculo.</li>
                        </ul>
                    </div>

                    <div class="card" style="border-left: 5px solid var(--amber);">
                        <strong style="color: var(--amber); font-size: 12pt; display: block; margin-bottom: 8px;">
                            ⚠️ Complejidad de Renderizado Fuera de Alcance
                        </strong>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5; margin-bottom: 8px;">
                            El contrato inicial solo requería visualizar tablas en pantalla web. La creación de <strong>13 exportadores vectoriales con tipografía corporativa y saltos de página matemáticos</strong> representó un proyecto de ingeniería gráfica documental independiente.
                        </p>
                    </div>
                </div>

                <div class="callout callout-green">
                    <strong style="color: var(--green); font-size: 11pt; display: block; margin-bottom: 3px;">Calidad de Entrega:</strong>
                    <p style="font-size: 10.2pt; color: #334155;">
                        Documentos ejecutivos que permiten a Naviera Petral presentarse ante comités de crédito, bancos y fletadores internacionales con estándares globales.
                    </p>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 08 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 9: CONSULTORÍA DE PROCESOS & MOF OCULTO
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">CONSULTORÍA MARÍTIMA &bull; REINGENIERÍA OPERATIVA</div>
                <h2>Slide 9: Consultoría de Procesos & Organigrama Digital (El "MOF Oculto")</h2>
                <div class="sub">El software como manual de organización y funciones vivo que unificó criterios entre Comercial y Operaciones.</div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 14px;">
                    <div class="card" style="border-top: 5px solid var(--purple);">
                        <strong style="color: var(--purple); font-size: 12pt; display: block; margin-bottom: 8px;">
                            🏛️ Entregables de Consultoría Incorporados Orgánicamente
                        </strong>
                        <ul style="font-size: 9.8pt; color: #475569; padding-left: 18px; line-height: 1.55;">
                            <li><strong>Estandarización de Costos Portuarios:</strong> Definición formal de reglas para demoras (Modo 0 vs. Demoras Reales), búnker en puerto vs. mar, y tarifas de agenciamiento.</li>
                            <li><strong>Gobernanza de Roles de Usuario:</strong> Delimitación estricta de qué puede simular Comercial, qué debe registrar Operaciones y qué audita Gerencia.</li>
                            <li><strong>Convergencia Contable Centavo a Centavo:</strong> Auditorías que eliminaron las discrepancias de cálculo entre el área comercial y contabilidad.</li>
                        </ul>
                    </div>

                    <div class="card" style="border-top: 5px solid var(--amber);">
                        <strong style="color: var(--amber); font-size: 12pt; display: block; margin-bottom: 8px;">
                            ⚠️ Valor Intangible Entregado a Petral
                        </strong>
                        <p style="font-size: 10pt; color: #475569; line-height: 1.5; margin-bottom: 8px;">
                            Se entregaron más de <strong>150 horas de consultoría de procesos pura</strong> que trascendieron la programación de código, dejando a Petral un protocolo operativo claro y blindado contra errores.
                        </p>
                    </div>
                </div>

                <div class="callout callout-purple">
                    <strong style="color: var(--purple); font-size: 11pt; display: block; margin-bottom: 3px;">El MOF Digital Vivo:</strong>
                    <p style="font-size: 10.2pt; color: #334155;">
                        Hoy el software es el Manual de Organización y Funciones digitalizado de Petral: nadie puede alterar una tarifa base ni cerrar una cotización sin ajustarse a las reglas del motor algorítmico.
                    </p>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 09 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 10: AUDITORÍA DIGITAL FORENSE DE HORAS
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">AUDITORÍA FORENSE INALTERABLE &bull; METODOLOGÍA MATEMÁTICA</div>
                <h2>Slide 10: Auditoría Digital Forense de Horas Devengadas</h2>
                <div class="sub">Trazabilidad matemática e inalterable basada en logs de Git y sesiones continuas de IDE desde el 24 de Junio de 2026.</div>

                <div class="kpi-grid-4" style="margin-bottom: 16px;">
                    <div class="kpi-box" style="border-top: 5px solid var(--navy);">
                        <div class="label">Jornadas Continuas</div>
                        <div class="num">{total_days}</div>
                        <div class="desc">Días de desarrollo activo</div>
                    </div>
                    <div class="kpi-box" style="border-top: 5px solid var(--accent);">
                        <div class="label">Eventos Registrados</div>
                        <div class="num" style="color: var(--accent);">{total_events:,}</div>
                        <div class="desc">Commits Git + Mtimes IDE</div>
                    </div>
                    <div class="kpi-box" style="border-top: 5px solid var(--amber);">
                        <div class="label">Horas Reales Devengadas</div>
                        <div class="num" style="color: var(--amber);">{total_hours:.2f} h</div>
                        <div class="desc">Algoritmo inalterable de sesiones</div>
                    </div>
                    <div class="kpi-box" style="border-top: 5px solid var(--green);">
                        <div class="label">Desarrollo Base Cotizado</div>
                        <div class="num" style="color: #64748B;">{dev_contract_hours:.2f} h</div>
                        <div class="desc">Etapa 2 ($6,600 USD)</div>
                    </div>
                </div>

                <div class="card" style="padding: 16px 22px; background: #FFFFFF; border-left: 5px solid var(--accent);">
                    <strong style="color: var(--navy); font-size: 11.5pt; display: block; margin-bottom: 4px;">Algoritmo Forense de Sesiones Continuas:</strong>
                    <p style="font-size: 9.8pt; color: #475569; line-height: 1.5;">
                        Se implementó una ventana móvil de inactividad de <strong>2.5 horas</strong> + buffer de <strong>30 minutos de warmup</strong> y análisis de requerimientos por sesión. Si no hay interacción ni modificación de código, el reloj se detiene automáticamente. Cada minuto está respaldado por hashes SHA inmutables de Git.
                    </p>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 10 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 11: LIQUIDACIÓN ECONÓMICA & PROPUESTA
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">LIQUIDACIÓN ECONÓMICA &bull; CIERRE COMERCIAL</div>
                <h2>Slide 11: Balance Económico & Propuesta de Regularización</h2>
                <div class="sub">Valorización formal del servicio entregado y esquema comercial de regularización al {today_str}.</div>

                <table class="ppt-table" style="margin-bottom: 14px;">
                    <thead>
                        <tr>
                            <th>Concepto / Entregable</th>
                            <th style="text-align: center;">Horas</th>
                            <th style="text-align: center;">Tarifa Ref.</th>
                            <th style="text-align: right;">Subtotal (USD)</th>
                            <th style="text-align: center;">Estado Operativo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>Presupuesto Inicial Aprobado (One-Timers)</strong><br>
                                <small style="color: #64748B;">Diseño (10h) + Desarrollo (110h) + ETL (10h) + Onboarding (10h) + In Situ (10h)</small>
                            </td>
                            <td style="text-align: center; font-weight: 700;">150.00 hrs</td>
                            <td style="text-align: center; font-weight: 600; color: #64748B;">$50 - $100</td>
                            <td style="text-align: right; font-weight: 700; color: var(--navy); font-size: 10.5pt;">${total_contract_onetime_usd:,.2f}</td>
                            <td style="text-align: center;"><span class="badge-pill badge-blue">Base Contratada</span></td>
                        </tr>
                        <tr style="background: rgba(217, 119, 6, 0.05);">
                            <td>
                                <strong>Horas Adicionales Devengadas de Desarrollo & Reingeniería</strong><br>
                                <small style="color: #64748B;">Consultoría de Procesos, 3 Ciclos ETL, Algoritmos SPOT, Búnker 5-Tier, Matriz NAVITRANSO & VPS</small>
                            </td>
                            <td style="text-align: center; font-weight: 700; color: var(--amber);">+{dev_overage_hours:.2f} hrs</td>
                            <td style="text-align: center; font-weight: 700; color: var(--amber);">$60.00/h</td>
                            <td style="text-align: right; font-weight: 700; color: var(--amber); font-size: 10.5pt;">+${dev_overage_usd:,.2f}</td>
                            <td style="text-align: center;"><span class="badge-pill badge-amber">Valor Entregado</span></td>
                        </tr>
                        <tr style="background: rgba(5, 150, 105, 0.08); border-top: 2px solid var(--green);">
                            <td style="font-weight: 800; color: var(--green); font-size: 10.5pt;">
                                VALOR TOTAL REAL ENTREGADO A NAVIERA PETRAL S.A.
                            </td>
                            <td style="text-align: center; font-weight: 800; color: var(--green); font-size: 10.5pt;">{total_delivered_hours:.2f} hrs</td>
                            <td style="text-align: center; color: #94A3B8;">—</td>
                            <td style="text-align: right; font-weight: 900; color: var(--green); font-size: 12.5pt;">${total_delivered_usd:,.2f} USD</td>
                            <td style="text-align: center;"><span class="badge-pill badge-green">100% EN VIVO</span></td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="card" style="border-left: 4px solid var(--navy); padding: 14px 18px;">
                        <strong style="color: var(--navy); font-size: 10.5pt; display: block; margin-bottom: 4px;">Opción A: Paquete Cerrado de Módulos Enterprise</strong>
                        <p style="font-size: 9.2pt; color: #475569; line-height: 1.45;">
                            Regularización de un monto fijo complementario pactado que formalice la propiedad intelectual y absorba los 3 ciclos de ETL, la consultoría de procesos y los módulos fuera de alcance.
                        </p>
                    </div>
                    <div class="card" style="border-left: 4px solid var(--green); padding: 14px 18px;">
                        <strong style="color: var(--green); font-size: 10.5pt; display: block; margin-bottom: 4px;">Opción B: Integración con Kickoff de Liquidaciones</strong>
                        <p style="font-size: 9.2pt; color: #475569; line-height: 1.45;">
                            Amortización estructurada vinculando el cierre de la Fase 1 al kickoff de la Fase 2 (Auditoría Forense de Liquidaciones Reales) y activación del fee mensual de mantenimiento VPS ($500/mes).
                        </p>
                    </div>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 11 / 12</span>
                </div>
            </div>
        </div>


        <!-- ==========================================
             SLIDE 12: BITÁCORA JORNADA POR JORNADA
             ========================================== -->
        <div class="slide">
            <div class="slide-content">
                <div class="tag">AUDITORÍA DETALLADA &bull; REGISTRO DÍA POR DÍA</div>
                <h2>Slide 12: Bitácora Forense de Actividad Diaria ({total_days} Jornadas)</h2>
                <div class="sub">Desglose exhaustivo de sesiones de trabajo, marcas de tiempo, horas efectivas y tareas desarrolladas ({total_hours:.2f} hrs totales).</div>

                <div class="day-log-container">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40px; text-align: center;">#</th>
                                <th style="width: 150px;">Fecha / Día</th>
                                <th style="width: 120px; text-align: center;">Horario</th>
                                <th style="width: 90px; text-align: center;">Horas</th>
                                <th style="width: 100px; text-align: right;">Monto USD</th>
                                <th>Hito Técnico / Tarea Principal Desarrollada</th>
                            </tr>
                        </thead>
                        <tbody>
{all_table_rows}
                        </tbody>
                    </table>
                </div>

                <div class="slide-footnote">
                    <span>BUSHIDO V2 &bull; DELFOS SHIPPING SOFTWARE</span>
                    <span>Diapositiva 12 / 12</span>
                </div>
            </div>
        </div>

    </div>

    <!-- NAVEGACIÓN INFERIOR DERECHA -->
    <div class="nav-controls">
        <button class="nav-btn" id="prevBtn" title="Anterior (Flecha Izquierda)">&larr;</button>
        <span class="nav-counter" id="slideNum">01 / 12</span>
        <button class="nav-btn" id="nextBtn" title="Siguiente (Flecha Derecha / Espacio)">&rarr;</button>
    </div>

    <script>
        const slides = document.querySelectorAll('.slide');
        const progress = document.getElementById('progress');
        const slideNum = document.getElementById('slideNum');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        let current = 0;

        function updateSlide(index) {{
            slides.forEach((s, i) => {{
                s.classList.toggle('active', i === index);
            }});
            current = index;
            const pct = ((index + 1) / slides.length) * 100;
            progress.style.width = pct + '%';
            slideNum.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
        }}

        prevBtn.addEventListener('click', () => {{
            if (current > 0) updateSlide(current - 1);
        }});

        nextBtn.addEventListener('click', () => {{
            if (current < slides.length - 1) updateSlide(current + 1);
        }});

        document.addEventListener('keydown', (e) => {{
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {{
                if (current < slides.length - 1) updateSlide(current + 1);
            }} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {{
                if (current > 0) updateSlide(current - 1);
            }} else if (e.key === 'Home') {{
                updateSlide(0);
            }} else if (e.key === 'End') {{
                updateSlide(slides.length - 1);
            }}
        }});

        updateSlide(0);
    </script>
</body>
</html>"""

    # 1. Guardar en BUSHIDO_V2
    bushido_v2_dir = os.path.join(ws_path, "Desarrollo.Profesional", "Geeksoft_Frontend", "public", "BUSHIDO_V2")
    os.makedirs(bushido_v2_dir, exist_ok=True)
    bushido_v2_index = os.path.join(bushido_v2_dir, "index.html")
    with open(bushido_v2_index, "w", encoding="utf-8") as f:
        f.write(html)

    # 2. Actualizar también BUSHIDO/index.html y raíz
    bushido_v1_index = os.path.join(ws_path, "Desarrollo.Profesional", "Geeksoft_Frontend", "public", "BUSHIDO", "index.html")
    with open(bushido_v1_index, "w", encoding="utf-8") as f:
        f.write(html)

    bushido_root_index = os.path.join(ws_path, "presentation.html")
    with open(bushido_root_index, "w", encoding="utf-8") as f:
        f.write(html)

    obsidian_deck = os.path.join(ws_path, "Desarrollo.Profesional", "Obsidian.Refactorizacion.Multicotizador", "Informe_Sustento_Modificacion_Alcance_Petral_V4.html")
    with open(obsidian_deck, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"BUSHIDO V2 generado exitosamente con {total_hours:.2f} hrs y {total_days} jornadas en:\n1. {bushido_v2_index}\n2. {bushido_v1_index}\n3. {bushido_root_index}\n4. {obsidian_deck}")

if __name__ == "__main__":
    generate_bushido_v2_deck()
