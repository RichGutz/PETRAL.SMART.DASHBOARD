import json
import os

INPUT_FILE = "infrastructure_roads.js"
OUTPUT_RED = "layer_red_route.js"

def extract_red_route():
    # Read the JS file. It starts with "const INFRA_ROADS = " and ends with ";" usually.
    # We need to parse the JSON content inside.
    
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find the start of the JSON object
    start_index = content.find('{')
    # Find the last '}'
    end_index = content.rfind('}')
    
    if start_index == -1 or end_index == -1:
        print("Error: Could not find JSON object in file")
        return

    json_str = content[start_index:end_index+1]
    
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return

    # Find PE-30
    features = data.get('features', [])
    red_feature = None
    new_features = []
    
    for f in features:
        props = f.get('properties', {})
        if props.get('id') == 'PE-30':
            red_feature = f
            # Update color to Red standard #f44336
            red_feature['properties']['color'] = '#f44336'
            red_feature['properties']['name'] = "Ruta Roja (PE1S - Marcona)"
        else:
            new_features.append(f)
            
    if red_feature:
        # Write Red Route File
        js_content = f"const LAYER_RED_ROUTE = {json.dumps(red_feature, indent=2)};"
        with open(OUTPUT_RED, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"Success: {OUTPUT_RED} created")
        
        # Update original data
        data['features'] = new_features
        # Reconstruct JS file
        new_js_content = f"const INFRA_ROADS = {json.dumps(data, indent=2)};"
        
        with open(INPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(new_js_content)
        print(f"Success: {INPUT_FILE} updated (removed PE-30)")
        
    else:
        print("Error: PE-30 feature not found")

if __name__ == "__main__":
    extract_red_route()
