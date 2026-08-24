import sys
import psycopg2
import json
import pandas as pd

sys.stdout.reconfigure(encoding='utf-8')

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
conn = psycopg2.connect(conn_str)
conn.autocommit = True
cur = conn.cursor()

print("1. Creando tabla 'demurrage_records' en Supabase...")
cur.execute("""
    CREATE TABLE IF NOT EXISTS demurrage_records (
        id TEXT PRIMARY KEY,
        client_name TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        date_str TEXT,
        vessel_name TEXT NOT NULL,
        voyage_number INTEGER NOT NULL,
        ilo_hours NUMERIC(10,2) DEFAULT 0,
        ilo_days NUMERIC(10,4) DEFAULT 0,
        callao_hours NUMERIC(10,2) DEFAULT 0,
        callao_days NUMERIC(10,4) DEFAULT 0,
        marcona_hours NUMERIC(10,2) DEFAULT 0,
        marcona_days NUMERIC(10,4) DEFAULT 0,
        matarani_hours NUMERIC(10,2) DEFAULT 0,
        matarani_days NUMERIC(10,4) DEFAULT 0,
        mejillones_hours NUMERIC(10,2) DEFAULT 0,
        mejillones_days NUMERIC(10,4) DEFAULT 0,
        total_hours NUMERIC(10,2) DEFAULT 0,
        total_days NUMERIC(10,4) DEFAULT 0,
        raw_json JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
""")
print("   ✅ Tabla 'demurrage_records' creada / verificada.")

# Habilitar RLS con política permisiva pública o autenticada
cur.execute("""
    ALTER TABLE demurrage_records ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Demurrage Access" ON demurrage_records;
    CREATE POLICY "Public Demurrage Access" ON demurrage_records FOR ALL USING (true) WITH CHECK (true);
""")
print("   ✅ RLS y políticas configuradas.")

# 2. Cargar datos del Excel y sembrar
excel_path = r'C:\Users\rguti\PETRAL.SMART.DASHBOARD\Documentos.Petral\Demoras historicos Naves.xlsx'
df = pd.read_excel(excel_path, sheet_name='Hoja1 (3)', header=1)
df_clean = df[df['Cliente'].notna() & (df['Cliente'] != '') & (~df['Cliente'].astype(str).str.contains('Promedio', case=False))].copy()

# Limpiar para resembrar
cur.execute("DELETE FROM demurrage_records;")

inserted_count = 0
for idx, row in df_clean.iterrows():
    cliente = str(row['Cliente']).strip()
    year = int(row['Año']) if pd.notna(row['Año']) else 2024
    
    mes_raw = row['Mes']
    if isinstance(mes_raw, pd.Timestamp):
        month = mes_raw.month
        date_str = mes_raw.strftime('%Y-%m-%d')
    elif isinstance(mes_raw, str) and '-' in mes_raw:
        date_str = mes_raw
        try:
            month = int(mes_raw.split('-')[1])
        except:
            month = 1
    else:
        month = 1
        date_str = f'{year}-01-01'
        
    nave = str(row['Nave']).strip()
    viaje = int(row['Viaje']) if pd.notna(row['Viaje']) else 0
    rec_id = f"{nave}_{viaje}_{year}_{idx}"
    
    def get_vals(col_name):
        h = row.get(col_name)
        d = row.get(f"{col_name}.1")
        h_val = float(h) if pd.notna(h) else None
        d_val = float(d) if pd.notna(d) else None
        final_h = round(h_val if h_val is not None else (d_val * 24.0 if d_val is not None else 0), 2)
        final_d = round(d_val if d_val is not None else (h_val / 24.0 if h_val is not None else 0), 4)
        return final_h, final_d

    ilo_h, ilo_d = get_vals('Puerto ILO')
    cal_h, cal_d = get_vals('Callao')
    mar_h, mar_d = get_vals('Marcona')
    mat_h, mat_d = get_vals('Matarani')
    mej_h, mej_d = get_vals('Mejillones')
    
    tot_h = round(ilo_h + cal_h + mar_h + mat_h + mej_h, 2)
    tot_d = round(ilo_d + cal_d + mar_d + mat_d + mej_d, 4)
    
    raw_payload = {
        "id": rec_id,
        "client": cliente,
        "year": year,
        "month": month,
        "date": date_str,
        "vessel": nave,
        "voyage": viaje,
        "ports": {
            "ILO": {"hours": ilo_h, "days": ilo_d} if (ilo_h or ilo_d) else None,
            "CALLAO": {"hours": cal_h, "days": cal_d} if (cal_h or cal_d) else None,
            "MARCONA": {"hours": mar_h, "days": mar_d} if (mar_h or mar_d) else None,
            "MATARANI": {"hours": mat_h, "days": mat_d} if (mat_h or mat_d) else None,
            "MEJILLONES": {"hours": mej_h, "days": mej_d} if (mej_h or mej_d) else None
        },
        "total_hours": tot_h,
        "total_days": tot_d
    }
    # Limpiar None en ports
    raw_payload["ports"] = {k: v for k, v in raw_payload["ports"].items() if v is not None}
    
    cur.execute("""
        INSERT INTO demurrage_records (
            id, client_name, year, month, date_str, vessel_name, voyage_number,
            ilo_hours, ilo_days, callao_hours, callao_days, marcona_hours, marcona_days,
            matarani_hours, matarani_days, mejillones_hours, mejillones_days,
            total_hours, total_days, raw_json
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s
        );
    """, (
        rec_id, cliente, year, month, date_str, nave, viaje,
        ilo_h, ilo_d, cal_h, cal_d, mar_h, mar_d,
        mat_h, mat_d, mej_h, mej_d,
        tot_h, tot_d, json.dumps(raw_payload)
    ))
    inserted_count += 1

print(f"🎉 ÉXITO: Se insertaron {inserted_count} registros históricos en Supabase tabla 'demurrage_records'.")
cur.close()
conn.close()
