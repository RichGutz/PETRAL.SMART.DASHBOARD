import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def setup():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('91.108.125.253', port=22, username='root', password='Thiagutz061121@', timeout=10)
    
    print("[1/2] Instalando playwright en el entorno virtual de Python...")
    stdin, stdout, stderr = client.exec_command("/opt/geeksoft_engine/venv/bin/pip install playwright")
    print(stdout.read().decode('utf-8', errors='replace')[:300])
    
    print("[2/2] Instalando binarios de Chromium con dependencias del sistema...")
    stdin, stdout, stderr = client.exec_command("/opt/geeksoft_engine/venv/bin/playwright install --with-deps chromium")
    print(stdout.read().decode('utf-8', errors='replace')[:400])
    
    client.close()

if __name__ == "__main__":
    setup()
