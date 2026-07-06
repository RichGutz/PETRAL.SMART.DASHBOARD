import React, { useState, useEffect } from 'react';
import type { SourceSink } from './useSpaghettiData';

interface SourcesSinksEditorProps {
    portId: string;
    portName: string;
    sourcesSinks: SourceSink[];
    onClose: () => void;
    onSave: (updatedData: SourceSink[]) => void;
}

export const SourcesSinksEditor: React.FC<SourcesSinksEditorProps> = ({
    portName,
    sourcesSinks,
    onClose,
    onSave
}) => {
    const [localData, setLocalData] = useState<SourceSink[]>([]);

    useEffect(() => {
        // Copia profunda para editar en memoria
        setLocalData(JSON.parse(JSON.stringify(sourcesSinks)));
    }, [sourcesSinks]);

    const handleChange = (index: number, field: keyof SourceSink, value: any) => {
        const newData = [...localData];
        newData[index] = { ...newData[index], [field]: value };
        setLocalData(newData);
    };

    const handleSave = () => {
        onSave(localData);
    };

    return (
        <div className="absolute top-0 right-0 w-[350px] h-full bg-white shadow-[-5px_0_25px_rgba(0,0,0,0.1)] z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex flex-col">
                    <span className="text-[10px] text-petral-teal uppercase font-bold tracking-widest">Sources & Sinks</span>
                    <span className="text-lg font-bold text-petral-blue">{portName}</span>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-200 rounded-full transition-colors focus:outline-none"
                    title="Cerrar"
                >
                    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {localData.length === 0 ? (
                    <div className="text-center text-sm text-slate-400 mt-10 italic">
                        No hay empresas operando en este puerto para el año seleccionado.
                    </div>
                ) : (
                    localData.map((ss, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: ss.color_hex || '#94A3B8' }}
                                />
                                <span className="text-sm font-bold text-slate-700">{ss.empresa || 'Market'}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 items-center">
                                <div className="flex flex-col">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Producto</label>
                                    <input 
                                        type="text"
                                        value={ss.producto || ''}
                                        onChange={(e) => handleChange(idx, 'producto', e.target.value)}
                                        className="text-xs p-1.5 border border-slate-200 rounded focus:border-petral-teal focus:outline-none bg-slate-50 w-full"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Capacidad (MT)</label>
                                    <input 
                                        type="number"
                                        value={ss.capacity_mt || 0}
                                        onChange={(e) => handleChange(idx, 'capacity_mt', parseFloat(e.target.value) || 0)}
                                        className="text-xs p-1.5 border border-slate-200 rounded focus:border-petral-teal focus:outline-none w-full font-mono text-right"
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 py-2 px-4 border border-slate-300 text-sm font-bold text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="flex-1 py-2 px-4 bg-petral-teal text-white text-sm font-bold rounded-lg hover:bg-teal-500 transition-colors shadow-sm"
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
};
