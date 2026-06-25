import json
import math
import requests
import time
import os

# --- Constants ---
# Perimeter Vertices (Extracted from analyze_perimeter_sides.py output)
V1 = [-75.25695083552709, -15.165498334382889] # NE
V2 = [-75.26825393885237, -15.172534472456562] # NW
V3 = [-75.23798892224755, -15.197477563030073] # S

# Output File (Isolated)
OUTPUT_FILE = r'C:\Users\rguti\Petral.MARK\Dashboard_Puertos\terrain_mesh_3d.js'

# Config
GRID_SPACING_METERS = 50 # High Resolution

# --- Helpers ---
def get_elevation_batch(locations):
    """
    Fetch elevations from Open-Meteo for a list of (lat, lon).
    API limits: Check documentation. Often chunks of locations are better.
    """
    base_url = "https://api.open-meteo.com/v1/elevation"
    elevations = []
    
    # Process in chunks to respect URL length / API limits
    CHUNK_SIZE = 100 
    
    print(f"Fetching elevation for {len(locations)} points...")
    
    for i in range(0, len(locations), CHUNK_SIZE):
        chunk = locations[i:i+CHUNK_SIZE]
        lats = [f"{p[1]:.6f}" for p in chunk]
        lons = [f"{p[0]:.6f}" for p in chunk]
        
        url = f"{base_url}?latitude={','.join(lats)}&longitude={','.join(lons)}"
        
        while True:
            try:
                resp = requests.get(url)
                data = resp.json()
                
                if 'elevation' in data:
                    elevations.extend(data['elevation'])
                    print(f"  Chunk {i}: OK")
                    break # Success
                elif 'error' in data and 'limit' in str(data.get('reason', '')).lower():
                    print("  Rate limit hit. Waiting 60s...")
                    time.sleep(60)
                    continue # Retry
                else:
                    print(f"  Error in chunk {i}: {data}")
                    elevations.extend([0]*len(chunk))
                    break # Skip batch on other errors
                
            except Exception as e:
                print(f"Request failed: {e}")
                time.sleep(10) # Wait longer for network issues
                continue # Retry indefinitely!
            
        time.sleep(0.2) # Faster polite delay
            
    return elevations

def point_in_triangle(pt, v1, v2, v3):
    """
    Barycentric coordinate technique to check if pt is in triangle v1,v2,v3
    pt, v1, v2, v3 are [lon, lat]
    """
    def sign(p1, p2, p3):
        return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])

    d1 = sign(pt, v1, v2)
    d2 = sign(pt, v2, v3)
    d3 = sign(pt, v3, v1)

    has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)

    return not (has_neg and has_pos)

def add_meters_to_coords(lat, lon, dy_meters, dx_meters):
    """
    Approximate offset.
    1 deg lat ~= 111132.92 m
    1 deg lon ~= 111412.84 * cos(lat) m
    """
    r_earth = 6378137
    pi = math.pi
    
    new_lat = lat + (dy_meters / r_earth) * (180 / pi)
    new_lon = lon + (dx_meters / r_earth) * (180 / pi) / math.cos(lat * pi/180)
    
    return [new_lon, new_lat]

def main():
    print("=" * 60)
    print("GENERACIÓN DE MALLA 3D DE TERRENO - EXTENDIDO & CORTE (30m)")
    print("=" * 60)
    
    # 1. Define Bounding Box & Extensions
    # 1 degree lat ~= 111.132 km -> 1km ~= 0.009 deg
    DT_LAT_1KM = 1.0 / 111.132 
    
    lons_tri = [V1[0], V2[0], V3[0]]
    lats_tri = [V1[1], V2[1], V3[1]]
    
    # Original bounds
    orig_min_lon, orig_max_lon = min(lons_tri), max(lons_tri)
    orig_min_lat, orig_max_lat = min(lats_tri), max(lats_tri)
    
    # Avg Lat for Lon conversion
    avg_lat = (orig_min_lat + orig_max_lat) / 2
    meters_per_deg_lon = 111320 * math.cos(math.radians(avg_lat))
    DT_LON_1KM = 1.0 / (meters_per_deg_lon / 1000) # 1km in degrees lon
    
    # Extended bounds: +1km North (Max Lat), +1km East (Max Lon)
    # We also pad slightly West and South to ensure full coverage of the base
    PADDING = 0.002 
    
    min_lat = orig_min_lat - PADDING
    max_lat = orig_max_lat + DT_LAT_1KM
    min_lon = orig_min_lon - PADDING
    max_lon = orig_max_lon + DT_LON_1KM
    
    print(f"Original Lat Range: {orig_min_lat:.4f} to {orig_max_lat:.4f}")
    print(f"Extended Lat Range: {min_lat:.4f} to {max_lat:.4f} (+1km North)")
    print(f"Original Lon Range: {orig_min_lon:.4f} to {orig_max_lon:.4f}")
    print(f"Extended Lon Range: {min_lon:.4f} to {max_lon:.4f} (+1km East)")
    
    # 2. Generate Grid Points
    lat_step = (GRID_SPACING_METERS / 111132) 
    lon_step = (GRID_SPACING_METERS / meters_per_deg_lon)
    
    print(f"\nGrid Resolution: {GRID_SPACING_METERS}m")
    print(f"Steps (deg): Lat {lat_step:.6f}, Lon {lon_step:.6f}")
    
    grid_points = []
    
    # Rectangular Grid
    curr_lat = max_lat
    while curr_lat >= min_lat:
        curr_lon = min_lon
        while curr_lon <= max_lon:
            grid_points.append([curr_lon, curr_lat])
            curr_lon += lon_step
        curr_lat -= lat_step
        
    total_points = len(grid_points)
    print(f"\n✓ Generated {total_points} grid points (Rectangular Mesh)")
    
    if not grid_points:
        print("ERROR: No points found.")
        return

    # --- 1.5 CACHING SETUP ---
    CACHE_FILE = 'terrain_elevation_cache.json'
    elevation_cache = {}
    
    # Load Cache
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                elevation_cache = json.load(f)
            print(f"\n✓ Loaded {len(elevation_cache)} cached points.")
        except Exception as e:
            print(f"\n⚠ Error loading cache: {e}")
            
    def save_cache():
        try:
            with open(CACHE_FILE, 'w') as f:
                json.dump(elevation_cache, f)
            print(f"  (Cache saved: {len(elevation_cache)} records)")
        except Exception as e:
            print(f"  ⚠ Failed to save cache: {e}")

    # Helper to generate cache key
    def get_key(lat, lon):
        return f"{lat:.6f}_{lon:.6f}"

    # 3. Batch Processing with Cache
    BATCH_SIZE_API = 100
    all_elevations = []
    
    print(f"\nfetching elevations in batches of {BATCH_SIZE_API}...")
    
    points_to_fetch = []
    points_indices = []
    
    # Pre-fill from cache
    for i, pt in enumerate(grid_points):
        k = get_key(pt[1], pt[0])
        if k in elevation_cache and elevation_cache[k] != 0:
            all_elevations.append(elevation_cache[k])
        else:
            all_elevations.append(None) # Marker to fetch
            points_to_fetch.append(pt)
            points_indices.append(i)
            
    print(f"Points cached: {len(grid_points) - len(points_to_fetch)}")
    print(f"Points to fetch: {len(points_to_fetch)}")
    
    # Fetch Loop
    if points_to_fetch:
        for i in range(0, len(points_to_fetch), BATCH_SIZE_API):
            batch = points_to_fetch[i:i+BATCH_SIZE_API]
            batch_idxs = points_indices[i:i+BATCH_SIZE_API]
            
            # Rate limit protection
            if i > 0 and i % 500 == 0:
                print("  Sleeping 2s...")
                time.sleep(2)
            
            elevs = get_elevation_batch(batch)
            
            # Update data and cache
            for j, val in enumerate(elevs):
                global_idx = batch_idxs[j]
                all_elevations[global_idx] = val
                
                # Cache it (even if 0, to avoid re-fetching immediately, but we have repair logic later)
                pt = batch[j]
                k = get_key(pt[1], pt[0])
                elevation_cache[k] = val
                
            print(f"  Processed {min(i+BATCH_SIZE_API, len(points_to_fetch))} / {len(points_to_fetch)} new points.")
            
            # Save cache every 5 batches (500 pts)
            if i > 0 and i % (BATCH_SIZE_API * 5) == 0:
                save_cache()
                save_terrain_js(grid_points, all_elevations, 
                                valid_points_subset={"x":[], "y":[], "z":[]}, # Empty distinct sets for partial
                                zero_points_subset={"x":[], "y":[], "z":[]},
                                wall_data=None, # No walls yet
                                stats={"status": f"Processing... {i}/{len(points_to_fetch)}"})
                
        save_cache() # Final save after loop

    # Use 0 for any None remaining (failed)
    all_elevations = [e if e is not None else 0 for e in all_elevations]

    # --- 3.5 REPAIR ZEROS (Critical step for API saturation) ---
    def repair_zeros_cached(points_list, elevations_list, label="Grid"):
        zero_indices = [i for i, z in enumerate(elevations_list) if z == 0]
        max_retries = 5
        
        if not zero_indices:
            return elevations_list
            
        print(f"\n{'!'*60}")
        print(f"REPAIRING {len(zero_indices)} ZERO VALUES IN {label.upper()}")
        print(f"{'!'*60}")
        
        wait_time = 5
        
        for attempt in range(max_retries):
            if not zero_indices:
                print("  ✓ All zeros repaired!")
                break
                
            print(f"  Attempt {attempt+1}/{max_retries}: Retrying {len(zero_indices)} points...")
            
            REPAIR_BATCH = 50
            still_zero = []
            
            for i in range(0, len(zero_indices), REPAIR_BATCH):
                batch_indices = zero_indices[i:i+REPAIR_BATCH]
                batch_points = [points_list[k] for k in batch_indices]
                
                time.sleep(wait_time) 
                
                new_vals = get_elevation_batch(batch_points)
                
                for k, idx in enumerate(batch_indices):
                    val = new_vals[k]
                    if val != 0:
                        elevations_list[idx] = val
                        # Update cache
                        pt = points_list[idx]
                        key = get_key(pt[1], pt[0])
                        elevation_cache[key] = val
                    else:
                        still_zero.append(idx)
                        
                print(f"    Repaired batch {i}: {len(batch_indices) - len([x for x in new_vals if x==0])}/{len(batch_indices)} success")
                # Save sporadically
                if i % 200 == 0: save_cache()
            
            zero_indices = still_zero
            if zero_indices:
                wait_time *= 2
                print(f"  ⚠ {len(zero_indices)} points still zero. Waiting {wait_time}s...")
                time.sleep(wait_time)
        
        save_cache()
        return elevations_list

    # Repair Main Grid
    all_elevations = repair_zeros_cached(grid_points, all_elevations, "Main Mesh")

    # 4. Earthworks Calculation (Cut Logic)
    CUT_LEVEL_Z = 30.0
    cell_area = GRID_SPACING_METERS * GRID_SPACING_METERS # 2500 m2
    
    total_cut_volume = 0.0
    final_z_values = []
    
    points_inside = 0
    points_cut = 0
    
    valid_points_subset = {"x": [], "y": [], "z": []}
    zero_points_subset = {"x": [], "y": [], "z": []}
    
    for i, pt in enumerate(grid_points):
        original_z = all_elevations[i]
        
        if original_z == 0:
            zero_points_subset["x"].append(pt[0])
            zero_points_subset["y"].append(pt[1])
            zero_points_subset["z"].append(original_z)
        else:
            valid_points_subset["x"].append(pt[0])
            valid_points_subset["y"].append(pt[1])
            valid_points_subset["z"].append(original_z)
        
        # Default to original
        final_z = original_z
        
        # Check if inside Petral Triangle
        if point_in_triangle(pt, V1, V2, V3):
            points_inside += 1
            
            # If elevation > 30m, we CUT it down to 30m (only if valid)
            if original_z > CUT_LEVEL_Z:
                cut_height = original_z - CUT_LEVEL_Z
                cut_vol = cut_height * cell_area
                
                total_cut_volume += cut_vol
                final_z = CUT_LEVEL_Z # Flattened
                points_cut += 1
        
        final_z_values.append(final_z)
        
    # 5. Summary
    print(f"\n{'='*60}")
    print(f"EARTHWORKS SUMMARY (Base Level: {CUT_LEVEL_Z}m)")
    print(f"{'='*60}")
    print(f"Total Grid Points: {total_points}")
    print(f"Points Inside Perimeter: {points_inside}")
    print(f"Points Cut: {points_cut}")
    print(f"Total Cut Volume: {total_cut_volume:,.2f} m³")
    print(f"Total Cut Volume: {total_cut_volume/1000000:,.2f} Million m³")
    print(f"{'='*60}\n")
    
    # --- 5. Generate Vertical Walls along Perimeter ---
    # NOTE: Walls fetch logic should ALSO USE CACHE, but let's keep it simple for now
    # or wrap its fetch in similar cache logic?
    # It's small (few hundred points), let's rely on standard fetch or add light caching
    # Actually, let's just run it standard, it's safer.
    
    print(f"\n{'='*60}")
    print(f"GENERATING VERTICAL WALLS (Perimeter Step: {GRID_SPACING_METERS}m)")
    print(f"{'='*60}")
    
    def interpolate_points(p1, p2, step_meters=50):
        # Haversine distance approx or just euclidean on coords for short dists?
        # Let's use simple linear interp based on estimated meters
        d_lat = p2[1] - p1[1]
        d_lon = p2[0] - p1[0]
        
        # Approx deg distance
        avg_lat_r = math.radians((p1[1] + p2[1])/2)
        m_per_deg_lat = 111132
        m_per_deg_lon = 111320 * math.cos(avg_lat_r)
        
        dist_m = math.sqrt((d_lat * m_per_deg_lat)**2 + (d_lon * m_per_deg_lon)**2)
        num_steps = int(dist_m / step_meters)
        
        points = []
        for k in range(num_steps + 1):
            f = k / num_steps if num_steps > 0 else 0
            lat = p1[1] + d_lat * f
            lon = p1[0] + d_lon * f
            points.append([lon, lat])
        return points

    # define sides
    side_A = interpolate_points(V1, V2, GRID_SPACING_METERS) # NE -> NW
    side_B = interpolate_points(V1, V3, GRID_SPACING_METERS) # NE -> S
    side_C = interpolate_points(V2, V3, GRID_SPACING_METERS) # NW -> S
    
    wall_points_geo = side_A + side_B + side_C
    print(f"Total Wall Sample Points: {len(wall_points_geo)}")
    
    print("Fetching wall elevations...")
    wall_elevations = []
    
    # Check cache for walls too
    wall_to_fetch = []
    wall_indices = []
    
    for i, pt in enumerate(wall_points_geo):
        k = get_key(pt[1], pt[0])
        if k in elevation_cache and elevation_cache[k] != 0:
            wall_elevations.append(elevation_cache[k])
        else:
            wall_elevations.append(0) # Placeholder
            wall_to_fetch.append(pt)
            wall_indices.append(i)
    
    if wall_to_fetch:
        print(f"Fetching {len(wall_to_fetch)} wall points from API...")
        for i in range(0, len(wall_to_fetch), BATCH_SIZE_API):
            batch = wall_to_fetch[i:i+BATCH_SIZE_API]
            batch_idxs = wall_indices[i:i+BATCH_SIZE_API]
            time.sleep(0.5) 
            elevs = get_elevation_batch(batch)
            for j, val in enumerate(elevs):
                global_idx = batch_idxs[j]
                wall_elevations[global_idx] = val
                elevation_cache[get_key(batch[j][1], batch[j][0])] = val
            print(f"  Wall Batch {i}: OK")
        save_cache()

    # Repair Walls (Cached version re-use possible, but let's stick to list)
    # Re-using the robust repair function if needed? 
    # Let's trust the fetch for walls for now or add simple repair
        
    # Build Mesh for Walls (Quads split into 2 triangles)
    # For each point on perimeter, we have Top (Z=Original) and Bottom (Z=30)
    # But Plotly Mesh3D needs x,y,z arrays and i,j,k indices OR just a cloud of vertices?
    # Better: explicit triangles.
    
    wx, wy, wz = [], [], []
    
    # Helper to add quad
    def add_wall_segment(p1, z1, p2, z2, base_z):
        # Vertices: 
        # A: p1, base  |  B: p1, z1
        # C: p2, base  |  D: p2, z2
        
        # Tri 1: A-B-D
        wx.extend([p1[0], p1[0], p2[0]])
        wy.extend([p1[1], p1[1], p2[1]])
        wz.extend([base_z, z1, z2])
        
        # Tri 2: A-D-C
        wx.extend([p1[0], p2[0], p2[0]])
        wy.extend([p1[1], p2[1], p2[1]])
        wz.extend([base_z, z2, base_z])

    # Process each strip consecutively
    # Side A
    curr_idx = 0
    for side in [side_A, side_B, side_C]:
        for k in range(len(side)-1):
            p1 = side[k]
            z1 = max(wall_elevations[curr_idx], CUT_LEVEL_Z)
            p2 = side[k+1]
            z2 = max(wall_elevations[curr_idx+1], CUT_LEVEL_Z)
            
            # Create wall if either point is high
            add_wall_segment(p1, z1, p2, z2, CUT_LEVEL_Z)
            curr_idx += 1
        curr_idx += 1
    
    print(f"Generated Wall Mesh: {len(wx)} vertices")

    # 6. Format for Plotly
    x_coords = [p[0] for p in grid_points]
    y_coords = [p[1] for p in grid_points]
    
    # Redefine save_terrain_js to be usable at end too
    final_stats = {
        "cut_level": CUT_LEVEL_Z,
        "cut_volume_m3": total_cut_volume,
        "cut_volume_mm3": total_cut_volume / 1_000_000,
        "points_cut": points_cut
    }
    
    # Re-build subsets for final
    final_valid = {"x": [], "y": [], "z": []}
    final_zero = {"x": [], "y": [], "z": []}
    for k, z in enumerate(all_elevations): # actually we want original_z for valid/zero classification
        if z == 0:
            final_zero["x"].append(x_coords[k])
            final_zero["y"].append(y_coords[k])
            final_zero["z"].append(z)
        else:
            final_valid["x"].append(x_coords[k])
            final_valid["y"].append(y_coords[k])
            final_valid["z"].append(z)

    save_terrain_js(grid_points, final_z_values, 
                    valid_points_subset=final_valid,
                    zero_points_subset=final_zero,
                    wall_data={"x": wx, "y": wy, "z": wz}, 
                    stats=final_stats)

# --- SAVE JS FUNCTION ---
def save_terrain_js(g_points, z_values, valid_points_subset=None, zero_points_subset=None, wall_data=None, stats=None):
    # Sanitize Z (handle Nones if partial)
    safe_z = [z if z is not None else 0 for z in z_values]
    
    x_c = [p[0] for p in g_points]
    y_c = [p[1] for p in g_points]
    
    # Defaults
    if valid_points_subset is None: valid_points_subset = {"x":[], "y":[], "z":[]}
    if zero_points_subset is None: zero_points_subset = {"x":[], "y":[], "z":[]}
    if wall_data is None: wall_data = {"x":[], "y":[], "z":[]}
    if stats is None: stats = {}
    
    js_content = f"""
// Auto-generated by generate_terrain_mesh.py
// Cached & Robust Generation - Updated: {time.strftime('%H:%M:%S')}
const TERRAIN_MESH_DATA = {{
    x: {json.dumps(x_c)},
    y: {json.dumps(y_c)},
    z: {json.dumps(safe_z)},
    
    valid_pts: {json.dumps(valid_points_subset)},
    zero_pts: {json.dumps(zero_points_subset)},
    
    wall_x: {json.dumps(wall_data['x'])},
    wall_y: {json.dumps(wall_data['y'])},
    wall_z: {json.dumps(wall_data['z'])},
    stats: {json.dumps(stats)},
    
    type: 'mesh3d',
    intensity: {json.dumps(safe_z)},
    colorscale: 'Earth'
}};
"""
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"  -> Updated JS output file.")
    except Exception as e:
        print(f"  ⚠ Failed to update JS: {e}")

if __name__ == "__main__":
    if not os.path.exists('terrain_elevation_cache.json'):
        print("Creating new cache file...")
    main()
