
path = 'Zonas Reservadas/ZonasReservadas.dbf'
with open(path, 'rb') as f:
    content = f.read()
    try:
        # DBF usually Latin-1 or utf-8. Let's try to find the string.
        import re
        # Find all sequences of 4+ printable chars
        strings = re.findall(rb"[A-Za-z0-9 _\-\(\)\.]{4,}", content)
        print("--- Strings Found ---")
        for s in strings:
            try:
                print(s.decode('latin-1'))
            except:
                pass
    except Exception as e:
        print(f"Error: {e}")
