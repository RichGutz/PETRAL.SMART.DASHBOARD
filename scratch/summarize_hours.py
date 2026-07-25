import subprocess
import re
from datetime import datetime

def parse_git_commits():
    cmd = ['git', 'log', '--pretty=format:%h|%ad|%an|%s', '--date=iso']
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=r"c:\Users\rguti\PETRAL.SMART.DASHBOARD")
    lines = result.stdout.strip().split('\n')
    
    commits_by_date = {}
    for line in lines:
        if not line:
            continue
        parts = line.split('|')
        if len(parts) < 4:
            continue
        hash_val, date_str, author, msg = parts[0], parts[1], parts[2], parts[3]
        dt = datetime.strptime(date_str[:19], '%Y-%m-%d %H:%M:%S')
        day_str = dt.strftime('%Y-%m-%d')
        
        if day_str not in commits_by_date:
            commits_by_date[day_str] = []
        commits_by_date[day_str].append(dt)
        
    return commits_by_date

def calculate_hours_per_day(commits_by_date):
    summary = {}
    total_hours_project = 0.0
    
    for day in sorted(commits_by_date.keys()):
        timestamps = sorted(commits_by_date[day])
        # Algoritmo de agrupación de sesiones:
        # Pausas de más de 2 horas se consideran descansos/interrupciones.
        # A cada bloque continuo se le agrega 30 min (0.5h) de buffer por análisis/diseño previo.
        sessions = []
        curr_start = timestamps[0]
        curr_end = timestamps[0]
        
        for t in timestamps[1:]:
            if (t - curr_end).total_seconds() <= 7200: # Umbral de 2 horas
                curr_end = t
            else:
                sessions.append((curr_start, curr_end))
                curr_start = t
                curr_end = t
        sessions.append((curr_start, curr_end))
        
        day_total_sec = 0
        for s_start, s_end in sessions:
            sec = (s_end - s_start).total_seconds()
            sec += 1800 # Buffer de 30 mins por sesión de trabajo activa
            day_total_sec += sec
            
        hours = day_total_sec / 3600.0
        summary[day] = {
            'commit_count': len(timestamps),
            'first_commit': timestamps[0].strftime('%H:%M'),
            'last_commit': timestamps[-1].strftime('%H:%M'),
            'hours': round(hours, 2)
        }
        total_hours_project += hours
        
    return summary, round(total_hours_project, 2)

def main():
    commits_by_date = parse_git_commits()
    summary, total_hours = calculate_hours_per_day(commits_by_date)
    
    print("=" * 78)
    print("      RESUMEN DE HORAS DEDICADAS AL PROYECTO PETRAL SMART DASHBOARD")
    print("=" * 78)
    print(f"{'N°':<3} | {'FECHA':<12} | {'COMMITS':<8} | {'HORA INICIO':<12} | {'HORA FIN':<10} | {'HORAS DEDICADAS':<15}")
    print("-" * 78)
    
    for idx, (day, info) in enumerate(summary.items(), start=1):
        print(f"{idx:<3} | {day:<12} | {info['commit_count']:<8} | {info['first_commit']:<12} | {info['last_commit']:<10} | {info['hours']:>6.2f} hrs")
        
    print("-" * 78)
    print(f" TOTAL GENERAL ACUMULADO HASTA LA FECHA: {total_hours:.2f} HORAS")
    print("=" * 78)

if __name__ == '__main__':
    main()

