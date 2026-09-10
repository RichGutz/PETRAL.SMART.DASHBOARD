import sys
import os
from pathlib import Path
import json
import urllib.request
from dotenv import load_dotenv

engine_path = Path(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
sys.path.insert(0, str(engine_path))
load_dotenv(engine_path / ".env")

from backend.database import get_db_connection

def inspect_mcastro():
    print("=== 1. VERIFICACIÓN EN BASE DE DATOS ===")
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Tables in DB
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
    print("Tablas públicas:", [t[0] for t in cur.fetchall()])
    
    # Dispositivos
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_authorized_devices';")
    print("Cols user_authorized_devices:", [c[0] for c in cur.fetchall()])
    
    # user_2fa_tokens
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_2fa_tokens';")
    print("Cols user_2fa_tokens:", [c[0] for c in cur.fetchall()])
    
    cur.execute("SELECT * FROM user_authorized_devices;")
    devs = cur.fetchall()
    print(f"\nTotal dispositivos registrados en Device Vault: {len(devs)}")
    for d in devs:
        print(" - Dev:", d)
        
    cur.execute("SELECT * FROM user_2fa_tokens ORDER BY created_at DESC LIMIT 20;")
    tokens = cur.fetchall()
    print(f"\nÚltimos 20 tokens 2FA en BD:")
    for t in tokens:
        print(" - Token:", t)
        
    cur.close()
    conn.close()

def inspect_resend_emails():
    print("\n=== 2. HISTORIAL DE CORREOS EN RESEND API ===")
    resend_api_key = os.getenv("RESEND_API_KEY", "")
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {resend_api_key}",
            "User-Agent": "DELFOS-Auth-Diag/1.0"
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            emails = data.get("data", [])
            print(f"Total correos obtenidos de Resend: {len(emails)}")
            for item in emails:
                to_addr = item.get("to", [])
                created = item.get("created_at", "")
                subj = item.get("subject", "")
                eid = item.get("id", "")
                last_event = item.get("last_event", "")
                print(f" - To: {to_addr} | Last Event: {last_event} | Subject: {subj} | Date: {created} | ID: {eid}")
    except Exception as e:
        print(f"Error consultando Resend API: {e}")

if __name__ == "__main__":
    inspect_mcastro()
    inspect_resend_emails()
