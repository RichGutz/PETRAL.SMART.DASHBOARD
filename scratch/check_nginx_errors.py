import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST  = "91.108.125.253"
VPS_PORT  = 22
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
    
    # Obtener últimas 30 líneas del error log de nginx
    stdin, stdout, stderr = client.exec_command("tail -n 30 /var/log/nginx/error.log")
    print("--- Nginx Error Logs ---")
    print(stdout.read().decode('utf-8', errors='replace'))
    
    client.close()
except Exception as e:
    print("Error SSH:", e)
