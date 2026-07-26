import requests

env_path = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/.env'
key = ""
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('SUPABASE_ANON_KEY='):
            key = line.strip().split('=', 1)[1].strip('"\'')

url = 'https://lskedhyosfwrwsqskymf.supabase.co/rest/v1/voyage_liquidations_real?select=*'
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

r = requests.get(url, headers=headers)
data = r.json()

for row in data:
    code = str(row.get('voyage_code', '')).upper()
    vname = str(row.get('vessel_name', '')).upper()
    if '764' in code or ('764' in code and 'MOQUEGUA' in vname):
        print("=== VIAJE 764 DETECTADO ===")
        print(f"Code: {row.get('voyage_code')}")
        print(f"Vessel: {row.get('vessel_name')}")
        print(f"Client: {row.get('client_name')}")
        print(f"Gross Revenue: {row.get('gross_revenue_usd')}")
        print(f"Net Profit: {row.get('net_profit_usd')}")
        print(f"TCE: {row.get('tce_usd_day')}")
        print("Details:", row.get('details'))
