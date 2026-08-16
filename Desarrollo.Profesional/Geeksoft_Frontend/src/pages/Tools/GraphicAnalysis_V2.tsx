import React from 'react';
import { InteractiveChart } from '../../components/CommercialForecast/InteractiveChart';
import { useForecastContext_V2 } from '../../context/ForecastContext_V2';

export const GraphicAnalysis_V2: React.FC = () => {
    const context = useForecastContext_V2();

    const hasData = context.data && context.data.aggregated_data && typeof context.data.aggregated_data === 'object' && Object.keys(context.data.aggregated_data).length > 0;


    return (
        <section className="flex flex-col flex-1 gap-2 relative mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full min-h-[600px]">
            {context.forecastName && (
                <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 z-[9999] bg-sky-50 border border-sky-200 py-1 px-3 rounded-md shadow-md pointer-events-none select-none">
                    <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5 leading-none">
                        <span>📁</span> Escenario Activo: {context.forecastName}
                    </span>
                </div>
            )}

            {context.loading && !hasData ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-slate-700 font-bold text-base">Cargando Análisis Gráfico...</p>
                    <p className="text-slate-400 text-xs mt-1">Calculando simulación de {context.forecastName || 'Escenario'}</p>
                </div>
            ) : !hasData ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-200 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
                        📈
                    </div>
                    <h3 className="text-base font-black text-slate-800 mb-1 uppercase tracking-tight">Análisis Gráfico en Blanco</h3>
                    <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                        No hay un escenario cargado en la sesión. Agrega líneas en la Matriz Financiera o haz clic en <strong>"Cargar"</strong> para inyectar un escenario guardado.
                    </p>
                </div>
            ) : (
                <InteractiveChart 
                    data={context.data} 
                    months={context.dynamicMonths || []}
                    demurragePct={context.demurragePct || ''}
                    showDemurrage={context.showDemurrage || false}
                    excludedDemurrages={context.excludedDemurrages || []}
                    customDemurrages={context.customDemurrages || {}}
                />
            )}
        </section>
    );
};

