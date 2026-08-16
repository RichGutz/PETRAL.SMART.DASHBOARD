import requests
import json

url = 'https://ylburlewwxbaslsuuwre.supabase.co/rest/v1/commercial_forecasts?select=*'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsYnVybGV3d3hiYXNsc3V1d3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODgxMzUsImV4cCI6MjA1Njg2NDEzNX0.2B04E5u1ZlI25XwESt7i1Sst1wA-P-o1xWp1L63_6-E',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsYnVybGV3d3hiYXNsc3V1d3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODgxMzUsImV4cCI6MjA1Njg2NDEzNX0.2B04E5u1ZlI25XwESt7i1Sst1wA-P-o1xWp1L63_6-E'
}

r = requests.get(url, headers=headers)
rows = r.json()
print("Total rows in commercial_forecasts:", len(rows))
for row in rows:
    name = row.get('name')
    f_id = row.get('id')
    lines = row.get('projection_lines', [])
    print(f"\nScenario: '{name}' | ID: {f_id} | Lines count: {len(lines)}")
    for l in lines[:5]:
        print("  Line sample:", l.get('client'), l.get('route_id'), l.get('vessel'), l.get('month'))
