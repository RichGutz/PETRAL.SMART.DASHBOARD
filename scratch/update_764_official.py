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

url = f"{url_base}/rest/v1/voyage_liquidations?voyage_code=ilike.*764*"
headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

payload = {
    'gross_revenue_usd': 409725.02,
    'net_profit_usd': 203475.00,
    'tce_usd_day': 39836.00,
    'cargo_quantity_mt': 13460.39,
    'freight_rate_usd': 30.44
}

r = requests.patch(url, headers=headers, json=payload)
print("PATCH Response:", r.status_code, r.text)
