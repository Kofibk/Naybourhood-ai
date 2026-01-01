import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import LeadsPage from './pages/LeadsPage';
import CampaignsPage from './pages/CampaignsPage';
import { CompaniesPage, UsersPage, SettingsPage, AnalyticsPage, BillingPage } from './pages/AdminPages';
import { DeveloperDashboard, AgentDashboard, BrokerDashboard } from './pages/UserDashboards';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// App Routes
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
      <Route path="/admin/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute><CompaniesPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Developer Routes */}
      <Route path="/developer" element={<ProtectedRoute><DeveloperDashboard /></ProtectedRoute>} />
      <Route path="/developer/*" element={<ProtectedRoute><DeveloperDashboard /></ProtectedRoute>} />

      {/* Agent Routes */}
      <Route path="/agent" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
      <Route path="/agent/*" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />

      {/* Broker Routes */}
      <Route path="/broker" element={<ProtectedRoute><BrokerDashboard /></ProtectedRoute>} />
      <Route path="/broker/*" element={<ProtectedRoute><BrokerDashboard /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
