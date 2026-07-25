import React from 'react';
import { FileText, Clock, ArrowDown, ArrowUp } from 'lucide-react';

export interface PdfScenario {
  id: string;
  title: string;
  cost_usd: number;
  level: 'NIVEL BAJO' | 'NIVEL ALTO';
  schedule_type: string;
  audit_trail?: Array<{
    category: string;
    concept: string;
    supplier: string;
    formula_evaluated: string;
    amount_usd: number;
  }>;
}

interface PxQPdfQuadViewerProps {
  portId: string;
  vesselName: string;
  cargoTons: number;
  costMinUsd?: number;
  costMaxUsd?: number;
  costAveragedUsd: number;
  scenarios: PdfScenario[];
  onSelectScenario?: (scenario: PdfScenario) => void;
}

export const PxQPdfQuadViewer: React.FC<PxQPdfQuadViewerProps> = ({
  portId,
  vesselName,
  cargoTons,
  costAveragedUsd,
  scenarios,
  onSelectScenario,
}) => {

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-2xl space-y-6">
      {/* Header Resumen */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/80 border border-slate-700/80 p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              Proforma P×Q Promediada
            </span>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {portId.toUpperCase()} — {vesselName} ({cargoTons.toLocaleString()} MT)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulación dual de 4 escenarios (Carga/Descarga Mínima vs Máxima) para resolver fecha y hora.
          </p>
        </div>

        {/* Badge Promedio Destacado */}
        <div className="bg-emerald-950/80 border border-emerald-500/40 px-4 py-2 rounded-lg text-right">
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
            Costo Matriz Financiera (Promedio)
          </span>
          <span className="text-2xl font-black text-emerald-300 font-mono">
            ${costAveragedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-emerald-400">USD</span>
          </span>
        </div>
      </div>

      {/* Grilla 2 Filas x 2 Columnas de 4 PDFs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scen) => {
          const isMin = scen.level === 'NIVEL BAJO';
          return (
            <div
              key={scen.id}
              onClick={() => onSelectScenario && onSelectScenario(scen)}
              className={`cursor-pointer transition-all duration-200 border rounded-lg p-4 relative overflow-hidden group hover:scale-[1.01] ${
                isMin
                  ? 'bg-slate-950/90 border-blue-500/40 hover:border-blue-400 hover:shadow-blue-500/10'
                  : 'bg-slate-950/90 border-amber-500/40 hover:border-amber-400 hover:shadow-amber-500/10'
              }`}
            >
              {/* Header Card con Badge de Nivel */}
              <div className="flex justify-between items-start gap-2 mb-3">
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded border flex items-center gap-1 ${
                    isMin
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isMin ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                  {scen.level}
                </span>

                <span className="text-xs font-mono font-medium text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> {scen.schedule_type}
                </span>
              </div>

              {/* Título Oficial del Acta PDF */}
              <h4 className="text-sm font-semibold text-slate-200 mb-2 leading-snug font-sans group-hover:text-white">
                {scen.title}
              </h4>

              {/* Total USD Escenario */}
              <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <FileText size={14} className={isMin ? 'text-blue-400' : 'text-amber-400'} />
                  Generar Acta PDF
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  ${scen.cost_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
