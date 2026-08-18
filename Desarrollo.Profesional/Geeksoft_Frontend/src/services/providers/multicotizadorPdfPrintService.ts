/**
 * Servicio Independiente de Impresión y Exportación a PDF para el Multicotizador
 * Formato: A4 Horizontal (Landscape 297mm x 210mm) de Alta Fidelidad
 * Diseñado conforme a la arquitectura modular de servicios provider de PETRAL.
 */

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
            tariffTiers, demurrageRatesMap, printedBy
        } = data;

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

        // 1. Cálculos de Tramos & Itinerario
        let totalDist = 0;
        let totalSeaDays = 0;
        let totalPortDays = 0;
        let totalQuantity = 0;
        let totalPortCosts = 0;
        let totalFreight = 0;
        let totalBunkerCost = 0;
        let totalIfoTons = 0;
        let totalMdoTons = 0;

        const legRowsHtml: string[] = [];

        // Fila 0: Origen Inicial
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
                <td class="text-right text-slate-400">-</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-center font-semibold text-slate-500">${pCfg0.action || 'NONE'}</td>
                <td class="text-center text-slate-400">-</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-right text-slate-700">${mCost0 > 0 ? this.fmtCur(mCost0) : '$0'}</td>
                <td class="text-right text-slate-700">${flete0 > 0 ? this.fmtCur(flete0) : '$0'}</td>
                <td class="text-right text-slate-400">-</td>
                <td class="text-center text-slate-400">-</td>
            </tr>
        `);

        // Filas de Tramos (1 .. N)
        tramos.forEach((tr, idx) => {
            const distVal = Number(tr.route_distance || 0);
            const rawWf = Number(tr.weather_factor || 0);
            const wfPct = rawWf > 1 ? rawWf : (rawWf * 100);
            const speedVal = Math.max(1, Number(tr.speed || vObj?.vessel_speed || vesselParams?.vessel_speed || 11));
            const calcSeaDays = distVal > 0 ? (distVal * (1 + (wfPct / 100))) / (speedVal * 24) : 0;

            const pCfg = puertosConfig[idx + 1] || {};
            const qVal = Number(pCfg.quantity || 0);
            const rVal = Math.max(1, Number(pCfg.op_rate || 500));
            const rUnit = pCfg.rate_unit || 'TH';
            const tcVal = Number(pCfg.time_to_count !== undefined && pCfg.time_to_count !== '' ? pCfg.time_to_count : 6);
            const posVal = Number(pCfg.positioning || 0);

            const idleDays = pCfg.action !== 'NONE' ? ((tcVal + posVal) / 24) : 0;
            const opDays = pCfg.action !== 'NONE' ? ((qVal / rVal) / 24) : 0;
            const calcPortDays = idleDays + opDays;

            const ifoSeaRatio = Number(vesselParams?.consumption_sea_ifo || vObj?.consumption_sea_ifo || 14.5);
            const mdoSeaRatio = Number(vesselParams?.consumption_sea_mdo || vObj?.consumption_sea_mdo || 0.1);
            const ifoIdleRatio = Number(vesselParams?.consumption_idle_ifo || vObj?.consumption_idle_ifo || 3.5);
            const mdoIdleRatio = Number(vesselParams?.consumption_idle_mdo || vObj?.consumption_idle_mdo || 0.1);
            const ifoLoadRatio = Number(vesselParams?.consumption_load_ifo || vObj?.consumption_load_ifo || ifoIdleRatio);
            const mdoLoadRatio = Number(vesselParams?.consumption_load_mdo || vObj?.consumption_load_mdo || mdoIdleRatio);
            const ifoDischRatio = Number(vesselParams?.consumption_disch_ifo || vObj?.consumption_disch_ifo || 5.0);
            const mdoDischRatio = Number(vesselParams?.consumption_disch_mdo || vObj?.consumption_disch_mdo || mdoIdleRatio);

            const opIfoRate = pCfg.action === 'DESCARGAR' ? ifoDischRatio : pCfg.action === 'CARGAR' ? ifoLoadRatio : ifoIdleRatio;
            const opMdoRate = pCfg.action === 'DESCARGAR' ? mdoDischRatio : pCfg.action === 'CARGAR' ? mdoLoadRatio : mdoIdleRatio;

            const ifoTons = (calcSeaDays * ifoSeaRatio) + (idleDays * ifoIdleRatio) + (opDays * opIfoRate);
            const mdoTons = (calcSeaDays * mdoSeaRatio) + (idleDays * mdoIdleRatio) + (opDays * opMdoRate);
            const legBunkerCost = (ifoTons * (bunkerPriceIfo || 0)) + (mdoTons * (bunkerPriceMdo || 0));

            totalIfoTons += ifoTons;
            totalMdoTons += mdoTons;

            const fRate = Number(pCfg.freight_rate || 0);
            const legFreight = pCfg.action === 'DESCARGAR' ? (qVal * fRate) : 0;
            const isMejillonesDischarge = (tr.destination_port_id || '').trim().toUpperCase() === 'MEJILLONES' && pCfg.action === 'DESCARGAR';
            const mVal = Number(pCfg.manual_port_cost) || 0;
            const muellVal = Number(pCfg.muellaje_cost) || (isMejillonesDischarge ? 33333 : (pCfg.action === 'CARGAR' ? 7000 : pCfg.action === 'DESCARGAR' ? 6000 : 0));
            const legPortCost = Math.max(mVal, muellVal);

            totalDist += distVal;
            totalSeaDays += calcSeaDays;
            totalPortDays += calcPortDays;
            if (pCfg.action === 'DESCARGAR' || pCfg.action === 'CARGAR') totalQuantity += qVal;
            totalPortCosts += legPortCost;
            totalFreight += legFreight;
            totalBunkerCost += legBunkerCost;

            const isBallast = tr.type === 'BALLAST';
            const badgeClass = isBallast ? 'badge-ballast' : 'badge-laden';
            const isRefacturado = refacturarMuellajeMap[idx + 1] !== false;

            legRowsHtml.push(`
                <tr class="leg-row">
                    <td class="text-center font-bold">${idx + 1}</td>
                    <td class="text-center"><span class="badge ${badgeClass}">${tr.type}</span></td>
                    <td class="text-left font-bold text-slate-800">${tr.destination_port_id || '-'}</td>
                    <td class="text-right">${distVal > 0 ? this.fmtNum(distVal, 0) : '-'}</td>
                    <td class="text-right">${wfPct > 0 ? this.fmtNum(wfPct, 1) : '-'}</td>
                    <td class="text-right">${speedVal > 0 ? this.fmtNum(speedVal, 0) : '-'}</td>
                    <td class="text-right font-medium">${calcSeaDays > 0 ? this.fmtNum(calcSeaDays, 2) : '0.00'}</td>
                    <td class="text-right font-medium">${calcPortDays > 0 ? this.fmtNum(calcPortDays, 2) : '0.00'}</td>
                    <td class="text-right">${pCfg.action !== 'NONE' ? tcVal : '-'}</td>
                    <td class="text-right">${pCfg.action !== 'NONE' ? posVal : '-'}</td>
                    <td class="text-center font-extrabold ${pCfg.action === 'CARGAR' ? 'text-blue-700' : pCfg.action === 'DESCARGAR' ? 'text-emerald-700' : 'text-slate-500'}">${pCfg.action || 'NONE'}</td>
                    <td class="text-center">${pCfg.action !== 'NONE' ? `${rVal} ${rUnit === 'TH' ? 'T/H' : 'T/D'}` : '-'}</td>
                    <td class="text-right font-semibold">${qVal > 0 ? this.fmtNum(qVal, 0) : '-'}</td>
                    <td class="text-right font-semibold">${fRate > 0 ? this.fmtNum(fRate, 0) : '-'}</td>
                    <td class="text-right font-bold text-slate-800">${legPortCost > 0 ? this.fmtCur(legPortCost) : '$0'}</td>
                    <td class="text-right font-bold text-blue-900">${legFreight > 0 ? this.fmtCur(legFreight) : '$0'}</td>
                    <td class="text-right font-bold text-amber-900">${legBunkerCost > 0 ? this.fmtCur(legBunkerCost) : '$0'}</td>
                    <td class="text-right">
                        ${muellVal > 0 ? `<span>${this.fmtCur(muellVal)} ${isRefacturado ? '<span class="rf-badge">RF</span>' : ''}</span>` : '-'}
                    </td>
                </tr>
            `);
        });

        // 2. Desglose de Gastos de Puerto Dinámicos
        const portCostItemsHtml: string[] = [];
        puertosConfig.forEach((p, i) => {
            if (p.action === 'NONE') return;
            const pId = i === 0 ? originPort : (tramos[i - 1]?.destination_port_id || '');
            const isMejillonesDischarge = (pId || '').trim().toUpperCase() === 'MEJILLONES' && p.action === 'DESCARGAR';
            const mVal = Number(p.manual_port_cost) || 0;
            const muellVal = Number(p.muellaje_cost) || (isMejillonesDischarge ? 33333 : (p.action === 'CARGAR' ? 7000 : p.action === 'DESCARGAR' ? 6000 : 0));
            const totalItemCost = Math.max(mVal, muellVal);
            const baseAgencyCost = Math.max(0, totalItemCost - muellVal);

            if (baseAgencyCost > 0) {
                portCostItemsHtml.push(`
                    <tr class="border-b border-slate-100">
                        <td class="py-0.5 pl-1.5 text-slate-700">Port Costs POD (${pId})</td>
                        <td class="text-right py-0.5 pr-1.5 font-bold">${this.fmtCur(baseAgencyCost)}</td>
                    </tr>
                `);
            }
            if (muellVal > 0) {
                portCostItemsHtml.push(`
                    <tr class="border-b border-slate-100 bg-slate-50/40">
                        <td class="py-0.5 pl-1.5 text-slate-700">Muellaje (${pId})</td>
                        <td class="text-right py-0.5 pr-1.5 font-bold text-slate-800">${this.fmtCur(muellVal)}</td>
                    </tr>
                `);
            }
        });

        // 3. Cálculos Financieros del Viaje
        const ifoCost = totalIfoTons * (bunkerPriceIfo || 0);
        const mdoCost = totalMdoTons * (bunkerPriceMdo || 0);
        const grandBunkerTotal = ifoCost + mdoCost;

        const liveRefacturacionMuellaje = puertosConfig.reduce((sum, p, i) => {
            if (p.action === 'NONE') return sum;
            const pId = i === 0 ? originPort : (tramos[i - 1]?.destination_port_id || '');
            const isMejillonesDischarge = (pId || '').trim().toUpperCase() === 'MEJILLONES' && p.action === 'DESCARGAR';
            const muellCost = Number(p.muellaje_cost) || (isMejillonesDischarge ? 33333 : (p.action === 'CARGAR' ? 7000 : p.action === 'DESCARGAR' ? 6000 : 0));
            if (refacturarMuellajeMap[i] !== false && muellCost > 0) {
                return sum + muellCost;
            }
            return sum;
        }, 0);

        const totalDays = totalSeaDays + totalPortDays;
        const tceReq = Number(vesselParams?.tce_required || 15000);
        const hireUsd = tceReq * totalDays;

        const addressCommUsd = totalFreight * (addressCommPct / 100);
        const brokerCommUsd = totalFreight * (brokerCommPct / 100);
        const totalCommUsd = addressCommUsd + brokerCommUsd;

        const voyageResultPnl = (totalFreight + liveRefacturacionMuellaje) - (hireUsd + grandBunkerTotal + totalPortCosts + totalCommUsd);
        const tceRealizado = totalDays > 0 ? (((totalFreight + liveRefacturacionMuellaje) - (grandBunkerTotal + totalPortCosts + totalCommUsd)) / totalDays) : 0;
        const tceDiff = tceRealizado - tceReq;

        const nowFormatted = new Date().toLocaleString('es-PE', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        // Demurrage items
        const demurrageMap = demurrageRatesMap || {
            'MOQUEGUA': 25000,
            'TABLONES': 25000,
            'CONCON': 25000,
            'HUEMUL': 25000
        };

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>PETRAL_MULTICOTIZADOR_${selectedClient}_${selectedVessel || 'BUQUE'}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700;800&family=Geist:wght@400;500;600;700;800;900&display=swap');
        
        * {
            box-sizing: border-box;
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

        /* Dimensiones fijas A4 Horizontal (Landscape 297mm x 210mm) */
        @page {
            size: 297mm 210mm;
            margin: 3mm 4mm;
        }

        @media print {
            @page {
                size: 297mm 210mm;
                margin: 3mm 4mm;
            }
            .no-print {
                display: none !important;
            }
            body {
                background: #ffffff !important;
                padding: 0 !important;
            }
            .a4-container {
                box-shadow: none !important;
                border: none !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
            }
        }

        .a4-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
        }

        .badge {
            display: inline-block;
            padding: 1px 3.5px;
            font-size: 7.5px;
            font-weight: 800;
            border-radius: 3px;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }
        .badge-ballast {
            background-color: #dbeafe;
            color: #1e40af;
            border: 1px solid #bfdbfe;
        }
        .badge-laden {
            background-color: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
        }
        .rf-badge {
            background-color: #2563eb;
            color: #ffffff;
            font-size: 7.5px;
            font-weight: 900;
            padding: 0.5px 3px;
            border-radius: 2px;
            margin-left: 2px;
        }

        table.dense-table th {
            padding: 3px 2px;
            font-size: 8.5px;
            line-height: 1.1;
        }
        table.dense-table td {
            padding: 2.5px 3px;
            font-size: 9.5px;
            line-height: 1.15;
        }

        .border-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
        }
    </style>
</head>
<body class="p-2">

    <!-- BARRA SUPERIOR DE CONTROL PARA IMPRESIÓN (NO IMPRIMIBLE) -->
    <div class="no-print mb-2 p-2 bg-slate-900 text-white rounded-lg flex items-center justify-between shadow-md w-full">
        <div class="flex items-center gap-3">
            <span class="text-xs font-black uppercase tracking-wider text-blue-400">📄 Multicotizador PETRAL • Exportador Ejecutivo PDF A4</span>
            <span class="text-[11px] text-slate-300 font-mono">Orientación: <strong>Horizontal (Landscape)</strong></span>
        </div>
        <div class="flex items-center gap-2">
            <button onclick="window.print()" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded shadow transition-all cursor-pointer flex items-center gap-1.5">
                <span>🖨️ Imprimir / Guardar como PDF</span>
            </button>
            <button onclick="window.close()" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded transition-all cursor-pointer">
                <span>✕ Cerrar</span>
            </button>
        </div>
    </div>

    <!-- DOCUMENTO A4 LANDSCAPE -->
    <div class="a4-container flex flex-col gap-1.5 text-slate-800">

        <!-- 1. BARRA SUPERIOR DE PASOS COMERCIALES (REDUCIDA 2 PUNTOS) -->
        <div class="border-box bg-slate-50/80 p-0.5 px-1 flex items-center justify-between gap-1 text-[8.5px] font-sans">
            
            <!-- PASO 1: CLIENTE -->
            <div class="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 shadow-xs shrink-0">
                <span class="font-black text-slate-500 uppercase text-[7.5px]">1. CLIENTE</span>
                <span class="badge ${clientType === 'ACTIVOS' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}">${clientType}</span>
                <strong class="text-blue-900 font-extrabold uppercase text-[8.5px]">${selectedClient || 'NEXA'}</strong>
            </div>

            <!-- PASO 2: RUTA -->
            <div class="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 shadow-xs shrink-0">
                <span class="font-black text-slate-500 uppercase text-[7.5px]">2. RUTA</span>
                <span class="font-bold text-slate-800 text-[8px] truncate max-w-[150px]">${selectedRouteName || '+ NUEVA RUTA'}</span>
            </div>

            <!-- PASO 3: COTIZACIÓN -->
            <div class="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 shadow-xs shrink-0">
                <span class="font-black text-slate-500 uppercase text-[7.5px]">3. COTIZACIÓN</span>
                <span class="font-bold text-blue-950 font-mono text-[8px] truncate max-w-[200px]">${selectedRouteId || 'COTIZACIÓN ACTUAL'}</span>
            </div>

            <!-- PASO 4: BUQUE -->
            <div class="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 shadow-xs shrink-0">
                <span class="font-black text-slate-500 uppercase text-[7.5px]">4. BUQUE</span>
                <strong class="font-black text-slate-900 uppercase text-[8.5px]">${selectedVessel || 'TABLONES'}</strong>
            </div>

            <!-- PASO 5: VALIDEZ -->
            <div class="flex items-center gap-1 bg-white border border-slate-300 rounded px-1.5 py-0.5 shadow-xs shrink-0">
                <span class="font-black text-slate-500 uppercase text-[7.5px]">5. VALIDEZ</span>
                <span class="text-slate-400 font-semibold text-[7.5px]">INICIO:</span>
                <strong class="font-mono text-slate-800 text-[8px]">${this.fmtDate(validFrom)}</strong>
                <span class="text-slate-300">|</span>
                <span class="text-slate-400 font-semibold text-[7.5px]">FIN:</span>
                <strong class="font-mono text-slate-800 text-[8px]">${this.fmtDate(validTo)}</strong>
            </div>

            <!-- EMISIÓN / LOGO -->
            <div class="flex items-center gap-1 pr-1 text-[7.5px] font-mono text-slate-400 shrink-0">
                <span>🗓️ ${nowFormatted}</span>
            </div>
        </div>

        <!-- 2. FICHA TÉCNICA DEL BUQUE (VESSEL FACT SHEET HEADER) -->
        <div class="border-box bg-white overflow-hidden shadow-xs">
            <table class="w-full border-collapse font-mono dense-table table-fixed">
                <thead>
                    <tr class="bg-slate-100/90 border-b border-slate-300 font-sans text-slate-600 font-bold uppercase">
                        <th class="border-r border-slate-300 text-left pl-1.5 text-slate-800 font-black" style="width: 9%;">
                            VESSEL: ${selectedVessel || 'TABLONES'}
                        </th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">GRT (t)</th>
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
                            📌 ${bunkerSource === 'COTIZACION' ? 'Cotización / Viaje Actual' : bunkerSource === 'MAESTRO_BUNKER' ? 'Maestro Búnker' : 'Maestro Contratos'}
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
                        <th class="border-r border-slate-200 text-center" style="width: 5%;">TIPO</th>
                        <th class="border-r border-slate-200 text-left pl-1" style="width: 10%;">PUERTO</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 5%;">DIST (NM)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4%;">W.F (%)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">VEL (KN)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 5%;">DÍAS MAR</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 5%;">DÍAS PTO</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 6.5%;">TIME TO COUNT (H)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">POSIC (H)</th>
                        <th class="border-r border-slate-200 text-center" style="width: 6.5%;">OP. DEST</th>
                        <th class="border-r border-slate-200 text-center" style="width: 6.5%;">RITMO (Q/D)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 6%;">Q (MT)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 4.5%;">F ($/T)</th>
                        <th class="border-r border-slate-200 text-right pr-1" style="width: 6.5%;">COSTO PTO</th>
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
                        <td class="text-right pr-1 py-1 font-black">${this.fmtNum(totalDist, 1)}</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtNum(totalSeaDays, 2)}</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtNum(totalPortDays, 2)}</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-center py-1">-</td>
                        <td class="text-center py-1">-</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtNum(totalQuantity, 1)}</td>
                        <td class="text-right pr-1 py-1">-</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtCur(totalPortCosts)}</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtCur(totalFreight)}</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtCur(totalBunkerCost)}</td>
                        <td class="text-right pr-1 py-1 font-black">${this.fmtCur(liveRefacturacionMuellaje)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <!-- 4. TARJETAS INFERIORES EN 4 COLUMNAS -->
        <div class="grid grid-cols-4 gap-1.5 items-stretch">

            <!-- COLUMNA 1: BUNKER EXPENSES & COMMENTS -->
            <div class="flex flex-col gap-1.5 h-full">
                <!-- BUNKER EXPENSES -->
                <div class="border-box bg-white p-1.5 shadow-xs flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-1 font-sans">
                            Bunker Expenses (Combustible)
                        </h4>
                        <table class="w-full border-collapse font-mono text-[9px]">
                            <thead>
                                <tr class="bg-slate-50 border-b border-slate-200 font-sans text-slate-500 font-bold">
                                    <th class="text-left py-0.5 pl-1">Fuel</th>
                                    <th class="text-right py-0.5 pr-1">Tonnage (T)</th>
                                    <th class="text-right py-0.5 pr-1">Expense (USD)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-b border-slate-100">
                                    <td class="py-0.5 pl-1 text-slate-600 font-sans">IFO (Heavy Fuel)</td>
                                    <td class="text-right py-0.5 pr-1">${this.fmtNum(totalIfoTons, 1)}</td>
                                    <td class="text-right py-0.5 pr-1 font-bold">${this.fmtCur(ifoCost)}</td>
                                </tr>
                                <tr class="border-b border-slate-100">
                                    <td class="py-0.5 pl-1 text-slate-600 font-sans">MDO (Diesel)</td>
                                    <td class="text-right py-0.5 pr-1">${this.fmtNum(totalMdoTons, 1)}</td>
                                    <td class="text-right py-0.5 pr-1 font-bold">${this.fmtCur(mdoCost)}</td>
                                </tr>
                                <tr class="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                    <td class="py-0.5 pl-1 font-sans uppercase text-[8.5px]">Total Fuel</td>
                                    <td class="text-right py-0.5 pr-1">${this.fmtNum(totalIfoTons + totalMdoTons, 1)}</td>
                                    <td class="text-right py-0.5 pr-1">${this.fmtCur(grandBunkerTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- COMMENTS -->
                <div class="border-box bg-white p-1.5 shadow-xs flex-1 flex flex-col justify-between">
                    <h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-0.5 mb-1 font-sans flex items-center justify-between">
                        <span>Comments (Observaciones)</span>
                        <span class="text-[8px] font-mono text-slate-400 font-normal">Notas comerciales</span>
                    </h4>
                    <div class="bg-slate-50 p-1.5 rounded border border-slate-200 text-[8.5px] text-slate-700 font-sans h-12 overflow-hidden italic">
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
                                    <td class="text-right py-0.5 pr-1.5">${this.fmtCur(totalPortCosts)}</td>
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
                                        <td class="text-right py-0.5 pr-0.5 font-bold">${this.fmtCur(addressCommUsd)}</td>
                                    </tr>
                                    <tr class="border-b border-slate-100">
                                        <td class="py-0.5 pl-0.5 text-slate-500">Broker (USD)</td>
                                        <td class="text-right py-0.5 pr-0.5 font-bold">${this.fmtCur(brokerCommUsd)}</td>
                                    </tr>
                                    <tr class="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                                        <td class="py-0.5 pl-0.5 font-sans uppercase text-[8px]">Total Comm</td>
                                        <td class="text-right py-0.5 pr-0.5 text-rose-600 font-bold">${totalCommUsd > 0 ? `-${this.fmtCur(totalCommUsd)}` : '$0'}</td>
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
                                <div class="font-black text-slate-800">${this.fmtNum(demurrageMap['MOQUEGUA'] || 25000, 0)}</div>
                            </div>
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="font-bold text-slate-500 text-[7.5px]">TABLONES</div>
                                <div class="font-black text-slate-800">${this.fmtNum(demurrageMap['TABLONES'] || 25000, 0)}</div>
                            </div>
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="font-bold text-slate-500 text-[7.5px]">CONCON</div>
                                <div class="font-black text-slate-800">${this.fmtNum(demurrageMap['CONCON'] || demurrageMap['CONCON TRADER'] || 25000, 0)}</div>
                            </div>
                            <div class="bg-slate-50 p-0.5 rounded border border-slate-200">
                                <div class="font-bold text-slate-500 text-[7.5px]">HUEMUL</div>
                                <div class="font-black text-slate-800">${this.fmtNum(demurrageMap['HUEMUL'] || 25000, 0)}</div>
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

            <!-- COLUMNA 4: FINANCIAL VOYAGE RESULT (P/L & TCE) -->
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

                    <div class="flex flex-col gap-0.5 font-mono text-[9px]">
                        
                        <!-- REVENUE -->
                        <div class="flex justify-between items-center py-0.5 font-bold text-emerald-950 border-b border-emerald-200">
                            <span class="font-sans">REVENUE (${this.fmtNum(totalQuantity, 0)} MT × $${this.fmtNum(puertosConfig.find(p => p.action === 'DESCARGAR')?.freight_rate || 30, 0)}/MT)</span>
                            <span>${this.fmtCur(totalFreight)}</span>
                        </div>

                        <!-- REFACTURACIÓN MUELLAJE -->
                        ${liveRefacturacionMuellaje > 0 ? `
                            <div class="flex justify-between items-center text-blue-800 text-[8.5px]">
                                <span class="font-sans">(+) Refacturación Muellaje (al cliente)</span>
                                <span>+${this.fmtCur(liveRefacturacionMuellaje)}</span>
                            </div>
                        ` : ''}

                        <!-- HIRE -->
                        <div class="flex justify-between items-center text-rose-800 text-[8.5px]">
                            <span class="font-sans">(-) Hire ($${this.fmtNum(tceReq, 0)}/d × ${this.fmtNum(totalDays, 2)} d)</span>
                            <span>-${this.fmtCur(hireUsd)}</span>
                        </div>

                        <!-- BUNKER IFO -->
                        <div class="flex justify-between items-center text-rose-800 text-[8.5px]">
                            <span class="font-sans">(-) Bunker IFO (${this.fmtNum(totalIfoTons, 1)} T × $${this.fmtNum(bunkerPriceIfo, 2)}/T)</span>
                            <span>-${this.fmtCur(ifoCost)}</span>
                        </div>

                        <!-- BUNKER MDO -->
                        <div class="flex justify-between items-center text-rose-800 text-[8.5px]">
                            <span class="font-sans">(-) Bunker MDO (${this.fmtNum(totalMdoTons, 1)} T × $${this.fmtNum(bunkerPriceMdo, 2)}/T)</span>
                            <span>-${this.fmtCur(mdoCost)}</span>
                        </div>

                        <!-- GASTOS PUERTO DESGLOSADOS -->
                        ${puertosConfig.map((p, i) => {
                            if (p.action === 'NONE') return '';
                            const pId = i === 0 ? originPort : (tramos[i - 1]?.destination_port_id || '');
                            const isMejillonesDischarge = (pId || '').trim().toUpperCase() === 'MEJILLONES' && p.action === 'DESCARGAR';
                            const mVal = Number(p.manual_port_cost) || 0;
                            const muellVal = Number(p.muellaje_cost) || (isMejillonesDischarge ? 33333 : (p.action === 'CARGAR' ? 7000 : p.action === 'DESCARGAR' ? 6000 : 0));
                            const totalItemCost = Math.max(mVal, muellVal);
                            const baseAgencyCost = Math.max(0, totalItemCost - muellVal);

                            let rows = '';
                            if (baseAgencyCost > 0) {
                                rows += `
                                    <div class="flex justify-between items-center text-rose-800 text-[8.5px]">
                                        <span class="font-sans">(-) Port Costs POD (${pId})</span>
                                        <span>-${this.fmtCur(baseAgencyCost)}</span>
                                    </div>
                                `;
                            }
                            if (muellVal > 0) {
                                rows += `
                                    <div class="flex justify-between items-center text-rose-800 text-[8.5px]">
                                        <span class="font-sans">(-) Muellaje (${pId})</span>
                                        <span>-${this.fmtCur(muellVal)}</span>
                                    </div>
                                `;
                            }
                            return rows;
                        }).join('')}

                        <!-- COMISIONES SI HAY -->
                        ${totalCommUsd > 0 ? `
                            <div class="flex justify-between items-center text-rose-800 text-[8.5px]">
                                <span class="font-sans">(-) Comisiones de Viaje</span>
                                <span>-${this.fmtCur(totalCommUsd)}</span>
                            </div>
                        ` : ''}

                    </div>
                </div>

                <!-- VOYAGE RESULT / P&L & TCE SUMMARY -->
                <div class="mt-1 pt-1 border-t-2 border-emerald-400 flex flex-col gap-0.5">
                    
                    <div class="flex justify-between items-baseline bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300">
                        <span class="font-black text-emerald-950 uppercase text-[9.5px]">VOYAGE RESULT / P&L</span>
                        <span class="font-black font-mono text-[11.5px] ${voyageResultPnl >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                            ${this.fmtCur(voyageResultPnl)}
                        </span>
                    </div>

                    <div class="grid grid-cols-3 gap-1 pt-0.5 text-center font-mono text-[8px]">
                        <div class="bg-white p-0.5 rounded border border-emerald-200">
                            <div class="text-slate-500 font-bold text-[7px] uppercase">TCE REALIZADO</div>
                            <div class="font-black text-emerald-800 text-[8.5px]">${this.fmtCur(tceRealizado)}/d</div>
                        </div>
                        <div class="bg-white p-0.5 rounded border border-emerald-200">
                            <div class="text-slate-500 font-bold text-[7px] uppercase">TCE REQUERIDO</div>
                            <div class="font-black text-slate-800 text-[8.5px]">${this.fmtCur(tceReq)}/d</div>
                        </div>
                        <div class="bg-white p-0.5 rounded border border-emerald-200">
                            <div class="text-slate-500 font-bold text-[7px] uppercase">DIFERENCIA TCE</div>
                            <div class="font-black text-[8.5px] ${tceDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                                ${tceDiff >= 0 ? '+' : ''}${this.fmtCur(tceDiff)}/d
                            </div>
                        </div>
                    </div>

                </div>

                <!-- FORMATO DE AUDITORÍA Y VALIDACIÓN COMERCIAL (Punto 4) -->
                <div class="mt-1.5 pt-1 border-t border-dashed border-slate-300">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-[8px] font-extrabold uppercase text-slate-800 tracking-wider">
                            ✍️ REGISTRO DE AUDITORÍA Y VALIDACIÓN MATEMÁTICA (V°B° COMERCIAL)
                        </span>
                        <span class="text-[7.5px] font-bold text-slate-500 uppercase">
                            NAVIERA PETRAL S.A. · CONTROL COMERCIAL
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-4 gap-2 text-[8px] bg-slate-50/70 p-1 rounded border border-slate-200">
                        <div class="border border-slate-200 rounded p-1 bg-white">
                            <span class="block text-[7px] font-bold text-slate-600 uppercase">Revisado / Auditado por:</span>
                            <div class="border-b border-slate-400 h-3 mt-3"></div>
                            <span class="block text-[6.5px] text-slate-400 mt-0.5">Nombre & Cargo</span>
                        </div>
                        <div class="border border-slate-200 rounded p-1 bg-white">
                            <span class="block text-[7px] font-bold text-slate-600 uppercase">Firma de Conformidad:</span>
                            <div class="border-b border-slate-400 h-3 mt-3"></div>
                            <span class="block text-[6.5px] text-slate-400 mt-0.5">Firma / Sello Digital</span>
                        </div>
                        <div class="border border-slate-200 rounded p-1 bg-white">
                            <span class="block text-[7px] font-bold text-slate-600 uppercase">Fecha de Auditoría:</span>
                            <div class="border-b border-slate-400 h-3 mt-3"></div>
                            <span class="block text-[6.5px] text-slate-400 mt-0.5">DD / MM / AAAA</span>
                        </div>
                        <div class="border border-slate-200 rounded p-1 bg-white">
                            <span class="block text-[7px] font-bold text-slate-600 uppercase">Dictamen:</span>
                            <div class="flex items-center gap-2 mt-2.5 font-bold text-[7.5px]">
                                <span class="text-emerald-700 flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 border border-emerald-600 rounded-sm"></span> APROBADO</span>
                                <span class="text-amber-700 flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 border border-amber-600 rounded-sm"></span> OBSERVADO</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>

        <!-- FOOTER OFICIAL PETRAL (Punto 2 & Punto 3) -->
        <div class="flex items-center justify-between text-[7.5px] font-mono text-slate-500 pt-1 mt-1 border-t border-slate-200">
            <span>Ruta: <strong>${selectedRouteName || selectedRouteId}</strong> &nbsp;|&nbsp; Emitido por: <strong>${printedBy || 'Usuario Comercial'}</strong></span>
            <span>Emisión: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} &nbsp;|&nbsp; NAVIERA PETRAL S.A.</span>
        </div>

    </div>

</body>
</html>`;
    }
}
