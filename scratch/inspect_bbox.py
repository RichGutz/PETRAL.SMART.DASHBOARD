from PIL import Image
import numpy as np

img = Image.open(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\LOGO.DELFOS.NUEVO.BLANCO.3.jpg").convert("RGBA")
arr = np.array(img, dtype=np.float32)

# Find bounding box of non-white pixels (e.g. RGB not pure white)
# Distance from white (255, 255, 255)
dist_from_white = np.sqrt(
    (255 - arr[:, :, 0])**2 + 
    (255 - arr[:, :, 1])**2 + 
    (255 - arr[:, :, 2])**2
)

# Threshold for content vs background
content_mask = dist_from_white > 15
coords = np.argwhere(content_mask)
y_min, x_min = coords.min(axis=0)
y_max, x_max = coords.max(axis=0)

print(f"Bounding box: x=[{x_min}, {x_max}], y=[{y_min}, {y_max}], w={x_max - x_min}, h={y_max - y_min}")
