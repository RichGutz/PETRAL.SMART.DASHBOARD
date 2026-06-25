
import requests
import re

ALBUM_URL = "https://photos.app.goo.gl/2cmBXjyz2xcrunwu8"

def test_scrape():
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    
    try:
        response = session.get(ALBUM_URL)
        html = response.text
        
        # Pattern for URLs and filenames
        # Pattern 1: URL followed by filename
        pattern = re.compile(r'\"(https://lh3\.googleusercontent\.com/pw/[^\"]+)\".*?\"([^\"]+\.(?:jpg|jpeg|png|mov|mp4|heic))\"', re.IGNORECASE | re.DOTALL)
        matches = pattern.findall(html)
        
        print(f"--- MATCHES FOUND: {len(matches)} ---")
        for i, (url, name) in enumerate(matches[:20]):
            # Append =dv for direct video or =d for download
            # For videos, =dv or =m22 is common for direct access
            clean_url = url.split('=')[0]
            if name.lower().endswith(('.mov', '.mp4')):
                test_url = f"{clean_url}=dv"
            else:
                test_url = f"{clean_url}=d"
            print(f"{i+1}. {name} | Link: {test_url}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_scrape()
