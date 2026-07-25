import json, os, subprocess
from datetime import datetime

ws = r'c:\Users\rguti\PETRAL.SMART.DASHBOARD'

# Load git commits
with open(os.path.join(ws, 'scratch', 'all_commits_by_date.json'), 'r', encoding='utf-8') as f:
    git_commits = json.load(f)

# Load file activities per date
day_files = {}
valid_exts = ('.py', '.tsx', '.ts', '.md', '.sql', '.html', '.json', '.png', '.svg', '.txt', '.pdf')
ignore_dirs = {'node_modules', '.git', 'dist', '.vite', '.vscode', '.obsidian'}

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
                    if day_str not in day_files:
                        day_files[day_str] = []
                    rel_path = os.path.relpath(path, ws)
                    day_files[day_str].append(f"{dt.strftime('%H:%M')} - {rel_path}")
            except:
                pass

all_dates = sorted(set(list(git_commits.keys()) + list(day_files.keys())))

output_md = []
output_md.append("# BITÁCORA DETALLADA DÍA POR DÍA DEL PROYECTO PETRAL SMART DASHBOARD\n")

for d in all_dates:
    output_md.append(f"### 📅 FECHA: {d}")
    
    # Git commits for this date
    if d in git_commits:
        output_md.append("#### 📌 Commits en Git:")
        for c in git_commits[d]:
            output_md.append(f"- {c}")
    else:
        output_md.append("#### 📌 Commits en Git: *(Sin commits directos, trabajo conceptual/diseño/archivos)*")
        
    # Key files modified on this date
    if d in day_files:
        output_md.append("#### 📁 Archivos Clave Modificados / Creados:")
        files_sample = day_files[d][:8] # top 8
        for f in files_sample:
            output_md.append(f"- `{f}`")
        if len(day_files[d]) > 8:
            output_md.append(f"- *(... y {len(day_files[d]) - 8} archivos más)*")
            
    output_md.append("\n---\n")

report_content = "\n".join(output_md)
with open(os.path.join(ws, 'scratch', 'bitacora_dia_por_dia.md'), 'w', encoding='utf-8') as f:
    f.write(report_content)

print(f"Report generated with {len(all_dates)} days in scratch/bitacora_dia_por_dia.md")
