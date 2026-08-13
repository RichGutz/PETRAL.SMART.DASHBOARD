import { ForecastService } from '../api';

export type BunkerSourceType = 'MAESTRO_CONTRATOS' | 'COTIZACION' | 'MAESTRO_BUNKER' | 'SOBREESCRITURA';

export interface BunkerPriceState {
    ifo: number;
    mdo: number;
    quote_date?: string;
}

export class BunkerProviderService {
    /**
     * Resuelve los precios de IFO y MDO según la fuente seleccionada y los datos contextuales.
     */
    public static resolveBunkerPrices(
        source: BunkerSourceType,
        contractPrices: BunkerPriceState | null,
        snapshotPrices: BunkerPriceState | null,
        latestPrices: BunkerPriceState,
        manualPrices: BunkerPriceState
    ): BunkerPriceState {
        switch (source) {
            case 'MAESTRO_CONTRATOS':
                if (contractPrices && contractPrices.ifo > 0) {
                    return { ifo: contractPrices.ifo, mdo: contractPrices.mdo };
                }
                return { ifo: 0.0, mdo: 0.0 };

            case 'COTIZACION':
                if (snapshotPrices && snapshotPrices.ifo > 0) {
                    return { ifo: snapshotPrices.ifo, mdo: snapshotPrices.mdo };
                }
                return { ifo: 0.0, mdo: 0.0 };

            case 'MAESTRO_BUNKER':
                return { ifo: latestPrices.ifo || 0.0, mdo: latestPrices.mdo || 0.0 };

            case 'SOBREESCRITURA':
                return { ifo: manualPrices.ifo || 0.0, mdo: manualPrices.mdo || 0.0 };

            default:
                return { ifo: 0.0, mdo: 0.0 };
        }
    }

    /**
     * Consulta los precios más recientes de mercado del búnker desde la API.
     */
    public static async fetchLatestBunkerPrices(): Promise<BunkerPriceState> {
        try {
            const res = await ForecastService.getLatestBunker();
            if (res) {
                return {
                    ifo: res.bunker_price_ifo || res.ifo || 0.0,
                    mdo: res.bunker_price_mdo || res.mdo || 0.0,
                    quote_date: res.quote_date || ''
                };
            }
        } catch (error) {
            console.error("Error fetching latest bunker prices:", error);
        }
        return { ifo: 0.0, mdo: 0.0 };
    }
}
