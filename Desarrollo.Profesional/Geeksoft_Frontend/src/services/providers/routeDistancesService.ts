export interface AutoRouteInfo {
    route_distance: number | string;
    weather_factor: number | string;
}

export class RouteDistancesService {
    /**
     * Busca la distancia en millas náuticas y el factor de clima para un par de puertos en el maestro de rutas.
     * Si no se encuentra coincidencia en la BD, retorna estrictamente 0 (Cero Fallbacks Inventados).
     */
    public static resolveAutoRouteInfo(
        originPortId: string,
        destPortId: string,
        type: 'BALLAST' | 'LADEN',
        routesList: any[]
    ): AutoRouteInfo {
        if (!originPortId || !destPortId) {
            return { route_distance: 0, weather_factor: 0 };
        }

        const match = routesList.find(r =>
            (r.origin_port_id === originPortId && r.destination_port_id === destPortId) ||
            (r.origin_port_id === destPortId && r.destination_port_id === originPortId)
        );

        if (match) {
            const dist = Number(match.route_distance || match.distance || 0);
            const wfRaw = type === 'LADEN'
                ? (match.weather_factor_laden ?? match.weather_factor ?? 0)
                : (match.weather_factor_ballast ?? match.weather_factor ?? 0);

            const wfPct = wfRaw > 1 ? wfRaw : (wfRaw * 100);
            return {
                route_distance: dist > 0 ? dist : 0,
                weather_factor: wfPct > 0 ? wfPct : 0
            };
        }

        return { route_distance: 0, weather_factor: 0 };
    }
}
