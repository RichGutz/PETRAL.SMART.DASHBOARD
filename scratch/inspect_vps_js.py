import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('91.108.125.253', 22, 'root', 'Thiagutz061121@')

stdin, stdout, stderr = client.exec_command('grep -o "Auditoría PDF Liquidaciones" /opt/forecast_petral/assets/index-BqAJcWKV.js || echo "NOT FOUND IN JS"')
print("Auditoría PDF in JS:", stdout.read().decode('utf-8').strip())

stdin, stdout, stderr = client.exec_command('grep -o "Spaguetti Map" /opt/forecast_petral/assets/index-BqAJcWKV.js || echo "NOT FOUND IN JS"')
print("Spaguetti Map (with u) in JS:", stdout.read().decode('utf-8').strip())

stdin, stdout, stderr = client.exec_command('grep -o "Spaghetti Map" /opt/forecast_petral/assets/index-BqAJcWKV.js || echo "NOT FOUND IN JS"')
print("Spaghetti Map (with h) in JS:", stdout.read().decode('utf-8').strip())

client.close()
