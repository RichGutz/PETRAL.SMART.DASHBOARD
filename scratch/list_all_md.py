import paramiko

VPS_HOST  = "91.108.125.253"
VPS_PORT  = 22
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

def list_all_md():
    print("Conectando al VPS...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Conexion SSH establecida.")

        # Listar todos los archivos .md en /opt
        print("\n--- Todos los archivos .md en /opt ---")
        stdin, stdout, stderr = client.exec_command("find /opt -name '*.md' 2>/dev/null")
        res = stdout.read().decode('utf-8').strip()
        print(res if res else "(Ninguno)")

        # Listar el contenido de directorios en /opt para ver si hay carpetas de Obsidian o documentacion
        print("\n--- Estructura de carpetas en /opt ---")
        stdin, stdout, stderr = client.exec_command("ls -la /opt /opt/geeksoft_engine /opt/forecast_petral 2>/dev/null")
        print(stdout.read().decode('utf-8').strip())

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    list_all_md()
