/**
 * Servicio Independiente de Impresión y Exportación a PDF para el Multicotizador
 * Formato: A4 Horizontal (Landscape 297mm x 210mm) de Alta Fidelidad
 * Diseñado conforme a la arquitectura modular de servicios provider de PETRAL.
 * 
 * POLÍTICA DE FIDELIDAD TOTAL:
 * Este servicio NO recalcula fórmulas locales; consume directamente el estado
 * calculado `liveCalc` generado por la UI / MulticotizadorCalculationEngine.
 */

import { MulticotizadorCalculationEngine, type VoyageCalculationResult } from './multicotizadorCalculationEngine';

export interface MulticotizadorPrintData {
    clientType: 'ACTIVOS' | 'PROSPECTOS';
    selectedClient: string;
    selectedRouteName: string;
    selectedRouteId: string;
    selectedVessel: string;
    validFrom: string;
    validTo: string;
    vessels: any[];
    vesselParams: any;
    bunkerSource: string;
    bunkerPriceIfo: number;
    bunkerPriceMdo: number;
    tramos: any[];
    puertosConfig: any[];
    ports: any[];
    refacturarMuellajeMap: Record<number, boolean>;
    addressCommPct: number;
    brokerCommPct: number;
    commentsText: string;
    bafFormula?: string;
    bafValidFrom?: string;
    bafValidTo?: string;
    bafIfoBase?: number;
    bafMdoBase?: number;
    tariffTiers?: Array<{ label?: string; min?: number; max?: number; rate: number }>;
    demurrageRatesMap?: Record<string, number>;
    charterHireCost?: number;
    liveCalc?: VoyageCalculationResult | any;
    printedBy?: string;
}

export class MulticotizadorPdfPrintService {

    // Formatters Helper
    private static fmtCur(val: any): string {
        if (val === undefined || val === null || val === '') return '$0';
        const num = Number(val);
        if (isNaN(num)) return '$0';
        return `$${Math.round(num).toLocaleString('en-US')}`;
    }

    private static fmtNum(val: any, decimals: number = 1): string {
        if (val === undefined || val === null || val === '') return '0.0';
        const num = Number(val);
        if (isNaN(num)) return '0.0';
        return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    private static fmtDate(dtStr: string): string {
        if (!dtStr) return '-';
        try {
            const parts = dtStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dtStr;
        } catch {
            return dtStr;
        }
    }

    /**
     * Construye el documento HTML ejecutivo A4 Landscape y lanza el diálogo de impresión
     */
    public static printDocument(data: MulticotizadorPrintData): void {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, habilite las ventanas emergentes en su navegador para exportar el PDF.');
            return;
        }

        const html = this.buildHtmlDocument(data);
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    }

    /**
     * Generador del HTML con estilos CSS embebidos optimizados para A4 Landscape (1 sola hoja)
     */
    public static buildHtmlDocument(data: MulticotizadorPrintData): string {
        const {
            clientType, selectedClient, selectedRouteName, selectedRouteId, selectedVessel,
            validFrom, validTo, vessels, vesselParams, bunkerSource, bunkerPriceIfo, bunkerPriceMdo,
            tramos, puertosConfig, refacturarMuellajeMap, addressCommPct, brokerCommPct,
            commentsText, bafFormula, bafValidFrom, bafValidTo, bafIfoBase, bafMdoBase,
            tariffTiers, demurrageRatesMap, charterHireCost, liveCalc, printedBy
        } = data;

        // ÚNICA FUENTE DE VERDAD: Si liveCalc viene de la pantalla se usa directamente, sino se calcula vía Engine
        const calc: VoyageCalculationResult = liveCalc || MulticotizadorCalculationEngine.calculateVoyage({
            tramos,
            puertosConfig,
            vesselParams,
            bunkerPriceIfo,
            bunkerPriceMdo,
            addressCommPct,
            brokerCommPct,
            demurrageRate: Number(vesselParams?.demurrage_rate || 20000),
            refacturarMuellajeMap
        });

        const vObj = vessels.find(v => v.vessel_id === selectedVessel);
        let photoSrc = vObj?.image_url;
        if (!photoSrc || photoSrc.trim() === '') {
            const vid = (selectedVessel || vObj?.vessel_id || '').toUpperCase();
            const vname = (vObj?.vessel_name || '').toUpperCase();
            if (vid.includes('MOQUEGUA') || vname.includes('MOQUEGUA')) {
                photoSrc = '/moquegua_1.jpg';
            } else if (vid.includes('TABLONES') || vname.includes('TABLONES') || vid.includes('CONCON') || vname.includes('CONCON')) {
                photoSrc = '/tablones.jpeg';
            } else {
                photoSrc = '/moquegua_1.jpg';
            }
        }

        // 1. Tramos & Itinerario (Filas de la Tabla)
        const legRowsHtml: string[] = [];

        // Fila 0: Origen Inicial (POL)
        const originPort = tramos[0]?.origin_port_id || '-';
        const pCfg0 = puertosConfig[0] || {};
        const q0 = Number(pCfg0.quantity || 0);
        const f0 = Number(pCfg0.freight_rate || 0);
        const mCost0 = Number(pCfg0.manual_port_cost || pCfg0.muellaje_cost || 0);
        const flete0 = q0 * f0;

        legRowsHtml.push(`
            <tr class="leg-row bg-slate-50/50">
                <td class="text-center font-bold text-slate-400">-</td>
                <td class="text-center"><span class="badge badge-ballast">BALLAST</span></td>
                <td class="text-left font-bold text-slate-800">${originPort}</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-right font-medium">0.00</td>
                <td class="text-right font-medium">${calc.portDays0 > 0 ? this.fmtNum(calc.portDays0, 2) : '0.00'}</td>
                <td class="text-right font-bold text-sky-950">${calc.demurrageDays0 > 0 ? this.fmtNum(calc.demurrageDays0, 2) : '0.00'}</td>
                <td class="text-right">${pCfg0.action !== 'NONE' ? (pCfg0.time_to_count !== undefined && pCfg0.time_to_count !== '' ? pCfg0.time_to_count : 6) : '-'}</td>
                <td class="text-right">${pCfg0.action !== 'NONE' ? (pCfg0.positioning || (pCfg0.action === 'CARGAR' ? 1.0 : 0.0)) : '-'}</td>
                <td class="text-center font-extrabold ${pCfg0.action === 'CARGAR' ? 'text-blue-700' : pCfg0.action === 'DESCARGAR' ? 'text-emerald-700' : 'text-slate-500'}">${pCfg0.action || 'NONE'}</td>
                <td class="text-center text-slate-400">-</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-right text-slate-700">${mCost0 > 0 ? this.fmtCur(mCost0) : '$0'}</td>
                <td class="text-right text-slate-700">${flete0 > 0 ? this.fmtCur(flete0) : '$0'}</td>
                <td class="text-right font-bold text-amber-900">${calc.bunkerCost0 > 0 ? this.fmtCur(calc.bunkerCost0) : '$0'}</td>
                <td class="text-right">${pCfg0.muellaje_cost > 0 ? `<span>${this.fmtCur(pCfg0.muellaje_cost)} ${refacturarMuellajeMap[0] !== false ? '<span class="rf-badge">RF</span>' : ''}</span>` : '-'}</td>
            </tr>
        `);

        // Filas de Tramos 1 .. N calculadas por la UI
        (calc.calculatedTramos || []).forEach((tr, idx) => {
            const isBallast = tr.type === 'BALLAST';
            const badgeClass = isBallast ? 'badge-ballast' : 'badge-laden';
            legRowsHtml.push(`
                <tr class="leg-row">
                    <td class="text-center font-bold">${tr.index || idx + 1}</td>
                    <td class="text-center"><span class="badge ${badgeClass}">${tr.type}</span></td>
                    <td class="text-left font-bold text-slate-800">${tr.destination_port_id || '-'}</td>
                    <td class="text-right">${tr.distance > 0 ? this.fmtNum(tr.distance, 0) : '-'}</td>
                    <td class="text-right">${tr.weather_factor_pct > 0 ? this.fmtNum(tr.weather_factor_pct, 1) : '-'}</td>
                    <td class="text-right">${tr.speed > 0 ? this.fmtNum(tr.speed, 0) : '-'}</td>
                    <td class="text-right font-medium">${tr.sea_days > 0 ? this.fmtNum(tr.sea_days, 2) : '0.00'}</td>
                    <td class="text-right font-medium">${tr.port_days > 0 ? this.fmtNum(tr.port_days, 2) : '0.00'}</td>
                    <td class="text-right font-bold text-sky-950">${tr.demurrage_days > 0 ? this.fmtNum(tr.demurrage_days, 2) : '0.00'}</td>
                    <td class="text-right">${tr.action !== 'NONE' ? tr.time_to_count_h : '-'}</td>
                    <td class="text-right">${tr.action !== 'NONE' ? tr.positioning_h : '-'}</td>
                    <td class="text-center font-extrabold ${tr.action === 'CARGAR' ? 'text-blue-700' : tr.action === 'DESCARGAR' ? 'text-emerald-700' : 'text-slate-500'}">${tr.action || 'NONE'}</td>
                    <td class="text-center">${tr.action !== 'NONE' ? `${tr.op_rate} ${tr.rate_unit === 'TH' ? 'T/H' : 'T/D'}` : '-'}</td>
                    <td class="text-right font-semibold">${tr.quantity > 0 ? this.fmtNum(tr.quantity, 0) : '-'}</td>
                    <td class="text-right font-semibold">${tr.freight_rate > 0 ? this.fmtNum(tr.freight_rate, 0) : '-'}</td>
                    <td class="text-right font-bold text-slate-800">${tr.port_cost > 0 ? this.fmtCur(tr.port_cost) : '$0'}</td>
                    <td class="text-right font-bold text-blue-900">${tr.freight_revenue > 0 ? this.fmtCur(tr.freight_revenue) : '$0'}</td>
                    <td class="text-right font-bold text-amber-900">${tr.bunker_cost > 0 ? this.fmtCur(tr.bunker_cost) : '$0'}</td>
                    <td class="text-right">
                        ${tr.muellaje_cost > 0 ? `<span>${this.fmtCur(tr.muellaje_cost)} ${tr.is_refacturado ? '<span class="rf-badge">RF</span>' : ''}</span>` : '-'}
                    </td>
                </tr>
            `);
        });

        // 2. Gastos de Puerto Dinámicos
        const portCostItemsHtml: string[] = (calc.portCostItems || []).map(pItem => `
            <tr class="border-b border-slate-100">
                <td class="py-0.5 pl-1.5 text-slate-700">${pItem.label}</td>
                <td class="text-right py-0.5 pr-1.5 font-bold">${this.fmtCur(pItem.total_cost)}</td>
            </tr>
        `);

        // Demurrage items helper
        const demurrageMap = demurrageRatesMap || {};
        const getDemurrageVal = (name: string): number => {
            const clean = name.replace(/^(B\/T|M\/T|M\/V)\s+/i, '').trim();
            const short = clean.split(' ')[0];
            if (demurrageMap[name] !== undefined) return Number(demurrageMap[name]) || 0;
            if (demurrageMap[clean] !== undefined) return Number(demurrageMap[clean]) || 0;
            if (demurrageMap[short] !== undefined) return Number(demurrageMap[short]) || 0;
            for (const [k, v] of Object.entries(demurrageMap)) {
                const kClean = k.replace(/^(B\/T|M\/T|M\/V)\s+/i, '').trim();
                if (k.toUpperCase() === name.toUpperCase() || kClean.toUpperCase() === clean.toUpperCase() || kClean.toUpperCase().startsWith(short.toUpperCase())) {
                    return Number(v) || 0;
                }
            }
            return 0;
        };

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PETRAL_MULTICOTIZADOR_${selectedClient}_${selectedVessel || 'BUQUE'}</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- html2pdf.js — genera PDF binario nativo landscape para Foxit Reader -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

    <!-- ESTILOS DE IMPRESIÓN FORZADOS -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700;800&family=Geist:wght@400;500;600;700;800;900&display=swap');
        
        * {
            box-sizing: border-box !important;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .font-mono {
            font-family: 'Geist Mono', monospace;
        }

        @page {
            size: A4 landscape;
            margin: 0;
        }

        @media print {
            @page {
                size: A4 landscape;
                margin: 0;
            }
            html, body {
                width: 297mm !important;
                height: 210mm !important;
                max-width: 297mm !important;
                max-height: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: #ffffff !important;
                overflow: hidden !important;
            }
            .no-print {
                display: none !important;
            }
            .a4-landscape-page {
                width: 290mm !important;
                height: 200mm !important;
                max-height: 200mm !important;
                padding: 2mm 3mm !important;
                margin: 0 auto !important;
                overflow: hidden !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
                break-after: avoid !important;
                break-inside: avoid !important;
            }
        }

        .a4-landscape-page {
            width: 290mm;
            height: 200mm;
            max-height: 200mm;
            margin: 0 auto;
            background: #ffffff;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
        }

        .dense-table th, .dense-table td {
            padding: 1.2px 2.5px;
            font-size: 8px;
            line-height: 1.1;
        }

        .border-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
        }

        .badge {
            display: inline-block;
            padding: 1px 4px;
            border-radius: 3px;
            font-weight: 700;
            font-size: 7.5px;
            text-transform: uppercase;
        }
        .badge-ballast {
            background-color: #e2e8f0;
            color: #475569;
        }
        .badge-laden {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .rf-badge {
            background-color: #dbeafe;
            color: #1e40af;
            border: 1px solid #93c5fd;
            font-size: 7px;
            padding: 0.5px 2px;
            border-radius: 2px;
            font-weight: 800;
        }
    </style>
</head>
<body class="p-1">

    <!-- BARRA DE ACCIÓN (SOLO PANTALLA) -->
    <div class="no-print mb-2 max-w-[290mm] mx-auto flex items-center justify-between bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg">
        <div class="flex items-center gap-2">
            <span class="text-base font-bold">📄 Multicotizador PETRAL (A4 Horizontal)</span>
            <span class="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-mono">1 HOJA OFICIAL</span>
        </div>
        <div class="flex items-center gap-3">
            <button id="btn-download-pdf" onclick="downloadDirectPdf()" class="bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1.5 shadow transition-colors cursor-pointer">
                📥 Descargar PDF Directo (Foxit Ready)
            </button>
            <button onclick="window.print()" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded flex items-center gap-1.5 shadow transition-colors cursor-pointer">
                🖨️ Imprimir / Guardar como PDF
            </button>
            <button onclick="window.close()" class="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded transition-colors cursor-pointer">
                Cerrar
            </button>
        </div>
    </div>

    <!-- DOCUMENTO A4 LANDSCAPE -->
    <div id="pdf-content-page" class="a4-landscape-page">

        <!-- 1. CABECERA EJECUTIVA Y METADATA DE VIAJE -->
        <div class="border-box bg-white text-slate-800 p-2 shadow-xs border border-slate-300">
            <div class="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5">
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2">
                        <span class="text-xl text-blue-900">⚓</span>
                        <div>
                            <h1 class="text-sm font-black tracking-tight leading-none text-slate-900">NAVIERA PETRAL S.A.</h1>
                            <span class="text-[8px] text-blue-700 font-mono uppercase tracking-widest font-bold">COMMERCIAL ESTIMATING & VOYAGE PROJECTION</span>
                        </div>
                    </div>
                </div>
                
                <!-- Titulo de la Cotización -->
                <div class="text-center">
                    <h2 class="text-xs font-black uppercase text-slate-800 tracking-wider">
                        COTIZACIÓN DE FLETE & ESTIMACIÓN DE VIAJE
                    </h2>
                    <span class="text-[8.5px] font-mono text-slate-600">
                        RUTA: <strong class="text-slate-900">${selectedRouteName || selectedRouteId || 'COTIZACIÓN PERSONALIZADA'}</strong>
                    </span>
                </div>

                <!-- Badge Cliente y Buque -->
                <div class="flex items-center gap-2">
                    <div class="text-right">
                        <span class="text-[7.5px] text-slate-500 block uppercase">CLIENTE (${clientType})</span>
                        <strong class="text-xs font-black text-slate-900">${selectedClient || 'PROSPECTO COMERCIAL'}</strong>
                    </div>
                    <div class="bg-slate-100 px-2 py-1 rounded border border-slate-300 text-right">
                        <span class="text-[7.5px] text-blue-800 block uppercase font-bold">BUQUE ASIGNADO</span>
                        <strong class="text-xs font-black text-slate-900 font-mono">${selectedVessel || 'TBN'}</strong>
                    </div>
                </div>
            </div>

            <!-- Fila de Parámetros Clave -->
            <div class="grid grid-cols-6 gap-2 text-[8.5px] font-mono bg-slate-50 p-1 rounded border border-slate-200">
                <div><span class="text-slate-500">Validez:</span> <strong class="text-slate-800">${this.fmtDate(validFrom)} - ${this.fmtDate(validTo)}</strong></div>
                <div><span class="text-slate-500">TCE Requerido:</span> <strong class="text-slate-900">${this.fmtCur(calc.tceReq)}/d</strong></div>
                <div><span class="text-slate-500">IFO 380:</span> <strong class="text-slate-900">${this.fmtCur(bunkerPriceIfo)}/T</strong></div>
                <div><span class="text-slate-500">MDO / LSMGO:</span> <strong class="text-slate-900">${this.fmtCur(bunkerPriceMdo)}/T</strong></div>
                <div><span class="text-slate-500">Address Comm:</span> <strong class="text-slate-800">${addressCommPct}%</strong></div>
                <div><span class="text-slate-500">Broker Comm:</span> <strong class="text-slate-800">${brokerCommPct}%</strong></div>
            </div>
        </div>

        <!-- 2. FACT SHEET TÉCNICO DEL BUQUE (SHIP MATRIX) -->
        <div class="border-box bg-white overflow-hidden shadow-xs">
            <table class="w-full border-collapse font-mono dense-table table-fixed">
                <thead>
                    <tr class="bg-slate-100 border-b border-slate-300 font-sans text-slate-700 font-bold uppercase text-[7.5px]">
                        <th class="border-r border-slate-200 text-center" style="width: 14%;">VESSEL PHOTO</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 5%;">GRT (t)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 5.5%;">DWT (t)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 5.5%;">DWCC (t)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">SPEED (kn)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 6.5%;">TCE REQ ($/d)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">LOA (m)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">BEAM (m)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">CALADO (m)</th>
                        <th class="border-r border-slate-200 text-center bg-slate-50" style="width: 3.5%;">FUEL</th>
                        <th class="border-r border-slate-200 text-center" style="width: 5.5%;">SEA (t/d)</th>
                        <th class="border-r border-slate-200 text-center" style="width: 5.5%;">IDLE (t/d)</th>
                        <th class="border-r border-slate-200 text-center" style="width: 5.5%;">LOAD (t/d)</th>
                        <th class="border-r border-slate-200 text-center" style="width: 5.5%;">DISCH (t/d)</th>
                        <th class="border-r border-slate-200 text-center bg-red-600 text-white font-black" style="width: 7.5%;">PRECIO ($/T)</th>
                        <th class="text-center bg-slate-50 font-bold" style="width: 10.5%;">FUENTE</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="border-b border-slate-200">
                        <td class="border-r border-slate-300 p-0 text-center align-middle bg-slate-50" rowspan="2">
                            <div class="w-full h-11 flex items-center justify-center overflow-hidden bg-slate-100">
                                <img src="${photoSrc}" alt="${selectedVessel}" class="w-full h-full object-cover" onerror="this.src='/moquegua_1.jpg'" />
                            </div>
                        </td>
                        <td class="border-r border-slate-200 text-right font-bold text-slate-800 pr-1 align-middle" rowspan="2">${this.fmtNum(vesselParams?.grt, 0)}</td>
                        <td class="border-r border-slate-200 text-right font-bold text-slate-800 pr-1 align-middle" rowspan="2">${this.fmtNum(vesselParams?.dwt, 0)}</td>
                        <td class="border-r border-slate-200 text-right font-bold text-slate-800 pr-1 align-middle" rowspan="2">${this.fmtNum(vesselParams?.dwcc, 0)}</td>
                        <td class="border-r border-slate-200 text-right font-bold text-slate-800 pr-1 align-middle" rowspan="2">${this.fmtNum(vesselParams?.vessel_speed || vObj?.vessel_speed || 11, 0)}</td>
                        <td class="border-r border-slate-200 text-right font-bold text-slate-800 pr-1 align-middle" rowspan="2">${this.fmtNum(vesselParams?.tce_required, 0)}</td>
                        <td class="border-r border-slate-200 text-right font-bold text-slate-800 pr-1 align-middle" rowspan="2">${this.fmtNum(vesselParams?.length, 0)}</td>
                        <td class="border-r border-slate-200 text-right font-bold text-slate-800 pr-1 align-middle" rowspan="2">${this.fmtNum(vesselParams?.beam, 0)}</td>
                        <td class="border-r border-slate-200 text-right font-bold text-slate-800 pr-1 align-middle" rowspan="2">${this.fmtNum(vesselParams?.draft_m, 1)}</td>
                        
                        <!-- FILA 1: IFO -->
                        <td class="border-r border-slate-200 text-center font-bold text-slate-700 bg-slate-50/60 py-0.5">IFO</td>
                        <td class="border-r border-slate-200 text-center text-slate-800 py-0.5">${this.fmtNum(vesselParams?.consumption_sea_ifo || 14.5, 1)}</td>
                        <td class="border-r border-slate-200 text-center text-slate-800 py-0.5">${this.fmtNum(vesselParams?.consumption_idle_ifo || 3.5, 1)}</td>
                        <td class="border-r border-slate-200 text-center text-slate-800 py-0.5">${this.fmtNum(vesselParams?.consumption_load_ifo || 3.5, 1)}</td>
                        <td class="border-r border-slate-200 text-center text-slate-800 py-0.5">${this.fmtNum(vesselParams?.consumption_disch_ifo || 5.0, 1)}</td>
                        <td class="border-r border-slate-200 text-center bg-red-600 text-white font-black py-0.5">${this.fmtNum(bunkerPriceIfo, 2)}</td>
                        <td class="text-center font-sans text-[8.5px] font-semibold text-purple-900 bg-purple-50/40 py-0.5 truncate" rowspan="2">
                            📌 ${bunkerSource === 'COTIZACION' ? 'Cotización / Viaje Actual' : bunkerSource === 'MAESTRO_BUNKER' ? 'Maestro Búnker' : 'Maestro Matrices'}
                        </td>
                    </tr>
                    <tr>
                        <!-- FILA 2: MDO -->
                        <td class="border-r border-slate-200 text-center font-bold text-slate-700 bg-slate-50/60 py-0.5">MDO</td>
                        <td class="border-r border-slate-200 text-center text-slate-800 py-0.5">${this.fmtNum(vesselParams?.consumption_sea_mdo || 0.1, 1)}</td>
                        <td class="border-r border-slate-200 text-center text-slate-800 py-0.5">${this.fmtNum(vesselParams?.consumption_idle_mdo || 0.1, 1)}</td>
                        <td class="border-r border-slate-200 text-center text-slate-800 py-0.5">${this.fmtNum(vesselParams?.consumption_load_mdo || 0.1, 1)}</td>
                        <td class="border-r border-slate-200 text-center text-slate-800 py-0.5">${this.fmtNum(vesselParams?.consumption_disch_mdo || 0.1, 1)}</td>
                        <td class="border-r border-slate-200 text-center bg-red-600 text-white font-black py-0.5">${this.fmtNum(bunkerPriceMdo, 2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 3. GRILLA DE TRAMOS E ITINERARIO DE PUERTOS (LEG TABLE) -->
        <div class="border-box bg-white overflow-hidden shadow-xs">
            <table class="w-full border-collapse font-mono dense-table table-fixed">
                <thead>
                    <tr class="bg-slate-100 border-b border-slate-300 font-sans text-slate-600 font-bold uppercase text-[8px]">
                        <th class="border-r border-slate-200 text-center" style="width: 3%;">LEG</th>
                        <th class="border-r border-slate-200 text-center" style="width: 5%;">ESTADO</th>
                        <th class="border-r border-slate-200 text-left pl-1" style="width: 9.5%;">PUERTO</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 5%;">DIST (NM)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4%;">CLIMA %</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">VEL (KN)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 5%;">DÍAS MAR</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 5%;">DÍAS PTO</th>
                        <th class="border-r border-slate-200 text-right pr-1 bg-sky-50 font-black text-sky-950" style="width: 5.5%;">DEM (D)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 6%;">TIME TO COUNT (H)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">POSIC (H)</th>
                        <th class="border-r border-slate-200 text-center" style="width: 6%;">OP. DEST</th>
                        <th class="border-r border-slate-200 text-center" style="width: 6%;">RITMO (C/D)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 6%;">Q (MT)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">F ($/T)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 6%;">COSTO PTO</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 6.5%;">FLETE ($)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 6.5%;">BUNKER ($)</th>
                        <th class="text-right pr-1" style="width: 5.5%;">MUELLAJE</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                    ${legRowsHtml.join('')}
                </tbody>
                <tfoot>
                    <tr class="bg-blue-600 text-white font-mono font-bold text-[9.5px]">
                        <td colspan="3" class="text-left pl-2 py-1 uppercase tracking-wide">📊 TOTAL</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtNum(calc.totalDist, 0)}</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtNum(calc.totalSeaDays, 2)}</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtNum(calc.totalPortDays, 2)}</td>
                        <td class="text-right pr-1 py-1 font-black bg-sky-700/80">${this.fmtNum(calc.totalDemurrageDays, 2)}</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-center py-1">-</td>
                        <td class="text-center py-1">-</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtNum(calc.totalQuantity, 0)}</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtCur(calc.totalPortCosts)}</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtCur(calc.totalFreight)}</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtCur(calc.grandBunkerTotal)}</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtCur(calc.refacturacionMuellaje)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <!-- 4. TARJETAS INFERIORES EN 4 COLUMNAS (100% IDÉNTICAS A LA PANTALLA) -->
        <div class="grid grid-cols-4 gap-1.5 items-stretch">

            <!-- COLUMNA 1: BUNKER EXPENSES & COMMENTS -->
            <div class="flex flex-col gap-1.5 h-full">
                <!-- BUNKER EXPENSES (COMBUSTIBLE) -->
                <div class="border-box bg-white p-1.5 shadow-xs flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-1 font-sans flex items-center justify-between">
                            <span>Bunker Expenses (Combustible)</span>
                            ${(calc.totalDemurrageDays || 0) > 0 ? `
                                <span class="text-[7.5px] font-mono text-sky-700 bg-sky-50 px-1 rounded border border-sky-200">
                                    Dem: ${this.fmtNum(calc.totalDemurrageDays, 2)} d
                                </span>
                            ` : ''}
                        </h4>
                        <table class="w-full border-collapse font-mono text-[8px]">
                            <thead>
                                <tr class="bg-slate-50 border-b border-slate-200 font-sans text-[7.5px] text-slate-500 font-bold">
                                    <th class="text-left py-0.5 pl-1">Fuel</th>
                                    <th class="text-right py-0.5 pr-0.5" title="Travesía en Mar">1. Mar</th>
                                    <th class="text-right py-0.5 pr-0.5" title="Operaciones Puerto">2. Pto</th>
                                    <th class="text-right py-0.5 pr-0.5" title="Estadías en Demurrage">3. Dem</th>
                                    <th class="text-right py-0.5 pr-1 font-black text-slate-700">Total ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-b border-slate-100">
                                    <td class="py-0.5 pl-1 text-slate-600 font-sans">IFO</td>
                                    <td class="text-right py-0.5 pr-0.5 text-slate-500">${this.fmtNum(calc.seaIfoTons, 1)}</td>
                                    <td class="text-right py-0.5 pr-0.5 text-slate-500">${this.fmtNum(calc.portIfoTons, 1)}</td>
                                    <td class="text-right py-0.5 pr-0.5 text-sky-800 font-semibold">${this.fmtNum(calc.demurrageIfoTons || 0, 1)}</td>
                                    <td class="text-right py-0.5 pr-1 font-bold text-slate-800">${this.fmtCur(calc.ifoCost)}</td>
                                </tr>
                                <tr class="border-b border-slate-100">
                                    <td class="py-0.5 pl-1 text-slate-600 font-sans">MDO</td>
                                    <td class="text-right py-0.5 pr-0.5 text-slate-500">${this.fmtNum(calc.seaMdoTons, 1)}</td>
                                    <td class="text-right py-0.5 pr-0.5 text-slate-500">${this.fmtNum(calc.portMdoTons, 1)}</td>
                                    <td class="text-right py-0.5 pr-0.5 text-sky-800 font-semibold">${this.fmtNum(calc.demurrageMdoTons || 0, 1)}</td>
                                    <td class="text-right py-0.5 pr-1 font-bold text-slate-800">${this.fmtCur(calc.mdoCost)}</td>
                                </tr>
                                <tr class="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                    <td class="py-0.5 pl-1 font-sans text-[7.5px] uppercase">Total</td>
                                    <td class="text-right py-0.5 pr-0.5 font-sans text-[7.5px] text-slate-600">${this.fmtCur(calc.seaBunkerCost)}</td>
                                    <td class="text-right py-0.5 pr-0.5 font-sans text-[7.5px] text-slate-600">${this.fmtCur(calc.portBunkerCost)}</td>
                                    <td class="text-right py-0.5 pr-0.5 font-sans text-[7.5px] text-sky-800">${this.fmtCur(calc.demurrageBunkerCost || 0)}</td>
                                    <td class="text-right py-0.5 pr-1 font-black text-amber-950">${this.fmtCur(calc.grandBunkerTotal)}</td>
                                </tr>
                            </tbody>
                        </table>

                        <!-- AUDITORÍA BÚNKER (DÍAS × T/D × P.U.) -->
                        <div class="border-t border-slate-200 mt-1 pt-0.5 flex flex-col gap-0.5 text-[7.5px] font-mono bg-slate-50/80 rounded p-1 border border-slate-200/60">
                            <div class="flex items-center justify-between font-sans text-[7px] font-bold text-slate-500 uppercase border-b border-slate-200/80 pb-0.5 mb-0.5">
                                <span>🔍 Auditoría Bunker (Días × T/d @ $/T)</span>
                            </div>
                            <div class="flex items-center justify-between text-slate-700">
                                <span class="truncate">
                                    🌊 <strong class="text-slate-800">1. Mar (${this.fmtNum(calc.totalSeaDays, 2)} d):</strong> ${this.fmtNum(calc.seaIfoTons, 1)}T IFO + ${this.fmtNum(calc.seaMdoTons, 1)}T MDO
                                </span>
                                <span class="font-bold text-slate-900 ml-1 shrink-0">${this.fmtCur(calc.seaBunkerCost)}</span>
                            </div>
                            <div class="flex items-center justify-between text-slate-700">
                                <span class="truncate">
                                    ⚓ <strong class="text-slate-800">2. Pto (${this.fmtNum(calc.totalPortDays, 2)} d):</strong> ${this.fmtNum(calc.portIfoTons, 1)}T IFO + ${this.fmtNum(calc.portMdoTons, 1)}T MDO
                                </span>
                                <span class="font-bold text-slate-900 ml-1 shrink-0">${this.fmtCur(calc.portBunkerCost)}</span>
                            </div>
                            <div class="flex items-center justify-between text-sky-900">
                                <span class="truncate">
                                    ⏱️ <strong class="text-sky-950">3. Dem (${this.fmtNum(calc.totalDemurrageDays || 0, 2)} d):</strong> ${this.fmtNum(calc.demurrageIfoTons || 0, 1)}T IFO + ${this.fmtNum(calc.demurrageMdoTons || 0, 1)}T MDO
                                </span>
                                <span class="font-bold text-sky-950 ml-1 shrink-0">${this.fmtCur(calc.demurrageBunkerCost || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- COSTO ARRIENDO NAVES (CHARTER) -->
                <div class="border-box bg-white p-1.5 shadow-xs">
                    <h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-1 font-sans flex items-center justify-between">
                        <span>Costo Arriendo Naves</span>
                        <span class="text-[8px] font-mono text-slate-400 font-normal">USD TOTAL</span>
                    </h4>
                    <div class="flex justify-between items-center bg-slate-50 px-2 py-1 rounded border border-slate-200 text-[8.5px] font-mono">
                        <span class="font-sans text-slate-600 font-bold">$</span>
                        <strong class="font-black text-slate-900">${this.fmtCur(calc.charterHireCost || charterHireCost || 0)}</strong>
                    </div>
                </div>

                <!-- COMMENTS -->
                <div class="border-box bg-white p-1.5 shadow-xs flex-1 flex flex-col justify-between">
                    <h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-1 font-sans flex items-center justify-between">
                        <span>Comments (Observaciones)</span>
                        <span class="text-[8px] font-mono text-slate-400 font-normal">Notas comerciales</span>
                    </h4>
                    <div class="bg-slate-50 p-1.5 rounded border border-slate-200 text-[8px] text-slate-700 font-sans h-10 overflow-hidden italic">
                        ${commentsText || 'Sin observaciones adicionales registradas para este viaje.'}
                    </div>
                </div>
            </div>

            <!-- COLUMNA 2: PORT COSTS & BAF -->
            <div class="flex flex-col gap-1.5 h-full">
                <!-- PORT COSTS -->
                <div class="border-box bg-white p-1.5 shadow-xs flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-1 font-sans">
                            Port Costs (Gastos de Puerto)
                        </h4>
                        <table class="w-full border-collapse font-mono text-[9px]">
                            <thead>
                                <tr class="bg-slate-50 border-b border-slate-200 font-sans text-slate-500 font-bold">
                                    <th class="text-left py-0.5 pl-1.5">Expense Concept</th>
                                    <th class="text-right py-0.5 pr-1.5">Costo (USD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${portCostItemsHtml.length > 0 ? portCostItemsHtml.join('') : `
                                    <tr>
                                        <td class="py-0.5 pl-1.5 text-slate-400">Sin costos asignados</td>
                                        <td class="text-right py-0.5 pr-1.5">$0</td>
                                    </tr>
                                `}
                                <tr class="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                    <td class="py-0.5 pl-1.5 font-sans uppercase text-[8.5px]">Total Port Costs</td>
                                    <td class="text-right py-0.5 pr-1.5">${this.fmtCur(calc.totalPortCosts)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- BAF -->
                <div class="border-box bg-white p-1.5 shadow-xs flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-1 font-sans flex items-center justify-between">
                            <span>BAF (Bunker Adjustment Factor)</span>
                            <span class="text-[8px] font-mono text-blue-600 font-bold">Fórmula & Base</span>
                        </h4>
                        <div class="flex flex-col gap-0.5 text-[8.5px] font-sans">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-500 uppercase">Fórmula:</span>
                                <span class="font-mono font-semibold text-blue-900 truncate max-w-[120px]">${bafFormula || 'N/A'}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-slate-500 uppercase">Validez:</span>
                                <span class="font-mono text-slate-700">${this.fmtDate(bafValidFrom || validFrom)} - ${this.fmtDate(bafValidTo || validTo)}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-1 pt-0.5">
                                <div class="bg-slate-50 p-0.5 rounded border border-slate-200 flex justify-between">
                                    <span class="text-slate-500 font-bold">IFO Base:</span>
                                    <span class="font-mono font-bold text-slate-800">${this.fmtCur(bafIfoBase || 0)}</span>
                                </div>
                                <div class="bg-slate-50 p-0.5 rounded border border-slate-200 flex justify-between">
                                    <span class="text-slate-500 font-bold">MDO Base:</span>
                                    <span class="font-mono font-bold text-slate-800">${this.fmtCur(bafMdoBase || 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COLUMNA 3: COMISIONES & DEMURRAGE & BANDAS -->
            <div class="flex flex-col gap-1.5 h-full">
                <!-- COMISIONES -->
                <div class="border-box bg-white p-1.5 shadow-xs flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-1 font-sans">
                            Comisiones de Viaje
                        </h4>
                        <div class="flex flex-col gap-0.5 text-[8.5px] font-sans">
                            <div class="flex justify-between items-center">
                                <span class="font-semibold text-slate-600">Address Comm (%):</span>
                                <strong class="font-mono">${addressCommPct}%</strong>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="font-semibold text-slate-600">Broker Comm (%):</span>
                                <strong class="font-mono">${brokerCommPct}%</strong>
                            </div>
                            <table class="w-full border-collapse border-t border-slate-100 mt-0.5 text-[8.5px] font-mono">
                                <tbody>
                                    <tr class="border-b border-slate-100">
                                        <td class="py-0.5 pl-0.5 text-slate-500">Address (USD)</td>
                                        <td class="text-right py-0.5 pr-0.5 font-bold">${this.fmtCur(calc.addressCommUsd)}</td>
                                    </tr>
                                    <tr class="border-b border-slate-100">
                                        <td class="py-0.5 pl-0.5 text-slate-500">Broker (USD)</td>
                                        <td class="text-right py-0.5 pr-0.5 font-bold">${this.fmtCur(calc.brokerCommUsd)}</td>
                                    </tr>
                                    <tr class="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                        <td class="py-0.5 pl-0.5 font-sans uppercase text-[8px]">Total Comm</td>
                                        <td class="text-right py-0.5 pr-0.5 text-rose-600 font-bold">${calc.totalCommUsd > 0 ? `-${this.fmtCur(calc.totalCommUsd)}` : '$0'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- DEMURRAGE & BANDAS -->
                <div class="border-box bg-white p-1.5 shadow-xs flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-1 font-sans flex items-center justify-between">
                            <span>Demurrage (Estadías por Buque)</span>
                            <span class="text-[8px] font-mono text-amber-700 font-bold">$ / DÍA</span>
                        </h4>
                        <div class="grid grid-cols-4 gap-1 text-center font-mono text-[8px] mb-1">
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="font-bold text-slate-500 text-[7.5px]">MOQUEGUA</div>
                                <div class="font-black text-slate-800">${this.fmtNum(getDemurrageVal('MOQUEGUA'), 0)}</div>
                            </div>
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="font-bold text-slate-500 text-[7.5px]">TABLONES</div>
                                <div class="font-black text-slate-800">${this.fmtNum(getDemurrageVal('TABLONES'), 0)}</div>
                            </div>
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="font-bold text-slate-500 text-[7.5px]">CONCON</div>
                                <div class="font-black text-slate-800">${this.fmtNum(getDemurrageVal('CONCON'), 0)}</div>
                            </div>
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="font-bold text-slate-500 text-[7.5px]">HUEMUL</div>
                                <div class="font-black text-slate-800">${this.fmtNum(getDemurrageVal('HUEMUL'), 0)}</div>
                            </div>
                        </div>

                        <h4 class="text-[8.5px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-0.5 font-sans">
                            Bandas Tarifarias por Volumen ($/MT)
                        </h4>
                        <div class="grid grid-cols-4 gap-1 text-center font-mono text-[8px]">
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="text-slate-400 text-[7px]">10K-11.4K</div>
                                <div class="font-bold text-slate-700">${this.fmtCur(tariffTiers?.[0]?.rate || 0)}</div>
                            </div>
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="text-slate-400 text-[7px]">11.5K-12K</div>
                                <div class="font-bold text-slate-700">${this.fmtCur(tariffTiers?.[1]?.rate || 0)}</div>
                            </div>
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="text-slate-400 text-[7px]">12K-12.5K</div>
                                <div class="font-bold text-slate-700">${this.fmtCur(tariffTiers?.[2]?.rate || 0)}</div>
                            </div>
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="text-slate-400 text-[7px]">12.5K-14.5K</div>
                                <div class="font-bold text-slate-700">${this.fmtCur(tariffTiers?.[3]?.rate || 0)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- COLUMNA 4: FINANCIAL VOYAGE RESULT (CASILLA VERDE P/L & TCE) -->
            <div class="border-box bg-emerald-50/50 border-emerald-300 p-2 shadow-sm flex flex-col justify-between h-full">
                <div>
                    <div class="flex items-center justify-between border-b border-emerald-300 pb-1 mb-1">
                        <h4 class="text-[10px] font-black text-emerald-950 uppercase tracking-tight font-sans">
                            FINANCIAL VOYAGE RESULT
                        </h4>
                        <span class="text-[8px] font-mono font-black text-emerald-800 uppercase px-1 py-0.2 bg-emerald-100 rounded">
                            P/L & TCE
                        </span>
                    </div>

                    <div class="flex flex-col gap-0.5 font-mono text-[8.5px]">
                        
                        <!-- REVENUE (FLETE) -->
                        <div class="flex justify-between items-center py-0.5 font-bold text-emerald-950 border-b border-emerald-200">
                            <span class="font-sans">Revenue (${this.fmtNum(calc.totalQuantity, 0)} MT × ${this.fmtCur(calc.totalQuantity > 0 ? calc.totalFreight / calc.totalQuantity : 0)}/MT)</span>
                            <span>${this.fmtCur(calc.totalFreight)}</span>
                        </div>

                        <!-- INGRESO DEMURRAGE (SI HAY) -->
                        ${calc.demurrageRevenue > 0 ? `
                            <div class="flex justify-between items-center text-emerald-800 text-[8px]">
                                <span class="font-sans">(+) Ingreso Demurrage (${this.fmtCur(vesselParams?.demurrage_rate || 20000)}/d × ${this.fmtNum(calc.totalDemurrageDays, 2)} d)</span>
                                <span>+${this.fmtCur(calc.demurrageRevenue)}</span>
                            </div>
                        ` : ''}

                        <!-- REFACTURACIÓN MUELLAJE -->
                        ${calc.refacturacionMuellaje > 0 ? `
                            <div class="flex justify-between items-center text-emerald-800 text-[8px] italic">
                                <span class="font-sans">(+) Refacturación Muellaje (al cliente)</span>
                                <span>+${this.fmtCur(calc.refacturacionMuellaje)}</span>
                            </div>
                        ` : ''}

                        <!-- HIRE OPERATIVO -->
                        <div class="flex justify-between items-center text-slate-700 text-[8px]">
                            <span class="font-sans">(-) Hire (${this.fmtCur(calc.tceReq)}/d × ${this.fmtNum(calc.totalSeaDays + calc.totalPortDays, 2)} d)</span>
                            <span>-${this.fmtCur(calc.standardHireCost || calc.hireUsd)}</span>
                        </div>

                        <!-- ARRIENDO NAVE (CHARTER) SI HAY -->
                        ${(Number(calc.charterHireCost || charterHireCost || 0) > 0) ? `
                            <div class="flex justify-between items-center text-slate-700 text-[8px]">
                                <span class="font-sans">(-) Arriendo Nave (Charter)</span>
                                <span>-${this.fmtCur(calc.charterHireCost || charterHireCost)}</span>
                            </div>
                        ` : ''}

                        <!-- HIRE DEMURRAGE (SI HAY) -->
                        ${calc.demurrageHireCost > 0 ? `
                            <div class="flex justify-between items-center text-rose-800 text-[8px]">
                                <span class="font-sans">(-) Costo Demurrage (${this.fmtCur(calc.tceReq)}/d × ${this.fmtNum(calc.totalDemurrageDays, 2)} d)</span>
                                <span>-${this.fmtCur(calc.demurrageHireCost)}</span>
                            </div>
                        ` : ''}

                        <!-- BUNKER IFO -->
                        <div class="flex justify-between items-center text-slate-700 text-[8px]">
                            <span class="font-sans">(-) Bunker IFO (${this.fmtNum(calc.totalIfoTons, 1)} T × ${this.fmtCur(bunkerPriceIfo)}/T)</span>
                            <span>-${this.fmtCur(calc.ifoCost)}</span>
                        </div>

                        <!-- BUNKER MDO -->
                        <div class="flex justify-between items-center text-slate-700 text-[8px]">
                            <span class="font-sans">(-) Bunker MDO (${this.fmtNum(calc.totalMdoTons, 1)} T × ${this.fmtCur(bunkerPriceMdo)}/T)</span>
                            <span>-${this.fmtCur(calc.mdoCost)}</span>
                        </div>

                        <!-- GASTOS PUERTO DESGLOSADOS (POL, POD, LOADING MASTER, MUELLAJE) -->
                        ${(calc.portCostItems || []).map(item => `
                            ${item.base_agency_cost >= 1 ? `
                                <div class="flex justify-between items-center text-slate-700 text-[8px]">
                                    <span class="font-sans">(-) ${item.action === 'BUNKERING' ? item.label : `Port Costs ${item.label}`}</span>
                                    <span>-${this.fmtCur(item.base_agency_cost)}</span>
                                </div>
                            ` : ''}
                            ${item.loading_master_cost >= 1 ? `
                                <div class="flex justify-between items-center text-slate-700 text-[8px]">
                                    <span class="font-sans">(-) Loading Master (${item.port_id})</span>
                                    <span>-${this.fmtCur(item.loading_master_cost)}</span>
                                </div>
                            ` : ''}
                            ${item.muellaje_cost >= 1 ? `
                                <div class="flex justify-between items-center text-slate-700 text-[8px]">
                                    <span class="font-sans">(-) Muellaje (${item.port_id})</span>
                                    <span>-${this.fmtCur(item.muellaje_cost)}</span>
                                </div>
                            ` : ''}
                        `).join('')}

                        <!-- COMISIONES TOTAL -->
                        ${(calc.totalCommUsd > 0 || (addressCommPct + brokerCommPct) > 0) ? `
                            <div class="flex justify-between items-center text-slate-700 text-[8px]">
                                <span class="font-sans">(-) Comisiones (${(addressCommPct + brokerCommPct)}%)</span>
                                <span>-${this.fmtCur(calc.totalCommUsd)}</span>
                            </div>
                        ` : ''}

                    </div>
                </div>

                <!-- VOYAGE RESULT / P&L & TCE SUMMARY -->
                <div class="mt-1 pt-1 border-t-2 border-emerald-400 flex flex-col gap-0.5">
                    
                    <div class="flex justify-between items-baseline bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300">
                        <span class="font-black text-emerald-950 uppercase text-[9.5px]">VOYAGE RESULT / P&L</span>
                        <span class="font-black font-mono text-[11.5px] ${calc.voyageResultPnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                            ${this.fmtCur(calc.voyageResultPnl)}
                        </span>
                    </div>

                    <div class="grid grid-cols-3 gap-1 pt-0.5 text-center font-mono text-[8px]">
                        <div class="bg-white p-0.5 rounded border border-emerald-200">
                            <div class="text-slate-500 font-bold text-[7px] uppercase">TCE REALIZADO</div>
                            <div class="font-black text-emerald-800 text-[8.5px]">${this.fmtCur(calc.tceRealizado)}/d</div>
                        </div>
                        <div class="bg-white p-0.5 rounded border border-emerald-200">
                            <div class="text-slate-500 font-bold text-[7px] uppercase">TCE REQUERIDO</div>
                            <div class="font-black text-slate-800 text-[8.5px]">${this.fmtCur(calc.tceReq)}/d</div>
                        </div>
                        <div class="bg-white p-0.5 rounded border border-emerald-200">
                            <div class="text-slate-500 font-bold text-[7px] uppercase">DIFERENCIA TCE</div>
                            <div class="font-black text-[8.5px] ${calc.tceDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                                ${calc.tceDiff >= 0 ? '+' : ''}${this.fmtCur(calc.tceDiff)}/d
                            </div>
                        </div>
                    </div>

                </div>

                <!-- FORMATO DE AUDITORÍA Y VALIDACIÓN COMERCIAL -->
                <div class="mt-1 pt-0.5 border-t border-dashed border-slate-300">
                    <div class="flex items-center justify-between mb-0.5">
                        <span class="text-[7.5px] font-extrabold uppercase text-slate-800 tracking-wider">
                            ✍️ REGISTRO DE AUDITORÍA Y VALIDACIÓN MATEMÁTICA (V°B° COMERCIAL)
                        </span>
                        <span class="text-[7px] font-bold text-slate-500 uppercase">
                            NAVIERA PETRAL S.A.
                        </span>
                    </div>
                    
                    <div class="flex flex-col gap-0.5 text-[7.5px] bg-slate-50/80 p-1 rounded border border-slate-200 font-sans">
                        <!-- Fila 1: Revisado por -->
                        <div class="flex items-baseline justify-between gap-1">
                            <span class="font-bold text-slate-700 whitespace-nowrap">Revisado por:</span>
                            <div class="flex-1 border-b border-slate-400 border-dotted h-2"></div>
                        </div>

                        <!-- Fila 2: Fecha -->
                        <div class="flex items-baseline justify-between gap-1">
                            <span class="font-bold text-slate-700 whitespace-nowrap">Fecha:</span>
                            <div class="flex-1 border-b border-slate-400 border-dotted h-2"></div>
                        </div>

                        <!-- Fila 3: Dictamen -->
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-slate-700">Dictamen:</span>
                            <div class="flex items-center gap-3 font-bold text-[7px]">
                                <span class="text-emerald-700 flex items-center gap-1">
                                    <span class="inline-block w-2 h-2 border border-emerald-600 rounded-sm bg-white"></span> APROBADO
                                </span>
                                <span class="text-amber-700 flex items-center gap-1">
                                    <span class="inline-block w-2 h-2 border border-amber-600 rounded-sm bg-white"></span> OBSERVADO
                                </span>
                            </div>
                        </div>

                        <!-- Fila 4: Firma -->
                        <div class="flex items-baseline justify-between gap-1">
                            <span class="font-bold text-slate-700 whitespace-nowrap">Firma:</span>
                            <div class="flex-1 border-b border-slate-400 border-dotted h-2"></div>
                        </div>
                    </div>
                </div>

            </div>

        </div>

        <!-- FOOTER OFICIAL PETRAL -->
        <div class="flex items-center justify-between text-[7.5px] font-mono text-slate-500 pt-1 mt-1 border-t border-slate-200">
            <span>Ruta: <strong>${selectedRouteName || selectedRouteId}</strong> &nbsp;|&nbsp; Emitido por: <strong>${printedBy || 'Usuario Comercial'}</strong></span>
            <span>Emisión: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} &nbsp;|&nbsp; NAVIERA PETRAL S.A.</span>
        </div>

    </div>
    
    <script>
        async function downloadDirectPdf() {
            const btn = document.getElementById('btn-download-pdf');
            if (btn) {
                btn.innerText = '⏳ Generando PDF Oficial...';
                btn.disabled = true;
            }
            try {
                const element = document.getElementById('pdf-content-page');
                const styles = Array.from(document.querySelectorAll('style')).map(s => s.outerHTML).join('\n');
                const headContent = '<meta charset="UTF-8"><title>PETRAL_MULTICOTIZADOR</title>' + styles;
                const fullHtml = '<!DOCTYPE html><html lang="es"><head>' + headContent + '</head><body style="margin:0;padding:0;background:#ffffff;">' + element.outerHTML + '</body></html>';
                const filename = 'PETRAL_MULTICOTIZADOR_${(selectedClient || 'CLIENTE').replace(/[^a-zA-Z0-9_-]/g, '_')}_${(selectedVessel || 'BUQUE').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf';
                
                const response = await fetch('/api/v1/utils/generate-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ html: fullHtml, filename: filename })
                });

                if (!response.ok) {
                    throw new Error('Servidor retornó estado: ' + response.status);
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 10000);
            } catch (err) {
                console.warn('Backend PDF endpoint no disponible, recurriendo a exportación en cliente:', err);
                if (window.html2pdf) {
                    const element = document.getElementById('pdf-content-page');
                    const opt = {
                        margin: 0,
                        filename: 'PETRAL_MULTICOTIZADOR_${(selectedClient || 'CLIENTE').replace(/[^a-zA-Z0-9_-]/g, '_')}_${(selectedVessel || 'BUQUE').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
                    };
                    window.html2pdf().set(opt).from(element).save();
                } else {
                    window.print();
                }
            } finally {
                if (btn) {
                    btn.innerText = '📥 Descargar PDF Directo (Foxit Ready)';
                    btn.disabled = false;
                }
            }
        }
    </script>

</body>
</html>`;
    }
}
