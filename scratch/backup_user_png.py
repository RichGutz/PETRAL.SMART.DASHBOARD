import os
import shutil
import glob

brain_dir = r"C:\Users\rguti\.gemini\antigravity-ide\brain\03d65bbe-4a68-414b-91bf-a20dfc58fce2"
user_uploaded = os.path.join(brain_dir, ".user_uploaded")

png_files = glob.glob(os.path.join(user_uploaded, "*.png"))
print("Found PNG files:", png_files)

dst1 = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs"
dst2 = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA"

os.makedirs(dst1, exist_ok=True)
os.makedirs(dst2, exist_ok=True)

for src in png_files:
    fname = os.path.basename(src)
    # copy to dst1 and dst2
    dest_path1 = os.path.join(dst1, f"FEEDBACK_USER_{fname}")
    dest_path2 = os.path.join(dst2, f"FEEDBACK_USER_{fname}")
    shutil.copy2(src, dest_path1)
    shutil.copy2(src, dest_path2)
    print(f"Copied {fname} to {dest_path1} and {dest_path2}")
