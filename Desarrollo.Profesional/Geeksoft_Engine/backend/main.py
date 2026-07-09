from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import voyage, forecast, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: warm up master data cache
    try:
        print("[Startup] Pre-cargando tablas maestras en caché...")
        from backend.database import get_supabase
        from backend.services.forecast_service import get_cached_masters
        supabase = get_supabase()
        get_cached_masters(supabase)
        print("[Startup] Caché de tablas maestras listo.")
    except Exception as e:
        print(f"[Startup] Advertencia: No se pudo calentar caché: {e}")
    yield
    # Shutdown: nothing to clean up

app = FastAPI(title="Geeksoft P&L Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir frontend Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voyage.router, prefix="/api/v1/voyage")
app.include_router(forecast.router, prefix="/api/v1/forecast")
app.include_router(auth.router, prefix="/api/v1")

