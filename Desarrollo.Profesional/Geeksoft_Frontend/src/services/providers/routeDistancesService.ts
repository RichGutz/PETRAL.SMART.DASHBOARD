export interface AutoRouteInfo {
    route_distance: number | string;
    weather_factor: number | string;
}

// Matriz estandarizada y canónica de distancias náuticas en NM entre pares de puertos sudamericanos
// Fuente de Verdad: Tabla PostgreSQL `distances` central de PETRAL ONE
const PAIRWISE_PORT_DISTANCES: Record<string, number> = {
    // --- PISCO PLUSPETROL & PUERTOS PERUANOS ---
    'PISCO PLUSPETROL_ILO': 409,
    'ILO_PISCO PLUSPETROL': 409,
    'PISCO_PLUSPETROL_ILO': 409,
    'ILO_PISCO_PLUSPETROL': 409,
    'CALLAO_PISCO PLUSPETROL': 131,
    'PISCO PLUSPETROL_CALLAO': 131,
    'CALLAO_PISCO_PLUSPETROL': 131,
    'PISCO_PLUSPETROL_CALLAO': 131,
    'MARCONA_PISCO PLUSPETROL': 149,
    'PISCO PLUSPETROL_MARCONA': 149,
    'MATARANI_PISCO PLUSPETROL': 352,
    'PISCO PLUSPETROL_MATARANI': 352,
    'MOLLENDO MONTE AZUL_PISCO PLUSPETROL': 365,
    'PISCO PLUSPETROL_MOLLENDO MONTE AZUL': 365,
    'MEJILLONES_PISCO PLUSPETROL': 675,
    'PISCO PLUSPETROL_MEJILLONES': 675,
    'BARQUITO_PISCO PLUSPETROL': 843,
    'PISCO PLUSPETROL_BARQUITO': 843,
    'PISCO PLUSPETROL_TALARA': 648,
    'TALARA_PISCO PLUSPETROL': 648,
    'BAYOVAR_PISCO PLUSPETROL': 585,
    'PISCO PLUSPETROL_BAYOVAR': 585,
    'PISCO PLUSPETROL_SALAVERRY': 377,
    'SALAVERRY_PISCO PLUSPETROL': 377,
    'MANTA_PISCO PLUSPETROL': 887,
    'PISCO PLUSPETROL_MANTA': 887,

    // --- PARES CANÓNICOS PRINCIPALES ---
    'ILO_CALLAO': 512,
    'CALLAO_ILO': 512,
    'CALLAO_MATARANI': 455,
    'MATARANI_CALLAO': 455,
    'MATARANI_ILO': 69,
    'ILO_MATARANI': 69,
    'CALLAO_MARCONA': 252,
    'MARCONA_CALLAO': 252,
    'MARCONA_ILO': 279,
    'ILO_MARCONA': 279,
    'MARCONA_MATARANI': 223,
    'MATARANI_MARCONA': 223,
    'ILO_MEJILLONES': 334,
    'MEJILLONES_ILO': 334,
    'CALLAO_MEJILLONES': 778,
    'MEJILLONES_CALLAO': 778,
    'MATARANI_MEJILLONES': 380,
    'MEJILLONES_MATARANI': 380,
    'MEJILLONES_CONCON': 520,
    'CONCON_MEJILLONES': 520,
    'CALLAO_CONCON': 1289,
    'CONCON_CALLAO': 1289,
    'ILO_CONCON': 850,
    'CONCON_ILO': 850,
    'CALLAO_BARQUITO': 946,
    'BARQUITO_CALLAO': 946,
    'ILO_BARQUITO': 531,
    'BARQUITO_ILO': 531,
    'BARQUITO_MEJILLONES': 222,
    'MEJILLONES_BARQUITO': 222,
    'BARQUITO_MATARANI': 572,
    'MATARANI_BARQUITO': 572,
    'BARQUITO_MARCONA': 720,
    'MARCONA_BARQUITO': 720,

    // --- MOLLENDO MONTE AZUL ---
    'ILO_MOLLENDO MONTE AZUL': 60,
    'MOLLENDO MONTE AZUL_ILO': 60,
    'MATARANI_MOLLENDO MONTE AZUL': 24,
    'MOLLENDO MONTE AZUL_MATARANI': 24,
    'CALLAO_MOLLENDO MONTE AZUL': 467,
    'MOLLENDO MONTE AZUL_CALLAO': 467,
    'MARCONA_MOLLENDO MONTE AZUL': 235,
    'MOLLENDO MONTE AZUL_MARCONA': 235,
    'MEJILLONES_MOLLENDO MONTE AZUL': 373,
    'MOLLENDO MONTE AZUL_MEJILLONES': 373,
    'BARQUITO_MOLLENDO MONTE AZUL': 567,
    'MOLLENDO MONTE AZUL_BARQUITO': 567,

    // --- NORTE DEL PERÚ & ECUADOR ---
    'TALARA_MANTA': 261,
    'MANTA_TALARA': 261,
    'BAYOVAR_MANTA': 329,
    'MANTA_BAYOVAR': 329,
    'SALAVERRY_MANTA': 529,
    'MANTA_SALAVERRY': 529,
    'CALLAO_MANTA': 772,
    'MANTA_CALLAO': 772,
    'MARCONA_MANTA': 1006,
    'MANTA_MARCONA': 1006,
    'MATARANI_MANTA': 1209,
    'MANTA_MATARANI': 1209,
    'ILO_MANTA': 1266,
    'MANTA_ILO': 1266,
    'MEJILLONES_MANTA': 1532,
    'MANTA_MEJILLONES': 1532,
    'BARQUITO_MANTA': 1697,
    'MANTA_BARQUITO': 1697,

    'BAYOVAR_TALARA': 90,
    'TALARA_BAYOVAR': 90,
    'SALAVERRY_TALARA': 290,
    'TALARA_SALAVERRY': 290,
    'CALLAO_TALARA': 533,
    'TALARA_CALLAO': 533,
    'MARCONA_TALARA': 767,
    'TALARA_MARCONA': 767,
    'MATARANI_TALARA': 970,
    'TALARA_MATARANI': 970,
    'ILO_TALARA': 1027,
    'TALARA_ILO': 1027,
    'MEJILLONES_TALARA': 1293,
    'TALARA_MEJILLONES': 1293,
    'BARQUITO_TALARA': 1458,
    'TALARA_BARQUITO': 1458,

    'BAYOVAR_SALAVERRY': 226,
    'SALAVERRY_BAYOVAR': 226,
    'BAYOVAR_CALLAO': 469,
    'CALLAO_BAYOVAR': 469,
    'BAYOVAR_MARCONA': 704,
    'MARCONA_BAYOVAR': 704,
    'BAYOVAR_MATARANI': 907,
    'MATARANI_BAYOVAR': 907,
    'BAYOVAR_ILO': 964,
    'ILO_BAYOVAR': 964,
    'BAYOVAR_MEJILLONES': 1230,
    'MEJILLONES_BAYOVAR': 1230,
    'BAYOVAR_BARQUITO': 1394,
    'BARQUITO_BAYOVAR': 1394,

    'CALLAO_SALAVERRY': 261,
    'SALAVERRY_CALLAO': 261,
    'MARCONA_SALAVERRY': 497,
    'SALAVERRY_MARCONA': 497,
    'MATARANI_SALAVERRY': 701,
    'SALAVERRY_MATARANI': 701,
    'ILO_SALAVERRY': 757,
    'SALAVERRY_ILO': 757,
    'MEJILLONES_SALAVERRY': 1024,
    'SALAVERRY_MEJILLONES': 1024,
    'BARQUITO_SALAVERRY': 1191,
    'SALAVERRY_BARQUITO': 1191
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
