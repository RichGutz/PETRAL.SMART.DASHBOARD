import requests

env_path = 'C:/Users/rguti/PETRAL.SMART.DASHBOARD/Desarrollo.Profesional/Geeksoft_Engine/.env'
key = ""
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('SUPABASE_ANON_KEY='):
            key = line.strip().split('=', 1)[1].strip('"\'')

url = 'https://lskedhyosfwrwsqskymf.supabase.co/rest/v1/voyage_liquidations_real?voyage_code=ilike.*764*'
headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

payload = {
    'gross_revenue_usd': 13460,
    'net_profit_usd': -10004
}

r = requests.patch(url, headers=headers, json=payload)
print("PATCH Response:", r.status_code, r.text)
