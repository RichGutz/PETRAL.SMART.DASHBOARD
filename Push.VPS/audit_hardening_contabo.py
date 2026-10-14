"""
Auditoría Pericial de Hardening del Servidor Linux VPS Contabo (169.58.168.107)
Paso 4 del Plan: 32. Blindando.Data.Petral.md
Basado en el estándar de seguridad [[21 - How To Secure A Linux Server]]
"""
import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CONTABO_IP = "169.58.168.107"
CONTABO_PORT = 22
CONTABO_USER = "root"
CONTABO_PASS = "VivaLaVida2026$"

def run_cmd(client, cmd, title):
    print(f"\n{'='*70}")
    print(f"  🔍 {title}")
    print(f"  Comando: {cmd}")
    print(f"{'='*70}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out:
        print(out)
    if err and "warning" not in err.lower():
        print(f"[STDERR]: {err}")
    return out, err

def main():
    print("Iniciando conexión SSH con Contabo VPS (169.58.168.107)...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=CONTABO_IP, port=CONTABO_PORT, username=CONTABO_USER, password=CONTABO_PASS, timeout=20)
    print("Conexión SSH exitosa. Ejecutando batería pericial de Hardening Linux...\n")

    # 1. Sistema Operativo & Kernel
    run_cmd(client, "uname -a && cat /etc/os-release | grep PRETTY_NAME && uptime", "1. Sistema Operativo y Kernel")

    # 2. Firewall Perimetral UFW / iptables
    run_cmd(client, "ufw status verbose", "2. Estado del Firewall Perimetral UFW")

    # 3. Puertos Escuchando en el Host (ss)
    run_cmd(client, "ss -tulnp", "3. Puertos en Escucha en Host (ss -tulnp)")

    # 4. Aislamiento y Puertos de Contenedores Docker
    run_cmd(client, 'docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"', "4. Mapeo de Puertos y Aislamiento de Contenedores Docker")

    # 5. Configuración de SSH Daemon
    run_cmd(client, 'grep -E "^[[:space:]]*(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|MaxAuthTries|Port)" /etc/ssh/sshd_config /etc/ssh/sshd_config.d/* 2>/dev/null || sshd -T | grep -E "permitrootlogin|passwordauthentication|pubkeyauthentication|maxauthtries|port"', "5. Parámetros Críticos de Seguridad SSH")

    # 6. Servicio de Protección contra Fuerza Bruta (Fail2ban)
    run_cmd(client, "systemctl is-active fail2ban && fail2ban-client status || echo 'Fail2ban no está activo o instalado'", "6. Estado del Servicio Fail2ban")

    # 7. Parámetros de Kernel TCP (SYN Flood / RP Filter)
    run_cmd(client, "sysctl net.ipv4.tcp_syncookies net.ipv4.conf.all.rp_filter net.ipv4.conf.default.rp_filter net.ipv4.icmp_echo_ignore_broadcasts", "7. Hardening de Red en Kernel (/etc/sysctl.conf)")

    # 8. Verificación de Actualizaciones de Seguridad (unattended-upgrades / apt)
    run_cmd(client, "systemctl is-active unattended-upgrades || echo 'unattended-upgrades inactivo'", "8. Estado de Actualizaciones Automáticas")

    client.close()
    print(f"\n{'='*70}")
    print("  AUDITORÍA PERICIAL DE HARDENING FINALIZADA CON ÉXITO")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
