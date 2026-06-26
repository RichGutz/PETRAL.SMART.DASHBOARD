import os
from supabase import create_client

url = "https://hjjxooxcpvlvbaxgifbn.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqanhvb3hjcHZsdmJheGdpZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI1MDk0NCwiZXhwIjoyMDk3ODI2OTQ0fQ.i8KkZtLSDEqaNo15NH3easZV6vhHIbqoYD7ps4pkOMc"

supabase = create_client(url, key)

try:
    res = supabase.table("bunker").select("*").execute()
    print("Table 'bunker' data:")
    for row in res.data:
        print(row)
except Exception as e:
    print(f"Error querying 'bunker' table: {e}")

try:
    res = supabase.table("bunker_prices").select("*").execute()
    print("\nTable 'bunker_prices' data:")
    for row in res.data:
        print(row)
except Exception as e:
    print(f"Error querying 'bunker_prices' table: {e}")
