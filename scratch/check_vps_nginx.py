import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST  = "91.108.125.253"
VPS_PORT  = 22
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

def check():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("SSH Conectado.")
        
        # Listar archivos
        stdin, stdout, stderr = client.exec_command("ls -la /etc/nginx/sites-enabled/")
        print("=== /etc/nginx/sites-enabled/ ===")
        print(stdout.read().decode())
        
        # Leer archivo de forecast.geeksoft.tech
        stdin, stdout, stderr = client.exec_command("cat /etc/nginx/sites-available/forecast.geeksoft.tech")
        print("=== /etc/nginx/sites-available/forecast.geeksoft.tech ===")
        print(stdout.read().decode())
        
        # Verificar certificados existentes
        stdin, stdout, stderr = client.exec_command("ls -la /etc/letsencrypt/live/")
        print("=== /etc/letsencrypt/live/ ===")
        print(stdout.read().decode())
        
    except Exception as e:
        print("Error:", e)
    finally:
        client.close()

if __name__ == "__main__":
    check()
