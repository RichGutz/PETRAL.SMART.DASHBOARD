@echo off
cd /d "C:\Users\rguti\Petral.MARK\Dashboard_Puertos"


:loop
echo [%DATE% %TIME%] Starting Hourly Port Scraper... >> scraper_log.txt

echo Running Scraper...
python scraper_apu.py >> scraper_log.txt 2>&1

echo Syncing to Supabase...
python sync_supabase.py >> scraper_log.txt 2>&1

echo Cycle Completed. Waiting 1 hour... >> scraper_log.txt
timeout /t 3600
goto loop
