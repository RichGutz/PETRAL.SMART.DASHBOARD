/**
 * ==============================================================================
 * Tipos e Interfaces para el Módulo Voyage Liquidator (Liquidación Real Ex-Post)
 * PETRAL ONE - Enterprise Shipping Soft
 * ==============================================================================
 */

export type LegOperationType = 'CARGAR' | 'DESCARGAR' | 'BUNKERING' | 'SHIFTING' | 'NONE';

export interface VoyageLegExecution {
    id: string;
    leg_index: number;
    port_id: string;
    arrival_datetime: string;     // YYYY-MM-DD HH:mm (Inicio recalada / ATA)
    departure_datetime: string;   // YYYY-MM-DD HH:mm (Fin recalada / ATD)
    operation: LegOperationType;
    cargo_quantity_mt: number;    // TM Carga Real
    freight_rate_usd: number;     // Flete $/TM
    ifo_consumed_mt: number;      // TM IFO quemadas
    mdo_consumed_mt: number;      // TM MDO quemadas
    port_expenses_usd: number;    // Gastos reales de agencia/puerto (FDA)
    other_expenses_usd: number;   // Rubro Otros Costos directos
    other_expenses_desc: string;  // Glosa justificativa de Otros Costos
}

export interface BunkerActiveSnapshot {
    vessel_id: string;
    event_id: string;
    event_code: string;
    event_date: string;
    price_ifo_usd: number;
    price_mdo_usd: number;
    baf_factor: number;
    baf_variation_usd: number;
    supports_mdo: boolean;
    is_live: boolean;
}

export interface VoyageLiquidationCalculatedSummary {
    total_cargo_mt: number;
    gross_freight_usd: number;
    total_ifo_consumed_mt: number;
    total_mdo_consumed_mt: number;
    total_bunker_usd: number;
    total_port_expenses_usd: number;
    total_other_expenses_usd: number;
    total_direct_costs_usd: number;
    net_voyage_revenue_usd: number;
    total_sailing_days: number;
    total_port_days: number;
    total_voyage_days: number;
    hire_daily_rate_usd: number;
    hire_total_usd: number;
    net_profit_usd: number;
    tce_actual_usd_day: number;
    operating_margin_pct: number;
}

export interface VoyageLiquidationRecord {
    id?: string;
    voyage_code: string;
    vessel_name: string;
    client_name: string;
    voyage_date: string;
    operator: string;
    pol_port: string;
    pod_port: string;
    stops: string[];
    cargo_quantity_mt: number;
    freight_rate_usd: number;
    gross_revenue_usd: number;
    tce_usd_day: number;
    tce_req_usd_day: number;
    pcm_usd: number;
    net_profit_usd: number;
    details: {
        itinerary: Array<{
            leg: number;
            port: string;
            arrival_datetime: string;
            departure_datetime: string;
            operation: string;
            cargo_quantity_mt: number;
            freight_rate_usd?: number;
            port_expenses_usd: number;
            other_expenses_usd: number;
            other_expenses_desc?: string;
            ifo_consumed_mt: number;
            mdo_consumed_mt: number;
            port_days: number;
            sailing_days: number;
        }>;
        bunker_consumption: {
            ifo_mt: number;
            mdo_mt: number;
            ifo_price_usd: number;
            mdo_price_usd: number;
            total_bunker_usd: number;
            bunker_event_id?: string;
            bunker_event_code?: string;
        };
        financial_summary: {
            gross_revenue_usd: number;
            bunker_cost_usd: number;
            port_expenses_usd: number;
            other_expenses_usd: number;
            total_direct_costs_usd: number;
            net_voyage_revenue_usd: number;
            total_voyage_days: number;
            tce_actual_usd_day: number;
            net_profit_usd: number;
        };
    };
    created_at?: string;
    updated_at?: string;
}
