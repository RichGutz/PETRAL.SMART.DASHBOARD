import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST  = "91.108.125.253"
VPS_PORT  = 22
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)

def run(cmd):
    print(f"\n--- CMD: {cmd} ---")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out)
    if err: print("STDERR:", err)

run("systemctl status geeksoft-engine")
run("cat /etc/systemd/system/geeksoft-engine.service")
run("grep -n 'process_ballast_leg' /opt/geeksoft_engine/backend/spot_engine.py")
run("grep -n 'process_ballast_leg' /opt/forecast_petral/backend/spot_engine.py || true")
run("systemctl restart geeksoft-engine")
client.close()
