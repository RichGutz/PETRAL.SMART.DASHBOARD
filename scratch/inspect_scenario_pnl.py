import sqlite3
import glob
import os
import json

db_path = os.path.join("c:\\Users\\rguti\\PETRAL.SMART.DASHBOARD", "Desarrollo.Profesional", "Geeksoft_Engine", "backend", "database", "petral_forecast.db")
if not os.path.exists(db_path):
    dbs = glob.glob("c:\\Users\\rguti\\PETRAL.SMART.DASHBOARD\\**\\*.db", recursive=True)
    print("Found DBs:", dbs)
    db_path = dbs[0] if dbs else None

print("Using DB:", db_path)
if db_path:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check scenarios
    try:
        cursor.execute("SELECT * FROM scenarios")
        scenarios = cursor.fetchall()
        print(f"\n--- SCENARIOS ({len(scenarios)}) ---")
        for s in scenarios:
            print(dict(s))
    except Exception as e:
        print("Error reading scenarios:", e)
        
    # Check quotes / multicotizador
    try:
        cursor.execute("SELECT id, route_name, vessel_type, total_cargo_tons, hire_total, bunker_total, ports_total, gross_revenue, net_revenue, voyage_result, voyage_duration_days FROM multicotizador_quotes")
        quotes = cursor.fetchall()
        print(f"\n--- MULTICOTIZADOR QUOTES ({len(quotes)}) ---")
        for q in quotes:
            print(dict(q))
    except Exception as e:
        print("Error reading quotes:", e)

    # Check contracts
    try:
        cursor.execute("SELECT * FROM contracts")
        contracts = cursor.fetchall()
        print(f"\n--- CONTRACTS ({len(contracts)}) ---")
        for c in contracts:
            print(dict(c))
    except Exception as e:
        print("Error reading contracts:", e)
