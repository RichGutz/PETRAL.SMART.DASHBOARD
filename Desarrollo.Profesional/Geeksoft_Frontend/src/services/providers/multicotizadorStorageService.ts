import { ForecastService } from '../api';

export interface SaveQuoteParams {
    routeName: string;
    selectedClient: string;
    filterProspecto: boolean;
    selectedVessel: string;
    bunkerPriceIfo: number;
    bunkerPriceMdo: number;
    tramosEnriquecidos: any[];
    puertosConfig: any[];
    vesselParams: any;
    addressCommPct: number;
    brokerCommPct: number;
    rawClients: any[];
}

export class MulticotizadorStorageService {
    /**
     * Empaqueta y guarda una cotización multicotizador enriquecida en Supabase DB.
     */
    public static async saveQuote(params: SaveQuoteParams): Promise<boolean> {
        const {
            routeName, selectedClient, filterProspecto, selectedVessel,
            bunkerPriceIfo, bunkerPriceMdo, tramosEnriquecidos,
            puertosConfig, vesselParams, addressCommPct, brokerCommPct, rawClients
        } = params;

        const clientInfo = rawClients.find((c: any) => c.client_id === selectedClient);
        const isClientProspect = (clientInfo?.is_prospect === true) || filterProspecto;

        const payload = {
            name: routeName,
            description: isClientProspect ? "Cotización Prospecto (routes_quotes)" : "Ruta Cliente Activo (routes_clients)",
            pais: 'PE',
            is_prospect: isClientProspect,
            created_by: 'izavala@petral.com.pe',
            legs_data: {
                is_multicotizador: true,
                created_by: 'izavala@petral.com.pe',
                vessel_id: isClientProspect ? selectedVessel : undefined,
                bunker_price_ifo: bunkerPriceIfo,
                bunker_price_mdo: bunkerPriceMdo,
                tramos: tramosEnriquecidos,
                puertosConfig,
                vesselParams: isClientProspect ? vesselParams : undefined,
                addressCommPct,
                brokerCommPct
            }
        };

        await ForecastService.saveSpot(payload);
        return true;
    }

    /**
     * Lista y filtra las rutas guardadas desde la API.
     */
    public static async listSavedQuotes(
        filterActivo: boolean,
        filterProspecto: boolean,
        selectedClient: string
    ): Promise<any[]> {
        const list = await ForecastService.listSpots();

        return list.filter((s: any) => {
            const name = (s.name || '').toUpperCase();
            const desc = (s.description || '').toUpperCase();
            const isProspectRoute = s.table_source === 'routes_quotes' || s.is_prospect === true || s.is_quote === true || desc.includes('PROSPECTO') || desc.includes('ROUTES_QUOTES') || name.startsWith('PROSPECT');

            if (filterActivo && isProspectRoute) return false;
            if (filterProspecto && !isProspectRoute) return false;

            if (selectedClient) {
                const clientUpper = selectedClient.toUpperCase();
                if (!name.includes(clientUpper) && !desc.includes(clientUpper) && s.client_id !== selectedClient) {
                    return false;
                }
            }

            return Boolean(s.legs_data);
        });
    }
}
