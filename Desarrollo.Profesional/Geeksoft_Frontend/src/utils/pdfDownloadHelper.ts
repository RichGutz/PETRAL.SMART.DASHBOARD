/**
 * Helper Oficial de Descarga PDF para PETRAL SMART DASHBOARD
 * Trasplantado 1:1 desde InAndes ERP
 * Generación Vectorial Nativa en Servidor con WeasyPrint
 */

export async function downloadReportPdf(
  htmlDoc: string, 
  filename: string, 
  _orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<void> {
  // 1. Limpieza y preparación de estilos y body para el motor WeasyPrint del servidor
  const bodyContent = htmlDoc
    .replace(/^[\s\S]*?<body[^>]*>/i, '')
    .replace(/<\/body>[\s\S]*$/i, '');
  const headStyles = (htmlDoc.match(/<style[\s\S]*?<\/style>/gi) || []).join('\n');
  const printHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">${headStyles}</head><body>${bodyContent}</body></html>`;

  // 2. Llamada directa al Worker Oficial de WeasyPrint en el Backend FastAPI de PETRAL
  const baseUrl = import.meta.env.VITE_API_URL 
    ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') 
    : (typeof window !== 'undefined' && window.location.origin ? `${window.location.origin}/api/v1` : 'https://forecast.geeksoft.tech/api/v1');
  
  const targetUrl = `${baseUrl}/forecast/generate-pdf`;

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: printHtml, filename })
  });


  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al generar PDF en el servidor (HTTP ${response.status}): ${errText}`);
  }

  // 3. Descarga binaria del archivo PDF (.pdf) directamente al disco con validación de integridad
  const blob = await response.blob();
  if (blob.size < 500) {
    const errText = await blob.text();
    throw new Error(`Respuesta anómala del servidor (${blob.size} bytes): ${errText}`);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
