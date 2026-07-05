import psycopg2
import sys

try:
    conn = psycopg2.connect(
        host="aws-1-us-east-2.pooler.supabase.com",
        port=6543,
        user="postgres.hjjxooxcpvlvbaxgifbn",
        password="VivaLaVida2026$",
        dbname="postgres"
    )
    conn.autocommit = True
    cur = conn.cursor()

    print("Dropping existing primary key if exists...")
    try:
        cur.execute("ALTER TABLE sources_sinks DROP CONSTRAINT sources_sinks_pkey;")
    except Exception as e:
        print("Note:", e)

    print("Adding new columns...")
    cur.execute("ALTER TABLE sources_sinks ADD COLUMN IF NOT EXISTS empresa VARCHAR(255);")
    cur.execute("ALTER TABLE sources_sinks ADD COLUMN IF NOT EXISTS color_hex VARCHAR(10);")

    print("Updating existing rows with dummy data to allow PK...")
    cur.execute("UPDATE sources_sinks SET empresa = 'Pendiente' WHERE empresa IS NULL;")

    print("Setting NOT NULL and adding Primary Key...")
    cur.execute("ALTER TABLE sources_sinks ALTER COLUMN empresa SET NOT NULL;")
    try:
        cur.execute("ALTER TABLE sources_sinks ADD PRIMARY KEY (port_id, year, empresa);")
    except Exception as e:
        print("Note:", e)

    print("Seeding specific companies and colors...")
    # Clean up dummy 'Pendiente' rows first
    cur.execute("DELETE FROM sources_sinks WHERE empresa = 'Pendiente';")

    # Insert proper seed data
    seed_data = [
        ('ILO', 2026, 350000, 'SOURCE', 'Southern Copper', '#F59E0B'),
        ('MATARANI', 2026, 150000, 'SINK', 'Cerro Verde', '#10B981'),
        ('MARCONA', 2026, 120000, 'SINK', 'Marcobre', '#F43F5E'),
        ('CALLAO', 2026, 80000, 'SINK', 'Volcan', '#8B5CF6'),
        ('MEJILLONES', 2026, 200000, 'SINK', 'Codelco', '#EC4899'),
        ('BARQUITO', 2026, 100000, 'SINK', 'Enami', '#14B8A6')
    ]
    
    for row in seed_data:
        cur.execute("""
            INSERT INTO sources_sinks (port_id, year, capacity_mt, type, empresa, color_hex)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (port_id, year, empresa) DO UPDATE 
            SET capacity_mt = EXCLUDED.capacity_mt, type = EXCLUDED.type, color_hex = EXCLUDED.color_hex;
        """, row)

    print("Migration and seeding completed successfully!")
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
