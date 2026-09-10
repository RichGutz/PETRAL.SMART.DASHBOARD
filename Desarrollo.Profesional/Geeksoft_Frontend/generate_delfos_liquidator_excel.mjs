import ExcelJS from 'exceljs';
import path from 'path';

const targetPath = "C:\\Users\\rguti\\PETRAL.SMART.DASHBOARD\\Cotizaciones\\Plantilla_Voyage_Liquidator_Master.xlsx";

async function generateDelfosExactUiExcel() {
    console.log("Generando Excel clon exacto de la UI del Multicotizador / Multi-Liquidador con ExcelJS...");

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PETRAL SMART DASHBOARD';
    wb.lastModifiedBy = 'Delfos Multicotizador Engine';
    wb.created = new Date();
    wb.properties.date1904 = false;

    // Paleta de Colores UI Delfos / Petral
    const C = {
        NAVY_DARK: 'FF0F2C59',
        PETRAL_BLUE: 'FF0F4C81',
        PETRAL_TEAL: 'FF0E7490',
        PETRAL_GOLD: 'FFD97706',
        SLATE_800: 'FF1E293B',
        SLATE_700: 'FF334155',
        SLATE_600: 'FF475569',
        SLATE_100: 'FFF1F5F9',
        SLATE_50: 'FFF8FAFC',
        BORDER: 'FFCBD5E1',
        BORDER_DARK: 'FF94A3B8',
        WHITE: 'FFFFFFFF',
        GREEN_BG: 'FFDCFCE7',
        GREEN_TEXT: 'FF166534',
        RED_BG: 'FFFEE2E2',
        RED_TEXT: 'FF991B1B',
        BLUE_PASTEL: 'FFC3D2E0',
        BLUE_TEXT: 'FF0F4C81',
        SKY_PASTEL: 'FFC0DAE8',
        SKY_TEXT: 'FF0369A1',
        PURPLE_PASTEL: 'FFE9D5FD',
        PURPLE_TEXT: 'FF6B21A8',
        ORANGE_PASTEL: 'FFFEDCC5',
        ORANGE_TEXT: 'FFC2410C',
        AMBER_BG: 'FFFEF3C7',
        AMBER_TEXT: 'FF78350F'
    };

    const thinBorder = {
        top: { style: 'thin', color: { argb: C.BORDER } },
        left: { style: 'thin', color: { argb: C.BORDER } },
        bottom: { style: 'thin', color: { argb: C.BORDER } },
        right: { style: 'thin', color: { argb: C.BORDER } }
    };

    const cardBorder = {
        top: { style: 'medium', color: { argb: C.BORDER_DARK } },
        left: { style: 'medium', color: { argb: C.BORDER_DARK } },
        bottom: { style: 'medium', color: { argb: C.BORDER_DARK } },
        right: { style: 'medium', color: { argb: C.BORDER_DARK } }
    };

    const helperApplyRow = (ws, rIdx, height, fillArgb, fontObj, border = thinBorder) => {
        const row = ws.getRow(rIdx);
        if (height) row.height = height;
        return row;
    };

    // =========================================================================
    // HOJA 1: VOYAGE_CALCULATOR_UI (CLON EXACTO DE LA PANTALLA MULTICOTIZADOR)
    // =========================================================================
    const ws1 = wb.addWorksheet('VOYAGE_CALCULATOR_UI', {
        views: [{ showGridLines: true, zoomScale: 85, zoomScaleNormal: 85 }]
    });

    // Ancho de Columnas A -> N
    ws1.columns = [
        { width: 14 }, // A: Tramo / Label
        { width: 16 }, // B: Tipo Tramo / Puerto Origen
        { width: 18 }, // C: Puerto Destino
        { width: 14 }, // D: Distancia (NM)
        { width: 14 }, // E: Clima / Vel
        { width: 12 }, // F: Días Mar
        { width: 14 }, // G: Acción Puerto
        { width: 14 }, // H: Carga (TM)
        { width: 14 }, // I: Tarifa ($/TM)
        { width: 14 }, // J: Tasa Oper (TM/d)
        { width: 12 }, // K: Días Puerto
        { width: 14 }, // L: Días Totales
        { width: 16 }, // M: Gastos Pto ($)
        { width: 18 }  // N: Flete Estimado ($)
    ];

    // 1. Barra de Navegación / Contexto UI
    ws1.mergeCells('A1:N1');
    const barCell1 = ws1.getCell('A1');
    barCell1.value = '🛳️ DELFOS / PETRAL — MULTICOTIZADOR MARÍTIMO (VOYAGE CALCULATOR PRO)';
    barCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NAVY_DARK } };
    barCell1.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: C.WHITE } };
    barCell1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws1.getRow(1).height = 26;

    // 2. Selectores de Cabecera (Cliente, Ruta, Fechas)
    ws1.getRow(2).height = 24;
    const headerSelectors = [
        ['A2:B2', 'CLIENTE: SPCC (SOUTHERN)', C.SKY_PASTEL, C.SKY_TEXT],
        ['C2:D2', 'TIPO: CONTRATOS ACTIVOS', C.SLATE_100, C.SLATE_700],
        ['E2:H2', 'RUTA SELECCIONADA: ILO - MARCONA - CALLAO (BUNKERING)', C.AMBER_BG, C.AMBER_TEXT],
        ['I2:K2', 'VIGENCIA: 01/01/2026 AL 31/12/2026', C.SLATE_100, C.SLATE_700],
        ['L2:N2', 'ESTADO: COTIZACIÓN VALIDADA', C.GREEN_BG, C.GREEN_TEXT]
    ];
    headerSelectors.forEach(([range, text, bg, fg]) => {
        ws1.mergeCells(range);
        const cell = ws1.getCell(range.split(':')[0]);
        cell.value = text;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: fg } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
    });

    ws1.getRow(3).height = 6; // Spacer

    // 3. SECCIÓN: VESSEL FACT SHEET HEADER (Ficha Técnica & Consumos Bunker)
    ws1.mergeCells('A4:N4');
    const vfsTitle = ws1.getCell('A4');
    vfsTitle.value = '1. FICHA TÉCNICA DEL BUQUE & PRECIOS DE BÚNKER (VESSEL FACT SHEET)';
    vfsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.PETRAL_BLUE } };
    vfsTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: C.WHITE } };
    vfsTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws1.getRow(4).height = 22;

    // Fila de Cabeceras Parámetros Buque
    ws1.getRow(5).height = 20;
    const vfsHeaders = ['VESSEL', 'GRT (t)', 'DWT (t)', 'DWCC (t)', 'Speed (kn)', 'TCE Req ($/d)', 'LOA (m)', 'Beam (m)', 'Calado (m)', 'Fuel', 'Sea (t/d)', 'Idle (t/d)', 'Load/Disch', 'PRECIO ($/T)'];
    vfsHeaders.forEach((text, idx) => {
        const cell = ws1.getCell(5, idx + 1);
        cell.value = text;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_800 } };
        cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: C.WHITE } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
    });

    // Fila IFO
    ws1.getRow(6).height = 20;
    const ifoRowVals = ['DON MOQUEGUA', 7450, 14250, 13500, 11.5, 4800, 118.0, 18.2, 7.80, 'IFO', 12.0, 1.5, 2.2, 680.00];
    ifoRowVals.forEach((val, idx) => {
        const cell = ws1.getCell(6, idx + 1);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: C.SLATE_800 } };
        cell.border = thinBorder;
        if (idx === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC5E8D2' } };
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF166534' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (idx === 9) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
            cell.font = { name: 'Segoe UI', size: 9, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (idx === 13) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.RED_BG } };
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: C.RED_TEXT } };
            cell.numFmt = '$#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if ([1, 2, 3, 5].includes(idx)) {
            cell.numFmt = '#,##0';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
            cell.numFmt = '0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
    });

    // Fila MDO
    ws1.getRow(7).height = 20;
    const mdoRowVals = ['DON MOQUEGUA', 7450, 14250, 13500, 11.5, 4800, 118.0, 18.2, 7.80, 'MDO', 1.5, 1.2, 1.2, 950.00];
    mdoRowVals.forEach((val, idx) => {
        const cell = ws1.getCell(7, idx + 1);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: C.SLATE_800 } };
        cell.border = thinBorder;
        if (idx === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC5E8D2' } };
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF166534' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (idx === 9) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
            cell.font = { name: 'Segoe UI', size: 9, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (idx === 13) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.RED_BG } };
            cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: C.RED_TEXT } };
            cell.numFmt = '$#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if ([1, 2, 3, 5].includes(idx)) {
            cell.numFmt = '#,##0';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
            cell.numFmt = '0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
    });

    ws1.getRow(8).height = 6; // Spacer

    // 4. SECCIÓN: SPREADSHEET TRAMOS & PUERTOS GRID
    ws1.mergeCells('A9:N9');
    const tramosTitle = ws1.getCell('A9');
    tramosTitle.value = '2. GRILLA DE TRAMOS, DISTANCIAS, PUERTOS Y CARGA (SPREADSHEET TRAMOS GRID)';
    tramosTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.PETRAL_TEAL } };
    tramosTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: C.WHITE } };
    tramosTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws1.getRow(9).height = 22;

    ws1.getRow(10).height = 24;
    const tramosHeaders = [
        'Tramo', 'Tipo Tramo', 'Origen', 'Destino', 'Distancia (NM)', 'Factor Clima',
        'Días Mar', 'Acción Pto', 'Carga (TM)', 'Tarifa ($/TM)', 'Tasa Oper (TM/d)',
        'Días Puerto', 'Días Totales', 'Flete Est ($)'
    ];
    tramosHeaders.forEach((text, idx) => {
        const cell = ws1.getCell(10, idx + 1);
        cell.value = text;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_800 } };
        cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: C.WHITE } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = thinBorder;
    });

    const tramosData = [
        ['Tramo 1', 'BALLAST (Lastre)', 'ILO', 'MARCONA', 280, '3.0%', { formula: '((E11/(11.5*24))*1.03)' }, 'CARGAR', 14250, 15.00, 7500, { formula: 'I11/K11' }, { formula: 'G11+L11' }, { formula: 'I11*J11' }],
        ['Tramo 2', 'LADEN (Cargado)', 'MARCONA', 'CALLAO', 220, '3.0%', { formula: '((E12/(11.5*24))*1.03)' }, 'DESCARGAR', 14250, 0.00, 6000, { formula: 'I12/K12' }, { formula: 'G12+L12' }, 0.00],
        ['Tramo 3', 'BUNKERING', 'CALLAO', 'ILO', 440, '3.0%', { formula: '((E13/(11.5*24))*1.03)' }, 'BUNKERING', 0, 0.00, 0, 0.50, { formula: 'G13+L13' }, 0.00]
    ];

    tramosData.forEach((rowVals, rIdx) => {
        const row = ws1.getRow(rIdx + 11);
        row.height = 22;
        rowVals.forEach((val, cIdx) => {
            const cell = row.getCell(cIdx + 1);
            cell.value = val;
            cell.font = { name: 'Segoe UI', size: 9, color: { argb: C.SLATE_800 } };
            cell.border = thinBorder;

            if (cIdx + 1 === 1) {
                cell.font = { name: 'Segoe UI', size: 9, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else if (cIdx + 1 === 2) {
                if (String(val).includes('BALLAST')) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
                else if (String(val).includes('LADEN')) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GREEN_BG } };
                else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AMBER_BG } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else if ([3, 4, 8].includes(cIdx + 1)) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else if ([5, 9, 11].includes(cIdx + 1)) {
                cell.numFmt = '#,##0';
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
            } else if ([7, 12, 13].includes(cIdx + 1)) {
                cell.numFmt = '0.00';
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
            } else if ([10, 14].includes(cIdx + 1)) {
                cell.numFmt = '$#,##0.00';
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
            }
        });
    });

    // Fila Totales de Tramos
    ws1.getRow(14).height = 24;
    ws1.mergeCells('A14:D14');
    const totTramoLabel = ws1.getCell('A14');
    totTramoLabel.value = 'TOTALES DEL VIAJE PROYECTADO:';
    totTramoLabel.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: C.PETRAL_NAVY } };
    totTramoLabel.alignment = { vertical: 'middle', horizontal: 'right' };
    totTramoLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    totTramoLabel.border = thinBorder;

    ws1.getCell('E14').value = { formula: 'SUM(E11:E13)' };
    ws1.getCell('E14').numFmt = '#,##0 "NM"';
    ws1.getCell('E14').font = { name: 'Segoe UI', size: 9, bold: true };
    ws1.getCell('E14').alignment = { vertical: 'middle', horizontal: 'right' };
    ws1.getCell('E14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws1.getCell('E14').border = thinBorder;

    ws1.getCell('F14').value = '';
    ws1.getCell('F14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws1.getCell('F14').border = thinBorder;

    ws1.getCell('G14').value = { formula: 'SUM(G11:G13)' };
    ws1.getCell('G14').numFmt = '0.00 "d"';
    ws1.getCell('G14').font = { name: 'Segoe UI', size: 9, bold: true };
    ws1.getCell('G14').alignment = { vertical: 'middle', horizontal: 'right' };
    ws1.getCell('G14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws1.getCell('G14').border = thinBorder;

    ws1.getCell('H14').value = '';
    ws1.getCell('H14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws1.getCell('H14').border = thinBorder;

    ws1.getCell('I14').value = { formula: 'MAX(I11:I13)' };
    ws1.getCell('I14').numFmt = '#,##0 "TM"';
    ws1.getCell('I14').font = { name: 'Segoe UI', size: 9, bold: true };
    ws1.getCell('I14').alignment = { vertical: 'middle', horizontal: 'right' };
    ws1.getCell('I14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws1.getCell('I14').border = thinBorder;

    ws1.getCell('J14').value = '';
    ws1.getCell('J14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws1.getCell('J14').border = thinBorder;

    ws1.getCell('K14').value = '';
    ws1.getCell('K14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws1.getCell('K14').border = thinBorder;

    ws1.getCell('L14').value = { formula: 'SUM(L11:L13)' };
    ws1.getCell('L14').numFmt = '0.00 "d"';
    ws1.getCell('L14').font = { name: 'Segoe UI', size: 9, bold: true };
    ws1.getCell('L14').alignment = { vertical: 'middle', horizontal: 'right' };
    ws1.getCell('L14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws1.getCell('L14').border = thinBorder;

    ws1.getCell('M14').value = { formula: 'SUM(M11:M13)' };
    ws1.getCell('M14').numFmt = '0.00 "d"';
    ws1.getCell('M14').font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: C.PETRAL_NAVY } };
    ws1.getCell('M14').alignment = { vertical: 'middle', horizontal: 'right' };
    ws1.getCell('M14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AMBER_BG } };
    ws1.getCell('M14').border = thinBorder;

    ws1.getCell('N14').value = { formula: 'SUM(N11:N13)' };
    ws1.getCell('N14').numFmt = '$#,##0.00';
    ws1.getCell('N14').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: C.PETRAL_NAVY } };
    ws1.getCell('N14').alignment = { vertical: 'middle', horizontal: 'right' };
    ws1.getCell('N14').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GREEN_BG } };
    ws1.getCell('N14').border = thinBorder;

    ws1.getRow(15).height = 8; // Spacer

    // 5. SECCIÓN: FINANCIAL RESULT CARDS (Tarjetas P&L Idénticas a la UI)
    ws1.mergeCells('A16:N16');
    const resTitle = ws1.getCell('A16');
    resTitle.value = '3. RESUMEN EJECUTIVO DE RESULTADOS FINANCIEROS (FINANCIAL RESULT CARDS)';
    resTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NAVY_DARK } };
    resTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: C.WHITE } };
    resTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws1.getRow(16).height = 22;

    // Grid de Tarjetas (Fila 17 -> 22)
    const cardDefs = [
        // Card 1: Gross Freight
        { rangeTitle: 'A17:B17', title: 'GROSS FREIGHT REVENUE', rangeVal: 'A18:B19', formula: 'N14', fmt: '$#,##0.00', bg: 'FFEFF6FF', textBg: 'FF1E40AF' },
        // Card 2: Bunker Expenses
        { rangeTitle: 'C17:D17', title: 'BUNKER EXPENSES', rangeVal: 'C18:D19', formula: '((G14*12.0*680)+(L14*1.5*680))+((M14*1.5*950))', fmt: '$#,##0.00', bg: 'FFFEE2E2', textBg: 'FF991B1B' },
        // Card 3: Port Expenses
        { rangeTitle: 'E17:F17', title: 'PORT EXPENSES (PDA/FDA)', rangeVal: 'E18:F19', val: 24500.00, fmt: '$#,##0.00', bg: 'FFF8FAFC', textBg: 'FF334155' },
        // Card 4: Commissions & Rebates
        { rangeTitle: 'G17:H17', title: 'COMMISSIONS (3.75%)', rangeVal: 'G18:H19', formula: 'A18*0.0375', fmt: '$#,##0.00', bg: 'FFF8FAFC', textBg: 'FF334155' },
        // Card 5: Net Voyage Revenue
        { rangeTitle: 'I17:J17', title: 'NET VOYAGE REVENUE', rangeVal: 'I18:J19', formula: 'A18-C18-E18-G18', fmt: '$#,##0.00', bg: 'FFFEF3C7', textBg: 'FF92400E' },
        // Card 6: Operating Profit / P&L
        { rangeTitle: 'K17:L17', title: 'OPERATING PROFIT (P&L)', rangeVal: 'K18:L19', formula: 'I18-(M14*4800)', fmt: '$#,##0.00', bg: 'FFDCFCE7', textBg: 'FF166534' },
        // Card 7: Margin % & TCE
        { rangeTitle: 'M17:N17', title: 'OPERATING MARGIN (%)', rangeVal: 'M18:N19', formula: 'K18/A18', fmt: '0.0%', bg: 'FFECFDF5', textBg: 'FF065F46' }
    ];

    ws1.getRow(17).height = 18;
    ws1.getRow(18).height = 18;
    ws1.getRow(19).height = 18;

    cardDefs.forEach(card => {
        ws1.mergeCells(card.rangeTitle);
        const tCell = ws1.getCell(card.rangeTitle.split(':')[0]);
        tCell.value = card.title;
        tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };
        tCell.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: card.textBg } };
        tCell.alignment = { vertical: 'middle', horizontal: 'center' };
        tCell.border = thinBorder;

        ws1.mergeCells(card.rangeVal);
        const vCell = ws1.getCell(card.rangeVal.split(':')[0]);
        if (card.formula) vCell.value = { formula: card.formula };
        else if (card.val !== undefined) vCell.value = card.val;
        vCell.numFmt = card.fmt;
        vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };
        vCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: card.textBg } };
        vCell.alignment = { vertical: 'middle', horizontal: 'center' };
        vCell.border = thinBorder;
    });


    // =========================================================================
    // HOJA 2: VOYAGE_LIQUIDATOR_UI (CLON EXACTO DE LA UI DE LIQUIDACIÓN REAL)
    // =========================================================================
    const ws2 = wb.addWorksheet('VOYAGE_LIQUIDATOR_UI', {
        views: [{ showGridLines: true, zoomScale: 85, zoomScaleNormal: 85 }]
    });

    ws2.columns = ws1.columns;

    // 1. Barra de Navegación UI Liquidator
    ws2.mergeCells('A1:N1');
    const barCell2 = ws2.getCell('A1');
    barCell2.value = '⚓ DELFOS / PETRAL — MULTI-LIQUIDADOR DE VIAJES REALES (VOYAGE LIQUIDATOR)';
    barCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NAVY_DARK } };
    barCell2.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: C.WHITE } };
    barCell2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws2.getRow(1).height = 26;

    // 2. Selectores de Ejecución Real (Trip No, B/L Date, Fechas Reales)
    ws2.getRow(2).height = 24;
    const headerSelectors2 = [
        ['A2:B2', 'TRIP NO: DM-2026-042', C.AMBER_BG, C.AMBER_TEXT],
        ['C2:D2', 'BUQUE: DON MOQUEGUA', 'FFC5E8D2', 'FF166534'],
        ['E2:G2', 'FECHA B/L: 15/01/2026 (CARGA: 14,280.50 TM)', C.SKY_PASTEL, C.SKY_TEXT],
        ['H2:K2', 'DURACIÓN: 14/01 08:00 A 17/01 18:00 (3.42 DÍAS)', C.SLATE_100, C.SLATE_700],
        ['L2:N2', 'ESTADO: AUDITADO / CERRADO', C.GREEN_BG, C.GREEN_TEXT]
    ];
    headerSelectors2.forEach(([range, text, bg, fg]) => {
        ws2.mergeCells(range);
        const cell = ws2.getCell(range.split(':')[0]);
        cell.value = text;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: fg } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
    });

    ws2.getRow(3).height = 6;

    // 3. SECCIÓN: INVENTARIO DE SONDAS (ROBS INICIAL / FINAL) Y SHIFTING
    ws2.mergeCells('A4:N4');
    const robTitle = ws2.getCell('A4');
    robTitle.value = '1. LIQUIDACIÓN DE COMBUSTIBLE EN SONDAS (ROBS) & EVENTOS DE SHIFTING / DEMURRAGE';
    robTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.PETRAL_BLUE } };
    robTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: C.WHITE } };
    robTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws2.getRow(4).height = 22;

    ws2.getRow(5).height = 20;
    const robHeaders = [
        'COMBUSTIBLE', 'ROB INICIAL (TM)', 'ROB FINAL (TM)', 'CONSUMO (TM)', 'PRECIO ($/T)', 'COSTO TOTAL ($)',
        'EVENTO SHIFTING', 'HORAS DEMORA', 'COMPENSACIÓN ($)', 'DEMURRAGE ($)', 'DESPATCH ($)', 'OPEX/DÍA ($)', 'DÍAS REALES', 'TOTAL OPEX ($)'
    ];
    robHeaders.forEach((text, idx) => {
        const cell = ws2.getCell(5, idx + 1);
        cell.value = text;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_800 } };
        cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: C.WHITE } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = thinBorder;
    });

    // Fila ROB IFO
    ws2.getRow(6).height = 20;
    const robIfoVals = [
        'IFO / LSFO', 120.50, 105.20, { formula: 'B6-C6' }, 680.00, { formula: 'D6*E6' },
        'SI (Prioridad Muelle)', 14.50, 4500.00, 1200.00, 0.00, 4800.00, 3.42, { formula: 'L6*M6' }
    ];
    robIfoVals.forEach((val, idx) => {
        const cell = ws2.getCell(6, idx + 1);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: C.SLATE_800 } };
        cell.border = thinBorder;
        if (idx === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
            cell.font = { name: 'Segoe UI', size: 9, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if ([1, 2, 3, 7, 12].includes(idx)) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if ([4, 5, 8, 9, 10, 11, 13].includes(idx)) {
            cell.numFmt = '$#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
    });

    // Fila ROB MDO
    ws2.getRow(7).height = 20;
    const robMdoVals = [
        'MDO (Diesel)', 45.00, 42.10, { formula: 'B7-C7' }, 950.00, { formula: 'D7*E7' },
        'Compensado en Factura', 0.00, 0.00, 0.00, 0.00, 4800.00, 3.42, 0.00
    ];
    robMdoVals.forEach((val, idx) => {
        const cell = ws2.getCell(7, idx + 1);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: C.SLATE_800 } };
        cell.border = thinBorder;
        if (idx === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
            cell.font = { name: 'Segoe UI', size: 9, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if ([1, 2, 3, 7, 12].includes(idx)) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if ([4, 5, 8, 9, 10, 11, 13].includes(idx)) {
            cell.numFmt = '$#,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
    });

    ws2.getRow(8).height = 6;

    // 4. SECCIÓN: TRAMOS REALES NAVEGADOS
    ws2.mergeCells('A9:N9');
    const tramosRealTitle = ws2.getCell('A9');
    tramosRealTitle.value = '2. TRAMOS REALES EJECUTADOS, CARGA CERTIFICADA B/L Y GASTOS PORTUARIOS FDA';
    tramosRealTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.PETRAL_TEAL } };
    tramosRealTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: C.WHITE } };
    tramosRealTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws2.getRow(9).height = 22;

    ws2.getRow(10).height = 24;
    const tramosRealHeaders = [
        'Tramo Real', 'Condición', 'Origen Real', 'Destino Real', 'Distancia (NM)', 'Horas Mar',
        'Días Mar', 'Operación', 'Carga B/L (TM)', 'Tarifa Pactada ($/TM)', 'Flete Facturado ($)',
        'Días Puerto', 'Gastos FDA ($)', 'Total Ingreso ($)'
    ];
    tramosRealHeaders.forEach((text, idx) => {
        const cell = ws2.getCell(10, idx + 1);
        cell.value = text;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_800 } };
        cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: C.WHITE } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = thinBorder;
    });

    const tramosRealData = [
        ['Pierna 1', 'BALLAST', 'ILO', 'MARCONA', 280, 24.5, 1.02, 'CARGA B/L', 14280.50, 15.00, { formula: 'I11*J11' }, 1.20, 11200.00, { formula: 'K11' }],
        ['Pierna 2', 'LADEN', 'MARCONA', 'CALLAO', 220, 19.8, 0.83, 'DESCARGA B/L', 14280.50, 0.00, 0.00, 1.57, 8000.00, 0.00]
    ];

    tramosRealData.forEach((rowVals, rIdx) => {
        const row = ws2.getRow(rIdx + 11);
        row.height = 22;
        rowVals.forEach((val, cIdx) => {
            const cell = row.getCell(cIdx + 1);
            cell.value = val;
            cell.font = { name: 'Segoe UI', size: 9, color: { argb: C.SLATE_800 } };
            cell.border = thinBorder;

            if (cIdx + 1 === 1) {
                cell.font = { name: 'Segoe UI', size: 9, bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else if (cIdx + 1 === 2) {
                if (String(val).includes('BALLAST')) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
                else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GREEN_BG } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else if ([3, 4, 8].includes(cIdx + 1)) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else if ([5, 6, 9].includes(cIdx + 1)) {
                cell.numFmt = '#,##0.00';
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
            } else if ([7, 12].includes(cIdx + 1)) {
                cell.numFmt = '0.00';
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
            } else if ([10, 11, 13, 14].includes(cIdx + 1)) {
                cell.numFmt = '$#,##0.00';
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
            }
        });
    });

    // Fila Totales Reales
    ws2.getRow(13).height = 24;
    ws2.mergeCells('A13:D13');
    const totRealLabel = ws2.getCell('A13');
    totRealLabel.value = 'TOTALES EJECUTADOS DEL VIAJE:';
    totRealLabel.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: C.PETRAL_NAVY } };
    totRealLabel.alignment = { vertical: 'middle', horizontal: 'right' };
    totRealLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    totRealLabel.border = thinBorder;

    ws2.getCell('E13').value = { formula: 'SUM(E11:E12)' };
    ws2.getCell('E13').numFmt = '#,##0 "NM"';
    ws2.getCell('E13').font = { name: 'Segoe UI', size: 9, bold: true };
    ws2.getCell('E13').alignment = { vertical: 'middle', horizontal: 'right' };
    ws2.getCell('E13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws2.getCell('E13').border = thinBorder;

    ws2.getCell('F13').value = { formula: 'SUM(F11:F12)' };
    ws2.getCell('F13').numFmt = '#,##0.0 "h"';
    ws2.getCell('F13').font = { name: 'Segoe UI', size: 9, bold: true };
    ws2.getCell('F13').alignment = { vertical: 'middle', horizontal: 'right' };
    ws2.getCell('F13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws2.getCell('F13').border = thinBorder;

    ws2.getCell('G13').value = { formula: 'SUM(G11:G12)' };
    ws2.getCell('G13').numFmt = '0.00 "d"';
    ws2.getCell('G13').font = { name: 'Segoe UI', size: 9, bold: true };
    ws2.getCell('G13').alignment = { vertical: 'middle', horizontal: 'right' };
    ws2.getCell('G13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws2.getCell('G13').border = thinBorder;

    ws2.getCell('H13').value = '';
    ws2.getCell('H13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws2.getCell('H13').border = thinBorder;

    ws2.getCell('I13').value = { formula: 'MAX(I11:I12)' };
    ws2.getCell('I13').numFmt = '#,##0.00 "TM"';
    ws2.getCell('I13').font = { name: 'Segoe UI', size: 9, bold: true };
    ws2.getCell('I13').alignment = { vertical: 'middle', horizontal: 'right' };
    ws2.getCell('I13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws2.getCell('I13').border = thinBorder;

    ws2.getCell('J13').value = '';
    ws2.getCell('J13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws2.getCell('J13').border = thinBorder;

    ws2.getCell('K13').value = { formula: 'SUM(K11:K12)' };
    ws2.getCell('K13').numFmt = '$#,##0.00';
    ws2.getCell('K13').font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: C.PETRAL_NAVY } };
    ws2.getCell('K13').alignment = { vertical: 'middle', horizontal: 'right' };
    ws2.getCell('K13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GREEN_BG } };
    ws2.getCell('K13').border = thinBorder;

    ws2.getCell('L13').value = { formula: 'SUM(L11:L12)' };
    ws2.getCell('L13').numFmt = '0.00 "d"';
    ws2.getCell('L13').font = { name: 'Segoe UI', size: 9, bold: true };
    ws2.getCell('L13').alignment = { vertical: 'middle', horizontal: 'right' };
    ws2.getCell('L13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    ws2.getCell('L13').border = thinBorder;

    ws2.getCell('M13').value = { formula: 'SUM(M11:M12)' };
    ws2.getCell('M13').numFmt = '$#,##0.00';
    ws2.getCell('M13').font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: C.RED_TEXT } };
    ws2.getCell('M13').alignment = { vertical: 'middle', horizontal: 'right' };
    ws2.getCell('M13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.RED_BG } };
    ws2.getCell('M13').border = thinBorder;

    ws2.getCell('N13').value = { formula: 'SUM(N11:N12)' };
    ws2.getCell('N13').numFmt = '$#,##0.00';
    ws2.getCell('N13').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: C.PETRAL_NAVY } };
    ws2.getCell('N13').alignment = { vertical: 'middle', horizontal: 'right' };
    ws2.getCell('N13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GREEN_BG } };
    ws2.getCell('N13').border = thinBorder;

    ws2.getRow(14).height = 8;

    // 5. SECCIÓN: FINANCIAL RESULT CARDS REALES (LIQUIDACIÓN FINAL AUDITADA)
    ws2.mergeCells('A15:N15');
    const resRealTitle = ws2.getCell('A15');
    resRealTitle.value = '3. RESULTADOS REALES AUDITADOS DEL VIAJE (REAL LIQUIDATION RESULT CARDS)';
    resRealTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NAVY_DARK } };
    resRealTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: C.WHITE } };
    resRealTitle.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws2.getRow(15).height = 22;

    const realCardDefs = [
        // Card 1: Total Revenue Real (Flete B/L + Shifting + Demurrage)
        { rangeTitle: 'A16:B16', title: 'TOTAL GROSS REVENUE', rangeVal: 'A17:B18', formula: 'K13+I6+J6-K6', fmt: '$#,##0.00', bg: 'FFEFF6FF', textBg: 'FF1E40AF' },
        // Card 2: Costo Bunker Real
        { rangeTitle: 'C16:D16', title: 'BUNKER EXPENSES (ROBS)', rangeVal: 'C17:D18', formula: 'F6+F7', fmt: '$#,##0.00', bg: 'FFFEE2E2', textBg: 'FF991B1B' },
        // Card 3: Port Expenses Reales FDA
        { rangeTitle: 'E16:F16', title: 'PORT EXPENSES (FDA REAL)', rangeVal: 'E17:F18', formula: 'M13', fmt: '$#,##0.00', bg: 'FFF8FAFC', textBg: 'FF334155' },
        // Card 4: Total OPEX Real
        { rangeTitle: 'G16:H16', title: 'TOTAL OPEX (3.42 DÍAS)', rangeVal: 'G17:H18', formula: 'N6', fmt: '$#,##0.00', bg: 'FFF8FAFC', textBg: 'FF334155' },
        // Card 5: Net Operating Result
        { rangeTitle: 'I16:J16', title: 'P&L REAL AUDITADO', rangeVal: 'I17:J18', formula: 'A17-C17-E17-G17', fmt: '$#,##0.00', bg: 'FFDCFCE7', textBg: 'FF166534' },
        // Card 6: Margen Real %
        { rangeTitle: 'K16:L16', title: 'MARGEN REAL (%)', rangeVal: 'K17:L18', formula: 'I17/A17', fmt: '0.0%', bg: 'FFECFDF5', textBg: 'FF065F46' },
        // Card 7: TCE Real / Día
        { rangeTitle: 'M16:N16', title: 'TCE REAL ($/DÍA)', rangeVal: 'M17:N18', formula: '(A17-C17-E17)/M6', fmt: '$#,##0.00', bg: 'FFFEF3C7', textBg: 'FF92400E' }
    ];

    ws2.getRow(16).height = 18;
    ws2.getRow(17).height = 18;
    ws2.getRow(18).height = 18;

    realCardDefs.forEach(card => {
        ws2.mergeCells(card.rangeTitle);
        const tCell = ws2.getCell(card.rangeTitle.split(':')[0]);
        tCell.value = card.title;
        tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };
        tCell.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: card.textBg } };
        tCell.alignment = { vertical: 'middle', horizontal: 'center' };
        tCell.border = thinBorder;

        ws2.mergeCells(card.rangeVal);
        const vCell = ws2.getCell(card.rangeVal.split(':')[0]);
        vCell.value = { formula: card.formula };
        vCell.numFmt = card.fmt;
        vCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.bg } };
        vCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: card.textBg } };
        vCell.alignment = { vertical: 'middle', horizontal: 'center' };
        vCell.border = thinBorder;
    });


    // =========================================================================
    // HOJA 3: MATRIZ_EJECUCION_LEDGER (Bitácora de Todos los Viajes)
    // =========================================================================
    const ws3 = wb.addWorksheet('MATRIZ_EJECUCION_LEDGER', {
        views: [{ showGridLines: true, state: 'frozen', ySplit: 4, xSplit: 3, zoomScale: 80, zoomScaleNormal: 80 }]
    });

    ws3.columns = [
        { width: 14 }, { width: 16 }, { width: 14 }, { width: 16 }, { width: 13 },
        { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 16 },
        { width: 16 }, { width: 16 }, { width: 18 }, { width: 14 }, { width: 22 }
    ];

    ws3.mergeCells('A1:O1');
    const titleCell3 = ws3.getCell('A1');
    titleCell3.value = 'DELFOS / PETRAL — MATRIZ GENERAL DE VIAJES EJECUTADOS (REAL LIQUIDATIONS LEDGER)';
    titleCell3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NAVY_DARK } };
    titleCell3.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: C.WHITE } };
    titleCell3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws3.getRow(1).height = 26;

    ws3.mergeCells('A2:O2');
    const subCell3 = ws3.getCell('A2');
    subCell3.value = 'CONSOLIDADO ANUAL DE TRAVESÍAS AUDITADAS, CONSUMO DE COMBUSTIBLE Y P&L REAL EN CAJA';
    subCell3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    subCell3.font = { name: 'Segoe UI', size: 9.5, italic: true, bold: true, color: { argb: C.SLATE_600 } };
    subCell3.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws3.getRow(2).height = 20;

    ws3.getRow(3).height = 8;

    const h3Row = ws3.getRow(4);
    h3Row.height = 24;
    const h3Texts = [
        'ID Viaje', 'Buque', 'Cliente', 'Ruta Real', 'Fecha B/L', 'Carga (TM)', 'Tarifa ($/TM)',
        'Días Reales', 'Gross Rev ($)', 'Bunker Cost ($)', 'Port Cost ($)', 'OPEX ($)',
        'P&L Real ($)', 'Margen (%)', 'Estado Liquidación'
    ];
    h3Texts.forEach((t, idx) => {
        const cell = h3Row.getCell(idx + 1);
        cell.value = t;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_800 } };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: C.WHITE } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
    });

    const ledgerData = [
        ['DM-2026-01', 'DON MOQUEGUA', 'SPCC', 'ILO-MARCONA', '2026-01-15', 14280.50, 15.00, 3.42, 219907.50, 13155.00, 19200.00, 16416.00, 171136.50, 0.778, 'AUDITADO / CERRADO'],
        ['PB-2026-01', 'PARACAS BAY', 'NEXA', 'CALLAO-MATARANI', '2026-01-22', 18620.00, 18.20, 5.17, 338034.00, 23396.00, 27800.00, 26884.00, 259954.00, 0.769, 'AUDITADO / CERRADO'],
        ['DM-2026-02', 'DON MOQUEGUA', 'SHOUGANG', 'MARCONA-CALLAO', '2026-02-05', 14100.00, 16.50, 3.75, 238650.00, 11178.00, 23400.00, 18000.00, 186072.00, 0.780, 'EN FACTURACIÓN']
    ];

    ledgerData.forEach((rowVals, rIdx) => {
        const row = ws3.getRow(rIdx + 5);
        row.height = 22;
        rowVals.forEach((val, cIdx) => {
            const cell = row.getCell(cIdx + 1);
            cell.value = val;
            cell.font = { name: 'Segoe UI', size: 9, color: { argb: C.SLATE_800 } };
            cell.border = thinBorder;

            if ([1, 2, 3, 4, 5].includes(cIdx + 1)) cell.alignment = { vertical: 'middle', horizontal: 'center' };
            else if ([6, 8].includes(cIdx + 1)) { cell.numFmt = '#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
            else if ([7, 9, 10, 11, 12, 13].includes(cIdx + 1)) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
            else if (cIdx + 1 === 14) { cell.numFmt = '0.0%'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
            else if (cIdx + 1 === 15) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.GREEN_BG } };
                cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: C.GREEN_TEXT } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
        });
    });


    // =========================================================================
    // HOJA 4: COMPARATIVO_FORECAST_VS_REAL (Budget vs Actuals)
    // =========================================================================
    const ws4 = wb.addWorksheet('COMPARATIVO_FORECAST_VS_REAL', {
        views: [{ showGridLines: true, zoomScale: 85, zoomScaleNormal: 85 }]
    });

    ws4.columns = [
        { width: 14 }, { width: 16 }, { width: 16 }, { width: 13 },
        { width: 14 }, { width: 14 }, { width: 13 },
        { width: 16 }, { width: 16 }, { width: 13 },
        { width: 14 }, { width: 14 }, { width: 14 },
        { width: 12 }, { width: 12 }, { width: 12 }
    ];

    ws4.mergeCells('A1:P1');
    const titleCell4 = ws4.getCell('A1');
    titleCell4.value = 'DELFOS / PETRAL — DASHBOARD COMPARATIVO MACRO (FORECAST VS. REAL)';
    titleCell4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NAVY_DARK } };
    titleCell4.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: C.WHITE } };
    titleCell4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws4.getRow(1).height = 26;

    ws4.mergeCells('A2:P2');
    const subCell4 = ws4.getCell('A2');
    subCell4.value = 'CONCILIACIÓN MENSUAL DE LOS 5 INDICADORES CLAVE (VENTA, TONELAJE, P&L, MARGEN % Y DÍAS)';
    subCell4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    subCell4.font = { name: 'Segoe UI', size: 9.5, italic: true, bold: true, color: { argb: C.SLATE_600 } };
    subCell4.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws4.getRow(2).height = 20;

    ws4.getRow(3).height = 8;

    const h4Row = ws4.getRow(4);
    h4Row.height = 24;
    const h4Texts = [
        'Mes', 'Venta Fcst ($)', 'Venta Real ($)', 'Var Venta (%)',
        'TM Fcst', 'TM Real', 'Var TM (%)',
        'P&L Fcst ($)', 'P&L Real ($)', 'Var P&L (%)',
        'Margen Fcst (%)', 'Margen Real (%)', 'Var Margen (pp)',
        'Días Fcst', 'Días Real', 'Var Días'
    ];
    h4Texts.forEach((t, idx) => {
        const cell = h4Row.getCell(idx + 1);
        cell.value = t;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.PETRAL_GOLD } };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: C.WHITE } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
    });

    const compData = [
        ['Enero', 550000, 557941.50, { formula: '(C5/B5)-1' }, 32750, 32900.50, { formula: '(F5/E5)-1' }, 285000, 292530.50, { formula: '(I5/H5)-1' }, 0.518, 0.524, { formula: 'L5-K5' }, 25.0, 26.2, { formula: 'O5-N5' }],
        ['Febrero', 520000, 538650.00, { formula: '(C6/B6)-1' }, 31000, 31800.00, { formula: '(F6/E6)-1' }, 270000, 281400.00, { formula: '(I6/H6)-1' }, 0.519, 0.522, { formula: 'L6-K6' }, 24.0, 24.8, { formula: 'O6-N6' }],
        ['Marzo', 580000, 572400.00, { formula: '(C7/B7)-1' }, 34500, 34100.00, { formula: '(F7/E7)-1' }, 305000, 298100.00, { formula: '(I7/H7)-1' }, 0.525, 0.520, { formula: 'L7-K7' }, 26.5, 26.0, { formula: 'O7-N7' }],
        ['Abril', 540000, 555200.00, { formula: '(C8/B8)-1' }, 32000, 33000.00, { formula: '(F8/E8)-1' }, 280000, 291000.00, { formula: '(I8/H8)-1' }, 0.518, 0.524, { formula: 'L8-K8' }, 25.0, 25.5, { formula: 'O8-N8' }],
    ];

    compData.forEach((rowVals, rIdx) => {
        const row = ws4.getRow(rIdx + 5);
        row.height = 22;
        rowVals.forEach((val, cIdx) => {
            const cell = row.getCell(cIdx + 1);
            cell.value = val;
            cell.font = { name: 'Segoe UI', size: 9, color: { argb: C.SLATE_800 } };
            cell.border = thinBorder;

            if (cIdx + 1 === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
            else if ([2, 3, 8, 9].includes(cIdx + 1)) { cell.numFmt = '$#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
            else if ([5, 6].includes(cIdx + 1)) { cell.numFmt = '#,##0.00'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
            else if ([4, 7, 10, 11, 12, 13].includes(cIdx + 1)) { cell.numFmt = '0.0%'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
            else if ([14, 15, 16].includes(cIdx + 1)) { cell.numFmt = '0.0'; cell.alignment = { vertical: 'middle', horizontal: 'right' }; }
        });
    });


    // =========================================================================
    // HOJA 5: GLOSARIO_Y_REGLAS (Referencia Técnica Completa)
    // =========================================================================
    const ws5 = wb.addWorksheet('GLOSARIO_Y_REGLAS', {
        views: [{ showGridLines: true, zoomScale: 85, zoomScaleNormal: 85 }]
    });

    ws5.columns = [
        { width: 28 }, { width: 18 }, { width: 68 }, { width: 16 }, { width: 45 }
    ];

    ws5.mergeCells('A1:E1');
    const titleCell5 = ws5.getCell('A1');
    titleCell5.value = 'NAVIERA PETRAL S.A. / DELFOS — GLOSARIO TÉCNICO & REGLAS DE NEGOCIO';
    titleCell5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.NAVY_DARK } };
    titleCell5.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: C.WHITE } };
    titleCell5.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws5.getRow(1).height = 26;

    ws5.mergeCells('A2:E2');
    const subCell5 = ws5.getCell('A2');
    subCell5.value = 'DEFINICIONES OPERACIONALES, CRITERIOS DE CÁLCULO Y GLOSARIO OFICIAL DE VARIABLES';
    subCell5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_100 } };
    subCell5.font = { name: 'Segoe UI', size: 9.5, italic: true, bold: true, color: { argb: C.SLATE_600 } };
    subCell5.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws5.getRow(2).height = 20;

    ws5.getRow(3).height = 8;

    const h5Row = ws5.getRow(4);
    h5Row.height = 24;
    const h5Texts = ['Término / Variable', 'Acrónimo', 'Definición Operativa & Comercial', 'Unidad de Medida', 'Impacto en la Liquidación'];
    h5Texts.forEach((t, idx) => {
        const cell = h5Row.getCell(idx + 1);
        cell.value = t;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.PETRAL_TEAL } };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: C.WHITE } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = thinBorder;
    });

    const glossaryItems = [
        ['Voyage Calculator', 'VC', 'Módulo de cotización y simulación proforma previa al zarpe basada en distancias y consumos teóricos.', 'N/A', 'Establece el presupuesto base (Forecast).'],
        ['Voyage Liquidator', 'VL', 'Módulo de liquidación post-viaje que captura datos reales ejecutados y consumos exactos.', 'N/A', 'Determina el P&L Real auditado del armador.'],
        ['Bill of Lading', 'B/L', 'Conocimiento de Embarque marítimo oficial que certifica el tonelaje final transportado.', 'Fecha / MT', 'Base legal irrevocable para facturación de flete.'],
        ['Remaining on Board', 'ROB', 'Inventario de combustible en tanques medido por sondas al inicio y fin de travesía.', 'MT', 'Calcula el consumo real exacto de IFO y MDO.'],
        ['Shifting (Desatraque Forzoso)', 'SHIFT', 'Maniobra donde el buque deja el muelle hacia la bahía por prioridad de otro barco.', 'Horas / USD', 'Genera cobro de compensación ($) y costo extra de bunker/días.'],
        ['Demurrage (Sobreestadía)', 'DEM', 'Indemnización pagada por el fletador al armador por exceder el tiempo de estadía pactado.', 'USD', 'Suma a los ingresos brutos del viaje.'],
        ['Despatch (Pronto Despacho)', 'DESP', 'Bonificación otorgada por el armador al fletador por liberar el buque antes de tiempo.', 'USD', 'Resta de los ingresos brutos del viaje.'],
        ['MDO (Marine Diesel Oil)', 'MDO / MGO', 'Diesel marino destilado usado en generadores auxiliares, fondeo y maniobras portuarias.', 'MT', 'Costo directo variable de combustible liviano.'],
        ['IFO / LSFO', 'IFO', 'Fuel oil pesado de bajo azufre utilizado por el motor principal en navegación.', 'MT', 'Costo directo variable principal de propulsión.'],
        ['OPEX Diario', 'OPEX', 'Costo operativo fijo por día del buque (tripulación, seguros, mantenimiento, víveres).', 'USD / Día', 'Costo fijo asignado según los días reales de duración.']
    ];

    glossaryItems.forEach((item, rIdx) => {
        const row = ws5.getRow(rIdx + 5);
        row.height = 22;
        item.forEach((val, cIdx) => {
            const cell = row.getCell(cIdx + 1);
            cell.value = val;
            cell.font = { name: 'Segoe UI', size: 9, color: { argb: C.SLATE_800 } };
            cell.border = thinBorder;
            if (rIdx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.SLATE_50 } };
            if (cIdx === 1 || cIdx === 3) cell.alignment = { vertical: 'middle', horizontal: 'center' };
            else cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });
    });

    await wb.xlsx.writeFile(targetPath);
    console.log(`✅ Excel réplica exacta de la UI generado en: ${targetPath}`);
}

generateDelfosExactUiExcel().catch(err => {
    console.error("Error al generar Excel UI réplica:", err);
    process.exit(1);
});
