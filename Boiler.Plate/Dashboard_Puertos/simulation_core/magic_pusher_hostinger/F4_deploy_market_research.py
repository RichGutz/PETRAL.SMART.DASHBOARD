import paramiko
import os

# ============================================================
# F4_deploy_market_research.py
# Script de Despliegue: Market Research (GyP Module)
# Dominio: research.geeksoft.tech
# Conecta al VPS Hostinger vía SSH y sincroniza archivos
# ============================================================
# [LOG DE CORRECCIONES / LECCIONES APRENDIDAS]
# 1. APP_DIR: Se cambió de /opt a /var/www/html/research para mantener consistencia con el venv existente.
# 2. ENTRY POINT: La API corre sobre api_market:app (Puerto 8000), no main:app.
# 3. SERVICE MGR: Se cambió PM2 por Systemctl (research_api.service) que es la arquitectura funcional probada.
# 4. NGINX PROXY: Se agregó el "/" final en proxy_pass (http://127.0.0.1:8000/) para evitar errores 404 en la API.
# 5. DEPENDENCIAS: Se aseguró la creación de requirements.txt y el uso del entorno virtual (venv) del servidor.
# 6. CREDENCIALES: Se automatizó la creación del .env en el VPS para evitar fallos de conexión a Supabase.
# 7. ENCODING: Se parcheó ssh_run para evitar que caracteres especiales (como el bullet de systemctl) rompan el script en Windows.
# ============================================================

VPS_HOST   = "91.108.125.253"
VPS_PORT   = 22
VPS_USER   = "root"
VPS_PASS   = "doHtFib1poV+f0F7"
DOMAIN     = "research.geeksoft.tech"
SERVICE_NAME = "market_research"
APP_DIR    = "/var/www/html/research"
REPO_URL   = "https://github.com/RichGutz/market.research.git"

def ssh_run(client, cmd, label=""):
    if label:
        print(f"\n[{label}]")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    # Sanitize for Windows console
    out = out.encode("ascii", errors="replace").decode("ascii")
    err = err.encode("ascii", errors="replace").decode("ascii")
    if out.strip():
        print(f" >> {out.strip()[:500]}")
    if err.strip():
        print(f" !! {err.strip()[:300]}")

def deploy():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print(f"Conectando a {VPS_HOST}...")
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=20)

        # 1. Git Pull / Clone
        git_cmd = (
            f"if [ -d '{APP_DIR}/.git' ]; then "
            f"cd {APP_DIR} && git remote set-url origin {REPO_URL} && git fetch origin && git reset --hard origin/main; "
            f"else mkdir -p {APP_DIR} && git clone {REPO_URL} {APP_DIR}; fi"
        )
        ssh_run(client, git_cmd, "1. Sincronizando Repositorio Git")

        # 1b. Crear .env si no existe (con las credenciales proporcionadas)
        SUPABASE_URL = "https://kqorhlowmvroxalcrzqa.supabase.co"
        SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3JobG93bXZyb3hhbGNyenFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTk5NjksImV4cCI6MjA4NzYzNTk2OX0.s7P2PMZEA5U-MkmT4ZvcDLIllQ21DueOY07Zm4Vullw"
        env_cmd = f"printf 'SUPABASE_URL={SUPABASE_URL}\\nSUPABASE_KEY={SUPABASE_KEY}\\n' > {APP_DIR}/backend/.env"
        ssh_run(client, env_cmd, "1b. Configurando .env")

        # 2. Configurar Nginx para Market Research (Puerto 8000)
        nginx_cfg = f"""server {{
    server_name {DOMAIN};
    root {APP_DIR}/frontend;
    index login.html;

    location / {{
        try_files $uri $uri/ =404;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }}

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/{DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}}

server {{
    if ($host = {DOMAIN}) {{
        return 301 https://$host$request_uri;
    }}
    listen 80;
    server_name {DOMAIN};
    return 404;
}}"""

        ssh_run(client, f"cat > /etc/nginx/sites-available/{SERVICE_NAME} << 'NGINXEOF'\n{nginx_cfg}\nNGINXEOF", "2. Configurando Nginx")
        ssh_run(client, f"ln -sf /etc/nginx/sites-available/{SERVICE_NAME} /etc/nginx/sites-enabled/{SERVICE_NAME} && nginx -t && systemctl reload nginx", "3. Activando Nginx")

        # 3. Reiniciar el servicio research_api (Systemd)
        # Aseguramos que el venv tenga lo necesario
        setup_cmd = (
            f"cd {APP_DIR} && python3 -m venv venv || true && "
            f"source venv/bin/activate && pip install -r backend/requirements.txt -q"
        )
        ssh_run(client, setup_cmd, "4. Actualizando dependencias en VENV")
        ssh_run(client, "systemctl restart research_api", "5. Reiniciando research_api")

        print(f"\n{'='*55}")
        print(f" [OK] MARKET RESEARCH DESPLEGADO EN: https://{DOMAIN}")
        print(f"{'='*55}\n")

    except Exception as e:
        print(f"[ERROR FATAL] {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
