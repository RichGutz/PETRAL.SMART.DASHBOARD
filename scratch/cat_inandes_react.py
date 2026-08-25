import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('91.108.125.253', 22, 'root', 'Thiagutz061121@', timeout=15)

stdin, stdout, stderr = client.exec_command('cat /etc/nginx/sites-available/inandes.react.geeksoft.tech', timeout=10)
print(stdout.read().decode('utf-8', errors='replace'))

client.close()
