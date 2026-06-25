import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Cargar variables de entorno desde el archivo .env
load_dotenv()

_supabase_client = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Faltan credenciales de Supabase en el archivo .env")

        # Crear el cliente oficial de Supabase
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client
