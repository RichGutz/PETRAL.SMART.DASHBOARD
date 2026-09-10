import urllib.request
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

engine_path = Path(r"c:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")
sys.path.insert(0, str(engine_path))
load_dotenv(engine_path / ".env")

from backend.services.email_template_2fa import generate_2fa_email_html

def send_custom_2fa_email(to_email: str, cc_email: str, user_name: str, otp_code: str):
    html_content = generate_2fa_email_html(user_name=user_name, otp_code=otp_code, valid_minutes=15)
    
    payload = {
        "from": "DELFOS Security <petral@geeksoft.tech>",
        "to": [to_email],
        "cc": [cc_email],
        "subject": f"Código de Seguridad DELFOS (Verificación): {otp_code}",
        "html": html_content
    }
    
    data = json.dumps(payload).encode("utf-8")
    resend_api_key = os.getenv("RESEND_API_KEY", "")
    
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=data,
        headers={
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "DELFOS-Auth/1.0"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.status
            body = resp.read().decode("utf-8")
            print(f"[EXITO] Correo enviado exitosamente a {to_email} con CC a {cc_email}")
            print(f"Status HTTP: {status_code}")
            print(f"Respuesta Resend: {body}")
            return True, json.loads(body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"[ERROR HTTP] {e.code}: {err_body}")
        return False, err_body
    except Exception as e:
        print(f"[ERROR] {e}")
        return False, str(e)

if __name__ == "__main__":
    to_dest = "mcastro@petral.com.pe"
    cc_dest = "rgutil@gmail.com"
    user_nm = "Maria Elena Castro"
    test_otp = "849201"
    
    print(f"Enviando correo 2FA a {to_dest} con CC a {cc_dest}...")
    success, res = send_custom_2fa_email(to_dest, cc_dest, user_nm, test_otp)
