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

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# 1. ACTUALIZAR VIAJE 765
url_765 = f"{url_base}/rest/v1/voyage_liquidations?voyage_code=ilike.*765*"
payload_765 = {
    'gross_revenue_usd': 267591.35,
    'net_profit_usd': 48835.00,
    'tce_usd_day': 20934.00,
    'cargo_quantity_mt': 13487.47,
    'freight_rate_usd': 19.84,
    'details': {
        'vessel_header': {'vessel_name': 'B/T MOQUEGUA', 'prepared_by': 'MEC'},
        'port_expenses': {
            'load_port_ilo_usd': 17955.00,
            'disch_port_mejillones_usd': 37831.00,
            'disch_port_terquim_usd': 66020.00,
            'total_agency_usd': 121806.00
        }
    }
}
r1 = requests.patch(url_765, headers=headers, json=payload_765)
print("V.765 Response:", r1.status_code, r1.text[:200])

# 2. ACTUALIZAR VIAJE 767
url_767 = f"{url_base}/rest/v1/voyage_liquidations?voyage_code=ilike.*767*"
payload_767 = {
    'gross_revenue_usd': 267145.16,
    'net_profit_usd': 80290.00,
    'tce_usd_day': 26055.00,
    'cargo_quantity_mt': 13461.98,
    'freight_rate_usd': 19.81,
    'details': {
        'vessel_header': {'vessel_name': 'B/T MOQUEGUA', 'prepared_by': 'MEC'},
        'port_expenses': {
            'load_port_ilo_usd': 18569.00,
            'disch_port_mejillones_usd': 40593.00,
            'disch_port_terquim_usd': 30813.00,
            'total_agency_usd': 89975.00
        }
    }
}
r2 = requests.patch(url_767, headers=headers, json=payload_767)
print("V.767 Response:", r2.status_code, r2.text[:200])
