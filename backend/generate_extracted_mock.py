import pandas as pd
import numpy as np
import os

def parse_facturacion_to_md_and_pdf(file_path):
    print(f"--- INICIANDO EXTRACCIÓN PARA MOCK: {file_path} ---")
    
    xl = pd.ExcelFile(file_path)
    all_data = []
    
    col_names = ['fecha_bl', 'buque', 'voy_no', 'concepto_puerto', 'cantidad_tm', 'flete', 'facturacion']
    
    for sheet in xl.sheet_names:
        df_raw = pd.read_excel(file_path, sheet_name=sheet, skiprows=6, header=None)
        
        # Semestre 1
        df_sem1 = df_raw.iloc[:, 0:7].copy() if df_raw.shape[1] >= 7 else pd.DataFrame(columns=col_names)
        if not df_sem1.empty: df_sem1.columns = col_names
            
        # Semestre 2
        if df_raw.shape[1] >= 16:
            df_sem2 = df_raw.iloc[:, 9:16].copy()
            df_sem2.columns = col_names
        else:
            df_sem2 = pd.DataFrame(columns=col_names)
            
        df = pd.concat([df_sem1, df_sem2], ignore_index=True)
        df = df.dropna(how='all')
        
        if df.empty: continue
            
        df['fecha_bl_str'] = df['fecha_bl'].astype(str).str.strip().str.upper()
        df = df[~df['fecha_bl_str'].str.startswith('FACTURAD', na=False)]
        df = df.dropna(subset=['facturacion', 'concepto_puerto'], how='all')
        
        df['voy_no'] = df['voy_no'].ffill()
        df['buque'] = df['buque'].ffill()
        
        default_buque = sheet.replace('FACTURACION', '').strip()
        df['buque'] = df['buque'].fillna(default_buque)
        
        for index, row in df.iterrows():
            if pd.isna(row['facturacion']) and pd.isna(row['cantidad_tm']): continue
                
            voy_no = str(row['voy_no']).split('.')[0] if not pd.isna(row['voy_no']) else "S/N"
            buque = str(row['buque']).strip()
            concepto = str(row['concepto_puerto']).strip()
            
            # Limpiar floats para visualización
            facturacion = f"${float(row['facturacion']):,.2f}" if pd.notnull(row['facturacion']) else "-"
            cantidad = f"{float(row['cantidad_tm']):,.2f}" if pd.notnull(row['cantidad_tm']) else "-"
            flete = f"${float(row['flete']):,.2f}" if pd.notnull(row['flete']) else "-"
            fecha = str(row['fecha_bl']).split(' ')[0] if pd.notnull(row['fecha_bl']) else "-"
            
            tipo = "VIAJE PRINCIPAL" if pd.notnull(row['fecha_bl']) and pd.notnull(row['cantidad_tm']) else "CONCEPTO ADICIONAL"
            
            all_data.append({
                "TIPO": tipo,
                "BUQUE": buque,
                "VOY NO": voy_no,
                "FECHA B/L": fecha,
                "CONCEPTO / PUERTO": concepto,
                "CANTIDAD TM": cantidad,
                "FLETE": flete,
                "FACTURACIÓN": facturacion
            })

    df_final = pd.DataFrame(all_data)
    
    # 1. Generar Markdown
    md_path = r"C:\Users\rguti\.gemini\antigravity-ide\brain\a89eb1ed-9414-4178-aa7b-2aa8229efc93\extracted_facturacion_data.md"
    
    md_content = "# Data Cruda Extraída (Script de Facturación)\n\n"
    md_content += "Esta tabla muestra exactamente los 81 registros que el script extrajo y limpió, heredando los números de viaje.\n\n"
    md_content += df_final.to_markdown(index=False)
    
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    print(f"Markdown generado: {md_path}")
    
    # 2. Generar PDF (usando matplotlib para dibujar la tabla de los primeros 30 registros como un MOCK visual rápido)
    import matplotlib.pyplot as plt
    
    pdf_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\EXTRACCION_FACTURACION_MOCK.pdf"
    
    # Tomamos una muestra representativa (primeros 25) para que entre bien en un PDF A3/A4
    df_sample = df_final.head(30)
    
    fig, ax = plt.subplots(figsize=(14, 8)) # Tamaño ancho
    ax.axis('tight')
    ax.axis('off')
    
    table = ax.table(cellText=df_sample.values, colLabels=df_sample.columns, loc='center', cellLoc='center')
    table.auto_set_font_size(False)
    table.set_fontsize(8)
    table.scale(1.2, 1.2)
    
    # Colorear cabeceras
    for (row, col), cell in table.get_celld().items():
        if row == 0:
            cell.set_text_props(weight='bold', color='white')
            cell.set_facecolor('#0277BD')
        else:
            # Resaltar viajes principales vs adicionales
            if df_sample.iloc[row-1]['TIPO'] == 'VIAJE PRINCIPAL':
                cell.set_facecolor('#E1F5FE')
            else:
                cell.set_facecolor('#FFF8E1')
                
    plt.title("MOCK de la Tabla Extraída (Primeros 30 registros)", fontsize=14, pad=20)
    plt.savefig(pdf_path, format='pdf', bbox_inches='tight')
    
    print(f"PDF generado: {pdf_path}")

if __name__ == "__main__":
    file_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\Facturacion 2026 - 17.06.2026.xlsx"
    parse_facturacion_to_md_and_pdf(file_path)
