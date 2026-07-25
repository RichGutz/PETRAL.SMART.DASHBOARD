import os, subprocess, json
from datetime import datetime

ws = r'c:\Users\rguti\PETRAL.SMART.DASHBOARD'
day_activity = {}

def record_activity(day_str, dt):
    if day_str not in day_activity:
        day_activity[day_str] = []
    day_activity[day_str].append(dt)

cmd = ['git', 'log', '--all', '--pretty=format:%ad|%h|%s', '--date=iso']
res = subprocess.run(cmd, capture_output=True, text=True, cwd=ws)

git_by_date = {}
for line in res.stdout.strip().split('\n'):
    if line:
        parts = line.split('|', 2)
        if len(parts) == 3:
            dt = datetime.strptime(parts[0][:19], '%Y-%m-%d %H:%M:%S')
            day_str = dt.strftime('%Y-%m-%d')
            record_activity(day_str, dt)
            if day_str not in git_by_date:
                git_by_date[day_str] = []
            git_by_date[day_str].append(f"[{parts[1]}] {parts[2]}")

valid_exts = ('.py', '.tsx', '.ts', '.md', '.sql', '.html', '.json', '.png', '.svg', '.txt', '.pdf')
ignore_dirs = {'node_modules', '.git', 'dist', '.vite', '.vscode', '.obsidian'}

day_files = {}

for root, dirs, files in os.walk(ws):
    dirs[:] = [d for d in dirs if d not in ignore_dirs]
    for f in files:
        if f.endswith(valid_exts):
            path = os.path.join(root, f)
            try:
                mtime = os.path.getmtime(path)
                dt = datetime.fromtimestamp(mtime)
                day_str = dt.strftime('%Y-%m-%d')
                if day_str >= '2026-06-25':
                    record_activity(day_str, dt)
                    if day_str not in day_files:
                        day_files[day_str] = []
                    rel = os.path.relpath(path, ws)
                    day_files[day_str].append(f"{dt.strftime('%H:%M')} - {rel}")
            except:
                pass

summary = []
total_hours_project = 0.0
total_events_project = 0

for idx, day in enumerate(sorted(day_activity.keys()), start=1):
    timestamps = sorted(day_activity[day])
    sessions = []
    curr_start = timestamps[0]
    curr_end = timestamps[0]
    
    for t in timestamps[1:]:
        if (t - curr_end).total_seconds() <= 9000:
            curr_end = t
        else:
            sessions.append((curr_start, curr_end))
            curr_start = t
            curr_end = t
    sessions.append((curr_start, curr_end))
    
    day_sec = 0
    for s_start, s_end in sessions:
        sec = (s_end - s_start).total_seconds()
        sec += 1800
        day_sec += sec
        
    hours = day_sec / 3600.0
    total_hours_project += hours
    total_events_project += len(timestamps)
    
    summary.append({
        'num': idx,
        'day': day,
        'events': len(timestamps),
        'start': timestamps[0].strftime('%H:%M'),
        'end': timestamps[-1].strftime('%H:%M'),
        'hours': round(hours, 2),
        'commits': git_by_date.get(day, []),
        'files': day_files.get(day, [])
    })

# Format Obsidian Markdown document with prominent script links callout
report_lines = []
report_lines.append("# 📊 BITÁCORA MAESTRA DE DESARROLLO: CONSOLIDADO DE HORAS Y TAREAS DÍA POR DÍA\n")
report_lines.append("> [!IMPORTANT]")
report_lines.append("> **SCRIPTS OFICIALES DE AUDITORÍA Y GENERACIÓN DE ESTE REPORTE:**")
report_lines.append(f"> 1. **Script de Consola Terminal (Consolidado y Totalizado)**:  ")
report_lines.append(f">    `python c:\\Users\\rguti\\PETRAL.SMART.DASHBOARD\\scratch\\summarize_real_hours.py`")
report_lines.append(f"> 2. **Script Generador de la Nota Obsidian (Auto-Actualización MD)**:  ")
report_lines.append(f">    `python c:\\Users\\rguti\\PETRAL.SMART.DASHBOARD\\scratch\\build_master_mix.py`  \n")

report_lines.append(f"- **Proyecto**: PETRAL SMART DASHBOARD")
report_lines.append(f"- **Total Acumulado**: **{total_hours_project:.2f} Horas Reales**")
report_lines.append(f"- **Jornadas Activas de Desarrollo**: {len(summary)} Días")
report_lines.append(f"- **Metodología de Auditoría**: Trazabilidad Dual (Git Log Commits + Marcas de Tiempo de Modificación Física de Archivos)  \n")
report_lines.append("---  \n")

report_lines.append("## 📈 Matriz Consolidada de Horas y Tareas por Jornada\n")
report_lines.append("| N° | Fecha | Eventos | Hora Inicio | Hora Fin | Horas Reales | Tareas Clave y Logros Principales |")
report_lines.append("| :-: | :--- | :-: | :-: | :-: | :-: | :--- |")

for item in summary:
    commits_summary = "; ".join([c.split(' ', 1)[1] for c in item['commits'][:3]]) if item['commits'] else "Edición de archivos / tareas conceptuales"
    report_lines.append(f"| {item['num']} | `{item['day']}` | {item['events']} | {item['start']} | {item['end']} | **{item['hours']:.2f} hrs** | {commits_summary} |")

# Add the TOTAL ROW at the very bottom of the table
report_lines.append(f"| **TOTAL** | **{len(summary)} DÍAS** | **{total_events_project}** | **--** | **--** | **{total_hours_project:.2f} HORAS** | **PROYECTO COMPLETO PETRAL SMART DASHBOARD** |")

report_lines.append("\n---\n")

report_lines.append("## 📝 Desglose Detallado Jornada por Jornada\n")

for item in summary:
    report_lines.append(f"### 📅 Jornada {item['num']}: `{item['day']}` (⏱️ **{item['hours']:.2f} hrs** | 🕒 {item['start']} - {item['end']} | 📑 {item['events']} eventos)")
    
    if item['commits']:
        report_lines.append("  - **📌 Commits Realizados:**")
        for c in item['commits']:
            report_lines.append(f"    - {c}")
    else:
        report_lines.append("  - **📌 Trabajo Conceptual / Diseño:** Modificación directa de archivos de configuración, notas y scripts")
        
    if item['files']:
        report_lines.append("  - **📁 Archivos Clave Modificados:**")
        for f in item['files'][:5]:
            report_lines.append(f"    - `{f}`")
        if len(item['files']) > 5:
            report_lines.append(f"    - *(y {len(item['files']) - 5} archivos más)*")
            
    report_lines.append("")

doc_path = r'c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\03_Bitacoras_de_Desarrollo\Secuencia.Desarrollo.Horas.Totales.md'
with open(doc_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(report_lines))

print(f"Secuencia.Desarrollo.Horas.Totales.md updated with scripts callout block. Total hours: {total_hours_project:.2f} hrs.")
