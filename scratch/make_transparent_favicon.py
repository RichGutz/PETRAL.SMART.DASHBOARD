import os
from PIL import Image
import numpy as np

img_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\LOGO.DELFOS.NUEVO.BLANCO.3.jpg"
img = Image.open(img_path).convert("RGB")
arr = np.array(img, dtype=np.float64)

# White removal algorithm with color de-contamination (un-premultiply white)
# Pure white is [255, 255, 255]
# Alpha is proportional to darkness/saturation distance from white
# Let's compute alpha:
# If a pixel is pure white (e.g. R>250, G>250, B>250), alpha -> 0
# For anti-aliased edge pixels, alpha is smoothly interpolated and RGB is recovered without white fringe.

# Distance from pure white
diff = 255.0 - arr # [H, W, 3], positive values where darker
# Max difference across channels indicates opacity
max_diff = np.max(diff, axis=2)

# Set a threshold where background is considered pure white (e.g. diff < 8 => alpha = 0)
white_thresh = 6.0
alpha_max = 240.0 # fully opaque threshold

alpha = np.clip((max_diff - white_thresh) / (alpha_max - white_thresh), 0.0, 1.0)

# Un-blend white: C = alpha * F + (1 - alpha) * 255
# => F = (C - (1 - alpha) * 255) / alpha
fg = np.zeros_like(arr)
mask = alpha > 0.001
for c in range(3):
    fg[..., c][mask] = np.clip((arr[..., c][mask] - (1.0 - alpha[mask]) * 255.0) / alpha[mask], 0.0, 255.0)
    fg[..., c][~mask] = 0.0

rgba = np.dstack([fg.astype(np.uint8), (alpha * 255.0).astype(np.uint8)])
transparent_img = Image.fromarray(rgba, mode="RGBA")

# Bounding box crop with nice padding
bbox = transparent_img.getbbox()
print("BBox with alpha:", bbox)
cropped = transparent_img.crop(bbox)

# Make it square with subtle margin (5%) for perfect tab display
cw, ch = cropped.size
size = max(cw, ch)
margin = int(size * 0.06)
square_size = size + 2 * margin

square_img = Image.new("RGBA", (square_size, square_size), (0, 0, 0, 0))
offset_x = (square_size - cw) // 2
offset_y = (square_size - ch) // 2
square_img.paste(cropped, (offset_x, offset_y), cropped)

# Save high-res transparent PNG
out_root_png = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\LOGO.DELFOS.NUEVO.BLANCO.3.transparent.png"
square_img.save(out_root_png, format="PNG")
print(f"Saved: {out_root_png}")

# Save to Geeksoft_Frontend/public
frontend_pub = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\public"
out_fav_png = os.path.join(frontend_pub, "favicon.png")
out_fav_ico = os.path.join(frontend_pub, "favicon.ico")

# High res PNG (512x512)
fav_512 = square_img.resize((512, 512), Image.Resampling.LANCZOS)
fav_512.save(out_fav_png, format="PNG")
print(f"Saved: {out_fav_png}")

# Multi-resolution ICO (16, 32, 48, 64, 128, 256)
fav_512.save(out_fav_ico, format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
print(f"Saved: {out_fav_ico}")
