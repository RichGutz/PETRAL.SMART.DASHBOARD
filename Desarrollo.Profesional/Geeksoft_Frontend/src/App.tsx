
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CommercialForecast } from './pages/CommercialForecast/CommercialForecast';
import { VesselsMaster } from './pages/Masters/VesselsMaster';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/dashboard" element={<CommercialForecast />} />
          <Route path="/vessels" element={<VesselsMaster />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
