import os
from dotenv import load_dotenv
from supabase import create_client, Client
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

MESES = {
    1: "ENERO", 2: "FEBRERO", 3: "MARZO", 4: "ABRIL",
    5: "MAYO", 6: "JUNIO", 7: "JULIO", 8: "AGOSTO",
    9: "SETIEMBRE", 10: "OCTUBRE", 11: "NOVIEMBRE", 12: "DICIEMBRE"
}

def format_date_custom(dt):
    if not dt: return 'N/A'
    return f"{dt.year} {MESES[dt.month]} {dt.day:02d}"

def normalize_due(due_str):
    if not due_str or due_str == '0': return None
    try:
        parts = due_str.split('-')
        return f"{parts[0]}-{parts[1]}-{int(parts[2])}"
    except:
        return due_str

def analyze_bow_condor_cycles():
    try:
        # Extraer toda la data del BOW CONDOR en Callao
        response = supabase.table("port_arrivals")\
            .select("ship_due, arrival_eta, snapshot_date, movement_type, terminal")\
            .eq("ship_name", "BOW CONDOR")\
            .eq("port_name", "Callao")\
            .order("snapshot_date", desc=False)\
            .execute()
        
        data = response.data
        if not data: return

        # Agrupar por Manifiesto Normalizado
        voyages = {}
        for r in data:
            due = normalize_due(r['ship_due'])
            if not due: continue # Ignorar registros sin escala válida
            
            if due not in voyages:
                voyages[due] = {
                    'arrival': None,
                    'departure': None,
                    'snapshots': []
                }
            
            # Usar snapshot_date como referencia de tiempo real de presencia
            dt = datetime.strptime(r['snapshot_date'], "%Y-%m-%d")
            voyages[due]['snapshots'].append(dt)
            
            # Si es registro de arribo, marcar fecha
            if r['movement_type'] == 'ARRIVAL' and not voyages[due]['arrival']:
                voyages[due]['arrival'] = dt
            
            # Si es registro de salida, marcar fecha
            if r['movement_type'] == 'DEPARTURE':
                voyages[due]['departure'] = dt

        # Refinar: Si no hay marcas explícitas de ARRIVAL/DEPARTURE, usar min/max snapshots
        voyage_list = []
        for due, v in voyages.items():
            arr = v['arrival'] or min(v['snapshots'])
            dep = v['departure'] or max(v['snapshots'])
            voyage_list.append({
                'due': due,
                'arrival': arr,
                'departure': dep,
                'stay': (dep - arr).days + 1
            })

        # Ordenar por fecha de llegada
        voyage_list.sort(key=lambda x: x['arrival'])

        # Generar Informe Markdown
        md = "# Análisis de Ciclo Logístico: BOW CONDOR (IMO 9214032)\n"
        md += "## Detalle de Escalas, Lead Times y Carga Estimada\n\n"
        md += "| Escala | Arribo | Salida | Estadía | Ciclo | Carga Est. (MT) |\n"
        md += "| :--- | :--- | :--- | :---: | :---: | :---: |\n"

        total_mt = 0
        CARGA_POR_VIAJE = 16000

        for i in range(len(voyage_list)):
            v = voyage_list[i]
            cycle = "---"
            if i > 0:
                prev_v = voyage_list[i-1]
                cycle_days = (v['arrival'] - prev_v['arrival']).days
                cycle = f"{cycle_days} d"
            
            total_mt += CARGA_POR_VIAJE
            f_arr = format_date_custom(v['arrival'])
            f_dep = format_date_custom(v['departure'])
            md += f"| {v['due']} | {f_arr} | {f_dep} | {v['stay']} d | {cycle} | {CARGA_POR_VIAJE:,} |\n"

        md += f"\n### Resumen Consolidado:\n"
        md += f"- **Total Viajes Analizados:** {len(voyage_list)}\n"
        md += f"- **Carga Total Estimada:** **{total_mt:,} MT**\n"
        md += "- **Promedio Mensual Est.:** " + f"{total_mt / 4:,.0f} MT/mes (basado en periodo Feb-May)\n"
        md += "- **Estadía:** Tiempo total de permanencia en el puerto (Snapshot inicial a final).\n"
        md += "- **Ciclo (Lead Time):** Días transcurridos desde el arribo anterior hasta el arribo actual.\n"

        with open(r"C:\Users\rguti\Petral.MARK.INFORMES\Reunion_Nexa\Analisis_Ciclo_BOW_Condor.md", "w", encoding="utf-8") as f:
            f.write(md)
            
        print(f"Markdown generado con {len(voyage_list)} viajes únicos.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_bow_condor_cycles()
