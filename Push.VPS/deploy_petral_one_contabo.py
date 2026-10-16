"""
Deploy Oficial de PETRAL ONE a Producción Contabo VPS (169.58.168.107)
Dominio: https://petral.one.geeksoft.tech
Contenedores: petral-frontend, petral-backend
"""
import os
import sys
import tarfile
import time
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CONTABO_IP = "169.58.168.107"
CONTABO_PORT = 22
CONTABO_USER = "root"
CONTABO_PASS = "VivaLaVida2026$"

ROOT_DIR = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD"
DIST_DIR = os.path.join(ROOT_DIR, "Desarrollo.Profesional", "Geeksoft_Frontend", "dist")
BACKEND_DIR = os.path.join(ROOT_DIR, "Desarrollo.Profesional", "Geeksoft_Engine", "backend")
TAR_PATH = os.path.join(ROOT_DIR, "scratch", "frontend_dist.tar.gz")
BACKEND_TAR_PATH = os.path.join(ROOT_DIR, "scratch", "backend_dist.tar.gz")

def make_frontend_tar(output_filename, source_dir):
    print(f"\n[1. Empaquetando dist frontend en {output_filename}...]")
    with tarfile.open(output_filename, "w:gz") as tar:
        for item in os.listdir(source_dir):
            full_path = os.path.join(source_dir, item)
            tar.add(full_path, arcname=item)
    print(f"  >> Frontend tar.gz creado con éxito: {os.path.getsize(output_filename)/1024:.2f} KB ✓")

def make_backend_tar(output_filename, source_dir):
    print(f"\n[2. Empaquetando backend en {output_filename}...]")
    def filter_pyc(tarinfo):
        if "__pycache__" in tarinfo.name or tarinfo.name.endswith(".pyc"):
            return None
        return tarinfo
    with tarfile.open(output_filename, "w:gz") as tar:
        tar.add(source_dir, arcname="backend", filter=filter_pyc)
    print(f"  >> Backend tar.gz creado con éxito: {os.path.getsize(output_filename)/1024:.2f} KB ✓")

def run(client, cmd, desc=""):
    print(f"\n[{desc}]")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out:
        print(f"  >> {out[:500]}")
    if err and "warning" not in err.lower():
        print(f"  !! {err[:500]}")
    return out, err

def deploy():
    print(f"\n{'='*65}")
    print(f"  DESPLIEGUE A PRODUCCIÓN CONTABO: https://petral.one.geeksoft.tech")
    print(f"  IP VPS: {CONTABO_IP}")
    print(f"{'='*65}")

    # 1. Empaquetar
    os.makedirs(os.path.dirname(TAR_PATH), exist_ok=True)
    make_frontend_tar(TAR_PATH, DIST_DIR)
    make_backend_tar(BACKEND_TAR_PATH, BACKEND_DIR)

    # 2. Conectar a Contabo
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"\nConectando a {CONTABO_IP}...")
    client.connect(hostname=CONTABO_IP, port=CONTABO_PORT, username=CONTABO_USER, password=CONTABO_PASS, timeout=20)
    print("  >> Conexión SSH establecida ✓")

    sftp = client.open_sftp()

    # 3. Subir y sincronizar backend
    print(f"\n[3. Subiendo backend completo a Contabo...]")
    sftp.put(BACKEND_TAR_PATH, "/tmp/backend_dist.tar.gz")
    run(client, "mkdir -p /opt/petral_stack && tar -xzf /tmp/backend_dist.tar.gz -C /opt/petral_stack/", "Desempaquetar backend en /opt/petral_stack")
    run(client, "docker cp /opt/petral_stack/backend/. petral-backend:/app/backend/", "Sincronizar backend a contenedor petral-backend")

    # 4. Subir tar.gz de frontend
    print(f"\n[4. Subiendo bundle frontend dist a Contabo...]")
    sftp.put(TAR_PATH, "/tmp/frontend_dist.tar.gz")
    sftp.close()

    # 5. Desempaquetar frontend y actualizar contenedor
    run(client, "mkdir -p /opt/petral_stack/frontend_dist && rm -rf /opt/petral_stack/frontend_dist/* && tar -xzf /tmp/frontend_dist.tar.gz -C /opt/petral_stack/frontend_dist/", "Desempaquetar dist en /opt/petral_stack/frontend_dist")
    run(client, "docker cp /opt/petral_stack/frontend_dist/. petral-frontend:/usr/share/nginx/html/", "Copiar frontend dist a contenedor petral-frontend")

    # 6. Reiniciar contenedores
    run(client, "mkdir -p /opt/petral_stack/storage/bunker_invoices", "Asegurar directorio persistente bunker_invoices")
    run(client, "docker restart petral-backend", "Reiniciar petral-backend")
    run(client, "docker restart petral-frontend", "Reiniciar petral-frontend")

    # 7. Validar endpoints en vivo
    time.sleep(4)
    run(client, "curl -s -I https://petral.one.geeksoft.tech/ | head -n 5", "Verificar Frontend HTTP Status")
    run(client, 'curl -s https://petral.one.geeksoft.tech/api/v1/trash/count', "Verificar Endpoint Trash Count")
    run(client, 'curl -s https://petral.one.geeksoft.tech/api/v1/bunker-bootstrapping/events/MOQUEGUA', "Verificar Endpoint Bunker Bootstrapping Events")

    client.close()
    print(f"\n{'='*65}")
    print(f"  ¡DESPLIEGUE A PRODUCCIÓN COMPLETADO CON ÉXITO!")
    print(f"  🌐 URL OFICIAL: https://petral.one.geeksoft.tech/bunker-bootstrapping")
    print(f"{'='*65}\n")

if __name__ == "__main__":
    deploy()
