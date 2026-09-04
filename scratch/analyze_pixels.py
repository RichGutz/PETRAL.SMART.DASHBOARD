from PIL import Image
import numpy as np

img = Image.open(r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\LOGO.DELFOS.NUEVO.BLANCO.3.jpg")
arr = np.array(img)

# Analyze background: what is the white threshold?
# Let's see pixels near white
white_mask = (arr[:, :, 0] > 240) & (arr[:, :, 1] > 240) & (arr[:, :, 2] > 240)
print("White pixel percentage:", np.mean(white_mask) * 100)

# What are non-white pixel colors?
non_white = arr[~white_mask]
print("Non-white min:", non_white.min(axis=0), "max:", non_white.max(axis=0), "mean:", non_white.mean(axis=0))
