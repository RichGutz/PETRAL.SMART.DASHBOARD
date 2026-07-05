import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CommercialForecast } from './pages/CommercialForecast/CommercialForecast';
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
        <Routes>
          {/* Dashboard / Matriz Financiera */}
          <Route path="/dashboard" element={<CommercialForecast />} />
          
          {/* Maestros */}
          <Route path="/vessels" element={<VesselsMaster />} />
          <Route path="/routes" element={<RoutesMaster />} />
          <Route path="/clients" element={<ClientsMaster />} />
          <Route path="/contracts" element={<ContractsMaster />} />
          <Route path="/ports" element={<PlaceholderPage title="Maestro de Puertos" activeTab="ports" />} />
          
          {/* Herramientas */}
          <Route path="/graphic-analysis" element={<PlaceholderPage title="Análisis Gráfico" activeTab="graphic-analysis" />} />
          <Route path="/spaghetti-map" element={<PlaceholderPage title="Spaghetti Map" activeTab="spaghetti-map" />} />
          <Route path="/audit-ledger" element={<PlaceholderPage title="Auditoría Ledger" activeTab="audit-ledger" />} />
          <Route path="/audit-engine" element={<PlaceholderPage title="Auditoría Motor" activeTab="audit-engine" />} />
          
          {/* Usuarios */}
          <Route path="/users" element={<PlaceholderPage title="Gestión de Usuarios" activeTab="users" />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App_V2;
