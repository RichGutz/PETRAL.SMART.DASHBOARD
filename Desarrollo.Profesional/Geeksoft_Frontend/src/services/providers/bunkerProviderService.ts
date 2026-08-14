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
                if (contractPrices && (contractPrices.ifo > 0 || contractPrices.mdo > 0)) {
                    return { ifo: contractPrices.ifo, mdo: contractPrices.mdo };
                }
                // Si es prospecto o no hay coincidencia de contrato, fallback al maestro de búnker spot
                return { ifo: latestPrices.ifo || 0.0, mdo: latestPrices.mdo || 0.0 };

            case 'COTIZACION':
                if (snapshotPrices && (snapshotPrices.ifo > 0 || snapshotPrices.mdo > 0)) {
                    return { ifo: snapshotPrices.ifo, mdo: snapshotPrices.mdo };
                }
                return { ifo: latestPrices.ifo || 0.0, mdo: latestPrices.mdo || 0.0 };

            case 'MAESTRO_BUNKER':
                return { ifo: latestPrices.ifo || 0.0, mdo: latestPrices.mdo || 0.0 };

            case 'SOBREESCRITURA':
                return { ifo: manualPrices.ifo || 0.0, mdo: manualPrices.mdo || 0.0 };

            default:
                return { ifo: 0.0, mdo: 0.0 };
        }
    }

    /**
     * Resuelve contractPrices buscando en la tabla contracts para clientes ACTIVOS la combinación
     * con la SUMA MÁS ALTA (IFO + MDO) de los puertos de destino.
     * Para PROSPECTOS, retorna automáticamente los precios spot de bunker_prices.
     */
    public static resolveContractPricesForClient(
        client: string,
        isProspect: boolean,
        destinationPorts: string[],
        contractsData: any[],
        spotPrices: BunkerPriceState
    ): BunkerPriceState {
        if (!client || isProspect) {
            return { ifo: spotPrices.ifo, mdo: spotPrices.mdo };
        }

        const clientClean = client.trim().toUpperCase();
        const destsClean = destinationPorts.map(d => d.trim().toUpperCase()).filter(Boolean);

        // Filtrar contratos del cliente
        const clientContracts = (contractsData || []).filter((c: any) => {
            const cName = (c.client_name || c.client_id || '').trim().toUpperCase();
            return cName === clientClean || cName.includes(clientClean) || clientClean.includes(cName);
        });

        if (clientContracts.length === 0) {
            return { ifo: spotPrices.ifo, mdo: spotPrices.mdo };
        }

        // Filtrar por puertos de destino coincidentes
        let matchingContracts = clientContracts.filter((c: any) => {
            const cDest = (c.destination_port_id || c.destination_port || c.port_id || '').trim().toUpperCase();
            return destsClean.includes(cDest);
        });

        if (matchingContracts.length === 0) {
            matchingContracts = clientContracts;
        }

        // Seleccionar el contrato con la SUMA MÁS ALTA de (IFO + MDO)
        let maxSum = -1;
        let bestContract: any = null;

        matchingContracts.forEach((c: any) => {
            const ifo = Number(c.bunker_baseline_price_ifo ?? c.bunker_price_ifo ?? c.ifo ?? 0);
            const mdo = Number(c.bunker_baseline_price_mdo ?? c.bunker_price_mdo ?? c.mdo ?? 0);
            const sum = ifo + mdo;
            if (sum > maxSum) {
                maxSum = sum;
                bestContract = c;
            }
        });

        if (bestContract) {
            const bestIfo = Number(bestContract.bunker_baseline_price_ifo ?? bestContract.bunker_price_ifo ?? bestContract.ifo ?? spotPrices.ifo);
            const bestMdo = Number(bestContract.bunker_baseline_price_mdo ?? bestContract.bunker_price_mdo ?? bestContract.mdo ?? spotPrices.mdo);
            return { ifo: bestIfo, mdo: bestMdo };
        }

        return { ifo: spotPrices.ifo, mdo: spotPrices.mdo };
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
