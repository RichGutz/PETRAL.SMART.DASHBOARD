import requests
import json

url = 'https://hjjxooxcpvlvbaxgifbn.supabase.co/rest/v1/voyage_liquidations?select=*&order=vessel_name.asc,voyage_code.asc'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc'
}

data = requests.get(url, headers=headers).json()
print(f'Total voyages fetched: {len(data)}')

print('\n| # | Nave | Viaje | Cliente | Ruta | Ingreso Total (I23) | Items de Ingreso (Flete / Dockage Pass-through) | Gastos Puerto | Costo Búnker | Profit Real (P/L) | TCE ($/día) |')
print('|:---:|:---|:---|:---|:---|:---:|:---|:---:|:---:|:---:|:---:|')

for idx, r in enumerate(data, 1):
    vessel = 'MOQUEGUA' if 'Moquegua' in r['vessel_name'] else 'TABLONES'
    vcode = r['voyage_code']
    client = r['client_name']
    route = f"{r['pol_port']} -> {r['pod_port']}"
    gross = r['gross_revenue_usd']
    
    details = r.get('details', {})
    income_info = details.get('income', {})
    items = income_info.get('freight_income_items', [])
    items_str = ", ".join([f"{it['concept']}: ${it['amount_usd']:,.2f}" for it in items]) if items else "Flete Base"
    
    port_cost = details.get('port_expenses', {}).get('total_agency_usd', 0.0)
    bunker_cost = details.get('bunker_expenses', {}).get('total_bunker_cost_usd', 0.0)
    pnl = r['net_profit_usd']
    tce = r['tce_usd_day']
    
    print(f"| {idx:2d} | {vessel} | `{vcode}` | {client} | {route} | ${gross:,.2f} | {items_str} | ${port_cost:,.2f} | ${bunker_cost:,.2f} | ${pnl:,.2f} | ${tce:,.2f} |")
