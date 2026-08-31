import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def check_playwright():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('91.108.125.253', port=22, username='root', password='Thiagutz061121@', timeout=10)
    
    cmd = "/opt/geeksoft_engine/venv/bin/python3 -c 'from playwright.sync_api import sync_playwright; print(\"OK_PLAYWRIGHT\")'"
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    print("STATUS PLAYWRIGHT:", out, err)
    
    if "OK_PLAYWRIGHT" not in out:
        print("Instalando navegadores playwright...")
        stdin, stdout, stderr = client.exec_command("/opt/geeksoft_engine/venv/bin/playwright install --with-deps chromium")
        print("OUT INSTALL:", stdout.read().decode('utf-8', errors='replace')[:400])
        print("ERR INSTALL:", stderr.read().decode('utf-8', errors='replace')[:400])
        
    client.close()

if __name__ == "__main__":
    check_playwright()
