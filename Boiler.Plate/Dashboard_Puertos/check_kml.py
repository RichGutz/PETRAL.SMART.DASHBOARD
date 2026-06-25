
path = 'Zonas Reservadas/archive/Reserva_de_biosfera_nacional.kml'
try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    import re
    names = re.findall(r"<name>(.*?)</name>", content, re.IGNORECASE)
    print("--- Names in KML ---")
    for n in names[:20]: # Print first 20
        print(n)
        
except Exception as e:
    print(f"Error: {e}")
