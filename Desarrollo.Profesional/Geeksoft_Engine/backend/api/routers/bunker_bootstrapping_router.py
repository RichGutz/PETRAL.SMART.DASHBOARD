"""
==============================================================================
Router de Búnker con Bootstrapping, Multifactura y Promedio Ponderado
PETRAL ONE - Enterprise Shipping Soft
==============================================================================
"""

import os
import io
import re
import json
import base64
import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse, FileResponse, Response
from pydantic import BaseModel

try:
    from backend.database import get_db_connection
    from backend.services.bunker_pdf_parser_service import BunkerPdfParserService
except ImportError:
    from database import get_db_connection
    from services.bunker_pdf_parser_service import BunkerPdfParserService

router = APIRouter(prefix="/bunker-bootstrapping", tags=["Bunker Bootstrapping"])

# Determinación robusta de directorio de almacenamiento
# Si existe /opt/petral_stack/storage/bunker_invoices/ (VPS Host), se usa preferentemente
STORAGE_DIR = os.getenv("BUNKER_STORAGE_DIR")
if not STORAGE_DIR:
    if os.path.exists("/opt/petral_stack/storage"):
        STORAGE_DIR = "/opt/petral_stack/storage/bunker_invoices"
    else:
        # Fallback local
        _base_backend = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        STORAGE_DIR = os.path.join(_base_backend, "storage", "bunker_invoices")

os.makedirs(STORAGE_DIR, exist_ok=True)


class BootstrapPayload(BaseModel):
    vessel_id: str
    event_date: str
    port_id: Optional[str] = "CALLAO"
    voyage_number: Optional[str] = None
    rob_ifo_mt: float
    price_prev_ifo_usd: float
    rob_mdo_mt: Optional[float] = 0.0
    price_prev_mdo_usd: Optional[float] = 0.0
    notes: Optional[str] = "Asiento de apertura de buque (Bootstrapping)"
    created_by: Optional[str] = "admin@petral.com"


class InvoiceItemPayload(BaseModel):
    invoice_number: str
    supplier: str
    supplier_ruc: Optional[str] = None
    issue_date: str
    vessel_id: str
    fuel_type: str  # 'IFO' o 'MDO'
    quantity_mt: float
    unit_price_usd: float
    total_amount_usd: float
    pdf_filename: Optional[str] = None
    pdf_raw_base64: Optional[str] = None
    parsed_metadata: Optional[dict] = None


class BunkeringEventPayload(BaseModel):
    vessel_id: str
    event_date: str
    port_id: Optional[str] = "CALLAO"
    voyage_number: Optional[str] = None
    rob_ifo_mt: float
    price_prev_ifo_usd: float
    rob_mdo_mt: Optional[float] = 0.0
    price_prev_mdo_usd: Optional[float] = 0.0
    notes: Optional[str] = None
    created_by: Optional[str] = "admin@petral.com"
    invoices: List[InvoiceItemPayload] = []


def get_vessel_fuel_capability(cur, vessel_id: str) -> dict:
    """
    Consulta en la tabla 'vessels' de PostgreSQL para saber qué consume el buque
    según su ficha técnica de flota.
    """
    clean_id = (vessel_id or "").upper().strip()
    cur.execute("""
        SELECT vessel_id, vessel_name, max_capacity_ifo, max_capacity_mdo, 
               consumption_sea_ifo, consumption_sea_mdo
        FROM vessels 
        WHERE UPPER(vessel_id) = %s
    """, (clean_id,))
    row = cur.fetchone()
    if not row:
        # Si no se encuentra exactamente, buscar por LIKE
        cur.execute("""
            SELECT vessel_id, vessel_name, max_capacity_ifo, max_capacity_mdo, 
                   consumption_sea_ifo, consumption_sea_mdo
            FROM vessels 
            WHERE UPPER(vessel_name) LIKE %s OR UPPER(vessel_id) LIKE %s
            LIMIT 1
        """, (f"%{clean_id}%", f"%{clean_id}%"))
        row = cur.fetchone()

    if not row:
        return {
            "vessel_id": clean_id,
            "vessel_name": clean_id,
            "supports_ifo": True,
            "supports_mdo": False,
            "fuels": ["IFO"]
        }

    mdo_cap = float(row[3] or 0)
    mdo_cons = float(row[5] or 0)
    supports_mdo = (mdo_cap > 0 or mdo_cons > 0)
    return {
        "vessel_id": row[0],
        "vessel_name": row[1],
        "max_capacity_ifo": float(row[2] or 0),
        "max_capacity_mdo": mdo_cap,
        "supports_ifo": True,
        "supports_mdo": supports_mdo,
        "fuels": ["IFO", "MDO"] if supports_mdo else ["IFO"]
    }


def calculate_baf_spcc(ifo_avg: float, mdo_avg: float, ifo_prev: float = 967.26, mdo_prev: float = 1528.26, supports_mdo: bool = True) -> dict:
    """
    Fórmula Contractual SPCC STM-PET-001-2025:
    Rotación redonda BT MOQUEGUA: 38.40 TM IFO + 9.50 TM MDO (si dual-fuel)
    Si la nave es solo IFO (como HUEMUL o CONCON TRADER), se pondera solo IFO.
    """
    import math
    c10 = ifo_prev if ifo_prev > 0 else 967.26
    c11 = mdo_prev if mdo_prev > 0 else 1528.26

    if supports_mdo:
        denom = (c10 * 38.40) + (c11 * 9.50)
        numer = (ifo_avg * 38.40) + (mdo_avg * 9.50)
    else:
        denom = (c10 * 38.40)
        numer = (ifo_avg * 38.40)

    raw_factor = numer / denom if denom > 0 else 1.0

    factor_baf = math.ceil(raw_factor * 10000.0) / 10000.0
    initial_fuel_val = 4.1700
    new_baf = round(factor_baf * initial_fuel_val, 6)
    variation = round(new_baf - initial_fuel_val, 4)

    return {
        "spcc_baf_factor": factor_baf,
        "spcc_initial_fuel_value": initial_fuel_val,
        "spcc_new_baf": round(new_baf, 4),
        "spcc_baf_variation": variation
    }


@router.post("/parse-pdf")
async def parse_bunker_pdf(file: UploadFile = File(...)):
    """Extrae datos de la factura con BunkerPdfParserService sin guardar en BD"""
    try:
        contents = await file.read()
        parsed = BunkerPdfParserService.parse_pdf(contents, file.filename)
        # Convertir bytes a base64 temporal para el frontend
        parsed["temp_base64"] = base64.b64encode(contents).decode("utf-8")
        return {"status": "success", "data": parsed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parseando factura PDF: {str(e)}")


@router.get("/vessel-fuel-profile/{vessel_id}")
def get_vessel_fuel_profile(vessel_id: str):
    """Consulta la ficha técnica de la flota en PostgreSQL para retornar capacidades y consumos reales"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        profile = get_vessel_fuel_capability(cur, vessel_id)
        return {"status": "success", "data": profile}
    finally:
        cur.close()
        conn.close()


@router.post("/bootstrap-vessel")
def bootstrap_vessel(payload: BootstrapPayload):
    """Establece la Condición Inicial (Génesis) para un buque correlacionado con su ficha de flota"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        event_id = str(uuid.uuid4())
        
        # 1. Consultar ficha de flota en PostgreSQL
        fuel_cap = get_vessel_fuel_capability(cur, payload.vessel_id)
        supports_mdo = fuel_cap["supports_mdo"]

        # Si el buque solo consume IFO, forzar MDO a 0.0 contable
        rob_mdo = float(payload.rob_mdo_mt or 0.0) if supports_mdo else 0.0
        price_mdo = float(payload.price_prev_mdo_usd or 0.0) if supports_mdo else 0.0

        # Calcular BAF contractual de referencia adaptado
        baf = calculate_baf_spcc(
            payload.price_prev_ifo_usd, 
            price_mdo, 
            supports_mdo=supports_mdo
        )

        insert_sql = """
            INSERT INTO bunker_bunkering_events (
                id, event_date, vessel_id, port_id, voyage_number, is_bootstrap,
                rob_ifo_mt, price_prev_ifo_usd, purchased_ifo_mt, purchased_ifo_total_usd, weighted_avg_ifo_usd,
                rob_mdo_mt, price_prev_mdo_usd, purchased_mdo_mt, purchased_mdo_total_usd, weighted_avg_mdo_usd,
                spcc_baf_factor, spcc_initial_fuel_value, spcc_new_baf, spcc_baf_variation,
                notes, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, TRUE,
                %s, %s, 0, 0, %s,
                %s, %s, 0, 0, %s,
                %s, %s, %s, %s,
                %s, %s
            ) RETURNING *;
        """
        cur.execute(insert_sql, (
            event_id, payload.event_date, fuel_cap["vessel_id"], payload.port_id, payload.voyage_number,
            payload.rob_ifo_mt, payload.price_prev_ifo_usd, payload.price_prev_ifo_usd,
            rob_mdo, price_mdo, price_mdo,
            baf["spcc_baf_factor"], baf["spcc_initial_fuel_value"], baf["spcc_new_baf"], baf["spcc_baf_variation"],
            payload.notes, payload.created_by
        ))
        row = cur.fetchone()

        # Actualizar tabla bunker_prices para que los multicotizadores tomen este precio de inmediato
        if supports_mdo:
            cur.execute("DELETE FROM bunker_prices WHERE fuel_type IN ('IFO', 'MDO');")
            cur.execute(
                "INSERT INTO bunker_prices (fuel_type, market_price_usd, date) VALUES ('IFO', %s, %s), ('MDO', %s, %s);",
                (payload.price_prev_ifo_usd, payload.event_date, price_mdo, payload.event_date)
            )
        else:
            cur.execute("DELETE FROM bunker_prices WHERE fuel_type = 'IFO';")
            cur.execute(
                "INSERT INTO bunker_prices (fuel_type, market_price_usd, date) VALUES ('IFO', %s, %s);",
                (payload.price_prev_ifo_usd, payload.event_date)
            )

        conn.commit()
        return {"status": "success", "event_id": event_id, "message": f"Buque {fuel_cap['vessel_name']} inicializado con éxito (Perfil: {', '.join(fuel_cap['fuels'])})"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error en bootstrap: {str(e)}")
    finally:
        cur.close()
        conn.close()


@router.post("/record-bunkering-event")
def record_bunkering_event(payload: BunkeringEventPayload):
    """
    Registra un tanqueo completo (ROB previo + N facturas) y calcula el precio promedio ponderado
    respetando la ficha de flota del buque.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        event_id = str(uuid.uuid4())

        # Consultar ficha de flota para saber qué consume el buque
        fuel_cap = get_vessel_fuel_capability(cur, payload.vessel_id)
        supports_mdo = fuel_cap["supports_mdo"]

        # 1. Agrupar facturas por combustible
        ifo_invoices = [inv for inv in payload.invoices if inv.fuel_type.upper() == "IFO"]
        mdo_invoices = [inv for inv in payload.invoices if inv.fuel_type.upper() in ["MDO", "MGO"]] if supports_mdo else []

        # 2. Sumatoria compras IFO
        purchased_ifo_mt = sum(inv.quantity_mt for inv in ifo_invoices)
        purchased_ifo_total_usd = sum(inv.total_amount_usd for inv in ifo_invoices)

        # 3. Sumatoria compras MDO
        purchased_mdo_mt = sum(inv.quantity_mt for inv in mdo_invoices) if supports_mdo else 0.0
        purchased_mdo_total_usd = sum(inv.total_amount_usd for inv in mdo_invoices) if supports_mdo else 0.0

        # 4. Cálculo Ponderado IFO
        total_ifo_mt = payload.rob_ifo_mt + purchased_ifo_mt
        cost_prev_ifo = payload.rob_ifo_mt * payload.price_prev_ifo_usd
        total_cost_ifo = cost_prev_ifo + purchased_ifo_total_usd
        weighted_avg_ifo = round(total_cost_ifo / total_ifo_mt, 4) if total_ifo_mt > 0 else payload.price_prev_ifo_usd

        # 5. Cálculo Ponderado MDO
        if supports_mdo:
            rob_mdo = payload.rob_mdo_mt or 0.0
            price_prev_mdo = payload.price_prev_mdo_usd or 0.0
            total_mdo_mt = rob_mdo + purchased_mdo_mt
            cost_prev_mdo = rob_mdo * price_prev_mdo
            total_cost_mdo = cost_prev_mdo + purchased_mdo_total_usd
            weighted_avg_mdo = round(total_cost_mdo / total_mdo_mt, 4) if total_mdo_mt > 0 else price_prev_mdo
        else:
            rob_mdo = 0.0
            price_prev_mdo = 0.0
            weighted_avg_mdo = 0.0

        # 6. Cálculo BAF SPCC
        baf = calculate_baf_spcc(weighted_avg_ifo, weighted_avg_mdo, payload.price_prev_ifo_usd, price_prev_mdo, supports_mdo=supports_mdo)

        # 7. Insertar Evento en BD
        insert_event_sql = """
            INSERT INTO bunker_bunkering_events (
                id, event_date, vessel_id, port_id, voyage_number, is_bootstrap,
                rob_ifo_mt, price_prev_ifo_usd, purchased_ifo_mt, purchased_ifo_total_usd, weighted_avg_ifo_usd,
                rob_mdo_mt, price_prev_mdo_usd, purchased_mdo_mt, purchased_mdo_total_usd, weighted_avg_mdo_usd,
                spcc_baf_factor, spcc_initial_fuel_value, spcc_new_baf, spcc_baf_variation,
                notes, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, FALSE,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s
            );
        """
        cur.execute(insert_event_sql, (
            event_id, payload.event_date, fuel_cap["vessel_id"], payload.port_id, payload.voyage_number,
            payload.rob_ifo_mt, payload.price_prev_ifo_usd, purchased_ifo_mt, purchased_ifo_total_usd, weighted_avg_ifo,
            rob_mdo, price_prev_mdo, purchased_mdo_mt, purchased_mdo_total_usd, weighted_avg_mdo,
            baf["spcc_baf_factor"], baf["spcc_initial_fuel_value"], baf["spcc_new_baf"], baf["spcc_baf_variation"],
            payload.notes, payload.created_by
        ))

        # 8. Guardar facturas e inyectar archivos a disco y base64 en PostgreSQL
        insert_inv_sql = """
            INSERT INTO bunker_invoices (
                id, event_id, invoice_number, supplier, supplier_ruc, issue_date,
                vessel_id, fuel_type, quantity_mt, unit_price_usd, total_amount_usd,
                pdf_filename, pdf_storage_path, pdf_raw_base64, parsed_metadata, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s
            );
        """

        for inv in payload.invoices:
            inv_id = str(uuid.uuid4())
            storage_path = None

            # Persistencia física en disco
            if inv.pdf_raw_base64:
                try:
                    pdf_bytes = base64.b64decode(inv.pdf_raw_base64)
                    clean_inv_num = re.sub(r'[^A-Za-z0-9_-]', '_', inv.invoice_number)
                    disk_filename = f"{payload.vessel_id}_{clean_inv_num}_{int(datetime.datetime.now().timestamp())}.pdf"
                    storage_path = os.path.join(STORAGE_DIR, disk_filename)
                    with open(storage_path, "wb") as f_out:
                        f_out.write(pdf_bytes)
                except Exception as disk_err:
                    print(f"Advertencia guardando en disco {disk_err}")

            # Homologación estricta MGO -> MDO
            homologated_fuel = "MDO" if inv.fuel_type.upper() in ["MGO", "MDO"] else "IFO"

            cur.execute(insert_inv_sql, (
                inv_id, event_id, inv.invoice_number, inv.supplier, inv.supplier_ruc, inv.issue_date,
                payload.vessel_id, homologated_fuel, inv.quantity_mt, inv.unit_price_usd, inv.total_amount_usd,
                inv.pdf_filename, storage_path, inv.pdf_raw_base64, json.dumps(inv.parsed_metadata or {}),
                payload.created_by
            ))

        # 9. Actualizar bunker_prices con los nuevos promedios ponderados
        cur.execute("DELETE FROM bunker_prices WHERE fuel_type IN ('IFO', 'MDO');")
        cur.execute(
            "INSERT INTO bunker_prices (fuel_type, market_price_usd, date) VALUES ('IFO', %s, %s), ('MDO', %s, %s);",
            (weighted_avg_ifo, payload.event_date, weighted_avg_mdo, payload.event_date)
        )

        conn.commit()
        return {
            "status": "success",
            "event_id": event_id,
            "weighted_avg_ifo_usd": weighted_avg_ifo,
            "weighted_avg_mdo_usd": weighted_avg_mdo,
            "baf": baf,
            "message": "Tanqueo registrado y promedios ponderados calculados exitosamente"
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error registrando tanqueo: {str(e)}")
    finally:
        cur.close()
        conn.close()


@router.get("/events/{vessel_id}")
def get_vessel_events(vessel_id: str):
    """Devuelve la cronología encadenada de eventos de tanqueo y sus facturas asociadas"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        filter_sql = ""
        params = []
        if vessel_id.upper() != "TODOS":
            filter_sql = "WHERE e.vessel_id = %s"
            params.append(vessel_id.upper())

        events_sql = f"""
            SELECT 
                e.id, e.event_date, e.vessel_id, e.port_id, e.voyage_number, e.is_bootstrap,
                e.rob_ifo_mt, e.price_prev_ifo_usd, e.purchased_ifo_mt, e.purchased_ifo_total_usd, e.weighted_avg_ifo_usd,
                e.rob_mdo_mt, e.price_prev_mdo_usd, e.purchased_mdo_mt, e.purchased_mdo_total_usd, e.weighted_avg_mdo_usd,
                e.spcc_baf_factor, e.spcc_initial_fuel_value, e.spcc_new_baf, e.spcc_baf_variation,
                e.notes, e.created_at, e.created_by
            FROM bunker_bunkering_events e
            {filter_sql}
            ORDER BY e.event_date DESC, e.created_at DESC;
        """
        cur.execute(events_sql, params)
        columns = [desc[0] for desc in cur.description]
        events = [dict(zip(columns, row)) for row in cur.fetchall()]

        # Obtener facturas para cada evento
        for ev in events:
            # Serializar fechas y floats
            if isinstance(ev.get("event_date"), datetime.date):
                ev["event_date"] = ev["event_date"].isoformat()
            if isinstance(ev.get("created_at"), datetime.datetime):
                ev["created_at"] = ev["created_at"].isoformat()

            cur.execute("""
                SELECT id, invoice_number, supplier, supplier_ruc, issue_date,
                       vessel_id, fuel_type, quantity_mt, unit_price_usd, total_amount_usd,
                       pdf_filename, (pdf_storage_path IS NOT NULL OR pdf_raw_base64 IS NOT NULL) as has_pdf
                FROM bunker_invoices
                WHERE event_id = %s
                ORDER BY issue_date ASC;
            """, (ev["id"],))
            inv_cols = [desc[0] for desc in cur.description]
            invoices = [dict(zip(inv_cols, r)) for r in cur.fetchall()]
            for inv in invoices:
                if isinstance(inv.get("issue_date"), datetime.date):
                    inv["issue_date"] = inv["issue_date"].isoformat()
            ev["invoices"] = invoices

        return {"status": "success", "data": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo eventos: {str(e)}")
    finally:
        cur.close()
        conn.close()


@router.get("/invoices/{vessel_id}")
def get_vessel_invoices(vessel_id: str):
    """Devuelve el repositorio de facturas con trazabilidad"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        filter_sql = ""
        params = []
        if vessel_id.upper() != "TODOS":
            filter_sql = "WHERE i.vessel_id = %s"
            params.append(vessel_id.upper())

        sql = f"""
            SELECT 
                i.id, i.event_id, i.invoice_number, i.supplier, i.supplier_ruc, i.issue_date,
                i.vessel_id, i.fuel_type, i.quantity_mt, i.unit_price_usd, i.total_amount_usd,
                i.pdf_filename, (i.pdf_storage_path IS NOT NULL OR i.pdf_raw_base64 IS NOT NULL) as has_pdf,
                i.created_at, e.voyage_number
            FROM bunker_invoices i
            LEFT JOIN bunker_bunkering_events e ON e.id = i.event_id
            {filter_sql}
            ORDER BY i.issue_date DESC;
        """
        cur.execute(sql, params)
        cols = [desc[0] for desc in cur.description]
        invoices = [dict(zip(cols, row)) for row in cur.fetchall()]
        for inv in invoices:
            if isinstance(inv.get("issue_date"), datetime.date):
                inv["issue_date"] = inv["issue_date"].isoformat()
            if isinstance(inv.get("created_at"), datetime.datetime):
                inv["created_at"] = inv["created_at"].isoformat()
        return {"status": "success", "data": invoices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo facturas: {str(e)}")
    finally:
        cur.close()
        conn.close()


@router.get("/invoice/{invoice_id}/pdf")
def stream_invoice_pdf(invoice_id: str):
    """
    Sirve el archivo PDF original por streaming.
    Prioridad 1: Lee desde STORAGE_DIR en disco.
    Prioridad 2 (Fail-Safe): Decodifica pdf_raw_base64 desde la BD y reconstruye la caché en disco.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT pdf_filename, pdf_storage_path, pdf_raw_base64
            FROM bunker_invoices
            WHERE id = %s;
        """, (invoice_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Factura no encontrada")

        pdf_filename, pdf_storage_path, pdf_raw_base64 = row
        out_filename = pdf_filename or f"factura_{invoice_id}.pdf"

        # 1. Verificar si existe en disco
        if pdf_storage_path and os.path.exists(pdf_storage_path):
            return FileResponse(
                path=pdf_storage_path,
                media_type="application/pdf",
                content_disposition_type="inline",
                filename=out_filename,
                headers={
                    "Content-Disposition": f'inline; filename="{out_filename}"',
                    "Accept-Ranges": "bytes"
                }
            )

        # 2. Respaldo desde base64 en base de datos
        if pdf_raw_base64:
            pdf_bytes = base64.b64decode(pdf_raw_base64)
            # Reconstruir en disco si es posible
            if pdf_storage_path:
                try:
                    os.makedirs(os.path.dirname(pdf_storage_path), exist_ok=True)
                    with open(pdf_storage_path, "wb") as f_reconstruct:
                        f_reconstruct.write(pdf_bytes)
                except Exception:
                    pass
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'inline; filename="{out_filename}"',
                    "Accept-Ranges": "bytes"
                }
            )

        raise HTTPException(status_code=404, detail="El archivo PDF no está disponible en disco ni en base de datos")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sirviendo PDF: {str(e)}")
    finally:
        cur.close()
        conn.close()


@router.delete("/event/{event_id}")
def delete_bunkering_event(event_id: str, deleted_by: str = "admin@petral.com"):
    """Elimina un evento de tanqueo y respalda snapshot en commercial_trash_bin"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 1. Obtener snapshot para papelera
        cur.execute("SELECT * FROM bunker_bunkering_events WHERE id = %s;", (event_id,))
        event_row = cur.fetchone()
        if not event_row:
            raise HTTPException(status_code=404, detail="Evento de tanqueo no encontrado")

        cur.execute("SELECT * FROM bunker_invoices WHERE event_id = %s;", (event_id,))
        invoices_rows = cur.fetchall()

        trash_payload = {
            "event": [str(x) if isinstance(x, (datetime.date, datetime.datetime, uuid.UUID)) else x for x in event_row],
            "invoices_count": len(invoices_rows)
        }

        # Guardar en papelera
        cur.execute("""
            INSERT INTO commercial_trash_bin (
                entity_type, entity_id, source_table, document_name, client_name, vessel_id, payload, deleted_by
            ) VALUES (
                'BUNKER_EVENT', %s, 'bunker_bunkering_events', %s, 'PETRAL', %s, %s, %s
            );
        """, (
            event_id,
            f"Tanqueo {event_row[2]} ({event_row[1]})",
            event_row[2], # vessel_id
            json.dumps(trash_payload),
            deleted_by
        ))

        # Borrar en cascada (invoices se borran por FK ON DELETE CASCADE)
        cur.execute("DELETE FROM bunker_bunkering_events WHERE id = %s;", (event_id,))
        conn.commit()

        return {"status": "success", "message": f"Evento {event_id} eliminado y respaldado en papelera"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error eliminando evento: {str(e)}")
    finally:
        cur.close()
        conn.close()
