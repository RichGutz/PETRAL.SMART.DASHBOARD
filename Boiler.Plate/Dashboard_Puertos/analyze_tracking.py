import json
from datetime import datetime

with open('layer_tracking.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Strip js variable declaration
json_str = content.replace('const LAYER_TRACKING = ', '').strip().strip(';')
data = json.loads(json_str)

print(f"Total points: {len(data)}")

# Find out-of-order points
out_of_order = []
for i in range(1, len(data)):
    t1 = datetime.fromisoformat(data[i-1]['created_at'])
    t2 = datetime.fromisoformat(data[i]['created_at'])
    if t2 < t1:
        out_of_order.append(i)

print(f"Found {len(out_of_order)} time reversals.")
if out_of_order:
    for idx in out_of_order[:5]:
        print(f"Jump at index {idx}:")
        print(f"  [{idx-1}] {data[idx-1]['created_at']} -> Lat: {data[idx-1]['latitude']}")
        print(f"  [{idx}] {data[idx]['created_at']} -> Lat: {data[idx]['latitude']}")

print("\nLast 5 points in raw array:")
for i in range(max(0, len(data)-5), len(data)):
    print(f"  [{i}] {data[i]['created_at']} -> Lat: {data[i]['latitude']}, Lng: {data[i]['longitude']} (Ordinal {data[i].get('ordinal', 'N/A')})")
