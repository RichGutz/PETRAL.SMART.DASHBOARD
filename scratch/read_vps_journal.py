import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def get_traceback():
    VPS_HOST = "91.108.125.253"
    VPS_PORT = 22
    VPS_USER = "root"
    VPS_PASS = "Thiagutz061121@"
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Conectado. Obteniendo últimas 50 líneas del log de python...")
        
        # Filtrar líneas de error de uvicorn/fastapi
        stdin, stdout, stderr = client.exec_command("journalctl -u geeksoft-engine -n 60 --no-pager")
        print(stdout.read().decode("utf-8", errors="replace").strip())
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    get_traceback()
