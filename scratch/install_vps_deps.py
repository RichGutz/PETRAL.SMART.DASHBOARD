import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def install_deps():
    VPS_HOST = "91.108.125.253"
    VPS_PORT = 22
    VPS_USER = "root"
    VPS_PASS = "Thiagutz061121@"
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Conectando a {VPS_HOST} vía SSH...")
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Conexión exitosa. Instalando psycopg2-binary en el entorno virtual del VPS...")
        
        # Ejecutar la instalación dentro del entorno virtual
        cmd = "/opt/geeksoft_engine/venv/bin/pip install psycopg2-binary"
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        
        out = stdout.read().decode("utf-8", errors="replace").strip()
        err = stderr.read().decode("utf-8", errors="replace").strip()
        
        if out: print(f"Salida:\n{out}")
        if err: print(f"Errores/Advertencias:\n{err}")
        
        print("\nReiniciando backend (geeksoft_engine)...")
        stdin_restart, stdout_restart, stderr_restart = client.exec_command("systemctl restart geeksoft_engine")
        restart_err = stderr_restart.read().decode("utf-8").strip()
        if restart_err:
            print(f"Error al reiniciar: {restart_err}")
        else:
            print("Servicio reiniciado exitosamente.")
        
        print("\nVerificando estado actual del servicio systemd...")
        stdin, stdout, stderr = client.exec_command("systemctl status geeksoft_engine | head -15")
        print(stdout.read().decode("utf-8", errors="replace").strip())
        
        print("\n¡Instalación y reinicio finalizados!")
    except Exception as e:
        print(f"Ocurrió un error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    install_deps()
