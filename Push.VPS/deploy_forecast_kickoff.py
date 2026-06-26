"""
Deploy: kickoff_petral.html -> forecast.geeksoft.pe
VPS: 91.108.125.253 | Nginx + Certbot SSL
"""
import paramiko
import os
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST  = "91.108.125.253"
VPS_PORT  = 22
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

DOMAIN    = "forecast.geeksoft.tech"
APP_DIR   = "/opt/forecast_petral"
IMG_FILE = r"C:\Users\rguti\.gemini\antigravity-ide\brain\f7f693a3-899b-4645-93cc-ffbc88e91e54\tanker_tablones_1782498428298.png"
HTML_FILE = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.2\kickoff_petral.html"
CERTBOT_MAIL = "contacto@geeksoft.pe"

def run(client, cmd, desc=""):
    print(f"\n[{desc}]")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(f"  >> {out[:400]}")
    if err and "warning" not in err.lower(): print(f"  !! {err[:400]}")
    return out, err

def deploy():
    print(f"\n{'='*55}")
    print(f"  DEPLOY -> https://{DOMAIN}")
    print(f"{'='*55}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"\nConectando a {VPS_HOST}...")
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("  >> Conexión SSH establecida ✓")

        # 1. Crear directorio en VPS
        run(client, f"mkdir -p {APP_DIR}", "1. Crear directorio")

        # 2. Subir HTML via SFTP
        print(f"\n[2. Subiendo kickoff_petral.html via SFTP]")
        sftp = client.open_sftp()
        remote_path = f"{APP_DIR}/index.html"
        sftp.put(HTML_FILE, remote_path)
        sftp.put(IMG_FILE, f"{APP_DIR}/tanker_tablones.png")
        sftp.close()
        print(f"  >> Archivo subido → {remote_path} ✓")

        # 3. Permisos correctos
        run(client, f"chmod 644 {APP_DIR}/index.html && chown -R www-data:www-data {APP_DIR} 2>/dev/null || true", "3. Permisos")

        # 4. Configurar Nginx
        nginx_cfg = f"""server {{
    listen 80;
    server_name {DOMAIN};
    root {APP_DIR};
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    # Compresión
    gzip on;
    gzip_types text/html text/css application/javascript;
}}"""
        run(client,
            f"echo '{nginx_cfg}' > /etc/nginx/sites-available/{DOMAIN} && "
            f"ln -sf /etc/nginx/sites-available/{DOMAIN} /etc/nginx/sites-enabled/{DOMAIN} && "
            f"nginx -t && systemctl reload nginx",
            "4. Configurar Nginx")

        # 5. Certbot SSL
        print(f"\n[5. Certificado SSL — Certbot]")
        out, err = run(client,
            f"certbot --nginx -d {DOMAIN} --non-interactive --agree-tos -m {CERTBOT_MAIL} --redirect",
            "5. Certbot SSL")

        if "Certificate not yet due" in out or "Successfully" in out or "Congratulations" in out:
            proto = "https"
        else:
            proto = "http"
            print("  >> SSL pendiente (DNS puede estar propagando) — disponible vía HTTP")

        print(f"\n{'='*55}")
        print(f"  [OK] PRESENTACIÓN PUBLICADA EN:")
        print(f"  PUBLICADA EN: {proto}://{DOMAIN}")
        print(f"{'='*55}\n")

    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
