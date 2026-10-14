import React, { useState, useEffect } from 'react';
import { Bookmark, CheckCircle2 } from 'lucide-react';

interface MofValidationCardProps {
    roleId: string;
    roleCode: string;
    personName: string;
    themeMode: 'white' | 'sepia' | 'dark';
}

interface StoredMofValidation {
    status: 'homologado' | 'ajuste' | 'ampliacion';
    notes: string;
    updatedAt: string;
}

export const MofValidationCard_V2: React.FC<MofValidationCardProps> = ({
    roleId,
    roleCode,
    personName,
    themeMode
}) => {
    const [savedData, setSavedData] = useState<{ [key: string]: StoredMofValidation }>({});
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('petral_mof_validations_v2');
            if (raw) {
                setSavedData(JSON.parse(raw));
            }
        } catch (e) {
            console.error('Error cargando validaciones de MOF:', e);
        }
    }, []);

    const currentValidation: StoredMofValidation = savedData[roleId] || {
        status: 'homologado',
        notes: '',
        updatedAt: ''
    };

    const handleUpdate = (status: 'homologado' | 'ajuste' | 'ampliacion', notes: string) => {
        const updated: StoredMofValidation = {
            status,
            notes,
            updatedAt: new Date().toLocaleString('es-PE')
        };
        const allData = { ...savedData, [roleId]: updated };
        setSavedData(allData);

        try {
            localStorage.setItem('petral_mof_validations_v2', JSON.stringify(allData));
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (e) {
            console.error('Error guardando validación MOF:', e);
        }
    };

    const cardBg = themeMode === 'sepia'
        ? 'bg-[#f4ecd8]/60 border-[#decbb0]'
        : themeMode === 'dark'
            ? 'bg-slate-800/60 border-slate-700'
            : 'bg-slate-50 border-slate-200';

    const inputBg = themeMode === 'sepia'
        ? 'bg-[#fbf0d9] border-[#decbb0] text-[#433422] focus:border-amber-700'
        : themeMode === 'dark'
            ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500'
            : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600';

    return (
        <div className={`mt-10 pt-6 border-t-2 border-dashed ${themeMode === 'dark' ? 'border-slate-700' : 'border-slate-300'} no-print`}>
            <div className={`border rounded-xl p-5 sm:p-6 transition-all ${cardBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <Bookmark size={16} className={themeMode === 'sepia' ? 'text-amber-800' : 'text-blue-600'} />
                        <h4 className="text-xs font-black uppercase tracking-wider font-sans">
                            Cédula de Homologación &amp; Certificación de Funciones MOF
                        </h4>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">
                        Código Puesto: {roleCode} • {personName}
                    </span>
                </div>

                <p className="text-xs opacity-75 mb-4 font-sans leading-relaxed">
                    Espacio reservado para la Gerencia General y Recursos Humanos para certificar las responsabilidades, alcance del cargo y competencias exigidas en el marco de la gobernanza corporativa de Naviera Petral S.A.
                </p>

                {/* Opciones de Estado */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer text-emerald-700 dark:text-emerald-400">
                        <input
                            type="radio"
                            name={`mof_status_${roleId}`}
                            value="homologado"
                            checked={currentValidation.status === 'homologado'}
                            onChange={(e) => handleUpdate(e.target.value as any, currentValidation.notes)}
                            className="accent-emerald-600"
                        />
                        <span>Perfil 100% Homologado &amp; Certificado</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-amber-700 dark:text-amber-400">
                        <input
                            type="radio"
                            name={`mof_status_${roleId}`}
                            value="ajuste"
                            checked={currentValidation.status === 'ajuste'}
                            onChange={(e) => handleUpdate(e.target.value as any, currentValidation.notes)}
                            className="accent-amber-600"
                        />
                        <span>Requiere Ajuste de Responsabilidades</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-blue-700 dark:text-blue-400">
                        <input
                            type="radio"
                            name={`mof_status_${roleId}`}
                            value="ampliacion"
                            checked={currentValidation.status === 'ampliacion'}
                            onChange={(e) => handleUpdate(e.target.value as any, currentValidation.notes)}
                            className="accent-blue-600"
                        />
                        <span>Requiere Actualización de Permisos ERP</span>
                    </label>
                </div>

                {/* Textarea para Anotaciones */}
                <div className="space-y-1.5 mb-3">
                    <label className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                        Observaciones de Dirección &amp; Acuerdos de Gestión:
                    </label>
                    <textarea
                        rows={3}
                        value={currentValidation.notes}
                        onChange={(e) => handleUpdate(currentValidation.status, e.target.value)}
                        placeholder="Escriba aquí los comentarios de auditoría interna, ajustes de KPIs o disposiciones de gerencia..."
                        className={`w-full p-2.5 rounded-lg border text-xs font-sans focus:outline-none focus:ring-1 transition-all ${inputBg}`}
                    />
                </div>

                {/* Footer de la Cédula */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        {saveSuccess && (
                            <>
                                <CheckCircle2 size={13} />
                                <span>Certificación de puesto guardada localmente</span>
                            </>
                        )}
                        {!saveSuccess && currentValidation.updatedAt && (
                            <span className="opacity-60">Última revisión registrada: {currentValidation.updatedAt}</span>
                        )}
                    </div>
                    <div className="opacity-60">
                        Dirección de Gestión Humana • NAVIERA PETRAL S.A.
                    </div>
                </div>
            </div>
        </div>
    );
};
