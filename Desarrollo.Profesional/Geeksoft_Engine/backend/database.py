import os
from dotenv import load_dotenv
from supabase import create_client, Client
import psycopg2

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

def get_db_connection():
    import urllib.parse
    db_uri = os.getenv("SUPABASE_DB_URI")
    db_password = os.getenv("SUPABASE_DB_PASSWORD")
    
    if not db_uri or not db_password:
        raise ValueError("Faltan credenciales SUPABASE_DB_URI o SUPABASE_DB_PASSWORD en el archivo .env")
        
    encoded_password = urllib.parse.quote_plus(db_password)
    if "[PASSWORD]" in db_uri:
        db_uri = db_uri.replace("[PASSWORD]", encoded_password)
        
    return psycopg2.connect(db_uri)

