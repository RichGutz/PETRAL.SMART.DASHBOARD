import json
import paramiko

creds_file = r"C:\Users\rguti\.gemini\antigravity-ide\scratch\contabo_credentials.json"
with open(creds_file, "r", encoding="utf-8") as f:
    creds = json.load(f)

contabo_info = creds.get("contabo_vps", {})
vps_ip = contabo_info.get("ip", "169.58.168.107")
vps_user = contabo_info.get("user", "root")
vps_pass = contabo_info.get("pass")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(vps_ip, username=vps_user, password=vps_pass, timeout=10)

# Inspect labels of apefac_risk_core_frontend and inandes
stdin, stdout, stderr = client.exec_command("docker inspect apefac_risk_core_frontend --format '{{json .Config.Labels}}'")
print("APEFAC LABELS:")
print(stdout.read().decode('utf-8'))

stdin, stdout, stderr = client.exec_command("docker inspect 3g5kcala3ypqzlsrhyelxyev-202421170789 --format '{{json .Config.Labels}}'")
print("INANDES BACKEND LABELS:")
print(stdout.read().decode('utf-8'))

client.close()
