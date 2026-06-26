import psycopg2

conn_str = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

# Data extraida de test_voyage_ledger.py (y del frontend)
excel_scenarios = [
    {"vessel": "TABLONES", "route": "ILO-MATARANI", "act_load": 500, "act_disch": 300, "port_days": 3.5417, "sea_days": 0.5384, "bunker": 20601.88, "voy_res": 195033.12, "tot_dur": 4.0801, "tce_real": 47801.35, "pl_vs_req": 133831.98},
    {"vessel": "TABLONES", "route": "ILO-MARCONA", "act_load": 500, "act_disch": 300, "port_days": 3.5417, "sea_days": 2.2083, "bunker": 42275.73, "voy_res": 198794.27, "tot_dur": 5.7499, "tce_real": 34573.37, "pl_vs_req": 112545.40},
    {"vessel": "TABLONES", "route": "ILO-MEJILLONES", "act_load": 500, "act_disch": 300, "port_days": 3.5417, "sea_days": 2.6140, "bunker": 50042.28, "voy_res": 176702.72, "tot_dur": 6.1557, "tce_real": 28705.63, "pl_vs_req": 84367.50},
    {"vessel": "MOQUEGUA", "route": "ILO-MATARANI", "act_load": 500, "act_disch": 300, "port_days": 3.5417, "sea_days": 0.5384, "bunker": 18560.53, "voy_res": 199074.47, "tot_dur": 4.0801, "tce_real": 48791.86, "pl_vs_req": 146033.49},
    {"vessel": "MOQUEGUA", "route": "ILO-MARCONA", "act_load": 500, "act_disch": 300, "port_days": 3.5417, "sea_days": 2.2083, "bunker": 39487.00, "voy_res": 206583.00, "tot_dur": 5.7499, "tce_real": 35927.95, "pl_vs_req": 131833.98},
    {"vessel": "MOQUEGUA", "route": "ILO-MEJILLONES", "act_load": 500, "act_disch": 300, "port_days": 3.5417, "sea_days": 2.6140, "bunker": 47071.94, "voy_res": 183673.06, "tot_dur": 6.1557, "tce_real": 29837.97, "pl_vs_req": 103649.20},
    {"vessel": "CONCON_TRADER", "route": "ILO-MATARANI", "act_load": 500, "act_disch": 300, "port_days": 3.5417, "sea_days": 0.5384, "bunker": 20360.91, "voy_res": 193774.09, "tot_dur": 4.0801, "tce_real": 47492.77, "pl_vs_req": 112172.58},
    {"vessel": "CONCON_TRADER", "route": "ILO-MARCONA", "act_load": 500, "act_disch": 300, "port_days": 3.5417, "sea_days": 2.2083, "bunker": 41287.38, "voy_res": 182282.62, "tot_dur": 5.7499, "tce_real": 31701.74, "pl_vs_req": 67284.13},
    {"vessel": "CONCON_TRADER", "route": "ILO-MEJILLONES", "act_load": 500, "act_disch": 300, "port_days": 3.5417, "sea_days": 2.6140, "bunker": 48872.32, "voy_res": 137372.68, "tot_dur": 6.1557, "tce_real": 22316.40, "pl_vs_req": 14259.04}
]

try:
    conn = psycopg2.connect(conn_str)
    conn.autocommit = True
    cur = conn.cursor()

    print("1. Creando tabla audit_benchmarks...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.audit_benchmarks (
            benchmark_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            scenario_key VARCHAR NOT NULL UNIQUE,
            excel_source_file VARCHAR DEFAULT 'test_voyage_ledger.py',
            execution_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            act_load NUMERIC,
            act_disch NUMERIC,
            port_days NUMERIC,
            sea_days NUMERIC,
            bunker_costs NUMERIC,
            voyage_result NUMERIC,
            total_duration NUMERIC,
            tce_real NUMERIC,
            pl_vs_req NUMERIC
        );
    """)
    
    print("2. Habilitando RLS publico para lectura...")
    cur.execute("""
        ALTER TABLE public.audit_benchmarks ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.audit_benchmarks;
        CREATE POLICY "Enable read access for all users" ON public.audit_benchmarks FOR SELECT USING (true);
    """)

    print("3. Limpiando datos anteriores e insertando benchmarks...")
    cur.execute("TRUNCATE TABLE public.audit_benchmarks;")
    
    insert_query = """
        INSERT INTO public.audit_benchmarks 
        (scenario_key, act_load, act_disch, port_days, sea_days, bunker_costs, voyage_result, total_duration, tce_real, pl_vs_req)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    for s in excel_scenarios:
        key = f"{s['vessel']}-{s['route']}"
        cur.execute(insert_query, (
            key, s['act_load'], s['act_disch'], s['port_days'], s['sea_days'], 
            s['bunker'], s['voy_res'], s['tot_dur'], s['tce_real'], s['pl_vs_req']
        ))
        
    print("¡9 Escenarios insertados exitosamente!")

except Exception as e:
    print(f"Error: {e}")
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
