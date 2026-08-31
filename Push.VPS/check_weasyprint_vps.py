import paramiko

def check():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('91.108.125.253', port=22, username='root', password='Thiagutz061121@', timeout=10)
    
    cmd = "/opt/geeksoft_engine/venv/bin/pip list | grep -i weasyprint"
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    print("PIP WEASYPRINT:", out)
    
    if not out.strip():
        print("Instalando weasyprint en el VPS...")
        stdin, stdout, stderr = client.exec_command("/opt/geeksoft_engine/venv/bin/pip install weasyprint")
        print("INSTALL OUT:", stdout.read().decode('utf-8'))
        print("INSTALL ERR:", stderr.read().decode('utf-8'))
        
    client.close()

if __name__ == "__main__":
    check()
