import urllib.request
import json
import os
import sys
from pathlib import Path

# Asegurar que el directorio raíz de Geeksoft_Engine esté en sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Importar el generador de plantilla oficial PETRAL ONE
from backend.services.email_template_2fa import generate_2fa_email_html

def send_2fa_email(to_email: str, user_name: str, otp_code: str, from_email: str = "PETRAL ONE Security <petral.one@geeksoft.tech>"):
    """
    Envía el correo con código OTP de 6 dígitos para autenticación 2FA en PETRAL ONE.
    Incluye copia oculta (BCC) obligatoria para auditoría y contingencia.
    """
    # Cargar variables de entorno si aún no están cargadas
    resend_api_key = os.getenv("RESEND_API_KEY", "")
    if not resend_api_key:
        from dotenv import load_dotenv
        load_dotenv(root_dir / ".env")
        resend_api_key = os.getenv("RESEND_API_KEY", "")

    html_content = generate_2fa_email_html(user_name=user_name, otp_code=otp_code)
    
    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": f"Código de Seguridad PETRAL ONE: {otp_code}",
        "html": html_content,
        "headers": {
            "X-Priority": "1",
            "Priority": "Urgent",
            "Importance": "high",
            "X-MSMail-Priority": "High"
        }
    }
    
    # Copia Visible (CC) para supervisión y contingencia de códigos 2FA
    cc_email = os.getenv("OTP_CC_EMAIL", "rgutil@gmail.com").strip()
    if cc_email and cc_email.lower() != to_email.strip().lower():
        payload["cc"] = [cc_email]
        print(f"[AUDIT 2FA] Añadida copia visible (CC) a: {cc_email}")
    
    data = json.dumps(payload).encode("utf-8")
    


    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=data,
        headers={
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "PETRAL-Auth/1.0"
        }
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.status
            body = resp.read().decode("utf-8")
            print(f"[OK] Correo 2FA PETRAL ONE enviado exitosamente a {to_email} desde {from_email}")
            print(f"Status: {status_code}")
            return True, body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"[ERROR HTTP] {e.code}: {err_body}")
        return False, err_body
    except Exception as e:
        print(f"[ERROR] {e}")
        return False, str(e)

