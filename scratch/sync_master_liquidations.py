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

master_data = [
    {"code": "761", "client": "SPCC", "pol": "ILO", "pod": "MATARANI", "gross": 197159.69, "profit": 89730.00, "tce": 39717.00, "tm": 10252.71, "rate": 19.23, "port_load": 16758, "port_disch": 34841},
    {"code": "762", "client": "SPCC", "pol": "ILO", "pod": "MARCONA", "gross": 277940.80, "profit": 130700.00, "tce": 37652.00, "tm": 12502.96, "rate": 22.23, "port_load": 16306, "port_disch": 33371},
    {"code": "763", "client": "NEXA", "pol": "CALLAO", "pod": "MARCONA", "gross": 330756.10, "profit": 139983.00, "tce": 31923.00, "tm": 13500.25, "rate": 24.50, "port_load": 14149, "port_disch": 33371},
    {"code": "764", "client": "SPCC", "pol": "ILO", "pod": "CALLAO/MARCONA", "gross": 409725.02, "profit": 203475.00, "tce": 39836.00, "tm": 13460.39, "rate": 30.44, "port_load": 16373, "port_disch": 44015},
    {"code": "765", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES/TERQUIM", "gross": 267591.35, "profit": 48835.00, "tce": 20934.00, "tm": 13487.47, "rate": 19.84, "port_load": 17955, "port_disch": 103851},
    {"code": "766", "client": "SPCC", "pol": "ILO", "pod": "MARCONA", "gross": 294240.65, "profit": 143578.00, "tce": 39076.00, "tm": 13503.47, "rate": 21.79, "port_load": 17495, "port_disch": 33369},
    {"code": "767", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES/TERQUIM", "gross": 267145.16, "profit": 80290.00, "tce": 26055.00, "tm": 13464.98, "rate": 19.84, "port_load": 18569, "port_disch": 71406},
    {"code": "768", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "gross": 267836.29, "profit": 93703.00, "tce": 28915.00, "tm": 13499.81, "rate": 19.84, "port_load": 19249, "port_disch": 43970},
    {"code": "769", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "gross": 260508.37, "profit": 87722.00, "tce": 27914.00, "tm": 13469.93, "rate": 19.84, "port_load": 21000, "port_disch": 43466},
    {"code": "770", "client": "SPCC", "pol": "ILO", "pod": "MARCONA", "gross": 287407.29, "profit": 134632.00, "tce": 37455.00, "tm": 13499.64, "rate": 21.79, "port_load": 19471, "port_disch": 33517},
    {"code": "771", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "gross": 274632.07, "profit": 88824.00, "tce": 28095.00, "tm": 13482.18, "rate": 20.87, "port_load": 19816, "port_disch": 43496},
    {"code": "772", "client": "SPCC", "pol": "ILO", "pod": "MATARANI", "gross": 249091.94, "profit": 145369.00, "tce": 40712.00, "tm": 13457.16, "rate": 19.01, "port_load": 18646, "port_disch": 13633},
    {"code": "773", "client": "SPCC", "pol": "ILO", "pod": "MARCONA", "gross": 291299.95, "profit": 128656.00, "tce": 36785.00, "tm": 13051.07, "rate": 22.82, "port_load": 20638, "port_disch": 33431},
    {"code": "774", "client": "NEXA", "pol": "CALLAO", "pod": "MATARANI", "gross": 405187.71, "profit": 223079.00, "tce": 44260.00, "tm": 13506.28, "rate": 30.00, "port_load": 13934, "port_disch": 14649},
    {"code": "775", "client": "SPCC", "pol": "ILO", "pod": "MEJILLONES", "gross": 273353.24, "profit": 83995.00, "tce": 27466.00, "tm": 13097.90, "rate": 20.87, "port_load": 20147, "port_disch": 48000},
    {"code": "777", "client": "SPCC", "pol": "ILO", "pod": "MARCONA", "gross": 308066.62, "profit": 140977.00, "tce": 38607.00, "tm": 13499.85, "rate": 22.82, "port_load": 20000, "port_disch": 37000}
]

success_count = 0
for row in master_data:
    url = f"{url_base}/rest/v1/voyage_liquidations?voyage_code=ilike.*{row['code']}*"
    payload = {
        'client_name': row['client'],
        'gross_revenue_usd': row['gross'],
        'net_profit_usd': row['profit'],
        'tce_usd_day': row['tce'],
        'cargo_quantity_mt': row['tm'],
        'freight_rate_usd': row['rate'],
        'pol_port': row['pol'],
        'pod_port': row['pod'],
        'details': {
            'vessel_header': {'vessel_name': 'B/T MOQUEGUA', 'prepared_by': 'MEC'},
            'port_expenses': {
                'load_port_usd': row['port_load'],
                'disch_port_usd': row['port_disch'],
                'total_agency_usd': row['port_load'] + row['port_disch']
            }
        }
    }
    r = requests.patch(url, headers=headers, json=payload)
    if r.status_code == 200:
        success_count += 1
        print(f"Viaje {row['code']}: OK (Gross: ${row['gross']:.2f}, Profit: ${row['profit']:.2f})")
    else:
        print(f"Viaje {row['code']}: ERROR {r.status_code}")

print(f"\nSincronizados exitosamente {success_count} de {len(master_data)} viajes en Supabase.")
