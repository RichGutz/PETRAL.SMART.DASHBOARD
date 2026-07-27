import React, { useEffect, useState, useMemo } from 'react';
import { Label } from "../ui/label";
import { Printer, RefreshCw } from "lucide-react";
import { ForecastService } from '../../services/api';

export const VoyageLedgerFinal: React.FC<{ portCostMode?: 'static' | 'matrix' }> = ({ portCostMode = 'static' }) => {
    const [localPortCostMode, setLocalPortCostMode] = useState<'static' | 'matrix'>(portCostMode);
    useEffect(() => { setLocalPortCostMode(portCostMode); }, [portCostMode]);

    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);
    
    // Data masters
    const [routes, setRoutes] = useState<any[]>([]);
    const [vessels, setVessels] = useState<any[]>([]);
    
    // Selections
    const [selectedClientId, setSelectedClientId] = useState<string>("SPCC");
    const [selectedVesselId, setSelectedVesselId] = useState<string>("MOQUEGUA");

    const [consolidatedResults, setConsolidatedResults] = useState<any[]>([]);

    const defaultVessels = [
        { vessel_id: 'MOQUEGUA', vessel_name: 'MOQUEGUA', vessel_speed: 11, consumption_sea_ifo: 14, dwt: 13500, tce_required: 13000 },
        { vessel_id: 'TABLONES', vessel_name: 'TABLONES', vessel_speed: 11, consumption_sea_ifo: 14, dwt: 13500, tce_required: 13000 },
        { vessel_id: 'CONCON_TRADER', vessel_name: 'CONCON TRADER', vessel_speed: 11, consumption_sea_ifo: 14, dwt: 13500, tce_required: 13000 },
        { vessel_id: 'HUEMUL', vessel_name: 'HUEMUL', vessel_speed: 11, consumption_sea_ifo: 14, dwt: 13500, tce_required: 13000 }
    ];

    useEffect(() => {
        Promise.all([
            ForecastService.getRoutesMaster().catch(() => []),
            ForecastService.getSpotVoyages().catch(() => []),
            ForecastService.getVessels().catch(() => []),
        ]).then(([masterRoutes, spotVoyages, v]) => {
            const allRoutes = [...(masterRoutes || []), ...(spotVoyages || [])];
            const routeMap = new Map();
            allRoutes.forEach((r: any, i: number) => {
                const id = r._id || r.client_route_id || r.prospect_route_id || r.route_id || r.spot_id || r.name || `route-${i}`;
                if (id && !routeMap.has(id)) {
                    routeMap.set(id, { ...r, _id: id });
                }
            });
            const mergedRoutes = Array.from(routeMap.values());
            setRoutes(mergedRoutes);

            const mergedVessels = (v && v.length > 0) ? v : defaultVessels;
            setVessels(mergedVessels);

            if (mergedVessels.length > 0 && !selectedVesselId) {
                setSelectedVesselId(mergedVessels[0].vessel_id);
            }

            setLoading(false);
        }).catch(err => {
            console.error(err);
            setVessels(defaultVessels);
            setLoading(false);
        });
    }, []);

    // Clientes fijos según regla de negocio
    const availableClients = ["SPCC", "NEXA", "PROSPECTOS"];

    // Rutas filtradas y ordenadas (SPCC primero)
    const filteredRoutes = useMemo(() => {
        if (!selectedClientId) return routes;
        const cleanClient = selectedClientId.trim().toUpperCase();
        const res = routes.filter((r: any) => {
            const name = (r.name || "").trim().toUpperCase();
            if (cleanClient === "SPCC") {
                return r.client_group === "SPCC" || name.startsWith("SPCC");
            }
            if (cleanClient === "NEXA") {
                return (r.client_group === "NEXA" || name.startsWith("NEXA")) && !r.is_prospect;
            }
            if (cleanClient === "PROSPECTOS") {
                return r.is_prospect || (!name.startsWith("SPCC") && !name.startsWith("NEXA"));
            }
            return true;
        });

        return res.sort((a: any, b: any) => {
            const nameA = (a.name || "").toUpperCase();
            const nameB = (b.name || "").toUpperCase();
            const scoreA = nameA.includes("SPCC") ? 0 : (nameA.includes("NEXA") ? 1 : 2);
            const scoreB = nameB.includes("SPCC") ? 0 : (nameB.includes("NEXA") ? 1 : 2);
            if (scoreA !== scoreB) return scoreA - scoreB;
            return nameA.localeCompare(nameB);
        });
    }, [selectedClientId, routes]);

    const handleCalculateConsolidated = async () => {
        if (!selectedClientId || !selectedVesselId) return;
        setSimulating(true);

        try {
            const selectedVessel = vessels.find(v => (v.vessel_id || v.id) === selectedVesselId) || {};
            const PORT_COSTS_MASTER: Record<string, number> = {
                "CALLAO": 31327.99,
                "MARCONA": 40000.00,
                "MATARANI": 17000.00,
                "MEJILLONES": 50000.00,
                "ILO": 15000.00
            };

            const resultsList: any[] = [];
            for (const route of filteredRoutes) {
                if (!route.legs_data || !route.legs_data.tramos) continue;
                const tramos = JSON.parse(JSON.stringify(route.legs_data.tramos));
                
                for (let i = 0; i < tramos.length; i++) {
                    tramos[i].bunker_price_ifo = 895.14;
                    tramos[i].bunker_price_mdo = 1460.30;
                    tramos[i].vessel_speed = 11.0;
                    const origP = tramos[i].origin_port_id || "ILO";
                    const destP = tramos[i].destination_port_id || "ILO";

                    if (tramos[i].type === 'LADEN' || tramos[i].origin_action === 'CARGAR') {
                        tramos[i].type = 'LADEN';
                        tramos[i].quantity = 13500.0; // Tonelaje fijo en 13,500 MT
                        if (!tramos[i].freight_rate || tramos[i].freight_rate <= 0) {
                            const nameUpper = (route.name || "").toUpperCase();
                            tramos[i].freight_rate = nameUpper.includes("MEJILLONES") && nameUpper.includes("NEXA") ? 25.0 : (nameUpper.includes("MATARANI") && nameUpper.includes("NEXA") ? 30.0 : 25.50);
                        }
                        tramos[i].agency_costs_origin = PORT_COSTS_MASTER[origP] || 31327.99;
                        tramos[i].agency_costs_destination = PORT_COSTS_MASTER[destP] || 40000.00;
                    } else {
                        tramos[i].type = 'BALLAST';
                        tramos[i].agency_costs_origin = 0.0;
                        tramos[i].agency_costs_destination = 0.0;
                    }
                }

                const payload = {
                    vessel_id: selectedVesselId,
                    vessel_params: selectedVessel,
                    tramos: tramos,
                    port_cost_mode: localPortCostMode
                };

                // Timeout 300ms — fallback client-side si backend no disponible
                let res: any = null;
                try {
                    const apiCall = ForecastService.calculateMultiCotizador(payload);
                    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 300));
                    res = await Promise.race([apiCall, timeout]);
                } catch {
                    const ladenT = tramos.find((t: any) => t.type === 'LADEN') || tramos[0];
                    const Q = ladenT?.quantity || 13500;
                    const F = ladenT?.freight_rate || 25.50;
                    const rL = 500, rD = 345, wf = 0.03, spd = 11.0;
                    const pIfo = 895.14, pMdo = 1460.30;
                    let seaDaysTot = 0, portDaysTot = 0, bunkerTot = 0, portCostsTot = 0;
                    let incomeTot = 0, distTot = 0, ifoTonTot = 0, mdoTonTot = 0;
                    const builtTramos = tramos.map((t: any) => {
                        const dist = t.distance || t.route_distance || 300;
                        const sd = (dist * (1 + wf)) / (spd * 24);
                        const pd = t.type === 'LADEN' ? (Q / rL / 24) + (Q / rD / 24) + 1.24 : 0;
                        const ifoSea = sd * 14.0;
                        const mdoPort = t.type === 'LADEN' ? 0.77 : 0;
                        const bunkCost = ifoSea * pIfo + mdoPort * pMdo;
                        const inc = t.type === 'LADEN' ? Q * F : 0;
                        seaDaysTot += sd; portDaysTot += pd; bunkerTot += bunkCost;
                        portCostsTot += (t.agency_costs_origin || 0) + (t.agency_costs_destination || 0);
                        incomeTot += inc; distTot += dist;
                        ifoTonTot += ifoSea; mdoTonTot += mdoPort;
                        return { ...t, distance: dist, sea_days: sd, port_days: pd, bunker_costs: bunkCost, net_income: inc, weather_factor: wf, actual_load_rate: rL, actual_discharge_rate: rD };
                    });
                    const totDays = seaDaysTot + portDaysTot;
                    const tceReq = (selectedVessel as any)?.tce_required || 13000;
                    const voyRes = incomeTot - bunkerTot - portCostsTot;
                    res = {
                        consolidated: {
                            total_distance: distTot, total_days: totDays,
                            total_sea_days: seaDaysTot, total_port_days: portDaysTot,
                            total_bunker_costs: bunkerTot, bunker_ifo_tonnage: ifoTonTot,
                            bunker_mdo_tonnage: mdoTonTot, total_port_costs: portCostsTot,
                            total_freight_revenue: incomeTot, pnl_net_utility: voyRes,
                            tce_real: totDays > 0 ? voyRes / totDays : 0,
                            tce_required: tceReq, total_commissions: 0
                        },
                        tramos: builtTramos,
                        actual_load_rate: rL, actual_discharge_rate: rD
                    };
                }

                resultsList.push({
                    routeName: route.name || route._id,
                    routeObj: route,
                    simResult: res,
                    tramos: res.tramos || tramos
                });
            }

            setConsolidatedResults(resultsList);
        } catch (err: any) {
            console.error(err);
        } finally {
            setSimulating(false);
        }
    };

    // Ejecutar la simulación automáticamente cuando cambia el cliente, buque o matriz
    useEffect(() => {
        if (selectedClientId && selectedVesselId && filteredRoutes.length > 0) {
            handleCalculateConsolidated();
        }
    }, [selectedClientId, selectedVesselId, localPortCostMode, filteredRoutes.length]);

    const handlePrintPdf = (htmlContent: string) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    const generateConsolidatedHtml = () => {
        if (!consolidatedResults || consolidatedResults.length === 0) return '';

        let routeBlocksHtml = '';

        consolidatedResults.forEach((item, idx) => {
            const { routeName, simResult, tramos } = item;
            const c = simResult.consolidated || {};
            const totDist = c.total_distance || 0;
            const totDays = c.total_days || 0;
            const seaDays = c.total_sea_days || 0;
            const portDays = c.total_port_days || 0;
            const bunkerCost = c.total_bunker_costs || 0;
            const ifoTon = c.bunker_ifo_tonnage || 0;
            const mdoTon = c.bunker_mdo_tonnage || 0;
            const portCosts = c.total_port_costs || 0;
            const netIncome = c.total_freight_revenue || 0;
            const pnlNet = c.pnl_net_utility || 0;
            const tceReal = c.tce_real || 0;
            const tceRequired = c.tce_required || 0;
            // P/L correcto: voyage_result - (tot_days * tce_required)
            const plVsReq = pnlNet - (totDays * tceRequired);

            const pIfo = 895.14;

            const ladenLeg = tramos.find((t: any) => t.type === 'LADEN') || tramos[0] || {};
            const Q = 13500;
            const F = ladenLeg.freight_rate || 25.50;
            const rL = simResult.actual_load_rate || 500;
            const rD = simResult.actual_discharge_rate || 345;
            const origP = ladenLeg.origin_port_id || "ILO";
            const destP = ladenLeg.destination_port_id || "ILO";
            const cOrig = ladenLeg.agency_costs_origin || 31327.99;
            const cDest = ladenLeg.agency_costs_destination || 40000.00;

            const trayectoStr = tramos.map((t: any) => t.origin_port_id).join(" ➔ ") + " ➔ " + (tramos[tramos.length - 1]?.destination_port_id || "");

            let piernasStr = '';
            tramos.forEach((tr: any, legIdx: number) => {
                const isLaden = tr.type === 'LADEN';
                const distP = tr.distance || tr.route_distance || 0;
                const wf = tr.weather_factor || 0.03;
                const seaD = tr.sea_days || 0;
                const portD = tr.port_days || 0;
                const bunkSeaIfo = seaD * 14.0;
                const bunkSeaCost = bunkSeaIfo * pIfo;

                piernasStr += `  │   • PIERNA #${legIdx + 1} [${tr.type}]: ${tr.origin_port_id} ➔ ${tr.destination_port_id} | Distancia: ${distP.toFixed(1)} NM\n`;
                piernasStr += `  │       🌊 Días de Mar (${seaD.toFixed(2)}d): [${distP.toFixed(1)} NM × (1 + ${(wf * 100).toFixed(1)}% WF)] / [11.0 kts × 24h] = ${seaD.toFixed(2)} Días\n`;
                piernasStr += `  │          ↳ Búnker Mar: ${seaD.toFixed(2)}d × 14.0 t/d IFO × $${pIfo.toFixed(2)} = $${bunkSeaCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD\n`;

                if (isLaden) {
                    const legQ = 13500;
                    const loadD = (legQ / rL) / 24;
                    const dischD = (legQ / rD) / 24;
                    const idleD = Math.max(0, portD - loadD - dischD);
                    const bunkPortCost = (tr.bunker_costs || 0) - bunkSeaCost;
                    piernasStr += `  │       ⚓ Días de Puerto (${portD.toFixed(2)}d): Carga (${legQ}t/${rL}t/h = ${loadD.toFixed(2)}d) + Descarga (${legQ}t/${rD}t/h = ${dischD.toFixed(2)}d) + Overheads (${idleD.toFixed(2)}d) = ${portD.toFixed(2)} Días\n`;
                    piernasStr += `  │          ↳ Búnker Puerto: $${bunkPortCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD\n`;
                    piernasStr += `  │       🔥 Búnker Total Pierna:  $${(tr.bunker_costs || 0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD\n`;
                    piernasStr += `  │       🚢 Agencia Carga (${tr.origin_port_id}):    $${cOrig.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD\n`;
                    piernasStr += `  │       🚢 Agencia Descarga (${tr.destination_port_id}): $${cDest.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD\n`;
                    piernasStr += `  │       💵 Ingreso Flete Leg:     $${netIncome.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD\n`;
                } else {
                    piernasStr += `  │       ⚓ Días de Puerto: 0.00 Días (Pierna en Lastre)\n`;
                    piernasStr += `  │       🔥 Búnker Total Pierna: $${(tr.bunker_costs || 0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD\n`;
                    piernasStr += `  │       🚢 Agencia Puerto:      $0.00 USD (Lastre)\n`;
                }
            });

            const seaDaysParts = tramos.map((tr: any, legIdx: number) => {
                const tType = tr.type || "BALLAST";
                const tDist = tr.distance || tr.route_distance || 0;
                const tSd = tr.sea_days || 0;
                return `P#${legIdx + 1} ${tType}(${tDist.toFixed(0)}NM: ${tSd.toFixed(2)}d)`;
            });
            const seaDaysCalcStr = seaDaysParts.join(" + ");

            routeBlocksHtml += `
            <div class="page-route" style="${idx < consolidatedResults.length - 1 ? 'page-break-after: always;' : ''}">
                <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #000000; margin-bottom: 8px;">
                    <tr>
                        <td style="width: 25%; text-align: left; vertical-align: middle; border: none; padding: 0;">
                            <img src="/Logo.Petral.png" style="height: 30px; width: auto;" alt="PETRAL LOGO" />
                        </td>
                        <td style="width: 50%; text-align: center; vertical-align: middle; border: none; padding: 0; font-family: 'Courier New', monospace; font-weight: bold; font-size: 9.5pt; color: #000000;">
                            PETRAL SMART DASHBOARD • MOTOR SPOT GEEKSOFT ENGINE<br/>
                            <span style="font-size: 7.5pt; font-weight: normal;">ACTA OFICIAL DE AUDITORÍA Y TRAZABILIDAD (${selectedClientId})</span>
                        </td>
                        <td style="width: 25%; text-align: right; vertical-align: middle; border: none; padding: 0;">
                            <img src="/Logo.Geeksoft.png" style="height: 49px; width: auto;" alt="GEEKSOFT LOGO" />
                        </td>
                    </tr>
                </table>
                <pre style="font-family: 'Courier New', Courier, monospace; font-size: 6.8pt; line-height: 1.2; color: #000000; margin: 0; white-space: pre;">
🚢 AUDITANDO RUTA: ${routeName} (${tramos.length} Piernas)
════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
📋 [INPUTS Y VARIABLES DE ORIGEN DE CÁLCULO - CARDS MAESTROS]:
  • CARD 1 (RUTAS):                 Itinerario: ${trayectoStr} | Dist. Total: ${totDist.toFixed(1)} NM | Weather Factor: 3.0% (0.03)
  • CARD 2 (BUQUES):                Vessel: ${selectedVesselId} | Speed: 11.0 kts | Cons. Sea IFO: 14.0 t/d | Cons. Idle IFO: 2.4 t/d | TCE Requerido: $${tceRequired.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}/d
  • CARD 3 (BÚNKER):                Precio IFO: $895.14/t | Precio MDO: $1,460.30/t | Consumo Est.: ${ifoTon.toFixed(2)} t IFO / ${mdoTon.toFixed(2)} t MDO | BAF Baseline: $430.00/t
  • CARD 4 (CONTRATOS & COMERCIAL): Cliente: ${selectedClientId} | Q: 13,500 MT | Freight Base: $${F.toFixed(2)}/MT | Ritmo Carga: ${rL} T/h | Ritmo Desc: ${rD} T/h | Comisiones: Address 0.0% / Broker 0.0%
  • CARD 5 (PUERTOS & AGENCIA):     Agencia Carga (${origP}): $${cOrig.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD | Agencia Descarga (${destP}): $${cDest.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD | Total Port Costs: $${portCosts.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  │ 📍 RESUMEN CONSOLIDADO: Distancia ${totDist.toFixed(1)} NM | Días Totales ${totDays.toFixed(2)}d (${seaDays.toFixed(2)}d Mar + ${portDays.toFixed(2)}d Puerto)
  │ ⛽ Búnker Total:  $${bunkerCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD (${ifoTon.toFixed(2)} t IFO | ${mdoTon.toFixed(2)} t MDO)
  │ ⚓ Puerto Total:  $${portCosts.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD
  │ 💰 Ingreso Flete: $${netIncome.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD | PnL Neto: $${pnlNet.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD | TCE: $${tceReal.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} USD/Día
  ├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  │ 🔍 ARITMÉTICA EXPLICATIVA Y ORIGEN DE LOS DÍAS (MAR VS PUERTO):
${piernasStr}  └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
</pre>

                <div style="margin-top: 6px; font-family: 'Courier New', monospace;">
                    <div style="font-weight: bold; font-size: 7.5pt; margin-bottom: 3px; color: #000000;">
                        📊 [TABLA OFICIAL DE AUDITORÍA LEDGER — 12 MÉTRICAS REPLICADAS DE LA UI]:
                    </div>
                    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; table-layout: fixed; font-family: 'Courier New', monospace; font-size: 6.8pt; line-height: 1.25;">
                        <thead>
                            <tr style="background-color: #f2f2f2; border-bottom: 1.5px solid #000000;">
                                <th style="width: 25%; border: 1px solid #000000; padding: 3px 5px; text-align: left; font-weight: bold;">ÍTEM / MÉTRICA OFICIAL</th>
                                <th style="width: 32%; border: 1px solid #000000; padding: 3px 5px; text-align: left; font-weight: bold;">FÓRMULA APLICADA</th>
                                <th style="width: 28%; border: 1px solid #000000; padding: 3px 5px; text-align: left; font-weight: bold;">CÁLCULO SUSTITUIDO NUMÉRICO</th>
                                <th style="width: 15%; border: 1px solid #000000; padding: 3px 5px; text-align: right; font-weight: bold;">GEEKSOFT ENGINE</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">1. Ritmo Carga (act_load)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">contract_load_rate</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">${rL} T/h</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">${rL} T/h</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">2. Ritmo Descarga (act_disch)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">contract_discharge_rate</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">${rD} T/h</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">${rD} T/h</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">3. Días de Puerto (port_days)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">(Q/act_load)/24 + (Q/act_disch)/24 + idle</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">Load(${(Q/rL/24).toFixed(2)}d) + Disch(${(Q/rD/24).toFixed(2)}d) + Overheads</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">${portDays.toFixed(2)} Días</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">4. Días de Mar (sea_days)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">Sum((dist_leg * (1 + WF)) / (speed * 24))</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">${seaDaysCalcStr}</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">${seaDays.toFixed(2)} Días</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">5. Días de Viaje (tot_dur)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">sea_days + port_days</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">${seaDays.toFixed(2)}d Mar + ${portDays.toFixed(2)}d Puerto</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">${totDays.toFixed(2)} Días</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">6. Income (income)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">Sum(Q_leg * F_leg)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">13,500 MT × $${F.toFixed(2)} USD/MT</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">$${netIncome.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">7. Comisiones (commissions)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">income * (addr_comm + bkr_comm)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">$${netIncome.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} × 0.00%</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">$0.00</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">8. Costo Bunker (bunker)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">bunker_sea + bunker_port</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">${ifoTon.toFixed(2)}t IFO × $895.14 + ${mdoTon.toFixed(2)}t MDO × $1460.30</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">$${bunkerCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">9. Port Costs (port_costs)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">Sum(agency_origin + agency_dest)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">$${cOrig.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} (Carga) + $${cDest.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} (Descarga)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">$${portCosts.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">10. Voyage Result (voy_res)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">income - comm - bunker - port_costs</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">$${netIncome.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} - $${bunkerCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} - $${portCosts.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">$${pnlNet.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">11. TCE Diario (tce_real)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">voyage_result / tot_dur</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">$${pnlNet.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} / ${totDays.toFixed(2)} Días</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">$${tceReal.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}/día</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; font-weight: bold;">12. P/L (pl_vs_req)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">income - comm - bunker - port_costs - (tot_days * tce_req)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px;">$${pnlNet.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} - (${totDays.toFixed(2)}d x $${tceRequired.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}/d)</td>
                                <td style="border: 1px solid #000000; padding: 2.5px 5px; text-align: right; font-weight: bold;">$${plVsReq.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pie de Firma, Aprobación e Inputs de Auditoría Ledger -->
                <div style="margin-top: 10px; padding-top: 6px; border-top: 1.5px solid #000000; font-family: 'Courier New', monospace; font-size: 7.2pt; page-break-inside: avoid;">
                    <table style="width: 100%; border-collapse: collapse; border: none;">
                        <tr>
                            <!-- Panel Izquierdo: Responsable, Estado, Firma, Fecha -->
                            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                                <div style="display: flex; flex-direction: column; gap: 6px;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="font-weight: bold; white-space: nowrap; color: #000000;">Responsable Auditor:</span>
                                        <div style="border-bottom: 1px dashed #000000; flex: 1; height: 12px;"></div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 16px; margin-top: 2px;">
                                        <span style="font-weight: bold; color: #000000;">Estado:</span>
                                        <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000000;"></span> Aprobado</span>
                                        <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000000;"></span> Con Errores</span>
                                        <span style="display: inline-flex; align-items: center; gap: 4px;"><span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #000000;"></span> Observado</span>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                        <span style="font-weight: bold; white-space: nowrap; color: #000000;">Firma Auditor:</span>
                                        <div style="border-bottom: 1px dashed #000000; flex: 1; height: 14px;"></div>
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                                        <span style="font-weight: bold; white-space: nowrap; color: #000000;">Fecha Validación:</span>
                                        <div style="border-bottom: 1px dashed #000000; flex: 1; height: 12px;"></div>
                                    </div>
                                </div>
                            </td>

                            <!-- Panel Derecho: Comentarios y Justificación de Auditoría -->
                            <td style="width: 50%; vertical-align: top; padding-left: 15px;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-weight: bold; color: #000000; margin-bottom: 3px;">Comentarios / Justificación de Auditoría Ledger:</span>
                                    <div style="border: 1px solid #000000; height: 56px; background-color: #fafafa; padding: 4px; box-sizing: border-box;"></div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
            `;
        });

        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
        <meta charset="UTF-8">
        <title>Acta Oficial de Auditoría Consolidada - PETRAL</title>
        <style>
            @page { size: A4 landscape; margin: 0mm; }
            body { font-family: 'Courier New', Courier, monospace; background-color: #ffffff; color: #000000; font-size: 6.8pt; line-height: 1.2; margin: 0; padding: 5mm; }
            .page-route { page-break-after: always; break-after: page; box-sizing: border-box; }
            .page-route:last-child { page-break-after: avoid; break-after: avoid; }
        </style>
        </head>
        <body>
            ${routeBlocksHtml}
        </body>
        </html>
        `;
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Cargando Auditoría Final...</div>;

    const htmlDoc = generateConsolidatedHtml();

    return (
        <div className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-md h-[calc(100vh-100px)]">
            {/* Barra de Controles Superior Estilo Claro Limpio */}
            <div className="flex gap-4 items-center justify-between bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-md shadow-sm">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⚖️</span>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Acta de Auditoría Final</h2>
                    </div>

                    {/* 1. Cliente */}
                    <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold text-slate-600">Cliente:</Label>
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="h-8 px-3 bg-white border border-slate-300 rounded text-xs font-bold text-teal-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                        >
                            {availableClients.map((c: string) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* 2. Buque */}
                    <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold text-slate-600">Buque:</Label>
                        <select
                            value={selectedVesselId}
                            onChange={(e) => setSelectedVesselId(e.target.value)}
                            className="h-8 px-3 bg-white border border-slate-300 rounded text-xs font-bold text-purple-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
                        >
                            {vessels.map(v => (
                                <option key={v.vessel_id} value={v.vessel_id}>{v.vessel_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Matriz Portuaria */}
                    <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold text-slate-600">Matriz:</Label>
                        <select
                            value={localPortCostMode}
                            onChange={(e) => setLocalPortCostMode(e.target.value as "static" | "matrix")}
                            className="h-8 px-3 bg-white border border-slate-300 rounded text-xs font-bold text-amber-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600 cursor-pointer"
                        >
                            <option value="static">Estática (Master)</option>
                            <option value="matrix">Dinámica (JSONB)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {simulating && (
                        <span className="text-xs text-amber-400 font-mono animate-pulse flex items-center gap-1">
                            <RefreshCw className="animate-spin" size={12} /> Calculando rutas...
                        </span>
                    )}
                    <button
                        onClick={() => handlePrintPdf(htmlDoc)}
                        disabled={!htmlDoc || simulating}
                        className="h-8 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Printer size={14} /> Imprimir / Exportar PDF
                    </button>
                </div>
            </div>

            {/* Contenedor Principal con el Visor iframe del PDF */}
            <div className="flex-1 bg-slate-100 rounded border border-slate-300 overflow-hidden relative shadow-inner">
                {htmlDoc ? (
                    <iframe
                        title="Visor PDF Acta Auditoria"
                        srcDoc={htmlDoc}
                        className="w-full h-full border-none bg-white"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-semibold text-sm">
                        Procesando documento PDF de Auditoría Consolidada...
                    </div>
                )}
            </div>
        </div>
    );
};
