import { ForecastService } from '../api';

export interface PortLookupResult {
    total_cost: number | string;
    muellaje_cost: number;
}

export class PortCostsRatesService {
    /**
     * Resuelve autocompletado de ritmos nominales para un puerto según la acción.
     */
    public static resolveAutoPortRate(portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR', portsList: any[]): number | string {
        if (!portId || action === 'NONE') return '';
        const p = portsList.find(x => x.port_id === portId);
        if (!p) return '';
        const val = action === 'CARGAR' ? (p.max_load_rate || p.act_load) : (p.max_disch_rate || p.act_disch);
        return val && val > 0 ? val : '';
    }

    /**
     * Resuelve overheads (time to count) en horas por defecto para un puerto.
     */
    public static resolveAutoPortOverhead(portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR', portsList: any[]): number | string {
        if (!portId || action === 'NONE') return '';
        const p = portsList.find(x => x.port_id === portId);
        if (!p) return '';
        const val = action === 'CARGAR' ? p.time_to_count_carga_hrs : p.time_to_count_descarga_hrs;
        return val !== undefined && val !== null ? val : 6.0;
    }

    /**
     * Resuelve maniobras de posicionamiento en horas por defecto para un puerto.
     */
    public static resolveAutoPortPositioning(portId: string, action: 'NONE' | 'CARGAR' | 'DESCARGAR', portsList: any[]): number | string {
        if (!portId || action === 'NONE') return '';
        const p = portsList.find(x => x.port_id === portId);
        if (!p) return '';
        const val = action === 'CARGAR' ? p.maneuver_carga_hrs : p.maneuver_descarga_hrs;
        return val !== undefined && val !== null ? val : 0.0;
    }

    /**
     * Realiza la consulta remota de costo de puerto y desglose de muellaje ($33,333).
     */
    public static async lookupPortCost(
        vesselId: string,
        portId: string,
        action: 'NONE' | 'CARGAR' | 'DESCARGAR',
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
