/**
 * ==============================================================================
 * Servicio de Negocio y Motor Determínico de Voyage Liquidator
 * PETRAL ONE - Enterprise Shipping Soft
 * ==============================================================================
 */

import { api } from './api';
import { BunkerBootstrappingService, getVesselFuelConfig } from './bunkerBootstrappingService';
import type { 
    VoyageLegExecution, 
    BunkerActiveSnapshot, 
    VoyageLiquidationCalculatedSummary, 
    VoyageLiquidationRecord 
} from '../types/voyageLiquidator';

export const voyageLiquidatorService = {
    /**
     * Recupera el snapshot activo del último precio promedio ponderado de combustible
     * y polinomio BAF para la nave seleccionada desde Bunker Bootstrapping.
     */
    async getBunkerSnapshot(vesselId: string): Promise<BunkerActiveSnapshot> {
        const config = getVesselFuelConfig(vesselId);
        try {
            const events = await BunkerBootstrappingService.getEvents(vesselId);
            if (events && events.length > 0) {
                const latest = events[0];
                return {
                    vessel_id: vesselId,
                    event_id: latest.id,
                    event_code: latest.voyage_number || `TNK-${latest.event_date}-${latest.port_id}`,
                    event_date: latest.event_date,
                    price_ifo_usd: Number(latest.weighted_avg_ifo_usd) || 0,
                    price_mdo_usd: Number(latest.weighted_avg_mdo_usd) || 0,
                    baf_factor: Number(latest.spcc_baf_factor) || 1.0,
                    baf_variation_usd: Number(latest.spcc_baf_variation_usd) || 0,
                    supports_mdo: config.supportsMdo,
                    is_live: true
                };
            }
        } catch (err) {
            console.warn(`[voyageLiquidatorService] No se pudieron cargar eventos de búnker para ${vesselId}:`, err);
        }

        // Fallback contractual estándar si aún no tiene eventos registrados
        return {
            vessel_id: vesselId,
            event_id: 'default',
            event_code: 'BASE-CONTRATUAL',
            event_date: new Date().toISOString().slice(0, 10),
            price_ifo_usd: 967.26,
            price_mdo_usd: 1528.26,
            baf_factor: 1.0000,
            baf_variation_usd: 0.0000,
            supports_mdo: config.supportsMdo,
            is_live: false
        };
    },

    /**
     * Calcula la diferencia de horas y días decimales entre dos timestamps (YYYY-MM-DD HH:mm).
     */
    diffHours(startStr: string, endStr: string): number {
        if (!startStr || !endStr) return 0;
        const start = new Date(startStr.replace(' ', 'T')).getTime();
        const end = new Date(endStr.replace(' ', 'T')).getTime();
        if (isNaN(start) || isNaN(end) || end < start) return 0;
        return (end - start) / (1000 * 60 * 60);
    },

    /**
     * Motor determinístico de cálculo en caliente de la liquidación del viaje.
     */
    computeLiquidationSummary(
        legs: VoyageLegExecution[],
        bunker: BunkerActiveSnapshot,
        hireDailyRateUsd: number = 13000
    ): VoyageLiquidationCalculatedSummary {
        let totalCargo = 0;
        let grossFreight = 0;
        let totalIfoConsumed = 0;
        let totalMdoConsumed = 0;
        let totalPortExpenses = 0;
        let totalOtherExpenses = 0;
        let totalSailingHours = 0;
        let totalPortHours = 0;

        for (let i = 0; i < legs.length; i++) {
            const leg = legs[i];
            const prevLeg = i > 0 ? legs[i - 1] : null;

            // Días de Puerto: ATD actual - ATA actual
            const portHrs = this.diffHours(leg.arrival_datetime, leg.departure_datetime);
            totalPortHours += portHrs;

            // Días de Mar: ATA actual - ATD del puerto anterior
            if (prevLeg && prevLeg.departure_datetime && leg.arrival_datetime) {
                const sailingHrs = this.diffHours(prevLeg.departure_datetime, leg.arrival_datetime);
                totalSailingHours += sailingHrs;
            }

            // Ingreso de Flete
            if (leg.operation === 'DESCARGAR') {
                const q = Number(leg.cargo_quantity_mt) || 0;
                const f = Number(leg.freight_rate_usd) || 0;
                totalCargo += q;
                grossFreight += (q * f);
            } else if (leg.operation === 'CARGAR') {
                totalCargo = Math.max(totalCargo, Number(leg.cargo_quantity_mt) || 0);
            }

            // Consumos de combustible
            totalIfoConsumed += Number(leg.ifo_consumed_mt) || 0;
            totalMdoConsumed += bunker.supports_mdo ? (Number(leg.mdo_consumed_mt) || 0) : 0;

            // Gastos
            totalPortExpenses += Number(leg.port_expenses_usd) || 0;
            totalOtherExpenses += Number(leg.other_expenses_usd) || 0;
        }

        const totalBunkerUsd = (totalIfoConsumed * bunker.price_ifo_usd) + (totalMdoConsumed * bunker.price_mdo_usd);
        const totalDirectCosts = totalBunkerUsd + totalPortExpenses + totalOtherExpenses;
        const netVoyageRevenue = grossFreight - totalDirectCosts;

        const totalSailingDays = totalSailingHours / 24;
        const totalPortDays = totalPortHours / 24;
        const totalVoyageDays = totalSailingDays + totalPortDays;

        const hireTotalUsd = totalVoyageDays * hireDailyRateUsd;
        const netProfitUsd = netVoyageRevenue - hireTotalUsd;
        const tceActualUsdDay = totalVoyageDays > 0 ? (netVoyageRevenue / totalVoyageDays) : 0;
        const operatingMarginPct = grossFreight > 0 ? ((netProfitUsd / grossFreight) * 100) : 0;

        return {
            total_cargo_mt: totalCargo,
            gross_freight_usd: grossFreight,
            total_ifo_consumed_mt: totalIfoConsumed,
            total_mdo_consumed_mt: totalMdoConsumed,
            total_bunker_usd: totalBunkerUsd,
            total_port_expenses_usd: totalPortExpenses,
            total_other_expenses_usd: totalOtherExpenses,
            total_direct_costs_usd: totalDirectCosts,
            net_voyage_revenue_usd: netVoyageRevenue,
            total_sailing_days: totalSailingDays,
            total_port_days: totalPortDays,
            total_voyage_days: totalVoyageDays,
            hire_daily_rate_usd: hireDailyRateUsd,
            hire_total_usd: hireTotalUsd,
            net_profit_usd: netProfitUsd,
            tce_actual_usd_day: tceActualUsdDay,
            operating_margin_pct: operatingMarginPct
        };
    },

    /**
     * Obtiene el listado de liquidaciones reales registradas.
     */
    async getLiquidations(): Promise<VoyageLiquidationRecord[]> {
        const response = await api.get('/forecast/voyage_liquidations');
        return response.data || [];
    },

    /**
     * Guarda o actualiza una liquidación en base de datos.
     */
    async saveLiquidation(payload: VoyageLiquidationRecord): Promise<any> {
        const response = await api.post('/forecast/voyage_liquidations', payload);
        return response.data;
    },

    /**
     * Elimina una liquidación por ID o código de viaje.
     */
    async deleteLiquidation(voyageId: string): Promise<any> {
        const response = await api.delete(`/forecast/voyage_liquidations/${voyageId}`);
        return response.data;
    }
};
