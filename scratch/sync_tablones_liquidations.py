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

tablones_data = [
    {"code": "v.038", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "tce": 20410, "gross": 271394.00, "profit": 32096.00},
    {"code": "v.039", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "tce": 28066, "gross": 274677.00, "profit": 77955.00},
    {"code": "v.040", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MARCONA", "tce": 37643, "gross": 297998.00, "profit": 127668.00},
    {"code": "v.041", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MATARANI", "tce": 30167, "gross": 235654.00, "profit": 85544.00},
    {"code": "v.042", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "tce": 28793, "gross": 274919.00, "profit": 82321.00},
    {"code": "v.043", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "tce": 23929, "gross": 298325.00, "profit": 56195.00},
    {"code": "v.044", "vessel": "B/T TABLONES", "client": "NEXA", "pol": "CALLAO", "pod": "MATARANI", "tce": 37955, "gross": 349018.00, "profit": 163725.00},
    {"code": "v.045", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MATARANI", "tce": 30705, "gross": 241783.00, "profit": 90121.00},
    {"code": "v.046", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MARCONA", "tce": 36615, "gross": 287084.00, "profit": 119993.00},
    {"code": "v.047", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MARCONA", "tce": 36225, "gross": 278695.00, "profit": 113817.00},
    {"code": "v.048", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "tce": 26522, "gross": 266488.00, "profit": 68824.00},
    {"code": "v.049", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "tce": 26815, "gross": 268879.00, "profit": 70875.00},
    {"code": "v.050", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MARCONA", "tce": 39577, "gross": 300717.00, "profit": 134596.00},
    {"code": "v.051", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "tce": 27802, "gross": 287899.00, "profit": 77380.00},
    {"code": "v.052", "vessel": "B/T TABLONES", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "tce": 27821, "gross": 290879.00, "profit": 77881.00}
]

success_count = 0
for row in tablones_data:
    url = f"{url_base}/rest/v1/voyage_liquidations?voyage_code=ilike.*{row['code']}*"
    payload = {
        'vessel_name': row['vessel'],
        'client_name': row['client'],
        'gross_revenue_usd': row['gross'],
        'net_profit_usd': row['profit'],
        'tce_usd_day': row['tce'],
        'pol_port': row['pol'],
        'pod_port': row['pod']
    }
    r = requests.patch(url, headers=headers, json=payload)
    if r.status_code == 200:
        success_count += 1
        print(f"Viaje {row['code']}: OK (Gross: ${row['gross']:.2f}, Profit: ${row['profit']:.2f})")
    else:
        print(f"Viaje {row['code']}: ERROR {r.status_code}")

print(f"\nSincronizados exitosamente {success_count} de {len(tablones_data)} viajes del B/T Tablones en Supabase.")
