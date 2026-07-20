import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('91.108.125.253', 22, 'root', 'Thiagutz061121@')
stdin, stdout, stderr = client.exec_command('curl -vk https://localhost/dashboard -H "Host: forecast.geeksoft.tech"')
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
client.close()
