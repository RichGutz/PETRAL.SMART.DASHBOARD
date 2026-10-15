import os
import urllib.parse
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import ast

# Cargar variables de entorno (soporta ejecución desde raíz o subdirectorios)
_current_dir = os.path.dirname(os.path.abspath(__file__))
_engine_env = os.path.join(os.path.dirname(_current_dir), ".env")
if os.path.exists(_engine_env):
    load_dotenv(_engine_env)
load_dotenv()

_supabase_client = None
_PK_CACHE = {}

def get_db_connection():
    db_uri = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URI")
    db_password = os.getenv("SUPABASE_DB_PASSWORD")
    
    if not db_uri:
        raise ValueError("Falta DATABASE_URL o SUPABASE_DB_URI en las variables de entorno")
        
    if db_password and "[PASSWORD]" in db_uri:
        encoded_password = urllib.parse.quote_plus(db_password)
        db_uri = db_uri.replace("[PASSWORD]", encoded_password)
        
    return psycopg2.connect(db_uri)

def _clean_value(val):
    if isinstance(val, str):
        s = val.strip()
        if (s.startswith('{') and s.endswith('}')) or (s.startswith('[') and s.endswith(']')):
            try:
                return json.loads(s)
            except Exception:
                try:
                    return ast.literal_eval(s)
                except Exception:
                    return val
    return val

def _clean_row(row_dict):
    if not isinstance(row_dict, dict):
        return row_dict
    return {k: _clean_value(v) for k, v in row_dict.items()}

def _prepare_param(val):
    if isinstance(val, (dict, list)):
        return json.dumps(val)
    return val

KNOWN_PRIMARY_KEYS = {
    "vessels": ["vessel_id"],
    "ports": ["port_id"],
    "terminals": ["terminal_id", "port_id"],
    "routes": ["origin_port_id", "destination_port_id"],
    "distances": ["port_a", "port_b"],
    "bunker_prices": ["fuel_type"],
    "contracts": ["client_id", "destination_port_id"],
    "contract_tariffs": ["client_id", "destination_port_id", "min_tonnage", "max_tonnage"],
    "routes_clients": ["name"],
    "routes_quotes": ["name"],
    "suppliers": ["supplier_id"],
    "port_costs_matrix": ["rule_id"],
    "port_cost_static": ["port_id", "operation_type", "vessel_id", "sub_operation_type", "terminal_id"],
    "sources_sinks": ["port_id", "year", "empresa", "producto"],
    "vessel_terminal_operations": ["port_id", "terminal_id", "vessel_id"],
    "demurrage_records": ["id"],
    "app_users": ["id"],
    "user_permissions": ["user_id"],
    "clients": ["client_id"]
}

def get_table_primary_key(cur, table_name: str) -> list:
    if table_name in _PK_CACHE:
        return _PK_CACHE[table_name]
    try:
        cur.execute("""
            SELECT a.attname
            FROM   pg_index i
            JOIN   pg_attribute a ON a.attrelid = i.indrelid
                                 AND a.attnum = ANY(i.indkey)
            WHERE  i.indrelid = %s::regclass
            AND    i.indisprimary;
        """, (table_name,))
        rows = cur.fetchall()
        pks = [r['attname'] if isinstance(r, dict) else r[0] for r in rows]
        if pks:
            _PK_CACHE[table_name] = pks
            return pks
    except Exception:
        pass

    # Fallback canónico determinístico para esquemas sin constraint PK
    fallback = KNOWN_PRIMARY_KEYS.get(table_name, [])
    if fallback:
        _PK_CACHE[table_name] = fallback
        return fallback

    return []

class SupabaseResponse:
    def __init__(self, data):
        self.data = data

    def __iter__(self):
        return iter(self.data if isinstance(self.data, list) else [])

    def __len__(self):
        return len(self.data) if hasattr(self.data, "__len__") else 0

    def __bool__(self):
        return bool(self.data)

    def __getitem__(self, item):
        return self.data[item]

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
        self._upsert_data = None
        self._on_conflict = None

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

    def upsert(self, data, on_conflict=None):
        self._upsert_data = data if isinstance(data, list) else [data]
        self._on_conflict = on_conflict
        self._action = "UPSERT"
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

    def in_(self, col, values):
        self._filters.append((col, "IN", list(values)))
        return self

    def ilike(self, col, val):
        self._filters.append((col, "ILIKE", val))
        return self

    def match(self, query_dict):
        if isinstance(query_dict, dict):
            for k, v in query_dict.items():
                self.eq(k, v)
        return self

    def or_(self, expr):
        self._filters.append(("__OR__", "RAW", expr))
        return self

    def order(self, col, desc=False):
        direction = "DESC" if desc else "ASC"
        self._order_by = f'"{col}" {direction}'
        return self

    def limit(self, count):
        self._limit = count
        return self

    def _build_where_clause(self):
        where_clauses = []
        params = []
        for col, op, val in self._filters:
            if col == "__OR__":
                or_clauses = []
                for cond in str(val).split(","):
                    cond = cond.strip()
                    parts = cond.split(".", 2)
                    if len(parts) == 3:
                        c, o, v = parts
                        op_map = {
                            "eq": "=",
                            "neq": "!=",
                            "gt": ">",
                            "gte": ">=",
                            "lt": "<",
                            "lte": "<=",
                            "ilike": "ILIKE"
                        }
                        sql_op = op_map.get(o.lower(), "=")
                        or_clauses.append(f'"{c}" {sql_op} %s')
                        params.append(v)
                if or_clauses:
                    where_clauses.append("(" + " OR ".join(or_clauses) + ")")
            elif op == "IN":
                if not val:
                    where_clauses.append("1=0")
                else:
                    ph = ', '.join(['%s'] * len(val))
                    where_clauses.append(f'"{col}" IN ({ph})')
                    for item in val:
                        params.append(_prepare_param(item))
            elif op == "ILIKE":
                where_clauses.append(f'"{col}" ILIKE %s')
                params.append(val)
            else:
                where_clauses.append(f'"{col}" {op} %s')
                params.append(val)
        return where_clauses, params

    def execute(self):
        conn = self.conn_func()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if self._action == "SELECT":
                    query = f'SELECT {self._select_cols} FROM "{self.table_name}"'
                    where_clauses, params = self._build_where_clause()
                    if where_clauses:
                        query += " WHERE " + " AND ".join(where_clauses)
                    if self._order_by:
                        query += f" ORDER BY {self._order_by}"
                    if self._limit:
                        query += f" LIMIT {self._limit}"
                    cur.execute(query, params)
                    rows = cur.fetchall()
                    return SupabaseResponse([_clean_row(dict(r)) for r in rows])

                elif self._action == "INSERT":
                    results = []
                    for row in self._insert_data:
                        cols = list(row.keys())
                        cols_str = ', '.join([f'"{c}"' for c in cols])
                        placeholders = ', '.join(['%s'] * len(cols))
                        vals = [_prepare_param(row[c]) for c in cols]
                        query = f'INSERT INTO "{self.table_name}" ({cols_str}) VALUES ({placeholders}) RETURNING *;'
                        cur.execute(query, vals)
                        res = cur.fetchone()
                        if res:
                            results.append(_clean_row(dict(res)))
                    conn.commit()
                    return SupabaseResponse(results)

                elif self._action == "UPDATE":
                    cols = list(self._update_data.keys())
                    set_clauses = [f'"{c}" = %s' for c in cols]
                    params = [_prepare_param(self._update_data[c]) for c in cols]
                    query = f'UPDATE "{self.table_name}" SET ' + ', '.join(set_clauses)
                    where_clauses, where_params = self._build_where_clause()
                    if where_clauses:
                        query += " WHERE " + " AND ".join(where_clauses)
                        params.extend(where_params)
                    query += " RETURNING *;"
                    cur.execute(query, params)
                    rows = cur.fetchall()
                    conn.commit()
                    return SupabaseResponse([_clean_row(dict(r)) for r in rows])

                elif self._action == "UPSERT":
                    results = []
                    conflict_cols = []
                    if self._on_conflict:
                        if isinstance(self._on_conflict, str):
                            conflict_cols = [c.strip().strip('"') for c in self._on_conflict.split(',') if c.strip()]
                        elif isinstance(self._on_conflict, (list, tuple)):
                            conflict_cols = [c.strip().strip('"') for c in self._on_conflict]
                    
                    if not conflict_cols:
                        conflict_cols = get_table_primary_key(cur, self.table_name)
                    
                    for row in self._upsert_data:
                        # 1. Si se conoce la PK y la fila la tiene, intentar UPDATE primero (evita errores de NOT NULL en columnas parciales)
                        if conflict_cols and all(c in row for c in conflict_cols):
                            update_cols = [c for c in row.keys() if c not in conflict_cols]
                            if update_cols:
                                set_clauses = [f'"{c}" = %s' for c in update_cols]
                                set_vals = [_prepare_param(row[c]) for c in update_cols]
                                where_clauses = [f'"{c}" = %s' for c in conflict_cols]
                                where_vals = [_prepare_param(row[c]) for c in conflict_cols]
                                
                                update_query = f'UPDATE "{self.table_name}" SET {", ".join(set_clauses)} WHERE {" AND ".join(where_clauses)} RETURNING *;'
                                cur.execute(update_query, set_vals + where_vals)
                                res = cur.fetchone()
                                if res:
                                    results.append(_clean_row(dict(res)))
                                    continue
                            else:
                                where_clauses = [f'"{c}" = %s' for c in conflict_cols]
                                where_vals = [_prepare_param(row[c]) for c in conflict_cols]
                                cur.execute(f'SELECT * FROM "{self.table_name}" WHERE {" AND ".join(where_clauses)};', where_vals)
                                res = cur.fetchone()
                                if res:
                                    results.append(_clean_row(dict(res)))
                                    continue

                        # 2. Si no existe o no tiene conflict_cols, hacer INSERT ON CONFLICT
                        cols = list(row.keys())
                        cols_str = ', '.join([f'"{c}"' for c in cols])
                        placeholders = ', '.join(['%s'] * len(cols))
                        vals = [_prepare_param(row[c]) for c in cols]
                        
                        if conflict_cols:
                            conflict_str = ', '.join([f'"{c}"' for c in conflict_cols])
                            update_cols = [c for c in cols if c not in conflict_cols]
                            if update_cols:
                                set_clause = ', '.join([f'"{c}" = EXCLUDED."{c}"' for c in update_cols])
                                query = (
                                    f'INSERT INTO "{self.table_name}" ({cols_str}) '
                                    f'VALUES ({placeholders}) '
                                    f'ON CONFLICT ({conflict_str}) '
                                    f'DO UPDATE SET {set_clause} '
                                    f'RETURNING *;'
                                )
                            else:
                                query = (
                                    f'INSERT INTO "{self.table_name}" ({cols_str}) '
                                    f'VALUES ({placeholders}) '
                                    f'ON CONFLICT ({conflict_str}) '
                                    f'DO NOTHING '
                                    f'RETURNING *;'
                                )
                        else:
                            query = f'INSERT INTO "{self.table_name}" ({cols_str}) VALUES ({placeholders}) RETURNING *;'
                            
                        cur.execute(query, vals)
                        res = cur.fetchone()
                        if res:
                            results.append(_clean_row(dict(res)))
                    conn.commit()
                    return SupabaseResponse(results)

                elif self._action == "DELETE":
                    query = f'DELETE FROM "{self.table_name}"'
                    where_clauses, params = self._build_where_clause()
                    if where_clauses:
                        query += " WHERE " + " AND ".join(where_clauses)
                    query += " RETURNING *;"
                    cur.execute(query, params)
                    rows = cur.fetchall()
                    conn.commit()
                    return SupabaseResponse([_clean_row(dict(r)) for r in rows])
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
            # Conexión directa nativa a PostgreSQL (Ultra-rápida y sin límites de cuota)
            _supabase_client = DirectPostgresClient(get_db_connection)
        else:
            from supabase import create_client
            SUPABASE_URL = os.getenv("SUPABASE_URL")
            SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            if not SUPABASE_URL or not SUPABASE_KEY:
                raise ValueError("Faltan credenciales de Supabase o Base de Datos")
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            
    return _supabase_client
