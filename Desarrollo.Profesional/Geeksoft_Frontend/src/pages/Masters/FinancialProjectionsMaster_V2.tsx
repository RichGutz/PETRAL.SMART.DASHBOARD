import React, { useState, useEffect, useMemo } from 'react';
import { MasterTemplate } from '../../components/Masters/MasterTemplate_V2';
import { ForecastService } from '../../services/api';
import { MulticotizadorRetrieverService } from '../../services/providers/multicotizadorRetrieverService';
import { MulticotizadorCalculationEngine } from '../../services/providers/multicotizadorCalculationEngine';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, Calendar, FileSpreadsheet, Layers, ChevronDown, ChevronRight, User, CheckCircle2, RefreshCw, Play, Trash2, Printer, Plus, X, Sparkles, Filter, Check, ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface MecRouteRow {
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
    const [quotesList, setQuotesList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAuthor, setSelectedAuthor] = useState<string>('TODOS');
    const [openYears, setOpenYears] = useState<Record<string, boolean>>({ '2027': true, '2026': true });
    const [expandedScenarios, setExpandedScenarios] = useState<Record<string, boolean>>({});

    // Estado para Informe Consolidado Multi-Escenario (Gran Finale)
    const [selectedMultiScenarioIds, setSelectedMultiScenarioIds] = useState<string[]>([]);
    const [scenarioToAddId, setScenarioToAddId] = useState<string>('');
    const [premisasNotes, setPremisasNotes] = useState<string>(
        "a) P/L: Se ha considerado el P/L del último ajuste de bunker y cotizaciones aprobadas.\nb) Proyecciones multianuales SPCC, NEXA y clientes clave.\nc) Estimación de capacidad de flota en base a 360 días por buque."
    );

    // Carga de escenarios y catálogo de cotizaciones desde Supabase
    const loadData = async () => {
        try {
            setLoading(true);
            const [list, quotes] = await Promise.all([
                ForecastService.listForecasts(),
                ForecastService.listSpots().catch(() => [])
            ]);

            setQuotesList(quotes || []);
            
            const enriched = await Promise.all((list || []).map(async (item: any) => {
                try {
                    const full = await ForecastService.loadForecast(item.id);
                    return full || item;
                } catch {
                    return item;
                }
            }));

            setRawForecasts(enriched);

            // Auto-expandir todos los años y todos los escenarios registrados para máxima visibilidad inmediata
            const autoYears: Record<string, boolean> = { '2027': true, '2026': true };
            const autoExpanded: Record<string, boolean> = {};
            const multiIds: string[] = [];
            (enriched || []).forEach((item: any) => {
                const y = (item.start_date || '2027').substring(0, 4);
                autoYears[y] = true;
                if (item.id) {
                    autoExpanded[item.id] = true;
                    multiIds.push(item.id);
                }
            });
            setOpenYears(autoYears);
            setExpandedScenarios(autoExpanded);
            setSelectedMultiScenarioIds(multiIds);
            if (multiIds.length > 0) setScenarioToAddId(multiIds[0]);

        } catch (err) {
            console.error("Error cargando maestro de proyecciones:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Procesar y calcular métricas respetando el modelo 1:1 de FORMATO.MEC.BUDGETS.2026.xlsx
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
                const client = (line.client_id || line.client || 'SPCC').toUpperCase();
                const orig = (line.origin_port_id || 'ILO').toUpperCase();
                const dest = (line.destination_port_id || 'MATARANI').toUpperCase();
                const rName = (line.route_id || `${orig}-${dest}`).toUpperCase();
                const vId = (line.vessel_id || 'MOQUEGUA').replace('_', ' ').toUpperCase();
                vesselSet.add(vId);

                let qty = Number(line.quantity || 13500);
                const freq = Number(line.monthly_frequency || 0);

                // Detección automática Cabotaje vs Exportación por Maestro de Puertos (Chile, Ecuador, etc.)
                const foreignPorts = [
                    'BARQUITO', 'MEJILLONES', 'ANTOFAGASTA', 'QUINTERO', 'PATILLOS', 
                    'VENTANAS', 'SAN VICENTE', 'ARICA', 'IQUIQUE', 'CORONEL', 
                    'COQUIMBO', 'VALPARAISO', 'HUASCO', 'MICHILLA', 'GUAYACAN', 
                    'CALETA COLOSO', 'TOCOPILLA', 'PUERTO ANGAMOS', 'LIRQUEN', 'SAN ANTONIO',
                    'GUAYAQUIL', 'ESMERALDAS', 'MANTA', 'BUENAVENTURA', 'LAZARO CARDENAS'
                ];
                const isExport = foreignPorts.some(p => dest.includes(p) || orig.includes(p)) 
                    || dest.includes('EXP') 
                    || dest.includes('CHILE')
                    || line.is_export === true;

                // Vincular con la cotización / cierre real para extraer P&L y Días exactos
                const matchedQuote = (quotesList || []).find((q: any) => 
                    q.name === line.quote_id || 
                    q.id === line.quote_id || 
                    (q.name && line.quote_id && q.name.toLowerCase().includes(String(line.quote_id).toLowerCase())) ||
                    (q.name && q.name.toUpperCase().includes(orig) && q.name.toUpperCase().includes(dest))
                );

                let voyagePnlTrip = 0;
                let tripDurationDays = 0;

                if (matchedQuote) {
                    try {
                        const unpacked = MulticotizadorRetrieverService.unpackQuoteData(matchedQuote);
                        const fs = unpacked.financial_summary;
                        if (fs && Number(fs.grossRevenueTotal || 0) > 0) {
                            voyagePnlTrip = Number(fs.voyageResultPnl || 0);
                            tripDurationDays = Number(fs.totalDays || 0);
                            if (Number(fs.totalQuantity || 0) > 0) qty = Number(fs.totalQuantity);
                        } else {
                            const calc = MulticotizadorCalculationEngine.calculateVoyage({
                                tramos: unpacked.tramos,
                                puertosConfig: unpacked.puertosConfig,
                                vesselParams: unpacked.vesselParams,
                                bunkerPriceIfo: unpacked.bunker_price_ifo,
                                bunkerPriceMdo: unpacked.bunker_price_mdo,
                                addressCommPct: unpacked.addressCommPct,
                                brokerCommPct: unpacked.brokerCommPct,
                                charterHireCost: unpacked.charter_hire_cost
                            });
                            voyagePnlTrip = calc.voyageResultPnl;
                            tripDurationDays = calc.totalDays;
                            if (calc.totalQuantity > 0) qty = calc.totalQuantity;
                        }
                    } catch {
                        voyagePnlTrip = 0;
                        tripDurationDays = 0;
                    }
                }

                // Fallback si no hubiese cotización enlazada
                if (voyagePnlTrip === 0) {
                    const fRate = Number(line.custom_tariff || line.freight_rate || (isExport ? 21.15 : (dest.includes('MAT') ? 19.29 : 23.10)));
                    const grossTrip = qty * fRate;
                    const hirePerDay = 13000;
                    const seaDays = isExport ? 2.61 : (dest.includes('MAT') ? 0.54 : 2.21);
                    const portDays = isExport ? 2.13 : (dest.includes('MAT') ? 3.54 : 2.13);
                    tripDurationDays = seaDays + portDays;
                    const bunkerTrip = isExport ? 48088 : (dest.includes('MAT') ? 19981 : 41555);
                    const portTrip = isExport ? 80500 : (dest.includes('MAT') ? 42500 : 62000);
                    const hireCostTrip = hirePerDay * tripDurationDays;
                    voyagePnlTrip = grossTrip - (hireCostTrip + bunkerTrip + portTrip);
                }

                const routeKey = `${orig}-${dest}`;
                if (!routesMap[routeKey]) {
                    routesMap[routeKey] = {
                        client,
                        route: routeKey,
                        vessel: vId,
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

            // Calcular P/L y Full Load ponderados por ruta
            routesList.forEach(r => {
                if (r.annualTrips > 0) {
                    r.pnlPerTrip = r.totalGrossMargin / r.annualTrips;
                    r.fullLoad = r.annualTons / r.annualTrips;
                }
            });

            if (routesList.length === 0 || routesList.reduce((acc, r) => acc + r.annualTrips, 0) === 0) {
                const defaultRoutes: MecRouteRow[] = [
                    { client: 'SPCC', route: 'ILO-MATARANI', vessel: 'MOQUEGUA', isExport: false, annualTons: 135000, fullLoad: 13500, annualTrips: 10, pnlPerTrip: 148392.64, totalGrossMargin: 1483926.38, volumeSharePct: 16.95, daysOccupation: 40.8, daysAvailable: 0 },
                    { client: 'SPCC', route: 'ILO-MARCONA', vessel: 'MOQUEGUA', isExport: false, annualTons: 256500, fullLoad: 13500, annualTrips: 19, pnlPerTrip: 136724.96, totalGrossMargin: 2597774.24, volumeSharePct: 32.20, daysOccupation: 104.7, daysAvailable: 0 },
                    { client: 'SPCC', route: 'ILO-MEJILLONES', vessel: 'MOQUEGUA', isExport: true, annualTons: 405000, fullLoad: 13500, annualTrips: 30, pnlPerTrip: 101912.65, totalGrossMargin: 3057379.50, volumeSharePct: 50.85, daysOccupation: 184.8, daysAvailable: 0 }
                ];
                routesList.push(...defaultRoutes);
                vesselSet.add('MOQUEGUA');
            }

            const totalVol = routesList.reduce((acc, r) => acc + r.annualTons, 0);
            const totalTrips = routesList.reduce((acc, r) => acc + r.annualTrips, 0);
            const totalGrossMargin = routesList.reduce((acc, r) => acc + r.totalGrossMargin, 0);
            const totalDaysOcc = routesList.reduce((acc, r) => acc + r.daysOccupation, 0);

            const fleetCapacityDays = Math.max(1, vesselSet.size) * 360;
            const totalDaysAvail = Math.max(0, fleetCapacityDays - totalDaysOcc);

            let cabotageTrips = 0;
            let exportTrips = 0;
            let cabotageVol = 0;
            let exportVol = 0;

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
                    vesselsUsed: Array.from(vesselSet)
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
        setExpandedScenarios(prev => ({ ...prev, [scenarioId]: !prev[scenarioId] }));
    };

    // Función de Eliminación
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

    // EXPORTACIÓN A EXCEL 1:1 IGUAL AL ARCHIVO FORMATO.MEC.BUDGETS.2026.xlsx
    const handleExportMecExcel = (scenario: ScenarioCardItem) => {
        const mec = scenario.mec;
        const wb = XLSX.utils.book_new();

        const wsData: any[][] = [
            [`Año ${scenario.year} - Proyectado`],
            ['', 'Nº viajes', 'Volumen TM', '%'],
            ['Viajes cabotaje', mec.cabotageTrips, mec.cabotageVolumeTm, `${mec.cabotageSharePct.toFixed(2)}%`],
            ['Viajes exportación', mec.exportTrips, mec.exportVolumeTm, `${mec.exportSharePct.toFixed(2)}%`],
            ['Total', mec.totalTrips, mec.totalVolumeTm, '100.00%'],
            [],
            ['Ruta', 'TM Anual', 'Full load', 'Nº viajes', 'P/L x Viaje', 'Total Gross Margin', '%', 'Dias ocupación', 'Dias disponibles']
        ];

        mec.routes.forEach(r => {
            wsData.push([
                r.route,
                r.annualTons,
                Math.round(r.fullLoad),
                r.annualTrips,
                Math.round(r.pnlPerTrip),
                Math.round(r.totalGrossMargin),
                `${r.volumeSharePct.toFixed(2)}%`,
                Math.round(r.daysOccupation),
                ''
            ]);
        });

        wsData.push([
            'Total',
            mec.totalVolumeTm,
            '',
            mec.totalTrips,
            '',
            Math.round(mec.totalGrossMargin),
            '100.00%',
            Math.round(mec.totalDaysOccupation),
            Math.round(mec.totalDaysAvailable)
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "FORMATO.MEC");

        const fileName = `FORMATO.MEC.BUDGETS.${scenario.year}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // EXPORTACIÓN A PDF EJECUTIVO OFICIAL (FORMATO HOJA EXCEL FOXIT READY)
    const handleExportMecPDF = (scenario: ScenarioCardItem) => {
        const mec = scenario.mec;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Por favor habilita ventanas emergentes para generar el PDF.');

        const routesHtml = mec.routes.map(r => `
            <tr>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b; background: #ffffff;">${r.route}</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; color: #334155;">${r.annualTons.toLocaleString('en-US')}</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; color: #334155;">${Math.round(r.fullLoad).toLocaleString('en-US')}</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: bold; color: #0f172a;">${r.annualTrips}</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; color: #334155;">$${Math.round(r.pnlPerTrip).toLocaleString('en-US')}</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; font-weight: bold; color: #0f172a;">$${Math.round(r.totalGrossMargin).toLocaleString('en-US')}</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: 600; color: #0369a1;">${r.volumeSharePct.toFixed(2)}%</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: bold; color: #334155;">${Math.round(r.daysOccupation)}</td>
                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; color: #94a3b8;">-</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <title>PETRAL_FORMATO_MEC_BUDGETS_${scenario.year}</title>
                <!-- Librería html2pdf para descarga directa -->
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 10mm 10mm 10mm 10mm;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        color: #1e293b;
                        background: #f8fafc;
                        margin: 0;
                        padding: 20px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        position: fixed;
                        top: 15px;
                        right: 20px;
                        z-index: 9999;
                        display: flex;
                        gap: 10px;
                        background: rgba(15, 23, 42, 0.9);
                        padding: 8px 16px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }
                    .btn-action {
                        background: #2563eb;
                        color: #fff;
                        border: none;
                        padding: 7px 14px;
                        border-radius: 6px;
                        font-weight: bold;
                        font-size: 12px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: background 0.2s;
                    }
                    .btn-action:hover {
                        background: #1d4ed8;
                    }
                    .btn-secondary {
                        background: #475569;
                    }
                    .btn-secondary:hover {
                        background: #334155;
                    }
                    .page-container {
                        max-width: 1060px;
                        margin: 0 auto;
                        background: #ffffff;
                        padding: 30px 35px;
                        border-radius: 6px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        border: 1px solid #e2e8f0;
                    }
                    .header-box {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid #0284c7;
                        padding-bottom: 12px;
                        margin-bottom: 20px;
                    }
                    .header-title {
                        font-size: 18px;
                        font-weight: 800;
                        color: #0f172a;
                        margin: 0 0 4px 0;
                        letter-spacing: -0.5px;
                    }
                    .header-subtitle {
                        font-size: 11px;
                        font-weight: 600;
                        color: #64748b;
                        margin: 0;
                    }
                    .badge-pill {
                        background: #f0f9ff;
                        color: #0369a1;
                        border: 1px solid #bae6fd;
                        padding: 4px 10px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 700;
                        font-family: 'Courier New', monospace;
                    }
                    .section-label {
                        font-size: 13px;
                        font-weight: 700;
                        color: #334155;
                        margin: 0 0 8px 0;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 11px;
                        margin-bottom: 22px;
                    }
                    th {
                        background-color: #f1f5f9;
                        color: #1e293b;
                        font-weight: 700;
                        padding: 7px 10px;
                        border: 1px solid #cbd5e1;
                        font-size: 10.5px;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                    }
                    .total-row td {
                        font-weight: 800;
                        background-color: #f1f5f9;
                        color: #0f172a;
                        border-top: 2px solid #64748b;
                        border-bottom: 2px solid #64748b;
                    }
                    .footer-box {
                        margin-top: 25px;
                        padding-top: 15px;
                        border-top: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 9.5px;
                        color: #64748b;
                    }
                    .signature-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 40px;
                        margin-top: 30px;
                        margin-bottom: 10px;
                    }
                    .sig-line {
                        border-top: 1px solid #94a3b8;
                        padding-top: 5px;
                        text-align: center;
                        font-size: 10px;
                        font-weight: bold;
                        color: #475569;
                    }
                    @media print {
                        body {
                            background: #ffffff;
                            padding: 0;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .page-container {
                            border: none;
                            box-shadow: none;
                            padding: 10px 0;
                            max-width: 100%;
                        }
                    }
                </style>
            </head>
            <body>

                <!-- BARRA FLOTANTE DE ACCIÓN (SOLO PANTALLA) -->
                <div class="no-print">
                    <button class="btn-action" id="btn-download-pdf" onclick="downloadDirectPdf()">
                        <span>📥 Descargar PDF Directo (Foxit Ready)</span>
                    </button>
                    <button class="btn-action btn-secondary" onclick="window.print()">
                        <span>🖨️ Imprimir / Guardar PDF</span>
                    </button>
                </div>

                <div class="page-container" id="pdf-content-page">
                    
                    <!-- CABECERA EJECUTIVA -->
                    <div class="header-box">
                        <div>
                            <h1 class="header-title">NAVIERA PETRAL S.A.</h1>
                            <p class="header-subtitle">REPORTE EJECUTIVO DE CONTROL PRESUPUESTAL & ASIGNACIÓN DE CAPACIDAD (FORMATO MEC)</p>
                        </div>
                        <div style="text-align: right;">
                            <div class="badge-pill">AÑO ${scenario.year} - PROYECTADO</div>
                            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Escenario: <strong>${scenario.name}</strong></div>
                        </div>
                    </div>

                    <!-- BLOQUE 1: RESUMEN MACRO DE TRÁFICO -->
                    <div class="section-label">1. Distribución Macro por Tipo de Tráfico</div>
                    <table style="max-width: 520px;">
                        <thead>
                            <tr>
                                <th style="text-align: left; width: 180px;">Tipo de Tráfico</th>
                                <th style="text-align: center; width: 90px;">Nº viajes</th>
                                <th style="text-align: right; width: 140px;">Volumen TM</th>
                                <th style="text-align: center; width: 90px;">% Participación</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155; background: #fff;">Viajes cabotaje</td>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: bold;">${mec.cabotageTrips}</td>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace;">${mec.cabotageVolumeTm.toLocaleString('en-US')}</td>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: 700; color: #0369a1;">${mec.cabotageSharePct.toFixed(2)}%</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #334155; background: #fff;">Viajes exportación</td>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: bold;">${mec.exportTrips}</td>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace;">${mec.exportVolumeTm.toLocaleString('en-US')}</td>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: 700; color: #0369a1;">${mec.exportSharePct.toFixed(2)}%</td>
                            </tr>
                            <tr class="total-row">
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: 800;">TOTAL</td>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">${mec.totalTrips}</td>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace;">${mec.totalVolumeTm.toLocaleString('en-US')}</td>
                                <td style="padding: 6px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: 800;">100.00%</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- BLOQUE 2: MATRIZ DE RUTAS Y RENDIMIENTO -->
                    <div class="section-label" style="margin-top: 15px;">2. Matriz Anual de Desglose por Ruta y Rendimiento Operativo</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: left;">Ruta</th>
                                <th style="text-align: right;">TM Anual</th>
                                <th style="text-align: right;">Full load</th>
                                <th style="text-align: center;">Nº viajes</th>
                                <th style="text-align: right;">P/L x Viaje</th>
                                <th style="text-align: right;">Total Gross Margin</th>
                                <th style="text-align: center;">%</th>
                                <th style="text-align: center;">Dias ocupación</th>
                                <th style="text-align: center;">Dias disponibles</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${routesHtml}
                            <tr class="total-row">
                                <td style="padding: 7px 10px; border: 1px solid #cbd5e1;">TOTAL GENERAL</td>
                                <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace;">${mec.totalVolumeTm.toLocaleString('en-US')}</td>
                                <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: right;">-</td>
                                <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">${mec.totalTrips}</td>
                                <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: right;">-</td>
                                <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; color: #047857;">$${Math.round(mec.totalGrossMargin).toLocaleString('en-US')}</td>
                                <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: 800;">100.00%</td>
                                <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">${Math.round(mec.totalDaysOccupation)}</td>
                                <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">${Math.round(mec.totalDaysAvailable)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- SECCIÓN DE FIRMAS Y VALIDACIÓN GERENCIAL -->
                    <div class="signature-grid">
                        <div class="sig-line">
                            <div>Elaborado por: Área Comercial / Operaciones</div>
                            <div style="font-size: 8.5px; font-weight: normal; color: #94a3b8; margin-top: 3px;">PETRAL SMART DASHBOARD</div>
                        </div>
                        <div class="sig-line">
                            <div>Aprobado por: Gerencia General / Directorio</div>
                            <div style="font-size: 8.5px; font-weight: normal; color: #94a3b8; margin-top: 3px;">NAVIERA PETRAL S.A.</div>
                        </div>
                    </div>

                    <!-- FOOTER CORPORATIVO -->
                    <div class="footer-box">
                        <div>Documento emitido conforme a FORMATO.MEC.BUDGETS.2026.xlsx | NAVIERA PETRAL S.A.</div>
                        <div>Fecha de Impresión: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                </div>

                <script>
                    function downloadDirectPdf() {
                        const btn = document.getElementById('btn-download-pdf');
                        if (btn) {
                            btn.innerText = '⏳ Generando PDF...';
                            btn.disabled = true;
                        }
                        const element = document.getElementById('pdf-content-page');
                        const opt = {
                            margin: 0,
                            filename: 'PETRAL_FORMATO_MEC_BUDGETS_${scenario.year}.pdf',
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
                        };
                        
                        if (window.html2pdf) {
                            window.html2pdf().set(opt).from(element).save().then(function() {
                                if (btn) {
                                    btn.innerText = '📥 Descargar PDF Directo (Foxit Ready)';
                                    btn.disabled = false;
                                }
                            }).catch(function(err) {
                                console.error('Error al generar PDF directo:', err);
                                if (btn) {
                                    btn.innerText = '📥 Descargar PDF Directo (Foxit Ready)';
                                    btn.disabled = false;
                                }
                            });
                        } else {
                            window.print();
                            if (btn) {
                                btn.innerText = '📥 Descargar PDF Directo (Foxit Ready)';
                                btn.disabled = false;
                            }
                        }
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    // =========================================================================
    // LÓGICA Y EXPORTACIÓN DEL INFORME MULTI-ESCENARIO CONSOLIDADO (GRAN FINALE)
    // =========================================================================
    const handleAddMultiScenario = () => {
        if (!scenarioToAddId) return;
        if (!selectedMultiScenarioIds.includes(scenarioToAddId)) {
            setSelectedMultiScenarioIds(prev => [...prev, scenarioToAddId]);
        }
    };

    const handleRemoveMultiScenario = (id: string) => {
        setSelectedMultiScenarioIds(prev => prev.filter(sId => sId !== id));
    };

    const handleSelectAllMultiScenarios = () => {
        setSelectedMultiScenarioIds(processedScenarios.map(p => p.id));
    };

    const handleClearMultiScenarios = () => {
        setSelectedMultiScenarioIds([]);
    };

    const multiSelectedScenarios = useMemo(() => {
        return selectedMultiScenarioIds
            .map(id => processedScenarios.find(p => p.id === id))
            .filter(Boolean) as ScenarioCardItem[];
    }, [selectedMultiScenarioIds, processedScenarios]);

    // Paleta de colores distintivos por sección apilada (igual a la referencia ejecutiva)
    const scenarioThemeColors = [
        { bgHeader: '#d9ead3', textHeader: '#274e13', borderColor: '#b6d7a8', tag: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
        { bgHeader: '#fff2cc', textHeader: '#7f6000', borderColor: '#ffe599', tag: 'bg-amber-100 text-amber-900 border-amber-300' },
        { bgHeader: '#fce5cd', textHeader: '#783f04', borderColor: '#f9cb9c', tag: 'bg-orange-100 text-orange-900 border-orange-300' },
        { bgHeader: '#cfe2f3', textHeader: '#0b5394', borderColor: '#9fc5e8', tag: 'bg-blue-100 text-blue-900 border-blue-300' }
    ];

    // EXPORTACIÓN A EXCEL MULTI-ESCENARIO
    const handleExportMultiMecExcel = (scenariosToExport: ScenarioCardItem[]) => {
        if (scenariosToExport.length === 0) return alert('Por favor selecciona al menos un escenario para exportar.');
        const wb = XLSX.utils.book_new();

        // Hoja Consolidada Apilada
        const masterData: any[][] = [
            ['NAVIERA PETRAL S.A. - INFORME EJECUTIVO MULTI-ESCENARIO CONSOLIDADO'],
            [`Fecha de Emisión: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`],
            ['Premisas:'],
            ...premisasNotes.split('\n').map(line => [line]),
            []
        ];

        scenariosToExport.forEach((scenario, sIdx) => {
            const mec = scenario.mec;
            masterData.push([`========================================================================================`]);
            masterData.push([`SECCIÓN ${sIdx + 1}: ${scenario.name.toUpperCase()} (Año ${scenario.year} | Autor: ${scenario.userId})`]);
            masterData.push([`========================================================================================`]);
            masterData.push(['', 'Nº viajes', 'Volumen TM', '%']);
            masterData.push(['Viajes cabotaje', mec.cabotageTrips, mec.cabotageVolumeTm, `${mec.cabotageSharePct.toFixed(2)}%`]);
            masterData.push(['Viajes exportación', mec.exportTrips, mec.exportVolumeTm, `${mec.exportSharePct.toFixed(2)}%`]);
            masterData.push(['Total', mec.totalTrips, mec.totalVolumeTm, '100.00%']);
            masterData.push([]);
            masterData.push(['Puertos / Ruta', 'TM Anual', 'Full load', 'Nº viajes', 'P/L x Viaje', 'Total Margen Operativo', '%', 'Dias ocupación', 'Dias disponibles']);

            mec.routes.forEach(r => {
                masterData.push([
                    r.route,
                    r.annualTons,
                    Math.round(r.fullLoad),
                    r.annualTrips,
                    Math.round(r.pnlPerTrip),
                    Math.round(r.totalGrossMargin),
                    `${r.volumeSharePct.toFixed(2)}%`,
                    Math.round(r.daysOccupation),
                    ''
                ]);
            });

            masterData.push([
                'Total',
                mec.totalVolumeTm,
                '',
                mec.totalTrips,
                '',
                Math.round(mec.totalGrossMargin),
                '100.00%',
                Math.round(mec.totalDaysOccupation),
                Math.round(mec.totalDaysAvailable)
            ]);
            masterData.push([]);
            masterData.push([]);
        });

        const masterWs = XLSX.utils.aoa_to_sheet(masterData);
        XLSX.utils.book_append_sheet(wb, masterWs, "INFORME_CONSOLIDADO");

        // Hojas individuales por escenario
        scenariosToExport.forEach((scenario) => {
            const mec = scenario.mec;
            const wsData: any[][] = [
                [`Año ${scenario.year} - ${scenario.name}`],
                ['', 'Nº viajes', 'Volumen TM', '%'],
                ['Viajes cabotaje', mec.cabotageTrips, mec.cabotageVolumeTm, `${mec.cabotageSharePct.toFixed(2)}%`],
                ['Viajes exportación', mec.exportTrips, mec.exportVolumeTm, `${mec.exportSharePct.toFixed(2)}%`],
                ['Total', mec.totalTrips, mec.totalVolumeTm, '100.00%'],
                [],
                ['Ruta', 'TM Anual', 'Full load', 'Nº viajes', 'P/L x Viaje', 'Total Gross Margin', '%', 'Dias ocupación', 'Dias disponibles']
            ];

            mec.routes.forEach(r => {
                wsData.push([
                    r.route,
                    r.annualTons,
                    Math.round(r.fullLoad),
                    r.annualTrips,
                    Math.round(r.pnlPerTrip),
                    Math.round(r.totalGrossMargin),
                    `${r.volumeSharePct.toFixed(2)}%`,
                    Math.round(r.daysOccupation),
                    ''
                ]);
            });

            wsData.push([
                'Total',
                mec.totalVolumeTm,
                '',
                mec.totalTrips,
                '',
                Math.round(mec.totalGrossMargin),
                '100.00%',
                Math.round(mec.totalDaysOccupation),
                Math.round(mec.totalDaysAvailable)
            ]);

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const cleanName = (scenario.name || 'Escenario').replace(/[:\\/?*\[\]]/g, '').substring(0, 28);
            XLSX.utils.book_append_sheet(wb, ws, cleanName);
        });

        XLSX.writeFile(wb, `PETRAL_INFORME_CONSOLIDADO_MULTI_ESCENARIOS_MEC.xlsx`);
    };

    // EXPORTACIÓN A PDF EJECUTIVO MULTI-ESCENARIO (FORMATO EJECUTIVO DE HOJA CONTINUA FOXIT READY)
    const handleExportMultiMecPDF = (scenariosToExport: ScenarioCardItem[]) => {
        if (scenariosToExport.length === 0) return alert('Por favor selecciona al menos un escenario para generar el informe PDF.');
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Por favor habilita ventanas emergentes para generar el PDF.');

        const sectionsHtml = scenariosToExport.map((scenario, sIdx) => {
            const mec = scenario.mec;
            const theme = scenarioThemeColors[sIdx % scenarioThemeColors.length];

            const routesHtml = mec.routes.map(r => `
                <tr>
                    <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b; background: #ffffff;">${r.route}</td>
                    <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; color: #334155;">${r.annualTons.toLocaleString('en-US')}</td>
                    <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; color: #334155;">${Math.round(r.fullLoad).toLocaleString('en-US')}</td>
                    <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: bold; color: #0f172a;">${r.annualTrips}</td>
                    <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; color: #334155;">$${Math.round(r.pnlPerTrip).toLocaleString('en-US')}</td>
                    <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; font-weight: bold; color: #0f172a;">$${Math.round(r.totalGrossMargin).toLocaleString('en-US')}</td>
                    <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: 600; color: #0369a1;">${r.volumeSharePct.toFixed(2)}%</td>
                    <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: bold; color: #334155;">${Math.round(r.daysOccupation)}</td>
                    <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; color: #94a3b8;">-</td>
                </tr>
            `).join('');

            return `
                <div class="scenario-section" style="margin-bottom: 22px; page-break-inside: avoid;">
                    
                    <!-- TABLA 1: CABOTAJE VS EXPORTACION CON CABECERA TEMÁTICA -->
                    <table style="max-width: 480px; margin-bottom: 8px;">
                        <thead>
                            <tr>
                                <th colspan="4" style="background-color: ${theme.bgHeader}; color: ${theme.textHeader}; text-align: center; font-size: 11.5px; font-weight: 800; padding: 5px 8px; border: 1px solid #cbd5e1; letter-spacing: 0.2px;">
                                    ${scenario.name.toUpperCase()} — AÑO ${scenario.year}
                                </th>
                            </tr>
                            <tr>
                                <th style="text-align: left; width: 160px; font-size: 9.5px; padding: 3px 6px;">Tipo Tráfico</th>
                                <th style="text-align: center; width: 80px; font-size: 9.5px; padding: 3px 6px;">Nº viajes</th>
                                <th style="text-align: right; width: 120px; font-size: 9.5px; padding: 3px 6px;">Volumen TM</th>
                                <th style="text-align: center; width: 80px; font-size: 9.5px; padding: 3px 6px;">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">Viajes cabotaje</td>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: bold;">${mec.cabotageTrips}</td>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace;">${mec.cabotageVolumeTm.toLocaleString('en-US')}</td>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: 700; color: #0369a1;">${mec.cabotageSharePct.toFixed(2)}%</td>
                            </tr>
                            <tr>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #334155;">Viajes exportación</td>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: bold;">${mec.exportTrips}</td>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace;">${mec.exportVolumeTm.toLocaleString('en-US')}</td>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace; font-weight: 700; color: #0369a1;">${mec.exportSharePct.toFixed(2)}%</td>
                            </tr>
                            <tr class="total-row" style="background: #f8fafc; font-weight: 800;">
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1;">Total</td>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">${mec.totalTrips}</td>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace;">${mec.totalVolumeTm.toLocaleString('en-US')}</td>
                                <td style="padding: 3px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">100.00%</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- TABLA 2: MATRIZ DE RUTAS / PUERTOS -->
                    <table style="width: 100%; margin-bottom: 0;">
                        <thead>
                            <tr style="background: #f1f5f9;">
                                <th style="text-align: left; font-size: 9.5px; padding: 4px 6px;">Puertos / Ruta</th>
                                <th style="text-align: right; font-size: 9.5px; padding: 4px 6px;">TM Anual</th>
                                <th style="text-align: right; font-size: 9.5px; padding: 4px 6px;">Full load</th>
                                <th style="text-align: center; font-size: 9.5px; padding: 4px 6px;">Nº viajes</th>
                                <th style="text-align: right; font-size: 9.5px; padding: 4px 6px;">P/L</th>
                                <th style="text-align: right; font-size: 9.5px; padding: 4px 6px;">Total Margen Operativo</th>
                                <th style="text-align: center; font-size: 9.5px; padding: 4px 6px;">%</th>
                                <th style="text-align: center; font-size: 9.5px; padding: 4px 6px;">Dias ocupación</th>
                                <th style="text-align: center; font-size: 9.5px; padding: 4px 6px;">Dias disponibles</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${routesHtml}
                            <tr class="total-row" style="background: #f8fafc; font-weight: 800; border-top: 2px solid #94a3b8;">
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1;">Total</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace;">${mec.totalVolumeTm.toLocaleString('en-US')}</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: right;">-</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">${mec.totalTrips}</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: right;">-</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: right; font-family: 'Courier New', monospace; color: #047857;">$${Math.round(mec.totalGrossMargin).toLocaleString('en-US')}</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">100.00%</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">${Math.round(mec.totalDaysOccupation)}</td>
                                <td style="padding: 4px 8px; border: 1px solid #cbd5e1; text-align: center; font-family: 'Courier New', monospace;">${Math.round(mec.totalDaysAvailable)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <title>PETRAL_INFORME_CONSOLIDADO_MULTI_ESCENARIO</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 8mm 8mm 8mm 8mm;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                        color: #1e293b;
                        background: #f8fafc;
                        margin: 0;
                        padding: 15px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        font-size: 10px;
                    }
                    .no-print {
                        position: fixed;
                        top: 15px;
                        right: 20px;
                        z-index: 9999;
                        display: flex;
                        gap: 10px;
                        background: rgba(15, 23, 42, 0.9);
                        padding: 8px 16px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }
                    .btn-action {
                        background: #2563eb;
                        color: #fff;
                        border: none;
                        padding: 7px 14px;
                        border-radius: 6px;
                        font-weight: bold;
                        font-size: 12px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .btn-secondary {
                        background: #475569;
                    }
                    .page-container {
                        max-width: 900px;
                        margin: 0 auto;
                        background: #ffffff;
                        padding: 16px 20px;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        border: 1px solid #e2e8f0;
                    }
                    .header-main-title {
                        text-align: center;
                        font-size: 13px;
                        font-weight: 800;
                        color: #0f172a;
                        margin: 0 0 12px 0;
                        text-decoration: underline;
                        letter-spacing: 0.3px;
                    }
                    .premisas-box {
                        border: 1px solid #94a3b8;
                        background: #ffffff;
                        padding: 8px 12px;
                        margin-bottom: 16px;
                        border-radius: 4px;
                        font-size: 9.5px;
                        line-height: 1.4;
                        color: #334155;
                    }
                    .premisas-title {
                        font-weight: bold;
                        text-decoration: underline;
                        margin-bottom: 4px;
                        color: #0f172a;
                    }
                    table {
                        border-collapse: collapse;
                        font-size: 9.5px;
                    }
                    th {
                        border: 1px solid #cbd5e1;
                        font-weight: bold;
                    }
                    .footer-box {
                        margin-top: 20px;
                        padding-top: 8px;
                        border-top: 1px solid #cbd5e1;
                        font-size: 9px;
                        color: #64748b;
                        display: flex;
                        justify-content: space-between;
                    }
                    @media print {
                        .no-print { display: none !important; }
                        body { background: #fff; padding: 0; }
                        .page-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print">
                    <button class="btn-action" id="btn-download-pdf" onclick="downloadDirectPdf()">
                        <span>📥 Descargar PDF Consolidado (Foxit Ready)</span>
                    </button>
                    <button class="btn-action btn-secondary" onclick="window.print()">
                        <span>🖨️ Imprimir / Guardar PDF</span>
                    </button>
                </div>

                <div class="page-container" id="pdf-content-page">
                    <div class="header-main-title">
                        Proyecciones Comerciales & Contratos Multianuales — NAVIERA PETRAL S.A.
                    </div>

                    <!-- CAJA DE PREMISAS -->
                    <div class="premisas-box">
                        <div class="premisas-title">Premisas:</div>
                        ${premisasNotes.split('\n').map(line => `<div>${line}</div>`).join('')}
                    </div>

                    <!-- SECCIONES DE ESCENARIOS APILADAS 1:1 -->
                    ${sectionsHtml}

                    <!-- FOOTER -->
                    <div class="footer-box">
                        <div>Fecha: ${new Date().toLocaleDateString('es-PE')}</div>
                        <div>Elaborado por: Área Comercial & Operaciones / NAVIERA PETRAL S.A.</div>
                    </div>
                </div>

                <script>
                    function downloadDirectPdf() {
                        const btn = document.getElementById('btn-download-pdf');
                        if (btn) {
                            btn.innerText = '⏳ Generando PDF...';
                            btn.disabled = true;
                        }
                        const element = document.getElementById('pdf-content-page');
                        const opt = {
                            margin: [6, 6, 6, 6],
                            filename: 'PETRAL_INFORME_CONSOLIDADO_MULTI_ESCENARIO.pdf',
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
                            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                        };
                        
                        if (window.html2pdf) {
                            window.html2pdf().set(opt).from(element).save().then(function() {
                                if (btn) {
                                    btn.innerText = '📥 Descargar PDF Consolidado (Foxit Ready)';
                                    btn.disabled = false;
                                }
                            }).catch(function(err) {
                                console.error('Error al generar PDF directo:', err);
                                if (btn) {
                                    btn.innerText = '📥 Descargar PDF Consolidado (Foxit Ready)';
                                    btn.disabled = false;
                                }
                            });
                        } else {
                            window.print();
                            if (btn) {
                                btn.innerText = '📥 Descargar PDF Consolidado (Foxit Ready)';
                                btn.disabled = false;
                            }
                        }
                    }
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
            <div className="space-y-6 pb-16">
                
                {/* BLOQUE 1: CATÁLOGO DE ESCENARIOS POR AÑO Y AUTOR */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    
                    {/* CABECERA: TÍTULO Y PESTAÑAS DE AUTORES */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
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

                    {/* CONTENIDO DEL ACORDEÓN POR AÑO */}
                    <div className="p-6 bg-slate-100/60 space-y-4">
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
                                                const isExpanded = Boolean(expandedScenarios[scenario.id]);
                                                const mec = scenario.mec;

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
                                                                            <CheckCircle2 size={10} /> FORMATO MEC
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
                                                                    {isExpanded ? '▲ Ocultar Formato MEC' : '▼ Ver Formato MEC'}
                                                                </span>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteScenario(scenario);
                                                                    }}
                                                                    className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm ml-1"
                                                                    title="Eliminar este escenario"
                                                                >
                                                                    <Trash2 size={13} />
                                                                    <span>Eliminar</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* CUADROS 1:1 IGUALES AL EXCEL FORMATO.MEC.BUDGETS.2026.xlsx */}
                                                        {isExpanded && (
                                                            <div className="p-6 bg-white border-t border-slate-200 space-y-6">
                                                                
                                                                {/* BARRA SUPERIOR CON BOTONES DE DESCARGA */}
                                                                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                                                    <div className="text-sm font-black text-slate-800 tracking-wide">
                                                                        Año {scenario.year} - Proyectado
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleExportMecExcel(scenario)}
                                                                            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors cursor-pointer shadow-xs"
                                                                            title="Descargar en Excel formato oficial MEC"
                                                                        >
                                                                            <FileSpreadsheet size={14} />
                                                                            <span>Descargar Excel (.xlsx)</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleExportMecPDF(scenario)}
                                                                            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors cursor-pointer shadow-xs"
                                                                            title="Descargar o Imprimir en PDF formato MEC"
                                                                        >
                                                                            <Printer size={14} />
                                                                            <span>Descargar PDF</span>
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* TABLA 1: CABOTAJE VS EXPORTACION (IGUAL AL EXCEL) */}
                                                                <div className="overflow-x-auto max-w-xl">
                                                                    <table className="w-full text-xs text-left border-collapse border border-slate-300">
                                                                        <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                                                                            <tr>
                                                                                <th className="py-1.5 px-3 border border-slate-300"></th>
                                                                                <th className="py-1.5 px-3 text-center border border-slate-300">Nº viajes</th>
                                                                                <th className="py-1.5 px-3 text-right border border-slate-300">Volumen TM</th>
                                                                                <th className="py-1.5 px-3 text-center border border-slate-300">%</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                                                                            <tr>
                                                                                <td className="py-1.5 px-3 font-sans font-bold text-slate-800 border border-slate-300">Viajes cabotaje</td>
                                                                                <td className="py-1.5 px-3 text-center border border-slate-300 text-slate-800">{mec.cabotageTrips}</td>
                                                                                <td className="py-1.5 px-3 text-right border border-slate-300 text-slate-800">{mec.cabotageVolumeTm.toLocaleString('en-US')}</td>
                                                                                <td className="py-1.5 px-3 text-center border border-slate-300 font-bold text-blue-900">{mec.cabotageSharePct.toFixed(2)}%</td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td className="py-1.5 px-3 font-sans font-bold text-slate-800 border border-slate-300">Viajes exportación</td>
                                                                                <td className="py-1.5 px-3 text-center border border-slate-300 text-slate-800">{mec.exportTrips}</td>
                                                                                <td className="py-1.5 px-3 text-right border border-slate-300 text-slate-800">{mec.exportVolumeTm.toLocaleString('en-US')}</td>
                                                                                <td className="py-1.5 px-3 text-center border border-slate-300 font-bold text-blue-900">{mec.exportSharePct.toFixed(2)}%</td>
                                                                            </tr>
                                                                            <tr className="bg-slate-100 font-bold">
                                                                                <td className="py-1.5 px-3 font-sans border border-slate-300 text-slate-900">Total</td>
                                                                                <td className="py-1.5 px-3 text-center border border-slate-300 text-slate-900">{mec.totalTrips}</td>
                                                                                <td className="py-1.5 px-3 text-right border border-slate-300 text-slate-900">{mec.totalVolumeTm.toLocaleString('en-US')}</td>
                                                                                <td className="py-1.5 px-3 text-center border border-slate-300 text-slate-900 font-black">100.00%</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                {/* TABLA 2: MATRIZ DE RUTAS (COLUMNAS EXACTAS DEL EXCEL 1:1) */}
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-xs text-left border-collapse border border-slate-300">
                                                                        <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                                                                            <tr>
                                                                                <th className="py-2 px-3 border border-slate-300">Ruta</th>
                                                                                <th className="py-2 px-3 text-right border border-slate-300">TM Anual</th>
                                                                                <th className="py-2 px-3 text-right border border-slate-300">Full load</th>
                                                                                <th className="py-2 px-3 text-center border border-slate-300">Nº viajes</th>
                                                                                <th className="py-2 px-3 text-right border border-slate-300">P/L x Viaje</th>
                                                                                <th className="py-2 px-3 text-right border border-slate-300">Total Gross Margin</th>
                                                                                <th className="py-2 px-3 text-center border border-slate-300">%</th>
                                                                                <th className="py-2 px-3 text-center border border-slate-300">Dias ocupación</th>
                                                                                <th className="py-2 px-3 text-center border border-slate-300">Dias disponibles</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                                                                            {mec.routes.map((r, idx) => (
                                                                                <tr key={idx} className="hover:bg-slate-50">
                                                                                    <td className="py-1.5 px-3 font-sans font-semibold text-slate-900 border border-slate-300">
                                                                                        {r.route}
                                                                                    </td>
                                                                                    <td className="py-1.5 px-3 text-right border border-slate-300 text-slate-800">
                                                                                        {r.annualTons.toLocaleString('en-US')}
                                                                                    </td>
                                                                                    <td className="py-1.5 px-3 text-right border border-slate-300 text-slate-800">
                                                                                        {Math.round(r.fullLoad).toLocaleString('en-US')}
                                                                                    </td>
                                                                                    <td className="py-1.5 px-3 text-center border border-slate-300 text-slate-800 font-bold">
                                                                                        {r.annualTrips}
                                                                                    </td>
                                                                                    <td className="py-1.5 px-3 text-right border border-slate-300 text-slate-800">
                                                                                        ${Math.round(r.pnlPerTrip).toLocaleString('en-US')}
                                                                                    </td>
                                                                                    <td className="py-1.5 px-3 text-right border border-slate-300 text-slate-800 font-bold">
                                                                                        ${Math.round(r.totalGrossMargin).toLocaleString('en-US')}
                                                                                    </td>
                                                                                    <td className="py-1.5 px-3 text-center border border-slate-300 font-semibold text-blue-900">
                                                                                        {r.volumeSharePct.toFixed(2)}%
                                                                                    </td>
                                                                                    <td className="py-1.5 px-3 text-center border border-slate-300 text-slate-800 font-bold">
                                                                                        {Math.round(r.daysOccupation)}
                                                                                    </td>
                                                                                    <td className="py-1.5 px-3 text-center border border-slate-300 text-slate-400">
                                                                                        -
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                            <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                                                                                <td className="py-2 px-3 font-sans border border-slate-300">Total</td>
                                                                                <td className="py-2 px-3 text-right border border-slate-300">{mec.totalVolumeTm.toLocaleString('en-US')}</td>
                                                                                <td className="py-2 px-3 text-right border border-slate-300">-</td>
                                                                                <td className="py-2 px-3 text-center border border-slate-300">{mec.totalTrips}</td>
                                                                                <td className="py-2 px-3 text-right border border-slate-300">-</td>
                                                                                <td className="py-2 px-3 text-right border border-slate-300 text-emerald-800">${Math.round(mec.totalGrossMargin).toLocaleString('en-US')}</td>
                                                                                <td className="py-2 px-3 text-center border border-slate-300 font-black">100.00%</td>
                                                                                <td className="py-2 px-3 text-center border border-slate-300">{Math.round(mec.totalDaysOccupation)}</td>
                                                                                <td className="py-2 px-3 text-center border border-slate-300">{Math.round(mec.totalDaysAvailable)}</td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
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

            {/* ========================================================================= */}
            {/* BLOQUE 2: INFORME MULTI-ESCENARIO CONSOLIDADO (FORMATO MEC CONSOLIDADO)   */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-6 space-y-6">
                
                {/* CABECERA Y BARRA DE CONTROL DEL INFORME CONSOLIDADO */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <BookOpen size={20} className="text-indigo-600" />
                                INFORME EJECUTIVO MULTI-ESCENARIO (FORMATO MEC CONSOLIDADO)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Consolida y apila varios escenarios anuales en un solo reporte ejecutivo para visualización continua y exportación Foxit Ready.
                            </p>
                        </div>

                        {/* BOTONES DE EXPORTACIÓN CONSOLIDADA */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => handleExportMultiMecExcel(multiSelectedScenarios)}
                                disabled={multiSelectedScenarios.length === 0}
                                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                                title="Descargar libro Excel con resumen consolidado y pestañas individuales"
                            >
                                <FileSpreadsheet size={15} />
                                <span>Descargar Excel Consolidado</span>
                            </button>

                            <button
                                onClick={() => handleExportMultiMecPDF(multiSelectedScenarios)}
                                disabled={multiSelectedScenarios.length === 0}
                                className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                                title="Generar e imprimir PDF de varias páginas o continuo Foxit Ready"
                            >
                                <Printer size={15} />
                                <span>Descargar PDF Consolidado (Foxit Ready)</span>
                            </button>
                        </div>
                    </div>

                    {/* BARRA DE FILTROS, SELECTORES Y AGREGADOR DE ESCENARIOS */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    <Filter size={14} className="text-slate-500" />
                                    Seleccionar Escenario:
                                </span>

                                <select
                                    value={scenarioToAddId}
                                    onChange={(e) => setScenarioToAddId(e.target.value)}
                                    className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 min-w-[240px]"
                                >
                                    {processedScenarios.map(sc => (
                                        <option key={sc.id} value={sc.id}>
                                            Año {sc.year} — {sc.name} ({sc.userId})
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={handleAddMultiScenario}
                                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                                >
                                    <Plus size={14} />
                                    <span>Agregar al Informe</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSelectAllMultiScenarios}
                                    className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-blue-200"
                                >
                                    🔄 Seleccionar Todos ({processedScenarios.length})
                                </button>
                                <button
                                    onClick={handleClearMultiScenarios}
                                    className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-rose-200"
                                >
                                    🗑️ Limpiar Lista
                                </button>
                            </div>
                        </div>

                        {/* CHIPS / ETIQUETAS DE ESCENARIOS ACTIVOS EN EL INFORME */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500">Escenarios en el reporte ({multiSelectedScenarios.length}):</span>
                            {multiSelectedScenarios.length === 0 ? (
                                <span className="text-xs text-slate-400 italic">Ningún escenario seleccionado. Selecciona uno en el desplegable y haz clic en "Agregar al Informe".</span>
                            ) : (
                                multiSelectedScenarios.map((sc, idx) => {
                                    const theme = scenarioThemeColors[idx % scenarioThemeColors.length];
                                    return (
                                        <span 
                                            key={sc.id}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${theme.tag}`}
                                        >
                                            <span>Año {sc.year} — {sc.name}</span>
                                            <button
                                                onClick={() => handleRemoveMultiScenario(sc.id)}
                                                className="hover:bg-black/10 rounded-full p-0.5 transition-colors cursor-pointer"
                                                title="Quitar este escenario del informe"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* CAJA EDITABLE DE PREMISAS */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Sparkles size={14} className="text-amber-500" />
                                Premisas del Informe (Editables para impresión):
                            </span>
                            <span className="text-[11px] font-normal text-slate-400">Estas notas se imprimirán en el encabezado del PDF y Excel</span>
                        </label>
                        <textarea
                            value={premisasNotes}
                            onChange={(e) => setPremisasNotes(e.target.value)}
                            rows={3}
                            className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            placeholder="Escribe aquí las premisas del informe..."
                        />
                    </div>

                    {/* LIENZO DE VISTA PREVIA DEL INFORME CONSOLIDADO (IDÉNTICO A LA REFERENCIA) */}
                    <div className="bg-white rounded-xl border border-slate-300 shadow-md p-8 space-y-8 max-w-5xl mx-auto">
                        
                        {/* ENCABEZADO PRINCIPAL */}
                        <div className="text-center pb-4 border-b border-slate-200">
                            <h2 className="text-base font-extrabold text-slate-900 tracking-tight underline">
                                Proyecciones Comerciales & Contratos Multianuales — NAVIERA PETRAL S.A.
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Informe Ejecutivo Consolidado de Formatos MEC por Escenario y Año
                            </p>
                        </div>

                        {/* BLOQUE DE PREMISAS VISUAL */}
                        <div className="border border-slate-400 rounded p-3 bg-slate-50/70 text-xs text-slate-800 space-y-1">
                            <div className="font-bold underline text-slate-900">Premisas:</div>
                            {premisasNotes.split('\n').map((line, lIdx) => (
                                <div key={lIdx} className="font-mono text-[11px] text-slate-700">{line}</div>
                            ))}
                        </div>

                        {/* SECCIONES APILADAS (UNA ENCIMA DE LA OTRA) */}
                        {multiSelectedScenarios.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 font-semibold text-sm">
                                <Layers size={40} className="mx-auto text-slate-300 mb-2" />
                                No hay escenarios seleccionados para visualizar. Agrega escenarios desde la barra superior.
                            </div>
                        ) : (
                            multiSelectedScenarios.map((scenario, sIdx) => {
                                const mec = scenario.mec;
                                const theme = scenarioThemeColors[sIdx % scenarioThemeColors.length];

                                return (
                                    <div key={scenario.id} className="space-y-4 pt-4 border-t-2 border-slate-300 first:border-t-0 first:pt-0">
                                        
                                        {/* TABLA 1: CABOTAJE VS EXPORTACIÓN CON CABECERA TEMÁTICA */}
                                        <div className="overflow-x-auto max-w-md">
                                            <table className="w-full text-xs text-left border-collapse border border-slate-300 shadow-2xs">
                                                <thead>
                                                    <tr>
                                                        <th 
                                                            colSpan={4} 
                                                            style={{ backgroundColor: theme.bgHeader, color: theme.textHeader }}
                                                            className="py-1.5 px-3 text-center font-extrabold text-xs border border-slate-300 tracking-wide"
                                                        >
                                                            Año {scenario.year} — {scenario.name}
                                                        </th>
                                                    </tr>
                                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                                                        <th className="py-1 px-2.5 border border-slate-300">Tipo Tráfico</th>
                                                        <th className="py-1 px-2.5 text-center border border-slate-300">Nº viajes</th>
                                                        <th className="py-1 px-2.5 text-right border border-slate-300">Volumen TM</th>
                                                        <th className="py-1 px-2.5 text-center border border-slate-300">%</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                                                    <tr>
                                                        <td className="py-1 px-2.5 font-sans font-semibold text-slate-800 border border-slate-300">Viajes cabotaje</td>
                                                        <td className="py-1 px-2.5 text-center border border-slate-300 text-slate-800">{mec.cabotageTrips}</td>
                                                        <td className="py-1 px-2.5 text-right border border-slate-300 text-slate-800">{mec.cabotageVolumeTm.toLocaleString('en-US')}</td>
                                                        <td className="py-1 px-2.5 text-center border border-slate-300 font-bold text-blue-900">{mec.cabotageSharePct.toFixed(2)}%</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-1 px-2.5 font-sans font-semibold text-slate-800 border border-slate-300">Viajes exportación</td>
                                                        <td className="py-1 px-2.5 text-center border border-slate-300 text-slate-800">{mec.exportTrips}</td>
                                                        <td className="py-1 px-2.5 text-right border border-slate-300 text-slate-800">{mec.exportVolumeTm.toLocaleString('en-US')}</td>
                                                        <td className="py-1 px-2.5 text-center border border-slate-300 font-bold text-blue-900">{mec.exportSharePct.toFixed(2)}%</td>
                                                    </tr>
                                                    <tr className="bg-slate-100 font-bold">
                                                        <td className="py-1 px-2.5 font-sans border border-slate-300 text-slate-900">Total</td>
                                                        <td className="py-1 px-2.5 text-center border border-slate-300 text-slate-900">{mec.totalTrips}</td>
                                                        <td className="py-1 px-2.5 text-right border border-slate-300 text-slate-900">{mec.totalVolumeTm.toLocaleString('en-US')}</td>
                                                        <td className="py-1 px-2.5 text-center border border-slate-300 text-slate-900 font-black">100.00%</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* TABLA 2: MATRIZ DE RUTAS / PUERTOS */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left border-collapse border border-slate-300 shadow-2xs">
                                                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                                                    <tr>
                                                        <th className="py-1.5 px-2.5 border border-slate-300">Puertos / Ruta</th>
                                                        <th className="py-1.5 px-2.5 text-right border border-slate-300">TM Anual</th>
                                                        <th className="py-1.5 px-2.5 text-right border border-slate-300">Full load</th>
                                                        <th className="py-1.5 px-2.5 text-center border border-slate-300">Nº viajes</th>
                                                        <th className="py-1.5 px-2.5 text-right border border-slate-300">P/L</th>
                                                        <th className="py-1.5 px-2.5 text-right border border-slate-300">Total Margen Operativo</th>
                                                        <th className="py-1.5 px-2.5 text-center border border-slate-300">%</th>
                                                        <th className="py-1.5 px-2.5 text-center border border-slate-300">Dias ocupación</th>
                                                        <th className="py-1.5 px-2.5 text-center border border-slate-300">Dias disponibles</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                                                    {mec.routes.map((r, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50">
                                                            <td className="py-1 px-2.5 font-sans font-semibold text-slate-900 border border-slate-300">
                                                                {r.route}
                                                            </td>
                                                            <td className="py-1 px-2.5 text-right border border-slate-300 text-slate-800">
                                                                {r.annualTons.toLocaleString('en-US')}
                                                            </td>
                                                            <td className="py-1 px-2.5 text-right border border-slate-300 text-slate-800">
                                                                {Math.round(r.fullLoad).toLocaleString('en-US')}
                                                            </td>
                                                            <td className="py-1 px-2.5 text-center border border-slate-300 text-slate-800 font-bold">
                                                                {r.annualTrips}
                                                            </td>
                                                            <td className="py-1 px-2.5 text-right border border-slate-300 text-slate-800">
                                                                ${Math.round(r.pnlPerTrip).toLocaleString('en-US')}
                                                            </td>
                                                            <td className="py-1 px-2.5 text-right border border-slate-300 text-slate-800 font-bold">
                                                                ${Math.round(r.totalGrossMargin).toLocaleString('en-US')}
                                                            </td>
                                                            <td className="py-1 px-2.5 text-center border border-slate-300 font-semibold text-blue-900">
                                                                {r.volumeSharePct.toFixed(2)}%
                                                            </td>
                                                            <td className="py-1 px-2.5 text-center border border-slate-300 text-slate-800 font-bold">
                                                                {Math.round(r.daysOccupation)}
                                                            </td>
                                                            <td className="py-1 px-2.5 text-center border border-slate-300 text-slate-400">
                                                                -
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                                                        <td className="py-1.5 px-2.5 font-sans border border-slate-300">Total</td>
                                                        <td className="py-1.5 px-2.5 text-right border border-slate-300">{mec.totalVolumeTm.toLocaleString('en-US')}</td>
                                                        <td className="py-1.5 px-2.5 text-right border border-slate-300">-</td>
                                                        <td className="py-1.5 px-2.5 text-center border border-slate-300">{mec.totalTrips}</td>
                                                        <td className="py-1.5 px-2.5 text-right border border-slate-300">-</td>
                                                        <td className="py-1.5 px-2.5 text-right border border-slate-300 text-emerald-800">${Math.round(mec.totalGrossMargin).toLocaleString('en-US')}</td>
                                                        <td className="py-1.5 px-2.5 text-center border border-slate-300 font-black">100.00%</td>
                                                        <td className="py-1.5 px-2.5 text-center border border-slate-300">{Math.round(mec.totalDaysOccupation)}</td>
                                                        <td className="py-1.5 px-2.5 text-center border border-slate-300">{Math.round(mec.totalDaysAvailable)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                    </div>
                                );
                            })
                        )}

                        {/* PIE DEL INFORME CON FECHA Y FIRMA */}
                        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                            <div>Fecha: <strong>{new Date().toLocaleDateString('es-PE')}</strong></div>
                            <div>Elaborado por: <strong>Área Comercial & Operaciones / NAVIERA PETRAL S.A.</strong></div>
                        </div>

                    </div>

                </div>

            </div>
        </MasterTemplate>
    );
};
