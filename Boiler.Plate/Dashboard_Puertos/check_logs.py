
import os
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from collections import Counter

# Load environment variables
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_KEY in .env file")
    exit(1)

supabase: Client = create_client(url, key)

def check_logs():
    print("Checking Supabase for recent activity in 'port_arrivals'...")
    try:
        # Fetch snapshot_dates from the last 1000 records
        response = supabase.table("port_arrivals").select("snapshot_date").order("snapshot_date", desc=True).limit(1000).execute()
        
        data = response.data
        if not data:
            print("No data found in 'port_arrivals'.")
            return

        dates = [record['snapshot_date'] for record in data]
        counts = Counter(dates)
        
        print("\nRecent Scraping Activity (Records per Date):")
        print("-" * 40)
        for date, count in sorted(counts.items(), reverse=True):
            print(f"{date}: {count} records")
        print("-" * 40)
        
    except Exception as e:
        print(f"Error querying Supabase: {e}")

if __name__ == "__main__":
    check_logs()
