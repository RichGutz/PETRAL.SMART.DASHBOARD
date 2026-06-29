import paramiko

VPS_HOST  = "91.108.125.253"
VPS_USER  = "root"
VPS_PASS  = "Thiagutz061121@"

def fix():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname=VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=10)
        
        print("1. Matando procesos colgados en el puerto 8000...")
        client.exec_command("fuser -k 8000/tcp")
        
        print("2. Corrigiendo Nginx proxy_pass (localhost -> 127.0.0.1)...")
        fix_nginx_cmd = "sed -i 's/proxy_pass http:\\/\\/localhost:8000;/proxy_pass http:\\/\\/127.0.0.1:8000;/g' /etc/nginx/sites-available/forecast.geeksoft.tech"
        client.exec_command(fix_nginx_cmd)
        
        print("3. Reiniciando backend y Nginx...")
        _, stdout, _ = client.exec_command("systemctl restart geeksoft-engine && systemctl reload nginx && systemctl status geeksoft-engine --no-pager")
        print(stdout.read().decode("utf-8", errors="replace"))
        
        print("Hecho.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    fix()
