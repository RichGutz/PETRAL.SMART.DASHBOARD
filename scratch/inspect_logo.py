from PIL import Image
import numpy as np

img_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\LOGO.DELFOS.NUEVO.BLANCO.3.jpg"
img = Image.open(img_path)
print(f"Size: {img.size}, Mode: {img.mode}")

arr = np.array(img)
print(f"Top-left: {arr[0, 0]}")
print(f"Top-right: {arr[0, -1]}")
print(f"Bottom-left: {arr[-1, 0]}")
print(f"Bottom-right: {arr[-1, -1]}")
print(f"Min RGB: {arr.min(axis=(0,1))}, Max RGB: {arr.max(axis=(0,1))}")
