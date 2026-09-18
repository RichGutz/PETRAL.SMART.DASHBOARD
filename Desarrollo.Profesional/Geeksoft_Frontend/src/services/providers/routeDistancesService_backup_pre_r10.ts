export interface AutoRouteInfo {
    route_distance: number | string;
    weather_factor: number | string;
}

// Matriz estandarizada de distancias náuticas en NM entre pares de puertos sudamericanos
const PAIRWISE_PORT_DISTANCES: Record<string, number> = {
    'ILO_CALLAO': 514,
    'CALLAO_ILO': 514,
    'CALLAO_MATARANI': 457,
    'MATARANI_CALLAO': 457,
    'MATARANI_ILO': 69,
    'ILO_MATARANI': 69,
    'CALLAO_MARCONA': 254,
    'MARCONA_CALLAO': 254,
    'MARCONA_ILO': 283,
    'ILO_MARCONA': 283,
    'MARCONA_MATARANI': 210,
    'MATARANI_MARCONA': 210,
    'ILO_MEJILLONES': 335,
    'MEJILLONES_ILO': 335,
    'CALLAO_MEJILLONES': 769,
    'MEJILLONES_CALLAO': 769,
    'MATARANI_MEJILLONES': 320,
    'MEJILLONES_MATARANI': 320,
    'MEJILLONES_CONCON': 520,
    'CONCON_MEJILLONES': 520,
    'CALLAO_CONCON': 1289,
    'CONCON_CALLAO': 1289,
    'ILO_CONCON': 850,
    'CONCON_ILO': 850,
    'CALLAO_BARQUITO': 645,
    'BARQUITO_CALLAO': 645,
    'ILO_BARQUITO': 410,
    'BARQUITO_ILO': 410
};

export class RouteDistancesService {
    /**
     * Busca la distancia en millas náuticas y el factor de clima para un par de puertos en el maestro de rutas.
     * Si no se encuentra en las rutas máster del cliente, utiliza la matriz par-a-par estandarizada de distancias náuticas.
     */
    public static resolveAutoRouteInfo(
        originPortId: string,
        destPortId: string,
        type: 'BALLAST' | 'LADEN',
        routesList: any[]
    ): AutoRouteInfo {
        if (!originPortId || !destPortId) {
            return { route_distance: 0, weather_factor: 3.0 };
        }

        const o = originPortId.trim().toUpperCase();
        const d = destPortId.trim().toUpperCase();

        if (o === d) {
            return { route_distance: 0, weather_factor: 3.0 };
        }

        // 1. Intentar buscar coincidencia en routesList (rutas máster de clientes)
        if (routesList && Array.isArray(routesList)) {
            for (const r of routesList) {
                // Verificar en tramos internos de legs_data
                const tramos = r.legs_data?.tramos || r.tramos || [];
                if (Array.isArray(tramos)) {
                    const matchTramo = tramos.find((t: any) =>
                        (t.origin_port_id?.toUpperCase() === o && t.destination_port_id?.toUpperCase() === d) ||
                        (t.origin_port_id?.toUpperCase() === d && t.destination_port_id?.toUpperCase() === o)
                    );
                    if (matchTramo) {
                        const dist = Number(matchTramo.route_distance || matchTramo.distance || 0);
                        const wfRaw = Number(matchTramo.weather_factor ?? 3.0);
                        const wfPct = wfRaw > 0 && wfRaw <= 1 ? (wfRaw * 100) : wfRaw;
                        if (dist > 0) {
                            return {
                                route_distance: dist,
                                weather_factor: wfPct > 0 ? wfPct : 3.0
                            };
                        }
                    }
                }

                // Verificar en registro directo origen/destino de la ruta
                if ((r.origin_port_id?.toUpperCase() === o && r.destination_port_id?.toUpperCase() === d) ||
                    (r.origin_port_id?.toUpperCase() === d && r.destination_port_id?.toUpperCase() === o)) {
                    const dist = Number(r.route_distance || r.distance || 0);
                    const wfRaw = type === 'LADEN'
                        ? (r.weather_factor_laden ?? r.weather_factor ?? 3.0)
                        : (r.weather_factor_ballast ?? r.weather_factor ?? 3.0);
                    const wfPct = wfRaw > 0 && wfRaw <= 1 ? (wfRaw * 100) : wfRaw;
                    if (dist > 0) {
                        return {
                            route_distance: dist,
                            weather_factor: wfPct > 0 ? wfPct : 3.0
                        };
                    }
                }
            }
        }

        // 2. Fallback: Matriz estandarizada par-a-par entre puertos
        const pairKey = `${o}_${d}`;
        const fallbackDist = PAIRWISE_PORT_DISTANCES[pairKey] || 0;

        return {
            route_distance: fallbackDist,
            weather_factor: 3.0
        };
    }
}
