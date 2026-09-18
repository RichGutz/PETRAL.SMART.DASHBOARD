import sys
import os
sys.path.append(os.path.abspath(r"Desarrollo.Profesional\Geeksoft_Engine"))
from backend.database import get_db_connection
from datetime import datetime, timezone

try:
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, user_email, device_name, device_fingerprint, status, created_at FROM user_authorized_devices ORDER BY created_at DESC LIMIT 10;")
    rows = cur.fetchall()
    print("Dispositivos actuales en Device Vault:")
    for r in rows:
        print(r)

    # Actualizar dispositivos a APPROVED
    now_utc = datetime.now(timezone.utc)
    cur.execute("DELETE FROM user_authorized_devices WHERE device_fingerprint = 'DEV-TEST-RANDOM-999';")
    cur.execute("""
        UPDATE user_authorized_devices
        SET status = 'APPROVED', approved_by = 'MASTER_DEVELOPER_OVERRIDE', approved_at = %s
        WHERE status != 'APPROVED' OR status IS NULL;
    """, (now_utc,))

    updated = cur.rowcount
    conn.commit()
    print(f"\n[OK] Se han aprobado {updated} dispositivo(s) en la Base de Datos.")

    cur.execute("SELECT id, user_email, device_name, status, approved_by, approved_at FROM user_authorized_devices ORDER BY created_at DESC LIMIT 5;")
    for r in cur.fetchall():
        print("->", r)

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error al conectar con DB: {e}")
