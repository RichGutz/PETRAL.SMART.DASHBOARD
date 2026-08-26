import React from 'react';
import { useForecastContext_V2 } from '../../../context/ForecastContext_V2';
import { FinancialMatrixGridTable } from './FinancialMatrixGridTable';
import { FinancialMatrixNavitransoGridTable } from './FinancialMatrixNavitransoGridTable';

export const FinancialMatrixMainContainer: React.FC = () => {
    const { data, dynamicMonths, projectionLines, loading, matrixFormat } = useForecastContext_V2();

    return (
        <section className="flex flex-col gap-2 relative animate-in fade-in duration-300 min-h-0 flex-1">
            {/* Indicator of simulation loading */}
            {loading && (
                <div className="bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-between animate-pulse">
                    <span>⚡ Simulando escenario en tiempo real con el motor unificado...</span>
                    <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Grilla Tabular Interactiva: Formato PETRAL vs Formato NAVITRANSO */}
            {matrixFormat === 'NAVITRANSO' ? (
                <FinancialMatrixNavitransoGridTable
                    data={data}
                    months={dynamicMonths}
                    projectionLines={projectionLines}
                />
            ) : (
                <FinancialMatrixGridTable
                    data={data}
                    months={dynamicMonths}
                    projectionLines={projectionLines}
                />
            )}
        </section>
    );
};

