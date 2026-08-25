import sys
import socket
import urllib.request
import ssl

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 1. DNS Resolution
try:
    ip = socket.gethostbyname("inandes.geeksoft.tech")
    print(f"📌 DNS inandes.geeksoft.tech: {ip}")
except Exception as e:
    print(f"Error DNS inandes.geeksoft.tech: {e}")

try:
    ip_react = socket.gethostbyname("inandes.react.geeksoft.tech")
    print(f"📌 DNS inandes.react.geeksoft.tech: {ip_react}")
except Exception as e:
    print(f"Error DNS inandes.react.geeksoft.tech: {e}")

# 2. HTTP Request to inandes.geeksoft.tech
try:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request("https://inandes.geeksoft.tech/", headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
        print(f"\n📌 GET https://inandes.geeksoft.tech/ -> Status {res.status}")
        print("   Headers:")
        for k, v in res.headers.items():
            print(f"     {k}: {v}")
        html = res.read().decode('utf-8', errors='replace')[:500]
        print(f"   HTML Snippet:\n{html}")
except Exception as e:
    print(f"Error HTTP: {e}")
