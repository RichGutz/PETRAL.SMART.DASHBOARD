import shutil

src = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel.tsx"
dst = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\components\CommercialForecast\MultiCotizadorExcel_CONGELADO_FASE1_13.08.26.tsx"

shutil.copyfile(src, dst)
print("BACKUP FILE CREATED SUCCESSFULLY: MultiCotizadorExcel_CONGELADO_FASE1_13.08.26.tsx")
