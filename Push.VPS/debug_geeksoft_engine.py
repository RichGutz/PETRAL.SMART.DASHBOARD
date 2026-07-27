import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST = "91.108.125.253"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Thiagutz061121@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)

def run(cmd, desc=""):
    print(f"\n--- {desc} ---")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out)
    if err: print(err)

run("systemctl status geeksoft-engine.service", "Status de geeksoft-engine")
run("journalctl -u geeksoft-engine.service -n 40 --no-pager", "Últimos logs de geeksoft-engine")
run("systemctl restart geeksoft-engine.service", "Reiniciando geeksoft-engine")
run("systemctl status geeksoft-engine.service", "Nuevo status de geeksoft-engine")

client.close()
