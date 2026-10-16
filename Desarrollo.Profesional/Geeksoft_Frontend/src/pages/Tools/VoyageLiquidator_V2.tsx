import React, { useState, useEffect, useMemo } from 'react';
import { VoyageLiquidatorHeader } from '../../components/VoyageLiquidator/VoyageLiquidatorHeader';
import { VoyageLiquidatorBunkerBadge } from '../../components/VoyageLiquidator/VoyageLiquidatorBunkerBadge';
import { VoyageLiquidatorGrid } from '../../components/VoyageLiquidator/VoyageLiquidatorGrid';
import { VoyageLiquidatorSummaryBar } from '../../components/VoyageLiquidator/VoyageLiquidatorSummaryBar';
import { VoyageLiquidatorHistoryModal } from '../../components/VoyageLiquidator/VoyageLiquidatorHistoryModal';
import { VoyageLiquidatorSaveModal } from '../../components/VoyageLiquidator/VoyageLiquidatorSaveModal';
import { voyageLiquidatorService } from '../../services/voyageLiquidatorService';
import type { 
    VoyageLegExecution, 
    BunkerActiveSnapshot, 
    VoyageLiquidationRecord 
} from '../../types/voyageLiquidator';

export const VoyageLiquidator_V2: React.FC = () => {
    // 1. Estados Principales del Viaje
    const [selectedVessel, setSelectedVessel] = useState<string>('MOQUEGUA');
    const [voyageCode, setVoyageCode] = useState<string>('V.763');
    const [clientName, setClientName] = useState<string>('SPCC');
    const [voyageDate, setVoyageDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [hireDailyRate, setHireDailyRate] = useState<number>(13000);

    // 2. Snapshot de Búnker (Enlace automático con Bunker Bootstrapping)
    const [bunkerSnapshot, setBunkerSnapshot] = useState<BunkerActiveSnapshot>({
        vessel_id: 'MOQUEGUA',
        event_id: 'default',
        event_code: 'BASE',
        event_date: '2026-10-15',
        price_ifo_usd: 911.90,
        price_mdo_usd: 1571.65,
        baf_factor: 0.9669,
        baf_variation_usd: -0.1380,
        supports_mdo: true,
        is_live: true
    });
    const [loadingBunker, setLoadingBunker] = useState<boolean>(false);

    // 3. Tramos / Recaladas del Viaje
    const [legs, setLegs] = useState<VoyageLegExecution[]>([
        {
            id: 'leg-0',
            leg_index: 0,
            port_id: 'ILO',
            arrival_datetime: '2026-10-01T08:00',
            departure_datetime: '2026-10-02T14:00',
            operation: 'CARGAR',
            cargo_quantity_mt: 10252.00,
            freight_rate_usd: 0,
            ifo_consumed_mt: 2.0,
            mdo_consumed_mt: 0.5,
            port_expenses_usd: 26000.00,
            other_expenses_usd: 1200.00,
            other_expenses_desc: 'Lancha Surveyor P&I'
        },
        {
            id: 'leg-1',
            leg_index: 1,
            port_id: 'MATARANI',
            arrival_datetime: '2026-10-03T06:00',
            departure_datetime: '2026-10-04T20:00',
            operation: 'DESCARGAR',
            cargo_quantity_mt: 10252.00,
            freight_rate_usd: 19.23,
            ifo_consumed_mt: 8.5,
            mdo_consumed_mt: 1.2,
            port_expenses_usd: 25598.00,
            other_expenses_usd: 0,
            other_expenses_desc: ''
        },
        {
            id: 'leg-2',
            leg_index: 2,
            port_id: 'ILO',
            arrival_datetime: '2026-10-05T12:00',
            departure_datetime: '2026-10-05T18:00',
            operation: 'NONE',
            cargo_quantity_mt: 0,
            freight_rate_usd: 0,
            ifo_consumed_mt: 2.5,
            mdo_consumed_mt: 0.3,
            port_expenses_usd: 0,
            other_expenses_usd: 0,
            other_expenses_desc: ''
        }
    ]);

    // 4. Estados de Modales y Guardado
    const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    // Cargar snapshot de búnker cuando cambie el buque
    useEffect(() => {
        let mounted = true;
        const loadBunker = async () => {
            setLoadingBunker(true);
            try {
                const snapshot = await voyageLiquidatorService.getBunkerSnapshot(selectedVessel);
                if (mounted) {
                    setBunkerSnapshot(snapshot);
                }
            } catch (err) {
                console.error("Error al cargar búnker snapshot:", err);
            } finally {
                if (mounted) setLoadingBunker(false);
            }
        };
        loadBunker();
        return () => { mounted = false; };
    }, [selectedVessel]);

    // Cálculo determinístico en caliente
    const summary = useMemo(() => {
        return voyageLiquidatorService.computeLiquidationSummary(legs, bunkerSnapshot, hireDailyRate);
    }, [legs, bunkerSnapshot, hireDailyRate]);

    // Handlers de Tramos
    const handleUpdateLeg = (index: number, updated: Partial<VoyageLegExecution>) => {
        setLegs((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], ...updated };
            return copy;
        });
    };

    const handleAddLeg = () => {
        setLegs((prev) => {
            const nextIdx = prev.length;
            const lastLeg = prev[prev.length - 1];
            const defaultDate = lastLeg?.departure_datetime || new Date().toISOString().slice(0, 16);

            return [
                ...prev,
                {
                    id: `leg-${Date.now()}-${nextIdx}`,
                    leg_index: nextIdx,
                    port_id: 'CALLAO',
                    arrival_datetime: defaultDate,
                    departure_datetime: defaultDate,
                    operation: 'NONE',
                    cargo_quantity_mt: 0,
                    freight_rate_usd: 0,
                    ifo_consumed_mt: 0,
                    mdo_consumed_mt: 0,
                    port_expenses_usd: 0,
                    other_expenses_usd: 0,
                    other_expenses_desc: ''
                }
            ];
        });
    };

    const handleRemoveLeg = (index: number) => {
        setLegs((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleNewLiquidation = () => {
        if (window.confirm("¿Deseas iniciar una nueva liquidación? Se restablecerán los campos de la grilla.")) {
            setVoyageCode(`V.${Math.floor(100 + Math.random() * 900)}`);
            setLegs([
                {
                    id: 'leg-0',
                    leg_index: 0,
                    port_id: 'ILO',
                    arrival_datetime: new Date().toISOString().slice(0, 10) + 'T08:00',
                    departure_datetime: new Date().toISOString().slice(0, 10) + 'T14:00',
                    operation: 'CARGAR',
                    cargo_quantity_mt: 0,
                    freight_rate_usd: 0,
                    ifo_consumed_mt: 0,
                    mdo_consumed_mt: 0,
                    port_expenses_usd: 0,
                    other_expenses_usd: 0,
                    other_expenses_desc: ''
                },
                {
                    id: 'leg-1',
                    leg_index: 1,
                    port_id: 'CALLAO',
                    arrival_datetime: new Date().toISOString().slice(0, 10) + 'T06:00',
                    departure_datetime: new Date().toISOString().slice(0, 10) + 'T18:00',
                    operation: 'DESCARGAR',
                    cargo_quantity_mt: 0,
                    freight_rate_usd: 0,
                    ifo_consumed_mt: 0,
                    mdo_consumed_mt: 0,
                    port_expenses_usd: 0,
                    other_expenses_usd: 0,
                    other_expenses_desc: ''
                }
            ]);
        }
    };

    const handleLoadVoyage = (record: VoyageLiquidationRecord) => {
        setVoyageCode(record.voyage_code);
        setSelectedVessel(record.vessel_name.toUpperCase().replace('B/T ', '').trim() || 'MOQUEGUA');
        setClientName(record.client_name);
        setVoyageDate(record.voyage_date);

        // Si contiene itinerario granular en details
        if (record.details?.itinerary && record.details.itinerary.length > 0) {
            const mappedLegs: VoyageLegExecution[] = record.details.itinerary.map((it, idx) => ({
                id: `loaded-leg-${idx}`,
                leg_index: it.leg,
                port_id: it.port,
                arrival_datetime: it.arrival_datetime ? it.arrival_datetime.replace(' ', 'T') : '',
                departure_datetime: it.departure_datetime ? it.departure_datetime.replace(' ', 'T') : '',
                operation: (it.operation as any) || (idx === 0 ? 'CARGAR' : (idx === record.details.itinerary.length - 1 ? 'NONE' : 'DESCARGAR')),
                cargo_quantity_mt: Number(it.cargo_quantity_mt) || 0,
                freight_rate_usd: Number(it.freight_rate_usd) || Number(record.freight_rate_usd) || 0,
                ifo_consumed_mt: Number(it.ifo_consumed_mt) || 0,
                mdo_consumed_mt: Number(it.mdo_consumed_mt) || 0,
                port_expenses_usd: Number(it.port_expenses_usd) || 0,
                other_expenses_usd: Number(it.other_expenses_usd) || 0,
                other_expenses_desc: it.other_expenses_desc || ''
            }));
            setLegs(mappedLegs);
        }
    };

    const handleConfirmSave = async (operator: string, notes: string) => {
        setSaving(true);
        try {
            const polPort = legs[0]?.port_id || 'ILO';
            const podPort = legs.find(l => l.operation === 'DESCARGAR')?.port_id || legs[legs.length - 1]?.port_id || 'CALLAO';
            const stops = legs.map(l => l.port_id);

            const payload: VoyageLiquidationRecord = {
                voyage_code: voyageCode.trim().toUpperCase(),
                vessel_name: selectedVessel,
                client_name: clientName,
                voyage_date: voyageDate,
                operator,
                pol_port: polPort,
                pod_port: podPort,
                stops,
                cargo_quantity_mt: summary.total_cargo_mt,
                freight_rate_usd: legs.find(l => l.operation === 'DESCARGAR')?.freight_rate_usd || 0,
                gross_revenue_usd: summary.gross_freight_usd,
                tce_usd_day: summary.tce_actual_usd_day,
                tce_req_usd_day: hireDailyRate,
                pcm_usd: summary.net_voyage_revenue_usd,
                net_profit_usd: summary.net_profit_usd,
                details: {
                    itinerary: legs.map((l, i) => {
                        const prevL = i > 0 ? legs[i - 1] : null;
                        const portHrs = voyageLiquidatorService.diffHours(l.arrival_datetime, l.departure_datetime);
                        const sailingHrs = prevL ? voyageLiquidatorService.diffHours(prevL.departure_datetime, l.arrival_datetime) : 0;
                        return {
                            leg: l.leg_index,
                            port: l.port_id,
                            arrival_datetime: l.arrival_datetime.replace('T', ' '),
                            departure_datetime: l.departure_datetime.replace('T', ' '),
                            operation: l.operation,
                            cargo_quantity_mt: l.cargo_quantity_mt,
                            freight_rate_usd: l.freight_rate_usd,
                            port_expenses_usd: l.port_expenses_usd,
                            other_expenses_usd: l.other_expenses_usd,
                            other_expenses_desc: l.other_expenses_desc,
                            ifo_consumed_mt: l.ifo_consumed_mt,
                            mdo_consumed_mt: l.mdo_consumed_mt,
                            port_days: portHrs / 24,
                            sailing_days: sailingHrs / 24
                        };
                    }),
                    bunker_consumption: {
                        ifo_mt: summary.total_ifo_consumed_mt,
                        mdo_mt: summary.total_mdo_consumed_mt,
                        ifo_price_usd: bunkerSnapshot.price_ifo_usd,
                        mdo_price_usd: bunkerSnapshot.price_mdo_usd,
                        total_bunker_usd: summary.total_bunker_usd,
                        bunker_event_id: bunkerSnapshot.event_id,
                        bunker_event_code: bunkerSnapshot.event_code
                    },
                    financial_summary: {
                        gross_revenue_usd: summary.gross_freight_usd,
                        bunker_cost_usd: summary.total_bunker_usd,
                        port_expenses_usd: summary.total_port_expenses_usd,
                        other_expenses_usd: summary.total_other_expenses_usd,
                        total_direct_costs_usd: summary.total_direct_costs_usd,
                        net_voyage_revenue_usd: summary.net_voyage_revenue_usd,
                        total_voyage_days: summary.total_voyage_days,
                        tce_actual_usd_day: summary.tce_actual_usd_day,
                        net_profit_usd: summary.net_profit_usd
                    }
                }
            };

            await voyageLiquidatorService.saveLiquidation(payload);
            setIsSaveModalOpen(false);
            alert(`¡Liquidación ${voyageCode} guardada exitosamente en la base de datos oficial!`);
        } catch (err: any) {
            console.error("Error al guardar liquidación:", err);
            alert(`Error al guardar liquidación: ${err?.message || 'Error desconocido'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="flex flex-col flex-1 gap-4 relative animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-full">
            {/* 1. Header con Filtros de Nave, Cliente y Acciones */}
            <VoyageLiquidatorHeader
                selectedVessel={selectedVessel}
                onSelectVessel={setSelectedVessel}
                voyageCode={voyageCode}
                onVoyageCodeChange={setVoyageCode}
                clientName={clientName}
                onClientNameChange={setClientName}
                voyageDate={voyageDate}
                onVoyageDateChange={setVoyageDate}
                onNewLiquidation={handleNewLiquidation}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onSaveLiquidation={() => setIsSaveModalOpen(true)}
                saving={saving}
            />

            {/* 2. Badge de Enlace en Caliente con Bunker Bootstrapping */}
            <VoyageLiquidatorBunkerBadge
                snapshot={bunkerSnapshot}
                loading={loadingBunker}
            />

            {/* 3. Grilla de Liquidación Tipo Spreadsheet (Columnas A a T) */}
            <VoyageLiquidatorGrid
                legs={legs}
                onUpdateLeg={handleUpdateLeg}
                onAddLeg={handleAddLeg}
                onRemoveLeg={handleRemoveLeg}
                bunker={bunkerSnapshot}
            />

            {/* 4. Resumen Ejecutivo (Fila Total Azul / P&L y TCE Real) */}
            <VoyageLiquidatorSummaryBar
                summary={summary}
                hireDailyRate={hireDailyRate}
                onHireDailyRateChange={setHireDailyRate}
            />

            {/* 5. Modales Modulares */}
            <VoyageLiquidatorHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                onLoadVoyage={handleLoadVoyage}
                currentVesselId={selectedVessel}
            />

            <VoyageLiquidatorSaveModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onConfirmSave={handleConfirmSave}
                voyageCode={voyageCode}
                vesselName={selectedVessel}
                clientName={clientName}
                voyageDate={voyageDate}
                summary={summary}
                saving={saving}
            />
        </section>
    );
};
