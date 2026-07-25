import os, subprocess, json
from datetime import datetime

ws = r'c:\Users\rguti\PETRAL.SMART.DASHBOARD'
day_activity = {}

def record_activity(day_str, dt):
    if day_str not in day_activity:
        day_activity[day_str] = []
    day_activity[day_str].append(dt)

# 1. Commits git
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

# 2. File modification dates
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
    
    commits_text = "; ".join([c.split(' ', 1)[1] for c in git_by_date.get(day, [])[:2]]) if day in git_by_date else "Trabajo en archivos / diseño"
    if len(commits_text) > 85:
        commits_text = commits_text[:82] + "..."
        
    summary.append({
        'num': idx,
        'day': day,
        'events': len(timestamps),
        'start': timestamps[0].strftime('%H:%M'),
        'end': timestamps[-1].strftime('%H:%M'),
        'hours': round(hours, 2),
        'tasks': commits_text
    })

def main():
    print("=" * 115)
    print("      RESUMEN MAESTRO DE HORAS Y TAREAS REALIZADAS (TOTALIZADO EN LA ÚLTIMA FILA)")
    print("=" * 115)
    print(f"{'N°':<3} | {'FECHA':<10} | {'EVENTOS':<7} | {'INICIO':<6} | {'FIN':<6} | {'HORAS REALES':<12} | {'LOGROS Y TAREAS PRINCIPALES':<50}")
    print("-" * 115)
    
    for item in summary:
        print(f"{item['num']:<3} | {item['day']:<10} | {item['events']:<7} | {item['start']:<6} | {item['end']:<6} | {item['hours']:>8.2f} hrs | {item['tasks']:<50}")
        
    print("=" * 115)
    print(f"{'TOTAL':<3} | {'27 DÍAS':<10} | {total_events_project:<7} | {'--':<6} | {'--':<6} | {total_hours_project:>8.2f} hrs | {'PROYECTO COMPLETO PETRAL SMART DASHBOARD':<50}")
    print("=" * 115)

if __name__ == '__main__':
    main()
