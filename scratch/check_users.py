import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST = "169.58.168.107"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "VivaLaVida2026$"

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname=VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=15)
        
        cmds = [
            ("Tokens 2FA generados", "docker exec petral-backend python -c \"from backend.database import get_db_connection; conn=get_db_connection(); cur=conn.cursor(); cur.execute('SELECT email, otp_code, expires_at, is_used FROM user_2fa_tokens ORDER BY created_at DESC LIMIT 5'); [print(r) for r in cur.fetchall()]; cur.close(); conn.close()\""),
            ("Logs de petral-backend", "docker logs --tail 30 petral-backend")
        ]
        
        for title, cmd in cmds:
            print("=" * 60)
            print(f" 📊 {title}")
            print("=" * 60)
            stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
            print(stdout.read().decode('utf-8', errors='replace').strip())
            print()
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    main()
