import paramiko

def test_playwright_pdf():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('91.108.125.253', port=22, username='root', password='Thiagutz061121@', timeout=10)
    
    # Comprobar si python tiene playwright instalado en su venv
    cmd = "/opt/geeksoft_engine/venv/bin/python3 -c 'import playwright; print(playwright.__file__)'"
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    print("PLAYWRIGHT PYTHON:", out)
    if err:
        print("ERR:", err)
        print("Instalando playwright en venv...")
        stdin, stdout, stderr = client.exec_command("/opt/geeksoft_engine/venv/bin/pip install playwright && /opt/geeksoft_engine/venv/bin/playwright install chromium")
        print("INSTALL:", stdout.read().decode('utf-8'))
        
    client.close()

if __name__ == "__main__":
    test_playwright_pdf()
