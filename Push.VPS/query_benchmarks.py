import os
from supabase import create_client

url = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

supabase = create_client(url, key)

try:
    res = supabase.table("audit_benchmarks").select("*").execute()
    print("Table 'audit_benchmarks' data:")
    for row in res.data[:3]:
        print(row)
except Exception as e:
    print(f"Error querying 'audit_benchmarks' table: {e}")
