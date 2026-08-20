import { ForecastService } from '../api';

export interface PortLookupResult {
    total_cost: number | string;
    muellaje_cost: number;
}

export interface ContractMatchResult {
    has_contract: boolean;
    time_to_count_origin: number;
    time_to_count_dest: number;
    positioning_origin: number;
    positioning_dest: number;
    load_rate: number;
    discharge_rate: number;
    freight_rate: number;
    address_commission: number;
    broker_commission: number;
}

export class PortCostsRatesService {
    /**
     * Búsqueda exacta por Cliente + Origen + Destino en el Maestro de Contratos.
     * Si no existe coincidencia exacta, retorna estrictamente 0 en todos los campos (Cero Fallbacks).
     */
    public static lookupContractInfo(
        contracts: any[],
        clientId: string,
        originPortId: string,
        destPortId: string,
        quantity: number
    ): ContractMatchResult {
        if (!clientId || !originPortId || !destPortId || contracts.length === 0) {
            return {
                has_contract: false,
                time_to_count_origin: 0,
                time_to_count_dest: 0,
                positioning_origin: 0,
                positioning_dest: 0,
                load_rate: 0,
                discharge_rate: 0,
                freight_rate: 0,
                address_commission: 0,
                broker_commission: 0
            };
        }

        const matchContract = contracts.find(c => 
            c.client_id === clientId &&
            c.origin_port_id === originPortId &&
            c.destination_port_id === destPortId &&
            c.is_active !== false
        );

        if (!matchContract) {
            return {
                has_contract: false,
                time_to_count_origin: 0,
                time_to_count_dest: 0,
                positioning_origin: 0,
                positioning_dest: 0,
                load_rate: 0,
                discharge_rate: 0,
                freight_rate: 0,
                address_commission: 0,
                broker_commission: 0
            };
        }

        // Buscar tarifa según escalado de volumen Q (min_tonnage <= Q <= max_tonnage)
        let freightRate = 0;
        if (matchContract.tariffs && matchContract.tariffs.length > 0) {
            const matchedTariff = matchContract.tariffs.find((t: any) => 
                quantity >= (t.min_tonnage || 0) && (t.max_tonnage ? quantity <= t.max_tonnage : true)
            );
            freightRate = matchedTariff ? Number(matchedTariff.freight_rate || 0) : Number(matchContract.tariffs[0].freight_rate || 0);
        }

        return {
            has_contract: true,
            time_to_count_origin: Number(matchContract.time_to_count_carga_hrs || 0),
            time_to_count_dest: Number(matchContract.time_to_count_descarga_hrs || 0),
            positioning_origin: Number(matchContract.maneuver_carga_hrs || 0),
            positioning_dest: Number(matchContract.maneuver_descarga_hrs || 0),
            load_rate: Number(matchContract.load_rate || 0),
            discharge_rate: Number(matchContract.discharge_rate || 0),
            freight_rate: freightRate,
            address_commission: Number(matchContract.address_commission || 0),
            broker_commission: Number(matchContract.broker_commission || 0)
        };
    }

    /**
     * Resuelve ritmos nominales para un puerto según la acción.
     */
    public static resolveAutoPortRate(portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR' | 'BUNKERING', portsList: any[]): number | string {
        if (!portId || action === 'NONE' || action === 'BUNKERING') return '';
        const p = portsList.find(x => x.port_id === portId);
        if (!p) return '';
        const val = action === 'CARGAR' ? (p.max_load_rate || p.act_load) : (p.max_disch_rate || p.act_disch);
        return val && val > 0 ? val : '';
    }

    /**
     * Realiza la consulta remota de costo de puerto y desglose de muellaje ($33,333).
     */
    public static async lookupPortCost(
        vesselId: string,
        portId: string,
        action: 'NONE' | 'CARGAR' | 'DESCARGAR' | 'BUNKERING',
        portCostMode: 'static' | 'matrix'
    ): Promise<PortLookupResult> {
        if (!vesselId || !portId || action === 'NONE') {
            return { total_cost: '', muellaje_cost: 0 };
        }

        try {
            const res = await ForecastService.lookupPortCost(vesselId, portId, action, portCostMode);
            if (res && res.total_cost !== undefined) {
                return {
                    total_cost: res.total_cost > 0 ? res.total_cost : '',
                    muellaje_cost: res.breakdown?.muellaje || 0
                };
            }
        } catch (err) {
            console.error("Error doing port cost lookup:", err);
        }

        return { total_cost: '', muellaje_cost: 0 };
    }
}
