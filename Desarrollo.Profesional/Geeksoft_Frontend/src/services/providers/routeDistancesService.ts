export interface AutoRouteInfo {
    route_distance: number | string;
    weather_factor: number | string;
}

export class RouteDistancesService {
    /**
     * Busca la distancia en millas náuticas y el factor de clima para un par de puertos en el maestro de rutas.
     */
    public static resolveAutoRouteInfo(
        originPortId: string,
        destPortId: string,
        type: 'BALLAST' | 'LADEN',
        routesList: any[]
    ): AutoRouteInfo {
        if (!originPortId || !destPortId) {
            return { route_distance: '', weather_factor: 3.0 };
        }

        const match = routesList.find(r =>
            (r.origin_port_id === originPortId && r.destination_port_id === destPortId) ||
            (r.origin_port_id === destPortId && r.destination_port_id === originPortId)
        );

        if (match) {
            const dist = match.route_distance || match.distance || 0;
            const wfRaw = type === 'LADEN'
                ? (match.weather_factor_laden ?? match.weather_factor ?? 0.03)
                : (match.weather_factor_ballast ?? match.weather_factor ?? 0.03);

            const wfPct = wfRaw > 1 ? wfRaw : (wfRaw * 100);
            return {
                route_distance: dist > 0 ? dist : '',
                weather_factor: wfPct
            };
        }

        return { route_distance: '', weather_factor: 3.0 };
    }
}
