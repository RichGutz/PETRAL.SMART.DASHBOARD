import os

file_path = "infrastructure_roads.js"
with open(file_path, "r", encoding="utf-8") as f:
    data = f.read()

prefix = '"id": "IC-821",'
idx = data.rfind(prefix)
if idx != -1:
    pre_comma = data.rfind("},", 0, idx)
    if pre_comma != -1:
        new_data = data[:pre_comma] + "}\n  ]\n};\n"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_data)
        print("Successfully removed IC-821 from infrastructure_roads.js")
    else:
        print("Preceding comma not found.")
else:
    print("IC-821 feature not found.")
