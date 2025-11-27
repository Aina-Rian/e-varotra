import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthPage } from './pages/AuthPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LandingPage } from './pages/LandingPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { ProtectedRoute } from './components/ProtectedRoute';

import { useAuth } from './hooks/useAuth';
import { useRoles } from './hooks/useRoles';

function App() {

  const { user } = useAuth();
  const { role } = useRoles();


  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : role === 'liver' ? (
                  <Navigate to="/seller" replace />
                ) : role === 'deliver' ? (
                  <Navigate to="/delivery" replace />
                ) : role === 'visitor' ? (
                  <LandingPage />
                ) : null
              ) : (
                <LandingPage />
              )
            }
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller"
            element={
              <ProtectedRoute requireSeller>
                <SellerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery"
            element={
              <ProtectedRoute requireDeliver>
                <DeliveryPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
export default App;

