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
    
    # Obtener estado de geeksoft-engine
    stdin, stdout, stderr = client.exec_command("systemctl status geeksoft-engine")
    status_text = stdout.read().decode('utf-8', errors='replace')
    print("--- Service Status ---")
    print(status_text)
    
    # Obtener las últimas 30 líneas del log de systemd para el servicio
    stdin, stdout, stderr = client.exec_command("journalctl -u geeksoft-engine -n 50")
    logs_text = stdout.read().decode('utf-8', errors='replace')
    print("\n--- Recent Logs ---")
    print(logs_text)
    
    client.close()
except Exception as e:
    print("Error SSH:", e)
