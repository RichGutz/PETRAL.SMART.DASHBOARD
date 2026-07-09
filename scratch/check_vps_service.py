import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def check_service():
    VPS_HOST = "91.108.125.253"
    VPS_PORT = 22
    VPS_USER = "root"
    VPS_PASS = "Thiagutz061121@"
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Conectado. Leyendo /etc/systemd/system/geeksoft-engine.service...")
        
        stdin, stdout, stderr = client.exec_command("cat /etc/systemd/system/geeksoft-engine.service 2>/dev/null || cat /lib/systemd/system/geeksoft-engine.service 2>/dev/null")
        content = stdout.read().decode("utf-8", errors="replace").strip()
        
        if content:
            print("\n--- Contenido del Servicio ---")
            print(content)
        else:
            print("No se encontró el archivo del servicio. Buscando carpetas de venv...")
            stdin, stdout, stderr = client.exec_command("find /opt/geeksoft_engine -name 'activate' -o -name 'pip'")
            print(stdout.read().decode("utf-8").strip())
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    check_service()
