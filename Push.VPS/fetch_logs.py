import paramiko
import sys

VPS_HOST  = "91.108.125.253"
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

def fetch():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname=VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=10)
        
        print("=== STATUS GEEKSOFT-ENGINE ===")
        _, stdout, _ = client.exec_command("systemctl status geeksoft-engine --no-pager")
        print(stdout.read().decode("utf-8", errors="replace"))
        
        print("=== LOGS GEEKSOFT-ENGINE (last 40 lines) ===")
        _, stdout, _ = client.exec_command("journalctl -u geeksoft-engine -n 40 --no-pager")
        print(stdout.read().decode("utf-8", errors="replace"))

        print("=== NGINX ERROR LOGS ===")
        _, stdout, _ = client.exec_command("tail -n 20 /var/log/nginx/error.log")
        print(stdout.read().decode("utf-8", errors="replace"))

        print("=== NGINX ACCESS LOGS ===")
        _, stdout, _ = client.exec_command("tail -n 20 /var/log/nginx/access.log | grep api")
        print(stdout.read().decode("utf-8", errors="replace"))

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    fetch()
