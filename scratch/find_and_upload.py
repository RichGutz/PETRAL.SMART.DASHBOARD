import paramiko
import os

VPS_HOST  = "91.108.125.253"
VPS_PORT  = 22
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

LOCAL_FILE = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.1\DashBoardPetral\Lanzamiento.Local.y.VPS.md"

def find_and_upload():
    print("Conectando al VPS...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("Conexion SSH establecida.")

        # Realizamos busquedas muy amplias y flexibles
        search_commands = [
            "find /opt -iname '*Lanzamiento*' -name '*.md'",
            "find /opt -iname '*vps*' -name '*.md'",
            "find / -iname '*Lanzamiento*Local*y*VPS*'",
            "find / -iname '*Lanzamiento*Local*'",
            "find / -name '*Lanzamiento.Local.y.VPS.md*'"
        ]

        paths = set()
        for cmd in search_commands:
            print(f"Ejecutando busqueda: {cmd}")
            stdin, stdout, stderr = client.exec_command(f"{cmd} 2>/dev/null")
            res = stdout.read().decode('utf-8').strip().split('\n')
            for p in res:
                if p:
                    paths.add(p)

        paths = list(paths)

        if not paths:
            print("No se encontro ninguna coincidencia con las busquedas flexibles.")
            # Si no existe, lo subimos a un directorio logico en el motor
            fallback_dir = "/opt/geeksoft_engine/docs"
            client.exec_command(f"mkdir -p {fallback_dir}")
            remote_path = f"{fallback_dir}/Lanzamiento.Local.y.VPS.md"
            print(f"Subiendo a ruta por defecto: {remote_path}...")
            sftp = client.open_sftp()
            sftp.put(LOCAL_FILE, remote_path)
            sftp.close()
            print("Subido exitosamente en ruta por defecto.")
            return

        for remote_path in paths:
            print(f"Encontrado archivo compatible en VPS: {remote_path}")
            print(f"Subiendo {LOCAL_FILE} -> {remote_path}...")
            
            sftp = client.open_sftp()
            sftp.put(LOCAL_FILE, remote_path)
            sftp.close()
            print("Subido exitosamente.")

    except Exception as e:
        print(f"Error durante el proceso: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    find_and_upload()
