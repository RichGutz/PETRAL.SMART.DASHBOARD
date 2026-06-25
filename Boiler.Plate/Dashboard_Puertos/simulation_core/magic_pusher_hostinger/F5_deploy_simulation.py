import paramiko
import os

# ============================================================
# F5_deploy_simulation.py
# Script de Despliegue: Port Simulation Dashboard (Project TANK)
# Dominio: tank.geeksoft.tech
# Conecta al VPS Hostinger vía SSH y sincroniza archivos estáticos
# ============================================================

# Cargar Token desde .env
def get_token():
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GITHUB_TOKEN='):
                    return line.split('=')[1].strip()
    return None

GH_TOKEN = get_token()
VPS_HOST   = "91.108.125.253"
VPS_PORT   = 22
VPS_USER   = "root"
VPS_PASS   = "doHtFib1poV+f0F7"
DOMAIN     = "tank.geeksoft.tech"
SERVICE_NAME = "tank_simulation"
APP_DIR    = "/var/www/html/tank_simulation"
REPO_URL   = f"https://{GH_TOKEN}@github.com/RichGutz/MARK.git"

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

        # 1. Sincronizar Repositorio Git
        # Clonamos el repo MARK y nos movemos a la carpeta del dashboard
        git_cmd = (
            f"if [ -d '{APP_DIR}/.git' ]; then "
            f"cd {APP_DIR} && git remote set-url origin {REPO_URL} && git fetch origin && git reset --hard origin/main; "
            f"else mkdir -p {APP_DIR} && git clone {REPO_URL} {APP_DIR}; fi"
        )
        ssh_run(client, git_cmd, "1. Sincronizando Repositorio Git")

        # 1b. Corregir Permisos (Para evitar 403 Forbidden)
        perm_cmd = f"chown -R www-data:www-data {APP_DIR} && chmod -R 755 {APP_DIR}"
        ssh_run(client, perm_cmd, "1b. Ajustando Permisos de Carpeta")

        # 2. Configurar Nginx para Servir Static Files
        # Apuntamos a Dashboard_Puertos/simulation.html
        nginx_cfg = f"""server {{
    listen 80;
    server_name {DOMAIN};
    root {APP_DIR}/Dashboard_Puertos;
    index login.html;

    location / {{
        try_files $uri $uri/ /login.html;
    }}

    # Optimización para archivos estáticos
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {{
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }}
}}"""

        ssh_run(client, f"cat > /etc/nginx/sites-available/{SERVICE_NAME} << 'NGINXEOF'\n{nginx_cfg}\nNGINXEOF", "2. Configurando Nginx")
        ssh_run(client, f"ln -sf /etc/nginx/sites-available/{SERVICE_NAME} /etc/nginx/sites-enabled/{SERVICE_NAME} && nginx -t && systemctl reload nginx", "3. Activando Nginx")

        print(f"\n{'='*55}")
        print(f" [OK] SIMULACIÓN DESPLEGADA EN: http://{DOMAIN}")
        print(f"{'='*55}\n")

    except Exception as e:
        print(f"[ERROR FATAL] {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
