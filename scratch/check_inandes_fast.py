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
    stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    else:
        print("(Sin registros)")
    print()

exec("journalctl -u inandes-backend -n 25 --no-pager", "ÚLTIMOS LOGS INANDES-BACKEND (8010)")
exec("journalctl -u inandes-api -n 10 --no-pager", "ÚLTIMOS LOGS INANDES-API (run_fastapi.py)")
exec("grep -E 'inandes|8010|8501' /var/log/nginx/access.log | tail -n 15", "LOGS NGINX RECIENTES")

client.close()
