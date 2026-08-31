"""
Script de Procesamiento y Generacion de Logos Transparentes con Canal Alfa Real
Metodologia: OpenCV + Normalizacion y Des-multiplicacion de Color (Unmult from White) + Anti-Aliasing Suave.
Basado en las especificaciones de NOTA_TRANSPARENCIA_LOGO.md
"""
import os
import cv2
import numpy as np

def convert_to_transparent_png(input_jpg_path, output_png_path):
    if not os.path.exists(input_jpg_path):
        print(f"Error: No existe el archivo {input_jpg_path}")
        return False
        
    img = cv2.imread(input_jpg_path)
    if img is None:
        print(f"Error: No se pudo leer {input_jpg_path}")
        return False

    h, w = img.shape[:2]
    
    # 1. Distancia respecto al blanco puro [255, 255, 255]
    # En fondo blanco, cualquier desviación indica presencia de color/trazo
    dist_from_white = np.max(255 - img, axis=2).astype(np.float32)
    
    # 2. Rampa de opacidad con umbral para absorber artefactos de compresion JPEG
    # Ruido tipico JPEG en blanco <= 4
    # Transicion suave en el borde entre 4 y 32
    alpha = np.clip((dist_from_white - 4.0) / 28.0, 0.0, 1.0)
    
    # 3. Des-multiplicacion de color (Color Unmult):
    # Remueve el halo blanquecino en los pixeles de transicion perimetral
    # C = alpha * F + (1 - alpha) * 255  =>  F = (C - 255*(1-alpha)) / alpha
    b, g, r = cv2.split(img.astype(np.float32))
    alpha_safe = np.maximum(alpha, 0.001)
    
    b_unmult = np.clip((b - 255.0 * (1.0 - alpha)) / alpha_safe, 0, 255)
    g_unmult = np.clip((g - 255.0 * (1.0 - alpha)) / alpha_safe, 0, 255)
    r_unmult = np.clip((r - 255.0 * (1.0 - alpha)) / alpha_safe, 0, 255)
    
    b_final = np.where(alpha > 0, b_unmult, b).astype(np.uint8)
    g_final = np.where(alpha > 0, g_unmult, g).astype(np.uint8)
    r_final = np.where(alpha > 0, r_unmult, r).astype(np.uint8)
    alpha_final = (alpha * 255.0).astype(np.uint8)
    
    bgra = cv2.merge([b_final, g_final, r_final, alpha_final])
    cv2.imwrite(output_png_path, bgra)
    
    transp_pct = (np.sum(alpha_final == 0) / alpha_final.size) * 100.0
    print(f"[OK] {os.path.basename(output_png_path)} generado ({w}x{h} px, {transp_pct:.1f}% transparencia)")
    return True

if __name__ == "__main__":
    base_dir = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD"
    targets = [
        ("LOGO.DELFOS.BUENO.HORIZONTAL.jpg", "LOGO.DELFOS.BUENO.HORIZONTAL.png"),
        ("LOGO.DELFOS.BUENO.VERTICAL.jpg", "LOGO.DELFOS.BUENO.VERTICAL.png")
    ]
    for inp, out in targets:
        convert_to_transparent_png(os.path.join(base_dir, inp), os.path.join(base_dir, out))
