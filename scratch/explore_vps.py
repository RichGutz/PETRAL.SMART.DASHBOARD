import paramiko

VPS_HOST  = "91.108.125.253"
VPS_PORT  = 22
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

def explore():
    print("Conectando al VPS...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Conexion SSH establecida.")

        # Buscar todos los archivos .md en el VPS
        print("\n--- Buscando archivos .md en /opt ---")
        stdin, stdout, stderr = client.exec_command("find /opt -name '*.md' 2>/dev/null")
        print(stdout.read().decode('utf-8').strip())

        print("\n--- Buscando archivos .md en /var/www o /usr/share/nginx ---")
        stdin, stdout, stderr = client.exec_command("find /var/www /usr/share/nginx -name '*.md' 2>/dev/null")
        print(stdout.read().decode('utf-8').strip())

        print("\n--- Buscando archivos con palabra 'Lanzamiento' en el nombre ---")
        stdin, stdout, stderr = client.exec_command("find / -iname '*Lanzamiento*' 2>/dev/null")
        print(stdout.read().decode('utf-8').strip())

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    explore()
