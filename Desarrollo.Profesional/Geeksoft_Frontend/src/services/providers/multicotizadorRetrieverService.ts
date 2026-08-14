import { MulticotizadorStorageService } from './multicotizadorStorageService';

export interface RetrievedQuote {
    id: string;
    name: string;
    description?: string;
    table_source?: string;
    is_prospect?: boolean;
    vessel_id?: string;
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
     * Busca y filtra cotizaciones persistidas por término de búsqueda, tipo cliente o prospecto.
     */
    public static async searchSavedQuotes(
        searchQuery: string,
        filterActivo: boolean,
        filterProspecto: boolean,
        selectedClient: string
    ): Promise<RetrievedQuote[]> {
        const rawList = await MulticotizadorStorageService.listSavedQuotes(filterActivo, filterProspecto, selectedClient);
        
        if (!searchQuery || !searchQuery.trim()) {
            return rawList;
        }

        const queryUpper = searchQuery.trim().toUpperCase();
        return rawList.filter((item: any) => {
            const nameUpper = (item.name || '').toUpperCase();
            const descUpper = (item.description || '').toUpperCase();
            const idUpper = String(item.id || '').toUpperCase();
            return nameUpper.includes(queryUpper) || descUpper.includes(queryUpper) || idUpper.includes(queryUpper);
        });
    }

    /**
     * Carga y desempaqueta los datos de una cotización específica para inyectar en el estado del Multicotizador.
     */
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
