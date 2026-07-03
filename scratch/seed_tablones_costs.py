import psycopg2

def seed_tablones():
    db_uri = "postgresql://postgres.hjjxooxcpvlvbaxgifbn:VivaLaVida2026$@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
    
    # Lista de tuplas para insertar:
    # (client_id, port_id, terminal, operation_type, vessel_id, concept_id, cost, rate_usd, multiplier_source)
    data = [
        # --- ILO (CARGA - SPCC - TABLONES) - Total $23,503.50
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'pilotage', 3000, 1500, 'FIXED'),
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'linesmen', 5780, 5780, 'FIXED'), # Amarre y desamarre (5100) + linesmen (680)
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'towage_1st', 4943, 4943, 'FIXED'),
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'shifting_surcharges', 1800, 1800, 'FIXED'),
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'lighthouse_dues', 1364, 1364, 'FIXED'),
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'dockage', 1436.5, 1436.5, 'FIXED'),
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'launch_hire', 2760, 2760, 'FIXED'), # Launch Hire (2580) + Launch autoridades (180)
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'coordinator_board', 400, 400, 'FIXED'),
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'clearance', 200, 200, 'FIXED'),
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'sanitary_inspection', 520, 520, 'FIXED'),
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'agency_fee', 900, 900, 'FIXED'),
        ('SPCC', 'ILO', 'GENERAL', 'CARGA', 'TABLONES', 'transportation_communication', 400, 400, 'FIXED'),

        # --- MATARANI (DESCARGA - SPCC - TABLONES) - Total $18,244.00
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'towage_1st', 3700, 3700, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'towage_2nd', 3700, 3700, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'pilotage', 280, 70, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'shifting_surcharges', 2000, 2000, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'lighthouse_dues', 1364, 1364, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'dockage', 3800, 0.57, 'LOA'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'launch_hire', 550, 550, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'sanitary_inspection', 700, 700, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'clearance', 200, 200, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'coordinator_board', 450, 150, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'agency_fee', 1100, 1100, 'FIXED'),
        ('SPCC', 'MATARANI', 'GENERAL', 'DESCARGA', 'TABLONES', 'transportation_communication', 400, 400, 'FIXED'),

        # --- MARCONA (DESCARGA - SPCC - TABLONES) - Total $41,134.00
        ('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'TABLONES', 'towage_1st', 36000, 18000, 'FIXED'),
        ('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'TABLONES', 'lighthouse_dues', 1364, 1364, 'FIXED'),
        ('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'TABLONES', 'launch_hire', 400, 400, 'FIXED'), # Launch Hire (200) + Launch for Authorities (200)
        ('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'TABLONES', 'coordinator_board', 675, 675, 'FIXED'),
        ('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'TABLONES', 'clearance', 200, 200, 'FIXED'),
        ('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'TABLONES', 'sanitary_inspection', 670, 670, 'FIXED'),
        ('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'TABLONES', 'agency_fee', 1400, 1400, 'FIXED'),
        ('SPCC', 'MARCONA', 'GENERAL', 'DESCARGA', 'TABLONES', 'transportation_communication', 425, 425, 'FIXED'),

        # --- CALLAO (DESCARGA - SPCC - TABLONES) - Total $15,206.83
        ('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'TABLONES', 'pilotage', 1500, 1500, 'FIXED'),
        ('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'TABLONES', 'towage_1st', 2800, 2800, 'FIXED'),
        ('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'TABLONES', 'lighthouse_dues', 248, 248, 'FIXED'),
        ('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'TABLONES', 'dockage', 7088.832, 1.50, 'FIXED'),
        ('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'TABLONES', 'launch_hire', 450, 450, 'FIXED'),
        ('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'TABLONES', 'coordinator_board', 1000, 1000, 'FIXED'),
        ('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'TABLONES', 'sanitary_inspection', 720, 720, 'FIXED'),
        ('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'TABLONES', 'agency_fee', 1000, 1000, 'FIXED'),
        ('SPCC', 'CALLAO', 'GENERAL', 'DESCARGA', 'TABLONES', 'transportation_communication', 400, 400, 'FIXED'),

        # --- MEJILLONES - TERMINAL A (DESCARGA - SPCC - TABLONES) - Total $52,104.10
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'pilotage', 1808.62, 1808.62, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'towage_1st', 11200, 2800, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'shifting_surcharges', 1330, 1330, 'FIXED'), # Seguro practico (330) + Recargos (1000)
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'linesmen', 1282.1, 1282.1, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'lighthouse_dues', 2500, 2500, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'dockage', 22810.032, 3.99, 'LOA'),
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'launch_hire', 4720, 4720, 'FIXED'), # Launch Hire (2920) + Transport (1800)
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'clearance', 1140.35, 1140.35, 'FIXED'), # ISPS Fee
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'sanitary_inspection', 848, 848, 'FIXED'), # Inmigr (28) + Salud (120) + Charges (700)
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'loading_master', 3265, 3265, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERMINAL_A', 'DESCARGA', 'TABLONES', 'agency_fee', 1200, 1200, 'FIXED'),

        # --- MEJILLONES - INTERACID (DESCARGA - SPCC - TABLONES) - Total $48,786.00
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'pilotage', 1389, 1389, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'towage_1st', 11200, 2800, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'shifting_surcharges', 1330, 1330, 'FIXED'), # Seguro practico (330) + Recargos (1000)
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'linesmen', 1743, 1743, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'lighthouse_dues', 2500, 2500, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'dockage', 20000, 20000, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'launch_hire', 4170, 4170, 'FIXED'), # Launch Hire (2920) + Transport (1250)
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'clearance', 1141, 1141, 'FIXED'), # ISPS Fee
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'sanitary_inspection', 848, 848, 'FIXED'), # Inmigr (28) + Salud (120) + Charges (700)
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'loading_master', 3265, 3265, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'INTERACID', 'DESCARGA', 'TABLONES', 'agency_fee', 1200, 1200, 'FIXED'),

        # --- MEJILLONES - TERQUIM (DESCARGA - SPCC - TABLONES) - Total $58,152.70
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'pilotage', 1808.62, 1808.62, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'towage_1st', 11200, 2800, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'shifting_surcharges', 1330, 1330, 'FIXED'), # Seguro practico (330) + Recargos (1000)
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'linesmen', 1602, 1602, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'lighthouse_dues', 2500, 2500, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'dockage', 27250.08, 5.72, 'LOA'),
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'launch_hire', 6170, 6170, 'FIXED'), # Launch Hire (2770) + Transport (400) + Hose (3000)
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'clearance', 1191, 1191, 'FIXED'), # ISPS Fee
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'sanitary_inspection', 978, 978, 'FIXED'), # Inmigr (28) + Salud (300) + Charges (650)
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'loading_master', 2923, 2923, 'FIXED'),
        ('SPCC', 'MEJILLONES', 'TERQUIM', 'DESCARGA', 'TABLONES', 'agency_fee', 1200, 1200, 'FIXED'),

        # --- BARQUITO (DESCARGA - SPCC - TABLONES) - Total $86,737.60
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'pilotage', 1803, 1803, 'FIXED'),
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'towage_1st', 38460, 38460, 'FIXED'),
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'shifting_surcharges', 1330, 1330, 'FIXED'), # Seguro (330) + Recargos (1000)
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'linesmen', 2350, 2350, 'FIXED'),
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'lighthouse_dues', 2500, 2500, 'FIXED'),
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'dockage', 2301.44, 71.92, 'PORT_HOURS'),
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'launch_hire', 16193.16, 16193.16, 'FIXED'), # Lanchas (7433.16) + Transport (760) + Other services (2000) + Launchboats (6000)
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'towage_2nd', 18000, 675, 'PORT_HOURS'), # Tug standby
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'sanitary_inspection', 150, 150, 'FIXED'), # Inmigr (20) + Salud (130)
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'loading_master', 2450, 2450, 'FIXED'),
        ('SPCC', 'BARQUITO', 'GENERAL', 'DESCARGA', 'TABLONES', 'agency_fee', 1200, 1200, 'FIXED')
    ]
    
    conn = None
    try:
        conn = psycopg2.connect(db_uri)
        cur = conn.cursor()
        
        # Eliminar previos
        print("Eliminando tarifas previas para el buque TABLONES...")
        cur.execute("DELETE FROM port_costs_matrix WHERE vessel_id = 'TABLONES';")
        deleted = cur.rowcount
        print(f"Tarifas eliminadas: {deleted}")
        
        # Insertar nuevas
        print("Insertando nuevas tarifas para el buque TABLONES...")
        insert_query = """
            INSERT INTO port_costs_matrix 
            (client_id, port_id, terminal, operation_type, vessel_id, concept_id, cost, rate_usd, multiplier_source) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
        """
        cur.executemany(insert_query, data)
        print(f"Sembramos {cur.rowcount} registros exitosamente.")
        
        conn.commit()
        print("Transacción confirmada en Supabase.")
        
        # Validación
        cur.execute("""
            SELECT port_id, terminal, SUM(cost) 
            FROM port_costs_matrix 
            WHERE vessel_id = 'TABLONES' 
            GROUP BY port_id, terminal 
            ORDER BY port_id, terminal;
        """)
        print("\n--- Verificación de Totales por Puerto/Terminal ---")
        rows = cur.fetchall()
        for r in rows:
            print(f"Puerto: {r[0]} | Terminal: {r[1]} | Costo Acumulado: ${r[2]:,.2f} USD")
            
        cur.close()
    except Exception as e:
        print(f"ERROR: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    seed_tablones()
