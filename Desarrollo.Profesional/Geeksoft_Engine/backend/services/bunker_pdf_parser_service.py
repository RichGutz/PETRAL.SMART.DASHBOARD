"""
==============================================================================
Servicio Especializado de Parseo de Facturas de Búnker PDF (PETRAL ONE)
Motor: pdfplumber + Heurística Multiemisor SUNAT + Homologación MGO -> MDO
==============================================================================
"""

import io
import re
import datetime
from typing import Dict, Any, List, Optional
import pdfplumber

KNOWN_VESSELS = [
    {"vessel_id": "MOQUEGUA", "patterns": [r"BT\s+MOQUEGUA", r"MOQUEGUA"]},
    {"vessel_id": "TABLONES", "patterns": [r"BT\s+TABLONES", r"TABLONES"]},
    {"vessel_id": "HUEMUL", "patterns": [r"HUEMUL"]},
    {"vessel_id": "CONCON", "patterns": [r"CONCON"]},
]

def detect_vessel(text: str) -> Optional[str]:
    text_upper = text.upper()
    for v in KNOWN_VESSELS:
        for pat in v["patterns"]:
            if re.search(r'\b' + pat + r'\b', text_upper):
                return v["vessel_id"]
    return None

def normalize_date(date_str: str) -> Optional[str]:
    """Convierte DD/MM/YYYY o DD-MM-YYYY a YYYY-MM-DD"""
    clean_str = date_str.replace('/', '-').strip()
    parts = clean_str.split('-')
    if len(parts) == 3:
        if len(parts[0]) == 4:  # YYYY-MM-DD
            return clean_str
        elif len(parts[2]) == 4:  # DD-MM-YYYY
            return f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
    return None

class BunkerPdfParserService:

    @staticmethod
    def parse_pdf(file_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "success": True,
            "filename": filename,
            "supplier": "PROVEEDOR DESCONOCIDO",
            "supplier_ruc": "",
            "invoice_number": "",
            "issue_date": datetime.date.today().isoformat(),
            "vessel_id": "MOQUEGUA",
            "currency": "USD",
            "total_invoice_usd": 0.0,
            "items": [],
            # Atributos directos del item principal
            "fuel_type": "IFO",
            "quantity_mt": 0.0,
            "unit_price_usd": 0.0,
            "total_amount_usd": 0.0,
            "raw_text_snippet": ""
        }

        full_text = ""
        lines: List[str] = []

        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text() or ""
                full_text += t + "\n"
                for line in t.split("\n"):
                    clean = line.strip()
                    if clean:
                        lines.append(clean)

        result["raw_text_snippet"] = full_text[:1000]

        # 1. Detección de Proveedor y RUC
        ruc_matches = re.findall(r'\b(20\d{9})\b', full_text)
        if "20507656367" in full_text or "OIL TRADING" in full_text.upper():
            result["supplier"] = "OIL TRADING S.A.C."
            result["supplier_ruc"] = "20507656367"
        elif "20547737904" in full_text or "FUEL LOGISTICS" in full_text.upper():
            result["supplier"] = "FUEL LOGISTICS S.A.C."
            result["supplier_ruc"] = "20547737904"
        elif ruc_matches:
            result["supplier_ruc"] = ruc_matches[0]
            if len(lines) > 0:
                result["supplier"] = lines[0].split("R.U.C.")[0].strip()

        # 2. Detección de Factura (ej: F001-3123, F006-00000840)
        inv_match = re.search(r'\b([FE][A-Z0-9]{3}-\d{1,8})\b', full_text)
        if inv_match:
            result["invoice_number"] = inv_match.group(1)
        elif filename:
            # Fallback buscar serie en el nombre del archivo
            file_match = re.search(r'([FE]\d{3}-\d+)', filename, re.IGNORECASE)
            if file_match:
                result["invoice_number"] = file_match.group(1).upper()

        # 3. Detección de Fecha de Emisión
        date_match = re.search(r'(?:Fecha(?:\s+de\s+Emisi[oó]n)?[:\s]+)(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})', full_text, re.IGNORECASE)
        if date_match:
            norm = normalize_date(date_match.group(1))
            if norm:
                result["issue_date"] = norm
        else:
            # Fallback buscar cualquier fecha
            any_date = re.search(r'\b(\d{2}/\d{2}/\d{4})\b', full_text)
            if any_date:
                norm = normalize_date(any_date.group(1))
                if norm:
                    result["issue_date"] = norm

        # 4. Detección de Buque
        v_id = detect_vessel(full_text)
        if v_id:
            result["vessel_id"] = v_id
        elif filename:
            v_file = detect_vessel(filename)
            if v_file:
                result["vessel_id"] = v_file

        # 5. Extracción de Ítems según Emisor
        if result["supplier_ruc"] == "20507656367" or "OIL TRADING" in result["supplier"]:
            # Caso Oil Trading:
            # Ejemplo: 004 TONELADAS DE IFO 380 BAJO AZUFRE VLSFO, NAVE: BT MOQUEGUA 200.000 865.00 0.00 173,000.00
            # Ejemplo: 005 TONELADAS DE MGO, NAVE: BT MOQUEGUA 50.000 1,650.00 0.00 82,500.00
            for line in lines:
                if "TONELADAS DE" in line.upper():
                    # Homologación MGO -> MDO
                    fuel_type = "MDO" if "MGO" in line.upper() or "MDO" in line.upper() else "IFO"
                    
                    # Regex para: [Cantidad] [Precio Unit] [Dscto] [Precio Total]
                    m = re.search(r'(\d+[\.,]\d{2,4})\s+([\d,]+\.\d{2})\s+[\d,]+\.\d{2}\s+([\d,]+\.\d{2})$', line)
                    if m:
                        qty = float(m.group(1).replace(',', ''))
                        unit_p = float(m.group(2).replace(',', ''))
                        total_p = float(m.group(3).replace(',', ''))
                        
                        item = {
                            "fuel_type": fuel_type,
                            "quantity_mt": round(qty, 4),
                            "unit_price_usd": round(unit_p, 4),
                            "total_amount_usd": round(total_p, 2),
                            "raw_description": line
                        }
                        result["items"].append(item)

        elif result["supplier_ruc"] == "20547737904" or "FUEL LOGISTICS" in result["supplier"]:
            # Caso Fuel Logistics:
            # 12,500.00 GLI C0030030123 COMBUSTIBLE - DIESEL 3.920 49,000.000
            for line in lines:
                if "COMBUSTIBLE" in line.upper() or "DIESEL" in line.upper() or "GLI" in line.upper():
                    fuel_type = "MDO"
                    m = re.search(r'([\d,]+\.\d{2})\s+GLI.*?([\d,]+\.\d{2,4})\s+([\d,]+\.\d{2,3})', line)
                    if m:
                        gallons = float(m.group(1).replace(',', ''))
                        unit_p_gal = float(m.group(2).replace(',', ''))
                        total_p = float(m.group(3).replace(',', ''))
                        # Conversión marítima estándar de galones a TM (~308.2 gal/TM)
                        qty_mt = round(gallons / 308.2, 4)
                        unit_p_mt = round(total_p / qty_mt, 4) if qty_mt > 0 else 0.0
                        
                        item = {
                            "fuel_type": fuel_type,
                            "quantity_mt": qty_mt,
                            "unit_price_usd": unit_p_mt,
                            "total_amount_usd": round(total_p, 2),
                            "raw_description": line,
                            "gallons": gallons,
                            "unit_price_gal": unit_p_gal
                        }
                        result["items"].append(item)

        # 6. Fallback Heurístico General si no se detectaron items
        if not result["items"]:
            for line in lines:
                if any(k in line.upper() for k in ["IFO", "VLSFO", "MGO", "MDO", "DIESEL", "BUNKER"]):
                    fuel_type = "MDO" if any(k in line.upper() for k in ["MGO", "MDO", "DIESEL"]) else "IFO"
                    numbers = re.findall(r'[\d,]+\.\d{2}', line)
                    if len(numbers) >= 2:
                        try:
                            # Asumir los últimos dos como precio y total o cantidad y precio
                            val1 = float(numbers[-2].replace(',', ''))
                            val2 = float(numbers[-1].replace(',', ''))
                            item = {
                                "fuel_type": fuel_type,
                                "quantity_mt": round(val1, 4),
                                "unit_price_usd": round(val2, 4),
                                "total_amount_usd": round(val1 * val2, 2),
                                "raw_description": line
                            }
                            result["items"].append(item)
                        except Exception:
                            pass

        # 7. Asignar ítem principal para prellenar campos en UI
        if result["items"]:
            main_item = result["items"][0]
            result["fuel_type"] = main_item["fuel_type"]
            result["quantity_mt"] = main_item["quantity_mt"]
            result["unit_price_usd"] = main_item["unit_price_usd"]
            result["total_amount_usd"] = main_item["total_amount_usd"]
            result["total_invoice_usd"] = sum(it["total_amount_usd"] for it in result["items"])
        else:
            # Buscar total explícito en el documento
            total_match = re.search(r'(?:TOTAL|IMPORTE TOTAL)[:\s]+(?:USD)?\s*([\d,]+\.\d{2})', full_text, re.IGNORECASE)
            if total_match:
                result["total_invoice_usd"] = float(total_match.group(1).replace(',', ''))
                result["total_amount_usd"] = result["total_invoice_usd"]

        return result
