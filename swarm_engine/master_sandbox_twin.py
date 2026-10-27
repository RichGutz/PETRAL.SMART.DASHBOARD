"""
Master Sandbox Twin - Gestor de Tablas Maestras Vacías y Operaciones UPSERT
Permite inicializar un conjunto de maestros 100% limpios y ejecutar operaciones
de mutacion (INSERT / UPDATE / UPSERT) aisladas con guardas de validacion.
"""
import os
import copy
from typing import Dict, Any, List, Optional

class MasterSandboxTwin:
    def __init__(self, canonical_twin):
        self.canonical_twin = canonical_twin
        # Inicializar conjunto completo de tablas maestras vacías
        self.tables: Dict[str, List[Dict[str, Any]]] = {
            "vessels": [],
            "ports": [],
            "terminals": [],
            "distances": [],
            "clients": [],
            "bunker_prices": [],
            "contracts": [],
            "contract_tariffs": [],
            "port_cost_tariffs": [],
            "port_costs_matrix": [],
            "port_cost_static": [],
            "port_cost_rules": [],
            "port_cost_concepts": [],
            "vessel_terminal_operations": [],
            "demurrage_records": [],
            "routes_clients": [],
            "routes_quotes": []
        }
        self.mutation_log: List[Dict[str, Any]] = []

    def reset_to_empty(self):
        """Reinicia todas las tablas maestras a estado 0 (vacías)"""
        for tbl in self.tables:
            self.tables[tbl] = []
        self.mutation_log = []

    def get_table(self, table_name: str) -> List[Dict[str, Any]]:
        return self.tables.get(table_name, [])

    def get_cached_masters(self) -> Dict[str, Any]:
        """
        Retorna el diccionario consolidado de tablas maestras que consume forecast_service.
        Alimentado 100% desde este Sandbox poblado y curado.
        """
        res = {}
        for t in self.tables:
            res[t] = self.tables[t]
        return res

    def upsert_vessel(self, vessel_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Emula el endpoint de mutación /api/v1/forecast/vessels aplicando guardas estrictas.
        Detecta corrupción por ceros no intencionales o strings sin castear.
        """
        v_clean = dict(vessel_payload)
        v_id = (v_clean.get("vessel_id") or v_clean.get("name") or "").strip().upper()
        if not v_id:
            raise ValueError("VALIDATION_ERROR: 'vessel_id' es obligatorio y no puede estar vacío.")

        # Guardas de Tipos Numéricos
        numeric_fields = [
            "tce_required", "vessel_speed", "dwt", "dwcc", "grt", "length", "beam",
            "consumption_sea_ifo", "consumption_port_ifo", "consumption_idle_ifo",
            "consumption_load_ifo", "consumption_disch_ifo", "consumption_sea_mdo",
            "consumption_idle_mdo", "consumption_load_mdo", "consumption_disch_mdo",
            "max_capacity_ifo", "max_capacity_mdo"
        ]

        # Validación estricta: Rechazar strings en campos numéricos
        for f in numeric_fields:
            if f in v_clean:
                val = v_clean[f]
                if isinstance(val, str):
                    raise TypeError(f"TYPE_ERROR: El campo '{f}' vino como string ('{val}'). Requiere float/int.")
                if val is not None and val < 0:
                    raise ValueError(f"VALUE_ERROR: El campo '{f}' no puede ser negativo ({val}).")

        # Invariante de Seguridad Naval: Buques comerciales no pueden tener DWT o Speed en 0
        if v_clean.get("vessel_speed", 0) <= 0:
            raise ValueError(f"CORRUPTION_GUARD: La velocidad de navegación no puede ser 0 o nula para {v_id}.")
        if v_clean.get("dwt", 0) <= 0:
            raise ValueError(f"CORRUPTION_GUARD: El DWT naval no puede ser 0 o nulo para {v_id}.")

        # Buscar si ya existe para UPDATE o INSERT
        existing_idx = None
        for idx, row in enumerate(self.tables["vessels"]):
            if row.get("vessel_id", "").strip().upper() == v_id:
                existing_idx = idx
                break

        if existing_idx is not None:
            self.tables["vessels"][existing_idx].update(v_clean)
            action = "UPDATE"
        else:
            self.tables["vessels"].append(v_clean)
            action = "INSERT"

        self.mutation_log.append({"table": "vessels", "action": action, "key": v_id})
        return {"status": "success", "action": action, "vessel_id": v_id}

    def upsert_port(self, port_payload: Dict[str, Any]) -> Dict[str, Any]:
        p_clean = dict(port_payload)
        p_id = (p_clean.get("port_id") or p_clean.get("name") or "").strip().upper()
        if not p_id:
            raise ValueError("VALIDATION_ERROR: 'port_id' es obligatorio.")
        
        p_clean["port_id"] = p_id
        existing_idx = None
        for idx, row in enumerate(self.tables["ports"]):
            if row.get("port_id", "").strip().upper() == p_id:
                existing_idx = idx
                break

        if existing_idx is not None:
            self.tables["ports"][existing_idx].update(p_clean)
            action = "UPDATE"
        else:
            self.tables["ports"].append(p_clean)
            action = "INSERT"

        self.mutation_log.append({"table": "ports", "action": action, "key": p_id})
        return {"status": "success", "action": action, "port_id": p_id}

    def upsert_distance(self, dist_payload: Dict[str, Any]) -> Dict[str, Any]:
        d_clean = dict(dist_payload)
        p_a = (d_clean.get("port_a") or d_clean.get("origin_port_id") or "").strip().upper()
        p_b = (d_clean.get("port_b") or d_clean.get("destination_port_id") or "").strip().upper()
        if not p_a or not p_b:
            raise ValueError("VALIDATION_ERROR: 'port_a' y 'port_b' son obligatorios.")

        dist_nm = d_clean.get("distance_nm") or d_clean.get("distance", 0)
        if isinstance(dist_nm, str):
            raise TypeError(f"TYPE_ERROR: 'distance_nm' no puede ser string ('{dist_nm}').")
        if dist_nm <= 0:
            raise ValueError(f"VALUE_ERROR: Distancia inválida entre {p_a} y {p_b} ({dist_nm} NM).")

        d_clean["port_a"] = p_a
        d_clean["port_b"] = p_b
        d_clean["distance_nm"] = float(dist_nm)

        existing_idx = None
        for idx, row in enumerate(self.tables["distances"]):
            r_a = row.get("port_a", "").strip().upper()
            r_b = row.get("port_b", "").strip().upper()
            if (r_a == p_a and r_b == p_b) or (r_a == p_b and r_b == p_a):
                existing_idx = idx
                break

        if existing_idx is not None:
            self.tables["distances"][existing_idx].update(d_clean)
            action = "UPDATE"
        else:
            self.tables["distances"].append(d_clean)
            action = "INSERT"

        self.mutation_log.append({"table": "distances", "action": action, "key": f"{p_a}-{p_b}"})
        return {"status": "success", "action": action, "route": f"{p_a}-{p_b}"}

    def upsert_bunker_price(self, bunker_payload: Dict[str, Any]) -> Dict[str, Any]:
        b_clean = dict(bunker_payload)
        v_id = (b_clean.get("vessel_id") or "").strip().upper()
        p_ifo = b_clean.get("price_ifo") or b_clean.get("ifo_price", 0)
        p_mdo = b_clean.get("price_mdo") or b_clean.get("mdo_price", 0)

        if isinstance(p_ifo, str) or isinstance(p_mdo, str):
            raise TypeError("TYPE_ERROR: Los precios de bunker deben ser numéricos.")
        if p_ifo <= 0 or p_mdo <= 0:
            raise ValueError("VALUE_ERROR: Los precios de bunker deben ser mayores a 0.")

        b_clean["vessel_id"] = v_id
        b_clean["price_ifo"] = float(p_ifo)
        b_clean["price_mdo"] = float(p_mdo)

        self.tables["bunker_prices"].append(b_clean)
        self.mutation_log.append({"table": "bunker_prices", "action": "INSERT", "key": v_id})
        return {"status": "success", "action": "INSERT", "vessel_id": v_id}

    def upsert_generic(self, table_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Upsert genérico seguro para tablas auxiliares de maestros"""
        if table_name not in self.tables:
            self.tables[table_name] = []
        clean = dict(payload)
        self.tables[table_name].append(clean)
        self.mutation_log.append({"table": table_name, "action": "INSERT", "key": str(clean.get("id") or clean.get("name") or len(self.tables[table_name]))})
        return {"status": "success", "action": "INSERT", "table": table_name}
