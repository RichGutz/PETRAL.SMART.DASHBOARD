import sys
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

script_py = r"""import os
import sys
import datetime
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SERVERS = [
    {
        "name": "VPS Contabo (InAndes / Coolify / APEFAC)",
        "host": "169.58.168.107",
        "port": 22,
        "user": "root",
        "pass": "Thiagutz061121@",
        "is_docker": True
    },
    {
        "name": "VPS Hostinger (PETRAL / Geeksoft Engine)",
        "host": "91.108.125.253",
        "port": 22,
        "user": "root",
        "pass": "Thiagutz061121@",
        "is_docker": False
    }
]

LOG_DIR = r"C:\Users\rguti\VPS_Health_Logs"
os.makedirs(LOG_DIR, exist_ok=True)
TODAY_STR = datetime.datetime.now().strftime("%Y-%m-%d")
LOG_FILE = os.path.join(LOG_DIR, f"vps_health_{TODAY_STR}.log")

def ssh_exec(client, command, timeout=25):
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        out = stdout.read().decode('utf-8', errors='replace').strip()
        err = stderr.read().decode('utf-8', errors='replace').strip()
        return out, err
    except Exception as e:
        return "", str(e)

def audit_server(srv):
    print("=" * 80)
    print(f"🛰️  INICIANDO DIAGNÓSTICO: {srv['name']} ({srv['host']})")
    print(f"📅  Fecha y Hora Local: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(
            hostname=srv['host'],
            port=srv['port'],
            username=srv['user'],
            password=srv['pass'],
            timeout=15
        )
        print(">> Conexión SSH establecida con éxito ✓\n")

        # 1. Uptime y Carga de CPU
        uptime_out, _ = ssh_exec(client, "uptime")
        cores_out, _ = ssh_exec(client, "nproc")
        print(f"📌 [1] Uptime & Load: {uptime_out}")
        print(f"    Cores CPU disponibles: {cores_out}\n")

        # 2. Memoria RAM y SWAP
        mem_out, _ = ssh_exec(client, "free -m -h")
        print("📌 [2] Uso de Memoria RAM & SWAP:")
        print(mem_out + "\n")

        # 3. Espacio en Disco
        disk_out, _ = ssh_exec(client, "df -h /")
        print("📌 [3] Espacio en Disco (Partición Root):")
        print(disk_out + "\n")

        # 4. Top Procesos por RAM
        top_mem, _ = ssh_exec(client, "ps aux --sort=-%mem | head -n 6")
        print("📌 [4] Top 5 Procesos por Consumo de RAM (%):")
        print(top_mem + "\n")

        # 5. Top Procesos por CPU
        top_cpu, _ = ssh_exec(client, "ps aux --sort=-%cpu | head -n 6")
        print("📌 [5] Top 5 Procesos por Consumo de CPU (%):")
        print(top_cpu + "\n")

        # 6. Servicios con Errores
        failed_units, _ = ssh_exec(client, "systemctl --failed --no-pager")
        print("📌 [6] Servicios del Sistema en Estado FAILED:")
        if "0 loaded units listed" in failed_units or not failed_units:
            print("    🟢 Ningún servicio en estado fallido.\n")
        else:
            print(failed_units + "\n")

        # 7. Si es entorno Docker (Contabo) o Systemd (Hostinger)
        if srv.get("is_docker"):
            docker_stats, _ = ssh_exec(client, "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}' | head -n 10")
            print("📌 [7] Estado de Contenedores Docker Principales:")
            print(docker_stats + "\n")
        else:
            petral_svc, _ = ssh_exec(client, "systemctl is-active geeksoft-engine")
            nginx_svc, _ = ssh_exec(client, "systemctl is-active nginx")
            print(f"📌 [7] Estado Servicios Core PETRAL:")
            print(f"    - geeksoft-engine (FastAPI): {petral_svc.upper()}")
            print(f"    - nginx: {nginx_svc.upper()}\n")

    except Exception as e:
        print(f"❌ ERROR al conectar o auditar {srv['name']}: {e}\n")
    finally:
        client.close()

def main():
    class Logger(object):
        def __init__(self, filename):
            self.terminal = sys.stdout
            self.log = open(filename, "a", encoding="utf-8")
        def write(self, message):
            self.terminal.write(message)
            self.log.write(message)
        def flush(self):
            self.terminal.flush()
            self.log.flush()

    sys.stdout = Logger(LOG_FILE)
    print(f"\n=======================================================")
    print(f"📋 REPORTE DIARIO DE SALUD DE SERVIDORES VPS")
    print(f"🕒 Inicio: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"=======================================================\n")

    for server in SERVERS:
        audit_server(server)

    print(f"✅ Diagnóstico completado. Log guardado en: {LOG_FILE}\n")

if __name__ == "__main__":
    main()
"""

target_py = r"C:\Users\rguti\APEFAC\scripts\monitor_vps_daily.py"
os.makedirs(os.path.dirname(target_py), exist_ok=True)
with open(target_py, 'w', encoding='utf-8') as f:
    f.write(script_py)

print(f" Script Python guardado en: {target_py}")
