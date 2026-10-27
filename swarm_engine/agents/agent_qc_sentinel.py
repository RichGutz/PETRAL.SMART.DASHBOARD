"""
Agente 7: QC Sentinel & Self-Healing Looper (Benoit Blanc)
Audita el 100% de las simulaciones generadas por los 6 agentes en tiempo real.
Verifica invariantes matematicos, detecta advertencias de tipo y gobierna
el semaforo verde para pre-produccion.
"""
from typing import Dict, Any, List

class QcSentinelAgent:
    def __init__(self):
        self.name = "🕵️ QC Sentinel (Benoit Blanc)"
        self.alias = "qc_sentinel"
        self.violations: List[Dict[str, Any]] = []
        self.total_checked = 0
        self.passed_count = 0

    def audit_simulation_result(self, agent_name: str, payload_lines: List[Dict[str, Any]], result_data: Dict[str, Any]) -> bool:
        """
        Audita el resultado de una corrida de simulacion aplicando la rubrica ABIDE.
        """
        agg = result_data.get("aggregated_data", {})
        if not agg:
            self.violations.append({
                "agent": agent_name,
                "rule": "INVARIANT_EMPTY_SIMULATION",
                "detail": "El motor no devolvio aggregated_data"
            })
            return False

        all_ok = True
        for client, routes in agg.items():
            for route_name, vessels in routes.items():
                for vessel_id, months in vessels.items():
                    for month, m_data in months.items():
                        self.total_checked += 1
                        
                        freq = float(m_data.get("freq", 1.0))
                        duration = m_data.get("total_duration", 0.0)
                        duration_unit = m_data.get("total_duration_unit", 0.0)
                        
                        # 1. Invariante de Duracion segun Frecuencia
                        if freq == 0:
                            # Frecuencia cero: obligatoriamente no hay dias de viaje
                            if duration != 0.0:
                                self.violations.append({
                                    "agent": agent_name,
                                    "rule": "INVARIANT_ZERO_FREQ_ZERO_DURATION",
                                    "detail": f"Frecuencia cero pero duracion no nula ({duration}) en {vessel_id} ({month})"
                                })
                                all_ok = False
                            else:
                                self.passed_count += 1
                        else:
                            # Frecuencia > 0: duracion unitaria y total deben ser estrictamente positivas
                            if duration is None or duration <= 0:
                                self.violations.append({
                                    "agent": agent_name,
                                    "rule": "INVARIANT_POSITIVE_DURATION",
                                    "detail": f"Duracion invalida ({duration}) con freq={freq} en {vessel_id} {route_name} ({month})"
                                })
                                all_ok = False
                                continue
                            else:
                                self.passed_count += 1

                        # 2. Invariante de PnL vs Requerido y Consistencia Unitaria vs Mensual
                        if freq > 0 and duration > 0:
                            voyage_res = float(m_data.get("voyage_result", 0.0))
                            pl_calc = float(m_data.get("pl_vs_required", 0.0))
                            voyage_res_unit = float(m_data.get("voyage_result_unit", 0.0))
                            pl_calc_unit = float(m_data.get("pl_vs_required_unit", 0.0))
                            dur_unit = float(m_data.get("total_duration_unit", 0.0))
                            
                            # Consistencia unitaria x frecuencia
                            expected_monthly_pnl = round(pl_calc_unit * freq, 2)
                            if abs(pl_calc - expected_monthly_pnl) > 0.05:
                                self.violations.append({
                                    "agent": agent_name,
                                    "rule": "INVARIANT_MONTHLY_UNIT_CONSISTENCY",
                                    "detail": f"Descalce PnL mensual vs unitario ({pl_calc} vs {expected_monthly_pnl}) en {vessel_id} {month}"
                                })
                                all_ok = False
                            else:
                                self.passed_count += 1

                            # Validacion del TCE Implicito (Costo Diario de la Nave)
                            if dur_unit > 0:
                                tce_cost_unit = voyage_res_unit - pl_calc_unit
                                tce_implied_rate = tce_cost_unit / dur_unit
                                if not (5000.0 <= tce_implied_rate <= 35000.0):
                                    self.violations.append({
                                        "agent": agent_name,
                                        "rule": "INVARIANT_TCE_RATE_OUT_OF_BOUNDS",
                                        "detail": f"TCE diario fuera de rango comercial (${tce_implied_rate:,.2f}/dia) en {vessel_id} {month}"
                                    })
                                    all_ok = False
                                else:
                                    self.passed_count += 1

                        # 3. Invariante Anti-String en Metricas Clave
                        for key in ["tce_real", "voyage_result", "total_bunker_costs", "total_port_costs"]:
                            val = m_data.get(key)
                            if isinstance(val, str):
                                self.violations.append({
                                    "agent": agent_name,
                                    "rule": "INVARIANT_NUMERIC_TYPE",
                                    "detail": f"Campo '{key}' devuelto como string ('{val}') en {vessel_id}"
                                })
                                all_ok = False

        return all_ok

    def get_summary(self) -> Dict[str, Any]:
        return {
            "total_checked": self.total_checked,
            "passed_count": self.passed_count,
            "violations_count": len(self.violations),
            "violations": self.violations,
            "status": "APPROVED" if len(self.violations) == 0 and self.total_checked > 0 else "REJECTED"
        }
