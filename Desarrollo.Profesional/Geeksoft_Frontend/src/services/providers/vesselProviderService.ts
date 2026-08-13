export interface VesselParamsState {
    vessel_id: string;
    vessel_name: string;
    grt: number;
    dwt: number;
    dwcc: number;
    vessel_speed: number;
    tce_required: number;
    length: number;
    beam: number;
    draft_m: string;
    consumption_sea_ifo: number;
    consumption_idle_ifo: number;
    consumption_load_ifo: number;
    consumption_disch_ifo: number;
    consumption_sea_mdo: number;
    consumption_idle_mdo: number;
    consumption_load_mdo: number;
    consumption_disch_mdo: number;
    act_load: number;
    act_disch: number;
}

export class VesselProviderService {
    /**
     * Extrae y normaliza los parámetros técnicos de un buque a partir del catálogo maestro.
     */
    public static extractVesselParams(vesselId: string, vesselsList: any[]): VesselParamsState | null {
        const v = vesselsList.find(x => x.vessel_id === vesselId);
        if (!v) return null;

        return {
            vessel_id: v.vessel_id,
            vessel_name: v.vessel_name || v.vessel_id,
            grt: v.grt ?? 0,
            dwt: v.dwt ?? 0,
            dwcc: v.dwcc ?? 0,
            vessel_speed: v.vessel_speed ?? 11.0,
            tce_required: v.tce_required ?? 0,
            length: v.length ?? 0,
            beam: v.beam ?? 0,
            draft_m: v.draft_m !== null && v.draft_m !== undefined ? Number(v.draft_m).toFixed(1) : (v.draft !== null && v.draft !== undefined ? Number(v.draft).toFixed(1) : '8.2'),
            consumption_sea_ifo: v.consumption_sea_ifo ?? v.bunker_consumption_sea_ifo ?? 14.0,
            consumption_idle_ifo: v.consumption_idle_ifo ?? v.bunker_consumption_idle_ifo ?? v.consumption_port_ifo ?? 2.4,
            consumption_load_ifo: v.consumption_load_ifo ?? v.bunker_consumption_load_ifo ?? v.consumption_port_ifo ?? 2.4,
            consumption_disch_ifo: v.consumption_disch_ifo ?? v.bunker_consumption_disch_ifo ?? v.consumption_port_ifo ?? 3.6,
            consumption_sea_mdo: v.consumption_sea_mdo ?? v.bunker_consumption_sea_mdo ?? 0.0,
            consumption_idle_mdo: v.consumption_idle_mdo ?? v.bunker_consumption_idle_mdo ?? 0.0,
            consumption_load_mdo: v.consumption_load_mdo ?? v.bunker_consumption_load_mdo ?? 0.5,
            consumption_disch_mdo: v.consumption_disch_mdo ?? v.bunker_consumption_disch_mdo ?? 0.5,
            act_load: v.act_load ?? 500,
            act_disch: v.act_disch ?? 300
        };
    }
}
