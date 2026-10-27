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
    'SALAVERRY_BARQUITO': 1191,

    // --- CONO SUR & ATLÁNTICO (CHILE / ARGENTINA / BRASIL) ---
    'ANCUD_CALLAO': 1816,
    'CALLAO_ANCUD': 1816,
    'ANCUD_ILO': 1466,
    'ILO_ANCUD': 1466,
    'ANCUD_POSESION': 987,
    'POSESION_ANCUD': 987,
    'ILO_POSESION': 1466,
    'POSESION_ILO': 1466,
    'ANCUD_RIO_GRANDE': 1451,
    'RIO_GRANDE_ANCUD': 1451,
    'POSESION_RIO_GRANDE': 1451,
    'RIO_GRANDE_POSESION': 1451,
    'POSESION_SAN_LORENZO': 1539,
    'SAN_LORENZO_POSESION': 1539,
    'MEJILLONES_RIO_GRANDE': 3573,
    'RIO_GRANDE_MEJILLONES': 3573
};

interface DistanceEntry {
    distance: number;
    weatherLaden: number;
    weatherBallast: number;
}

export class RouteDistancesService {
    private static distanceMatrixCache: any[] = [];
    private static distanceMatrixIndex: Map<string, DistanceEntry> = new Map();

    /**
     * Normaliza un identificador o nombre de puerto para eliminar etiquetas de país tipo '(CL)', '(PE)',
     * acentos, espacios múltiples y estandarizar guiones bajos.
     */
    public static normalizePort(port: any): string {
        if (!port) return '';
        return String(port)
            .replace(/\s*\([^)]*\)\s*/g, '') // Quita (CL), (PE), (BR), (AR), etc.
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/g, '_');        // Estandariza espacios o guiones a '_'
    }

    /**
     * Almacena e indexa bidireccionalmente la matriz oficial de distancias (tabla `distances`).
     */
    public static setDistanceMatrix(matrix: any[]): void {
        if (!Array.isArray(matrix)) return;
        this.distanceMatrixCache = matrix;
        this.distanceMatrixIndex.clear();

        for (const row of matrix) {
            if (!row) continue;
            const rawA = row.port_a || row.origin_port_id || row.p_a || '';
            const rawB = row.port_b || row.destination_port_id || row.p_b || '';
            const pA = this.normalizePort(rawA);
            const pB = this.normalizePort(rawB);

            if (!pA || !pB || pA === pB) continue;

            const dist = Number(row.route_distance ?? row.distance ?? 0);
            const wfLaden = Number(row.weather_factor_laden ?? row.weather_factor ?? 0.03);
            const wfBallast = Number(row.weather_factor_ballast ?? row.weather_factor ?? 0.03);

            const entry: DistanceEntry = {
                distance: dist,
                weatherLaden: wfLaden,
                weatherBallast: wfBallast
            };

            // Indexar en ambas direcciones (Matriz No Dirigida Simétrica)
            this.distanceMatrixIndex.set(`${pA}__${pB}`, entry);
            this.distanceMatrixIndex.set(`${pB}__${pA}`, entry);
        }
    }

    /**
     * Obtiene la matriz de distancias en caché.
     */
    public static getDistanceMatrix(): any[] {
        return this.distanceMatrixCache;
    }

    /**
     * Resuelve de forma inteligente (Smart Distance Bridge) la distancia en millas náuticas y el factor de clima.
     * Prioridad 1: Matriz de Distancias Oficial viva (`distances`) indexada bidireccionalmente.
     * Prioridad 2: Tramos customizados en cotizaciones comerciales (`routesList` / `legs_data.tramos`).
     * Prioridad 3: Catálogo estandarizado estático (`PAIRWISE_PORT_DISTANCES`).
     */
    public static resolveAutoRouteInfo(
        originPortId: string,
        destPortId: string,
        type: 'BALLAST' | 'LADEN',
        routesList?: any[],
        distanceMatrix?: any[]
    ): AutoRouteInfo {
        if (!originPortId || !destPortId) {
            return { route_distance: 0, weather_factor: 3.0 };
        }

        // Si se provee una matriz nueva, actualizar el índice reactivo
        if (distanceMatrix && Array.isArray(distanceMatrix) && distanceMatrix.length > 0) {
            if (this.distanceMatrixCache !== distanceMatrix) {
                this.setDistanceMatrix(distanceMatrix);
            }
        }

        const o = this.normalizePort(originPortId);
        const d = this.normalizePort(destPortId);

        if (!o || !d || o === d) {
            return { route_distance: 0, weather_factor: 3.0 };
        }

        // =========================================================================
        // TIER 1: Búsqueda O(1) en el Maestro de Distancias Oficial (`distances`)
        // =========================================================================
        const key = `${o}__${d}`;
        const matchMaster = this.distanceMatrixIndex.get(key);
        if (matchMaster && matchMaster.distance > 0) {
            const wfRaw = type === 'LADEN' ? matchMaster.weatherLaden : matchMaster.weatherBallast;
            const wfPct = wfRaw > 0 && wfRaw <= 1 ? (wfRaw * 100) : wfRaw;
            return {
                route_distance: matchMaster.distance,
                weather_factor: wfPct > 0 ? wfPct : 3.0
            };
        }

        // =========================================================================
        // TIER 2: Búsqueda en rutas máster de clientes / cotizaciones previas
        // =========================================================================
        if (routesList && Array.isArray(routesList)) {
            for (const r of routesList) {
                // Verificar en tramos internos de legs_data
                const tramos = r.legs_data?.tramos || r.tramos || [];
                if (Array.isArray(tramos)) {
                    const matchTramo = tramos.find((t: any) => {
                        const tOrig = RouteDistancesService.normalizePort(t.origin_port_id);
                        const tDest = RouteDistancesService.normalizePort(t.destination_port_id);
                        return (tOrig === o && tDest === d) || (tOrig === d && tDest === o);
                    });
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
                const rOrig = RouteDistancesService.normalizePort(r.origin_port_id);
                const rDest = RouteDistancesService.normalizePort(r.destination_port_id);
                if ((rOrig === o && rDest === d) || (rOrig === d && rDest === o)) {
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

        // =========================================================================
        // TIER 3: Fallback estandarizado en catálogo par-a-par estático
        // =========================================================================
        const fallbackKey = `${o}_${d}`;
        const fallbackDist = PAIRWISE_PORT_DISTANCES[fallbackKey] || 0;

        return {
            route_distance: fallbackDist,
            weather_factor: 3.0
        };
    }
}
