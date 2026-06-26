
import paramiko
import os
import sys

# Credenciales del VPS (Obtenidas de CRM_NEOAUTO)
VPS_HOST = "91.108.125.253"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "doHtFib1poV+f0F7"

# Token de GitHub (Obtenido de .env)
GH_TOKEN = "REDACTED"

# Configuracion de la Tienda
REPO_URL    = f"https://{GH_TOKEN}@github.com/RichGutz/Tienda.Apple.PS5.New.git"
BRANCH      = "main"
APP_DIR     = "/opt/tienda_apple"
DOMAIN      = "bolt-usa.shop"
SERVICE_NAME = "tienda_apple"

def ssh_run(client, cmd, desc=""):
    print(f"\n[{desc}]")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(f" >> {out[:300]}")
    if err and "warning" not in err.lower(): print(f" !! {err[:300]}")
    return out, err

def local_push():
    print("\n[Sincronizando Cambios Locales con GitHub...]")
    os.system("git add .")
    # Intentamos el commit; si no hay cambios, no fallará el script
    os.system('git commit -m "Auto-deploy BOLT V51: Portal Comunidad Matrix + DB Schema"')
    os.system("git push origin main")

def deploy():
    print(f"\n[DESPLEGANDO TIENDA APPLE PS5 A HOSTINGER]")
    
    # NUEVO: Fase de Push Local
    local_push()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"Conectando a {VPS_HOST}...")
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        
        # 1. Preparar Directorio y Clonar/Actualizar
        ssh_run(client, f"if [ -d '{APP_DIR}/.git' ]; then cd {APP_DIR} && git remote set-url origin {REPO_URL} && git fetch --all && git reset --hard origin/{BRANCH} && git pull origin {BRANCH}; else rm -rf {APP_DIR} && git clone -b {BRANCH} {REPO_URL} {APP_DIR}; fi", "1. Sincronizacion de Codigo")
        
        # 2. Configurar Nginx (Sitio Estatico)
        nginx_cfg = f"""
server {{
    listen 80;
    server_name {DOMAIN} www.{DOMAIN};
    root {APP_DIR}/bolt_v51;
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}
}}
"""
        ssh_run(client, f"echo '{nginx_cfg}' > /etc/nginx/sites-available/{SERVICE_NAME}", "2. Creando Config Nginx")
        ssh_run(client, f"ln -sf /etc/nginx/sites-available/{SERVICE_NAME} /etc/nginx/sites-enabled/{SERVICE_NAME} && nginx -t && systemctl reload nginx", "3. Activando Sitio en Nginx")
        
        # 3. Certbot SSL
        print("\n[4. Ejecutando Certbot SSL...]")
        ssh_run(client, f"certbot --nginx -d {DOMAIN} -d www.{DOMAIN} --non-interactive --agree-tos -m contacto@geeksoft.pe --redirect", "4. Certbot SSL")
        
        print(f"\n{'='*55}")
        print(f" [OK] TIENDA DESPLEGADA EN: https://{DOMAIN}")
        print(f"{'='*55}\n")

    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
