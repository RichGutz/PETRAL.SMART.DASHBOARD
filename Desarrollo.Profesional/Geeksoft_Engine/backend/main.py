from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import voyage, forecast, auth, utils

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup no bloqueante
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
app.include_router(utils.router, prefix="/api/v1/utils")


