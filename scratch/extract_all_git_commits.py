import subprocess, json

ws = r'c:\Users\rguti\PETRAL.SMART.DASHBOARD'

cmd = ['git', 'log', '--all', '--pretty=format:%ad|%h|%s', '--date=short']
res = subprocess.run(cmd, capture_output=True, text=True, cwd=ws)

commits_by_date = {}

for line in res.stdout.strip().split('\n'):
    if not line:
        continue
    parts = line.split('|', 2)
    if len(parts) == 3:
        date_str, hash_val, msg = parts[0], parts[1], parts[2]
        if date_str not in commits_by_date:
            commits_by_date[date_str] = []
        commits_by_date[date_str].append(f"[{hash_val}] {msg}")

with open(r'c:\Users\rguti\PETRAL.SMART.DASHBOARD\scratch\all_commits_by_date.json', 'w', encoding='utf-8') as f:
    json.dump(commits_by_date, f, indent=2, ensure_ascii=False)

print(f"Extracted commits for {len(commits_by_date)} dates.")
