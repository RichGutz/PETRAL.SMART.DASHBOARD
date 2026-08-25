import sys
import urllib.request
import re
import ssl

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://inandes.geeksoft.tech/assets/index-CT4EOl_Z.js"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx, timeout=10) as res:
    content = res.read().decode('utf-8', errors='replace')
    print(f"File size: {len(content)} characters")
    
    # Find endpoints / URLs
    urls = set(re.findall(r'https?://[a-zA-Z0-9\.\-:\/_]+', content))
    print("\n📌 URLs found in bundle:")
    for u in sorted(urls):
        print("  -", u)

    # Check for specific terms
    for term in ['generate-pdf', '8010', '8000', 'api/', 'inversionistas']:
        matches = [m.start() for m in re.finditer(term, content)]
        print(f"\nTerm '{term}': {len(matches)} occurrences")
        for idx in matches[:3]:
            start = max(0, idx - 80)
            end = min(len(content), idx + 80)
            print("   Snippet:", content[start:end].replace('\n', ' '))
