import sys
sys.path.insert(0, r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Engine")

from backend.database import get_supabase
from backend.services.forecast_service import run_forecast_simulation
from backend.models.forecast_models import ForecastRequest, ProjectionLine
import json

def run_qc_battery():
    print("=" * 80)
    print("QC BATERIA PERICIAL BENOIT BLANC: CEROS ALTERNADOS & CARGA DE ESCENARIOS")
    print("=" * 80)
    
    # ---------------------------------------------------------
    # TEST 1: ESCENARIO REAL SUPABASE: PB 2027 (Jose de los Heros) + Prom Dem
    # ---------------------------------------------------------
    print("\n[TEST 1] Verificacion de Carga Real: PB 2027 (Jose de los Heros) + Prom Dem")
    sb = get_supabase()
    res = sb.table("commercial_forecasts").select("*").eq("id", "57f506fd-6da4-44c0-92c8-2b9d5644fb6e").execute()
    assert len(res.data) > 0, "Escenario no encontrado en Supabase"
    row = res.data[0]
    raw_lines = row.get("projection_lines") or []
    
    # Aplicar el deserializador sanitizado del Frontend:
    frontend_deserialized_lines = []
    for l in raw_lines:
        freq_val = l.get("monthly_frequency")
        safe_freq = float(freq_val) if (freq_val is not None and str(freq_val).replace('.','',1).isdigit()) else 0.0
        frontend_deserialized_lines.append(ProjectionLine(
            client_id=l["client_id"],
            origin_port_id=l["origin_port_id"],
            destination_port_id=l["destination_port_id"],
            vessel_id=l["vessel_id"],
            month_index=l["month_index"],
            quantity=float(l.get("quantity", 13500)),
            monthly_frequency=safe_freq,
            custom_tariff=float(l["custom_tariff"]) if l.get("custom_tariff") is not None else None,
            quote_id=l.get("quote_id")
        ))
    
    req1 = ForecastRequest(
        start_date=row.get("start_date", "2027-01-01"),
        end_date=row.get("end_date", "2027-12-31"),
        projection_lines=frontend_deserialized_lines
    )
    sim1 = run_forecast_simulation(req1)
    agg1 = sim1.get("aggregated_data", {})
    
    spcc_moquegua_marcona = agg1.get("SPCC", {}).get("ILO-MARCONA", {}).get("MOQUEGUA", {})
    trips_by_month = {}
    for m, mData in sorted(spcc_moquegua_marcona.items()):
        f = mData.get("freq", 0)
        rev = mData.get("gross_income", 0)
        dur = mData.get("total_duration", 0)
        trips_by_month[m] = (f, rev, dur)
        print(f"  -> {m}: Freq={f} viajes | Ingreso=${rev:,.2f} | Dias={dur:.2f}d")
    
    total_spcc_marcona = sum(f for f, _, _ in trips_by_month.values())
    print(f"  TOTAL VIAJES ILO-MARCONA (MOQUEGUA): {total_spcc_marcona}")
    assert total_spcc_marcona == 7, f"ERROR: Esperaba 7 viajes pero se obtuvieron {total_spcc_marcona}"
    
    # Validar que los meses 08 a 12 son estrictamente 0
    for zero_m in ["2027-08", "2027-09", "2027-10", "2027-11", "2027-12"]:
        assert trips_by_month[zero_m][0] == 0, f"Mes {zero_m} debio tener frecuencia 0"
        assert trips_by_month[zero_m][1] == 0.0, f"Mes {zero_m} debio tener ingreso $0.00"
        assert trips_by_month[zero_m][2] == 0.0, f"Mes {zero_m} debio tener dias 0.00"
    print("  [OK] TEST 1 PASADO: 7 meses activos (Ene-Jul) y 5 meses en Cero absoluto (Ago-Dic).")

    # ---------------------------------------------------------
    # TEST 2: ESCENARIO SINTETICO DE CEROS ALTERNADOS EN 12 MESES
    # ---------------------------------------------------------
    print("\n[TEST 2] Verificacion de Vector de Ceros Alternados (12 Meses: 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0)")
    alternated_pattern = {
        "2027-01": 1, "2027-02": 0, "2027-03": 2, "2027-04": 0,
        "2027-05": 1, "2027-06": 0, "2027-07": 3, "2027-08": 0,
        "2027-09": 1, "2027-10": 0, "2027-11": 2, "2027-12": 0
    }
    expected_sum_trips = sum(alternated_pattern.values()) # 1+0+2+0+1+0+3+0+1+0+2+0 = 10 viajes
    
    test_lines = []
    for m, freq in alternated_pattern.items():
        test_lines.append(ProjectionLine(
            client_id="SPCC",
            origin_port_id="ILO",
            destination_port_id="MATARANI",
            vessel_id="TABLONES",
            month_index=m,
            quantity=13500,
            monthly_frequency=freq,
            custom_tariff=19.29
        ))
        
    req2 = ForecastRequest(
        start_date="2027-01-01",
        end_date="2027-12-31",
        projection_lines=test_lines
    )
    sim2 = run_forecast_simulation(req2)
    agg2 = sim2.get("aggregated_data", {}).get("SPCC", {}).get("ILO-MATARANI", {}).get("TABLONES", {})
    
    calculated_trips = 0
    for m, expected_freq in alternated_pattern.items():
        mData = agg2.get(m, {})
        f = mData.get("freq", 0)
        rev = mData.get("gross_income", 0)
        bunk = mData.get("total_bunker_costs", 0)
        ports = mData.get("total_port_costs", 0)
        pnl = mData.get("voyage_result", 0)
        dur = mData.get("total_duration", 0)
        calculated_trips += f
        
        print(f"  -> Mes {m}: Freq={f} (Esp:{expected_freq}) | Rev=${rev:,.2f} | Bunker=${bunk:,.2f} | Pto=${ports:,.2f} | PnL=${pnl:,.2f} | Dur={dur:.2f}d")
        
        assert f == expected_freq, f"Frecuencia incorrecta en {m}: obtenida {f}, esperada {expected_freq}"
        if expected_freq == 0:
            assert rev == 0.0, f"Rev debe ser 0 en {m}"
            assert bunk == 0.0, f"Bunker debe ser 0 en {m}"
            assert ports == 0.0, f"Port costs debe ser 0 en {m}"
            assert pnl == 0.0, f"PnL debe ser 0 en {m}"
            assert dur == 0.0, f"Duration debe ser 0 en {m}"
        else:
            unit_rev = rev / f
            assert abs(unit_rev - (13500 * 19.29)) < 0.01, f"Flete unitario descalzado en {m}"
            
    print(f"  TOTAL VIAJES CALCULADOS: {calculated_trips} (Esperado: {expected_sum_trips})")
    assert calculated_trips == expected_sum_trips, "Descalce en suma de viajes alternados"
    print("  [OK] TEST 2 PASADO: Vector alternado de 12 meses calcula con exactitud lineal y ceros puros.")
    
    print("\n" + "=" * 80)
    print("RESULTADO FINAL: TODOS LOS TESTS DE QC PASADOS CON EXITO (100% CONVERGENCIA)")
    print("=" * 80)

if __name__ == "__main__":
    run_qc_battery()
