import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('91.108.125.253', 22, 'root', 'Thiagutz061121@')

print("--- 1. ARCHIVOS EN /opt/forecast_petral/assets/ ---")
stdin, stdout, stderr = client.exec_command('ls -la /opt/forecast_petral/assets/')
print(stdout.read().decode('utf-8'))

print("--- 2. CONTENIDO DE /opt/forecast_petral/index.html ---")
stdin, stdout, stderr = client.exec_command('cat /opt/forecast_petral/index.html')
print(stdout.read().decode('utf-8'))

print("--- 3. CONFIGURACIÓN NGINX PARA FORECAST.GEEKSOFT.TECH ---")
stdin, stdout, stderr = client.exec_command('cat /etc/nginx/sites-enabled/forecast.geeksoft.tech')
print(stdout.read().decode('utf-8'))

print("--- 4. BUSCAR OTROS DIRECTORIOS DE FORECAST EN EL VPS ---")
stdin, stdout, stderr = client.exec_command('ls -la /var/www/ | grep forecast || true')
print(stdout.read().decode('utf-8'))

client.close()
