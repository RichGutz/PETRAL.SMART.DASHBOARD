import pandas as pd
import numpy as np

def parse_facturacion_to_text(file_path):
    print(f"--- INICIANDO EXTRACCIÓN: {file_path} ---")
    
    xl = pd.ExcelFile(file_path)
    all_records = []
    
    col_names = ['fecha_bl', 'buque', 'voy_no', 'concepto_puerto', 'cantidad_tm', 'flete', 'facturacion']
    
    for sheet in xl.sheet_names:
        print(f"\n--- Procesando pestaña: {sheet} ---")
        
        # Leer toda la hoja saltando cabeceras
        df_raw = pd.read_excel(file_path, sheet_name=sheet, skiprows=6, header=None)
        
        # Primer Semestre (columnas 0 a 6)
        df_sem1 = df_raw.iloc[:, 0:7].copy() if df_raw.shape[1] >= 7 else pd.DataFrame(columns=col_names)
        if not df_sem1.empty:
            df_sem1.columns = col_names
            
        # Segundo Semestre (columnas 9 a 15)
        if df_raw.shape[1] >= 16:
            df_sem2 = df_raw.iloc[:, 9:16].copy()
            df_sem2.columns = col_names
        else:
            df_sem2 = pd.DataFrame(columns=col_names)
            
        # Unir ambos semestres verticalmente
        df = pd.concat([df_sem1, df_sem2], ignore_index=True)
        
        # 1. Limpieza básica: Eliminar filas donde TODO es nulo
        df = df.dropna(how='all')
        
        if df.empty:
            print("Pestaña sin datos.")
            continue
            
        # 2. Filtrar filas de subtotales mensuales (ej. "FACTURADO ENERO 2026")
        df['fecha_bl_str'] = df['fecha_bl'].astype(str).str.strip().str.upper()
        df = df[~df['fecha_bl_str'].str.startswith('FACTURAD', na=False)]
        
        # También eliminar si concepto_puerto tiene subtotales o si no hay facturación ni flete ni cantidad
        df = df.dropna(subset=['facturacion', 'concepto_puerto'], how='all')
        
        # 3. Llenar hacia abajo (forward fill) para heredar el 'voy_no' y el 'buque' en las filas hijas
        df['voy_no'] = df['voy_no'].ffill()
        df['buque'] = df['buque'].ffill()
        
        # 4. Si el buque sigue nulo, extraerlo del nombre de la pestaña (ej. "FACTURACION MOQUEGUA")
        default_buque = sheet.replace('FACTURACION', '').strip()
        df['buque'] = df['buque'].fillna(default_buque)
        
        # Iterar sobre las filas limpias para mostrar el resultado
        for index, row in df.iterrows():
            if pd.isna(row['facturacion']) and pd.isna(row['cantidad_tm']):
                continue # Saltar filas que quedaron basura
                
            voy_no = str(row['voy_no']).split('.')[0] if not pd.isna(row['voy_no']) else "S/N"
            buque = str(row['buque']).strip()
            concepto = str(row['concepto_puerto']).strip()
            monto = row['facturacion']
            
            # Determinar si es viaje principal o concepto adicional
            tipo = "VIAJE PRINCIPAL   " if not pd.isna(row['fecha_bl']) and not pd.isna(row['cantidad_tm']) else "CONCEPTO ADICIONAL"
            
            # Extraemos la data formateada
            record = f"[{buque} - VOY {voy_no}] | {tipo} | {concepto:<25} | Monto: {monto}"
            all_records.append(record)
            print(record)

    print("\n--- FIN DE EXTRACCIÓN ---")
    print(f"Total de registros válidos extraídos: {len(all_records)}")

if __name__ == "__main__":
    file_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Facturacion 2026 - 17.06.2026.xlsx"
    parse_facturacion_to_text(file_path)
