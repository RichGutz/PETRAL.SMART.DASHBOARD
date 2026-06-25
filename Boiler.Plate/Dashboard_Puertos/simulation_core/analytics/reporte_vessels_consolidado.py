import os
from dotenv import load_dotenv
from supabase import create_client, Client
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

MESES = {
    1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL",
    5: "MAYO", 6: "JUNIO", 7: "JULIO", 8: "AGOSTO",
    9: "SETIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
}

def format_date_custom(date_str):
    if not date_str or date_str == 'N/A': return 'N/A'
    dt = datetime.strptime(date_str[:10], "%Y-%m-%d")
    return f"{dt.year} {MESES[dt.month]} {dt.day:02d}"

def normalize_due(due_str):
    if not due_str or due_str == '0': return None
    # Ejemplo: CLL-2026-00239 -> 239
    try:
        parts = due_str.split('-')
        return f"{parts[0]}-{parts[1]}-{int(parts[2])}"
    except:
        return due_str

def generate_vessel_report():
    try:
        # Extraer toda la data de APM Callao (Buque tanque)
        response = supabase.table("port_arrivals")\
            .select("ship_name, arrival_eta, agency, ship_type, length, beam, ship_due")\
            .eq("port_name", "Callao")\
            .ilike("ship_type", "%Buque tanque%")\
            .ilike("terminal", "%APM%")\
            .execute()
        
        data = response.data
        if not data:
            print("No hay datos para procesar.")
            return

        # Agrupar por buque
        report = {}
        for r in data:
            name = r['ship_name']
            due = normalize_due(r['ship_due']) or r['arrival_eta'][:10]
            if name not in report:
                report[name] = {
                    'voyages': set(),
                    'first': None,
                    'last': None,
                    'type': r['ship_type'],
                    'dims': f"{r['length']}x{r['beam']}" if r['length'] else "N/A",
                    'agencies': []
                }
            
            report[name]['voyages'].add(due)
            if r['arrival_eta']:
                eta = r['arrival_eta'][:10]
                if not report[name]['first'] or eta < report[name]['first']:
                    report[name]['first'] = eta
                if not report[name]['last'] or eta > report[name]['last']:
                    report[name]['last'] = eta
            
            if r['agency']:
                report[name]['agencies'].append(r['agency'])

        # Consolidar agencias (la más frecuente)
        for name in report:
            agencies = report[name]['agencies']
            if agencies:
                report[name]['main_agency'] = max(set(agencies), key=agencies.count)
            else:
                report[name]['main_agency'] = "N/A"

        # Ordenar: BOW primero, luego el resto alfabéticamente
        sorted_names = sorted(report.keys(), key=lambda x: (not x.startswith('BOW'), x))

        # Imprimir Reporte
        print(f"\n{'BUQUE':<25} | {'ARRIBOS':<8} | {'PRIMER ING.':<12} | {'ÚLTIMO ING.':<12} | {'DIMENSIONES':<12} | {'AGENCIA PRINCIPAL'}")
        print("-" * 110)
        
        for name in sorted_names:
            v = report[name]
            f_first = format_date_custom(v['first'])
            f_last = format_date_custom(v['last'])
            print(f"{name:<25} | {len(v['voyages']):<8} | {f_first:<15} | {f_last:<15} | {v['dims']:<12} | {v['main_agency']}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_vessel_report()
