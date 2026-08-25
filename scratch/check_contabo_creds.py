import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

diag_path = r"C:\Users\rguti\APEFAC\scripts\diagnose_vps_health.py"
with open(diag_path, 'r', encoding='utf-8') as f:
    for line in f:
        if any(k in line for k in ['HOST', 'USER', 'PASS', 'PORT', 'connect']):
            print(line.rstrip())
