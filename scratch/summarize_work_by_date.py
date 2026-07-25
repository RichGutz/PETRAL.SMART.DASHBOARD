import subprocess, os, sys
from datetime import datetime

# Set stdout encoding to utf-8 if possible
sys.stdout.reconfigure(encoding='utf-8')

ws = r'c:\Users\rguti\PETRAL.SMART.DASHBOARD'

# 1. Gather git commits with messages grouped by date
cmd = ['git', 'log', '--all', '--pretty=format:%ad|%s', '--date=short']
res = subprocess.run(cmd, capture_output=True, text=True, cwd=ws)

commits_by_date = {}
for line in res.stdout.strip().split('\n'):
    if not line:
        continue
    parts = line.split('|', 1)
    if len(parts) == 2:
        date_str, msg = parts[0], parts[1]
        if date_str not in commits_by_date:
            commits_by_date[date_str] = []
        commits_by_date[date_str].append(msg)

# Also check interaction_log.txt and gemini_work_log.txt
interaction_log_path = os.path.join(ws, 'interaction_log.txt')
gemini_log_path = os.path.join(ws, 'gemini_work_log.txt')

logs_by_date = {}

for path in [interaction_log_path, gemini_log_path]:
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            curr_date = None
            for line in f:
                line_str = line.strip()
                if 'Fecha:' in line_str:
                    import re
                    m = re.search(r'2026-\d{2}-\d{2}', line_str)
                    if m:
                        curr_date = m.group(0)
                elif curr_date and line_str.startswith('- '):
                    if curr_date not in logs_by_date:
                        logs_by_date[curr_date] = []
                    logs_by_date[curr_date].append(line_str[2:])

all_dates = sorted(set(list(commits_by_date.keys()) + list(logs_by_date.keys())))

print("=" * 80)
print("       RESUMEN DE TAREAS Y LOGROS REALIZADOS POR FECHA DE TRABAJO")
print("=" * 80)

for d in all_dates:
    if d < '2026-06-25':
        continue
    print(f"\n--- FECHA: {d} ---")
    
    seen = set()
    
    # Print Git commit milestones
    if d in commits_by_date:
        print("  [Commits y Cambios de Codigo]")
        for msg in commits_by_date[d]:
            if msg not in seen:
                seen.add(msg)
                print(f"   * {msg}")
                
    # Print Interaction logs
    if d in logs_by_date:
        print("  [Bitacora de Desarrollo / Hitos]")
        for log_entry in logs_by_date[d]:
            if log_entry not in seen:
                seen.add(log_entry)
                print(f"   * {log_entry}")

print("\n" + "=" * 80)
