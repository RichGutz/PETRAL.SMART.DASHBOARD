import os
import json
from supabase import create_client

backend_env = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine\.env"
supabase_url = None
supabase_key = None

if os.path.exists(backend_env):
    with open(backend_env, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("SUPABASE_URL="):
                supabase_url = line.strip().split("=", 1)[1].strip('"\'')
            elif line.startswith("SUPABASE_SERVICE_ROLE_KEY=") or line.startswith("SUPABASE_KEY="):
                if not supabase_key:
                    supabase_key = line.strip().split("=", 1)[1].strip('"\'')

client = create_client(supabase_url, supabase_key)
# Traer todos los registros
res = client.table("demurrage_records").select("*").order("year", desc=False).order("month", desc=False).execute()
rows = res.data

print(f"Total registros obtenidos de Supabase: {len(rows)}")

mapped_records = []
for row in rows:
    if row.get("raw_json") and isinstance(row["raw_json"], dict):
        mapped_records.append(row["raw_json"])
    else:
        mapped_records.append({
            "id": row.get("id"),
            "client": row.get("client_name") or "PETRAL",
            "year": int(row.get("year") or 2026),
            "month": int(row.get("month") or 1),
            "date": row.get("date_str") or f"{row.get('year')}-01-01",
            "vessel": row.get("vessel_name") or "",
            "voyage": int(row.get("voyage_number") or 0),
            "ports": {
                "ILO": {"hours": float(row.get("ilo_hours") or 0), "days": float(row.get("ilo_days") or 0)},
                "CALLAO": {"hours": float(row.get("callao_hours") or 0), "days": float(row.get("callao_days") or 0)},
                "MARCONA": {"hours": float(row.get("marcona_hours") or 0), "days": float(row.get("marcona_days") or 0)},
                "MATARANI": {"hours": float(row.get("matarani_hours") or 0), "days": float(row.get("matarani_days") or 0)},
                "MEJILLONES": {"hours": float(row.get("mejillones_hours") or 0), "days": float(row.get("mejillones_days") or 0)}
            },
            "total_hours": float(row.get("total_hours") or 0),
            "total_days": float(row.get("total_days") or 0)
        })

dest_json = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\data\historicalDemurrageData.json"
with open(dest_json, "w", encoding="utf-8") as f:
    json.dump(mapped_records, f, indent=2, ensure_ascii=False)

print(f"Guardados exitosamente {len(mapped_records)} registros en {dest_json}")
