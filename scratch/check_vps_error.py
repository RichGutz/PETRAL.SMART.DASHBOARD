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

stdin, stdout, stderr = client.exec_command("journalctl -u geeksoft-engine.service -n 50 --no-pager")
print(stdout.read().decode("utf-8", errors="replace"))
client.close()
