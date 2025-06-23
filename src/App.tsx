import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import ClientsPage from './pages/Clients';
import TradesPage from './pages/Trades';
import { Toaster } from 'sonner';
import AuthGuard from './components/auth/AuthGuard';
import LoginPage from './pages/Login';
import SignUpPage from './pages/SignUp';
import DashboardPage from './pages/Dashboard';

function ProtectedRoutes() {
  return (
    <AuthGuard>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/trades" element={<TradesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    </AuthGuard>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </Router>
  );
}

export default App;
