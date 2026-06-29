
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CommercialForecast } from './pages/CommercialForecast/CommercialForecast';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/dashboard" element={<CommercialForecast />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
