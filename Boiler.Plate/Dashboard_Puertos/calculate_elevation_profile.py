
import math
import requests
import json
import time

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def interpolate_points(p1, p2, interval_meters, start_dist_meters):
    dist_total = haversine_distance(p1[0], p1[1], p2[0], p2[1])
    points = []
    
    current_dist = interval_meters - start_dist_meters
    if current_dist < 0:
        current_dist = interval_meters # Should not happen if logic flows right
    
    # Vector
    # Approximation for short distances (linear interpolation)
    # For stricter geodesy we'd use bearing, but lerp is fine for 1km on this scale
    
    while current_dist <= dist_total:
        fraction = current_dist / dist_total
        lat = p1[0] + (p2[0] - p1[0]) * fraction
        lon = p1[1] + (p2[1] - p1[1]) * fraction
        points.append({
            'lat': lat,
            'lon': lon,
            'dist_from_start': start_dist_meters + current_dist
        })
        current_dist += interval_meters
        
    remaining_dist = (start_dist_meters + dist_total) % interval_meters
    # Actually remainder for next segment:
    # Accumulated distance at end of segment = start_dist_meters + dist_total
    # Distance to next 1km mark = interval - (Accumulated % interval)
    # If Accumulated % interval == 0, then 0 (or interval)
    
    total_segment_dist = start_dist_meters + dist_total
    next_start_dist_offset = 0
    if total_segment_dist % interval_meters != 0:
        next_start_dist_offset = total_segment_dist % interval_meters
    else:
        next_start_dist_offset = 0
        
    return points, next_start_dist_offset, total_segment_dist

def get_elevation_batch(locations):
    # API: https://api.open-elevation.com/api/v1/lookup?locations=lat,lon|lat,lon
    # Using open-meteo as fallback or primary if better? Open-meteo is very reliable.
    # Open-Meteo Elevation API: https://api.open-meteo.com/v1/elevation?latitude=52.52,48.85&longitude=13.41,2.35
    
    base_url = "https://api.open-meteo.com/v1/elevation"
    lats = [f"{p['lat']:.6f}" for p in locations]
    lons = [f"{p['lon']:.6f}" for p in locations]
    
    url = f"{base_url}?latitude={','.join(lats)}&longitude={','.join(lons)}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return data.get('elevation', [])
    except Exception as e:
        print(f"Error fetching elevation: {e}")
        return [None] * len(locations)

def main():
    # Define Route Points from script.js
    # P1: Vertex 8 (NW)
    p1 = (-15.165533, -75.256948) 
    # P2: Vertex 9 (N)
    p2 = (-15.075283, -75.095742)
    # P3: Connection PE-1S
    p3 = (-15.075283, -75.008714)
    
    interval = 1000 # 1km
    
    all_points = []
    
    # Start Point (0 km)
    all_points.append({'lat': p1[0], 'lon': p1[1], 'dist_from_start': 0})
    
    # Segment 1: P1 -> P2
    points_s1, offset_s1, dist_accum_s1 = interpolate_points(p1, p2, interval, 0)
    all_points.extend(points_s1)
    
    # Segment 2: P2 -> P3
    # Use accurate total distance from previous segment to continue the 1km cadence
    # distance covered so far is roughly dist_accum_s1
    # We want the next point to be at ceil(dist_accum_s1 / 1000) * 1000
    
    # Let's simplify: Just generate points along the polyline at distance X from start.
    polyline = [p1, p2, p3]
    
    # Re-calculate cleanly
    route_points = []
    total_dist = 0
    route_points.append({'lat': p1[0], 'lon': p1[1], 'km': 0})
    
    current_target_km = 1.0
    
    # Helper to walk
    def walk_segment(start, end, start_km_dist):
        seg_len = haversine_distance(start[0], start[1], end[0], end[1]) / 1000.0 # in km
        points = []
        nonlocal current_target_km
        
        # We serve all 1km markers that fall within this segment
        while current_target_km <= start_km_dist + seg_len:
            # Fraction along segment
            dist_into_seg = current_target_km - start_km_dist
            fraction = dist_into_seg / seg_len
            
            lat = start[0] + (end[0] - start[0]) * fraction
            lon = start[1] + (end[1] - start[1]) * fraction
            
            points.append({'lat': lat, 'lon': lon, 'km': current_target_km})
            current_target_km += 1.0
            
        return points, start_km_dist + seg_len

    # P1 -> P2
    s1_points, s1_end_km = walk_segment(p1, p2, 0)
    route_points.extend(s1_points)
    
    # P2 -> P3
    s2_points, s2_end_km = walk_segment(p2, p3, s1_end_km)
    route_points.extend(s2_points)
    
    # Fetch Elevations
    elevations = get_elevation_batch(route_points)
    
    # Print CSV format
    print("KM,LATUD,LONGITUD,ALTURA (msnm)")
    for i, p in enumerate(route_points):
        lat = p['lat']
        lon = p['lon']
        km = p['km']
        ele = elevations[i] if i < len(elevations) else "N/A"
        if ele is None: ele = 0
        print(f"{km:.1f},{lat:.6f},{lon:.6f},{ele}")

if __name__ == "__main__":
    main()
