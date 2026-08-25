import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = "91.108.125.253"
USER = "root"
PASS = "Thiagutz061121@"

print(f"Conectando a VPS Hostinger ({HOST})...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, 22, USER, PASS, timeout=15)
print(">> Conectado por SSH.\n")

def exec(cmd, title):
    print("=" * 65)
    print(f"📌 {title}")
    print("=" * 65)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=20)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    if err:
        print(f"[stderr]: {err}")
    print()

# 1. Detener y deshabilitar servicios systemd
exec("systemctl stop inandes-api inandes-backend erp_inandes && systemctl disable inandes-api inandes-backend erp_inandes", "DETENER Y DESHABILITAR SERVICIOS SYSTEMD INANDES")

# 2. Terminar cualquier proceso residual
exec("pkill -9 -f '/opt/erp_inandes' || true", "KILL PROCESOS RESIDUALES /opt/erp_inandes")

# 3. Verificar estado de los servicios inandes
exec("systemctl is-active inandes-api inandes-backend erp_inandes || true", "ESTADO ACTIVE INANDES SERVICES")
exec("systemctl is-enabled inandes-api inandes-backend erp_inandes || true", "ESTADO ENABLED INANDES SERVICES")

# 4. Verificar procesos en ejecución
exec("ps aux | grep -i inandes | grep -v grep || echo '>> Cero procesos inandes en ejecución ✓'", "VERIFICACIÓN PROCESOS INANDES ACTIVOS")

# 5. Verificar nueva memoria RAM disponible
exec("free -m -h", "NUEVO ESTADO DE MEMORIA RAM & SWAP")

# 6. Verificar servicios PETRAL SMART DASHBOARD
exec("systemctl is-active geeksoft-engine nginx", "ESTADO SERVICIOS PETRAL (GEEKSOFT-ENGINE & NGINX)")

client.close()
