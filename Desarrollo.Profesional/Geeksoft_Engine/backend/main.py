from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import voyage, forecast

app = FastAPI(title="Geeksoft P&L Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir frontend Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voyage.router, prefix="/api/v1/voyage")
app.include_router(forecast.router, prefix="/api/v1/forecast")
