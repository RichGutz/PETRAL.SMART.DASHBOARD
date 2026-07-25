import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertTriangle, ArrowLeftRight, Download, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';


export const PortCostsLiquidador: React.FC = () => {
  const [selectedVessel, setSelectedVessel] = useState<string>('BT MOQUEGUA');
  const [selectedPort, setSelectedPort] = useState<string>('CALLAO_APM');
  const [toleranceUsd, setToleranceUsd] = useState<number>(500);

  // Mock de liquidación real vs recálculo sistema
  const facturadoArmador = 16584.25;
  const calculadoSistema = 14938.34;
  const deltaUsd = facturadoArmador - calculadoSistema;
  const isApproved = Math.abs(deltaUsd) <= toleranceUsd;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header Herramienta */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-3 py-1 rounded-full font-bold uppercase">
              Auditoría Dual P×Q
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              🔍 Liquidador de Gastos Portuarios
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visor Split-View para conciliación y auditoría de facturas reales contra el recálculo P×Q del sistema.
          </p>
        </div>

        {/* Status de Tolerancia */}
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-lg border ${
            isApproved
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          {isApproved ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block">Veredicto Liquidación</span>
            <span className="text-lg font-bold">
              {isApproved ? '✅ APROBADO EN TOLERANCIA' : '⚠️ OBJETADO — SOLICITAR NOTA CRÉDITO'}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar Controles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div>
          <label className="text-xs text-slate-400 block mb-1 font-semibold">Buque Auditado</label>
          <select
            value={selectedVessel}
            onChange={(e) => setSelectedVessel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white font-mono"
          >
            <option value="BT MOQUEGUA">BT MOQUEGUA</option>
            <option value="BT TABLONES">BT TABLONES</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1 font-semibold">Puerto / Terminal</label>
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white font-mono"
          >
            <option value="CALLAO_APM">Callao (APM Terminals)</option>
            <option value="MATARANI_TISUR">Matarani (Tisur S.A.)</option>
            <option value="ILO_SPCC">Ilo (SPCC / Enapu)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1 font-semibold">Umbral Tolerancia (USD)</label>
          <input
            type="number"
            value={toleranceUsd}
            onChange={(e) => setToleranceUsd(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white font-mono"
          />
        </div>

        <div className="flex items-end">
          <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2">
            <Download size={16} /> Exportar Acta PDF
          </Button>
        </div>
      </div>

      {/* Visor Split-View (2 Paneles Paralelos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Izquierdo: PDF Factura Real Armador */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              📄 Factura Real Armador / Agente (PDF)
            </h3>
            <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
              Total Facturado: ${facturadoArmador.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </span>
          </div>

          <div className="h-[420px] bg-slate-950 border border-slate-800/80 rounded-lg flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <Eye size={40} className="mb-2 text-slate-600" />
            <p className="text-xs font-semibold text-slate-400">Visor de PDF Integrado (PDF.js)</p>
            <p className="text-[11px] text-slate-600 mt-1">Muestra la Factura/SOF original del armador en split-view.</p>
          </div>
        </div>

        {/* Panel Derecho: Matriz Recálculo PxQ Sistema */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ArrowLeftRight size={16} className="text-emerald-400" />
              📊 Matriz Recálculo Sistema P×Q
            </h3>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded">
              Calculado: ${calculadoSistema.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
            </span>
          </div>

          {/* Resumen Δ Divergencia */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Diferencia Neta (Δ Factor USD):</span>
              <span className={`font-mono font-bold ${deltaUsd > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {deltaUsd > 0 ? `+${deltaUsd.toFixed(2)}` : deltaUsd.toFixed(2)} USD
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Nivel Registrado en Acta:</span>
              <span className="font-mono font-semibold text-amber-300">[NIVEL BAJO - HORARIO ORDINARIO]</span>
            </div>
          </div>

          {/* Tabla de ítems auditados */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300 border-collapse">
              <thead className="bg-slate-800 text-slate-400 font-mono">
                <tr>
                  <th className="p-2 border border-slate-700">Concepto</th>
                  <th className="p-2 border border-slate-700 text-right">Facturado USD</th>
                  <th className="p-2 border border-slate-700 text-right">Sistema USD</th>
                  <th className="p-2 border border-slate-700 text-right">Δ (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                <tr>
                  <td className="p-2 border border-slate-800">Practicaje (IN + OUT)</td>
                  <td className="p-2 border border-slate-800 text-right">$1,800.00</td>
                  <td className="p-2 border border-slate-800 text-right">$1,500.00</td>
                  <td className="p-2 border border-slate-800 text-right text-rose-400">+$300.00</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-800">Remolcaje (Petranso)</td>
                  <td className="p-2 border border-slate-800 text-right">$3,800.00</td>
                  <td className="p-2 border border-slate-800 text-right">$3,200.00</td>
                  <td className="p-2 border border-slate-800 text-right text-rose-400">+$600.00</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-800">Muellaje APM Terminals</td>
                  <td className="p-2 border border-slate-800 text-right">$6,484.25</td>
                  <td className="p-2 border border-slate-800 text-right">$5,758.48</td>
                  <td className="p-2 border border-slate-800 text-right text-rose-400">+$725.77</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
