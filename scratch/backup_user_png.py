import os
import glob
import shutil
import time

dest1 = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Obsidian.Maestro.Costos.Portuarios\PNGs"
dest2 = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Exceles.Petral\PORT.COSTS.PATRICIA"

os.makedirs(dest1, exist_ok=True)
os.makedirs(dest2, exist_ok=True)

# Search for png files in temp / gemini folders modified recently
search_dirs = [
    r"C:\Users\rguti\.gemini\antigravity-ide",
    r"C:\Users\rguti\AppData\Local\Temp",
    os.environ.get("TEMP", "")
]

recent_pngs = []
for d in search_dirs:
    if d and os.path.exists(d):
        for root, dirs, files in os.walk(d):
            for f in files:
                if f.lower().endswith('.png'):
                    full_p = os.path.join(root, f)
                    try:
                        mtime = os.path.getmtime(full_p)
                        recent_pngs.append((mtime, full_p))
                    except Exception:
                        pass

recent_pngs.sort(key=lambda x: x[0], reverse=True)

print(f"Found {len(recent_pngs)} PNGs.")
copied = []
for mtime, p in recent_pngs[:5]:
    filename = f"user_screenshot_{int(mtime)}.png"
    target1 = os.path.join(dest1, filename)
    target2 = os.path.join(dest2, filename)
    shutil.copy2(p, target1)
    shutil.copy2(p, target2)
    print(f"Copied {p} -> {target1} and {target2}")
    copied.append(target1)

