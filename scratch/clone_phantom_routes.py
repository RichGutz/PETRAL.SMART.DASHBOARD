import os
import sys
import copy
sys.path.append(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase

supabase = get_supabase()

res = supabase.table('routes_quotes').select('*').execute()
routes = res.data or []

cloned_count = 0

for r in routes:
    name = r.get('name', '')
    ld = r.get('legs_data') or {}
    tramos = ld.get('tramos', [])
    puertos = ld.get('puertosConfig', [])
    
    # Solo procesar las 8 que tienen tramo 0 fantasma
    if tramos and len(tramos) >= 2:
        t0 = tramos[0]
        if (t0.get('origin_port_id') == t0.get('destination_port_id')) or float(t0.get('route_distance') or 0) == 0:
            # 1. Construir tramos limpios (eliminar tramo 0 fantasma)
            clean_tramos = copy.deepcopy(tramos[1:])
            # Asegurar que el primer tramo real tenga origen en el puerto de inicio
            if clean_tramos:
                clean_tramos[0]['origin_port_id'] = t0.get('origin_port_id', 'ILO')
            
            # 2. Construir puertosConfig limpios (mover puerto[1] a puerto[0], puerto[2] a puerto[1], etc.)
            clean_puertos = copy.deepcopy(puertos[1:])
            
            # 3. Generar nuevo nombre limpio
            clean_name = name.replace('.ILO.ILO.', '.ILO.')
            if not clean_name.endswith('(V2)'):
                clean_name = f"{clean_name} (V2)"
            
            # 4. Clonar payload legs_data
            clean_ld = copy.deepcopy(ld)
            clean_ld['tramos'] = clean_tramos
            clean_ld['puertosConfig'] = clean_puertos
            
            # 5. Insertar o actualizar en routes_quotes
            clone_payload = {
                'name': clean_name,
                'description': r.get('description', 'COA Cliente Activo'),
                'pais': r.get('pais', 'PE'),
                'client_id': r.get('client_id', 'SPCC'),
                'created_by': r.get('created_by', 'izavala@petral.com.pe'),
                'valid_from': r.get('valid_from'),
                'valid_to': r.get('valid_to'),
                'origin_port_id': t0.get('origin_port_id', 'ILO'),
                'destination_port_id': clean_tramos[-1].get('destination_port_id', 'ILO') if clean_tramos else 'ILO',
                'legs_data': clean_ld
            }
            
            # Insertar en Supabase
            insert_res = supabase.table('routes_quotes').upsert(clone_payload, on_conflict='name').execute()
            print(f"[OK] Clonada con exito: {clean_name}")
            cloned_count += 1

print(f"\nTotal rutas clonadas limpias creadas: {cloned_count}")
