import os, glob
from datetime import datetime

ws = r'c:\Users\rguti\PETRAL.SMART.DASHBOARD'
file_times = []

for root, dirs, files in os.walk(ws):
    if 'node_modules' in root or '.git' in root or 'dist' in root or '.vite' in root:
        continue
    for f in files:
        path = os.path.join(root, f)
        try:
            mtime = os.path.getmtime(path)
            dt = datetime.fromtimestamp(mtime)
            if dt.strftime('%Y-%m-%d') == '2026-07-24':
                file_times.append((dt, path))
        except:
            pass

file_times.sort(key=lambda x: x[0])
print(f'Total archivos modificados el 2026-07-24: {len(file_times)}')
if file_times:
    print(f'Primer archivo modificado: {file_times[0][0].strftime("%H:%M:%S")} -> {file_times[0][1]}')
    print(f'Último archivo modificado: {file_times[-1][0].strftime("%H:%M:%S")} -> {file_times[-1][1]}')
    print("\n--- Muestra de archivos y horas ---")
    for dt, path in file_times[::max(1, len(file_times)//20)]:
        print(f'{dt.strftime("%H:%M:%S")} | {path}')
