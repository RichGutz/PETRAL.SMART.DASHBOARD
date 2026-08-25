/**
 * Servicio Especializado en Perfiles y Registros de Demurrage (Estadías Históricas, Promedios y Modos P/M/C)
 * Almacenamiento local persistente con fallback a data histórica oficial (161 recaladas).
 * Integración bidireccional con Excel (.xlsx).
 */

import * as XLSX from 'xlsx';
import initialHistoricalData from '../../data/historicalDemurrageData.json';

export interface DemurragePortData {
    hours: number;
    days: number;
}

export interface DemurrageRecord {
    id: string;
    client: string;
    year: number;
    month: number; // 1 - 12
    date: string; // YYYY-MM-DD
    vessel: string;
    voyage: number;
    ports: Record<string, DemurragePortData>; // Key: port_id (ILO, CALLAO, MARCONA, MATARANI, MEJILLONES, etc.)
    total_hours: number;
    total_days: number;
}

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
    voyage_count: number;
}

const STORAGE_KEY = 'petral_demurrage_records_v1';

export class PortDemurrageRatesService {

    public static MONTH_KEYS = [
        'm01', 'm02', 'm03', 'm04', 'm05', 'm06',
        'm07', 'm08', 'm09', 'm10', 'm11', 'm12'
    ];

    public static STANDARD_PORTS = [
        { id: 'ILO', label: 'Puerto ILO' },
        { id: 'CALLAO', label: 'Callao' },
        { id: 'MARCONA', label: 'Marcona' },
        { id: 'MATARANI', label: 'Matarani' },
        { id: 'MEJILLONES', label: 'Mejillones' }
    ];

    /**
     * Normaliza el ID o nombre del buque para coincidencias exactas.
     */
    public static normalizeVesselKey(vesselId: string): string {
        const clean = (vesselId || '').toUpperCase().trim().replace(/^B\/T\s+/, '').replace(/\s+/g, ' ');
        if (clean.includes('BOMAR') || clean.includes('LYNX')) return 'MOQUEGUA';
        return clean;
    }

    /**
     * Normaliza el ID del puerto.
     */
    public static normalizePortKey(portId: string): string {
        const clean = (portId || '').toUpperCase().trim();
        if (clean.includes('ILO')) return 'ILO';
        if (clean.includes('CALLAO')) return 'CALLAO';
        if (clean.includes('MARCONA')) return 'MARCONA';
        if (clean.includes('MATARANI')) return 'MATARANI';
        if (clean.includes('MEJILLONES')) return 'MEJILLONES';
        return clean;
    }

    /**
     * Obtiene la lista completa de registros históricos de viajes.
     */
    public static getRecords(): DemurrageRecord[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Error leyendo demoras de localStorage:', e);
        }

        // Fallback a la data histórica sembrada
        const seedData = (initialHistoricalData || []) as unknown as DemurrageRecord[];
        this.saveRecords(seedData);
        return seedData;
    }

    /**
     * Sincroniza los registros desde Supabase (si hay conexión) y actualiza el caché local.
     */
    public static async syncFromBackend(): Promise<DemurrageRecord[]> {
        try {
            const { ForecastService } = await import('../api');
            const remoteData = await ForecastService.getDemurrageRecords();
            if (Array.isArray(remoteData) && remoteData.length > 0) {
                const mapped: DemurrageRecord[] = remoteData.map((row: any) => {
                    if (row.raw_json && typeof row.raw_json === 'object') {
                        return row.raw_json as DemurrageRecord;
                    }
                    return {
                        id: row.id,
                        client: row.client_name || 'PETRAL',
                        year: Number(row.year) || 2026,
                        month: Number(row.month) || 1,
                        date: row.date_str || `${row.year}-01-01`,
                        vessel: row.vessel_name || '',
                        voyage: Number(row.voyage_number) || 0,
                        ports: {
                            ILO: { hours: Number(row.ilo_hours) || 0, days: Number(row.ilo_days) || 0 },
                            CALLAO: { hours: Number(row.callao_hours) || 0, days: Number(row.callao_days) || 0 },
                            MARCONA: { hours: Number(row.marcona_hours) || 0, days: Number(row.marcona_days) || 0 },
                            MATARANI: { hours: Number(row.matarani_hours) || 0, days: Number(row.matarani_days) || 0 },
                            MEJILLONES: { hours: Number(row.mejillones_hours) || 0, days: Number(row.mejillones_days) || 0 }
                        },
                        total_hours: Number(row.total_hours) || 0,
                        total_days: Number(row.total_days) || 0
                    };
                });
                this.saveRecords(mapped, false);
                return mapped;
            }
        } catch (e) {
            console.warn('Sincronización remota de demoras no disponible, usando almacenamiento local:', e);
        }
        return this.getRecords();
    }

    /**
     * Guarda la lista de registros en localStorage y sincroniza con Supabase en segundo plano.
     */
    public static saveRecords(records: DemurrageRecord[], syncRemote: boolean = true): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            window.dispatchEvent(new Event('petral_demurrage_updated'));

            if (syncRemote) {
                // Sincronizar en segundo plano con Supabase
                import('../api').then(({ ForecastService }) => {
                    const payload = records.map(r => ({
                        id: r.id,
                        client_name: r.client || 'PETRAL',
                        year: r.year || 2026,
                        month: r.month || 1,
                        date_str: r.date || `${r.year}-01-01`,
                        vessel_name: r.vessel || '',
                        voyage_number: r.voyage || 0,
                        ilo_hours: r.ports?.ILO?.hours || 0,
                        ilo_days: r.ports?.ILO?.days || 0,
                        callao_hours: r.ports?.CALLAO?.hours || 0,
                        callao_days: r.ports?.CALLAO?.days || 0,
                        marcona_hours: r.ports?.MARCONA?.hours || 0,
                        marcona_days: r.ports?.MARCONA?.days || 0,
                        matarani_hours: r.ports?.MATARANI?.hours || 0,
                        matarani_days: r.ports?.MATARANI?.days || 0,
                        mejillones_hours: r.ports?.MEJILLONES?.hours || 0,
                        mejillones_days: r.ports?.MEJILLONES?.days || 0,
                        total_hours: r.total_hours || 0,
                        total_days: r.total_days || 0,
                        raw_json: r
                    }));
                    ForecastService.saveDemurrageRecords(payload).catch(err => {
                        console.warn('Error guardando demoras en Supabase:', err);
                    });
                }).catch(() => {});
            }
        } catch (e) {
            console.error('Error guardando demoras en localStorage:', e);
        }
    }

    /**
     * Restaura los registros a la base de datos histórica original de 161 viajes.
     */
    public static resetToDefault(): DemurrageRecord[] {
        const seedData = (initialHistoricalData || []) as unknown as DemurrageRecord[];
        this.saveRecords(seedData);
        return seedData;
    }

    /**
     * Agrega o actualiza un registro individual de viaje.
     */
    public static upsertRecord(record: DemurrageRecord): DemurrageRecord[] {
        const records = this.getRecords();
        const index = records.findIndex(r => r.id === record.id);
        if (index >= 0) {
            records[index] = record;
        } else {
            records.unshift(record);
        }
        this.saveRecords(records);
        return records;
    }

    /**
     * Elimina un registro de viaje.
     */
    public static deleteRecord(id: string): DemurrageRecord[] {
        const records = this.getRecords().filter(r => r.id !== id);
        this.saveRecords(records);
        return records;
    }

    /**
     * Calcula los perfiles consolidados por par (Buque, Puerto) en memoria a partir de los viajes.
     * Aplica la Regla de Negocio Oficial:
     * 1. Ventana móvil de los últimos 24 meses.
     * 2. Despachos (valores negativos) se computan como 0.00 en la suma (sin dispatch contractual).
     * 3. Cada recalada (incluyendo las de demora <= 0) suma al conteo del denominador para diluir el promedio.
     */
    public static getDemurrageProfile(
        portId: string,
        vesselId: string,
        customRecords?: DemurrageRecord[],
        monthsWindow: number = 24
    ): PortVesselDemurrageProfile & {
        raw_annual_average?: number;
        negative_count?: number;
        max_days?: number;
        min_days?: number;
        median_days?: number;
        yearly_breakdown?: Record<number, { sum: number; count: number; avg: number; median: number }>;
    } {
        const cleanPort = this.normalizePortKey(portId);
        const cleanVessel = this.normalizeVesselKey(vesselId);
        const allRecords = customRecords || this.getRecords();

        const defaultMonths: Record<string, number> = {
            m01: 0, m02: 0, m03: 0, m04: 0, m05: 0, m06: 0,
            m07: 0, m08: 0, m09: 0, m10: 0, m11: 0, m12: 0
        };

        if (!cleanPort) {
            return {
                port_id: cleanPort,
                vessel_id: cleanVessel,
                months: defaultMonths as any,
                annual_average: 0,
                voyage_count: 0
            };
        }

        // 1. Filtrar viajes donde haya tocado el puerto (a nivel de forecast general por PUERTO)
        const matchingVoyagesRaw = allRecords.filter(r => {
            const hasPort = r.ports && r.ports[cleanPort] !== undefined && r.ports[cleanPort].days !== undefined;
            return hasPort;
        });

        if (matchingVoyagesRaw.length === 0) {
            return {
                port_id: cleanPort,
                vessel_id: cleanVessel,
                months: defaultMonths as any,
                annual_average: 0,
                voyage_count: 0
            };
        }

        // 2. Determinar ventana de los últimos 24 meses
        let maxYearMonth = 0;
        matchingVoyagesRaw.forEach(r => {
            const ym = (r.year || 2026) * 12 + (r.month >= 1 && r.month <= 12 ? r.month : 1);
            if (ym > maxYearMonth) maxYearMonth = ym;
        });
        const minYearMonthCutoff = maxYearMonth > 0 ? (maxYearMonth - monthsWindow + 1) : 0;

        const matchingVoyages = matchingVoyagesRaw.filter(r => {
            const ym = (r.year || 2026) * 12 + (r.month >= 1 && r.month <= 12 ? r.month : 1);
            return ym >= minYearMonthCutoff;
        });

        // 3. Agrupar días por mes (1-12) y acumular
        const monthSums: Record<number, { sum: number; count: number }> = {};
        for (let m = 1; m <= 12; m++) {
            monthSums[m] = { sum: 0, count: 0 };
        }

        let totalDaysSum = 0;
        let totalRawDaysSum = 0;
        let totalPortTouches = 0;
        let negativeCount = 0;
        let maxDays = 0;
        let minDays = Infinity;
        const allEffectiveDays: number[] = [];
        const yearlyValues: Record<number, number[]> = {};

        matchingVoyages.forEach(r => {
            const portInfo = r.ports[cleanPort];
            const rawDays = Number(portInfo?.days) || 0;
            // Regla de Negocio: Todo valor negativo se computa como 0.00 en la suma
            const effectiveDays = Math.max(0, rawDays);
            const mNum = r.month >= 1 && r.month <= 12 ? r.month : 1;
            const yNum = r.year || 2026;

            if (rawDays < 0) negativeCount += 1;
            if (effectiveDays > maxDays) maxDays = effectiveDays;
            if (effectiveDays < minDays) minDays = effectiveDays;

            allEffectiveDays.push(effectiveDays);
            if (!yearlyValues[yNum]) yearlyValues[yNum] = [];
            yearlyValues[yNum].push(effectiveDays);

            monthSums[mNum].sum += effectiveDays;
            monthSums[mNum].count += 1;

            totalDaysSum += effectiveDays;
            totalRawDaysSum += rawDays;
            totalPortTouches += 1;
        });

        // Función helper para mediana exacta
        const calcMedian = (values: number[]): number => {
            if (!values || values.length === 0) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            if (sorted.length % 2 !== 0) {
                return Number(sorted[mid].toFixed(2));
            }
            return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
        };

        const overallMedian = calcMedian(allEffectiveDays);

        // Desglose por año con Promedio y Mediana
        const yearlyBreakdown: Record<number, { sum: number; count: number; avg: number; median: number }> = {};
        Object.keys(yearlyValues).forEach(yStr => {
            const y = Number(yStr);
            const vals = yearlyValues[y];
            const sum = vals.reduce((a, b) => a + b, 0);
            yearlyBreakdown[y] = {
                sum: Number(sum.toFixed(2)),
                count: vals.length,
                avg: Number((sum / vals.length).toFixed(2)),
                median: calcMedian(vals)
            };
        });

        const monthsResult = { ...defaultMonths };
        const overallAverage = totalPortTouches > 0 ? Number((totalDaysSum / totalPortTouches).toFixed(2)) : 0;
        const rawAverage = totalPortTouches > 0 ? Number((totalRawDaysSum / totalPortTouches).toFixed(2)) : 0;

        for (let m = 1; m <= 12; m++) {
            const mKey = `m${String(m).padStart(2, '0')}`;
            if (monthSums[m].count > 0) {
                monthsResult[mKey] = Number((monthSums[m].sum / monthSums[m].count).toFixed(2));
            } else {
                monthsResult[mKey] = overallAverage;
            }
        }

        return {
            port_id: cleanPort,
            vessel_id: cleanVessel,
            months: monthsResult as any,
            annual_average: overallAverage,
            raw_annual_average: rawAverage,
            voyage_count: totalPortTouches,
            negative_count: negativeCount,
            max_days: maxDays,
            min_days: minDays === Infinity ? 0 : minDays,
            median_days: overallMedian,
            yearly_breakdown: yearlyBreakdown
        };
    }

    /**
     * Resuelve el valor de Demurrage (en días) según el modo:
     * - 'O' = Original de la cotización cargada (si trae demoras guardadas, sino fallback a 'P')
     * - 'P' = Promedio Histórico Móvil 24 Meses (Negativos = 0.00 con dilución de recalada por PUERTO)
     * - 'C' = Cero estricto (0.00 d, permite sobreescritura manual libre)
     * - 'M' = (Compatibilidad legacy) Devuelve promedio o mes
     */
    public static resolveDemurrageDays(
        portId: string,
        vesselId: string = '',
        mode: 'O' | 'P' | 'M' | 'C' | string = 'P',
        dateString?: string | undefined | null,
        originalDays?: number | string | null
    ): number {
        if (mode === 'C') {
            return 0;
        }

        if (mode === 'O') {
            if (originalDays !== undefined && originalDays !== '' && originalDays !== null) {
                const num = Number(originalDays);
                if (!isNaN(num)) return num;
            }
        }

        const profile = this.getDemurrageProfile(portId, vesselId);

        if (mode === 'P' || mode === 'O') {
            return profile.annual_average;
        }

        if (mode === 'M') {
            // Modo M (legacy): Determinar mes de la fecha
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

        return profile.annual_average;
    }

    /**
     * Exporta todos los registros históricos a un archivo Excel (.xlsx) estándar y editable.
     */
    public static exportToExcel(recordsToExport?: DemurrageRecord[]): void {
        const records = recordsToExport || this.getRecords();

        const headers = [
            'Cliente', 'Año', 'Mes', 'Nave', 'Viaje',
            'Puerto ILO (Horas)', 'Callao (Horas)', 'Marcona (Horas)', 'Matarani (Horas)', 'Mejillones (Horas)', 'Total Horas',
            'Puerto ILO (Días)', 'Callao (Días)', 'Marcona (Días)', 'Matarani (Días)', 'Mejillones (Días)', 'Total Días'
        ];

        const rows = records.map(r => {
            const iloH = r.ports?.ILO?.hours ?? '';
            const calH = r.ports?.CALLAO?.hours ?? '';
            const marH = r.ports?.MARCONA?.hours ?? '';
            const matH = r.ports?.MATARANI?.hours ?? '';
            const mejH = r.ports?.MEJILLONES?.hours ?? '';

            const iloD = r.ports?.ILO?.days ?? '';
            const calD = r.ports?.CALLAO?.days ?? '';
            const marD = r.ports?.MARCONA?.days ?? '';
            const matD = r.ports?.MATARANI?.days ?? '';
            const mejD = r.ports?.MEJILLONES?.days ?? '';

            return [
                r.client || 'PETRAL',
                r.year || 2026,
                r.date || `${r.year}-01-01`,
                r.vessel || '',
                r.voyage || '',
                iloH, calH, marH, matH, mejH, r.total_hours || 0,
                iloD, calD, marD, matD, mejD, r.total_days || 0
            ];
        });

        const worksheetData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Ajuste de ancho de columnas
        ws['!cols'] = [
            { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 16 }, { wch: 8 },
            { wch: 18 }, { wch: 15 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
            { wch: 18 }, { wch: 15 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Demoras_Historicas');

        const now = new Date();
        const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
        const fileName = `Demoras_Historicas_Petral_${dateStr}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    /**
     * Importa y parsea un archivo Excel (.xlsx o .xls) cargado por el usuario.
     */
    public static async importFromExcel(file: File): Promise<{ success: boolean; count: number; error?: string }> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (!jsonData || jsonData.length < 2) {
                        return resolve({ success: false, count: 0, error: 'El archivo Excel está vacío o no contiene filas de datos.' });
                    }

                    // Encontrar fila de encabezados
                    let headerRowIndex = 0;
                    for (let r = 0; r < Math.min(5, jsonData.length); r++) {
                        const rowStr = (jsonData[r] || []).join(' ').toLowerCase();
                        if (rowStr.includes('cliente') && (rowStr.includes('nave') || rowStr.includes('buque') || rowStr.includes('viaje'))) {
                            headerRowIndex = r;
                            break;
                        }
                    }

                    const _rawHeaders = (jsonData[headerRowIndex] || []).map(h => String(h || '').trim().toLowerCase());
                    void _rawHeaders;
                    const dataRows = jsonData.slice(headerRowIndex + 1);

                    const parsedRecords: DemurrageRecord[] = [];

                    dataRows.forEach((row, idx) => {
                        if (!row || row.length === 0) return;
                        
                        const clientVal = String(row[0] || '').trim();
                        if (!clientVal || clientVal.toLowerCase().includes('promedio') || clientVal.toLowerCase().includes('total')) {
                            return;
                        }

                        const yearVal = parseInt(String(row[1] || '2026'), 10) || 2026;
                        const dateValRaw = row[2];
                        let monthVal = 1;
                        let dateStr = `${yearVal}-01-01`;

                        if (dateValRaw instanceof Date) {
                            monthVal = dateValRaw.getMonth() + 1;
                            dateStr = dateValRaw.toISOString().slice(0, 10);
                        } else if (typeof dateValRaw === 'string' && dateValRaw.includes('-')) {
                            dateStr = dateValRaw;
                            const parts = dateValRaw.split('-');
                            if (parts.length >= 2) monthVal = parseInt(parts[1], 10) || 1;
                        } else if (typeof dateValRaw === 'number') {
                            // Excel serial date
                            try {
                                const parsedDate = new Date((dateValRaw - (25567 + 2)) * 86400 * 1000);
                                if (!isNaN(parsedDate.getTime())) {
                                    monthVal = parsedDate.getMonth() + 1;
                                    dateStr = parsedDate.toISOString().slice(0, 10);
                                }
                            } catch {}
                        }

                        const vesselVal = String(row[3] || '').trim();
                        if (!vesselVal) return;

                        const voyageVal = parseInt(String(row[4] || '0'), 10) || 0;

                        // Puertos y valores (Horas en cols 5-9 o Días en cols 11-15)
                        const portMap: Record<string, DemurragePortData> = {};
                        let sumHrs = 0;
                        let sumDays = 0;

                        const portColIndices = [
                            { key: 'ILO', hrsCol: 5, daysCol: 11 },
                            { key: 'CALLAO', hrsCol: 6, daysCol: 12 },
                            { key: 'MARCONA', hrsCol: 7, daysCol: 13 },
                            { key: 'MATARANI', hrsCol: 8, daysCol: 14 },
                            { key: 'MEJILLONES', hrsCol: 9, daysCol: 15 }
                        ];

                        portColIndices.forEach(p => {
                            const rawH = row[p.hrsCol];
                            const rawD = row[p.daysCol];

                            let h: number | null = (rawH !== undefined && rawH !== null && rawH !== '') ? parseFloat(String(rawH)) : null;
                            let d: number | null = (rawD !== undefined && rawD !== null && rawD !== '') ? parseFloat(String(rawD)) : null;

                            if (h !== null || d !== null) {
                                const finalH = roundNum(h !== null ? h : (d !== null ? d * 24 : 0), 2);
                                const finalD = roundNum(d !== null ? d : (h !== null ? h / 24 : 0), 4);
                                portMap[p.key] = {
                                    hours: finalH,
                                    days: finalD
                                };
                                sumHrs += finalH;
                                sumDays += finalD;
                            }
                        });

                        parsedRecords.push({
                            id: `${vesselVal}_${voyageVal}_${yearVal}_${idx}_${Date.now()}`,
                            client: clientVal,
                            year: yearVal,
                            month: monthVal,
                            date: dateStr,
                            vessel: vesselVal,
                            voyage: voyageVal,
                            ports: portMap,
                            total_hours: roundNum(sumHrs, 2),
                            total_days: roundNum(sumDays, 4)
                        });
                    });

                    if (parsedRecords.length === 0) {
                        return resolve({ success: false, count: 0, error: 'No se encontraron filas de viajes válidas para importar.' });
                    }

                    // Guardar y sincronizar
                    this.saveRecords(parsedRecords);
                    return resolve({ success: true, count: parsedRecords.length });
                } catch (err: any) {
                    console.error('Error al procesar archivo Excel:', err);
                    return resolve({ success: false, count: 0, error: err?.message || 'Error desconocido al procesar Excel' });
                }
            };
            reader.onerror = () => {
                resolve({ success: false, count: 0, error: 'Error de lectura del archivo' });
            };
            reader.readAsArrayBuffer(file);
        });
    }
}

function roundNum(val: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round((val + Number.EPSILON) * factor) / factor;
}
