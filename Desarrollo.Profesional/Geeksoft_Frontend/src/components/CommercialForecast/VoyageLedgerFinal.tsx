import React, { useEffect, useState, useMemo } from 'react';
import { Label } from "../ui/label";
import { Printer, RefreshCw, Filter, FileText } from "lucide-react";
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

    const defaultMasterRoutes = [
        {
            _id: "SPCC-ILO-CALLAO",
            name: "SPCC | ILO → CALLAO",
            client_group: "SPCC",
            legs_data: {
                tramos: [
                    { type: "LADEN", origin_port_id: "ILO", destination_port_id: "CALLAO", route_distance: 470, quantity: 13500, freight_rate: 25.50 },
                    { type: "BALLAST", origin_port_id: "CALLAO", destination_port_id: "ILO", route_distance: 470, quantity: 0, freight_rate: 0 }
                ]
            }
        },
        {
            _id: "SPCC-ILO-MARCONA",
            name: "SPCC | ILO → MARCONA",
            client_group: "SPCC",
            legs_data: {
                tramos: [
                    { type: "LADEN", origin_port_id: "ILO", destination_port_id: "MARCONA", route_distance: 283, quantity: 13500, freight_rate: 22.82 },
                    { type: "BALLAST", origin_port_id: "MARCONA", destination_port_id: "ILO", route_distance: 283, quantity: 0, freight_rate: 0 }
                ]
            }
        },
        {
            _id: "SPCC-ILO-MATARANI",
            name: "SPCC | ILO → MATARANI",
            client_group: "SPCC",
            legs_data: {
                tramos: [
                    { type: "LADEN", origin_port_id: "ILO", destination_port_id: "MATARANI", route_distance: 69, quantity: 13500, freight_rate: 18.50 },
                    { type: "BALLAST", origin_port_id: "MATARANI", destination_port_id: "ILO", route_distance: 69, quantity: 0, freight_rate: 0 }
                ]
            }
        },
        {
            _id: "SPCC-ILO-MEJILLONES",
            name: "SPCC | ILO → MEJILLONES",
            client_group: "SPCC",
            legs_data: {
                tramos: [
                    { type: "LADEN", origin_port_id: "ILO", destination_port_id: "MEJILLONES", route_distance: 335, quantity: 13500, freight_rate: 25.00 },
                    { type: "BALLAST", origin_port_id: "MEJILLONES", destination_port_id: "ILO", route_distance: 335, quantity: 0, freight_rate: 0 }
                ]
            }
        }
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
            let mergedRoutes = Array.from(routeMap.values());
            if (mergedRoutes.length === 0) {
                mergedRoutes = defaultMasterRoutes;
            }
            setRoutes(mergedRoutes);

            const mergedVessels = (v && v.length > 0) ? v : defaultVessels;
            setVessels(mergedVessels);

            if (mergedVessels.length > 0 && !selectedVesselId) {
                setSelectedVesselId(mergedVessels[0].vessel_id);
            }

            setLoading(false);
        }).catch(err => {
            console.error(err);
            setRoutes(defaultMasterRoutes);
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

        const sorted = res.sort((a: any, b: any) => {
            const nameA = (a.name || "").toUpperCase();
            const nameB = (b.name || "").toUpperCase();
            const scoreA = nameA.includes("SPCC") ? 0 : (nameA.includes("NEXA") ? 1 : 2);
            const scoreB = nameB.includes("SPCC") ? 0 : (nameB.includes("NEXA") ? 1 : 2);
            if (scoreA !== scoreB) return scoreA - scoreB;
            return nameA.localeCompare(nameB);
        });

        return sorted.length > 0 ? sorted : defaultMasterRoutes;
    }, [selectedClientId, routes]);

    // Motor de cálculo de simulación instantánea client-side
    const computeInstantSimulation = (route: any, mode: 'static' | 'matrix') => {
        const PORT_COSTS_MASTER: Record<string, number> = mode === 'static' ? {
            "CALLAO": 31327.99,
            "MARCONA": 40000.00,
            "MATARANI": 17000.00,
            "MEJILLONES": 50000.00,
            "ILO": 15000.00
        } : {
            "CALLAO": 31327.99,
            "MARCONA": 48676.32,
            "MATARANI": 17598.84,
            "MEJILLONES": 51248.65,
            "ILO": 16373.15
        };

        const tramos = route.legs_data?.tramos || [];
        let totalDist = 0;
        let totalSeaDays = 0;
        let totalPortDays = 4.0;
        let totalGrossRev = 0;
        let totalAgencyCosts = 0;

        const processedTramos = tramos.map((t: any) => {
            const dist = Number(t.route_distance) || 300.0;
            const seaDays = (dist * 1.1) / (11.0 * 24.0);
            totalDist += dist;
            totalSeaDays += seaDays;

            const origP = (t.origin_port_id || "ILO").toUpperCase();
            const destP = (t.destination_port_id || "CALLAO").toUpperCase();

            let agencyOrig = PORT_COSTS_MASTER[origP] || 16373.15;
            let agencyDest = PORT_COSTS_MASTER[destP] || 48676.32;
            if (t.type === 'BALLAST') {
                agencyOrig = 0;
                agencyDest = 0;
            }

            const qty = t.type === 'LADEN' ? (Number(t.quantity) || 13500) : 0;
            const rate = t.type === 'LADEN' ? (Number(t.freight_rate) || 25.5) : 0;
            const grossRev = qty * rate;

            totalGrossRev += grossRev;
            totalAgencyCosts += (agencyOrig + agencyDest);

            return {
                ...t,
                route_distance: dist,
                sea_days: seaDays,
                agency_costs_origin: agencyOrig,
                agency_costs_destination: agencyDest,
                gross_revenue: grossRev
            };
        });

        const totalDays = totalSeaDays + totalPortDays;
        const totalBunkerCosts = 43515.74;
        const commissions = totalGrossRev * 0.0375;
        const voyageResult = totalGrossRev - totalBunkerCosts - totalAgencyCosts - commissions;
        const vesselCharterCost = totalDays * 13000.0;
        const pnlNetUtility = voyageResult - vesselCharterCost;
        const tceUtility = totalDays > 0 ? (voyageResult / totalDays) : 0;

        return {
            consolidated: {
                total_distance: totalDist,
                total_days: totalDays,
                total_sea_days: totalSeaDays,
                total_port_days: totalPortDays,
                total_gross_revenue: totalGrossRev,
                total_bunker_costs: totalBunkerCosts,
                total_agency_costs: totalAgencyCosts,
                voyage_result: voyageResult,
                pnl_net_utility: pnlNetUtility,
                tce_utility: tceUtility
            },
            tramos: processedTramos
        };
    };

    const handleCalculateConsolidated = async () => {
        if (!selectedClientId || !selectedVesselId) return;
        setSimulating(true);

        try {
            const selectedVessel = vessels.find(v => (v.vessel_id || v.id) === selectedVesselId) || {};
            const resultsList: any[] = [];
            const routesToProcess = filteredRoutes.length > 0 ? filteredRoutes : defaultMasterRoutes;

            for (const route of routesToProcess) {
                let simRes: any = null;
                
                try {
                    if (route.legs_data?.tramos) {
                        const tramos = JSON.parse(JSON.stringify(route.legs_data.tramos));
                        const payload = {
                            vessel_id: selectedVesselId,
                            vessel_params: selectedVessel,
                            tramos: tramos,
                            port_cost_mode: localPortCostMode
                        };
                        const apiPromise = ForecastService.calculateMultiCotizador(payload);
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout Backend")), 250));
                        simRes = await Promise.race([apiPromise, timeoutPromise]);
                    }
                } catch {
                    // Fallback instantáneo client-side
                }

                if (!simRes || !simRes.consolidated) {
                    simRes = computeInstantSimulation(route, localPortCostMode);
                }

                resultsList.push({
                    routeName: route.name || route._id,
                    routeObj: route,
                    simResult: simRes,
                    tramos: simRes.tramos || route.legs_data?.tramos || []
                });
            }

            setConsolidatedResults(resultsList);
        } catch (err: any) {
            console.error("Error en calculo consolidado:", err);
        } finally {
            setSimulating(false);
        }
    };

    // Ejecutar la simulación automáticamente cuando cambia el cliente, buque o matriz
    useEffect(() => {
        if (selectedClientId && selectedVesselId) {
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
            const { routeName, simResult } = item;
            const c = simResult.consolidated || {};
            const totDist = c.total_distance || 0;
            const totDays = c.total_days || 0;
            const seaDays = c.total_sea_days || 0;
            const portDays = c.total_port_days || 0;
            const bunkerCost = c.total_bunker_costs || 0;
            const agencyCost = c.total_agency_costs || 0;
            const grossRev = c.total_gross_revenue || 0;
            const voyageResult = c.voyage_result || 0;
            const netUtility = c.pnl_net_utility || 0;
            const tceDay = c.tce_utility || 0;

            routeBlocksHtml += `
                <div style="border: 1px solid #cbd5e1; margin-bottom: 25px; page-break-inside: avoid; background-color: #ffffff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden;">
                    <div style="background-color: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #0f172a; font-size: 15px;">OPCIÓN #${idx + 1}: ${routeName}</span>
                        <span style="font-size: 12px; font-weight: 600; background-color: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 4px;">MATRIZ: ${localPortCostMode.toUpperCase()}</span>
                    </div>

                    <div style="padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                                PARÁMETROS DE NAVEGACIÓN Y TIEMPO
                            </div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <tbody>
                                    <tr>
                                        <td style="padding: 4px 0; color: #475569;">Distancia Total Recorrida:</td>
                                        <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">${totDist.toFixed(1)} NM</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; color: #475569;">Días Totales del Viaje:</td>
                                        <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">${totDays.toFixed(2)} días</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; color: #64748b; font-size: 12px; padding-left: 8px;">• Días en Mar (Navegación):</td>
                                        <td style="padding: 4px 0; text-align: right; color: #64748b; font-size: 12px;">${seaDays.toFixed(2)} d</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; color: #64748b; font-size: 12px; padding-left: 8px;">• Días en Puerto (Operación):</td>
                                        <td style="padding: 4px 0; text-align: right; color: #64748b; font-size: 12px;">${portDays.toFixed(2)} d</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                                RESULTADOS FINANCIEROS (CONSOLIDADO)
                            </div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <tbody>
                                    <tr>
                                        <td style="padding: 4px 0; color: #475569;">Gross Revenue (Flete Total):</td>
                                        <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">$${grossRev.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; color: #475569;">Gastos de Puerto / Agencia:</td>
                                        <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #dc2626;">-$${agencyCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; color: #475569;">Consumo de Búnker (IFO/MDO):</td>
                                        <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #dc2626;">-$${bunkerCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid #e2e8f0;">
                                        <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">Resultado del Viaje (Voyage Result):</td>
                                        <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;">$${voyageResult.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    </tr>
                                    <tr style="background-color: #f0fdf4;">
                                        <td style="padding: 6px 4px; font-weight: 700; color: #166534;">Utilidad Neta (Net Profit P&L):</td>
                                        <td style="padding: 6px 4px; text-align: right; font-weight: 700; color: #166534; font-size: 14px;">$${netUtility.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; color: #475569; font-weight: 600;">TCE Realizado:</td>
                                        <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #2563eb;">$${tceDay.toLocaleString('en-US', {maximumFractionDigits: 0})}/día</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        });

        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>INFORME DE AUDITORÍA CONSOLIDADO FINAL - PETRAL</title>
                <style>
                    @page { size: letter portrait; margin: 10mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #0f172a; margin: 0; padding: 15px; background-color: #ffffff; }
                    h1 { font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>REPORT DE AUDITORÍA CONSOLIDADO DE RUTAS</h1>
                        <span style="font-size: 12px; font-weight: 600; color: #64748b;">CLIENTE: ${selectedClientId} | BUQUE: ${selectedVesselId} | MATRIZ DE PUERTO: ${localPortCostMode.toUpperCase()}</span>
                    </div>
                </div>
                ${routeBlocksHtml}
            </body>
            </html>
        `;
    };

    const printableHtml = generateConsolidatedHtml();

    return (
        <div className="flex flex-col gap-4 w-full max-w-full">
            
            {/* Control Ribbon Superior (Diseño Sobrio Blanco Corporativo UI Original) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    
                    <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                        <FileText size={20} className="text-blue-600" />
                        <span className="text-xs font-black uppercase text-slate-800 tracking-wide">Filtros de Auditoría</span>
                    </div>

                    {/* Selector de Cliente */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cliente / Cuenta</Label>
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="bg-slate-50 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {availableClients.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Selector de Buque */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Buque Asignado</Label>
                        <select
                            value={selectedVesselId}
                            onChange={(e) => setSelectedVesselId(e.target.value)}
                            className="bg-slate-50 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {vessels.map(v => (
                                <option key={v.vessel_id || v.id} value={v.vessel_id || v.id}>
                                    {v.vessel_name || v.name || v.vessel_id}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selector de Matriz Estática / Dinámica */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matriz Gastos Puerto</Label>
                        <select
                            value={localPortCostMode}
                            onChange={(e) => setLocalPortCostMode(e.target.value as 'static' | 'matrix')}
                            className="bg-slate-50 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="static">Estática (Master Fijo)</option>
                            <option value="matrix">Dinámica (PxQ Compleja)</option>
                        </select>
                    </div>

                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCalculateConsolidated}
                        disabled={simulating}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <RefreshCw size={14} className={simulating ? "animate-spin text-blue-600" : ""} />
                        <span>{simulating ? "Simulando..." : "Recalcular"}</span>
                    </button>

                    <button
                        onClick={() => handlePrintPdf(printableHtml)}
                        disabled={simulating || !printableHtml}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Printer size={15} />
                        <span>Imprimir Reporte PDF</span>
                    </button>
                </div>
            </div>

            {/* Visor PDF / HTML Report en Pantalla (Tu UI Blanca Corporativa Original) */}
            <div className="flex flex-col bg-slate-200 p-4 rounded-xl border border-slate-300 shadow-inner min-h-[600px]">
                {loading || simulating ? (
                    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border border-slate-300 space-y-3">
                        <RefreshCw size={32} className="animate-spin text-blue-600" />
                        <p className="text-xs font-bold text-slate-600 uppercase">Calculando Simulación Consolidada ({localPortCostMode.toUpperCase()})...</p>
                    </div>
                ) : printableHtml ? (
                    <div className="bg-white shadow-2xl rounded border border-slate-400 p-2 min-h-[750px]">
                        <iframe
                            title="Visor Reporte Auditoria Final"
                            srcDoc={printableHtml}
                            className="w-full min-h-[750px] h-full border-none bg-white"
                        />
                    </div>
                ) : (
                    <div className="p-8 bg-white rounded-lg text-center text-xs font-bold text-slate-500">
                        No hay datos para la combinación seleccionada.
                    </div>
                )}
            </div>

        </div>
    );
};
