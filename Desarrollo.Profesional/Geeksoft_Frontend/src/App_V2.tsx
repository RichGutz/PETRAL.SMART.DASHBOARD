import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ForecastProvider_V2 } from './context/ForecastContext_V2';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { UserPermissions } from './context/AuthContext';

import { ToolsLayout_V2 } from './layouts/ToolsLayout_V2';

import { FinancialMatrix_V2 } from './pages/Tools/FinancialMatrix_V2';
import { GraphicAnalysis_V2 } from './pages/Tools/GraphicAnalysis_V2';
import { SpaghettiMap_V2 } from './pages/Tools/SpaghettiMap_V2';
import { AuditLedger_V2 } from './pages/Tools/AuditLedger_V2';
import { AuditEngine_V2 } from './pages/Tools/AuditEngine_V2';
import { AuditFinal_V2 } from './pages/Tools/AuditFinal_V2';
import { MultiCotizador_V2 } from './pages/Tools/MultiCotizador_V2';
import { SystemFlowchartViewer_V2 } from './pages/Tools/SystemFlowchartViewer_V2';


import { VesselsMaster } from './pages/Masters/VesselsMaster_V2';
import { RoutesMaster } from './pages/Masters/RoutesMaster_V2';
import { RouteMaster_V2 } from './components/Masters/RouteMaster_V2';
import { ClientsMaster } from './pages/Masters/ClientsMaster_V2';
import { ContractsMaster } from './pages/Masters/ContractsMaster_V2';
import { PortsMaster_V2 } from './pages/Masters/PortsMaster_V2';
import { PortCostsMaster_V2 } from './pages/Masters/PortCostsMaster_V2';
import { PortTariffsMaster } from './pages/Masters/PortTariffsMaster';
import { SourcesSinksMaster_V2 } from './pages/Masters/SourcesSinksMaster_V2';
import { BunkerMaster } from './pages/Masters/BunkerMaster';
import { Login } from './pages/Auth/Login';
import { UsersPermissions } from './pages/Auth/UsersPermissions';

// Componente para proteger rutas privadas y validar permisos específicos
const ProtectedRoute = ({ 
    children, 
    module,
    requiredAccess = 'Visor',
    requireAdmin = false
}: { 
    children: React.ReactNode;
    module?: keyof UserPermissions;
    requiredAccess?: 'Editor' | 'Visor';
    requireAdmin?: boolean;
}) => {
    const { user, isAuthenticated, hasPermission, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }
    
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }
    
    if (requireAdmin && user.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }
    
    if (module && !hasPermission(module, requiredAccess)) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
};

function App_V2() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AuthProvider>
          <ForecastProvider_V2>
            <Routes>
              {/* Ruta Pública de Login */}
              <Route path="/login" element={<Login />} />
              
              {/* Maestros Protegidos */}
              <Route path="/vessels" element={<ProtectedRoute module="maestro_buques"><VesselsMaster /></ProtectedRoute>} />
              <Route path="/routes" element={<ProtectedRoute module="maestro_rutas"><RoutesMaster /></ProtectedRoute>} />
              <Route path="/spot-routes" element={<ProtectedRoute module="maestro_rutas"><RouteMaster_V2 mode="routes" /></ProtectedRoute>} />
              <Route path="/quotes" element={<ProtectedRoute module="maestro_rutas"><RouteMaster_V2 mode="quotes" /></ProtectedRoute>} />


              <Route path="/clients" element={<ProtectedRoute module="maestro_tarifas"><ClientsMaster /></ProtectedRoute>} />
              <Route path="/contracts" element={<ProtectedRoute module="maestro_contratos"><ContractsMaster /></ProtectedRoute>} />
              <Route path="/ports" element={<ProtectedRoute module="maestro_puertos"><PortsMaster_V2 /></ProtectedRoute>} />
              <Route path="/port-costs" element={<ProtectedRoute module="maestro_costos_agencia"><PortCostsMaster_V2 /></ProtectedRoute>} />
              <Route path="/port-tariffs" element={<ProtectedRoute module="maestro_costos_agencia"><PortTariffsMaster /></ProtectedRoute>} />
              <Route path="/sources-sinks" element={<ProtectedRoute module="maestro_rutas"><SourcesSinksMaster_V2 /></ProtectedRoute>} />
              <Route path="/bunker-prices" element={<ProtectedRoute module="maestro_bunker"><BunkerMaster /></ProtectedRoute>} />
              
              {/* Herramientas Protegidas (Ribbon via ToolsLayout) */}
              <Route element={<ProtectedRoute><ToolsLayout_V2 /></ProtectedRoute>}>
                  <Route path="/multicotizador" element={<ProtectedRoute module="multicotizador_spot"><MultiCotizador_V2 /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute module="matriz_financiera"><FinancialMatrix_V2 /></ProtectedRoute>} />
                  <Route path="/graphic-analysis" element={<ProtectedRoute module="matriz_financiera"><GraphicAnalysis_V2 /></ProtectedRoute>} />
                  <Route path="/spaghetti-map" element={<ProtectedRoute module="matriz_financiera"><SpaghettiMap_V2 /></ProtectedRoute>} />
                  <Route path="/audit-ledger" element={<ProtectedRoute module="matriz_financiera"><AuditLedger_V2 /></ProtectedRoute>} />
                  <Route path="/audit-engine" element={<ProtectedRoute module="matriz_financiera"><AuditEngine_V2 /></ProtectedRoute>} />
                  <Route path="/audit-final" element={<ProtectedRoute module="matriz_financiera"><AuditFinal_V2 /></ProtectedRoute>} />
                  <Route path="/system-flowchart" element={<ProtectedRoute><SystemFlowchartViewer_V2 /></ProtectedRoute>} />
              </Route>

              
              {/* Panel de Gestión de Usuarios y Roles (Sólo ADMIN) */}
              <Route path="/users" element={<ProtectedRoute requireAdmin={true}><UsersPermissions /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ForecastProvider_V2>
        </AuthProvider>
      </div>
    </Router>
  );
}

export default App_V2;
