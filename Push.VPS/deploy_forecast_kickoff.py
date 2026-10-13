"""
Deploy Oficial Hostinger VPS (91.108.125.253)
Dominios: strategy.geeksoft.tech, academy.geeksoft.tech, forecast.geeksoft.tech
"""
import os
import sys
import time
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST = "91.108.125.253"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Thiagutz061121@"

DOMAINS = ["strategy.geeksoft.tech", "academy.geeksoft.tech", "forecast.geeksoft.tech"]
APP_DIR = "/opt/forecast_petral"
ROOT_DIR = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD"
CERTBOT_MAIL = "contacto@geeksoft.pe"

def deploy():
    print(f"\n{'='*65}")
    print(f" 🚀 DESPLIEGUE A PRODUCCIÓN HOSTINGER VPS ({VPS_HOST})")
    print(f" 🌐 DOMINIOS: {', '.join(DOMAINS)}")
    print(f"{'='*65}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"\nConectando SSH a {VPS_HOST}...")
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("  >> Conexión SSH a Hostinger establecida ✓")

        # 1. Preparar directorio
        run(client, f"mkdir -p {APP_DIR} /var/www/html", "1. Preparar directorios en VPS")

        # 2. Subir las páginas HTML APEFAC directamente (Instantáneo)
        print(f"\n[2. Subiendo páginas HTML APEFAC vía SFTP]")
        sftp = client.open_sftp()
        h1 = os.path.join(ROOT_DIR, "strategy_apefac_report.html")
        h2 = os.path.join(ROOT_DIR, "nexa_spcc_tiamaria_intelligence.html")

        if os.path.exists(h1):
            sftp.put(h1, f"{APP_DIR}/strategy_apefac_report.html")
            sftp.put(h1, f"{APP_DIR}/index.html")
            sftp.put(h1, "/var/www/html/strategy_apefac_report.html")
            sftp.put(h1, "/var/www/html/index.html")

        if os.path.exists(h2):
            sftp.put(h2, f"{APP_DIR}/nexa_spcc_tiamaria_intelligence.html")
            sftp.put(h2, "/var/www/html/nexa_spcc_tiamaria_intelligence.html")

        sftp.close()
        print("  >> HTMLs APEFAC subidos con éxito ✓")

        # 3. Permisos
        run(client, f"find {APP_DIR} -type f -exec chmod 644 {{}} \\; && find {APP_DIR} -type d -exec chmod 755 {{}} \\; && chown -R www-data:www-data {APP_DIR}", "3. Permisos")

        # 4. Configurar Nginx para los dominios
        nginx_cfg = f"""server {{
    listen 80;
    server_name strategy.geeksoft.tech academy.geeksoft.tech forecast.geeksoft.tech;
    root {APP_DIR};
    index index.html strategy_apefac_report.html;

    location / {{
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0";
    }}

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
}}"""

        run(client,
            f"echo '{nginx_cfg}' > /etc/nginx/sites-available/strategy.geeksoft.tech && "
            f"ln -sf /etc/nginx/sites-available/strategy.geeksoft.tech /etc/nginx/sites-enabled/strategy.geeksoft.tech && "
            f"nginx -t && systemctl reload nginx",
            "4. Configurar Nginx HTTP")

        # 5. Certbot SSL para los dominios
        print(f"\n[5. Certificado SSL — Certbot]")
        run(client,
            f"certbot --nginx -d strategy.geeksoft.tech -d academy.geeksoft.tech --non-interactive --agree-tos -m {CERTBOT_MAIL} --redirect || true",
            "5. Certbot SSL")

        run(client, "nginx -t && systemctl reload nginx", "6. Recarga Nginx Final")

        print(f"\n{'='*65}")
        print(f"  🎉 PUBLICACIÓN PÚBLICA COMPLETADA EN HOSTINGER VPS ({VPS_HOST}):")
        print(f"  🌐 STRATEGY: https://strategy.geeksoft.tech")
        print(f"  🌐 ACADEMY:  https://academy.geeksoft.tech")
        print(f"  📊 DASHBOARD STRATEGY: https://strategy.geeksoft.tech/strategy_apefac_report.html")
        print(f"  ⚡ INTELLIGENCE TÍA MARÍA: https://strategy.geeksoft.tech/nexa_spcc_tiamaria_intelligence.html")
        print(f"{'='*65}\n")

    except Exception as e:
        print(f"\n[ERROR DESPLIEGUE] {e}")
    finally:
        client.close()

def run(client, cmd, desc=""):
    print(f"\n[{desc}]")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(f"  >> {out[:300]}")
    if err and "warning" not in err.lower(): print(f"  !! {err[:300]}")
    return out, err

if __name__ == "__main__":
    deploy()
