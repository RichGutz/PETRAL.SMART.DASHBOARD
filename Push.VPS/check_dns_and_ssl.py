"""
Script to poll DNS propagation for forecast.geeksoft.pe.
Once it resolves to 91.108.125.253, it connects to the VPS to configure SSL via Certbot.
"""
import socket
import paramiko
import time
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DOMAIN = "forecast.geeksoft.pe"
TARGET_IP = "91.108.125.253"

VPS_HOST  = "91.108.125.253"
VPS_PORT  = 22
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"
CERTBOT_MAIL = "contacto@geeksoft.pe"

def check_dns():
    try:
        ip = socket.gethostbyname(DOMAIN)
        print(f"DNS resolved: {DOMAIN} -> {ip}")
        return ip == TARGET_IP
    except socket.gaierror:
        print(f"DNS not resolved yet for {DOMAIN}...")
        return False

def run_certbot():
    print(f"Domain resolved to target IP! Running Certbot on VPS...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        print("  >> Connected to VPS via SSH ✓")
        
        cmd = f"certbot --nginx -d {DOMAIN} --non-interactive --agree-tos -m {CERTBOT_MAIL} --redirect"
        print(f"  >> Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
        out = stdout.read().decode("utf-8", errors="replace").strip()
        err = stderr.read().decode("utf-8", errors="replace").strip()
        
        if out: print(f"  Stdout:\n{out}")
        if err: print(f"  Stderr:\n{err}")
        
        if "Successfully" in out or "Congratulations" in out or "Certificate not yet due" in out:
            print(f"\n[SUCCESS] SSL configured successfully! Site active at https://{DOMAIN}")
            return True
        else:
            print("\n[WARNING] Certbot ran but did not confirm success message. Might need manual check.")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] SSH/Certbot failed: {e}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    if check_dns():
        run_certbot()
    else:
        print("DNS not ready. Skipping SSL activation.")
