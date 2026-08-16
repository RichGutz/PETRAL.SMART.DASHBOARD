import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('91.108.125.253', 22, 'root', 'Thiagutz061121@')

stdin, stdout, stderr = client.exec_command('ls -la /etc/nginx/sites-enabled/')
print("SITES ENABLED:")
print(stdout.read().decode('utf-8'))

stdin, stdout, stderr = client.exec_command('cat /etc/nginx/sites-enabled/forecast.geeksoft.tech')
print("\nCONFIG FORECAST.GEEKSOFT.TECH:")
print(stdout.read().decode('utf-8'))

stdin, stdout, stderr = client.exec_command('cat /etc/nginx/sites-enabled/forecast.geeksoft.pe 2>/dev/null || echo "No pe config"')
print("\nCONFIG FORECAST.GEEKSOFT.PE:")
print(stdout.read().decode('utf-8'))

client.close()
