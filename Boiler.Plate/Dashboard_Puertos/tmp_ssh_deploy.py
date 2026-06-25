import paramiko

host = "91.108.125.253"
user = "root"
password = "N4pee0BVZsL@r6dJz4R+"
command = "cd /files_repo && git fetch --all && git reset --hard origin/main && sh update.sh"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=password, timeout=15)
stdin, stdout, stderr = client.exec_command(command)
print(stdout.read().decode())
client.close()
