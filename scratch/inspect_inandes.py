import json
import paramiko

creds_file = r"C:\Users\rguti\.gemini\antigravity-ide\scratch\contabo_credentials.json"
with open(creds_file, "r", encoding="utf-8") as f:
    creds = json.load(f)

contabo_info = creds.get("contabo_vps", {})
vps_ip = contabo_info.get("ip")
vps_user = contabo_info.get("user")
vps_pass = contabo_info.get("pass")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(vps_ip, username=vps_user, password=vps_pass, timeout=10)

stdin, stdout, stderr = client.exec_command("docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'")
print("=== CONTABO RUNNING CONTAINERS ===")
print(stdout.read().decode('utf-8'))

# Check coolify applications and docker compose files
stdin, stdout, stderr = client.exec_command("ls -la /data/coolify/applications || ls -la /artifacts || true")
print("=== APPLICATION DIRECTORIES ===")
print(stdout.read().decode('utf-8'))

client.close()
