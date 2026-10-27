"""
Local Digital Twin Adapter - Petral One Swarm Engine
Carga las tablas reales de producción descargadas en local y emula el acceso a datos
para que el motor matemático (forecast_service) corra 100% offline a velocidad nativa.
"""
import os
import json
from typing import Dict, Any, List

WORKTREE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_DIR = os.path.join(WORKTREE_DIR, "Local_Database", "json_tables")

class LocalDigitalTwin:
    def __init__(self, json_dir: str = JSON_DIR):
        self.json_dir = json_dir
        self.tables: Dict[str, List[Dict[str, Any]]] = {}
        self._load_all_tables()

    def _load_all_tables(self):
        if not os.path.exists(self.json_dir):
            raise FileNotFoundError(f"Directorio de tablas JSON no encontrado: {self.json_dir}")

        import ast
        for fname in os.listdir(self.json_dir):
            if fname.endswith(".json"):
                tbl_name = fname[:-5]
                fpath = os.path.join(self.json_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            cleaned_list = []
                            for row in data:
                                if isinstance(row, dict):
                                    clean_row = dict(row)
                                    for col in ["legs_data", "financial_summary", "financialSummary", "vesselParams", "vessel_params", "demurrage_rates", "projection_lines"]:
                                        if col in clean_row and isinstance(clean_row[col], str):
                                            val_str = clean_row[col].strip()
                                            try:
                                                clean_row[col] = json.loads(val_str)
                                            except Exception:
                                                try:
                                                    clean_row[col] = ast.literal_eval(val_str)
                                                except Exception:
                                                    pass
                                    cleaned_list.append(clean_row)
                                else:
                                    cleaned_list.append(row)
                            self.tables[tbl_name] = cleaned_list
                        else:
                            self.tables[tbl_name] = []
                except Exception as e:
                    self.tables[tbl_name] = []

    def get_table(self, table_name: str) -> List[Dict[str, Any]]:
        return self.tables.get(table_name, [])

    def get_cached_masters(self) -> Dict[str, Any]:
        """
        Emula la respuesta canónica de get_cached_masters() que consume forecast_service.py
        con las 11 tablas maestras requeridas más tablas auxiliares.
        """
        tables = [
            "vessels", "distances", "routes_clients", "routes_quotes",
            "bunker_prices", "ports", "contracts", "contract_tariffs",
            "port_costs_matrix", "port_cost_static", "vessel_terminal_operations",
            "terminals", "clients", "port_cost_tariffs", "port_cost_rules",
            "demurrage_records", "port_cost_concepts"
        ]
        res = {}
        for t in tables:
            res[t] = self.get_table(t)
        return res

    def get_quote_by_id(self, quote_id: str) -> Dict[str, Any]:
        quotes = self.get_table("routes_quotes")
        for q in quotes:
            if q.get("name") == quote_id or q.get("quote_id") == quote_id:
                return q
        return {}

    def get_historical_forecasts(self) -> List[Dict[str, Any]]:
        return self.get_table("commercial_forecasts")
