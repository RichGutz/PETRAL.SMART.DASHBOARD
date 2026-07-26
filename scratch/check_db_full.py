import requests

env_path = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/.env'
key = ""
url_base = ""
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
            key = line.strip().split('=', 1)[1].strip('"\'')
        elif line.startswith('SUPABASE_URL='):
            url_base = line.strip().split('=', 1)[1].strip('"\'')

url = f"{url_base}/rest/v1/voyage_liquidations?select=*"
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

r = requests.get(url, headers=headers)
data = r.json()

print(f"Total registros devueltos por Supabase: {len(data)}")
for i, item in enumerate(data):
    print(f"{i+1}. Code: {item.get('voyage_code')} | Vessel: {item.get('vessel_name')} | Date: {item.get('voyage_date')} | Gross: {item.get('gross_revenue_usd')} | NetProfit: {item.get('net_profit_usd')}")
