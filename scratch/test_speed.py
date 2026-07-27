import sys, time
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.services.forecast_service import get_cached_masters, clear_forecast_cache

sb = get_supabase()

# Test 1: First load (parallel fetch of 11 tables)
t0 = time.time()
m1 = get_cached_masters(sb)
t1 = time.time()
print(f"Primera carga (paralelo 11 tablas): {(t1 - t0)*1000:.2f} ms")

# Test 2: Second load (cached in RAM)
t2 = time.time()
m2 = get_cached_masters(sb)
t3 = time.time()
print(f"Segunda carga (desde caché RAM): {(t3 - t2)*1000:.2f} ms")
