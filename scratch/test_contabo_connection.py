import json
import os
import paramiko

creds_file = r"C:\Users\rguti\.gemini\antigravity-ide\scratch\contabo_credentials.json"
with open(creds_file, "r", encoding="utf-8") as f:
    creds = json.load(f)

contabo_info = creds.get("contabo_vps", {})
vps_ip = contabo_info.get("ip", "169.58.168.107")
vps_user = contabo_info.get("user", "root")
vps_pass = contabo_info.get("pass")
vps_port = int(contabo_info.get("port", 22))

print(f"Connecting to Contabo VPS at {vps_ip}:{vps_port} as {vps_user}...")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(vps_ip, port=vps_port, username=vps_user, password=vps_pass, timeout=15)
    print("SSH Connection to Contabo SUCCESSFUL!\n")
    
    # 1. Docker Containers
    print("=== DOCKER CONTAINERS (docker ps -a) ===")
    stdin, stdout, stderr = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
    print(stdout.read().decode('utf-8', errors='replace'))
    
    # 2. Web Servers / Ports
    print("=== LISTENING PORTS (ss -tulpn) ===")
    stdin, stdout, stderr = client.exec_command("ss -tulpn | grep -E 'LISTEN'")
    print(stdout.read().decode('utf-8', errors='replace'))
    
    # 3. Traefik / Nginx / Coolify
    print("=== PROXY / COOLIFY STATUS ===")
    stdin, stdout, stderr = client.exec_command("docker ps | grep -E 'coolify|traefik|nginx'")
    print(stdout.read().decode('utf-8', errors='replace'))
    
    client.close()
except Exception as e:
    print(f"Connection failed: {e}")
