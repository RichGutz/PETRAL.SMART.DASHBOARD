"""
Verifica y reinicia el backend en el VPS
"""
import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST = "91.108.125.253"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Thiagutz061121@"

def run(client, cmd, desc=""):
    print(f"\n[{desc}]")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(f"  >> {out[:800]}")
    if err: print(f"  !! {err[:400]}")
    return out, err

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
print("Conectado al VPS")

# Ver todos los servicios systemd activos
run(client, "systemctl list-units --type=service --state=running | grep -i -E 'geek|uvicorn|petral|fastapi|python'", "Servicios activos relacionados")

# Ver procesos uvicorn corriendo
run(client, "ps aux | grep -i uvicorn | grep -v grep", "Procesos uvicorn")

# Ver todos los servicios de systemd disponibles
run(client, "systemctl list-unit-files | grep -i -E 'geek|uvicorn|petral|engine'", "Servicios systemd registrados")

# Puerto 8000 escuchando?
run(client, "ss -tlnp | grep 8000", "Puerto 8000")

client.close()
