import os
import urllib.parse
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Cargar variables de entorno
load_dotenv()

_supabase_client = None

def get_db_connection():
    db_uri = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URI")
    db_password = os.getenv("SUPABASE_DB_PASSWORD")
    
    if not db_uri:
        raise ValueError("Falta DATABASE_URL o SUPABASE_DB_URI en las variables de entorno")
        
    if db_password and "[PASSWORD]" in db_uri:
        encoded_password = urllib.parse.quote_plus(db_password)
        db_uri = db_uri.replace("[PASSWORD]", encoded_password)
        
    return psycopg2.connect(db_uri)

class SupabaseResponse:
    def __init__(self, data):
        self.data = data

class TableQuery:
    def __init__(self, conn_func, table_name):
        self.conn_func = conn_func
        self.table_name = table_name
        self._select_cols = "*"
        self._filters = []
        self._order_by = None
        self._limit = None
        self._action = "SELECT"
        self._insert_data = None
        self._update_data = None

    def select(self, cols="*"):
        self._select_cols = cols
        self._action = "SELECT"
        return self

    def insert(self, data):
        self._insert_data = data if isinstance(data, list) else [data]
        self._action = "INSERT"
        return self

    def update(self, data):
        self._update_data = data
        self._action = "UPDATE"
        return self

    def delete(self):
        self._action = "DELETE"
        return self

    def eq(self, col, val):
        self._filters.append((col, "=", val))
        return self

    def neq(self, col, val):
        self._filters.append((col, "!=", val))
        return self

    def gt(self, col, val):
        self._filters.append((col, ">", val))
        return self

    def gte(self, col, val):
        self._filters.append((col, ">=", val))
        return self

    def lt(self, col, val):
        self._filters.append((col, "<", val))
        return self

    def lte(self, col, val):
        self._filters.append((col, "<=", val))
        return self

    def order(self, col, desc=False):
        direction = "DESC" if desc else "ASC"
        self._order_by = f'"{col}" {direction}'
        return self

    def limit(self, count):
        self._limit = count
        return self

    def execute(self):
        conn = self.conn_func()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if self._action == "SELECT":
                    query = f'SELECT {self._select_cols} FROM "{self.table_name}"'
                    params = []
                    if self._filters:
                        where_clauses = []
                        for col, op, val in self._filters:
                            where_clauses.append(f'"{col}" {op} %s')
                            params.append(val)
                        query += " WHERE " + " AND ".join(where_clauses)
                    if self._order_by:
                        query += f" ORDER BY {self._order_by}"
                    if self._limit:
                        query += f" LIMIT {self._limit}"
                    cur.execute(query, params)
                    rows = cur.fetchall()
                    return SupabaseResponse([dict(r) for r in rows])

                elif self._action == "INSERT":
                    results = []
                    for row in self._insert_data:
                        cols = list(row.keys())
                        cols_str = ', '.join([f'"{c}"' for c in cols])
                        placeholders = ', '.join(['%s'] * len(cols))
                        vals = [row[c] for c in cols]
                        query = f'INSERT INTO "{self.table_name}" ({cols_str}) VALUES ({placeholders}) RETURNING *;'
                        cur.execute(query, vals)
                        res = cur.fetchone()
                        if res:
                            results.append(dict(res))
                    conn.commit()
                    return SupabaseResponse(results)

                elif self._action == "UPDATE":
                    cols = list(self._update_data.keys())
                    set_clauses = [f'"{c}" = %s' for c in cols]
                    params = [self._update_data[c] for c in cols]
                    query = f'UPDATE "{self.table_name}" SET ' + ', '.join(set_clauses)
                    if self._filters:
                        where_clauses = []
                        for col, op, val in self._filters:
                            where_clauses.append(f'"{col}" {op} %s')
                            params.append(val)
                        query += " WHERE " + " AND ".join(where_clauses)
                    query += " RETURNING *;"
                    cur.execute(query, params)
                    rows = cur.fetchall()
                    conn.commit()
                    return SupabaseResponse([dict(r) for r in rows])

                elif self._action == "DELETE":
                    query = f'DELETE FROM "{self.table_name}"'
                    params = []
                    if self._filters:
                        where_clauses = []
                        for col, op, val in self._filters:
                            where_clauses.append(f'"{col}" {op} %s')
                            params.append(val)
                        query += " WHERE " + " AND ".join(where_clauses)
                    query += " RETURNING *;"
                    cur.execute(query, params)
                    rows = cur.fetchall()
                    conn.commit()
                    return SupabaseResponse([dict(r) for r in rows])
        finally:
            conn.close()

class DirectPostgresClient:
    def __init__(self, conn_func):
        self.conn_func = conn_func

    def table(self, table_name: str) -> TableQuery:
        return TableQuery(self.conn_func, table_name)

def get_supabase():
    global _supabase_client
    if _supabase_client is None:
        use_direct = os.getenv("USE_DIRECT_POSTGRES", "true").lower() in ("true", "1", "yes")
        db_uri = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URI")
        
        if use_direct and db_uri:
            # Usar conexión directa nativa a PostgreSQL (Ultra-rápida y sin límites de cuota)
            _supabase_client = DirectPostgresClient(get_db_connection)
        else:
            from supabase import create_client
            SUPABASE_URL = os.getenv("SUPABASE_URL")
            SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            if not SUPABASE_URL or not SUPABASE_KEY:
                raise ValueError("Faltan credenciales de Supabase o Base de Datos")
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            
    return _supabase_client
