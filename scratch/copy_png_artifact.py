import shutil

src = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Refactorizacion.Multicotizador\FLUJOGRAMA_Arquitectura_Multicotizador_V1.png"
dst = r"C:\Users\rguti\.gemini\antigravity-ide\brain\13b96298-2cdc-4dd7-9295-9ae40f8b4b57\FLUJOGRAMA_Arquitectura_Multicotizador_V1.png"

shutil.copyfile(src, dst)
print("COPIED HIGH LEGIBILITY PNG TO ARTIFACT DIRECTORY SUCCESSFULLY!")
