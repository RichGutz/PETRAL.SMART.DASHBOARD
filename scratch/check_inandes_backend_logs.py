import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('91.108.125.253', 22, 'root', 'Thiagutz061121@', timeout=15)

def exec(cmd, title):
    print("=" * 60)
    print(f"📌 {title}")
    print("=" * 60)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    else:
        print("(Sin registros)")
    print()

exec("journalctl -u inandes-backend --since '2026-08-01' | grep -v 'Started' | grep -v 'Stopped' | tail -n 20", "ÚLTIMOS REQUESTS INANDES-BACKEND (8010)")
exec("grep -rn 'inandes' /var/log/nginx/access.log* | tail -n 15", "LOGS NGINX DOMINIO INANDES")

client.close()
