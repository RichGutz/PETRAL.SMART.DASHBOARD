import ExcelJS from 'exceljs';

// =========================================================================
// SISTEMA CROMÁTICO IDÉNTICO A MATRIZ PETRAL (75% Transparencia / 25% Tint)
// =========================================================================
const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
    // Clientes
    'SPCC': { bg: 'FFC0DAE8', fg: 'FF0369A1' }, // Sky pastel
    'NEXA': { bg: 'FFC3D2E0', fg: 'FF0F4C81' }, // Petral Blue pastel
    // Rutas
    'MATARANI': { bg: 'FFC1EDF4', fg: 'FF0E7490' }, // Cyan pastel
    'MARCONA': { bg: 'FFE9D5FD', fg: 'FF6B21A8' },  // Purple pastel
    'MEJILLONES': { bg: 'FFF6D1FB', fg: 'FF86198F' }, // Fuchsia pastel
    'CALLAO': { bg: 'FFC3D2E0', fg: 'FF0F4C81' }, // Blue pastel
    // Buques
    'TABLONES': { bg: 'FFF6C9C9', fg: 'FF991B1B' }, // Red soft
    'MOQUEGUA': { bg: 'FFC5E8D2', fg: 'FF166534' }, // Green soft
    'CONCON_TRADER': { bg: 'FFD1D5DA', fg: 'FF1E293B' }, // Slate soft
    'HUEMUL': { bg: 'FFD3D1F9', fg: 'FF3730A3' }, // Indigo soft
    // Secciones y Totales
    'HEADER_DARK': { bg: 'FF1E293B', fg: 'FFFFFFFF' }, // Slate 800
    'RIBBON_NAVY': { bg: 'FF0F4C81', fg: 'FFFFFFFF' }, // Petral Navy
    'TOTAL_ROW': { bg: 'FFC7CACE', fg: 'FF0F172A' }, // Slate gray
    'SUBTOTAL_ROW': { bg: 'FFFEF3C7', fg: 'FF78350F' }, // Amber soft
};

// Paleta ejecutiva para secciones apiladas en Multi-Escenario
const SECTION_THEMES = [
    { bg: 'FFD9EAD3', fg: 'FF274E13', border: 'FFB6D7A8' }, // Esmeralda suave
    { bg: 'FFFFF2CC', fg: 'FF7F6000', border: 'FFFFE599' }, // Ámbar suave
    { bg: 'FFFCE5CD', fg: 'FF783F04', border: 'FFF9CB9C' }, // Naranja suave
    { bg: 'FFCFE2F3', fg: 'FF0B5394', border: 'FF9FC5E8' }, // Azul suave
];

function getRouteColor(routeName: string) {
    const upper = (routeName || '').toUpperCase();
    if (upper.includes('MATARANI')) return COLOR_MAP['MATARANI'];
    if (upper.includes('MARCONA')) return COLOR_MAP['MARCONA'];
    if (upper.includes('MEJILLONES')) return COLOR_MAP['MEJILLONES'];
    if (upper.includes('CALLAO')) return COLOR_MAP['CALLAO'];
    return { bg: 'FFF1F5F9', fg: 'FF334155' };
}

function getVesselColor(vesselName: string) {
    const upper = (vesselName || '').toUpperCase();
    if (upper.includes('TABLONES')) return COLOR_MAP['TABLONES'];
    if (upper.includes('MOQUEGUA')) return COLOR_MAP['MOQUEGUA'];
    if (upper.includes('CONCON')) return COLOR_MAP['CONCON_TRADER'];
    if (upper.includes('HUEMUL')) return COLOR_MAP['HUEMUL'];
    return { bg: 'FFF8FAFC', fg: 'FF475569' };
}

const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

const doubleBottomBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

export interface MecVesselDetail {
    vessel: string;
    annualTons: number;
    fullLoad: number;
    annualTrips: number;
    pnlPerTrip: number;
    totalGrossMargin: number;
    volumeSharePct: number;
    daysOccupation: number;
}

export interface MecRouteRow {
    client: string;
    route: string;
    vessel: string;
    isExport: boolean;
    annualTons: number;
    fullLoad: number;
    annualTrips: number;
    pnlPerTrip: number;
    totalGrossMargin: number;
    volumeSharePct: number;
    daysOccupation: number;
    daysAvailable: number;
    vesselDetails: MecVesselDetail[];
}

export interface MecCalculatedSummary {
    totalVolumeTm: number;
    totalTrips: number;
    cabotageTrips: number;
    exportTrips: number;
    cabotageVolumeTm: number;
    exportVolumeTm: number;
    cabotageSharePct: number;
    exportSharePct: number;
    routes: MecRouteRow[];
    totalGrossMargin: number;
    totalDaysOccupation: number;
    totalDaysAvailable: number;
    vesselsUsed: string[];
}

export interface ScenarioCardItem {
    id: string;
    name: string;
    userId: string;
    startDate: string;
    endDate: string;
    createdAt?: string;
    projectionLines: any[];
    year: string;
    mec: MecCalculatedSummary;
}

/**
 * Renderiza el bloque completo de un escenario en una hoja de ExcelJS
 */
function renderScenarioSection(
    ws: ExcelJS.Worksheet,
    scenario: ScenarioCardItem,
    startRow: number,
    sectionIndex: number = 0,
    isMulti: boolean = false,
    expandedRoutes: Record<string, boolean> = {}
): number {
    const mec = scenario.mec;
    let r = startRow;

    const theme = SECTION_THEMES[sectionIndex % SECTION_THEMES.length];

    // 1. TÍTULO DE SECCIÓN / ESCENARIO
    if (isMulti) {
        ws.mergeCells(r, 1, r, 9);
        const secCell = ws.getCell(r, 1);
        secCell.value = `SECCIÓN ${sectionIndex + 1}: ${scenario.name.toUpperCase()} (Año ${scenario.year} | Autor: ${scenario.userId || 'Comercial'})`;
        secCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: theme.fg } };
        secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bg } };
        secCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        secCell.border = {
            top: { style: 'medium', color: { argb: theme.border } },
            left: { style: 'thin', color: { argb: theme.border } },
            right: { style: 'thin', color: { argb: theme.border } },
            bottom: { style: 'medium', color: { argb: theme.border } },
        };
        ws.getRow(r).height = 24;
        r += 2;
    } else {
        ws.mergeCells(r, 1, r, 9);
        const titleCell = ws.getCell(r, 1);
        titleCell.value = `Año ${scenario.year} — ${scenario.name.toUpperCase()}`;
        titleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MAP['RIBBON_NAVY'].bg } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        ws.getRow(r).height = 24;
        r += 2;
    }

    // 2. TABLA 1: DISTRIBUCIÓN MACRO POR TIPO DE TRÁFICO
    const t1Headers = ['Tipo Tráfico', 'Nº viajes', 'Volumen TM', '%'];
    const t1RowStart = r;

    // Header Tabla 1
    t1Headers.forEach((h, colIdx) => {
        const cell = ws.getCell(r, colIdx + 1);
        cell.value = h;
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MAP['HEADER_DARK'].bg } };
        cell.alignment = { vertical: 'middle', horizontal: colIdx === 0 ? 'left' : (colIdx === 1 ? 'center' : 'right') };
        cell.border = thinBorder;
    });
    ws.getRow(r).height = 20;
    r++;

    // Filas Tabla 1
    const t1Data = [
        ['Viajes cabotaje', mec.cabotageTrips, mec.cabotageVolumeTm, mec.cabotageSharePct / 100],
        ['Viajes exportación', mec.exportTrips, mec.exportVolumeTm, mec.exportSharePct / 100],
    ];

    t1Data.forEach(row => {
        const c1 = ws.getCell(r, 1);
        c1.value = row[0];
        c1.font = { name: 'Segoe UI', size: 9.5, bold: false };
        c1.border = thinBorder;

        const c2 = ws.getCell(r, 2);
        c2.value = row[1];
        c2.font = { name: 'Segoe UI', size: 9.5, bold: false };
        c2.numFmt = '#,##0';
        c2.alignment = { horizontal: 'center' };
        c2.border = thinBorder;

        const c3 = ws.getCell(r, 3);
        c3.value = row[2];
        c3.font = { name: 'Segoe UI', size: 9.5, bold: false };
        c3.numFmt = '#,##0';
        c3.alignment = { horizontal: 'right' };
        c3.border = thinBorder;

        const c4 = ws.getCell(r, 4);
        c4.value = row[3];
        c4.font = { name: 'Segoe UI', size: 9.5, bold: false };
        c4.numFmt = '0.00%';
        c4.alignment = { horizontal: 'right' };
        c4.border = thinBorder;

        ws.getRow(r).height = 18;
        r++;
    });

    // Fila Total Tabla 1
    const totT1 = ['Total', mec.totalTrips, mec.totalVolumeTm, 1.0];
    const c1Tot = ws.getCell(r, 1);
    c1Tot.value = totT1[0];
    c1Tot.font = { name: 'Segoe UI', size: 9.5, bold: true };
    c1Tot.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c1Tot.border = thinBorder;

    const c2Tot = ws.getCell(r, 2);
    c2Tot.value = totT1[1];
    c2Tot.font = { name: 'Segoe UI', size: 9.5, bold: true };
    c2Tot.numFmt = '#,##0';
    c2Tot.alignment = { horizontal: 'center' };
    c2Tot.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c2Tot.border = thinBorder;

    const c3Tot = ws.getCell(r, 3);
    c3Tot.value = totT1[2];
    c3Tot.font = { name: 'Segoe UI', size: 9.5, bold: true };
    c3Tot.numFmt = '#,##0';
    c3Tot.alignment = { horizontal: 'right' };
    c3Tot.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c3Tot.border = thinBorder;

    const c4Tot = ws.getCell(r, 4);
    c4Tot.value = totT1[3];
    c4Tot.font = { name: 'Segoe UI', size: 9.5, bold: true };
    c4Tot.numFmt = '0.00%';
    c4Tot.alignment = { horizontal: 'right' };
    c4Tot.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    c4Tot.border = thinBorder;

    ws.getRow(r).height = 19;
    r += 2;

    // 3. TABLA 2: DISTRIBUCIÓN POR RUTAS Y BUQUES
    const t2Headers = ['Puertos / Ruta', 'TM Anual', 'Full load', 'Nº viajes', 'P/L x Viaje', 'Total Margen Operativo', '%', 'Dias ocupación', 'Dias disponibles'];
    
    t2Headers.forEach((h, colIdx) => {
        const cell = ws.getCell(r, colIdx + 1);
        cell.value = h;
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MAP['HEADER_DARK'].bg } };
        cell.alignment = { vertical: 'middle', horizontal: colIdx === 0 ? 'left' : (colIdx === 3 ? 'center' : 'right') };
        cell.border = thinBorder;
    });
    ws.getRow(r).height = 20;
    r++;

    mec.routes.forEach(routeRow => {
        const routeColor = getRouteColor(routeRow.route);
        const isRouteExpanded = !!expandedRoutes[`${scenario.id}__${routeRow.route}`];

        // Fila de Ruta Principal
        const cRoute = ws.getCell(r, 1);
        cRoute.value = `▶  ${routeRow.route}`;
        cRoute.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: routeColor.fg } };
        cRoute.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: routeColor.bg } };
        cRoute.border = thinBorder;

        const cTm = ws.getCell(r, 2);
        cTm.value = routeRow.annualTons;
        cTm.font = { name: 'Segoe UI', size: 9.5, bold: true };
        cTm.numFmt = '#,##0';
        cTm.alignment = { horizontal: 'right' };
        cTm.border = thinBorder;

        const cFull = ws.getCell(r, 3);
        cFull.value = Math.round(routeRow.fullLoad);
        cFull.font = { name: 'Segoe UI', size: 9.5 };
        cFull.numFmt = '#,##0';
        cFull.alignment = { horizontal: 'right' };
        cFull.border = thinBorder;

        const cTrips = ws.getCell(r, 4);
        cTrips.value = routeRow.annualTrips;
        cTrips.font = { name: 'Segoe UI', size: 9.5, bold: true };
        cTrips.numFmt = '#,##0';
        cTrips.alignment = { horizontal: 'center' };
        cTrips.border = thinBorder;

        const cPnl = ws.getCell(r, 5);
        cPnl.value = Math.round(routeRow.pnlPerTrip);
        cPnl.font = { name: 'Segoe UI', size: 9.5, bold: true };
        cPnl.numFmt = '#,##0';
        cPnl.alignment = { horizontal: 'right' };
        cPnl.border = thinBorder;

        const cMargin = ws.getCell(r, 6);
        cMargin.value = Math.round(routeRow.totalGrossMargin);
        cMargin.font = { name: 'Segoe UI', size: 9.5, bold: true };
        cMargin.numFmt = '#,##0';
        cMargin.alignment = { horizontal: 'right' };
        cMargin.border = thinBorder;

        const cPct = ws.getCell(r, 7);
        cPct.value = routeRow.volumeSharePct / 100;
        cPct.font = { name: 'Segoe UI', size: 9.5 };
        cPct.numFmt = '0.00%';
        cPct.alignment = { horizontal: 'right' };
        cPct.border = thinBorder;

        const cDaysOcc = ws.getCell(r, 8);
        cDaysOcc.value = Math.round(routeRow.daysOccupation);
        cDaysOcc.font = { name: 'Segoe UI', size: 9.5 };
        cDaysOcc.numFmt = '#,##0';
        cDaysOcc.alignment = { horizontal: 'right' };
        cDaysOcc.border = thinBorder;

        const cDaysDisp = ws.getCell(r, 9);
        cDaysDisp.value = '';
        cDaysDisp.border = thinBorder;

        ws.getRow(r).height = 19;
        r++;

        // Desglose de Buques (si existen sub-buques o está expandido)
        if (routeRow.vesselDetails && routeRow.vesselDetails.length > 0) {
            routeRow.vesselDetails.forEach(vd => {
                const vesselColor = getVesselColor(vd.vessel);

                const cSubV = ws.getCell(r, 1);
                cSubV.value = `      ↳ ${vd.vessel}`;
                cSubV.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: vesselColor.fg } };
                cSubV.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: vesselColor.bg } };
                cSubV.border = thinBorder;

                const cSubTm = ws.getCell(r, 2);
                cSubTm.value = vd.annualTons;
                cSubTm.font = { name: 'Segoe UI', size: 9 };
                cSubTm.numFmt = '#,##0';
                cSubTm.alignment = { horizontal: 'right' };
                cSubTm.border = thinBorder;

                const cSubFull = ws.getCell(r, 3);
                cSubFull.value = Math.round(vd.fullLoad);
                cSubFull.font = { name: 'Segoe UI', size: 9 };
                cSubFull.numFmt = '#,##0';
                cSubFull.alignment = { horizontal: 'right' };
                cSubFull.border = thinBorder;

                const cSubTrips = ws.getCell(r, 4);
                cSubTrips.value = vd.annualTrips;
                cSubTrips.font = { name: 'Segoe UI', size: 9 };
                cSubTrips.numFmt = '#,##0';
                cSubTrips.alignment = { horizontal: 'center' };
                cSubTrips.border = thinBorder;

                const cSubPnl = ws.getCell(r, 5);
                cSubPnl.value = Math.round(vd.pnlPerTrip);
                cSubPnl.font = { name: 'Segoe UI', size: 9 };
                cSubPnl.numFmt = '#,##0';
                cSubPnl.alignment = { horizontal: 'right' };
                cSubPnl.border = thinBorder;

                const cSubMargin = ws.getCell(r, 6);
                cSubMargin.value = Math.round(vd.totalGrossMargin);
                cSubMargin.font = { name: 'Segoe UI', size: 9 };
                cSubMargin.numFmt = '#,##0';
                cSubMargin.alignment = { horizontal: 'right' };
                cSubMargin.border = thinBorder;

                const cSubPct = ws.getCell(r, 7);
                cSubPct.value = vd.volumeSharePct / 100;
                cSubPct.font = { name: 'Segoe UI', size: 9 };
                cSubPct.numFmt = '0.00%';
                cSubPct.alignment = { horizontal: 'right' };
                cSubPct.border = thinBorder;

                const cSubDays = ws.getCell(r, 8);
                cSubDays.value = Math.round(vd.daysOccupation);
                cSubDays.font = { name: 'Segoe UI', size: 9 };
                cSubDays.numFmt = '#,##0';
                cSubDays.alignment = { horizontal: 'right' };
                cSubDays.border = thinBorder;

                const cSubDisp = ws.getCell(r, 9);
                cSubDisp.value = '';
                cSubDisp.border = thinBorder;

                ws.getRow(r).height = 17;
                r++;
            });
        }
    });

    // Fila Total Tabla 2
    const totalRowCells = [
        ws.getCell(r, 1),
        ws.getCell(r, 2),
        ws.getCell(r, 3),
        ws.getCell(r, 4),
        ws.getCell(r, 5),
        ws.getCell(r, 6),
        ws.getCell(r, 7),
        ws.getCell(r, 8),
        ws.getCell(r, 9),
    ];

    totalRowCells[0].value = 'Total';
    totalRowCells[0].alignment = { horizontal: 'left' };

    totalRowCells[1].value = mec.totalVolumeTm;
    totalRowCells[1].numFmt = '#,##0';
    totalRowCells[1].alignment = { horizontal: 'right' };

    totalRowCells[2].value = '';

    totalRowCells[3].value = mec.totalTrips;
    totalRowCells[3].numFmt = '#,##0';
    totalRowCells[3].alignment = { horizontal: 'center' };

    totalRowCells[4].value = '-';
    totalRowCells[4].alignment = { horizontal: 'center' };

    totalRowCells[5].value = Math.round(mec.totalGrossMargin);
    totalRowCells[5].numFmt = '#,##0';
    totalRowCells[5].alignment = { horizontal: 'right' };

    totalRowCells[6].value = 1.0;
    totalRowCells[6].numFmt = '0.00%';
    totalRowCells[6].alignment = { horizontal: 'right' };

    totalRowCells[7].value = Math.round(mec.totalDaysOccupation);
    totalRowCells[7].numFmt = '#,##0';
    totalRowCells[7].alignment = { horizontal: 'right' };

    totalRowCells[8].value = Math.round(mec.totalDaysAvailable);
    totalRowCells[8].numFmt = '#,##0';
    totalRowCells[8].alignment = { horizontal: 'right' };

    totalRowCells.forEach(cell => {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLOR_MAP['TOTAL_ROW'].fg } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MAP['TOTAL_ROW'].bg } };
        cell.border = doubleBottomBorder;
    });

    ws.getRow(r).height = 22;
    r += 2;

    return r;
}

/**
 * Configura anchos y vistas de cuadrícula estándar
 */
function applyWorksheetStandards(ws: ExcelJS.Worksheet) {
    ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 0, xSplit: 0 }];
    ws.columns = [
        { width: 26 }, // Puertos / Ruta
        { width: 15 }, // TM Anual
        { width: 12 }, // Full load
        { width: 12 }, // Nº viajes
        { width: 15 }, // P/L x Viaje
        { width: 22 }, // Total Margen Operativo
        { width: 12 }, // %
        { width: 16 }, // Dias ocupación
        { width: 16 }, // Dias disponibles
    ];
}

/**
 * Exporta a Excel (.xlsx) formateado para un Escenario Individual
 */
export async function exportSingleMecExcel(
    scenario: ScenarioCardItem,
    premisasNotes: string = '',
    expandedRoutes: Record<string, boolean> = {}
): Promise<void> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PETRAL SMART DASHBOARD';
    wb.lastModifiedBy = 'Petral Financial Engine';
    wb.created = new Date();

    const sheetName = `Año_${scenario.year}_${scenario.name}`.replace(/[\/\\?*:[\]]/g, '_').substring(0, 31);
    const ws = wb.addWorksheet(sheetName);
    applyWorksheetStandards(ws);

    let r = 1;

    // Cabecera Institucional
    ws.mergeCells(r, 1, r, 9);
    const h1 = ws.getCell(r, 1);
    h1.value = 'NAVIERA PETRAL S.A. — REPORTE DE CONTROL PRESUPUESTAL';
    h1.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    h1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MAP['RIBBON_NAVY'].bg } };
    h1.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(r).height = 26;
    r++;

    ws.mergeCells(r, 1, r, 9);
    const h2 = ws.getCell(r, 1);
    h2.value = `Fecha de Emisión: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}  •  Autor: ${scenario.userId || 'Comercial'}`;
    h2.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
    h2.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(r).height = 18;
    r += 2;

    // Renderizar sección de escenario
    r = renderScenarioSection(ws, scenario, r, 0, false, expandedRoutes);

    // Premisas y Notas
    if (premisasNotes) {
        ws.mergeCells(r, 1, r, 9);
        const pTitle = ws.getCell(r, 1);
        pTitle.value = 'Premisas y Consideraciones Técnicas:';
        pTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
        r++;

        const notes = premisasNotes.split('\n');
        notes.forEach(note => {
            ws.mergeCells(r, 1, r, 9);
            const nCell = ws.getCell(r, 1);
            nCell.value = note;
            nCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
            r++;
        });
    }

    // Descargar archivo
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const cleanFileName = `Reporte_Consolidado_${scenario.year}_${scenario.name}.xlsx`.replace(/[\/\\?*:[\]]/g, '_');
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Exporta a Excel (.xlsx) formateado para el Informe Multi-Escenario Consolidado
 */
export async function exportMultiMecExcel(
    scenariosToExport: ScenarioCardItem[],
    premisasNotes: string = '',
    expandedRoutes: Record<string, boolean> = {}
): Promise<void> {
    if (scenariosToExport.length === 0) {
        alert('Por favor selecciona al menos un escenario para exportar.');
        return;
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PETRAL SMART DASHBOARD';
    wb.lastModifiedBy = 'Petral Financial Engine';
    wb.created = new Date();

    // =========================================================================
    // 1. HOJA PRINCIPAL APILADA: INFORME_CONSOLIDADO
    // =========================================================================
    const masterWs = wb.addWorksheet('INFORME_CONSOLIDADO');
    applyWorksheetStandards(masterWs);

    let r = 1;

    // Gran Cabecera Institucional
    masterWs.mergeCells(r, 1, r, 9);
    const h1 = masterWs.getCell(r, 1);
    h1.value = 'NAVIERA PETRAL S.A. — INFORME EJECUTIVO MULTI-ESCENARIO CONSOLIDADO';
    h1.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    h1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MAP['RIBBON_NAVY'].bg } };
    h1.alignment = { vertical: 'middle', horizontal: 'center' };
    masterWs.getRow(r).height = 28;
    r++;

    masterWs.mergeCells(r, 1, r, 9);
    const h2 = masterWs.getCell(r, 1);
    h2.value = `Fecha de Emisión: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}  •  Escenarios Incluidos: ${scenariosToExport.length}`;
    h2.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF475569' } };
    h2.alignment = { vertical: 'middle', horizontal: 'center' };
    masterWs.getRow(r).height = 20;
    r += 2;

    // Renderizar cada escenario apilado
    scenariosToExport.forEach((scenario, sIdx) => {
        r = renderScenarioSection(masterWs, scenario, r, sIdx, true, expandedRoutes);
        r += 1;
    });

    // Premisas al pie del informe consolidado
    if (premisasNotes) {
        masterWs.mergeCells(r, 1, r, 9);
        const pTitle = masterWs.getCell(r, 1);
        pTitle.value = 'Premisas y Consideraciones Generales:';
        pTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
        r++;

        const notes = premisasNotes.split('\n');
        notes.forEach(note => {
            masterWs.mergeCells(r, 1, r, 9);
            const nCell = masterWs.getCell(r, 1);
            nCell.value = note;
            nCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
            r++;
        });
    }

    // =========================================================================
    // 2. HOJAS INDIVIDUALES POR ESCENARIO
    // =========================================================================
    scenariosToExport.forEach((scenario, sIdx) => {
        const rawName = `Año_${scenario.year}_${scenario.name}`.replace(/[\/\\?*:[\]]/g, '_');
        const sheetName = rawName.substring(0, 31);
        const ws = wb.addWorksheet(sheetName);
        applyWorksheetStandards(ws);

        let rowSingle = 1;

        ws.mergeCells(rowSingle, 1, rowSingle, 9);
        const singleH = ws.getCell(rowSingle, 1);
        singleH.value = `NAVIERA PETRAL S.A. — ESCENARIO: ${scenario.name.toUpperCase()}`;
        singleH.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        singleH.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_MAP['RIBBON_NAVY'].bg } };
        singleH.alignment = { vertical: 'middle', horizontal: 'center' };
        ws.getRow(rowSingle).height = 24;
        rowSingle += 2;

        renderScenarioSection(ws, scenario, rowSingle, sIdx, false, expandedRoutes);
    });

    // Descargar archivo
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const cleanFileName = `Informe_Ejecutivo_Multi_Escenario_Consolidado_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
