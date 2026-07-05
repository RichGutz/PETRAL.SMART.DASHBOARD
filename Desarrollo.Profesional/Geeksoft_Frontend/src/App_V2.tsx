import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ForecastProvider_V2 } from './context/ForecastContext_V2';
import { ToolsLayout_V2 } from './layouts/ToolsLayout_V2';

import { FinancialMatrix_V2 } from './pages/Tools/FinancialMatrix_V2';
import { GraphicAnalysis_V2 } from './pages/Tools/GraphicAnalysis_V2';
import { SpaghettiMap_V2 } from './pages/Tools/SpaghettiMap_V2';
import { AuditLedger_V2 } from './pages/Tools/AuditLedger_V2';
import { AuditEngine_V2 } from './pages/Tools/AuditEngine_V2';

import { VesselsMaster } from './pages/Masters/VesselsMaster_V2';
import { RoutesMaster } from './pages/Masters/RoutesMaster_V2';
import { ClientsMaster } from './pages/Masters/ClientsMaster_V2';
import { ContractsMaster } from './pages/Masters/ContractsMaster_V2';
import { MasterTemplate } from './components/Masters/MasterTemplate_V2';

// Placeholder component for routes that don't exist yet
const PlaceholderPage = ({ title, activeTab }: { title: string, activeTab: string }) => (
    <MasterTemplate title={title} subtitle="Módulo en construcción" activeTab={activeTab}>
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 font-semibold gap-2 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <span className="text-4xl">🚧</span>
            <span>Este módulo ({title}) está en desarrollo.</span>
        </div>
    </MasterTemplate>
);

function App_V2() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <ForecastProvider_V2>
          <Routes>
            {/* Maestros */}
            <Route path="/vessels" element={<VesselsMaster />} />
            <Route path="/routes" element={<RoutesMaster />} />
            <Route path="/clients" element={<ClientsMaster />} />
            <Route path="/contracts" element={<ContractsMaster />} />
            <Route path="/ports" element={<PlaceholderPage title="Maestro de Puertos" activeTab="ports" />} />
            
            {/* Herramientas (Comparten el estado y el Ribbon via ToolsLayout) */}
            <Route element={<ToolsLayout_V2 />}>
                <Route path="/dashboard" element={<FinancialMatrix_V2 />} />
                <Route path="/graphic-analysis" element={<GraphicAnalysis_V2 />} />
                <Route path="/spaghetti-map" element={<SpaghettiMap_V2 />} />
                <Route path="/audit-ledger" element={<AuditLedger_V2 />} />
                <Route path="/audit-engine" element={<AuditEngine_V2 />} />
            </Route>
            
            {/* Usuarios */}
            <Route path="/users" element={<PlaceholderPage title="Gestión de Usuarios" activeTab="users" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ForecastProvider_V2>
      </div>
    </Router>
  );
}

export default App_V2;
