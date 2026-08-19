import os
import sys
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

supabase = get_supabase()

res = supabase.table('routes_quotes').select('*').ilike('name', '%(V2)%').execute()
v2_routes = res.data or []

print(f"Rutas con sufijo (V2) encontradas: {len(v2_routes)}")

for r in v2_routes:
    old_name = r.get('name', '')
    clean_name = old_name.replace(' (V2)', '').replace('(V2)', '').strip()
    
    # 1. Eliminar el registro antiguo con (V2)
    supabase.table('routes_quotes').delete().eq('name', old_name).execute()
    
    # 2. Insertar con el nuevo clean_name
    r_copy = dict(r)
    r_copy['name'] = clean_name
    # Asegurar que no tenga columnas invalidas
    if 'id' in r_copy: del r_copy['id']
    if 'created_at' in r_copy: del r_copy['created_at']
    
    supabase.table('routes_quotes').upsert(r_copy, on_conflict='name').execute()
    print(f"Renombrada: '{old_name}' -> '{clean_name}'")

print("\nProceso de limpieza de sufijo (V2) completado con exito.")
