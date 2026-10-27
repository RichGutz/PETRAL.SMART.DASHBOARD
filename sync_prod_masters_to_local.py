"""
Sync Prod Masters to Local (Petral Digital Twin - Fase 1)
Descarga el volcado atómico .sql.gz de Contabo y extrae los snapshots JSON de todas las tablas.
"""
import os
import sys
import json
import gzip
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD"
LOCAL_DB_DIR = os.path.join(ROOT_DIR, "Desarrollo.Profesional", "Local_Database")
JSON_DIR = os.path.join(LOCAL_DB_DIR, "json_tables")
os.makedirs(JSON_DIR, exist_ok=True)

CONTABO_IP = "169.58.168.107"
CONTABO_USER = "root"
CONTABO_PASS = "VivaLaVida2026$"

print("=" * 70)
print("🚀 FASE 1: CLONACIÓN DE PRODUCCIÓN CONTABO A ENTORNO LOCAL")
print(f"Destino local: {LOCAL_DB_DIR}")
print("=" * 70)

# 1. Conexión SSH / SFTP
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(CONTABO_IP, port=22, username=CONTABO_USER, password=CONTABO_PASS, timeout=30)
sftp = ssh.open_sftp()

# 2. Descargar el último dump .sql.gz generado hoy
remote_dump = "/opt/backups_guardados/backup_petral_one_20261027_005758.sql.gz"
local_dump = os.path.join(LOCAL_DB_DIR, "backup_petral_one_latest.sql.gz")

print(f"\n[1/3] Descargando volcado de BD ({remote_dump}) vía SFTP...")
sftp.get(remote_dump, local_dump)
dump_size_mb = os.path.getsize(local_dump) / (1024 * 1024)
print(f"  >> Dump descargado exitosamente: {local_dump} ({dump_size_mb:.2f} MB) ✓")

# 3. Extraer tablas en JSON estructurado ejecutando un extractor atómico dentro del contenedor
print("\n[2/3] Extrayendo tablas maestras y comerciales desde PostgreSQL Contabo...")
export_script = '''
import json
import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect("postgresql://postgres:X1OnKpQoSSsFK7JOGLnsx4YjD83zA7wx@10.0.1.16:5432/petral_db")
cur = conn.cursor(cursor_factory=RealDictCursor)

tables = [
    "vessels", "ports", "terminals", "distances", "routes",
    "port_cost_tariffs", "port_cost_rules", "clients",
    "bunker_invoices", "bunker_bunkering_events", "bunker_prices",
    "routes_quotes", "routes_clients", "contracts", "commercial_forecasts",
    "user_permissions", "users"
]

manifest = {}
for t in tables:
    try:
        cur.execute(f"SELECT * FROM {t};")
        rows = cur.fetchall()
        # Convertir objetos especiales a str
        clean_rows = []
        for r in rows:
            clean_r = {}
            for k, v in r.items():
                clean_r[k] = str(v) if hasattr(v, "isoformat") else v
            clean_rows.append(clean_r)
        
        with open(f"/tmp/{t}.json", "w", encoding="utf-8") as f:
            json.dump(clean_rows, f, ensure_ascii=False, default=str)
        manifest[t] = len(clean_rows)
    except Exception as e:
        manifest[t] = f"Error: {e}"

print(json.dumps(manifest))
conn.close()
'''

with sftp.file('/tmp/export_tables.py', 'w') as f:
    f.write(export_script)

stdin, stdout, stderr = ssh.exec_command("docker exec -i petral-backend python3 - < /tmp/export_tables.py")
manifest_str = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()

try:
    manifest = json.loads(manifest_str)
    print("\n  Registros extraídos por tabla:")
    for t, count in manifest.items():
        print(f"    • {t:25}: {count} filas")
except Exception as e:
    print("  Manifest raw:", manifest_str)
    if err:
        print("  Stderr:", err)

# 4. Descargar los JSONs a local
print(f"\n[3/3] Transfiriendo tablas JSON a {JSON_DIR}...")
for t in ["vessels", "ports", "terminals", "distances", "routes", "port_cost_tariffs", "port_cost_rules", "clients", "bunker_invoices", "bunker_bunkering_events", "bunker_prices", "routes_quotes", "routes_clients", "contracts", "commercial_forecasts", "user_permissions", "users"]:
    try:
        remote_json = f"/tmp/{t}.json"
        local_json = os.path.join(JSON_DIR, f"{t}.json")
        # Copiar desde el contenedor al host primero si es necesario
        ssh.exec_command(f"docker cp petral-backend:{remote_json} {remote_json} 2>/dev/null || true")
        sftp.get(remote_json, local_json)
    except Exception as ex:
        pass

sftp.close()
ssh.close()

# Validar archivos descargados
downloaded = [f for f in os.listdir(JSON_DIR) if f.endswith(".json")]
print(f"\n✅ FASE 1 COMPLETADA: {len(downloaded)} tablas JSON descargadas en local:")
for f in downloaded:
    sz_kb = os.path.getsize(os.path.join(JSON_DIR, f)) / 1024
    print(f"  ✓ {f:30} ({sz_kb:8.2f} KB)")
print(f"\nVolcado completo SQL: {local_dump} ({dump_size_mb:.2f} MB)")
