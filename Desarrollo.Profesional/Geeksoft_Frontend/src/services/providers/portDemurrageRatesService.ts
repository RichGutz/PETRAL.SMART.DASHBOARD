/**
 * Servicio Especializado en Perfiles de Demurrage (Estadías Mensuales y Promedios)
 * Consumo en memoria (0ms) a partir del catálogo port_cost_static de Supabase.
 */

export interface PortVesselDemurrageProfile {
    port_id: string;
    vessel_id: string;
    months: {
        m01: number; // ENE
        m02: number; // FEB
        m03: number; // MAR
        m04: number; // ABR
        m05: number; // MAY
        m06: number; // JUN
        m07: number; // JUL
        m08: number; // AGO
        m09: number; // SEP
        m10: number; // OCT
        m11: number; // NOV
        m12: number; // DIC
    };
    annual_average: number;
}

export class PortDemurrageRatesService {

    public static MONTH_KEYS = [
        'm01', 'm02', 'm03', 'm04', 'm05', 'm06',
        'm07', 'm08', 'm09', 'm10', 'm11', 'm12'
    ];

    /**
     * Normaliza el ID del buque para coincidencias exactas.
     */
    private static normalizeVesselKey(vesselId: string): string {
        return (vesselId || '').toUpperCase().trim().replace(/^B\/T\s+/, '');
    }

    /**
     * Extrae el perfil completo de los 12 meses de Demurrage y calcula su promedio anual.
     */
    public static getDemurrageProfile(
        portId: string,
        vesselId: string,
        staticCostsData: any[]
    ): PortVesselDemurrageProfile {
        const cleanPort = (portId || '').toUpperCase().trim();
        const cleanVessel = this.normalizeVesselKey(vesselId);

        const defaultMonths: Record<string, number> = {
            m01: 0, m02: 0, m03: 0, m04: 0, m05: 0, m06: 0,
            m07: 0, m08: 0, m09: 0, m10: 0, m11: 0, m12: 0
        };

        if (!cleanPort || !cleanVessel || !staticCostsData || !Array.isArray(staticCostsData)) {
            return {
                port_id: cleanPort,
                vessel_id: cleanVessel,
                months: defaultMonths as any,
                annual_average: 0
            };
        }

        const demurrageRows = staticCostsData.filter((row: any) => {
            const p = (row.port_id || '').toUpperCase().trim();
            const v = this.normalizeVesselKey(row.vessel_id || '');
            const op = (row.operation_type || '').toUpperCase().trim();
            return p === cleanPort && v === cleanVessel && op === 'DEMURRAGE';
        });

        const months = { ...defaultMonths };
        demurrageRows.forEach((row: any) => {
            const subOp = (row.sub_operation_type || '').toLowerCase().trim();
            if (months[subOp] !== undefined) {
                months[subOp] = Number(row.cost || 0);
            }
        });

        const sum = this.MONTH_KEYS.reduce((acc, k) => acc + (months[k] || 0), 0);
        const annual_average = Number((sum / 12).toFixed(2));

        return {
            port_id: cleanPort,
            vessel_id: cleanVessel,
            months: months as any,
            annual_average
        };
    }

    /**
     * Resuelve el valor de Demurrage (en días) según el modo ('P' = Promedio Anual, 'M' = Mes Calendario).
     */
    public static resolveDemurrageDays(
        portId: string,
        vesselId: string,
        mode: 'P' | 'M',
        dateString: string | undefined | null,
        staticCostsData: any[]
    ): number {
        const profile = this.getDemurrageProfile(portId, vesselId, staticCostsData);

        if (mode === 'P') {
            return profile.annual_average;
        }

        // Modo M: Determinar mes de la fecha (1 = Ene, 12 = Dic)
        let monthNum = 1;
        if (dateString) {
            const parsedDate = new Date(dateString);
            if (!isNaN(parsedDate.getTime())) {
                monthNum = parsedDate.getMonth() + 1; // 1-12
            }
        } else {
            monthNum = new Date().getMonth() + 1;
        }

        const monthKey = `m${String(monthNum).padStart(2, '0')}` as keyof typeof profile.months;
        return profile.months[monthKey] ?? profile.annual_average;
    }
}
