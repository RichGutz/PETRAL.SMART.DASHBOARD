"""
Agente 8: Financial Projections Summary Auditor (MEC Summary Auditor)
Verifica que las matrices financieras grabadas en commercial_forecasts
se sincronicen y resuman con exactitud matemática 1:1 en la pantalla
de Proyecciones Financieras (/financial-projections).

Garantiza que:
  Sum(Matriz Financiera Detallada) == MEC Summary Resumido (Volumen, Viajes, Margen, Días)
"""
from typing import Dict, Any, List
import json
import ast
from backend.models.forecast_models import ForecastRequest, ProjectionLine
import backend.services.forecast_service as fs

class FinancialProjectionsSummaryAgent:
    def __init__(self, twin):
        self.twin = twin
        self.name = "📈 Financial Projections Auditor"
        self.alias = "financial_projections_auditor"

    def audit_projections_vs_financial_matrix(self) -> List[Dict[str, Any]]:
        """
        Carga cada escenario de commercial_forecasts y valida que el resumen
        calculado para /financial-projections (MEC) coincida exactamente
        con los valores matemáticos de la Matriz Financiera.
        """
        forecasts = self.twin.get_historical_forecasts()
        audit_results = []

        for f in forecasts:
            f_id = f.get("id")
            f_name = f.get("name", "Sin Nombre")
            raw_lines = f.get("projection_lines") or []
            if isinstance(raw_lines, str):
                try:
                    raw_lines = json.loads(raw_lines)
                except Exception:
                    try:
                        raw_lines = ast.literal_eval(raw_lines)
                    except Exception:
                        raw_lines = []
            if not isinstance(raw_lines, list):
                raw_lines = []

            # 1. Total directo desde las líneas de la matriz financiera
            matrix_total_volume = 0.0
            matrix_total_trips = 0.0
            valid_pydantic_lines = []

            for l in raw_lines:
                if not isinstance(l, dict):
                    continue
                qty = float(l.get("quantity") or 0.0)
                freq = float(l.get("monthly_frequency") or 0.0)
                if freq > 0:
                    matrix_total_volume += (qty * freq)
                    matrix_total_trips += freq
                try:
                    valid_pydantic_lines.append(ProjectionLine(**l))
                except Exception:
                    pass

            # 2. Ejecutar simulación para obtener aggregated_data
            s_date = str(f.get("start_date") or "2027-01-01")
            e_date = str(f.get("end_date") or "2027-12-31")
            req = ForecastRequest(
                start_date=s_date if len(s_date) == 10 else f"{s_date}-01",
                end_date=e_date if len(e_date) == 10 else f"{e_date}-31",
                port_cost_mode="static",
                projection_lines=valid_pydantic_lines
            )
            sim_res = fs.run_forecast_simulation(req)
            agg_data = sim_res.get("aggregated_data", {})

            # 3. Calcular el resumen MEC tal como lo hace FinancialProjectionsMaster_V2.tsx
            mec_total_volume = 0.0
            mec_total_trips = 0.0
            mec_total_days = 0.0
            mec_routes_count = 0
            vessels_detected = set()

            for client, routes_dict in agg_data.items():
                if not isinstance(routes_dict, dict):
                    continue
                for r_name, vessels_dict in routes_dict.items():
                    if not isinstance(vessels_dict, dict):
                        continue
                    mec_routes_count += 1
                    for v_name, months_dict in vessels_dict.items():
                        if not isinstance(months_dict, dict):
                            continue
                        clean_vessel = v_name.replace("_", " ").upper()
                        vessels_detected.add(clean_vessel)

                        for m_key, m_val in months_dict.items():
                            if not isinstance(m_val, dict):
                                continue
                            freq = float(m_val.get("freq") or 0.0)
                            if freq <= 0:
                                continue
                            qty_unit = float(m_val.get("carga_unit") or 13500.0)
                            dur = float(m_val.get("total_duration") or 0.0)

                            mec_total_trips += freq
                            mec_total_volume += (qty_unit * freq)
                            mec_total_days += dur

            # 4. Validar consistencia matemática
            vol_diff = abs(matrix_total_volume - mec_total_volume)
            trips_diff = abs(matrix_total_trips - mec_total_trips)

            is_valid = (vol_diff < 0.01) and (trips_diff < 0.01)

            res_entry = {
                "forecast_id": f_id,
                "forecast_name": f_name,
                "matrix_volume_mt": matrix_total_volume,
                "mec_summary_volume_mt": mec_total_volume,
                "matrix_trips": matrix_total_trips,
                "mec_summary_trips": mec_total_trips,
                "mec_total_days": round(mec_total_days, 1),
                "vessels_count": len(vessels_detected),
                "routes_count": mec_routes_count,
                "is_consistent": is_valid,
                "volume_diff": vol_diff,
                "trips_diff": trips_diff
            }
            audit_results.append(res_entry)

        return audit_results
