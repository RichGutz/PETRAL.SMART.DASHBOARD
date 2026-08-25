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

exec("journalctl -u inandes-api -n 25 --no-pager", "ÚLTIMOS LOGS INANDES-API")
exec("journalctl -u inandes-backend -n 25 --no-pager", "ÚLTIMOS LOGS INANDES-BACKEND")
exec("grep -rn '8010' /etc/nginx/ /etc/caddy/ 2>/dev/null; grep -rn '8501' /etc/nginx/ /etc/caddy/ 2>/dev/null", "CONFIGURACIÓN DE PROXY NGINX/CADDY PARA INANDES")
exec("ls -lart /opt/erp_inandes/ /opt/erp_inandes/logs 2>/dev/null", "ARCHIVOS / LOGS EN /opt/erp_inandes/")

client.close()
