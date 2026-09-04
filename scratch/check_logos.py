from PIL import Image
import numpy as np

# Check the images
for name in [
    r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\LOGO.DELFOS.NUEVO.BLANCO.3.jpg",
    r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\public\LOGO.DELFOS.BUENO.VERTICAL.png",
    r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\public\LOGO.DELFOS.BUENO.HORIZONTAL.png"
]:
    try:
        im = Image.open(name)
        print(f"File: {name} | Size: {im.size} | Mode: {im.mode}")
    except Exception as e:
        print(f"Error {name}: {e}")
