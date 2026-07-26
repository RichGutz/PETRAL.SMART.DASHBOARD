import React, { useState, useEffect } from 'react';
import { LiquidationsInteractiveChart } from '../../components/CommercialForecast/LiquidationsInteractiveChart';
import { ForecastService } from '../../services/api';
import { BarChart3, Loader2, Database } from 'lucide-react';

export const LiquidationsGraphicAnalysis_V2: React.FC = () => {
    const [liquidations, setLiquidations] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLiquidations = async () => {
            try {
                setLoading(true);
                const data = await ForecastService.getVoyageLiquidations();
                setLiquidations(data || []);
            } catch (err) {
                console.error("Error al cargar liquidaciones reales:", err);
                setError("No se pudieron cargar los datos de liquidaciones reales desde Supabase.");
            } finally {
                setLoading(false);
            }
        };

        fetchLiquidations();
    }, []);

    return (
        <section className="flex flex-col flex-1 gap-4 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-full">
            
            {/* Cabecera del Módulo */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
                        <BarChart3 size={22} />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">ANÁLISIS GRÁFICO DE LIQUIDACIONES REALES</h2>
                        <p className="text-[11px] text-slate-500 font-medium">Visualización de rentabilidad por ruta, flete e indicadores clave (P/L &amp; TCE Real) de la flota propia</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                    <Database size={15} className="text-emerald-600" />
                    <span>{liquidations.length} Viajes Auditados en Supabase</span>
                </div>
            </div>

            {/* Estado de Carga o Error */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-80 bg-white rounded-xl border border-slate-200 space-y-3">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                    <p className="text-xs font-bold text-slate-600">Cargando 31 viajes de ejecuciones reales desde Supabase DB...</p>
                </div>
            ) : error ? (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold">
                    {error}
                </div>
            ) : (
                <LiquidationsInteractiveChart liquidations={liquidations} />
            )}

        </section>
    );
};
