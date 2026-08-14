import os
import shutil

src = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel_CONGELADO_FASE1_13.08.26.tsx"
dst_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Backups"
dst = os.path.join(dst_dir, "MultiCotizadorExcel_CONGELADO_FASE1_13.08.26.tsx")

os.makedirs(dst_dir, exist_ok=True)
if os.path.exists(src):
    shutil.move(src, dst)
    print("BACKUP FILE MOVED OUTSIDE SRC SUCCESSFULLY:", dst)
