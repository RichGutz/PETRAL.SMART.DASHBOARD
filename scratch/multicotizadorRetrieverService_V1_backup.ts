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
     * Carga cotizaciones guardadas EXCLUSIVAMENTE desde la tabla routes_quotes (Paso 3).
     */
    public static async searchSavedQuotes(
        searchQuery: string,
        filterActivo: boolean,
        filterProspecto: boolean,
        selectedClient: string
    ): Promise<RetrievedQuote[]> {
        const rawSpots = await ForecastService.getSpotVoyages();
        if (!rawSpots || !Array.isArray(rawSpots)) return [];

        const filtered = rawSpots.filter((s: any) => {
            const isQuotesTable = s.table_source === 'routes_quotes' || s.is_quote === true || s.is_prospect === true;
            if (!isQuotesTable) return false;

            if (selectedClient && selectedClient.trim() !== '') {
                const clientUpper = selectedClient.trim().toUpperCase();
                const nameUpper = String(s.name || '').toUpperCase();
                const descUpper = String(s.description || '').toUpperCase();
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

    public static unpackQuoteData(quote: RetrievedQuote) {
        const legsData = quote.legs_data || {};
        return {
            vessel_id: legsData.vessel_id || quote.vessel_id || '',
            bunker_price_ifo: legsData.bunker_price_ifo || 0,
            bunker_price_mdo: legsData.bunker_price_mdo || 0,
            tramos: legsData.tramos || [],
            puertosConfig: legsData.puertosConfig || [],
            vesselParams: legsData.vesselParams || null,
            addressCommPct: legsData.addressCommPct || 0,
            brokerCommPct: legsData.brokerCommPct || 0
        };
    }
}
