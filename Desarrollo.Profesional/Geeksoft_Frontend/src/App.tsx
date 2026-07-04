import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CommercialForecast } from './pages/CommercialForecast/CommercialForecast';
import { VesselsMaster } from './pages/Masters/VesselsMaster';
import { RoutesMaster } from './pages/Masters/RoutesMaster';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/dashboard" element={<CommercialForecast />} />
          <Route path="/vessels" element={<VesselsMaster />} />
          <Route path="/routes" element={<RoutesMaster />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
