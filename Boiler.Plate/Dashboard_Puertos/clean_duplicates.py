import json

INPUT_FILE = "infrastructure_roads.js"

def clean_duplicates():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    start_index = content.find('{')
    end_index = content.rfind('}')
    
    if start_index == -1:
        print("Error reading JS")
        return

    json_str = content[start_index:end_index+1]
    data = json.loads(json_str)
    
    new_features = []
    removed_count = 0
    
    for f in data.get('features', []):
        props = f.get('properties', {})
        pid = props.get('id', '')
        name = props.get('name', '')
        
        # Remove IC-821 (Purple duplicate)
        if pid == 'IC-821':
            print(f"Removing {pid}: {name}")
            removed_count += 1
            continue
            
        # Check for potential "Red/Orange" duplicate
        # The user says "Orange". Standard national roads in this app are often #e91e63 (Pink/Reddish)
        # Maybe "PE-30A"? 
        # Or maybe there is a weird "Marcona" route with orange color?
        
        # NOTE: I will manually inspect grep results before automating the removal of the specific "orange" one.
        # But I am confident about IC-821.
        
        new_features.append(f)

    data['features'] = new_features
    
    new_js = f"const INFRA_ROADS = {json.dumps(data, indent=2)};"
    
    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(new_js)
        
    print(f"Removed {removed_count} features.")

if __name__ == "__main__":
    clean_duplicates()
