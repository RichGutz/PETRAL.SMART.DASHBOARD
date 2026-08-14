import requests

API_URL = "https://forecast.geeksoft.tech/api/v1/forecast/masters/routes"

try:
    resp = requests.get(API_URL)
    routes = resp.json()
    contracts = [r for r in routes if r.get("is_contract") or r.get("table_source") == "contracts"]
    print(f"Total contratos en DB: {len(contracts)}")
    for idx, c in enumerate(contracts, 1):
        ld = c.get("legs_data") or {}
        print(f"\n--- Contrato {idx}: {c.get('name')} ---")
        print(f"  Client: {c.get('client_id')}, Contract ID: {c.get('contract_id')}")
        print(f"  Valid: {c.get('valid_from')} a {c.get('valid_to')}")
        print(f"  is_multicotizador: {ld.get('is_multicotizador')}")
        print(f"  BAF Formula: {ld.get('baf_formula')}")
        print(f"  IFO Base: {ld.get('baf_ifo_base')}, MDO Base: {ld.get('baf_mdo_base')}")
        print(f"  Tariff Tiers: {len(ld.get('tariff_tiers') or [])} bandas")
        print(f"  Demurrage Rates: {ld.get('demurrage_rates') or ld.get('demurrage_rate')}")
except Exception as e:
    print(f"Error: {e}")
