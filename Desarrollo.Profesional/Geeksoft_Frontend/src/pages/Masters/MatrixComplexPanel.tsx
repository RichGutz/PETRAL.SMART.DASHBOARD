import React from "react";
import { CallaoAuditViewer } from "../../components/Masters/CallaoAuditViewer";

interface MatrixComplexPanelProps {
    ports: any[];
    activePortId: string;
    setActivePortId: (id: string) => void;
}

export const MatrixComplexPanel: React.FC<MatrixComplexPanelProps> = () => {
    return (
        <div className="flex flex-col bg-slate-100 rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
            <div className="flex-1 p-4 overflow-hidden bg-slate-100">
                <CallaoAuditViewer />
            </div>
        </div>
    );
};
