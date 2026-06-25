
import re

file_path = r"c:\Users\rguti\Petral.MARK\Dashboard_Puertos\script.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Logic to insert for Green Route (Dense --> Filter)
green_logic = """        let lastPlottedKm = -0.6;

        for (let i = 0; i < NEW_GREEN_ROUTE_POINTS.length; i++) {
            const point = NEW_GREEN_ROUTE_POINTS[i];
            
            // Helper to add marker
            const addMarker = (coords, km, alt) => {
                const marker = L.circleMarker(coords, {
                    radius: 5,
                    color: '#00ff00',
                    fillColor: '#fff',
                    fillOpacity: 1,
                    weight: 2
                });
                marker.bindTooltip(`KM ${km.toFixed(1)}<br>Alt: ${Math.round(alt)}m`, {
                    permanent: true,
                    direction: 'top',
                    className: 'elev-label-container',
                    offset: [0, -10]
                });
                greenRoutePointsLayer.addLayer(marker);
            };

            const dist = point.km - lastPlottedKm;

            if (dist >= 0.45) {
                // Check if we need to interpolate (Gap > 0.9)
                if (dist >= 0.9) { 
                    if (i > 0) {
                        const prev = NEW_GREEN_ROUTE_POINTS[i-1];
                        const midCoords = [
                            (prev.coords[0] + point.coords[0]) / 2,
                            (prev.coords[1] + point.coords[1]) / 2
                        ];
                        const midAlt = (prev.alt + point.alt) / 2;
                        const midKm = (prev.km + point.km) / 2; 
                        
                        if (midKm - lastPlottedKm >= 0.45) {
                             addMarker(midCoords, midKm, midAlt);
                             lastPlottedKm = midKm; 
                        }
                    }
                }
                
                if (point.km - lastPlottedKm >= 0.45) {
                    addMarker(point.coords, point.km, point.alt);
                    lastPlottedKm = point.km;
                }
            }
        }"""

# Logic to insert for Coastal Route (Sparse --> Interpolate)
coastal_logic = """        let lastPlottedKm = -0.6;

        for (let i = 0; i < COASTAL_ROUTE_POINTS.length; i++) {
            const point = COASTAL_ROUTE_POINTS[i];
            
            // Helper to add marker
            const addMarker = (coords, km, alt) => {
                const marker = L.circleMarker(coords, {
                    radius: 5,
                    color: '#00bfff',
                    fillColor: '#fff',
                    fillOpacity: 1,
                    weight: 2
                });
                marker.bindTooltip(`KM ${km.toFixed(1)}<br>Alt: ${Math.round(alt)}m`, {
                    permanent: true,
                    direction: 'top',
                    className: 'elev-label-container',
                    offset: [0, -10]
                });
                coastalRoutePointsLayer.addLayer(marker);
            };

            const dist = point.km - lastPlottedKm;
            
            if (dist >= 0.45) {
                if (dist >= 0.9) {
                     if (i > 0) {
                        const prev = COASTAL_ROUTE_POINTS[i-1];
                        const midCoords = [
                            (prev.coords[0] + point.coords[0]) / 2,
                            (prev.coords[1] + point.coords[1]) / 2
                        ];
                        const midAlt = (prev.alt + point.alt) / 2;
                        const midKm = (prev.km + point.km) / 2; 
                        
                        if (midKm - lastPlottedKm >= 0.45) {
                             addMarker(midCoords, midKm, midAlt);
                             lastPlottedKm = midKm; 
                        }
                    }
                }
                
                if (point.km - lastPlottedKm >= 0.45) {
                    addMarker(point.coords, point.km, point.alt);
                    lastPlottedKm = point.km;
                }
            }
        }"""

# Regex pattern to match the Green Route Loop
# Looking for "for (let i = 0; i < NEW_GREEN_ROUTE_POINTS.length; i++)" ... "}"
# We use a greedy match on the loop structure, hoping to catch the block correctly.
# The previous loop has "greenRoutePointsLayer.addLayer(marker);" near the end.
green_pattern = r"for\s*\(let\s*i\s*=\s*0;\s*i\s*<\s*NEW_GREEN_ROUTE_POINTS\.length;\s*i\+\+\)\s*\{[\s\S]*?\}\s*\}\s*\}"
# This regex is risky. Let's strictly replace the text we KNOW is there from the last read.

# Exact string from previous file view (truncated for safety but unique enough)
target_green_start = "for (let i = 0; i < NEW_GREEN_ROUTE_POINTS.length; i++) {"
target_green_end_snippet = "const midKm = point.km + 0.5;\n                    addMarker(midCoords, midKm, midAlt);\n                }\n            }\n        }"

# We will just replace the whole block by finding start and end index.
start_idx = content.find(target_green_start)
if start_idx == -1:
    print("Error: Could not find Green Route loop start.")
else:
    # Find the closing brace of the loop.
    # We knwo the indent level is 8 spaces.
    # We can search for the next "}" that closes the loop.
    # Or just replace distinct chunks.
    
    # Let's try locating the specific unique code I added last time:
    unique_mid = "const midKm = point.km + 0.5;"
    mid_idx = content.find(unique_mid, start_idx)
    
    if mid_idx != -1:
        # Find the end of the block...
        # It ends with 3 closing braces? "                }\n            }\n        }"
        end_snippet = "            }\n        }"
        end_idx = content.find(end_snippet, mid_idx) + len(end_snippet)
        
        # Replace
        print("Replacing Green Route Logic...")
        content = content[:start_idx] + green_logic + content[end_idx:]
    else:
        print("Error: Could not find inside of Green Route loop.")

# Same for Coastal
target_coastal_start = "for (let i = 0; i < COASTAL_ROUTE_POINTS.length; i++) {"
start_idx_c = content.find(target_coastal_start)
if start_idx_c == -1:
    print("Error: Could not find Coastal Route loop start.")
else:
    unique_mid_c = "const midKm = point.km + 0.5;"
    mid_idx_c = content.find(unique_mid_c, start_idx_c)
    
    if mid_idx_c != -1:
        end_snippet_c = "            }\n        }"
        end_idx_c = content.find(end_snippet_c, mid_idx_c) + len(end_snippet_c)
        
        print("Replacing Coastal Route Logic...")
        content = content[:start_idx_c] + coastal_logic + content[end_idx_c:]
    else:
         print("Error: Could not find inside of Coastal Route loop.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done.")
