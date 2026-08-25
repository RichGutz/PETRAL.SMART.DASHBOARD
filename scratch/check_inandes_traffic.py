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

exec("cat /etc/nginx/sites-available/erp_inandes", "CONFIGURACIÓN ERP_INANDES NGINX")
exec("tail -n 20 /var/log/nginx/access.log | grep -i inandes || tail -n 20 /var/log/nginx/access.log", "ÚLTIMOS ACCESS LOGS NGINX")
exec("tail -n 20 /opt/erp_inandes/streamlit_gateway.log 2>/dev/null", "LOG STREAMLIT GATEWAY")
exec("journalctl -u inandes-api --since '2026-08-01' | grep -v 'Started' | grep -v 'Stopped' | tail -n 25", "LOGS REALES DE TRÁFICO EN INANDES-API DESDE AGOSTO")

client.close()
