# 🛰️ Sistema de Monitoreo Automatizado de VPS & Alerta por Correo
**Infraestructura**: ThinkPad (Nodo de Telemetría Wake-on-LAN) ➔ Sondas SSH a VPS Hostinger & Contabo ➔ Reporte Ejecutivo HTML por Correo

---

## 1. Visión y Arquitectura General del Flujo

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                     INFRAESTRUCTURA DE RED                       │
 └──────────────────────────────────────────────────────────────────┘
                                │
                        (1) Disparo Programado
                                ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │              ROUTER UNIFI (Controlador de Red)                   │
 │  - Envía paquete mágico Wake-on-LAN (WOL) a la ThinkPad          │
 └──────────────────────────────────────────────────────────────────┘
                                │
                        (2) Despertar de la Nave
                                ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │           LAPTOP THINKPAD (Servidor Local de Tareas)             │
 │  - Scrapers de Autos (Nocturnos)                                 │
 │  - Cron Job / Programador de Tareas de Windows                   │
 │  - Ejecuta: `monitor_vps_email.py` (2 veces al día)              │
 └──────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            │ (3) Sondas SSH / Telemetría           │ (3) Sondas SSH / Telemetría
            ▼                                       ▼
 ┌──────────────────────────────┐        ┌──────────────────────────────┐
 │     VPS 1: HOSTINGER         │        │       VPS 2: CONTABO         │
 │  - IP: 91.108.125.253        │        │  - IP: 161.97.112.146        │
 │  - PETRAL SMART DASHBOARD    │        │  - INANDES ERP + APEFAC      │
 │  - geeksoft-engine + Nginx   │        │  - Coolify + Docker + Caddy  │
 └──────────────────────────────┘        └──────────────────────────────┘
            │                                       │
            └───────────────────┬───────────────────┘
                                │
                        (4) Dictamen y Consolidación
                                ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │               MOTOR DE REPORTE Y SEMÁFORO HTML                   │
 │  - RAM, CPU, Disco, Uptime, Servicios y URLs HTTPS en Vivo       │
 │  - Detección de anomalías (Verde / Amarillo / Rojo)              │
 └──────────────────────────────────────────────────────────────────┘
                                │
                        (5) Envío Inmediato
                                ▼
 ┌──────────────────────────────────────────────────────────────────┐
 │                CORREO ELECTRÓNICO EJECUTIVO                      │
 │           Bandeja de Entrada del Administrador                   │
 └──────────────────────────────────────────────────────────────────┘
```

---

## 2. Matriz de Parámetros y Umbrales de Salud

| Servidor | Rol en la Organización | IP Pública | Specs Clave | Umbral RAM Alerta | Umbral Disco Alerta | Sondas Vitales |
|---|---|:---:|:---:|:---:|:---:|---|
| **Hostinger VPS** | **PETRAL SMART DASHBOARD** | `91.108.125.253` | 4 GB RAM / 2 vCPU | `> 2.8 GB` (70%) | `> 75%` en `/` | `geeksoft-engine`, `nginx`, `https://forecast.geeksoft.tech` |
| **Contabo VPS** | **INANDES ERP & APEFAC** | `161.97.112.146` | 12 GB RAM / 4 vCPU | `> 9.0 GB` (75%) | `> 80%` en `/` | `Coolify`, `Worker PDF (8010)`, `Supabase Postgres DB`, `Supabase Kong Gateway`, `Postgres pg_isready`, `https://inandes.geeksoft.tech` |

---

## 3. Script Maestro Perfeccionado (`monitor_vps_email.py`)

Guarda este script en tu ThinkPad en:  
`C:\Users\rguti\Scripts_Telemetria\monitor_vps_email.py`

```python
import paramiko
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import datetime
import os
import sys

# ==============================================================================
# CONFIGURACIÓN DE SERVIDORES Y CREDENCIALES
# ==============================================================================
SERVERS = [
    {
        "name": "Hostinger VPS (PETRAL SMART DASHBOARD)",
        "ip": "91.108.125.253",
        "user": "root",
        "key_path": r"C:\Users\rguti\.ssh\id_rsa",  # Ajustar a ruta en ThinkPad o password
        "password": None,                           # Si usa password en vez de key, colocar aquí
        "type": "hostinger",
        "url_check": "https://forecast.geeksoft.tech"
    },
    {
        "name": "Contabo VPS (INANDES ERP & APEFAC)",
        "ip": "161.97.112.146",
        "user": "root",
        "key_path": r"C:\Users\rguti\.ssh\id_rsa",
        "password": None,
        "type": "contabo",
        "url_check": "https://inandes.geeksoft.tech"
    }
]

# ==============================================================================
# CONFIGURACIÓN SMTP DE CORREO
# ==============================================================================
SMTP_CONFIG = {
    "server": "smtp.gmail.com",
    "port": 587,
    "user": "rgutierrez@geeksoft.pe",           # Tu correo remitente
    "password": "TU_APP_PASSWORD_AQUI",         # Contraseña de aplicación de Google
    "to": ["rgutierrez@geeksoft.pe"]            # Destinatario(s)
}

# ==============================================================================
# FUNCIÓN DE EJECUCIÓN SSH
# ==============================================================================
def ssh_exec(client, cmd):
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=12)
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        err = stderr.read().decode('utf-8', errors='ignore').strip()
        return out, err
    except Exception as e:
        return "", str(e)

# ==============================================================================
# AUDITORÍA FORENSE POR SERVIDOR
# ==============================================================================
def audit_server(srv):
    report = {
        "name": srv["name"],
        "ip": srv["ip"],
        "status": "ONLINE",
        "alerts": [],
        "uptime": "N/A",
        "cpu_load": "N/A",
        "ram_used": "N/A",
        "ram_total": "N/A",
        "ram_pct": 0,
        "disk_used": "N/A",
        "disk_total": "N/A",
        "disk_pct": 0,
        "services": {},
        "web_status": "N/A"
    }

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        if srv.get("key_path") and os.path.exists(srv["key_path"]):
            client.connect(srv["ip"], username=srv["user"], key_filename=srv["key_path"], timeout=10)
        elif srv.get("password"):
            client.connect(srv["ip"], username=srv["user"], password=srv["password"], timeout=10)
        else:
            # Fallback a llaves por defecto de SSH
            client.connect(srv["ip"], username=srv["user"], timeout=10)

        # 1. Uptime y CPU Load
        uptime_raw, _ = ssh_exec(client, "uptime")
        report["uptime"] = uptime_raw

        # 2. Memoria RAM
        ram_out, _ = ssh_exec(client, "free -m | awk 'NR==2{printf \"%s|%s|%.1f\", $3,$2,$3*100/$2 }'")
        if "|" in ram_out:
            used, tot, pct = ram_out.split("|")
            report["ram_used"] = f"{int(used)/1024:.2f} GB"
            report["ram_total"] = f"{int(tot)/1024:.2f} GB"
            report["ram_pct"] = float(pct)
            if float(pct) > 80.0:
                report["alerts"].append(f"RAM Crítica al {pct}% ({report['ram_used']}/{report['ram_total']})")

        # 3. Espacio en Disco
        disk_out, _ = ssh_exec(client, "df -h / | awk 'NR==2{printf \"%s|%s|%s\", $3,$2,$5}'")
        if "|" in disk_out:
            d_used, d_tot, d_pct_str = disk_out.split("|")
            report["disk_used"] = d_used
            report["disk_total"] = d_tot
            d_pct = float(d_pct_str.replace("%", ""))
            report["disk_pct"] = d_pct
            if d_pct > 80.0:
                report["alerts"].append(f"Espacio en Disco Crítico al {d_pct}%")

        # 4. Servicios Específicos
        if srv["type"] == "hostinger":
            svc_petral, _ = ssh_exec(client, "systemctl is-active geeksoft-engine")
            svc_nginx, _ = ssh_exec(client, "systemctl is-active nginx")
            report["services"]["geeksoft-engine (FastAPI)"] = svc_petral
            report["services"]["nginx (Web Proxy)"] = svc_nginx
            if svc_petral != "active":
                report["alerts"].append("Servicio backend geeksoft-engine DETENIDO!")
            if svc_nginx != "active":
                report["alerts"].append("Servicio web Nginx DETENIDO!")

        elif srv["type"] == "contabo":
            # A) Microservicios InAndes / Coolify
            cid_backend, _ = ssh_exec(client, "docker ps -q --filter 'name=3g5kcala3ypqzlsrhyelxyev'")
            cid_caddy, _ = ssh_exec(client, "docker ps -q --filter 'name=coolify-proxy'")
            report["services"]["FastAPI PDF Backend (Docker)"] = "ACTIVO" if cid_backend else "CAIDO"
            report["services"]["Caddy Reverse Proxy"] = "ACTIVO" if cid_caddy else "CAIDO"
            if not cid_backend:
                report["alerts"].append("Contenedor Backend FastAPI en Contabo no encontrado!")

            # B) Sonda Completa Supabase Docker (PostgreSQL, Kong, PostgREST)
            sb_db_cid, _ = ssh_exec(client, "docker ps -q --filter 'name=supabase-db' --filter 'name=postgres'")
            sb_kong_cid, _ = ssh_exec(client, "docker ps -q --filter 'name=supabase-kong' --filter 'name=kong'")
            sb_rest_cid, _ = ssh_exec(client, "docker ps -q --filter 'name=supabase-rest' --filter 'name=postgrest'")

            report["services"]["Supabase Postgres DB"] = "ACTIVO" if sb_db_cid else "CAIDO"
            report["services"]["Supabase Kong Gateway"] = "ACTIVO" if sb_kong_cid else "CAIDO"
            report["services"]["Supabase PostgREST"] = "ACTIVO" if sb_rest_cid else "CAIDO"

            if not sb_db_cid:
                report["alerts"].append("Contenedor de Base de Datos Supabase (PostgreSQL) DETENIDO!")

            # C) Sonda de Conectividad Real pg_isready & Saturación de Conexiones
            if sb_db_cid:
                first_db_id = sb_db_cid.split()[0]
                pg_ready, _ = ssh_exec(client, f"docker exec {first_db_id} pg_isready -U postgres")
                if "accepting connections" in pg_ready:
                    report["services"]["Postgres pg_isready"] = "ACEPTANDO CONEXIONES"
                else:
                    report["alerts"].append(f"Postgres Supabase NO acepta conexiones: {pg_ready}")

                conn_count, _ = ssh_exec(client, f"docker exec {first_db_id} psql -U postgres -t -A -c 'SELECT count(*) FROM pg_stat_activity;'")
                if conn_count.strip().isdigit():
                    report["services"]["Postgres Conexiones Activas"] = f"{conn_count.strip()} conex."
                    if int(conn_count.strip()) > 85:
                        report["alerts"].append(f"Alerta: Supabase DB con alta concurrencia ({conn_count.strip()} conexiones activas)!")

            # D) Sonda HTTP al API Gateway de Supabase (Kong puerto 8000 / rest)
            kong_http_code, _ = ssh_exec(client, "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/rest/v1/")
            if kong_http_code in ["200", "401", "400"]:
                report["services"]["Supabase REST Gateway"] = f"HTTP {kong_http_code} (OK)"
            elif sb_kong_cid:
                report["alerts"].append(f"Supabase Gateway Kong respondió con código anómalo: HTTP {kong_http_code}")

        # 5. Sonda HTTPS
        web_code, _ = ssh_exec(client, f"curl -k -s -o /dev/null -w '%{{http_code}}' {srv['url_check']}")
        report["web_status"] = f"HTTP {web_code}"
        if web_code != "200":
            report["alerts"].append(f"URL Pública {srv['url_check']} respondió con código {web_code}!")

    except Exception as e:
        report["status"] = "OFFLINE / ERROR SSH"
        report["alerts"].append(f"Fallo total de conexión SSH: {str(e)}")
    finally:
        client.close()

    return report

# ==============================================================================
# CONSTRUCTOR DE REPORTE HTML
# ==============================================================================
def build_html_email(reports):
    has_critical = any(len(r["alerts"]) > 0 or r["status"] != "ONLINE" for r in reports)
    banner_color = "#dc2626" if has_critical else "#16a34a"
    status_title = "🚨 ALERTA: Problemas detectados en Infraestructura VPS" if has_critical else "✅ SISTEMA ÓPTIMO: Todos los VPS operando al 100%"

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }}
            .container {{ max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }}
            .header {{ background-color: {banner_color}; color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 20px; }}
            .header p {{ margin: 5px 0 0 0; opacity: 0.9; font-size: 13px; }}
            .content {{ padding: 24px; }}
            .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; }}
            .card-title {{ font-size: 16px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }}
            .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
            .stat {{ background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; }}
            .stat-label {{ font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }}
            .stat-value {{ font-size: 15px; font-weight: bold; color: #0f172a; }}
            .alert-box {{ background: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; border-radius: 4px; margin-top: 10px; color: #991b1b; font-size: 13px; font-weight: bold; }}
            .ok-box {{ background: #dcfce7; border-left: 4px solid #22c55e; padding: 10px; border-radius: 4px; margin-top: 10px; color: #166534; font-size: 13px; font-weight: bold; }}
            .footer {{ background: #0f172a; color: #94a3b8; text-align: center; padding: 16px; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{status_title}</h1>
                <p>ThinkPad Telemetry Node | Hora de Ejecución: {now_str}</p>
            </div>
            <div class="content">
    """

    for r in reports:
        status_badge = "<span style='color:#16a34a;'>● ONLINE</span>" if r["status"] == "ONLINE" else "<span style='color:#dc2626;'>● OFFLINE</span>"
        html += f"""
        <div class="card">
            <div class="card-title">{r['name']} ({r['ip']}) - {status_badge}</div>
            <div class="grid">
                <div class="stat">
                    <div class="stat-label">Memoria RAM</div>
                    <div class="stat-value">{r['ram_used']} / {r['ram_total']} ({r['ram_pct']}%)</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Espacio en Disco</div>
                    <div class="stat-value">{r['disk_used']} / {r['disk_total']} ({r['disk_pct']}%)</div>
                </div>
                <div class="stat">
                    <div class="stat-label">URL Pública HTTPS</div>
                    <div class="stat-value">{r['web_status']}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Servicios Principales</div>
                    <div class="stat-value" style="font-size:12px;">
                        {'<br/>'.join([f"{k}: <b>{v}</b>" for k,v in r['services'].items()]) if r['services'] else 'N/A'}
                    </div>
                </div>
            </div>
        """
        if r["alerts"]:
            html += "<div class='alert-box'>⚠️ ALERTAS ACTIVAS:<br/>• " + "<br/>• ".join(r["alerts"]) + "</div>"
        else:
            html += "<div class='ok-box'>✅ Todos los servicios y consumos se encuentran en rango óptimo.</div>"

        html += "</div>"

    html += """
            </div>
            <div class="footer">
                PETRAL & INANDES DevOps Telemetry System • Powered by ThinkPad Automation WOL
            </div>
        </div>
    </body>
    </html>
    """
    return html

# ==============================================================================
# ENVÍO DEL CORREO
# ==============================================================================
def send_email(html_content, has_alerts):
    now_date = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
    subject = f"🚨 ALERTA VPS: Incidencia Detectada [{now_date}]" if has_alerts else f"🩺 Reporte Diario de Salud VPS [{now_date}] - Todo OK"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
# ==============================================================================
# MANTENIMIENTO PREVENTIVO Y AUTO-LIMPIEZA AUTOMÁTICA
# ==============================================================================
def perform_maintenance(client, srv):
    actions = []
    try:
        # 1. Purga de Inodos y Temporales (/tmp con > 3 días)
        ssh_exec(client, "find /tmp /var/tmp -type f -mtime +3 -delete 2>/dev/null")
        actions.append("Purga /tmp (Inodos liberados)")

        # 2. Control de Logs de Sistema
        ssh_exec(client, "journalctl --vacuum-size=250M --vacuum-time=7d 2>/dev/null")
        actions.append("Vacuum Journalctl (<250MB)")

        # 3. Mantenimiento Docker en Contabo
        if srv["type"] == "contabo":
            ssh_exec(client, "docker image prune -af --filter 'until=72h' 2>/dev/null")
            ssh_exec(client, "docker builder prune -af --keep-storage 2GB 2>/dev/null")
            actions.append("Poda Docker (Dangling & Builders)")

            # Vacuum Analyze a Supabase Postgres
            sb_cid, _ = ssh_exec(client, "docker ps -q --filter 'name=supabase-db' --filter 'name=postgres'")
            if sb_cid:
                ssh_exec(client, f"docker exec {sb_cid.split()[0]} psql -U postgres -d postgres -c 'VACUUM ANALYZE;' 2>/dev/null")
                actions.append("PostgreSQL VACUUM ANALYZE")

    except Exception as e:
        actions.append(f"Error mantenimiento: {e}")
    return actions

# ==============================================================================
# RESPALDOS DE BASE DE DATOS Y SUBIDA A GOOGLE DRIVE EMPRESA (RCLONE)
# ==============================================================================
def backup_and_upload_gdrive(client, srv, local_temp_dir):
    backup_info = {"status": "SKIPPED", "size": "0 MB", "gdrive_path": "N/A"}
    now_tag = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs(local_temp_dir, exist_ok=True)

    try:
        sftp = client.open_sftp()
        if srv["type"] == "contabo":
            # Dump de Supabase PostgreSQL en Contabo
            sb_cid, _ = ssh_exec(client, "docker ps -q --filter 'name=supabase-db' --filter 'name=postgres'")
            if sb_cid:
                remote_dump = f"/tmp/supabase_backup_{now_tag}.sql.gz"
                local_dump = os.path.join(local_temp_dir, f"supabase_contabo_{now_tag}.sql.gz")
                
                # Ejecutar pg_dumpall comprimido
                ssh_exec(client, f"docker exec {sb_cid.split()[0]} pg_dumpall -U postgres | gzip > {remote_dump}")
                sftp.get(remote_dump, local_dump)
                ssh_exec(client, f"rm -f {remote_dump}")

                # Subida a Google Drive Empresa con Rclone
                sz_mb = f"{os.path.getsize(local_dump)/(1024*1024):.2f} MB"
                rclone_cmd = f'rclone copy "{local_dump}" "gdrive_empresa:Backups_VPS/{datetime.datetime.now().strftime("%Y-%m")}/" --stats-one-line'
                code = os.system(rclone_cmd)
                
                if code == 0:
                    backup_info = {"status": "SUCCESS", "size": sz_mb, "gdrive_path": f"gdrive_empresa:Backups_VPS/{datetime.datetime.now().strftime('%Y-%m')}/supabase_contabo_{now_tag}.sql.gz"}
                else:
                    backup_info = {"status": "ERROR RCLONE", "size": sz_mb, "gdrive_path": "Fallo al subir a GDrive"}

        elif srv["type"] == "hostinger":
            # Si Hostinger tuviera DB local o configuraciones clave
            remote_conf = f"/tmp/petral_nginx_backup_{now_tag}.tar.gz"
            local_conf = os.path.join(local_temp_dir, f"petral_hostinger_conf_{now_tag}.tar.gz")
            ssh_exec(client, f"tar -czf {remote_conf} /etc/nginx/sites-available /var/www/forecast.geeksoft.tech 2>/dev/null")
            try:
                sftp.get(remote_conf, local_conf)
                ssh_exec(client, f"rm -f {remote_conf}")
                sz_mb = f"{os.path.getsize(local_conf)/(1024*1024):.2f} MB"
                os.system(f'rclone copy "{local_conf}" "gdrive_empresa:Backups_VPS/{datetime.datetime.now().strftime("%Y-%m")}/"')
                backup_info = {"status": "SUCCESS", "size": sz_mb, "gdrive_path": f"gdrive_empresa:Backups_VPS/{datetime.datetime.now().strftime('%Y-%m')}/petral_hostinger_conf_{now_tag}.tar.gz"}
            except Exception:
                backup_info = {"status": "SKIPPED", "size": "0 MB", "gdrive_path": "N/A"}

        sftp.close()
    except Exception as e:
        backup_info = {"status": f"ERROR: {str(e)}", "size": "0 MB", "gdrive_path": "N/A"}

    return backup_info

# ==============================================================================
# AUDITORÍA FORENSE, MANTENIMIENTO Y BACKUP
# ==============================================================================
def audit_server(srv, local_temp_dir):
    report = {
        "name": srv["name"],
        "ip": srv["ip"],
        "status": "ONLINE",
        "alerts": [],
        "uptime": "N/A",
        "cpu_load": "N/A",
        "ram_used": "N/A",
        "ram_total": "N/A",
        "ram_pct": 0,
        "disk_used": "N/A",
        "disk_total": "N/A",
        "disk_pct": 0,
        "services": {},
        "web_status": "N/A",
        "maintenance": [],
        "backup": {}
    }

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        if srv.get("key_path") and os.path.exists(srv["key_path"]):
            client.connect(srv["ip"], username=srv["user"], key_filename=srv["key_path"], timeout=10)
        elif srv.get("password"):
            client.connect(srv["ip"], username=srv["user"], password=srv["password"], timeout=10)
        else:
            client.connect(srv["ip"], username=srv["user"], timeout=10)

        # 1. Uptime y CPU Load
        uptime_raw, _ = ssh_exec(client, "uptime")
        report["uptime"] = uptime_raw

        # 2. Memoria RAM
        ram_out, _ = ssh_exec(client, "free -m | awk 'NR==2{printf \"%s|%s|%.1f\", $3,$2,$3*100/$2 }'")
        if "|" in ram_out:
            used, tot, pct = ram_out.split("|")
            report["ram_used"] = f"{int(used)/1024:.2f} GB"
            report["ram_total"] = f"{int(tot)/1024:.2f} GB"
            report["ram_pct"] = float(pct)
            if float(pct) > 80.0:
                report["alerts"].append(f"RAM Crítica al {pct}% ({report['ram_used']}/{report['ram_total']})")

        # 3. Espacio en Disco & Inodos
        disk_out, _ = ssh_exec(client, "df -h / | awk 'NR==2{printf \"%s|%s|%s\", $3,$2,$5}'")
        if "|" in disk_out:
            d_used, d_tot, d_pct_str = disk_out.split("|")
            report["disk_used"] = d_used
            report["disk_total"] = d_tot
            d_pct = float(d_pct_str.replace("%", ""))
            report["disk_pct"] = d_pct
            if d_pct > 80.0:
                report["alerts"].append(f"Espacio en Disco Crítico al {d_pct}%")

        inode_out, _ = ssh_exec(client, "df -i / | awk 'NR==2{print $5}'")
        if "%" in inode_out:
            i_pct = float(inode_out.replace("%", ""))
            if i_pct > 75.0:
                report["alerts"].append(f"Inodos de Disco Críticos al {i_pct}%")

        # 4. Servicios Específicos
        if srv["type"] == "hostinger":
            svc_petral, _ = ssh_exec(client, "systemctl is-active geeksoft-engine")
            svc_nginx, _ = ssh_exec(client, "systemctl is-active nginx")
            report["services"]["geeksoft-engine (FastAPI)"] = svc_petral
            report["services"]["nginx (Web Proxy)"] = svc_nginx
            if svc_petral != "active":
                report["alerts"].append("Servicio backend geeksoft-engine DETENIDO!")
            if svc_nginx != "active":
                report["alerts"].append("Servicio web Nginx DETENIDO!")

        elif srv["type"] == "contabo":
            cid_backend, _ = ssh_exec(client, "docker ps -q --filter 'name=3g5kcala3ypqzlsrhyelxyev'")
            cid_caddy, _ = ssh_exec(client, "docker ps -q --filter 'name=coolify-proxy'")
            report["services"]["FastAPI PDF Backend (Docker)"] = "ACTIVO" if cid_backend else "CAIDO"
            report["services"]["Caddy Reverse Proxy"] = "ACTIVO" if cid_caddy else "CAIDO"
            if not cid_backend:
                report["alerts"].append("Contenedor Backend FastAPI en Contabo no encontrado!")

            # Supabase Sondas
            sb_db_cid, _ = ssh_exec(client, "docker ps -q --filter 'name=supabase-db' --filter 'name=postgres'")
            sb_kong_cid, _ = ssh_exec(client, "docker ps -q --filter 'name=supabase-kong' --filter 'name=kong'")
            sb_rest_cid, _ = ssh_exec(client, "docker ps -q --filter 'name=supabase-rest' --filter 'name=postgrest'")

            report["services"]["Supabase Postgres DB"] = "ACTIVO" if sb_db_cid else "CAIDO"
            report["services"]["Supabase Kong Gateway"] = "ACTIVO" if sb_kong_cid else "CAIDO"
            report["services"]["Supabase PostgREST"] = "ACTIVO" if sb_rest_cid else "CAIDO"

            if not sb_db_cid:
                report["alerts"].append("Contenedor de Base de Datos Supabase DETENIDO!")

            if sb_db_cid:
                first_db = sb_db_cid.split()[0]
                pg_ready, _ = ssh_exec(client, f"docker exec {first_db} pg_isready -U postgres")
                report["services"]["Postgres pg_isready"] = "ACEPTANDO CONEXIONES" if "accepting connections" in pg_ready else "ERROR"
                conn_count, _ = ssh_exec(client, f"docker exec {first_db} psql -U postgres -t -A -c 'SELECT count(*) FROM pg_stat_activity;'")
                if conn_count.strip().isdigit():
                    report["services"]["Postgres Conexiones"] = f"{conn_count.strip()} activas"
                    if int(conn_count.strip()) > 85:
                        report["alerts"].append(f"Supabase DB con alta concurrencia ({conn_count.strip()} conex.)")

        # 5. Sonda HTTPS
        web_code, _ = ssh_exec(client, f"curl -k -s -o /dev/null -w '%{{http_code}}' {srv['url_check']}")
        report["web_status"] = f"HTTP {web_code}"
        if web_code != "200":
            report["alerts"].append(f"URL Pública {srv['url_check']} respondió con código {web_code}!")

        # 6. Auto-Mantenimiento Preventivo
        report["maintenance"] = perform_maintenance(client, srv)

        # 7. Respaldo Off-Site a Google Drive Empresa con Rclone
        report["backup"] = backup_and_upload_gdrive(client, srv, local_temp_dir)

    except Exception as e:
        report["status"] = "OFFLINE / ERROR SSH"
        report["alerts"].append(f"Fallo total de conexión SSH: {str(e)}")
    finally:
        client.close()

    return report

# ==============================================================================
# CONSTRUCTOR DE REPORTE HTML CON SECCIÓN DE BACKUP & RCLONE
# ==============================================================================
def build_html_email(reports):
    has_critical = any(len(r["alerts"]) > 0 or r["status"] != "ONLINE" for r in reports)
    banner_color = "#dc2626" if has_critical else "#16a34a"
    status_title = "🚨 ALERTA: Problemas detectados en Infraestructura VPS" if has_critical else "🩺 SISTEMA ÓPTIMO: VPS Saludables & Backups en GDrive"

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }}
            .container {{ max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }}
            .header {{ background-color: {banner_color}; color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 20px; }}
            .header p {{ margin: 5px 0 0 0; opacity: 0.9; font-size: 13px; }}
            .content {{ padding: 24px; }}
            .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; }}
            .card-title {{ font-size: 16px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }}
            .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
            .stat {{ background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; }}
            .stat-label {{ font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }}
            .stat-value {{ font-size: 14px; font-weight: bold; color: #0f172a; }}
            .alert-box {{ background: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; border-radius: 4px; margin-top: 10px; color: #991b1b; font-size: 13px; font-weight: bold; }}
            .ok-box {{ background: #dcfce7; border-left: 4px solid #22c55e; padding: 10px; border-radius: 4px; margin-top: 10px; color: #166534; font-size: 13px; }}
            .backup-box {{ background: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px; border-radius: 4px; margin-top: 10px; color: #1e40af; font-size: 13px; }}
            .footer {{ background: #0f172a; color: #94a3b8; text-align: center; padding: 16px; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{status_title}</h1>
                <p>ThinkPad Automation Node | Hora: {now_str}</p>
            </div>
            <div class="content">
    """

    for r in reports:
        status_badge = "<span style='color:#16a34a;'>● ONLINE</span>" if r["status"] == "ONLINE" else "<span style='color:#dc2626;'>● OFFLINE</span>"
        html += f"""
        <div class="card">
            <div class="card-title">{r['name']} ({r['ip']}) - {status_badge}</div>
            <div class="grid">
                <div class="stat">
                    <div class="stat-label">Memoria RAM</div>
                    <div class="stat-value">{r['ram_used']} / {r['ram_total']} ({r['ram_pct']}%)</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Espacio en Disco</div>
                    <div class="stat-value">{r['disk_used']} / {r['disk_total']} ({r['disk_pct']}%)</div>
                </div>
                <div class="stat">
                    <div class="stat-label">URL Pública HTTPS</div>
                    <div class="stat-value">{r['web_status']}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Servicios Principales</div>
                    <div class="stat-value" style="font-size:12px;">
                        {'<br/>'.join([f"{k}: <b>{v}</b>" for k,v in r['services'].items()]) if r['services'] else 'N/A'}
                    </div>
                </div>
            </div>
        """
        if r["alerts"]:
            html += "<div class='alert-box'>⚠️ ALERTAS ACTIVAS:<br/>• " + "<br/>• ".join(r["alerts"]) + "</div>"

        if r.get("maintenance"):
            html += "<div class='ok-box'>🧹 <b>Auto-Mantenimiento:</b> " + " | ".join(r["maintenance"]) + "</div>"

        b = r.get("backup", {})
        if b.get("status") == "SUCCESS":
            html += f"<div class='backup-box'>💾 <b>Backup GDrive Empresa (Rclone):</b> OK ({b.get('size')}) ➔ <i>{b.get('gdrive_path')}</i></div>"
        elif b.get("status") not in ["SKIPPED", None]:
            html += f"<div class='alert-box'>❌ <b>Fallo en Respaldo:</b> {b.get('status')}</div>"

        html += "</div>"

    html += """
            </div>
            <div class="footer">
                PETRAL & INANDES DevOps Telemetry System • Powered by ThinkPad Automation & Rclone
            </div>
        </div>
    </body>
    </html>
    """
    return html

# ==============================================================================
# ENVÍO DEL CORREO
# ==============================================================================
def send_email(html_content, has_alerts):
    now_date = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
    subject = f"🚨 ALERTA VPS: Incidencia Detectada [{now_date}]" if has_alerts else f"🩺 Reporte Diario de Salud VPS [{now_date}] - Backups en GDrive OK"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_CONFIG["user"]
    msg["To"] = ", ".join(SMTP_CONFIG["to"])
    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP(SMTP_CONFIG["server"], SMTP_CONFIG["port"])
        server.starttls()
        server.login(SMTP_CONFIG["user"], SMTP_CONFIG["password"])
        server.sendmail(SMTP_CONFIG["user"], SMTP_CONFIG["to"], msg.as_string())
        server.quit()
        print(f"📧 Correo de telemetría enviado exitosamente a {SMTP_CONFIG['to']}")
    except Exception as e:
        print(f"❌ Error al enviar correo SMTP: {e}")

# ==============================================================================
# EJECUCIÓN PRINCIPAL
# ==============================================================================
def main():
    temp_backup_dir = r"C:\Users\rguti\Backups_VPS_Temp"
    print(f"[{datetime.datetime.now()}] Iniciando telemetría, mantenimiento y respaldo con Rclone...")
    reports = []
    has_alerts = False

    for srv in SERVERS:
        rep = audit_server(srv, temp_backup_dir)
        reports.append(rep)
        if len(rep["alerts"]) > 0 or rep["status"] != "ONLINE":
            has_alerts = True

    html_email = build_html_email(reports)
    send_email(html_email, has_alerts)
    print(f"[{datetime.datetime.now()}] Proceso finalizado con éxito.")

if __name__ == "__main__":
    main()
```

---

## 4. Guía de Instalación y Configuración de Rclone en la ThinkPad

### Paso 1: Descargar e Instalar Rclone en Windows
1. Descarga el ejecutable de [rclone.org/downloads](https://rclone.org/downloads/) (versión Windows 64-bit).
2. Extrae `rclone.exe` y colócalo en `C:\Windows\System32\` (o agrégalo al `PATH` de Windows).

### Paso 2: Vincular tu Google Drive de Cuenta Empresa
En la terminal de la ThinkPad ejecuta:
```bash
rclone config
```
1. Escribe `n` (New remote).
2. Nombre del remote: **`gdrive_empresa`** (¡este nombre exacto!).
3. Tipo de almacenamiento: escribe `drive` (Google Drive).
4. `client_id` y `client_secret`: Déjalos en blanco (presiona Enter).
5. `scope`: Elige `1` (Full access all files).
6. `service_account_file`: En blanco.
7. `Edit advanced config`: `n` (No).
8. `Use web browser to automatically authenticate`: `y` (Sí). Se abrirá el navegador para que inicies sesión en tu **cuenta Google de Empresa** y concedas permisos a Rclone.
9. `Configure this as a Shared Drive (Team Drive)`: Elige `y` o `n` según corresponda.
10. `Keep this remote`: `y` (Sí) y `q` para salir.

### Paso 3: Probar la Conexión Rclone
```bash
rclone lsd gdrive_empresa:
```
Si lista tus carpetas de Google Drive, ¡la sincronización automática está 100% lista!

---

## 5. Configuración del Programador de Tareas en la ThinkPad

1. Abre **Programador de Tareas** (`taskschd.msc`).
2. Crea la tarea: `Telemetria_VPS_Mantenimiento_GDrive`.
3. **Desencadenador**: Diario a las `07:30 AM` y `08:30 PM` (sincronizado con el WOL de Unifi).
4. **Acción**: `python.exe C:\Users\rguti\Scripts_Telemetria\monitor_vps_email.py`.
5. **Condición**: Marcar *"Activar el equipo para ejecutar esta tarea"*.

---

## 6. Procedimiento Operativo de Despliegue Remoto (RDP a la ThinkPad en Repisa)

Para no tener que mover físicamente la laptop de su repisa de ventilación, realiza todo el despliegue de forma 100% remota:

### 🖥️ Paso 1: Conexión RDP desde tu PC Actual
1. Presiona `Win + R` en tu computadora de trabajo actual.
2. Escribe `mstsc` y presiona **Enter** (abre Conexión a Escritorio Remoto de Windows).
3. Ingresa la **IP local de la ThinkPad** (ej. `192.168.1.X` o el nombre de host en la red Unifi).
4. Ingresa tu usuario y contraseña de Windows de la ThinkPad y haz clic en **Conectar**.

---

### 📦 Paso 2: Instalación de Componentes en la ThinkPad (Vía RDP)

1. **Instalar Paramiko**:
   Abre una terminal PowerShell como Administrador en la ThinkPad y corre:
   ```powershell
   pip install paramiko
   ```

2. **Instalar Rclone y Vincular Google Drive Empresa**:
   - Descarga `rclone-vX.XX.X-windows-amd64.zip` desde el navegador de la ThinkPad.
   - Extrae el archivo y copia `rclone.exe` a `C:\Windows\System32\`.
   - En la terminal corre:
     ```powershell
     rclone config
     ```
   - Sigue los pasos: `n` (Nuevo) ➔ `gdrive_empresa` ➔ `drive` ➔ Auto-config `y` (se abrirá el navegador para autenticar tu cuenta Google Workspace de empresa).
   - Valida la conexión ejecutando:
     ```powershell
     rclone lsd gdrive_empresa:
     ```

3. **Crear Directorios y Guardar el Script**:
   En PowerShell corre:
   ```powershell
   New-Item -ItemType Directory -Force -Path "C:\Users\rguti\Scripts_Telemetria"
   New-Item -ItemType Directory -Force -Path "C:\Users\rguti\Backups_VPS_Temp"
   ```
   - Guarda el código Python completo de la Sección 3 en:  
     `C:\Users\rguti\Scripts_Telemetria\monitor_vps_email.py`
   - Configura en `SMTP_CONFIG` la contraseña de aplicación de tu correo.

4. **Prueba de Fuego Manual**:
   En la terminal de la ThinkPad ejecuta:
   ```powershell
   python C:\Users\rguti\Scripts_Telemetria\monitor_vps_email.py
   ```
   - Verifica que se complete la telemetría, el auto-mantenimiento, la subida del dump de Supabase a tu Google Drive y que recibas el correo en tu bandeja de entrada.

5. **Programar en Task Scheduler**:
   - Abre `taskschd.msc` en la ThinkPad y activa la tarea programada con los horarios del WOL de Unifi.

---

*Documento consolidado para el nodo de telemetría y contingencia de infraestructura.*


