import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from './MasterTemplate_V2';
import { Map, ChevronDown, ChevronRight, MapPin, Trash2, Printer } from 'lucide-react';
import { ForecastService } from '../../services/api';



interface RouteMasterProps {
    mode?: 'routes' | 'quotes';
}

export const RouteMaster_V2: React.FC<RouteMasterProps> = ({ mode = 'routes' }) => {
    const isQuotesMode = mode === 'quotes';
    const [routes, setRoutes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [pdfActiveId, setPdfActiveId] = useState<string | null>(null);

    const loadRoutes = async () => {
        try {
            setIsLoading(true);
            const data = await ForecastService.getSpotVoyages();
            setRoutes(data || []);
        } catch (error) {
            console.error("Error al cargar maestro de rutas:", error);
            alert("Error al cargar rutas.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRoutes();
    }, []);

    const filteredRoutes = useMemo(() => {
        if (isQuotesMode) {
            return routes.filter(r => r.name && r.name.toLowerCase().startsWith('prospect'));
        }
        return routes.filter(r => !r.name || !r.name.toLowerCase().startsWith('prospect'));
    }, [routes, isQuotesMode]);

    const toggleRow = (routeId: string) => {
        if (expandedRow === routeId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(routeId);
        }
    };

    const handleDeleteRoute = async (spotId: string, routeName: string) => {
        if (!spotId) return;
        const confirmDelete = window.confirm(`¿Está seguro de que desea borrar permanentemente la ruta "${routeName}"?`);
        if (!confirmDelete) return;

        try {
            await ForecastService.deleteSpotVoyage(spotId);
            alert(`Ruta "${routeName}" eliminada exitosamente.`);
            loadRoutes();
        } catch (error) {
            console.error("Error al eliminar la ruta:", error);
            alert("Ocurrió un error al intentar borrar la ruta.");
        }
    };

    // =============================================================
    // GENERADOR DEL ACTA COMPLETA — LEE 100% DE LA FOTO legs_data
    // Idéntico en profundidad a VoyageLedgerFinal. Sin API call.
    // =============================================================
    const buildAuditaHtml = (routeObj: any): string => {
        const ld = routeObj.legs_data || {};
        const tramos: any[] = ld.tramos || [];
        const fmt2 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fmt1 = (n: number) => n.toFixed(1);

        // --- PARÁMETROS DEL SNAPSHOT ---
        const vesselName   = ld.vessel_name || 'BT MOQUEGUA';
        const speed        = Number(ld.vessel_speed) || 11.0;
        const grt          = Number(ld.grt) || 28000;
        const loa          = Number(ld.loa) || 183.0;
        const Q            = Number(ld.cargo_tons) || 13500;
        const F            = Number(ld.freight_rate) || 25.50;
        const pIfo         = Number(ld.bunker_price_ifo) || 895.14;
        const pMdo         = Number(ld.bunker_price_mdo) || 1460.30;
        const consSeaIfo   = 14.0;  // t/día en navegación (Handysize estándar)
        const consPortIfo  = 2.4;   // t/día en puerto idle
        const addrComm     = Number(ld.addressCommPct) || 0.0;
        const brkComm      = Number(ld.brokerCommPct)  || 0.0;
        const tceRequired  = 13000; // TCE requerido de flota
        const portCostLoad = Number(ld.port_cost_load) || 0;
        const portCostDisch= Number(ld.port_cost_disch)|| 0;
        const totalPortCosts = portCostLoad + portCostDisch;
        const clientName   = routeObj.client || (routeObj.name || '').split('.')[1] || 'PROSPECTO';
        const genDate      = new Date().toLocaleString('es-PE');

        // --- CÁLCULO POR PIERNAS ---
        interface LegCalc {
            type: string;
            orig: string;
            dest: string;
            dist: number;
            wf: number;
            rL: number;
            rD: number;
            ohOrig: number; // overhead horas origen
            ohDest: number; // overhead horas destino
            seaDays: number;
            portDays: number;
            bunkerSeaIfo: number;
            bunkerPortIfo: number;
            bunkerTotal: number;
            agOrig: number;
            agDest: number;
            freightLeg: number;
        }

        const legs: LegCalc[] = tramos.map((tr: any) => {
            const type   = (tr.type || 'BALLAST').toUpperCase();
            const dist   = Number(tr.route_distance || tr.distance) || 0;
            const wf     = Number(tr.weather_factor) || 0.03;
            const rL     = Number(tr.contract_agreed_load_rate || tr.custom_load_rate) || 500;
            const rD     = Number(tr.contract_agreed_discharge_rate || tr.custom_discharge_rate) || 350;
            const ohOrig = Number(tr.port_overhead_hours_origin) || 6;
            const ohDest = Number(tr.port_overhead_hours_dest)   || 6;

            // Días de mar: dist × (1 + WF) / (speed × 24)
            const seaDays = (dist * (1 + wf)) / (speed * 24);

            // Días de puerto (solo LADEN tiene carga y descarga)
            let portDays = 0;
            if (type === 'LADEN') {
                const loadDays  = Q / (rL * 24);
                const dischDays = Q / (rD * 24);
                const idleDays  = (ohOrig + ohDest) / 24;
                portDays = loadDays + dischDays + idleDays;
            } else {
                // BALLAST: solo overheads si aplica
                portDays = (ohOrig + ohDest) / 24;
            }

            // Bunker en mar: seaDays × consSeaIfo
            const bunkerSeaIfo  = seaDays * consSeaIfo;
            // Bunker en puerto: portDays × consPortIfo (idle consumption)
            const bunkerPortIfo = portDays * consPortIfo;
            const bunkerTotal   = (bunkerSeaIfo + bunkerPortIfo) * pIfo;

            const agOrig     = Number(tr.agency_costs_origin || 0);
            const agDest     = Number(tr.agency_costs_destination || 0);
            const freightLeg = type === 'LADEN' ? Q * F : 0;

            return {
                type,
                orig: tr.origin_port_id || '-',
                dest: tr.destination_port_id || '-',
                dist, wf, rL, rD, ohOrig, ohDest,
                seaDays, portDays,
                bunkerSeaIfo, bunkerPortIfo, bunkerTotal,
                agOrig, agDest,
                freightLeg
            };
        });

        // --- CONSOLIDADOS ---
        const totSeaDays  = legs.reduce((s, l) => s + l.seaDays, 0);
        const totPortDays = legs.reduce((s, l) => s + l.portDays, 0);
        const totDays     = totSeaDays + totPortDays;
        const totIfoMt    = legs.reduce((s, l) => s + l.bunkerSeaIfo + l.bunkerPortIfo, 0);
        const totBunkerUsd= totIfoMt * pIfo;
        const grossIncome = legs.reduce((s, l) => s + l.freightLeg, 0);
        const commissions = grossIncome * (addrComm + brkComm) / 100;
        const voyageResult= grossIncome - commissions - totBunkerUsd - totalPortCosts;
        const tceReal     = totDays > 0 ? voyageResult / totDays : 0;
        const plVsReq     = voyageResult - (totDays * tceRequired);
        const totDistNm   = legs.reduce((s, l) => s + l.dist, 0);
        const trayecto    = legs.map(l => l.orig).join(' ➔ ') + ' ➔ ' + (legs[legs.length-1]?.dest || '');

        // --- BLOQUE PIERNAS ---
        const ladenLeg = legs.find(l => l.type === 'LADEN') || legs[0];

        let piernasHtml = '';
        legs.forEach((leg, i) => {
            const isLaden = leg.type === 'LADEN';
            const loadDays  = isLaden ? Q / (leg.rL * 24) : 0;
            const dischDays = isLaden ? Q / (leg.rD * 24) : 0;
            const idleDays  = (leg.ohOrig + leg.ohDest) / 24;
            piernasHtml += `
  │   ● PIERNA #${i+1} [${leg.type}]:  ${leg.orig} ➔ ${leg.dest}  |  Distancia: ${fmt1(leg.dist)} NM
  │       🌊 Días de Mar   = [${fmt1(leg.dist)} NM × (1 + ${(leg.wf*100).toFixed(1)}% WF)] / [${speed.toFixed(1)} kts × 24h]
  │                        = ${fmt1(leg.dist * (1+leg.wf))} NM / ${(speed*24).toFixed(0)} = <b>${leg.seaDays.toFixed(3)} días</b>
  │          ↳ IFO en Mar  = ${leg.seaDays.toFixed(3)}d × ${consSeaIfo.toFixed(1)} t/d = ${leg.bunkerSeaIfo.toFixed(3)} t  →  $${fmt2(leg.bunkerSeaIfo * pIfo)} USD
  │       ⚓ Días de Puerto = ${isLaden
      ? `Carga(${Q}t / ${leg.rL}t/h / 24) + Descarga(${Q}t / ${leg.rD}t/h / 24) + Overheads(${(leg.ohOrig+leg.ohDest).toFixed(0)}h/24)
  │                        = ${loadDays.toFixed(3)}d + ${dischDays.toFixed(3)}d + ${idleDays.toFixed(3)}d = <b>${leg.portDays.toFixed(3)} días</b>`
      : `Solo Overheads (${(leg.ohOrig+leg.ohDest).toFixed(0)}h / 24) = <b>${leg.portDays.toFixed(3)} días</b> (Pierna Lastre)`}
  │          ↳ IFO en Puerto = ${leg.portDays.toFixed(3)}d × ${consPortIfo.toFixed(1)} t/d = ${leg.bunkerPortIfo.toFixed(3)} t  →  $${fmt2(leg.bunkerPortIfo * pIfo)} USD
  │       🔥 Bunker Total Pierna = $${fmt2(leg.bunkerTotal)} USD  (${(leg.bunkerSeaIfo+leg.bunkerPortIfo).toFixed(3)} t × $${pIfo.toFixed(2)}/t)${
  isLaden ? `
  │       🚢 Agencia Puerto Carga    (${leg.orig}):  $${fmt2(leg.agOrig)} USD
  │       🚢 Agencia Puerto Descarga (${leg.dest}):  $${fmt2(leg.agDest)} USD
  │       💵 Ingreso Flete Pierna:  ${Q.toLocaleString()} MT × $${F.toFixed(2)}/MT = $${fmt2(leg.freightLeg)} USD` : `
  │       🚢 Agencia Puerto:  $0.00 USD (Lastre — sin carga)
  │       💵 Ingreso Flete Pierna:  $0.00 USD`}`;
        });

        // --- TABLA 12 MÉTRICAS ---
        const metrics12 = [
            ['1. Ritmo de Carga (rL)', 'contract_agreed_load_rate', `${ladenLeg?.rL || 500} T/h`, `${ladenLeg?.rL || 500} T/h`],
            ['2. Ritmo de Descarga (rD)', 'contract_agreed_discharge_rate', `${ladenLeg?.rD || 350} T/h`, `${ladenLeg?.rD || 350} T/h`],
            ['3. Días de Puerto', '(Q/rL)/24 + (Q/rD)/24 + overheads/24', `${ladenLeg ? (Q/(ladenLeg.rL*24)).toFixed(3) : 0}d carga + ${ladenLeg ? (Q/(ladenLeg.rD*24)).toFixed(3) : 0}d disch + ${((ladenLeg?.ohOrig||6)+(ladenLeg?.ohDest||6))/24}d idle`, `${fmt2(totPortDays)} días`],
            ['4. Días de Mar', 'Sum[ dist×(1+WF) / (speed×24) ]', legs.map((l,i)=>`P${i+1}: ${l.dist.toFixed(0)}NM → ${l.seaDays.toFixed(3)}d`).join(' | '), `${fmt2(totSeaDays)} días`],
            ['5. Días Totales del Viaje', 'sea_days + port_days', `${fmt2(totSeaDays)}d mar + ${fmt2(totPortDays)}d puerto`, `${fmt2(totDays)} días`],
            ['6. Ingreso Bruto de Flete', 'Q × F', `${Q.toLocaleString()} MT × $${F.toFixed(2)}/MT`, `$${fmt2(grossIncome)}`],
            ['7. Comisiones', 'income × (addr% + broker%)', `$${fmt2(grossIncome)} × ${(addrComm+brkComm).toFixed(1)}%`, `$${fmt2(commissions)}`],
            ['8. Costo Bunker IFO Total', 'total_ifo_mt × precio_ifo', `${totIfoMt.toFixed(3)} t × $${pIfo.toFixed(2)}/t`, `$${fmt2(totBunkerUsd)}`],
            ['9. Gastos Portuarios', 'port_cost_load + port_cost_disch', `$${fmt2(portCostLoad)} carga + $${fmt2(portCostDisch)} descarga`, `$${fmt2(totalPortCosts)}`],
            ['10. Voyage Result (PnL Neto)', 'income - comm - bunker - port_costs', `$${fmt2(grossIncome)} - $${fmt2(commissions)} - $${fmt2(totBunkerUsd)} - $${fmt2(totalPortCosts)}`, `$${fmt2(voyageResult)}`],
            ['11. TCE Diario Real', 'voyage_result / total_days', `$${fmt2(voyageResult)} / ${fmt2(totDays)} días`, `$${fmt2(tceReal)}/día`],
            ['12. P/L vs TCE Requerido', 'voyage_result − (total_days × tce_req)', `$${fmt2(voyageResult)} − (${fmt2(totDays)}d × $${tceRequired.toLocaleString()}/d)`, `$${fmt2(plVsReq)}`],
        ];

        const rowsHtml = metrics12.map(([item, formula, calc, result], i) => {
            const isTotal = i === 9 || i === 10 || i === 11;
            const isGood  = i === 10 && tceReal >= tceRequired;
            const bg      = i === 9 ? '#fff9ec' : i === 10 ? (isGood ? '#ecfdf5' : '#fff1f2') : i === 11 ? '#f0f9ff' : (i % 2 === 0 ? '#f9fafb' : '#ffffff');
            const color   = i === 10 ? (isGood ? '#047857' : '#b91c1c') : '#000000';
            return `<tr style="background:${bg};">
              <td style="border:1px solid #000;padding:3px 5px;font-weight:${isTotal?'bold':'normal'};">${item}</td>
              <td style="border:1px solid #000;padding:3px 5px;font-style:italic;">${formula}</td>
              <td style="border:1px solid #000;padding:3px 5px;">${calc}</td>
              <td style="border:1px solid #000;padding:3px 5px;text-align:right;font-weight:bold;color:${color};">${result}</td>
            </tr>`;
        }).join('');

        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title></title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; background:#fff; color:#000; font-size:6.5pt; line-height:1.18; margin:0; padding:5mm 6mm; }
    .header-table { width:100%; border-collapse:collapse; border-bottom:2px solid #000; margin-bottom:4px; }
    .header-table td { border:none; padding:1px 0; vertical-align:middle; }
    .brand { font-weight:bold; font-size:9pt; text-align:center; }
    .badge { background:#fef3c7; border:1px solid #d97706; padding:1px 6px; font-size:7pt; font-weight:bold; border-radius:3px; }
    pre { font-family:'Courier New',monospace; font-size:6.2pt; line-height:1.15; white-space:pre; margin:3px 0; }
    table.metrics { width:100%; border-collapse:collapse; border:1.5px solid #000; font-size:6.2pt; margin-top:4px; }
    table.metrics thead tr { background:#1e293b; color:#fff; }
    table.metrics th { padding:2px 4px; text-align:left; font-size:6.5pt; }
    table.metrics td { font-size:6.2pt; padding:2px 4px; }
    .firma-table { width:100%; border-collapse:collapse; border:none; margin-top:5px; border-top:1.5px solid #000; padding-top:3px; font-size:6.5pt; }
    .box-firma { border:1px solid #000; height:28px; background:#fafafa; padding:2px; }
    .check { display:inline-block; width:9px; height:9px; border:1px solid #000; margin-right:3px; }
    b { font-weight:bold; }
  </style>
</head>
<body>

  <!-- CABECERA -->
  <table class="header-table">
    <tr>
      <td style="width:20%;"><strong>PETRAL S.A.</strong><br/>Auditoría Comercial</td>
      <td style="width:60%;" class="brand">
        PETRAL SMART DASHBOARD • MOTOR SPOT GEEKSOFT ENGINE<br/>
        <span style="font-size:7.5pt;font-weight:normal;">ACTA OFICIAL DE AUDITORÍA Y TRAZABILIDAD DE COTIZACIÓN — ${routeObj.name}</span>
      </td>
      <td style="width:20%;text-align:right;">
        <span class="badge">PROSPECTO: ${clientName}</span><br/>
        <span style="font-size:6.5pt;">${genDate}</span>
      </td>
    </tr>
  </table>

  <!-- INPUTS DE ORIGEN (LOS 5 CARDS) -->
  <pre>📋 INPUTS Y VARIABLES DE ORIGEN — PARÁMETROS GRABADOS EN LA FOTO DE COTIZACIÓN:
  • CARD 1 (RUTAS):       Itinerario: ${trayecto} | Dist. Total: ${fmt1(totDistNm)} NM | WF: 3.0% (0.03)
  • CARD 2 (BUQUE):       ${vesselName} | Speed: ${speed.toFixed(1)} kts | Cons. Mar IFO: ${consSeaIfo.toFixed(1)} t/d | Cons. Puerto IFO: ${consPortIfo.toFixed(1)} t/d | LOA: ${loa}m | GRT: ${grt.toLocaleString()} TRB
  • CARD 3 (BUNKER):      IFO 380: $${pIfo.toFixed(2)}/t | MDO/LSMGO: $${pMdo.toFixed(2)}/t | IFO Total Estimado: ${totIfoMt.toFixed(2)} t
  • CARD 4 (COMERCIAL):   Cliente: ${clientName} | Carga: ${Q.toLocaleString()} MT | Flete: $${F.toFixed(2)}/MT | rCarga: ${ladenLeg?.rL||500} T/h | rDescarga: ${ladenLeg?.rD||350} T/h | Comis: Addr ${addrComm.toFixed(1)}% / Broker ${brkComm.toFixed(1)}%
  • CARD 5 (PUERTOS):     Agencia Puerto Carga: $${fmt2(portCostLoad)} USD | Agencia Puerto Descarga: $${fmt2(portCostDisch)} USD | Total Costos Portuarios: $${fmt2(totalPortCosts)} USD
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  │ 📍 RESUMEN CONSOLIDADO: Dist. ${fmt1(totDistNm)} NM | Total: ${fmt2(totDays)}d (${fmt2(totSeaDays)}d Mar + ${fmt2(totPortDays)}d Puerto)
  │ ⛽  Bunker IFO:  ${totIfoMt.toFixed(2)} t × $${pIfo.toFixed(2)}/t = $${fmt2(totBunkerUsd)} USD
  │ ⚓  Costos Portuarios: $${fmt2(totalPortCosts)} USD  (Carga $${fmt2(portCostLoad)} + Descarga $${fmt2(portCostDisch)})
  │ 💰  Flete Bruto:  ${Q.toLocaleString()} MT × $${F.toFixed(2)}/MT = $${fmt2(grossIncome)} USD  |  Voyage Result: $${fmt2(voyageResult)} USD  |  TCE: $${fmt2(tceReal)}/día
  ├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  │ 🔍 ARITMÉTICA EXPLICATIVA POR PIERNA:${piernasHtml}
  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────</pre>

  <!-- TABLA 12 MÉTRICAS -->
  <div style="font-weight:bold;font-size:7.5pt;margin-bottom:2px;">📊 TABLA OFICIAL DE AUDITORÍA LEDGER — 12 MÉTRICAS CON FÓRMULA, SUSTITUCIÓN NUMÉRICA Y RESULTADO GEEKSOFT ENGINE:</div>
  <table class="metrics">
    <thead>
      <tr>
        <th style="width:22%;">ÍTEM / MÉTRICA OFICIAL</th>
        <th style="width:30%;">FÓRMULA APLICADA</th>
        <th style="width:30%;">CÁLCULO SUSTITUIDO NUMÉRICO</th>
        <th style="width:18%;text-align:right;">GEEKSOFT ENGINE</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <!-- PIE DE FIRMA -->
  <table class="firma-table">
    <tr>
      <td style="width:50%;vertical-align:top;padding-right:12px;">
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div><strong>Responsable Auditor:</strong> <span style="border-bottom:1px dashed #000;display:inline-block;width:200px;">&nbsp;</span></div>
          <div><strong>Estado:</strong>
            <span class="check"></span>Aprobado &nbsp;
            <span class="check"></span>Con Observaciones &nbsp;
            <span class="check"></span>Rechazado
          </div>
          <div><strong>Firma Auditor:</strong> <span style="border-bottom:1px dashed #000;display:inline-block;width:200px;">&nbsp;</span></div>
          <div><strong>Fecha de Validación:</strong> <span style="border-bottom:1px dashed #000;display:inline-block;width:160px;">&nbsp;</span></div>
        </div>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:12px;">
        <strong>Comentarios / Justificación de Auditoría Ledger:</strong>
        <div class="box-firma"></div>
      </td>
    </tr>
  </table>

</body>
</html>`;
    };

    // handleShowPdfViewer: usa buildAuditaHtml(routeObj) — sin metrics arg, todo sale de legs_data
    const handleShowPdfViewer = (routeId: string, routeObj: any) => {
        if (pdfActiveId === routeId) {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
            setPdfBlobUrl(null);
            setPdfActiveId(null);
            return;
        }
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);

        const html = buildAuditaHtml(routeObj);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        setPdfActiveId(routeId);
    };

    const handlePrintFromViewer = () => {
        const iframe = document.getElementById('quote-pdf-viewer') as HTMLIFrameElement | null;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }
    };






    return (
        <MasterTemplate 
            title={isQuotesMode ? "Maestro de Cotizaciones" : "Maestro de Rutas"} 
            subtitle={isQuotesMode ? "Cotizaciones Spot de Prospectos Comercial y Costos (routes_quotes)" : "Rutas Físicas de Recorridos Reales para Contratos Activos (routes_clients)"}
            activeTab={isQuotesMode ? "quotes" : "spot-routes"}
            onBackToDashboard={() => window.history.back()}
        >
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                            <Map size={18} className={isQuotesMode ? "text-amber-600" : "text-teal-600"} />
                            <span>{isQuotesMode ? "Cotizaciones Spot de Prospectos Registradas" : "Rutas Físicas de Contratos Activos"}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                            {filteredRoutes.length} {isQuotesMode ? "cotización(es)" : "ruta(s)"} encontrada(s)
                        </div>
                    </div>


                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3">Nombre de Ruta</th>
                                    <th className="px-4 py-3">Creado Por</th>
                                    <th className="px-4 py-3">País</th>
                                    <th className="px-4 py-3">Descripción</th>
                                    <th className="px-4 py-3 text-center">Fecha Creación</th>
                                    <th className="px-4 py-3 text-center w-24">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                            Cargando rutas...
                                        </td>
                                    </tr>
                                ) : filteredRoutes.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                            {isQuotesMode ? "No hay cotizaciones de prospectos grabadas." : "No hay rutas de contratos activos grabadas."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRoutes.map((route, idx) => {

                                        const routeId = route.route_id || route.spot_id;
                                        const isExpanded = expandedRow === routeId;
                                        // Extraemos los tramos (piernas) del JSON
                                        const tramos = route.legs_data?.tramos || [];
                                        const createdBy = route.created_by || route.legs_data?.created_by || 'izavala@petral.com.pe';

                                        return (
                                            <React.Fragment key={routeId || idx}>
                                                <tr 
                                                    className={`hover:bg-slate-50 transition-colors border-b border-slate-100 ${isExpanded ? 'bg-slate-50' : ''}`}
                                                >
                                                    <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleRow(routeId)}>
                                                        {isExpanded ? (
                                                            <ChevronDown size={16} className="text-teal-600 mx-auto" />
                                                        ) : (
                                                            <ChevronRight size={16} className="text-slate-400 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-teal-700">
                                                        {route.name ? route.name.split('.')[0] : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">
                                                        {route.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono font-medium text-slate-600">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700 font-semibold border border-slate-200">
                                                            {createdBy}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                                                            {route.pais || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs">
                                                        {route.description || 'Sin descripción'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-[11px] text-slate-500 font-medium">
                                                        {route.created_at ? new Date(route.created_at).toLocaleString() : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleDeleteRoute(routeId, route.name)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors cursor-pointer"
                                                            title="Eliminar ruta"
                                                        >
                                                            <Trash2 size={13} />
                                                            <span>Borrar</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                                
                                                {/* Fila Expandida: Detalle de Cotización / Ruta */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                                        <td colSpan={8} className="p-0">
                                                            <div className="p-4 pl-14 pr-6 space-y-3">
                                                                
                                                                {/* SNAPSHOT ENRIQUECIDO FÍSICO-COMERCIAL & MATRIZ ESTÁTICA/DINÁMICA DE INSUMOS */}
                                                                {(() => {
                                                                    const metrics = (() => {
                                                                        const legs = route.legs_data?.tramos || [];
                                                                        const grt = Number(route.legs_data?.grt) || (route.grt ? Number(route.grt) : 0);
                                                                        const cargoTons = Number(route.legs_data?.cargo_tons) || legs.reduce((acc: number, tr: any) => acc + (Number(tr.quantity) || 0), 0) || 13500;
                                                                        
                                                                        let portCostLoad = Number(route.legs_data?.port_cost_load) || 0;
                                                                        let portCostDisch = Number(route.legs_data?.port_cost_disch) || 0;

                                                                        if (!portCostLoad) {
                                                                            legs.forEach((tr: any) => {
                                                                                if (tr.origin_action === 'CARGAR' || tr.type === 'LADEN') {
                                                                                    const qty = Number(tr.quantity) || cargoTons || 13500;
                                                                                    const rate = Number(tr.op_rate) || 500;
                                                                                    const hrs = (qty / rate) + 4.0;
                                                                                    portCostLoad += (grt > 0 ? grt * 0.35 : 9800) + (hrs * 120.0) + (2 * 2450.0);
                                                                                }
                                                                            });
                                                                        }

                                                                        if (!portCostDisch) {
                                                                            legs.forEach((tr: any) => {
                                                                                if (tr.destination_action === 'DESCARGAR' || tr.type === 'LADEN') {
                                                                                    const qty = Number(tr.quantity) || cargoTons || 13500;
                                                                                    const rate = Number(tr.op_rate) || 350;
                                                                                    const hrs = (qty / rate) + 4.0;
                                                                                    portCostDisch += (grt > 0 ? grt * 0.40 : 11200) + (hrs * 140.0) + (2 * 2600.0);
                                                                                }
                                                                            });
                                                                        }

                                                                        const rawVessel = route.legs_data?.vessel_name || route.vessel_name || route.vessel_id;
                                                                        const vesselName = (rawVessel && rawVessel.toLowerCase() !== 'prospect' && !rawVessel.toLowerCase().startsWith('prospect'))
                                                                            ? rawVessel 
                                                                            : 'BT MOQUEGUA (Handysize)';

                                                                        const freightRate = Number(route.legs_data?.freight_rate) || 25.50;
                                                                        const grossRevenue = cargoTons * freightRate;

                                                                        const bunkerIfoPrice = Number(route.legs_data?.bunker_price_ifo) || 895.14;
                                                                        const bunkerMdoPrice = Number(route.legs_data?.bunker_price_mdo) || 1460.30;
                                                                        const totalIfoMt = Number(route.legs_data?.total_bunker_mt) || 62.4;
                                                                        const totalMdoMt = Number(route.legs_data?.total_mdo_mt) || 12.0;
                                                                        const totalBunkerCost = (totalIfoMt * bunkerIfoPrice) + (totalMdoMt * bunkerMdoPrice);

                                                                        const staticPortCostTotal = (portCostLoad || 15000) + (portCostDisch || 15000);
                                                                        const matrixMinCost = staticPortCostTotal * 0.85;
                                                                        const matrixMaxCost = staticPortCostTotal * 1.15;
                                                                        const matrixAvgCost = (matrixMinCost + matrixMaxCost) / 2;

                                                                        const voyageResult = Number(route.legs_data?.voyage_result) || (grossRevenue - totalBunkerCost - staticPortCostTotal);
                                                                        const tceNet = Number(route.legs_data?.tce_net) || (voyageResult / 6.5);

                                                                        return {
                                                                            vesselName,
                                                                            speed: Number(route.legs_data?.vessel_speed) || Number(route.vessel_speed) || 11.0,
                                                                            cargoTons,
                                                                            freightRate,
                                                                            grossRevenue,
                                                                            bunkerIfoPrice,
                                                                            bunkerMdoPrice,
                                                                            totalIfoMt,
                                                                            totalMdoMt,
                                                                            totalBunkerCost,
                                                                            portCostLoad: portCostLoad || 15000,
                                                                            portCostDisch: portCostDisch || 15000,
                                                                            staticPortCostTotal,
                                                                            matrixMinCost,
                                                                            matrixMaxCost,
                                                                            matrixAvgCost,
                                                                            voyageResult,
                                                                            tceNet
                                                                        };
                                                                    })();

                                                                    return (
                                                                        <div className="bg-slate-100/90 border border-slate-300 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs shadow-inner">
                                                                            
                                                                            {/* CARD 1: INSUMO DE FLETE & GROSS REVENUE */}
                                                                            <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-blue-200 shadow-2xs">
                                                                                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider flex items-center justify-between">
                                                                                    <span>💰 1. Flete & Gross Rev</span>
                                                                                    <span className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-[8.5px]">MT × Rate</span>
                                                                                </span>
                                                                                <div className="text-[10.5px] text-slate-700 font-mono flex flex-col gap-0.5 pt-1">
                                                                                    <span>Carga: <strong>{metrics.cargoTons.toLocaleString()} MT</strong></span>
                                                                                    <span>Tarifa: <strong>${metrics.freightRate.toFixed(2)} USD/MT</strong></span>
                                                                                    <div className="text-[10px] font-bold text-blue-900 pt-1 border-t border-slate-100 flex items-center justify-between">
                                                                                        <span>Gross Rev:</span>
                                                                                        <span className="font-black text-[11px] text-blue-700">${metrics.grossRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* CARD 2: CONSUMO DE BÚNKER & COSTO UNITARIO */}
                                                                            <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-amber-200 shadow-2xs">
                                                                                <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center justify-between">
                                                                                    <span>⛽ 2. Búnkeres (Consumo)</span>
                                                                                    <span className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded text-[8.5px]">IFO / MDO</span>
                                                                                </span>
                                                                                <div className="text-[10.5px] text-slate-700 font-mono flex flex-col gap-0.5 pt-1">
                                                                                    <span>IFO 380: <strong>{metrics.totalIfoMt.toFixed(1)} MT</strong> × <strong>${metrics.bunkerIfoPrice.toFixed(0)}</strong></span>
                                                                                    <span>MDO: <strong>{metrics.totalMdoMt.toFixed(1)} MT</strong> × <strong>${metrics.bunkerMdoPrice.toFixed(0)}</strong></span>
                                                                                    <div className="text-[10px] font-bold text-amber-900 pt-1 border-t border-slate-100 flex items-center justify-between">
                                                                                        <span>Costo Búnker:</span>
                                                                                        <span className="font-black text-[11px] text-amber-700">${metrics.totalBunkerCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* CARD 3: COSTOS PORTUARIOS ESTÁTICOS (TABLA port_cost_static) */}
                                                                            <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-teal-200 shadow-2xs">
                                                                                <span className="text-[10px] font-black text-teal-900 uppercase tracking-wider flex items-center justify-between">
                                                                                    <span>⚓ 3. Puertos Estáticos</span>
                                                                                    <span className="bg-teal-100 text-teal-800 px-1 py-0.5 rounded text-[8.5px]">Fijo DB</span>
                                                                                </span>
                                                                                <div className="text-[10.5px] text-slate-700 font-mono flex flex-col gap-0.5 pt-1">
                                                                                    <span>Carga Estática: <strong className="text-teal-700">${metrics.portCostLoad.toLocaleString()}</strong></span>
                                                                                    <span>Descarga Estática: <strong className="text-teal-700">${metrics.portCostDisch.toLocaleString()}</strong></span>
                                                                                    <div className="text-[10px] font-bold text-teal-900 pt-1 border-t border-slate-100 flex items-center justify-between">
                                                                                        <span>Total Estático:</span>
                                                                                        <span className="font-black text-[11px] text-teal-700">${metrics.staticPortCostTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* CARD 4: COSTOS PORTUARIOS DINÁMICOS (MATRIZ PxQ) */}
                                                                            <div className="flex flex-col gap-1 bg-white p-2.5 rounded border border-indigo-200 shadow-2xs">
                                                                                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                                                                                    <span>📊 4. Puertos Dinámicos</span>
                                                                                    <span className="bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded text-[8.5px]">(Mín+Máx)/2</span>
                                                                                </span>
                                                                                <div className="text-[10.5px] text-slate-700 font-mono flex flex-col gap-0.5 pt-1">
                                                                                    <span>Mínimo P×Q: <strong>${metrics.matrixMinCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></span>
                                                                                    <span>Máximo P×Q: <strong>${metrics.matrixMaxCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></span>
                                                                                    <div className="text-[9.5px] text-slate-500 italic">Fórmula: (Mín + Máx) / 2</div>
                                                                                    <div className="text-[10px] font-bold text-indigo-900 pt-0.5 border-t border-slate-100 flex items-center justify-between">
                                                                                        <span>Promedio P×Q:</span>
                                                                                        <span className="font-black text-[11px] text-indigo-700">${metrics.matrixAvgCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* CARD 5: P&L NETO & TCE RESULTANTE */}
                                                                            <div className="flex flex-col gap-1 bg-emerald-50/90 p-2.5 rounded border border-emerald-300 shadow-2xs">
                                                                                <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider flex items-center justify-between">
                                                                                    <span>📈 5. P&L & TCE Neto</span>
                                                                                    <span className="bg-emerald-200 text-emerald-900 px-1 py-0.5 rounded text-[8.5px]">Voyage PnL</span>
                                                                                </span>
                                                                                <div className="text-[10.5px] text-emerald-950 font-mono flex flex-col gap-0.5 pt-1">
                                                                                    <span>Voyage PnL: <strong className="text-emerald-800">${metrics.voyageResult.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></span>
                                                                                    <span>Nave: <strong>{metrics.vesselName}</strong></span>
                                                                                    <div className="text-[10px] font-black text-emerald-950 pt-1 border-t border-emerald-200 flex items-center justify-between">
                                                                                        <span>TCE Neto:</span>
                                                                                        <span className="text-[11px] text-emerald-700 font-extrabold">${metrics.tceNet.toLocaleString('en-US', { maximumFractionDigits: 0 })}/d</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                        </div>
                                                                    );
                                                                })()}


                                                                <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                                                                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
                                                                        <MapPin size={14} className={isQuotesMode ? "text-amber-600" : "text-teal-600"}/>
                                                                        Itinerario Físico de la {isQuotesMode ? "Cotización" : "Ruta"} ({tramos.length} tramos)
                                                                    </div>
                                                                    <table className="w-full text-left text-xs">

                                                                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                                                                            <tr>
                                                                                <th className="px-3 py-2">Puerto Origen</th>
                                                                                <th className="px-3 py-2">Acción</th>
                                                                                <th className="px-3 py-2 border-l border-slate-200">Puerto Destino</th>
                                                                                <th className="px-3 py-2">Acción</th>
                                                                                <th className="px-3 py-2 border-l border-slate-200 text-right">Dist. (NM)</th>
                                                                                <th className="px-3 py-2 text-center">Clima</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {tramos.length === 0 ? (
                                                                                <tr>
                                                                                    <td colSpan={6} className="px-3 py-4 text-center text-slate-500 italic">No hay detalles de tramos en esta ruta.</td>
                                                                                </tr>
                                                                            ) : tramos.map((tr: any, tIdx: number) => {
                                                                                const wfVal = tr.weather_factor ? (tr.weather_factor > 1 ? tr.weather_factor : tr.weather_factor * 100) : 3;
                                                                                return (
                                                                                    <tr key={tIdx} className="hover:bg-slate-50 transition-colors">
                                                                                        <td className="px-3 py-2 font-medium text-slate-700">{tr.origin_port_id}</td>
                                                                                        <td className="px-3 py-2">
                                                                                            {tr.origin_action === 'CARGAR' && <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Cargar</span>}
                                                                                            {tr.origin_action === 'DESCARGAR' && <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Descargar</span>}
                                                                                            {tr.origin_action === 'NONE' && <span className="text-slate-400">-</span>}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 font-medium text-slate-700 border-l border-slate-100">{tr.destination_port_id}</td>
                                                                                        <td className="px-3 py-2">
                                                                                            {tr.destination_action === 'CARGAR' && <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Cargar</span>}
                                                                                            {tr.destination_action === 'DESCARGAR' && <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Descargar</span>}
                                                                                            {tr.destination_action === 'NONE' && <span className="text-slate-400">-</span>}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-right border-l border-slate-100 tabular-nums font-medium text-slate-600">
                                                                                            {Number(tr.route_distance).toFixed(1)}
                                                                                        </td>
                                                                                        <td className="px-3 py-2 text-center text-[10px] text-slate-500 tabular-nums font-semibold">
                                                                                            {wfVal.toFixed(1)}%
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                {/* VISOR PDF DE AUDITORÍA DE COTIZACIÓN */}
                                                                {isQuotesMode && (() => {
                                                                    // Todos los valores vienen de la foto guardada en legs_data
                                                                    const ld = route.legs_data || {};
                                                                    const cargoTons   = Number(ld.cargo_tons) || 13500;
                                                                    const freightRate = Number(ld.freight_rate) || 25.50;
                                                                    const pIfo        = Number(ld.bunker_price_ifo) || 895.14;
                                                                    const portCostLoad= Number(ld.port_cost_load) || 0;
                                                                    const portCostDisch= Number(ld.port_cost_disch) || 0;
                                                                    const tceNet      = Number(ld.tce_net) || 0;
                                                                    // Cálculo rápido para mostrar en la barra resumen
                                                                    const trms: any[] = ld.tramos || [];
                                                                    const totIfoMt = trms.reduce((s: number, tr: any) => {
                                                                        const dist = Number(tr.route_distance || tr.distance) || 0;
                                                                        const wf   = Number(tr.weather_factor) || 0.03;
                                                                        const spd  = Number(ld.vessel_speed) || 11.0;
                                                                        const Q    = Number(ld.cargo_tons) || 13500;
                                                                        const rL   = Number(tr.contract_agreed_load_rate || tr.custom_load_rate) || 500;
                                                                        const rD   = Number(tr.contract_agreed_discharge_rate || tr.custom_discharge_rate) || 350;
                                                                        const oh   = (Number(tr.port_overhead_hours_origin)||6) + (Number(tr.port_overhead_hours_dest)||6);
                                                                        const seaD = (dist * (1 + wf)) / (spd * 24);
                                                                        const portD = (tr.type||'').toUpperCase() === 'LADEN'
                                                                            ? Q/(rL*24) + Q/(rD*24) + oh/24
                                                                            : oh/24;
                                                                        return s + seaD * 14.0 + portD * 2.4;
                                                                    }, 0);
                                                                    const grossIncome  = cargoTons * freightRate;
                                                                    const bunkerUsd    = totIfoMt * pIfo;
                                                                    const totalPorts   = portCostLoad + portCostDisch;
                                                                    const voyageResult = grossIncome - bunkerUsd - totalPorts;
                                                                    const tceCalc      = tceNet || voyageResult;

                                                                    const thisRouteId  = route.route_id || route.spot_id;
                                                                    const isViewerOpen = pdfActiveId === thisRouteId;

                                                                    return (
                                                                        <div className="mt-4 pt-3 border-t border-slate-200">
                                                                            {/* Barra resumen — fondo verde claro, sin ribbon negro */}
                                                                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 mb-3">
                                                                                <div className="flex items-center gap-2 text-emerald-800">
                                                                                    <Printer size={16} className="text-emerald-600" />
                                                                                    <div>
                                                                                        <div className="font-bold text-[12px] text-emerald-900">Acta de Auditoría Comercial — Foto de Cotización</div>
                                                                                        <div className="text-[10.5px] text-emerald-700">
                                                                                            Voyage Result: <strong>+${voyageResult.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong>
                                                                                            {' '} · TCE Ref: <strong>${tceCalc.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD/Día</strong>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <button
                                                                                        onClick={() => handleShowPdfViewer(thisRouteId, route)}
                                                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-all cursor-pointer"
                                                                                    >
                                                                                        {isViewerOpen ? '▲ Cerrar Acta' : '📋 Ver Acta Completa'}
                                                                                    </button>
                                                                                    {isViewerOpen && (
                                                                                        <button
                                                                                            onClick={handlePrintFromViewer}
                                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md shadow-sm transition-all cursor-pointer"
                                                                                        >
                                                                                            <Printer size={13} />
                                                                                            <span>🖨️ Imprimir PDF Landscape</span>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* VISOR IFRAME — el Acta completa con aritmética explicativa */}
                                                                            {isViewerOpen && pdfBlobUrl && (
                                                                                <iframe
                                                                                    id="quote-pdf-viewer"
                                                                                    src={pdfBlobUrl}
                                                                                    title="Acta Auditoría PDF Completa"
                                                                                    className="w-full rounded-lg border border-slate-200 shadow-md"
                                                                                    style={{ height: '820px', background: '#fff' }}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}


                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MasterTemplate>
    );
};
