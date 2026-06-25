import requests
import re
import json
import os

# --- CONFIGURATION ---
ALBUM_URL = "https://photos.app.goo.gl/2cmBXjyz2xcrunwu8"

# Detect if we are on Linux (VPS) or Windows
if os.name == 'posix':
    # VPS Path
    JS_DATA_FILE = "/var/www/html/petral/layer_media_data.js"
else:
    # Local PC Path
    JS_DATA_FILE = os.path.join(os.path.dirname(__file__), "layer_media_data.js")

def get_google_photos_links(album_url):
    """Scrapes a public Google Photos album for image base URLs and filenames."""
    if not album_url:
        return {}
    
    try:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        
        response = session.get(album_url)
        if response.status_code != 200:
            print(f"Error fetching album: {response.status_code}")
            return {}
        
        html = response.text
        
        # Improved Regex: Look for URLs and filenames in a more flexible way
        # Google Photos structure is complex, we look for LH3 URLs followed by filenames in the same block
        pattern = re.compile(r'\"(https://lh3\.googleusercontent\.com/pw/[^\"]+)\".*?\"([^\"]+\.(?:jpg|jpeg|png|mov|mp4|heic))\"', re.IGNORECASE | re.DOTALL)
        matches = pattern.findall(html)
        
        mapping = {}
        for url, name in matches:
            # Clean URL to get the base high-quality version
            # Removing =w... and keeping only up to the base
            clean_url = url.split('=')[0]
            mapping[name] = clean_url
            
        return mapping
    except Exception as e:
        print(f"Scraper error: {e}")
        return {}

def update_js_file(new_links_map):
    if not os.path.exists(JS_DATA_FILE):
        print(f"Data file not found: {JS_DATA_FILE}")
        return

    try:
        with open(JS_DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the assignment
        assignment_match = re.search(r'const LAYER_MEDIA_DATA = (\[.*?\]);', content, re.DOTALL)
        if not assignment_match:
            print("Could not find LAYER_MEDIA_DATA in file.")
            return
            
        json_str = assignment_match.group(1)
        data = json.loads(json_str)
        
        updated_count = 0
        for item in data:
            filename = item['filename']
            # Try exact match or relative path match
            basename = os.path.basename(filename)
            
            if basename in new_links_map:
                item['original_url'] = new_links_map[basename]
                updated_count += 1
            # Special case for files that might have been renamed or have paths in JSON
            elif filename in new_links_map:
                item['original_url'] = new_links_map[filename]
                updated_count += 1
                
        # Save back the whole file with the new JSON
        new_json_str = json.dumps(data, indent=4)
        new_content = content.replace(json_str, new_json_str)
        
        with open(JS_DATA_FILE, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"Successfully updated {updated_count} media items with cloud links.")
        return updated_count
    except Exception as e:
        print(f"Error updating JS file: {e}")
        return 0

if __name__ == "__main__":
    print(f"🔍 Scrapeando álbum: {ALBUM_URL}")
    links_map = get_google_photos_links(ALBUM_URL)
    
    if links_map:
        print(f"✅ Encontrados {len(links_map)} links en Google Photos.")
        update_js_file(links_map)
    else:
        print("❌ No se encontraron links. ¿Es el álbum público?")
