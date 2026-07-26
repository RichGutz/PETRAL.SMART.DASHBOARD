import os
import requests
import json

SUPABASE_URL = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

headers = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

# Leer las sentencias procesadas del script ETL
from etl_parser_liquidations import parse_jn_sheet, parse_mec_sheet
import openpyxl

file_jn = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Documentos.Petral\Resultados.JN\VC Tablones 2026.xlsx'
file_mec = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Documentos.Petral\Resultados.MEC\MOQUEGUA - Voyage calculation viajes Enero a Junio  2026.xlsx'

def main():
    records = []
    wb_jn = openpyxl.load_workbook(file_jn, data_only=True)
    for sh in wb_jn.sheetnames:
        if sh != 'RESUMEN' and ('v.' in sh.lower() or 'tablones' in sh.lower()):
            try:
                rec = parse_jn_sheet(wb_jn, sh)
                if rec:
                    # Convert json string back to dict for REST payload
                    rec['stops'] = json.loads(rec['stops'])
                    rec['details'] = json.loads(rec['details'])
                    records.append(rec)
            except Exception as e:
                pass

    wb_mec = openpyxl.load_workbook(file_mec, data_only=True)
    for sh in wb_mec.sheetnames:
        if 'resumen' not in sh.lower() and ('v.' in sh.lower() or 'moquegua' in sh.lower() or 'matarani' in sh.lower()):
            try:
                rec = parse_mec_sheet(wb_mec, sh)
                if rec:
                    rec['stops'] = json.loads(rec['stops'])
                    rec['details'] = json.loads(rec['details'])
                    records.append(rec)
            except Exception as e:
                pass

    print(f"Insertando {len(records)} registros en la tabla 'voyage_liquidations' de Supabase...")
    
    url = f"{SUPABASE_URL}/rest/v1/voyage_liquidations"
    res = requests.post(url, headers=headers, json=records)
    
    if res.status_code in [200, 201]:
        print(f"✅ ÉXITO TOTAL: Se insertaron los {len(records)} viajes correctamente en Supabase!")
    else:
        print(f"Respuesta Supabase [{res.status_code}]: {res.text}")

if __name__ == '__main__':
    main()
