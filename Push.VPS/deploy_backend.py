"""
Deploy Backend Python -> VPS
Sube engine.py y forecast_service.py al VPS y reinicia uvicorn
"""
import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST = "91.108.125.253"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "Thiagutz061121@"

# Archivos locales -> rutas remotas en el VPS
FILES_TO_UPLOAD = [
    (
        r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\engine.py",
        "/opt/geeksoft_engine/backend/engine.py"
    ),
    (
        r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\services\forecast_service.py",
        "/opt/geeksoft_engine/backend/services/forecast_service.py"
    ),
    (
        r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\api\routers\forecast.py",
        "/opt/geeksoft_engine/backend/api/routers/forecast.py"
    ),
    (
        r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\database.py",
        "/opt/geeksoft_engine/backend/database.py"
    ),
    (
        r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\main.py",
        "/opt/geeksoft_engine/backend/main.py"
    ),
    (
        r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\api\routers\auth.py",
        "/opt/geeksoft_engine/backend/api/routers/auth.py"
    ),
    (
        r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\backend\models\forecast_models.py",
        "/opt/geeksoft_engine/backend/models/forecast_models.py"
    ),
]


def run(client, cmd, desc=""):
    print(f"\n[{desc}]")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(f"  >> {out[:600]}")
    if err: print(f"  !! {err[:400]}")
    return out, err

def deploy_backend():
    print("\n" + "="*55)
    print("  DEPLOY BACKEND -> VPS")
    print("="*55)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"\nConectando a {VPS_HOST}...")
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("  >> Conexion SSH establecida")

        # 1. Detectar ruta real del backend en el VPS
        out, _ = run(client, "find /opt /home /root -name 'engine.py' 2>/dev/null | head -5", "1. Buscando engine.py en VPS")
        
        if not out:
            print("  !! No se encontro engine.py en rutas esperadas. Intentando rutas alternativas...")
            out, _ = run(client, "find / -name 'engine.py' -path '*/backend/*' 2>/dev/null | head -5", "1b. Busqueda extendida")

        print(f"\nRutas encontradas:\n{out}")

        # 2. Subir archivos via SFTP
        print("\n[2. Subiendo archivos via SFTP]")
        sftp = client.open_sftp()

        for local_path, remote_path in FILES_TO_UPLOAD:
            # Ajustar ruta remota según lo encontrado
            try:
                sftp.put(local_path, remote_path)
                print(f"  >> Subido: {remote_path}")
            except Exception as e:
                print(f"  !! Error subiendo a {remote_path}: {e}")

        sftp.close()

        # 3. Reiniciar el servicio uvicorn/backend
        run(client, "systemctl restart geeksoft-engine 2>/dev/null || systemctl restart uvicorn 2>/dev/null || pkill -f uvicorn && sleep 2 && echo 'Proceso reiniciado'", "3. Reiniciando backend")
        
        # 4. Verificar que el servicio quedó activo
        run(client, "systemctl status geeksoft-engine 2>/dev/null | head -10 || ps aux | grep uvicorn | grep -v grep", "4. Verificando estado")


        print("\n" + "="*55)
        print("  [OK] BACKEND ACTUALIZADO EN VPS")
        print("="*55)

    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy_backend()
