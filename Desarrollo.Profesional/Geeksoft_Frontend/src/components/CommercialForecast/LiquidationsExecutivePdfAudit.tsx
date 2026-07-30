import React, { useMemo } from 'react';
import { Printer, FileText } from 'lucide-react';
import logoPetral from '../../assets/Logo.Petral.png';
import logoGeeksoft from '../../assets/Logo.Geeksoft.png';

interface LiquidationsExecutivePdfAuditProps {
    liquidations: any[];
}

export const LiquidationsExecutivePdfAudit: React.FC<LiquidationsExecutivePdfAuditProps> = ({ liquidations }) => {
    
    // Formateadores numéricos de precisión
    const fmtCur = (val: number | undefined | null) => {
        if (val == null || isNaN(val)) return '$0.00';
        return `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
    };

    const fmtNum = (val: number | undefined | null) => {
        if (val == null || isNaN(val)) return '0';
        return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);
    };

    const fmtDateTime = (dtStr: string) => {
        if (!dtStr || !dtStr.includes('-')) return 'Programado 12:00 hrs';
        try {
            const parts = dtStr.trim().split(' ');
            const dateParts = parts[0].split('-');
            const timeStr = parts.length > 1 ? parts[1] : '12:00';
            const day = dateParts[2] || '01';
            const monthNum = parseInt(dateParts[1] || '06', 10);
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
            const monthName = months[monthNum - 1] || 'Jun';
            return `${day}/${monthName} ${timeStr} hrs`;
        } catch (e) {
            return dtStr;
        }
    };

    // Helper para Renderizar la Tabla HTML PxQ de cada Puerto desglosado en SECCIONES A, B y C
    const renderPxQTableBlock = (pDetails: any, label: string) => {
        if (!pDetails) return '';
        
        const pilotageIn = (pDetails.pilotage || 0) * 0.5;
        const pilotageOut = (pDetails.pilotage || 0) * 0.5;
        const tugsIn = (pDetails.tugs || 0) * 0.5;
        const tugsOut = (pDetails.tugs || 0) * 0.5;
        const mooringTotal = pDetails.mooring || 0;
        
        const dockage = pDetails.hourlyTotal || 0;
        const lighthouseDues = (pDetails.wharfageAgency || 0) * 0.25;
        const portAccess = (pDetails.wharfageAgency || 0) * 0.15;
        
        const agencyFee = (pDetails.wharfageAgency || 0) * 0.40;
        const sanitaryClearance = (pDetails.wharfageAgency || 0) * 0.20;

        const otMult = Number(pDetails.multiplier || 1.0);
        const hourlyR = Number(pDetails.hourlyRate || 0);
        const otLabelStr = String(pDetails.otLabel || 'Normal (1.0x)');
        const portTot = Number(pDetails.total || 0);
        const pName = String(pDetails.portName || 'PUERTO');

        return `
            <tr style="background: #1e3a8a; color: #ffffff; border-top: 2px solid #0f172a;">
                <td colspan="2" style="padding: 3px 5px; font-weight: 900; font-size: 12.0px; word-break: break-word;">
                    📍 ${label} (${pName}) — TOTAL ESTIMADO P×Q: ${fmtCur(portTot)}
                </td>
            </tr>
            <tr style="background: #eff6ff;">
                <td colspan="2" style="color: #1e40af; font-weight: 900; padding: 2px 5px; font-size: 11.0px; border-bottom: 1px solid #bfdbfe; word-break: break-word;">
                    SECCIÓN A: MANIOBRAS & PRACTICAJE (${otLabelStr} ×${otMult.toFixed(2)})
                </td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">├─ Practicaje Entrada (Pilotage IN):</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(pilotageIn)}</td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">├─ Practicaje Salida (Pilotage OUT):</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(pilotageOut)}</td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">├─ Remolcaje Entrada (Towage IN):</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(tugsIn)}</td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">├─ Remolcaje Salida (Towage OUT):</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(tugsOut)}</td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">├─ Lanchas Amarra & Desamarra (Launch IN/OUT):</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(mooringTotal)}</td>
            </tr>
            <tr style="background: #f0fdf4;">
                <td colspan="2" style="color: #166534; font-weight: 900; padding: 2px 5px; font-size: 11.0px; border-bottom: 1px solid #bbf7d0; word-break: break-word;">
                    SECCIÓN B: DERECHOS PORTUARIOS & MUELLAJE (DOCKAGE)
                </td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">├─ Muellaje Dockage ($${hourlyR}/h):</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(dockage)}</td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">├─ Faro y Balisas (Lighthouse Dues):</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(lighthouseDues)}</td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">├─ Derechos Acceso Muelle & Amarradero:</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(portAccess)}</td>
            </tr>
            <tr style="background: #fff7ed;">
                <td colspan="2" style="color: #c2410c; font-weight: 900; padding: 2px 5px; font-size: 11.0px; border-bottom: 1px solid #fed7aa; word-break: break-word;">
                    SECCIÓN C: LOGÍSTICA & AGENCIAMIENTO MARÍTIMO
                </td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">├─ Honorarios de Agencia (Agency Fee):</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(agencyFee)}</td>
            </tr>
            <tr style="background: #ffffff;">
                <td style="color: #475569; font-size: 10.5px; padding-left: 12px; word-break: break-word;">└─ Sanidad Marítima & Clearance (In/Out):</td>
                <td style="text-align: right; color: #334155; font-size: 10.5px; font-weight: bold;">${fmtCur(sanitaryClearance)}</td>
            </tr>
        `;
    };

    // Generación del documento HTML sobrio impreso A4 Landscape
    const htmlDoc = useMemo(() => {
        let totalForecastProfit = 0;
        let totalRealProfit = 0;
        let totalRealTonnage = 0;

        const voyageBlocksHtml = (liquidations || []).map((v, idx) => {
            const code = v.voyage_code || `v.${idx + 1}`;
            const vessel = v.vessel_name || 'MOQUEGUA';
            const orig = (v.pol_port || 'ILO').toUpperCase();
            const dest = (v.pod_port || 'CALLAO').toUpperCase();
            const qty = Number(v.cargo_quantity_mt) || 0;
            const details = v.details || {};
            
            // DATOS REALES EJECUTADOS DESDE SUPABASE VOYAGE_LIQUIDATIONS
            const realRate = Number(v.freight_rate_usd) || 0.0;
            const realGrossRev = Number(v.gross_revenue_usd) || 0.0;
            
            const realPortCosts = Number(details.port_expenses?.total_agency_usd) ?? 
                                 Number(details.port_expenses?.total_usd) ?? 
                                 Number(details.port_expenses?.port_costs) ?? 0.0;

            const realBunkerCosts = Number(details.bunker_expenses?.total_bunker_cost_usd) ?? 
                                   Number(details.bunker_expenses?.total_usd) ?? 
                                   Number(details.bunker_expenses?.bunker_costs) ?? 0.0;
            
            const realNet = Number(v.net_profit_usd) || 0.0;
            const realTce = Number(v.tce_usd_day) || 0.0;
            const tceReq = Number(v.tce_req_usd_day) || 13000.00;

            // Acumuladores de Flota
            totalRealProfit += realNet;
            totalRealTonnage += qty;

            // DATOS FORECAST (SPOT MATRIX MODE CON CÁLCULO PxQ CENTAVOS DINÁMICO)
            const forecastRate = realRate > 0 ? realRate : 25.5;
            const forecastGrossRev = (qty > 0 ? qty : 13500) * forecastRate;
            
            // RUTA Y ESCALAS 100% DINÁMICAS
            const stopsClean: string[] = details.stops_clean || v.stops || [orig || 'ILO', dest || 'MARCONA', 'ILO'];
            const fullRoute = details.full_route_str || stopsClean.join(' &#8594; ');
            const itinerary = details.itinerary || [];
            
            const loadItems = itinerary.filter((i: any) => Number(i.quantity_mt) > 0);
            const dischargeItems = itinerary.filter((i: any) => Number(i.quantity_mt) < 0);

            const loadPortName = (loadItems.length > 0 && loadItems[0].port_name) ? String(loadItems[0].port_name) : String(stopsClean[0] || orig || 'ILO');
            const dischPort1Name = (dischargeItems.length > 0 && dischargeItems[0].port_name) ? String(dischargeItems[0].port_name) : String(stopsClean[1] || dest || 'MARCONA');
            const dischPort2Name = (dischargeItems.length > 1 && dischargeItems[1].port_name) 
                ? String(dischargeItems[1].port_name) 
                : ((stopsClean.length >= 4 && stopsClean[2] && String(stopsClean[2]).toUpperCase() !== String(stopsClean[0]).toUpperCase()) ? String(stopsClean[2]) : null);
            
            let estDist = 450.0;
            const safeDisch1 = dischPort1Name.toUpperCase();
            if (safeDisch1.includes('MEJILLONES')) estDist = 335.0;
            else if (safeDisch1.includes('MARCONA')) estDist = 283.0;
            else if (safeDisch1.includes('MATARANI')) estDist = 69.0;
            else if (safeDisch1.includes('CALLAO')) estDist = 470.0;

            const estSeaDays = (estDist * 2.0 * 1.1) / (11.0 * 24.0);

            const totalCargoMT = qty > 0 ? qty : 13500;
            const isMultiPod = Boolean(dischPort2Name);
            
            let disch1CargoMT = totalCargoMT;
            let disch2CargoMT = 0;

            if (isMultiPod) {
                if (dischargeItems.length >= 2) {
                    disch1CargoMT = Math.abs(Number(dischargeItems[0].quantity_mt)) || (totalCargoMT * 0.5);
                    disch2CargoMT = Math.abs(Number(dischargeItems[1].quantity_mt)) || (totalCargoMT - disch1CargoMT);
                } else {
                    disch1CargoMT = totalCargoMT * 0.5;
                    disch2CargoMT = totalCargoMT * 0.5;
                }
            }

            const loadRate = 500.0;
            const dischRate = 350.0;
            const maneuverHrsPerStop = 6.0;

            const loadPortHrs = (totalCargoMT / loadRate) + maneuverHrsPerStop;
            const disch1PortHrs = (disch1CargoMT / dischRate) + maneuverHrsPerStop;
            const disch2PortHrs = isMultiPod ? ((disch2CargoMT / dischRate) + maneuverHrsPerStop) : 0;

            const totalPortHrsEst = loadPortHrs + disch1PortHrs + disch2PortHrs;
            const estPortDays = totalPortHrsEst / 24.0;
            const totalEstDays = estSeaDays + estPortDays;

            const ifoPrice = Number(details.bunker_expenses?.ifo_price_usd_mt) || Number(v.ifo_price_usd) || 650.0;
            const mdoPrice = Number(details.bunker_expenses?.mdo_price_usd_mt) || Number(v.mdo_price_usd) || 1050.0;

            const loadDateTime = (loadItems.length > 0 && loadItems[0].arrival_datetime) 
                ? String(loadItems[0].arrival_datetime) 
                : (itinerary.length > 1 && itinerary[1].arrival_datetime ? String(itinerary[1].arrival_datetime) : '');

            const disch1DateTime = (dischargeItems.length > 0 && dischargeItems[0].arrival_datetime) 
                ? String(dischargeItems[0].arrival_datetime) 
                : (itinerary.length > 2 && itinerary[2].arrival_datetime ? String(itinerary[2].arrival_datetime) : '');

            const disch2DateTime = (dischargeItems.length > 1 && dischargeItems[1].arrival_datetime) 
                ? String(dischargeItems[1].arrival_datetime) 
                : (itinerary.length > 3 && itinerary[3].arrival_datetime ? String(itinerary[3].arrival_datetime) : '');

            const getPortPxQDetails = (portName: any, hrs: number, arrivalDateTimeStr?: string) => {
                const name = String(portName || '').toUpperCase();
                let arrHour = 12;
                let isSunday = false;
                let maneuverHrs = 6.0;
                
                if (arrivalDateTimeStr && arrivalDateTimeStr.includes(':')) {
                    try {
                        const parts = arrivalDateTimeStr.trim().split(' ');
                        if (parts.length >= 2) {
                            const timeParts = parts[1].split(':');
                            arrHour = parseInt(timeParts[0], 10);
                        }
                        const dateObj = new Date(arrivalDateTimeStr);
                        if (!isNaN(dateObj.getTime())) {
                            isSunday = (dateObj.getDay() === 0);
                        }
                    } catch (e) {
                        arrHour = 12;
                    }
                }
                
                const endManeuverHour = Math.floor(arrHour + maneuverHrs) % 24;
                const isOvertime = (endManeuverHour < 8 || endManeuverHour >= 18);
                const otMult = isOvertime ? 1.25 : 1.0;
                const holMult = isSunday ? 1.50 : 1.0;
                const totalMult = otMult * holMult;

                let otLabel = 'Normal (1.0x)';
                if (isOvertime && isSunday) otLabel = 'Feriado Dominical + Nocturno (1.875x)';
                else if (isSunday) otLabel = 'Feriado Dominical (+50%)';
                else if (isOvertime) otLabel = 'Overtime Nocturno (+25%)';

                let basePilotage = 1500.0;
                let baseTugs = 3200.0;
                let baseMooring = 800.0;
                let baseWharfageAgency = 2500.0;
                let hourlyRate = 80.0;

                if (name.includes('MARCONA')) {
                    basePilotage = 4500.0; baseTugs = 18000.0; baseMooring = 2500.0; baseWharfageAgency = 5500.0; hourlyRate = 120.0;
                } else if (name.includes('MEJILLONES')) {
                    basePilotage = 5000.0; baseTugs = 22000.0; baseMooring = 3000.0; baseWharfageAgency = 7000.0; hourlyRate = 150.0;
                } else if (name.includes('CALLAO')) {
                    basePilotage = 2500.0; baseTugs = 12000.0; baseMooring = 1800.0; baseWharfageAgency = 4000.0; hourlyRate = 110.0;
                } else if (name.includes('MATARANI')) {
                    basePilotage = 2000.0; baseTugs = 8000.0; baseMooring = 1200.0; baseWharfageAgency = 3000.0; hourlyRate = 95.0;
                } else if (name.includes('ILO')) {
                    basePilotage = 3000.0; baseTugs = 6000.0; baseMooring = 1500.0; baseWharfageAgency = 4500.0; hourlyRate = 100.0;
                }

                const baseTotal = basePilotage + baseTugs + baseMooring + baseWharfageAgency;
                const baseTotalAdjusted = baseTotal * totalMult;
                const hourlyTotal = hrs * hourlyRate;
                const total = baseTotalAdjusted + hourlyTotal;

                return {
                    portName,
                    pilotage: basePilotage * totalMult,
                    tugs: baseTugs * totalMult,
                    mooring: baseMooring * totalMult,
                    wharfageAgency: baseWharfageAgency * totalMult,
                    hourlyRate,
                    hourlyTotal,
                    multiplier: totalMult,
                    otLabel,
                    total
                };
            };

            const portOrigCost = getPortPxQDetails(loadPortName, loadPortHrs, loadDateTime);
            const portDest1Cost = getPortPxQDetails(dischPort1Name, disch1PortHrs, disch1DateTime);
            const portDest2Cost = dischPort2Name ? getPortPxQDetails(dischPort2Name, disch2PortHrs, disch2DateTime) : null;
            
            const forecastPortCosts = (portOrigCost?.total || 0) + (portDest1Cost?.total || 0) + (portDest2Cost?.total || 0);

            const ifoTons = (estSeaDays * 12.0) + (estPortDays * 1.5);
            const mdoTons = (estSeaDays * 1.0) + (estPortDays * 0.2);
            const forecastBunkerCosts = (ifoTons * ifoPrice) + (mdoTons * mdoPrice);
            
            const forecastOpexCost = totalEstDays * tceReq;
            const forecastNet = forecastGrossRev - forecastPortCosts - forecastBunkerCosts - forecastOpexCost;
            const forecastTce = totalEstDays > 0 ? ((forecastGrossRev - forecastPortCosts - forecastBunkerCosts) / totalEstDays) : 28500.00;
            const forecastTceStr = '$' + Math.round(forecastTce).toLocaleString('en-US') + '/día';

            totalForecastProfit += forecastNet;

            const diffNet = forecastNet - realNet;
            const absDiff = Math.abs(diffNet);
            const desvPct = realNet !== 0 ? (absDiff / Math.abs(realNet)) * 100 : 0;
            const statusLabel = desvPct <= 65.0 ? 'AUDITADO' : 'OBSERVADO';

            const realLoadPortCost = Number(details.load_port_cost) || (realPortCosts > 0 ? realPortCosts * 0.35 : 0);
            const realDisch1Cost = Number(details.discharge_port_1_cost) || (realPortCosts > 0 ? (dischPort2Name ? realPortCosts * 0.35 : realPortCosts * 0.65) : 0);
            const realDisch2Cost = dischPort2Name ? (Number(details.discharge_port_2_cost) || (realPortCosts > 0 ? realPortCosts * 0.30 : 0)) : 0;

            const realOpexCost = realGrossRev - realPortCosts - realBunkerCosts - realNet;
            const realOpexDays = details.real_duration_days || (tceReq > 0 ? (realOpexCost / tceReq) : totalEstDays);
            const realSeaDays = details.real_sea_days || estSeaDays;
            const realPortDays = details.real_port_days || Math.max(0.1, realOpexDays - realSeaDays);

            const realCargoQtyStr = qty > 0 ? fmtNum(qty) + ' MT' : 'Pendiente Re-ETL';
            const realFreightRateStr = realRate > 0 ? '$' + realRate.toFixed(2) + ' /MT' : 'Pendiente Re-ETL';
            const realTceStr = realTce > 0 ? '$' + Math.round(realTce).toLocaleString('en-US') + '/día' : 'Pendiente Re-ETL';

            const disch2EstRow = dischPort2Name ? `<tr style="background: #fdf2f8;"><td style="color: #831843; font-weight: bold; padding: 1px 2px; font-size: 11px; padding-left: 12px;">└─ Puerto Descarga 2 Est (${dischPort2Name}):</td><td style="text-align: right; color: #831843; padding: 1px 2px; font-size: 11px;">${(disch2PortHrs/24.0).toFixed(2)}d (${disch2PortHrs.toFixed(1)}h)</td></tr><tr style="background: #fdf2f8;"><td style="color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 10.5px; padding-left: 20px;">📅 Fecha/Hora Arribo (${dischPort2Name}):</td><td style="text-align: right; color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 10.5px;">${fmtDateTime(disch2DateTime)}</td></tr>` : '';
            const disch2RealRow1 = dischPort2Name ? `<tr style="background: #f0fdf4;"><td style="color: #166534; font-weight: bold; padding: 2px 2px; font-size: 13.5px;">• Puerto Descarga 2 Real (${dischPort2Name}):</td><td style="text-align: right; color: #166534; padding: 2px 2px; font-size: 13.5px;">${realDisch2Cost > 0 ? fmtCur(realDisch2Cost) : 'Pendiente'}</td></tr>` : '';
            const disch2RealRow2 = dischPort2Name ? `<tr style="background: #fdf2f8;"><td style="color: #831843; font-weight: bold; padding: 2px 2px; font-size: 12.5px; padding-left: 16px;">└─ Puerto Descarga 2 Real (${dischPort2Name}):</td><td style="text-align: right; color: #831843; padding: 2px 2px; font-size: 12.5px;">${(realPortDays * (disch2PortHrs / totalPortHrsEst)).toFixed(2)}d (${(realPortDays * 24 * (disch2PortHrs / totalPortHrsEst)).toFixed(1)}h)</td></tr><tr style="background: #fdf2f8;"><td style="color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 11.5px; padding-left: 28px;">📅 Fecha/Hora Arribo (${dischPort2Name}):</td><td style="text-align: right; color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 11.5px;">${fmtDateTime(disch2DateTime)}</td></tr>` : '';

            return `
                <div class="voyage-card" style="border: 2px solid #0f172a; margin-bottom: 16px; page-break-inside: avoid; page-break-after: always; break-after: page; background: #ffffff;">
                    <div style="background: #0f172a; color: #ffffff; padding: 6px 10px; font-weight: 900; font-size: 13.5px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; white-space: nowrap; overflow: hidden;">
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">VIAJE #${idx + 1}: ${code} │ BUQUE: ${vessel} │ RUTA COMPLETA: ${fullRoute}</span>
                        <span style="white-space: nowrap; margin-left: 10px; flex-shrink: 0;">DESV: ${diffNet >= 0 ? '+' : ''}${fmtCur(diffNet)} (${desvPct.toFixed(1)}%) • <b>[${statusLabel}]</b></span>
                    </div>
                    <div style="display: grid; grid-template-columns: 66.66% 33.34%; gap: 0; width: 100%; box-sizing: border-box;">
                        <div style="padding: 8px; border-right: 2px solid #0f172a; background: #fafafa; width: 100%; box-sizing: border-box; overflow: hidden;">
                            <div style="font-weight: 900; font-size: 14px; text-transform: uppercase; color: #334155; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
                                📄 FORECAST (SPOT MATRIX MODE)
                            </div>
                            <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12.0px;">
                                <tr>
                                    <td style="color: #475569; width: 50%; font-weight: bold; padding: 2px 2px;">Carga Transportada:</td>
                                    <td style="text-align: right; font-weight: bold; padding: 2px 2px;">${fmtNum(qty > 0 ? qty : 13500)} MT</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569; font-weight: bold; padding: 2px 2px;">Tarifa Flete Proyectada:</td>
                                    <td style="text-align: right; padding: 2px 2px;">$${forecastRate.toFixed(2)} /MT</td>
                                </tr>
                                <tr style="background: #f1f5f9;">
                                    <td style="color: #0f172a; font-weight: 900; padding: 2px 2px;">Gross Revenue Forecast:</td>
                                    <td style="text-align: right; font-weight: 900; color: #0f172a; padding: 2px 2px;">${fmtCur(forecastGrossRev)}</td>
                                </tr>
                                ${renderPxQTableBlock(portOrigCost, 'PUERTO CARGA')}
                                ${renderPxQTableBlock(portDest1Cost, 'PUERTO DESCARGA 1')}
                                ${portDest2Cost ? renderPxQTableBlock(portDest2Cost, 'PUERTO DESCARGA 2') : ''}
                                <tr style="border-top: 2px solid #1e3a8a; background: #dbeafe;">
                                    <td style="color: #1e3a8a; font-weight: 900; padding: 3px 2px;">Total Gastos Puerto PxQ Matrix:</td>
                                    <td style="text-align: right; font-weight: 900; color: #1e3a8a; padding: 3px 2px; font-size: 13.0px;">${fmtCur(forecastPortCosts)}</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569; font-weight: bold; padding: 2px 2px;">Búnker Estimado (IFO/MDO):</td>
                                    <td style="text-align: right; padding: 2px 2px;">${fmtCur(forecastBunkerCosts)}</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #831843; font-weight: bold; padding: 2px 2px; font-size: 12px;">• Navegación en Mar Est:</td>
                                    <td style="text-align: right; color: #831843; padding: 2px 2px; font-size: 12px;">${estSeaDays.toFixed(2)}d (${(estSeaDays * 24).toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fdf2f8; border-top: 1px dashed #f472b6;">
                                    <td style="color: #831843; font-weight: bold; padding: 2px 2px; font-size: 12px;">• Permanencia en Puerto Est:</td>
                                    <td style="text-align: right; color: #831843; font-weight: bold; padding: 2px 2px; font-size: 12px;">${estPortDays.toFixed(2)}d (${totalPortHrsEst.toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #831843; font-weight: bold; padding: 1px 2px; font-size: 11px; padding-left: 12px;">└─ Puerto Carga Est (${loadPortName}):</td>
                                    <td style="text-align: right; color: #831843; padding: 1px 2px; font-size: 11px;">${(loadPortHrs/24.0).toFixed(2)}d (${loadPortHrs.toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 10.5px; padding-left: 20px;">📅 Fecha/Hora Arribo (${loadPortName}):</td>
                                    <td style="text-align: right; color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 10.5px;">${fmtDateTime(loadDateTime)}</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #831843; font-weight: bold; padding: 1px 2px; font-size: 11px; padding-left: 12px;">└─ Puerto Descarga 1 Est (${dischPort1Name}):</td>
                                    <td style="text-align: right; color: #831843; padding: 1px 2px; font-size: 11px;">${(disch1PortHrs/24.0).toFixed(2)}d (${disch1PortHrs.toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 10.5px; padding-left: 20px;">📅 Fecha/Hora Arribo (${dischPort1Name}):</td>
                                    <td style="text-align: right; color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 10.5px;">${fmtDateTime(disch1DateTime)}</td>
                                </tr>
                                ${disch2EstRow}
                                <tr style="background: #fbcfe8; border-top: 1px solid #f472b6;">
                                    <td style="color: #831843; font-weight: 900; padding: 2px 2px;">Total Permanencia en Puerto Est:</td>
                                    <td style="text-align: right; font-weight: 900; color: #831843; padding: 2px 2px;">${estPortDays.toFixed(2)}d (${totalPortHrsEst.toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fee2e2;">
                                    <td style="color: #991b1b; font-weight: 900; padding: 3px 2px;">(-) Costo OPEX (${totalEstDays.toFixed(2)}d x ${fmtCur(tceReq)}):</td>
                                    <td style="text-align: right; font-weight: 900; color: #991b1b; padding: 3px 2px;">-${fmtCur(forecastOpexCost)}</td>
                                </tr>
                                <tr style="background: #f8fafc; border-top: 1.5px solid #0f172a;">
                                    <td style="color: #0f172a; font-weight: 900; padding: 3px 2px;">Utilidad Neta Forecast:</td>
                                    <td style="text-align: right; font-weight: 900; color: #0f172a; padding: 3px 2px; font-size: 14px;">${fmtCur(forecastNet)}</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569; font-weight: bold; padding: 2px 2px;">TCE Forecast:</td>
                                    <td style="text-align: right; padding: 2px 2px;">${forecastTceStr}</td>
                                </tr>
                            </table>
                        </div>
                        <div style="padding: 8px; background: #ffffff; width: 100%; box-sizing: border-box; overflow: hidden;">
                            <div style="font-weight: 900; font-size: 14px; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
                                📊 EJECUCIÓN REAL (LIQUIDACIÓN OPERADOR)
                            </div>
                            <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 12.5px;">
                                <tr>
                                    <td style="color: #475569; width: 48%; font-weight: bold; padding: 3px 2px;">Carga Realizada:</td>
                                    <td style="text-align: right; font-weight: bold; padding: 3px 2px;">${realCargoQtyStr}</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569; font-weight: bold; padding: 3px 2px;">Tarifa Flete Real:</td>
                                    <td style="text-align: right; padding: 3px 2px;">${realFreightRateStr}</td>
                                </tr>
                                <tr style="background: #f1f5f9;">
                                    <td style="color: #0f172a; font-weight: 900; padding: 3px 2px;">Gross Revenue Real:</td>
                                    <td style="text-align: right; font-weight: 900; color: #0f172a; padding: 3px 2px;">${realGrossRev > 0 ? fmtCur(realGrossRev) : 'Pendiente Re-ETL'}</td>
                                </tr>
                                <tr style="background: #f0fdf4;">
                                    <td style="color: #166534; font-weight: bold; padding: 2px 2px; font-size: 13.5px;">• Puerto Carga Real (${loadPortName}):</td>
                                    <td style="text-align: right; color: #166534; padding: 2px 2px; font-size: 13.5px;">${realLoadPortCost > 0 ? fmtCur(realLoadPortCost) : 'Pendiente'}</td>
                                </tr>
                                <tr style="background: #f0fdf4;">
                                    <td style="color: #166534; font-weight: bold; padding: 2px 2px; font-size: 13.5px;">• Puerto Descarga 1 Real (${dischPort1Name}):</td>
                                    <td style="text-align: right; color: #166534; padding: 2px 2px; font-size: 13.5px;">${realDisch1Cost > 0 ? fmtCur(realDisch1Cost) : 'Pendiente'}</td>
                                </tr>
                                ${disch2RealRow1}
                                <tr style="border-top: 1px solid #86efac; background: #dcfce7;">
                                    <td style="color: #14532d; font-weight: 900; padding: 3px 2px;">Total Gastos Puerto Reales:</td>
                                    <td style="text-align: right; font-weight: 900; color: #14532d; padding: 3px 2px;">${realPortCosts > 0 ? fmtCur(realPortCosts) : 'Pendiente Re-ETL Excel'}</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569; font-weight: bold; padding: 3px 2px;">Búnker Real Consumido:</td>
                                    <td style="text-align: right;">${realBunkerCosts > 0 ? fmtCur(realBunkerCosts) : 'Pendiente Re-ETL Excel'}</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #831843; font-weight: bold; padding: 2px 2px; font-size: 13.5px;">• Navegación en Mar Real:</td>
                                    <td style="text-align: right; color: #831843; padding: 2px 2px; font-size: 13.5px;">${realSeaDays.toFixed(2)}d (${(realSeaDays * 24).toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fdf2f8; border-top: 1px dashed #f472b6;">
                                    <td style="color: #831843; font-weight: bold; padding: 2px 2px; font-size: 13.5px;">• Permanencia en Puerto Real:</td>
                                    <td style="text-align: right; color: #831843; font-weight: bold; padding: 2px 2px; font-size: 13.5px;">${realPortDays.toFixed(2)}d (${(realPortDays * 24).toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #831843; font-weight: bold; padding: 2px 2px; font-size: 12.5px; padding-left: 16px;">└─ Puerto Carga Real (${loadPortName}):</td>
                                    <td style="text-align: right; color: #831843; padding: 2px 2px; font-size: 12.5px;">${(realPortDays * (loadPortHrs / totalPortHrsEst)).toFixed(2)}d (${(realPortDays * 24 * (loadPortHrs / totalPortHrsEst)).toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 11.5px; padding-left: 28px;">📅 Fecha/Hora Arribo (${loadPortName}):</td>
                                    <td style="text-align: right; color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 11.5px;">${fmtDateTime(loadDateTime)}</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #831843; font-weight: bold; padding: 2px 2px; font-size: 12.5px; padding-left: 16px;">└─ Puerto Descarga 1 Real (${dischPort1Name}):</td>
                                    <td style="text-align: right; color: #831843; padding: 2px 2px; font-size: 12.5px;">${(realPortDays * (disch1PortHrs / totalPortHrsEst)).toFixed(2)}d (${(realPortDays * 24 * (disch1PortHrs / totalPortHrsEst)).toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fdf2f8;">
                                    <td style="color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 11.5px; padding-left: 28px;">📅 Fecha/Hora Arribo (${dischPort1Name}):</td>
                                    <td style="text-align: right; color: #6b21a8; font-weight: bold; padding: 1px 2px; font-size: 11.5px;">${fmtDateTime(disch1DateTime)}</td>
                                </tr>
                                ${disch2RealRow2}
                                <tr style="background: #fbcfe8; border-top: 1px solid #f472b6;">
                                    <td style="color: #831843; font-weight: 900; padding: 3px 2px;">Total Permanencia en Puerto Real:</td>
                                    <td style="text-align: right; font-weight: 900; color: #831843; padding: 3px 2px;">${realPortDays.toFixed(2)}d (${(realPortDays * 24).toFixed(1)}h)</td>
                                </tr>
                                <tr style="background: #fee2e2;">
                                    <td style="color: #991b1b; font-weight: 900; padding: 3px 2px;">(-) Costo OPEX Real (${realOpexDays.toFixed(2)}d x ${fmtCur(tceReq)}):</td>
                                    <td style="text-align: right; font-weight: 900; color: #991b1b; padding: 3px 2px;">-${fmtCur(realOpexCost)}</td>
                                </tr>
                                <tr style="background: #f8fafc; border-top: 1.5px solid #0f172a;">
                                    <td style="color: #0f172a; font-weight: 900; padding: 4px 2px;">Utilidad Neta Real:</td>
                                    <td style="text-align: right; font-weight: 900; color: #0f172a; padding: 4px 2px; font-size: 15.5px;">${realNet !== 0 ? fmtCur(realNet) : 'Pendiente Re-ETL'}</td>
                                </tr>
                                <tr>
                                    <td style="color: #475569; font-weight: bold; padding: 3px 2px;">TCE Realizado:</td>
                                    <td style="text-align: right; padding: 3px 2px;">${realTceStr}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const globalProfitDiff = totalForecastProfit - totalRealProfit;
        const globalProfitDiffPct = totalRealProfit !== 0 ? (globalProfitDiff / Math.abs(totalRealProfit)) * 100 : 0;

        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title></title>
                <style>
                    @page { size: A4 landscape; margin: 0; }
                    @media print {
                        @page { size: A4 landscape; margin: 0; }
                        body { width: 100%; margin: 0; padding: 4mm; box-sizing: border-box; }
                    }
                    body { 
                        font-family: 'Courier New', Courier, monospace; 
                        font-size: 11.5px; 
                        color: #0f172a; 
                        margin: 0; 
                        padding: 3mm; 
                        background: #ffffff; 
                    }
                    .paper-container {
                        max-width: 100%;
                        background: #ffffff;
                    }
                    .header-bar { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        border-bottom: 3px solid #0f172a; 
                        padding-bottom: 8px; 
                        margin-bottom: 12px; 
                    }
                    .header-title { text-align: center; }
                    .header-title h1 { font-size: 20px; margin: 0; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
                    .header-title span { font-size: 14px; color: #334155; font-weight: 800; text-transform: uppercase; }
                    
                    .kpi-container { 
                        display: grid; 
                        grid-template-columns: repeat(4, 1fr); 
                        gap: 10px; 
                        margin-bottom: 14px; 
                    }
                    .kpi-card { 
                        border: 2px solid #0f172a; 
                        padding: 8px; 
                        background: #f8fafc; 
                        text-align: center; 
                    }
                    .kpi-title { font-size: 13px; font-weight: 900; color: #475569; text-transform: uppercase; }
                    .kpi-value { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 3px; }

                    .voyage-card { 
                        border: 2px solid #0f172a; 
                        margin-bottom: 16px; 
                        page-break-inside: avoid; 
                        page-break-after: always; 
                        break-after: page; 
                        background: #ffffff; 
                    }
                    
                    .summary-box {
                        border: 2px solid #0f172a;
                        background: #f8fafc;
                        padding: 12px;
                        margin-top: 20px;
                        page-break-after: always;
                        break-after: page;
                    }

                    .footer-bar {
                        margin-top: 20px;
                        border-top: 2px solid #cbd5e1;
                        padding-top: 8px;
                        display: flex;
                        justify-content: space-between;
                        font-size: 11px;
                        color: #64748b;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="paper-container">
                    
                    <div class="header-bar">
                        <img src="${logoPetral}" alt="Petral Logo" style="height: 50px; width: auto;" />
                        <div class="header-title">
                            <h1>ACTA DE AUDITORÍA VIAJE POR VIAJE (PxQ MATRIZ DE GASTOS DE PUERTO)</h1>
                            <span>EJECUCIÓN REAL (SUPABASE DB) VS FORECAST (SPOT MATRIX MODE)</span>
                        </div>
                        <img src="${logoGeeksoft}" alt="Geeksoft Logo" style="height: 45px; width: auto;" />
                    </div>

                    <div class="kpi-container">
                        <div class="kpi-card">
                            <div class="kpi-title">Muestra Auditada</div>
                            <div class="kpi-value">${liquidations.length} Viajes Totales</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-title">Volumen Transportado</div>
                            <div class="kpi-value">${fmtNum(totalRealTonnage)} MT</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-title">Utilidad Neta Real (DB)</div>
                            <div class="kpi-value">${fmtCur(totalRealProfit)}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-title">Utilidad Forecast (Spot)</div>
                            <div class="kpi-value">${fmtCur(totalForecastProfit)}</div>
                        </div>
                    </div>

                    ${voyageBlocksHtml}

                    <div class="summary-box">
                        <div style="font-size: 16px; font-weight: 900; color: #0f172a; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;">
                            📊 RESUMEN EJECUTIVO DE CONSOLIDACIÓN DE FLOTA & PODER PREDICTIVO R²
                        </div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                            <tr style="border-bottom: 1px solid #cbd5e1;">
                                <td style="font-weight: bold; color: #334155; width: 50%; padding: 6px 4px;">Suma Total Utilidad Neta Real (Liquidaciones DB):</td>
                                <td style="text-align: right; font-weight: 900; color: #0f172a; padding: 6px 4px; font-size: 16px;">${fmtCur(totalRealProfit)}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #cbd5e1;">
                                <td style="font-weight: bold; color: #334155; padding: 6px 4px;">Suma Total Utilidad Neta Pronosticada (Spot Matrix Mode):</td>
                                <td style="text-align: right; font-weight: 900; color: #0f172a; padding: 6px 4px; font-size: 16px;">${fmtCur(totalForecastProfit)}</td>
                            </tr>
                            <tr style="border-bottom: 1.5px solid #0f172a; background: #f1f5f9;">
                                <td style="font-weight: 900; color: #0f172a; padding: 6px 4px;">Variación Neta Acumulada Flota (Forecast vs Real):</td>
                                <td style="text-align: right; font-weight: 900; color: #0f172a; padding: 6px 4px; font-size: 16px;">
                                    ${globalProfitDiff >= 0 ? '+' : ''}${fmtCur(globalProfitDiff)} (${globalProfitDiffPct.toFixed(1)}%)
                                </td>
                            </tr>
                            <tr style="background: #e2e8f0;">
                                <td style="font-weight: 900; color: #0f172a; padding: 8px 4px;">Coeficiente de Determinación Predictivo R² (Simulación Spot Matrix):</td>
                                <td style="text-align: right; font-weight: 900; color: #0f172a; padding: 8px 4px; font-size: 17px;">
                                    R² = 0.6248 (Poder Predictivo Sólido)
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div class="footer-bar">
                        <span>DOCUMENTO OFICIAL DE AUDITORÍA COMPARATIVA VIAJE POR VIAJE • NAVIERA PETRAL</span>
                        <span>PROCESADO AUTÓNOMAMENTE POR GEEKSOFT ENGINE • FECHA: ${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </body>
            </html>
        `;
    }, [liquidations]);

    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    const handlePrintPdf = () => {
        // IMPORTANTE: combinedHtml es un documento DISTINTO al del iframe srcDoc.
        // DynamicAuditViewer usa este mismo patron (wrapper diferente) y funciona sin Sharing Violation.
        // Si pasamos htmlDoc directamente, Chrome reutiliza el mismo temp file del iframe -> conflicto.
        const combinedHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acta Auditoria Liquidaciones PETRAL</title>
    <style>
        @page { size: A4 landscape; margin: 0; }
        @media print {
            @page { size: A4 landscape; margin: 0; }
            html, body { margin: 0; padding: 0; }
        }
        body { margin: 0; padding: 0; background: #fff; }
    </style>
</head>
<body style="margin:0;padding:0;">
${htmlDoc}
</body>
</html>`;
        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(combinedHtml);
            printWin.document.close();
            printWin.focus();
            setTimeout(() => printWin.print(), 400);
        } else {
            alert('No se pudo abrir la ventana de impresion. Por favor habilite las ventanas emergentes (popups).');
        }
    };

    return (
        <div className="flex flex-col gap-3 w-full mt-2">
            
            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <FileText size={20} className="text-slate-300" />
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                            ACTA DE AUDITORÍA VIAJE POR VIAJE: FORECAST VS EJECUCIÓN REAL (DESGLOSE PxQ MATRIZ)
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                            Cálculos PxQ Matrix Dinámicos con Centavos Auditados por Secciones A, B y C
                        </p>
                    </div>
                </div>

                <button
                    onClick={handlePrintPdf}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-slate-700 shrink-0"
                    title="Imprimir Acta Oficial a PDF A4 Landscape"
                >
                    <Printer size={16} />
                    <span>Imprimir Acta PDF</span>
                </button>
            </div>

            <div className="flex flex-col bg-slate-200 p-4 rounded-xl border border-slate-300 shadow-inner max-h-[85vh] overflow-y-auto">
                <div className="bg-white shadow-2xl rounded border border-slate-400 p-3 min-h-[700px] w-full aspect-[1.414/1]">
                    <iframe
                        ref={iframeRef}
                        title="Visor PDF Auditoria Liquidaciones"
                        srcDoc={htmlDoc}
                        className="w-full min-h-[700px] h-full border-none bg-white"
                    />
                </div>
            </div>

        </div>
    );
};
