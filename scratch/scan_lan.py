import socket
import subprocess
from concurrent.futures import ThreadPoolExecutor

def check_ip(ip):
    # Probar RDP (3389), SSH (22), SMB (445)
    result = {"ip": ip, "hostname": "", "ports": []}
    for port in [3389, 22, 445, 80, 5000, 8080]:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.35)
            r = s.connect_ex((ip, port))
            s.close()
            if r == 0:
                result["ports"].append(port)
        except Exception:
            pass
            
    if result["ports"]:
        try:
            host, _, _ = socket.gethostbyaddr(ip)
            result["hostname"] = host
        except Exception:
            result["hostname"] = "Desconocido"
        return result
    return None

def main():
    subnets = ["192.168.0", "192.168.1"]
    all_ips = [f"{sub}.{i}" for sub in subnets for i in range(1, 255)]
    print("Escaneando red local (puertos 3389 RDP, 22 SSH, 445 SMB)...")
    
    with ThreadPoolExecutor(max_workers=100) as executor:
        results = executor.map(check_ip, all_ips)
        
    found = [r for r in results if r is not None]
    print(f"\nDispositivos activos encontrados con puertos abiertos ({len(found)}):")
    for d in found:
        ports_str = ", ".join(str(p) for p in d["ports"])
        print(f"- IP: {d['ip']:<15} | Hostname: {d['hostname']:<25} | Puertos Abiertos: {ports_str}")

if __name__ == '__main__':
    main()
