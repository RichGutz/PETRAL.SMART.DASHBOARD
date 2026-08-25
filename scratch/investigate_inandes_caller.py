import sys
import paramiko
import urllib.request
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. Check IP info
for ip in ['38.25.30.48', '190.234.182.191']:
    try:
        url = f"https://ipinfo.io/{ip}/json"
        req = urllib.request.urlopen(url, timeout=5)
        data = json.loads(req.read().decode('utf-8'))
        print(f"📌 IP {ip}:")
        print(f"   Org/ISP: {data.get('org')}")
        print(f"   City/Region: {data.get('city')}, {data.get('region')}, {data.get('country')}")
        print(f"   Hostname: {data.get('hostname')}")
    except Exception as e:
        print(f"Error checking {ip}: {e}")

print()

# 2. Check Nginx logs on Hostinger for inandes requests yesterday
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('91.108.125.253', 22, 'root', 'Thiagutz061121@', timeout=15)

def exec(cmd, title):
    print("=" * 60)
    print(f"📌 {title}")
    print("=" * 60)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    else:
        print("(Sin registros)")
    print()

exec("zgrep -h 'generate-pdf' /var/log/nginx/* 2>/dev/null | tail -n 25", "LOGS NGINX CON DETALLES DE USER-AGENT Y REFERER")
exec("cat /etc/nginx/sites-enabled/* | grep -B 2 -A 5 '8010'", "DOMINIOS ACTIVOS APUNTANDO A 8010")

client.close()
