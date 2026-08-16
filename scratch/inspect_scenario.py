import requests

url = "https://forecast.geeksoft.tech/api/v1/forecast/scenarios"
try:
    resp = requests.get(url, timeout=10)
    print("GET /scenarios Status:", resp.status_code)
    scenarios = resp.json()
    triangular = [s for s in scenarios if "TRIANGULAR" in s.get("name", "").upper()]
    print("Found scenarios:", len(triangular))
    if triangular:
        sc_id = triangular[0]["id"]
        print("Scenario ID:", sc_id)
        sc_url = f"https://forecast.geeksoft.tech/api/v1/forecast/scenario/{sc_id}"
        sc_resp = requests.get(sc_url, timeout=10)
        print("GET scenario Status:", sc_resp.status_code)
        sc_data = sc_resp.json()
        print("Lines count:", len(sc_data.get("projection_lines", [])))
        if sc_data.get("projection_lines"):
            print("First line sample:", sc_data["projection_lines"][0])
except Exception as e:
    print("Error:", e)
