with open(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\supabase\migrations\20260702000001_port_costs_migration.sql", "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in lines:
    if "MOQUEGUA" in line:
        print(line.strip())
