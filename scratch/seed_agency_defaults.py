"""
Seed agency_matrix con registros DEFAULT para todos los puertos activos.
Costo = 9999 para que sean fácil de identificar.
Solo inserta si no existe ya el registro (client_id=DEFAULT, port_id, operation_type, vessel_id=DEFAULT).
"""
import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

sb = get_supabase()

# 1. Traer todos los puertos activos
ports_res = sb.table("ports").select("port_id, port_name").execute()
all_ports = [r["port_id"] for r in ports_res.data]
print(f"Puertos encontrados: {all_ports}")

# 2. Traer registros DEFAULT ya existentes
existing_res = sb.table("agency_matrix").select("*").eq("client_id", "DEFAULT").eq("vessel_id", "DEFAULT").execute()
existing = existing_res.data
print(f"\nRegistros DEFAULT ya existentes: {len(existing)}")
for e in existing:
    print(f"  {e['port_id']} / {e['operation_type']} = ${e['cost']}")

# Construir set de claves existentes
existing_keys = set(
    (r["port_id"], r["operation_type"]) for r in existing
)

# 3. Insertar los que faltan
to_insert = []
for port_id in all_ports:
    for op in ["CARGA", "DESCARGA"]:
        key = (port_id, op)
        if key not in existing_keys:
            to_insert.append({
                "client_id": "DEFAULT",
                "port_id": port_id,
                "operation_type": op,
                "vessel_id": "DEFAULT",
                "cost": 9999
            })

print(f"\nRegistros a insertar: {len(to_insert)}")
for r in to_insert:
    print(f"  -> {r['port_id']} / {r['operation_type']} = $9,999")

if to_insert:
    ins_res = sb.table("agency_matrix").insert(to_insert).execute()
    if ins_res.data:
        print(f"\nINSERT exitoso: {len(ins_res.data)} registros creados.")
    else:
        print(f"\nERROR: {ins_res}")
else:
    print("\nNada que insertar - todos los registros DEFAULT ya existen.")

# 4. Verificacion final
print("\n=== ESTADO FINAL agency_matrix (DEFAULT) ===")
final_res = sb.table("agency_matrix").select("*").eq("client_id", "DEFAULT").eq("vessel_id", "DEFAULT").order("port_id").execute()
for r in final_res.data:
    print(f"  {r['port_id']:15} | {r['operation_type']:10} | ${r['cost']:,.0f}")
