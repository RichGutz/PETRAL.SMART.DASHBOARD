import os
import json
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

engine_path = Path(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
load_dotenv(engine_path / ".env")

resend_api_key = os.getenv("RESEND_API_KEY", "")
email_id = "c510ea8a-4efa-4200-afc9-e914a171f2ea" # Ultimo de mcastro

req = urllib.request.Request(
    f"https://api.resend.com/emails/{email_id}",
    headers={
        "Authorization": f"Bearer {resend_api_key}",
        "User-Agent": "DELFOS-Auth-Diag/1.0"
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
