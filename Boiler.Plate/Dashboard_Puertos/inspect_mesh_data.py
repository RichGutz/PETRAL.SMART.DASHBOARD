import json
import re
import numpy as np

def load_mesh_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the JS object. Usually it's something like "var terrain_data = { ... }"
    # We'll look for the JSON-like structure inside
    # Assuming the format is fairly simple X, Y, Z lists
    
    try:
        # Simple regex to find arrays
        x_match = re.search(r'x:\s*\[(.*?)\]', content, re.DOTALL)
        y_match = re.search(r'y:\s*\[(.*?)\]', content, re.DOTALL)
        z_match = re.search(r'z:\s*\[(.*?)\]', content, re.DOTALL)
        
        if not (x_match and y_match and z_match):
            print(f"Could not parse arrays in {filepath}")
            return None

        x = [float(v) for v in x_match.group(1).split(',')]
        y = [float(v) for v in y_match.group(1).split(',')]
        z = [float(v) for v in z_match.group(1).split(',')]
        
        return np.array(x), np.array(y), np.array(z)
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return None

cut_path = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\terrain_mesh_cut.js"
nat_path = r"C:\Users\rguti\Petral.MARK\Dashboard_Puertos\terrain_mesh_natural.js"

print("--- INSPECTING MESH DATA ---")
cut_data = load_mesh_data(cut_path)
nat_data = load_mesh_data(nat_path)

if cut_data and nat_data:
    xc, yc, zc = cut_data
    xn, yn, zn = nat_data
    
    print(f"CUT Mesh: {len(xc)} points")
    print(f"NATURAL Mesh: {len(xn)} points")
    
    # Check if first few points match
    print(f"Cut sample [0]: {xc[0]}, {yc[0]}")
    print(f"Nat sample [0]: {xn[0]}, {yn[0]}")
    
    if len(xc) == len(xn):
        match_count = np.sum((xc == xn) & (yc == yn))
        print(f"Matching X/Y points: {match_count} / {len(xc)}")
    else:
        print("Lengths differ, exact index mapping impossible. Interpolation required.")

