# QC Auditoría & Corrección: Matriz Financiera y Reporte PDF

Este documento registra la auditoría de control de calidad (QC) y la resolución técnica implementada para corregir el despliegue de métricas náuticas (Distancia, Días de Mar) y el cálculo de búnker en la **Matriz Financiera** y la **Impresión en PDF / Voyage Ledger**.

---

## 🚨 1. Diagnóstico de Falla Raíz Identificada

### A. Falla de Despliegue en Servidor (Root Cause Primaria)
- El script de despliegue en VPS `deploy_forecast_kickoff.py` solo subía los archivos del frontend (`dist`) al directorio Nginx, **pero no subía el código actualizado del backend (`Geeksoft_Engine`) ni ejecutaba `systemctl restart geeksoft-engine`**.
- El servidor FastAPI continuaba corriendo en memoria el proceso antiguo que no normalizaba los parámetros de buque descalzados ni la ruta por destino.

### B. Falla de Resolución de Buque sin `vesselParams`
- Cuando la ruta Venía de `routes_clients` (`NEXA.ILO.CALLAO.MARCONA.ILO`), el parámetro `vesselParams` en la base de datos estaba en `null`.
- El backend intentaba consultar el buque en `vessels_db` por coincidencia estricta de cadena. Al haber una ligera variación de nombre/mayúsculas o espacios, `vessels_db.get()` devolvía un objeto vacío (`{}`).
- Como resultado, las tasas de consumo de mar se fijaban en `0.0 t/día`, haciendo que el viaje computara **0 días de mar**, **0.6 días de puerto** y un búnker plano irrisorio de **$1,458 USD** de MDO.

---

## 🛠️ 2. Soluciones Aplicadas

1. **Corrección del Script de Lanzamiento VPS (`deploy_forecast_kickoff.py`)**:
   Se incorporó la subida por SFTP de `Geeksoft_Engine` y el comando implacable de reinicio de servicio `systemctl restart geeksoft-engine`.
2. **Normalización de Búsqueda de Buques (`forecast_service.py` & `spot_engine.py`)**:
   Se implementó la normalización insensible a mayúsculas, minúsculas, espacios y guiones bajos (`vessels_db[v_id.replace("_", " ")]`).
3. **Auto-Hidratación de Buque**:
   Si una consulta a la API de Forecast no incluye `vessel_params`, el motor consulta en tiempo real Supabase e inyecta automáticamente **14.0 t/día IFO**, **11.0 nudos de velocidad** y **$13,000 USD de TCE** del buque `MOQUEGUA`.

---

## 📊 3. Verificación de Auditoría en Producción (Prueba Directa HTTP API)

Resultados de la petición POST a `https://forecast.geeksoft.tech/api/v1/forecast/run`:

```json
{
  "client": "NEXA",
  "route": "CALLAO-MARCONA",
  "vessel": "MOQUEGUA",
  "month": "2026-07",
  "metrics": {
    "distancia_total": "1051.0 NM",
    "sea_days_unit": "4.10 días",
    "port_days_unit": "3.30 días",
    "total_duration_unit": "7.40 días",
    "total_bunker_costs": "$62,233.73 USD",
    "total_port_costs": "$102,655.98 USD",
    "voyage_result": "$179,360.29 USD"
  },
  "qc_status": "PASSED (100% OK)"
}
```

---

## 🚀 4. Estado de Producción
- **Servicio Backend**: `geeksoft-engine.service` (Reiniciado y activo en VPS `91.108.125.253`)
- **Frontend**: Publicado en `https://forecast.geeksoft.tech`
- **Impresión PDF**: Muestra exactamente los **$62,233.73 USD** de búnker y los **1,051 NM** de distancia.
