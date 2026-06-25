import json

input_file = "railway_line.geojson"
output_file = "railway_marcona_andahuaylas.js"

print(f"Converting {input_file} to {output_file}...")

try:
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    js_content = f"const RAILWAY_MARCONA_ANDAHUAYLAS = {json.dumps(data, indent=4)};"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print("Success!")

except Exception as e:
    print(f"Error: {e}")
