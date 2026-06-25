import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface InteractiveChartProps {
    data: any;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ data }) => {
    const options = useMemo(() => {
        if (!data || !data.aggregated_data) return {};

        const months = new Set<string>();
        const seriesData: { [vessel: string]: number[] } = {};

        // Extract Time Series for Voyage Result per Vessel
        Object.values(data.aggregated_data).forEach((routes: any) => {
            Object.values(routes).forEach((vessels: any) => {
                Object.entries(vessels).forEach(([vessel, mData]: any) => {
                    if (!seriesData[vessel]) seriesData[vessel] = [];
                    
                    Object.entries(mData).forEach(([month, metrics]: any) => {
                        months.add(month);
                        seriesData[vessel].push(metrics.voyage_result);
                    });
                });
            });
        });

        const xAxisData = Array.from(months).sort();

        const series = Object.entries(seriesData).map(([name, data]) => ({
            name,
            type: 'line',
            smooth: true,
            symbolSize: 8,
            data,
            lineStyle: { width: 3 }
        }));

        return {
            title: {
                text: 'Proyección Voyage Result (USD)',
                left: 'center',
                textStyle: { color: '#1e293b', fontWeight: 600 }
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => {
                    let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
                    params.forEach((p: any) => {
                        tooltip += `${p.marker} ${p.seriesName}: $${Math.round(p.value).toLocaleString()}<br/>`;
                    });
                    return tooltip;
                }
            },
            legend: {
                bottom: 0,
                icon: 'circle'
            },
            grid: {
                left: '5%',
                right: '5%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: xAxisData,
                axisLine: { lineStyle: { color: '#94a3b8' } }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
            },
            series,
            color: ['#0D9488', '#1E40AF', '#3B82F6', '#10B981'] // Tailwind colors
        };
    }, [data]);

    return (
        <div className="w-full bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
            <ReactECharts option={options} style={{ height: '400px', width: '100%' }} />
        </div>
    );
};
