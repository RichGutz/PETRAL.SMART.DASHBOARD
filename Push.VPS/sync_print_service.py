import re

legacy_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\providers\multicotizadorPdfPrintService_legacy.ts"
target_path = r"C:\Users\rguti\PETRAL.SMART.DASHBOARD\Desarrollo.Profesional\Geeksoft_Frontend\src\services\providers\multicotizadorPdfPrintService.ts"

with open(legacy_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Agregar import
code = code.replace(
    "import { MulticotizadorCalculationEngine, type VoyageCalculationResult } from './multicotizadorCalculationEngine';",
    "import { MulticotizadorCalculationEngine, type VoyageCalculationResult } from './multicotizadorCalculationEngine';\nimport { downloadReportPdf } from '../../utils/pdfDownloadHelper';"
)

# 2. Agregar charterHireCost a la interface
code = code.replace(
    "demurrageRatesMap?: Record<string, number>;",
    "demurrageRatesMap?: Record<string, number>;\n    charterHireCost?: number;"
)

# 3. Reemplazar printDocument
old_print_pattern = re.compile(r'public static printDocument\(data: MulticotizadorPrintData\): void \{[\s\S]*?printWindow\.document\.close\(\);\s*\}', re.MULTILINE)
new_print_methods = """/**
     * Descarga directa del archivo PDF binario A4 Landscape (100% Echado) con Chromium Headless
     */
    public static async downloadPdf(data: MulticotizadorPrintData): Promise<void> {
        const clientSafe = (data.selectedClient || 'CLIENTE').replace(/[^a-zA-Z0-9_-]/g, '_');
        const vesselSafe = (data.selectedVessel || 'BUQUE').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `PETRAL_MULTICOTIZADOR_${clientSafe}_${vesselSafe}.pdf`;

        const html = this.buildHtmlDocument(data);
        await downloadReportPdf(html, filename, 'landscape');
    }

    public static async printDocument(data: MulticotizadorPrintData): Promise<void> {
        return this.downloadPdf(data);
    }"""

code = old_print_pattern.sub(new_print_methods, code)

# 4. Desestructurar charterHireCost en buildHtmlDocument
code = code.replace(
    "tariffTiers, demurrageRatesMap, liveCalc, printedBy",
    "tariffTiers, demurrageRatesMap, charterHireCost, liveCalc, printedBy"
)

with open(target_path, "w", encoding="utf-8") as f:
    f.write(code)

print("OK: multicotizadorPdfPrintService.ts generado limpiamente con exito!")
