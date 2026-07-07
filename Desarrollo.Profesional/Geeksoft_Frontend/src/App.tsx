import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CommercialForecast } from './pages/CommercialForecast/CommercialForecast';
import { VesselsMaster } from './pages/Masters/VesselsMaster';
import { RoutesMaster } from './pages/Masters/RoutesMaster';
import { ClientsMaster } from './pages/Masters/ClientsMaster';
import { ContractsMaster } from './pages/Masters/ContractsMaster';
import { PortsMaster_V2 } from './pages/Masters/PortsMaster_V2';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/dashboard" element={<CommercialForecast />} />
          <Route path="/vessels" element={<VesselsMaster />} />
          <Route path="/routes" element={<RoutesMaster />} />
          <Route path="/clients" element={<ClientsMaster />} />
          <Route path="/contracts" element={<ContractsMaster />} />
          <Route path="/ports" element={<PortsMaster_V2 />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
