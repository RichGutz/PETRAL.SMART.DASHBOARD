import { ForecastService } from '../api';

export interface RetrievedQuote {
    id: string;
    name: string;
    description?: string;
    table_source?: string;
    is_prospect?: boolean;
    vessel_id?: string;
    client_id?: string;
    legs_data: {
        is_multicotizador?: boolean;
        vessel_id?: string;
        bunker_price_ifo?: number;
        bunker_price_mdo?: number;
        tramos?: any[];
        puertosConfig?: any[];
        vesselParams?: any;
        addressCommPct?: number;
        brokerCommPct?: number;
        [key: string]: any;
    };
}

export class MulticotizadorRetrieverService {
    /**
     * SERIE 36: Carga cotizaciones desde routes_quotes (tabla única).
     * description canónico:
     *   "COA Cliente Activo"        → activo COA
     *   "Cotización Cliente Activo" → activo normal
     *   "Cotización Prospecto"      → prospecto
     */
    public static async searchSavedQuotes(
        searchQuery: string,
        _filterActivo: boolean,
        _filterProspecto: boolean,
        selectedClient: string
    ): Promise<RetrievedQuote[]> {
        const rawSpots = await ForecastService.getSpotVoyages();
        if (!rawSpots || !Array.isArray(rawSpots)) return [];

        const filtered = rawSpots.filter((s: any) => {
            // SERIE 36: Aceptar TODO lo que venga de routes_quotes (incluyendo COA).
            // Excluir routes_clients (viajes operativos, no cotizaciones comerciales).
            const isFromRoutesQuotes = s.table_source === 'routes_quotes'
                || s.is_quote === true
                || s.is_prospect === true
                || s.is_contract === true;  // ← COA ahora en routes_quotes
            if (!isFromRoutesQuotes) return false;

            // Pre-filtro ACTIVOS/PROSPECTOS por campo description canónico
            // Tolerante a registros legacy que tienen texto adicional en description
            // ej: "Cotización Prospecto (routes_quotes)" → también es prospecto
            const desc = (s.description || '').trim();
            const isProspectDesc = desc.includes('Prospecto') || desc.includes('prospecto');
            if (_filterProspecto && !_filterActivo && !isProspectDesc) return false;
            if (_filterActivo && !_filterProspecto && isProspectDesc) return false;

            // Filtro por cliente
            if (selectedClient && selectedClient.trim() !== '') {
                const clientUpper = selectedClient.trim().toUpperCase();
                const nameUpper = String(s.name || '').toUpperCase();
                const descUpper = desc.toUpperCase();
                const cIdUpper = String(s.client_id || '').toUpperCase();
                if (!nameUpper.includes(clientUpper) && !descUpper.includes(clientUpper) && cIdUpper !== clientUpper) {
                    return false;
                }
            }
            return true;
        });

        if (!searchQuery || !searchQuery.trim()) {
            return filtered;
        }

        const queryUpper = searchQuery.trim().toUpperCase();
        return filtered.filter((item: any) => {
            const nameUpper = String(item.name || '').toUpperCase();
            const descUpper = String(item.description || '').toUpperCase();
            return nameUpper.includes(queryUpper) || descUpper.includes(queryUpper);
        });
    }


    public static unpackQuoteData(quote: any): any {
        if (!quote) {
            return {
                vessel_id: '',
                bunker_price_ifo: 0,
                bunker_price_mdo: 0,
                tramos: [],
                puertosConfig: [],
                vesselParams: null,
                addressCommPct: 0,
                brokerCommPct: 0,
                baf_formula: '',
                baf_valid_from: '',
                baf_valid_to: '',
                baf_ifo_base: 0,
                baf_mdo_base: 0,
                tariff_tiers: null,
                demurrage_rates: null,
                comments_text: '',
                financial_summary: null,
                refacturarMuellajeMap: null,
                charter_hire_cost: 0,
                charterHireCost: 0
            };
        }

        let legsData = quote.legs_data;
        if (typeof legsData === 'string') {
            try {
                legsData = JSON.parse(legsData);
            } catch (e) {
                console.error("Error parsing legs_data JSON string in unpackQuoteData:", e);
                legsData = {};
            }
        }
        legsData = legsData || {};

        const rawPuertosConfig = legsData.puertosConfig || quote.puertosConfig || [];
        const normalizedPuertosConfig = rawPuertosConfig.map((p: any) => {
            const ttc = (p.time_to_count !== undefined && p.time_to_count !== '')
                ? p.time_to_count
                : (p.overhead !== undefined && p.overhead !== '' ? p.overhead : (p.action !== 'NONE' ? 6 : ''));
            return {
                ...p,
                time_to_count: ttc,
                overhead: p.overhead ?? ttc
            };
        });

        const meta = legsData.contract_metadata || {};
        const demurrageRates = legsData.demurrage_rates || meta.demurrage_rates || null;
        const tariffTiers = legsData.tariff_tiers || meta.tariff_tiers || null;
        const rawTramos = legsData.tramos || quote.tramos || [];

        const validFrom = legsData.valid_from 
            || legsData.validFrom 
            || meta.valid_from 
            || meta.validFrom 
            || legsData.baf_valid_from 
            || quote.valid_from 
            || quote.validFrom 
            || quote.validity_start 
            || '';

        const validTo = legsData.valid_to 
            || legsData.validTo 
            || meta.valid_to 
            || meta.validTo 
            || legsData.baf_valid_to 
            || quote.valid_to 
            || quote.validTo 
            || quote.validity_end 
            || '';

        const bafValidFrom = legsData.baf_valid_from || validFrom;
        const bafValidTo = legsData.baf_valid_to || validTo;

        return {
            vessel_id: legsData.vessel_id || quote.vessel_id || '',
            vessel_name: legsData.vessel_name || quote.vessel_name || legsData.vesselParams?.vessel_name || '',
            bunker_price_ifo: Number(legsData.bunker_price_ifo ?? legsData.bunker_ifo ?? quote.bunker_price_ifo ?? 0),
            bunker_price_mdo: Number(legsData.bunker_price_mdo ?? legsData.bunker_mdo ?? quote.bunker_price_mdo ?? 0),
            tramos: rawTramos,
            puertosConfig: normalizedPuertosConfig,
            vesselParams: legsData.vesselParams || quote.vesselParams || null,
            addressCommPct: legsData.addressCommPct !== undefined ? Number(legsData.addressCommPct) : 0,
            brokerCommPct: legsData.brokerCommPct !== undefined ? Number(legsData.brokerCommPct) : 0,
            valid_from: validFrom,
            valid_to: validTo,
            baf_formula: legsData.baf_formula || meta.baf_formula || '',
            baf_valid_from: bafValidFrom,
            baf_valid_to: bafValidTo,
            baf_ifo_base: Number(legsData.baf_ifo_base || 0),
            baf_mdo_base: Number(legsData.baf_mdo_base || 0),
            tariff_tiers: tariffTiers,
            demurrage_rates: demurrageRates,
            comments_text: legsData.comments_text || quote.comments || legsData.comments || meta.comments_text || '',
            charter_hire_cost: Number(legsData.charter_hire_cost ?? legsData.charterHireCost ?? quote.charter_hire_cost ?? quote.charterHireCost ?? meta.charter_hire_cost ?? 0),
            charterHireCost: Number(legsData.charter_hire_cost ?? legsData.charterHireCost ?? quote.charter_hire_cost ?? quote.charterHireCost ?? meta.charter_hire_cost ?? 0),
            financial_summary: legsData.financial_summary || meta.financial_summary || null,
            refacturarMuellajeMap: legsData.refacturarMuellajeMap || null
        };
    }
}

