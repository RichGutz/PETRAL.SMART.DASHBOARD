import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Calendar, FileSpreadsheet, FileDown, Layers, ChevronDown, ChevronRight, User, ShieldCheck, CheckCircle2, Building2, Anchor, DollarSign, RefreshCw, ExternalLink, Play, Trash2, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface MecRouteRow {
    client: string;
    route: string;
    vessel: string;
    origin: string;
    destination: string;
    isExport: boolean;
    annualTons: number;
    fullLoad: number;
    annualTrips: number;
    pnlPerTrip: number;
    totalGrossMargin: number;
    volumeSharePct: number;
    daysOccupation: number;
    daysAvailable: number;
}

interface MecCalculatedSummary {
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
    byClient: Record<string, {
        client: string;
        routes: MecRouteRow[];
        totalVolumeTm: number;
        totalTrips: number;
        totalGrossMargin: number;
        totalDaysOccupation: number;
    }>;
}

interface ScenarioCardItem {
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

export const FinancialProjectionsMaster: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [rawForecasts, setRawForecasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAuthor, setSelectedAuthor] = useState<string>('TODOS');
    const [openYears, setOpenYears] = useState<Record<string, boolean>>({});
    const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);
    const [scenarioViewModes, setScenarioViewModes] = useState<Record<string, 'company' | 'client'>>({});

    // Carga de escenarios desde Supabase (tabla commercial_forecasts)
    const loadData = async () => {
        try {
            setLoading(true);
            const list = await ForecastService.listForecasts();
            
            const enriched = await Promise.all((list || []).map(async (item: any) => {
                try {
                    const full = await ForecastService.loadForecast(item.id);
                    return full || item;
                } catch {
                    return item;
                }
            }));

            setRawForecasts(enriched);
        } catch (err) {
            console.error("Error cargando maestro de proyecciones:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Procesar y calcular métricas y cuadros oficiales Formato MEC para cada escenario
    const processedScenarios = useMemo<ScenarioCardItem[]>(() => {
        return (rawForecasts || []).map((f: any) => {
            const lines: any[] = f.projection_lines || [];
            const startDate = f.start_date || '2026-01-01';
            const endDate = f.end_date || '2026-12-31';
            const name = f.name || 'Escenario sin nombre';

            let year = '2026';
            const yearMatch = startDate.match(/\b(20\d{2})\b/) || name.match(/\b(20\d{2})\b/);
            if (yearMatch) year = yearMatch[1];

            const vesselSet = new Set<string>();
            const routesMap: Record<string, MecRouteRow> = {};

            lines.forEach((line: any) => {
                const client = (line.client_id || line.client || 'CLIENTE GENERAL').toUpperCase();
                const orig = (line.origin_port_id || 'ILO').toUpperCase();
                const dest = (line.destination_port_id || 'MATARANI').toUpperCase();
                const rName = (line.route_id || `${orig}-${dest}`).toUpperCase();
                const vId = (line.vessel_id || 'MOQUEGUA').replace('_', ' ').toUpperCase();
                vesselSet.add(vId);

                const qty = Number(line.quantity || 13500);
                const freq = Number(line.monthly_frequency || 0);

                // Determinar si es exportación
                const isExport = dest.includes('MEJILLONES') || dest.includes('ANT') || dest.includes('EXP') || orig.includes('CALLAO');

                // Estimación de PnL y días por viaje
                const fRate = Number(line.freight_rate || 28.5);
                const grossTrip = qty * fRate;
                const hirePerDay = 15000;
                const seaDays = isExport ? 5.5 : 2.2;
                const portDays = isExport ? 4.5 : 3.3;
                const tripDurationDays = seaDays + portDays;
                const bunkerTrip = isExport ? 62000 : 38000;
                const portTrip = isExport ? 26000 : 16000;
                const hireCostTrip = hirePerDay * tripDurationDays;
                const voyagePnlTrip = grossTrip - (hireCostTrip + bunkerTrip + portTrip);

                const routeKey = `${client}__${rName}__${vId}`;
                if (!routesMap[routeKey]) {
                    routesMap[routeKey] = {
                        client,
                        route: rName,
                        vessel: vId,
                        origin: orig,
                        destination: dest,
                        isExport,
                        annualTons: 0,
                        fullLoad: qty,
                        annualTrips: 0,
                        pnlPerTrip: voyagePnlTrip,
                        totalGrossMargin: 0,
                        volumeSharePct: 0,
                        daysOccupation: 0,
                        daysAvailable: 0
                    };
                }

                routesMap[routeKey].annualTrips += freq;
                routesMap[routeKey].annualTons += (qty * freq);
                routesMap[routeKey].daysOccupation += (tripDurationDays * freq);
                routesMap[routeKey].totalGrossMargin += (voyagePnlTrip * freq);
            });

            const routesList = Object.values(routesMap);

            // Si el escenario guardado no tiene líneas o vienen en cero, usamos datos base de referencia
            if (routesList.length === 0 || routesList.reduce((acc, r) => acc + r.annualTrips, 0) === 0) {
                const defaultRoutes: MecRouteRow[] = [
                    { client: 'SPCC', route: 'ILO-MATARANI', vessel: 'MOQUEGUA', origin: 'ILO', destination: 'MATARANI', isExport: false, annualTons: 138000, fullLoad: 13500, annualTrips: 10, pnlPerTrip: 144587.20, totalGrossMargin: 1445872.00, volumeSharePct: 17.25, daysOccupation: 51, daysAvailable: 0 },
                    { client: 'SPCC', route: 'ILO-MARCONA', vessel: 'MOQUEGUA', origin: 'ILO', destination: 'MARCONA', isExport: false, annualTons: 250000, fullLoad: 13500, annualTrips: 19, pnlPerTrip: 129998.05, totalGrossMargin: 2469962.96, volumeSharePct: 31.25, daysOccupation: 148, daysAvailable: 0 },
                    { client: 'SPCC', route: 'CALLAO-BAYOVAR', vessel: 'TABLONES', origin: 'CALLAO', destination: 'BAYOVAR', isExport: false, annualTons: 12000, fullLoad: 3000, annualTrips: 4, pnlPerTrip: 85191.00, totalGrossMargin: 340764.00, volumeSharePct: 1.50, daysOccupation: 24, daysAvailable: 0 },
                    { client: 'SPCC', route: 'ILO-MEJILLONES (EXPORT)', vessel: 'MOQUEGUA', origin: 'ILO', destination: 'MEJILLONES', isExport: true, annualTons: 400000, fullLoad: 13500, annualTrips: 30, pnlPerTrip: 104138.27, totalGrossMargin: 3124148.15, volumeSharePct: 50.00, daysOccupation: 207, daysAvailable: 0 }
                ];
                routesList.push(...defaultRoutes);
                vesselSet.add('MOQUEGUA');
                vesselSet.add('TABLONES');
            }

            const totalVol = routesList.reduce((acc, r) => acc + r.annualTons, 0);
            const totalTrips = routesList.reduce((acc, r) => acc + r.annualTrips, 0);
            const totalGrossMargin = routesList.reduce((acc, r) => acc + r.totalGrossMargin, 0);
            const totalDaysOcc = routesList.reduce((acc, r) => acc + r.daysOccupation, 0);

            // Capacidad de la flota: 360 días por cada buque
            const fleetCapacityDays = Math.max(1, vesselSet.size) * 360;
            const totalDaysAvail = Math.max(0, fleetCapacityDays - totalDaysOcc);

            let cabotageTrips = 0;
            let exportTrips = 0;
            let cabotageVol = 0;
            let exportVol = 0;

            const byClient: Record<string, any> = {};

            routesList.forEach(r => {
                r.volumeSharePct = totalVol > 0 ? (r.annualTons / totalVol) * 100 : 0;
                r.daysAvailable = totalDaysAvail;

                if (r.isExport) {
                    exportTrips += r.annualTrips;
                    exportVol += r.annualTons;
                } else {
                    cabotageTrips += r.annualTrips;
                    cabotageVol += r.annualTons;
                }

                if (!byClient[r.client]) {
                    byClient[r.client] = {
                        client: r.client,
                        routes: [],
                        totalVolumeTm: 0,
                        totalTrips: 0,
                        totalGrossMargin: 0,
                        totalDaysOccupation: 0
                    };
                }
                byClient[r.client].routes.push(r);
                byClient[r.client].totalVolumeTm += r.annualTons;
                byClient[r.client].totalTrips += r.annualTrips;
                byClient[r.client].totalGrossMargin += r.totalGrossMargin;
                byClient[r.client].totalDaysOccupation += r.daysOccupation;
            });

            const cabotageSharePct = totalVol > 0 ? (cabotageVol / totalVol) * 100 : 50;
            const exportSharePct = totalVol > 0 ? (exportVol / totalVol) * 100 : 50;

            return {
                id: f.id,
                name: name,
                userId: f.user_id || 'Usuario PETRAL',
                startDate,
                endDate,
                createdAt: f.created_at || f.updated_at,
                projectionLines: lines,
                year,
                mec: {
                    totalVolumeTm: totalVol,
                    totalTrips: totalTrips,
                    cabotageTrips: cabotageTrips,
                    exportTrips: exportTrips,
                    cabotageVolumeTm: cabotageVol,
                    exportVolumeTm: exportVol,
                    cabotageSharePct,
                    exportSharePct,
                    routes: routesList,
                    totalGrossMargin,
                    totalDaysOccupation: totalDaysOcc,
                    totalDaysAvailable: totalDaysAvail,
                    vesselsUsed: Array.from(vesselSet),
                    byClient
                }
            };
        });
    }, [rawForecasts]);

    // 1. Extraer lista de Autores
    const authors = useMemo(() => {
        const set = new Set<string>();
        processedScenarios.forEach(p => set.add(p.userId));
        return ['TODOS', ...Array.from(set)];
    }, [processedScenarios]);

    // 2. Filtrar por autor
    const filteredScenarios = useMemo(() => {
        if (selectedAuthor === 'TODOS') return processedScenarios;
        return processedScenarios.filter(p => p.userId === selectedAuthor);
    }, [processedScenarios, selectedAuthor]);

    // 3. Agrupar por Año
    const groupedByYear = useMemo(() => {
        const groups: Record<string, ScenarioCardItem[]> = {};
        filteredScenarios.forEach(p => {
            if (!groups[p.year]) groups[p.year] = [];
            groups[p.year].push(p);
        });
        const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));
        return { groups, sortedYears };
    }, [filteredScenarios]);

    const toggleYear = (year: string) => {
        setOpenYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    const toggleScenarioExpansion = (scenarioId: string) => {
        setExpandedScenarioId(prev => (prev === scenarioId ? null : scenarioId));
    };

    const setViewModeForScenario = (scenarioId: string, mode: 'company' | 'client') => {
        setScenarioViewModes(prev => ({ ...prev, [scenarioId]: mode }));
    };

    // Función de Eliminación con Seguridad por Usuario
    const handleDeleteScenario = async (scenario: ScenarioCardItem) => {
        const currentUserEmail = (user?.email || '').toLowerCase();
        const currentUsername = (user?.username || '').toLowerCase();
        const authorId = (scenario.userId || '').toLowerCase();
        const isAdmin = user?.role === 'ADMIN';

        const isOwner = authorId === currentUserEmail || authorId === currentUsername || authorId.includes(currentUsername);

        if (!isOwner && !isAdmin) {
            alert(`Acción denegada: Solo el autor (${scenario.userId}) o un Administrador pueden eliminar este escenario.`);
            return;
        }

        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el escenario "${scenario.name}"?`)) {
            return;
        }

        try {
            setLoading(true);
            await ForecastService.deleteForecast(scenario.id);
            alert(`Escenario "${scenario.name}" eliminado exitosamente.`);
            await loadData();
        } catch (err) {
            console.error("Error al eliminar el escenario:", err);
            alert("Ocurrió un error al eliminar el escenario.");
            setLoading(false);
        }
    };

    const handleOpenInMatrix = (scenario: ScenarioCardItem) => {
        try {
            sessionStorage.setItem('petral_load_forecast_id', scenario.id);
            navigate('/dashboard');
        } catch (err) {
            console.error("Error al abrir escenario en matriz:", err);
            navigate('/dashboard');
        }
    };

    // EXPORTACIÓN A EXCEL EN FORMATO OFICIAL MEC (2 BLOQUES)
    const handleExportMecExcel = (scenario: ScenarioCardItem) => {
        const mec = scenario.mec;
        const wb = XLSX.utils.book_new();

        // Construcción de la matriz de datos respetando FORMATO.MEC.BUDGETS.2026.xlsx
        const wsData: any[][] = [
            [`Año ${scenario.year} - Proyectado | Escenario: ${scenario.name}`],
            ['', 'Nº viajes', 'Volumen TM', '%'],
            ['Viajes cabotaje', mec.cabotageTrips, mec.cabotageVolumeTm, (mec.cabotageSharePct / 100)],
            ['Viajes exportación', mec.exportTrips, mec.exportVolumeTm, (mec.exportSharePct / 100)],
            ['Total', mec.totalTrips, mec.totalVolumeTm, 1.0],
            [],
            ['Ruta', 'Buque', 'TM Anual', 'Full load', 'Nº viajes', 'P/L x Viaje', 'Total Gross Margin', '%', 'Dias ocupación', 'Dias disponibles']
        ];

        mec.routes.forEach(r => {
            wsData.push([
                r.route,
                r.vessel,
                r.annualTons,
                r.fullLoad,
                r.annualTrips,
                r.pnlPerTrip,
                r.totalGrossMargin,
                (r.volumeSharePct / 100),
                r.daysOccupation,
                ''
            ]);
        });

        wsData.push([
            'Total',
            '',
            mec.totalVolumeTm,
            '',
            mec.totalTrips,
            '',
            mec.totalGrossMargin,
            1.0,
            mec.totalDaysOccupation,
            mec.totalDaysAvailable
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "FORMATO.MEC");

        const fileName = `Reporte_MEC_${scenario.name.replace(/\s+/g, '_')}_${scenario.year}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // EXPORTACIÓN A PDF EJECUTIVO OFICIAL
    const handleExportMecPDF = (scenario: ScenarioCardItem) => {
        const mec = scenario.mec;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Por favor habilita ventanas emergentes para generar el PDF.');

        const routesHtml = mec.routes.map(r => `
            <tr>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">${r.route}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace; text-align: center;">${r.vessel}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${r.annualTons.toLocaleString('en-US')}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${r.fullLoad.toLocaleString('en-US')}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold;">${r.annualTrips}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">$${r.pnlPerTrip.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold; color: #047857;">$${r.totalGrossMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${r.volumeSharePct.toFixed(2)}%</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold; color: #1d4ed8;">${r.daysOccupation} d</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">-</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Reporte Presupuestal MEC - ${scenario.name}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; padding: 25px; margin: 0; }
                    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .title { font-size: 18px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; }
                    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
                    .meta-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; display: flex; gap: 24px; font-size: 11px; }
                    .meta-box span strong { color: #0f172a; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
                    th { background-color: #1e293b; color: white; text-transform: uppercase; font-size: 10px; padding: 7px 8px; border: 1px solid #334155; }
                    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 18px 0 8px 0; border-left: 4px solid #0284c7; padding-left: 8px; }
                    .total-row { background-color: #f1f5f9; font-weight: 900; }
                    .total-row td { border: 1px solid #94a3b8 !important; }
                    @media print {
                        body { padding: 10px; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 class="title">NAVIERA PETRAL — REPORTE PRESUPUESTAL MEC</h1>
                        <div class="subtitle">Estructura Presupuestal y Control de Capacidad de Flota (${scenario.year})</div>
                    </div>
                    <div style="text-align: right; font-size: 11px; color: #64748b;">
                        Fecha de Emisión: <strong>${new Date().toLocaleDateString('es-PE')}</strong>
                    </div>
                </div>

                <div class="meta-box">
                    <span>Escenario: <strong>${scenario.name}</strong></span>
                    <span>Año Vigencia: <strong>${scenario.year}</strong></span>
                    <span>Autor: <strong>${scenario.userId}</strong></span>
                    <span>Horizonte: <strong>${scenario.startDate} ➔ ${scenario.endDate}</strong></span>
                    <span>Buques: <strong>${mec.vesselsUsed.join(', ')}</strong></span>
                </div>

                <div class="section-title">1. Distribución Macro por Tipo de Tráfico</div>
                <table style="width: 70%;">
                    <thead>
                        <tr>
                            <th style="text-align: left;">Tipo de Tráfico</th>
                            <th style="text-align: center;">Nº Viajes</th>
                            <th style="text-align: right;">Volumen TM</th>
                            <th style="text-align: center;">% Participación</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e40af;">Viajes Cabotaje</td>
                            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold;">${mec.cabotageTrips}</td>
                            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${mec.cabotageVolumeTm.toLocaleString('en-US')} TM</td>
                            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold;">${mec.cabotageSharePct.toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #4338ca;">Viajes Exportación</td>
                            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold;">${mec.exportTrips}</td>
                            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace;">${mec.exportVolumeTm.toLocaleString('en-US')} TM</td>
                            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold;">${mec.exportSharePct.toFixed(1)}%</td>
                        </tr>
                        <tr class="total-row">
                            <td style="padding: 6px 8px; border: 1px solid #94a3b8; font-weight: 900;">TOTAL CONSOLIDADO</td>
                            <td style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center; font-family: monospace; font-weight: 900;">${mec.totalTrips}</td>
                            <td style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; font-weight: 900;">${mec.totalVolumeTm.toLocaleString('en-US')} TM</td>
                            <td style="padding: 6px 8px; border: 1px solid #94a3b8; text-align: center; font-family: monospace; font-weight: 900;">100.0%</td>
                        </tr>
                    </tbody>
                </table>

                <div class="section-title">2. Matriz de Desglose por Ruta y Rendimiento Anual (MEC Budget)</div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Ruta</th>
                            <th style="text-align: center;">Buque</th>
                            <th style="text-align: right;">TM Anual</th>
                            <th style="text-align: right;">Full Load</th>
                            <th style="text-align: center;">Nº Viajes</th>
                            <th style="text-align: right;">P/L x Viaje</th>
                            <th style="text-align: right;">Total Gross Margin</th>
                            <th style="text-align: center;">%</th>
                            <th style="text-align: center;">Días Ocupación</th>
                            <th style="text-align: center;">Días Disponibles</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${routesHtml}
                        <tr class="total-row">
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; font-weight: 900;">TOTAL GENERAL</td>
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; text-align: center;">—</td>
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; font-weight: 900;">${mec.totalVolumeTm.toLocaleString('en-US')}</td>
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; text-align: right;">—</td>
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; text-align: center; font-family: monospace; font-weight: 900;">${mec.totalTrips}</td>
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; text-align: right;">—</td>
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; font-weight: 900; color: #047857;">$${mec.totalGrossMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; text-align: center; font-family: monospace; font-weight: 900;">100.00%</td>
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; text-align: center; font-family: monospace; font-weight: 900; color: #1d4ed8;">${mec.totalDaysOccupation} d</td>
                            <td style="padding: 7px 8px; border: 1px solid #94a3b8; text-align: center; font-family: monospace; font-weight: 900; color: #059669;">${mec.totalDaysAvailable} d libres</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                    PETRAL SMART DASHBOARD — Plataforma de Proyecciones Navieras y Control Financiero Multianual
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <MasterTemplate
            title="Maestro de Matrices"
            subtitle="Matrices y Escenarios Comerciales Multianuales (commercial_forecasts)"
            activeTab="financial-projections"
        >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 flex flex-col min-h-[calc(100vh-140px)]">
                
                {/* CABECERA: TÍTULO Y PESTAÑAS DE AUTORES */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-6">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-600" />
                            Escenarios por Autor
                        </h2>

                        {/* Pestañas Horizontales de Autores */}
                        <div className="flex bg-slate-200 p-1 rounded-lg gap-1 overflow-x-auto">
                            {authors.map(author => {
                                const isSelected = selectedAuthor === author;
                                const count = author === 'TODOS' ? processedScenarios.length : processedScenarios.filter(p => p.userId === author).length;

                                return (
                                    <button
                                        key={author}
                                        onClick={() => {
                                            setSelectedAuthor(author);
                                            setOpenYears({});
                                            setExpandedScenarioId(null);
                                        }}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                            isSelected 
                                                ? 'bg-white text-blue-700 shadow-sm' 
                                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-300'
                                        }`}
                                    >
                                        <User size={13} />
                                        <span>{author === 'TODOS' ? 'Todos los Autores' : author.split('@')[0].toUpperCase()}</span>
                                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-300 text-slate-700'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={loadData}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>

                {/* CONTENIDO PRINCIPAL: ACORDEÓN POR AÑO */}
                <div className="flex-1 p-6 bg-slate-100/60 overflow-y-auto space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-64 text-slate-500 font-medium">
                            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                            Cargando proyecciones y escenarios de commercial_forecasts...
                        </div>
                    ) : groupedByYear.sortedYears.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-200 shadow-sm">
                            <Layers size={36} className="mx-auto text-slate-300 mb-2" />
                            <p className="font-semibold text-sm">No hay escenarios registrados para el autor {selectedAuthor}.</p>
                            <p className="text-xs text-slate-400 mt-1">Crea y guarda nuevos escenarios desde la Matriz Financiera para verlos aquí.</p>
                        </div>
                    ) : (
                        groupedByYear.sortedYears.map(year => {
                            const isOpen = Boolean(openYears[year]);
                            const scenariosInYear = groupedByYear.groups[year] || [];

                            return (
                                <div key={year} className="bg-white rounded-xl border border-slate-250 shadow-sm overflow-hidden transition-all">
                                    
                                    {/* CABECERA HORIZONTAL DEL BLOQUE ANUAL */}
                                    <button
                                        onClick={() => toggleYear(year)}
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar size={18} className="text-amber-400" />
                                            <span className="text-sm font-black uppercase tracking-wider">
                                                📅 AÑO DE VIGENCIA {year}
                                            </span>
                                            <span className="bg-slate-700 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-600">
                                                {scenariosInYear.length} {scenariosInYear.length === 1 ? 'Escenario Registrado' : 'Escenarios Registrados'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                                            <span>{isOpen ? 'Ocultar Año' : 'Desplegar Año'}</span>
                                            {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </div>
                                    </button>

                                    {/* CONTENIDO DESPLEGABLE DEL AÑO: LISTADO DE ESCENARIOS */}
                                    {isOpen && (
                                        <div className="p-4 space-y-4 bg-slate-50 border-t border-slate-200">
                                            {scenariosInYear.map(scenario => {
                                                const isExpanded = expandedScenarioId === scenario.id;
                                                const mec = scenario.mec;
                                                const currentViewMode = scenarioViewModes[scenario.id] || 'company';

                                                return (
                                                    <div key={scenario.id} className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
                                                        
                                                        {/* CABECERA DE LA FILA DEL ESCENARIO */}
                                                        <div 
                                                            onClick={() => toggleScenarioExpansion(scenario.id)}
                                                            className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <button className="text-slate-500 hover:text-blue-600">
                                                                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                                </button>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                            📊 {scenario.name}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-emerald-100 text-emerald-800">
                                                                            <CheckCircle2 size={10} /> PROYECCIÓN MEC
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-3">
                                                                        <span>Autor: <strong className="text-slate-800 font-mono">{scenario.userId}</strong></span>
                                                                        <span className="text-slate-400">|</span>
                                                                        <span>Horizonte: <strong className="text-slate-700 font-mono">{scenario.startDate} ➔ {scenario.endDate}</strong></span>
                                                                        {scenario.createdAt && (
                                                                            <>
                                                                                <span className="text-slate-400">|</span>
                                                                                <span>Creación: <strong className="text-slate-500 font-mono">{new Date(scenario.createdAt).toLocaleDateString()}</strong></span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                                <div className="flex items-center gap-1">
                                                                    {mec.vesselsUsed.map(v => (
                                                                        <span key={v} className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 font-mono text-[10px] font-bold">
                                                                            🚢 {v}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono text-[11px] font-bold text-slate-800">
                                                                    {mec.totalTrips} Viajes
                                                                </span>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenInMatrix(scenario);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer shadow-xs"
                                                                    title="Cargar y simular este escenario en Matriz Financiera"
                                                                >
                                                                    <Play size={12} fill="currentColor" />
                                                                    <span>Abrir en Matriz ➔</span>
                                                                </button>

                                                                <span 
                                                                    className="text-slate-500 font-bold hover:underline cursor-pointer px-1 text-xs"
                                                                    onClick={() => toggleScenarioExpansion(scenario.id)}
                                                                >
                                                                    {isExpanded ? '▲ Ocultar Reporte' : '▼ Ver Reporte MEC'}
                                                                </span>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteScenario(scenario);
                                                                    }}
                                                                    className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm ml-1"
                                                                    title="Eliminar este escenario (solo creador o admin)"
                                                                >
                                                                    <Trash2 size={13} />
                                                                    <span>Eliminar</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* CUADROS OFICIALES FORMATO MEC (REEMPLAZO DE LAS CARDS) */}
                                                        {isExpanded && (
                                                            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-6">
                                                                
                                                                {/* BARRA DE ACCIONES DE REPORTE */}
                                                                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                                                                    {/* Switch Empresa vs Cliente */}
                                                                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
                                                                        <button
                                                                            onClick={() => setViewModeForScenario(scenario.id, 'company')}
                                                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                                                                                currentViewMode === 'company'
                                                                                    ? 'bg-slate-800 text-white shadow-xs'
                                                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                                                            }`}
                                                                        >
                                                                            <Building2 size={13} />
                                                                            <span>🏢 Por Empresa (Consolidado)</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => setViewModeForScenario(scenario.id, 'client')}
                                                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                                                                                currentViewMode === 'client'
                                                                                    ? 'bg-slate-800 text-white shadow-xs'
                                                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                                                                            }`}
                                                                        >
                                                                            <User size={13} />
                                                                            <span>👥 Por Cliente (Segmentado)</span>
                                                                        </button>
                                                                    </div>

                                                                    {/* Botones de Descarga */}
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleExportMecExcel(scenario)}
                                                                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                                                                            title="Descargar en Excel formato oficial MEC"
                                                                        >
                                                                            <FileSpreadsheet size={14} />
                                                                            <span>Descargar Excel (.xlsx)</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleExportMecPDF(scenario)}
                                                                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                                                                            title="Descargar reporte ejecutivo en PDF"
                                                                        >
                                                                            <Printer size={14} />
                                                                            <span>Descargar PDF</span>
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* BLOQUE 1: RESUMEN MACRO POR TIPO DE TRÁFICO */}
                                                                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                                                                    <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
                                                                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                                                            <span>🧭 Bloque 1: Resumen Macro por Tipo de Tráfico</span>
                                                                        </span>
                                                                        <span className="text-[11px] font-mono text-amber-300 font-bold">
                                                                            Año {scenario.year}
                                                                        </span>
                                                                    </div>

                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs text-left border-collapse">
                                                                            <thead className="bg-slate-100 text-slate-700 font-black text-[11px] border-b border-slate-200 uppercase">
                                                                                <tr>
                                                                                    <th className="py-2.5 px-4">Tipo de Tráfico</th>
                                                                                    <th className="py-2.5 px-4 text-center">Nº Viajes</th>
                                                                                    <th className="py-2.5 px-4 text-right">Volumen TM</th>
                                                                                    <th className="py-2.5 px-4 text-center">% Participación</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-slate-100">
                                                                                <tr className="hover:bg-slate-50/80">
                                                                                    <td className="py-2 px-4 font-bold text-blue-900 flex items-center gap-1.5">
                                                                                        <span>⚓</span>
                                                                                        <span>Viajes Cabotaje</span>
                                                                                    </td>
                                                                                    <td className="py-2 px-4 text-center font-mono font-bold text-slate-800">
                                                                                        {mec.cabotageTrips}
                                                                                    </td>
                                                                                    <td className="py-2 px-4 text-right font-mono font-bold text-slate-800">
                                                                                        {mec.cabotageVolumeTm.toLocaleString('en-US')} TM
                                                                                    </td>
                                                                                    <td className="py-2 px-4 text-center font-mono font-black text-blue-700 bg-blue-50/50">
                                                                                        {mec.cabotageSharePct.toFixed(1)}%
                                                                                    </td>
                                                                                </tr>
                                                                                <tr className="hover:bg-slate-50/80">
                                                                                    <td className="py-2 px-4 font-bold text-indigo-900 flex items-center gap-1.5">
                                                                                        <span>🌐</span>
                                                                                        <span>Viajes Exportación</span>
                                                                                    </td>
                                                                                    <td className="py-2 px-4 text-center font-mono font-bold text-slate-800">
                                                                                        {mec.exportTrips}
                                                                                    </td>
                                                                                    <td className="py-2 px-4 text-right font-mono font-bold text-slate-800">
                                                                                        {mec.exportVolumeTm.toLocaleString('en-US')} TM
                                                                                    </td>
                                                                                    <td className="py-2 px-4 text-center font-mono font-black text-indigo-700 bg-indigo-50/50">
                                                                                        {mec.exportSharePct.toFixed(1)}%
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                            <tfoot className="bg-slate-800 text-white font-black">
                                                                                <tr>
                                                                                    <td className="py-2.5 px-4 text-amber-300">TOTAL GENERAL</td>
                                                                                    <td className="py-2.5 px-4 text-center font-mono">{mec.totalTrips}</td>
                                                                                    <td className="py-2.5 px-4 text-right font-mono">{mec.totalVolumeTm.toLocaleString('en-US')} TM</td>
                                                                                    <td className="py-2.5 px-4 text-center font-mono text-emerald-400">100.0%</td>
                                                                                </tr>
                                                                            </tfoot>
                                                                        </table>
                                                                    </div>
                                                                </div>

                                                                {/* BLOQUE 2: MATRIZ DE DESGLOSE POR RUTA Y RENDIMIENTO ANUAL */}
                                                                <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                                                                    <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
                                                                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                                                            <span>📊 Bloque 2: Matriz Anual de Rutas y Rendimiento ({currentViewMode === 'company' ? 'Empresa / Flota' : 'Por Cliente'})</span>
                                                                        </span>
                                                                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                                                                            MEC BUDGET 2026
                                                                        </span>
                                                                    </div>

                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-xs text-left border-collapse">
                                                                            <thead className="bg-slate-100 text-slate-700 font-black text-[10px] border-b border-slate-200 uppercase tracking-wider">
                                                                                <tr>
                                                                                    <th className="py-2.5 px-3">Ruta</th>
                                                                                    <th className="py-2.5 px-2 text-center">Buque</th>
                                                                                    <th className="py-2.5 px-3 text-right">TM Anual</th>
                                                                                    <th className="py-2.5 px-2 text-right">Full Load</th>
                                                                                    <th className="py-2.5 px-2 text-center">Nº Viajes</th>
                                                                                    <th className="py-2.5 px-3 text-right">P/L x Viaje</th>
                                                                                    <th className="py-2.5 px-3 text-right">Total Gross Margin</th>
                                                                                    <th className="py-2.5 px-2 text-center">% Vol</th>
                                                                                    <th className="py-2.5 px-2 text-center">Días Ocupación</th>
                                                                                    <th className="py-2.5 px-2 text-center">Días Libres</th>
                                                                                </tr>
                                                                            </thead>
                                                                            
                                                                            {/* VISTA POR EMPRESA (CONSOLIDADO) */}
                                                                            {currentViewMode === 'company' && (
                                                                                <tbody className="divide-y divide-slate-100">
                                                                                    {mec.routes.map((r, idx) => (
                                                                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                                                            <td className="py-2 px-3 font-bold text-slate-800">
                                                                                                {r.route}
                                                                                                {r.isExport && <span className="ml-1.5 text-[9px] bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded font-mono">EXPORT</span>}
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-center font-mono font-bold text-blue-900">
                                                                                                {r.vessel}
                                                                                            </td>
                                                                                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                                                                                                {r.annualTons.toLocaleString('en-US')}
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-right font-mono text-slate-600">
                                                                                                {r.fullLoad.toLocaleString('en-US')}
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                                                                                                {r.annualTrips}
                                                                                            </td>
                                                                                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                                                                                                ${r.pnlPerTrip.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                            </td>
                                                                                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/40">
                                                                                                ${r.totalGrossMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                                                                                                {r.volumeSharePct.toFixed(2)}%
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-center font-mono font-bold text-blue-800">
                                                                                                {r.daysOccupation} d
                                                                                            </td>
                                                                                            <td className="py-2 px-2 text-center font-mono text-slate-400">
                                                                                                —
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            )}

                                                                            {/* VISTA POR CLIENTE (SEGMENTADO) */}
                                                                            {currentViewMode === 'client' && (
                                                                                <tbody className="divide-y divide-slate-100">
                                                                                    {Object.values(mec.byClient).map(clientGroup => (
                                                                                        <React.Fragment key={clientGroup.client}>
                                                                                            <tr className="bg-slate-200/80 font-black text-slate-800 text-[11px]">
                                                                                                <td colSpan={10} className="py-1.5 px-3 uppercase tracking-wider">
                                                                                                    🏢 CLIENTE: {clientGroup.client}
                                                                                                </td>
                                                                                            </tr>
                                                                                            {clientGroup.routes.map((r: any, idx: number) => (
                                                                                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                                                                    <td className="py-2 px-3 font-semibold text-slate-800 pl-6">
                                                                                                        ↳ {r.route}
                                                                                                        {r.isExport && <span className="ml-1.5 text-[9px] bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded font-mono">EXPORT</span>}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-center font-mono text-blue-900">
                                                                                                        {r.vessel}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                                                                                                        {r.annualTons.toLocaleString('en-US')}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-right font-mono text-slate-600">
                                                                                                        {r.fullLoad.toLocaleString('en-US')}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                                                                                                        {r.annualTrips}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                                                                                                        ${r.pnlPerTrip.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/40">
                                                                                                        ${r.totalGrossMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-center font-mono text-slate-700">
                                                                                                        {r.volumeSharePct.toFixed(2)}%
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-center font-mono font-bold text-blue-800">
                                                                                                        {r.daysOccupation} d
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 text-center font-mono text-slate-400">
                                                                                                        —
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                            <tr className="bg-slate-100/90 font-bold text-slate-900 border-b border-slate-300">
                                                                                                <td className="py-2 px-3 text-right text-slate-700 font-bold" colSpan={2}>
                                                                                                    Subtotal {clientGroup.client}:
                                                                                                </td>
                                                                                                <td className="py-2 px-3 text-right font-mono font-black">
                                                                                                    {clientGroup.totalVolumeTm.toLocaleString('en-US')}
                                                                                                </td>
                                                                                                <td className="py-2 px-2 text-right">—</td>
                                                                                                <td className="py-2 px-2 text-center font-mono font-black">
                                                                                                    {clientGroup.totalTrips}
                                                                                                </td>
                                                                                                <td className="py-2 px-3 text-right">—</td>
                                                                                                <td className="py-2 px-3 text-right font-mono font-black text-emerald-800">
                                                                                                    ${clientGroup.totalGrossMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                                </td>
                                                                                                <td className="py-2 px-2 text-center font-mono font-bold">
                                                                                                    {((clientGroup.totalVolumeTm / mec.totalVolumeTm) * 100).toFixed(2)}%
                                                                                                </td>
                                                                                                <td className="py-2 px-2 text-center font-mono font-black text-blue-900">
                                                                                                    {clientGroup.totalDaysOccupation} d
                                                                                                </td>
                                                                                                <td className="py-2 px-2 text-center font-mono text-slate-400">—</td>
                                                                                            </tr>
                                                                                        </React.Fragment>
                                                                                    ))}
                                                                                </tbody>
                                                                            )}

                                                                            {/* PIE DE TABLA TOTAL CONSOLIDADO */}
                                                                            <tfoot className="bg-slate-800 text-white font-black">
                                                                                <tr>
                                                                                    <td className="py-2.5 px-3 text-amber-300 font-black">TOTAL GENERAL</td>
                                                                                    <td className="py-2.5 px-2 text-center">—</td>
                                                                                    <td className="py-2.5 px-3 text-right font-mono font-black">{mec.totalVolumeTm.toLocaleString('en-US')}</td>
                                                                                    <td className="py-2.5 px-2 text-right">—</td>
                                                                                    <td className="py-2.5 px-2 text-center font-mono font-black">{mec.totalTrips}</td>
                                                                                    <td className="py-2.5 px-3 text-right">—</td>
                                                                                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300">
                                                                                        ${mec.totalGrossMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                    </td>
                                                                                    <td className="py-2.5 px-2 text-center font-mono font-black">100.00%</td>
                                                                                    <td className="py-2.5 px-2 text-center font-mono font-black text-blue-300">
                                                                                        {mec.totalDaysOccupation} d
                                                                                    </td>
                                                                                    <td className="py-2.5 px-2 text-center font-mono font-black text-emerald-400">
                                                                                        {mec.totalDaysAvailable} d libres
                                                                                    </td>
                                                                                </tr>
                                                                            </tfoot>
                                                                        </table>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        )}

                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </MasterTemplate>
    );
};
