import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';


function App() {

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute >
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<AuthPage />} />
            
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
export default App;

