import { ForecastService } from '../api';

export interface SaveQuoteParams {
    routeId?: string;
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
    isContract?: boolean;
    contractId?: string;
    validFrom?: string;
    validTo?: string;
    validityYears?: number;
    contractStatus?: string;
    bafFormula?: string;
    bafValidFrom?: string;
    bafValidTo?: string;
    bafIfoBase?: number;
    bafMdoBase?: number;
    tariffTiers?: any[];
    demurrageRatesMap?: Record<string, number>;
    commentsText?: string;
    financialSummary?: any;
    refacturarMuellajeMap?: Record<number, boolean>;
    createdBy?: string;
}

export class MulticotizadorStorageService {
    /**
     * Empaqueta y guarda una cotización multicotizador en routes_quotes (tabla única).
     * SERIE 36: contracts dado de baja. Diferenciación por campo description:
     *   - "COA Cliente Activo"        → cliente activo guardando ruta COA (Maestro Rutas)
     *   - "Cotización Cliente Activo" → cliente activo guardando cotización normal
     *   - "Cotización Prospecto"      → cliente prospecto
     */
    public static async saveQuote(params: SaveQuoteParams): Promise<boolean> {
        const {
            routeId, routeName, selectedClient, filterProspecto, selectedVessel,
            bunkerPriceIfo, bunkerPriceMdo, tramosEnriquecidos,
            puertosConfig, vesselParams, addressCommPct, brokerCommPct, rawClients,
            isContract, validFrom, validTo, validityYears, contractStatus,
            bafFormula, bafValidFrom, bafValidTo, bafIfoBase, bafMdoBase, tariffTiers, demurrageRatesMap,
            commentsText,
            financialSummary,
            refacturarMuellajeMap,
            createdBy
        } = params;

        let activeUserEmail = createdBy;
        if (!activeUserEmail) {
            try {
                const storedUser = localStorage.getItem('petral_user');
                if (storedUser) {
                    const uObj = JSON.parse(storedUser);
                    activeUserEmail = uObj.email || uObj.full_name || 'izavala@petral.com.pe';
                }
            } catch {
                activeUserEmail = 'izavala@petral.com.pe';
            }
        }
        if (!activeUserEmail) activeUserEmail = 'izavala@petral.com.pe';

        const clientInfo = rawClients.find((c: any) => c.client_id === selectedClient);
        const isClientProspect = (clientInfo?.is_prospect === true) || filterProspecto;

        // SERIE 36: 3 valores canónicos de description para routes_quotes
        let description: string;
        if (isContract) {
            description = 'COA Cliente Activo';
        } else if (isClientProspect) {
            description = 'Cotización Prospecto';
        } else {
            description = 'Cotización Cliente Activo';
        }

        const payload: any = {
            route_id: routeId,
            name: routeName,
            description,
            pais: 'PE',
            is_prospect: isClientProspect,
            is_contract: isContract === true,  // el backend usa este flag para asignar description si no viene
            client_id: selectedClient,
            created_by: activeUserEmail,
            legs_data: {
                is_multicotizador: true,
                created_by: activeUserEmail,
                vessel_id: selectedVessel,
                bunker_price_ifo: bunkerPriceIfo,
                bunker_price_mdo: bunkerPriceMdo,
                tramos: tramosEnriquecidos,
                puertosConfig,
                vesselParams,
                addressCommPct,
                brokerCommPct,
                baf_formula: bafFormula,
                baf_valid_from: bafValidFrom,
                baf_valid_to: bafValidTo,
                baf_ifo_base: bafIfoBase,
                baf_mdo_base: bafMdoBase,
                tariff_tiers: tariffTiers,
                demurrage_rates: demurrageRatesMap,
                comments_text: commentsText,
                financial_summary: financialSummary || null,
                refacturarMuellajeMap: refacturarMuellajeMap || null,
                // Metadata de contrato COA (solo si aplica) dentro del JSONB
                contract_metadata: isContract ? {
                    client_id: selectedClient,
                    valid_from: validFrom,
                    valid_to: validTo,
                    validity_years: validityYears || 1,
                    contract_status: contractStatus || 'ACTIVE',
                    baf_formula: bafFormula,
                    tariff_tiers: tariffTiers,
                    demurrage_rates: demurrageRatesMap,
                    financial_summary: financialSummary || null
                } : undefined
            }
        };

        await ForecastService.saveSpot(payload);
        return true;
    }

    /**
     * Lista y filtra las rutas guardadas desde la API (routes_clients, routes_quotes y contracts).
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
