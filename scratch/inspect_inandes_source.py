import sys
import os
import glob

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

target_dir = r"C:\Users\rguti\Inandes.ERP.React"
print(f"Inspeccionando {target_dir}...\n")

matches = []
for root, dirs, files in os.walk(target_dir):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')
    if 'dist' in dirs:
        dirs.remove('dist')
    if '.next' in dirs:
        dirs.remove('.next')
        
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.env', '.env.local', '.env.production', '.env.development')):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                    for idx, line in enumerate(lines, 1):
                        if 'inandes.react.geeksoft.tech' in line or 'generate-pdf' in line or '8010' in line:
                            matches.append((file_path, idx, line.strip()))
            except Exception as e:
                pass

print(f"📌 Total ocurrencias encontradas: {len(matches)}\n")
for path, line_no, content in matches:
    rel_path = os.path.relpath(path, target_dir)
    print(f"[{rel_path}:{line_no}]")
    print(f"   {content}\n")

# Check env files
print("=" * 60)
print("📌 ARCHIVOS DE ENTORNO (.env*):")
for env_file in glob.glob(os.path.join(target_dir, ".env*")):
    print(f"\nArchivo: {os.path.basename(env_file)}")
    with open(env_file, 'r', encoding='utf-8', errors='ignore') as f:
        print(f.read())
