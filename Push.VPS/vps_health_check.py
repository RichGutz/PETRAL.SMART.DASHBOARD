"""
Script de Salud y Diagnóstico de Rendimiento del VPS (91.108.125.253)
"""
import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST = "91.108.125.253"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Thiagutz061121@"

def run_cmd(client, cmd, title):
    print("=" * 70)
    print(f" 📊 {title}")
    print("=" * 70)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out:
        print(out)
    if err:
        print(f" [stderr]: {err}")
    print()

def main():
    print(f"Conectando a {VPS_HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print(">> Conexión SSH exitosa ✓\n")
        
        # 1. Uptime y Carga General
        run_cmd(client, "uptime", "UPTIME & CARGA GENERAL (LOAD AVERAGE)")

        # 2. Uso de Memoria RAM
        run_cmd(client, "free -m -h", "USO DE MEMORIA RAM & SWAP")

        # 3. Top 15 Procesos que Más CPU Consumen
        run_cmd(client, "ps aux --sort=-%cpu | head -n 16", "TOP 15 PROCESOS POR CONSUMO DE CPU (%)")

        # 4. Top 10 Procesos que Más Memoria Consumen
        run_cmd(client, "ps aux --sort=-%mem | head -n 11", "TOP 10 PROCESOS POR CONSUMO DE RAM (%)")

        # 5. Espacio en Disco
        run_cmd(client, "df -h /", "ESPACIO EN DISCO (ROOT)")

        # 6. Estado de los Servicios Core
        run_cmd(client, "systemctl status geeksoft-engine --no-pager -l | head -n 15", "ESTADO SERVICIO GEEKSOFT-ENGINE (FASTAPI)")
        run_cmd(client, "systemctl status nginx --no-pager -l | head -n 15", "ESTADO SERVICIO NGINX")

    except Exception as e:
        print(f"Error conectando al VPS: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    main()
