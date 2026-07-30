"""
Router: PDF Generation via WeasyPrint
Endpoint: POST /api/v1/utils/generate-pdf
Recibe HTML como string en el body y retorna un PDF binario.
Evita Sharing Violation de Windows al eliminar el uso del print dialog del navegador.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

router = APIRouter()


class PdfRequest(BaseModel):
    html: str
    filename: str = "acta_petral.pdf"


@router.post("/generate-pdf")
async def generate_pdf(request: PdfRequest):
    """
    Convierte HTML a PDF usando weasyprint y lo retorna como descarga binaria.
    El frontend llama este endpoint en lugar de usar window.print()
    para evitar el Sharing Violation de Windows al guardar PDFs grandes.
    """
    try:
        import weasyprint
        pdf_bytes = weasyprint.HTML(string=request.html).write_pdf()
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{request.filename}"',
                "Content-Length": str(len(pdf_bytes)),
            }
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="weasyprint no esta instalado en el servidor. Ejecuta: pip install weasyprint"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar PDF: {str(e)}"
        )
