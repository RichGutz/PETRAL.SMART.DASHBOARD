import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno (e.g., desde archivo .env)
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

def get_supabase_client() -> Client:
    """Inicializa y retorna la conexión al cliente de Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase URL o Key no encontradas en las variables de entorno.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)
