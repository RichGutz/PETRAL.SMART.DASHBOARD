"""
Deploy: Geeksoft_Engine -> VPS (forecast.geeksoft.tech)
"""
import paramiko
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST  = "91.108.125.253"
VPS_PORT  = 22
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

APP_DIR   = "/opt/geeksoft_engine"
LOCAL_DIR = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine"

def put_dir(sftp, localpath, remotepath):
    try:
        sftp.mkdir(remotepath)
    except IOError:
        pass
    for item in os.listdir(localpath):
        localitem = os.path.join(localpath, item)
        remoteitem = remotepath + '/' + item
        
        # Ignorar carpetas innecesarias para prod
        if item in ['.pytest_cache', '__pycache__', 'tests', '.git', 'venv']:
            continue
            
        if os.path.isdir(localitem):
            put_dir(sftp, localitem, remoteitem)
        else:
            sftp.put(localitem, remoteitem)

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
    print(f"  DEPLOY BACKEND -> {VPS_HOST}")
    print(f"{'='*55}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"\nConectando a {VPS_HOST}...")
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("  >> Conexión SSH establecida ✓")

        # 1. Crear directorio en VPS
        run(client, f"mkdir -p {APP_DIR} && rm -rf {APP_DIR}/backend {APP_DIR}/requirements.txt", "1. Preparar directorio")

        # 2. Subir carpeta Geeksoft_Engine via SFTP
        print(f"\n[2. Subiendo backend via SFTP]")
        sftp = client.open_sftp()
        put_dir(sftp, LOCAL_DIR, APP_DIR)
        sftp.close()
        print(f"  >> Backend subido con éxito ✓")

        # 3. Configurar entorno virtual e instalar dependencias
        run(client, f"apt-get update && apt-get install -y python3-venv", "3. Instalar dependencias del sistema")
        run(client, f"cd {APP_DIR} && python3 -m venv venv && ./venv/bin/pip install --upgrade pip && ./venv/bin/pip install -r requirements.txt", "4. Instalar dependencias de Python")

        # 4. Configurar systemd
        service_cfg = f"""[Unit]
Description=Geeksoft Engine FastAPI Backend
After=network.target

[Service]
User=root
WorkingDirectory={APP_DIR}
ExecStart={APP_DIR}/venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
"""
        run(client, f"echo '{service_cfg}' > /etc/systemd/system/geeksoft-engine.service && systemctl daemon-reload && systemctl enable geeksoft-engine && systemctl restart geeksoft-engine", "5. Configurar systemd service")

        print(f"\n{'='*55}")
        print(f"  [OK] BACKEND DESPLEGADO Y CORRIENDO EN PUERTO 8000")
        print(f"{'='*55}\n")

    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
