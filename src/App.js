import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import AICoach from './pages/AICoach';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';

function App() {
  useEffect(() => {
    fetch("https://YOUR_RENDER_URL/actuator/health")
      .catch(() => {}); // silent fail — just waking up
  }, []);
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index          element={<Dashboard />} />
          <Route path="expenses"  element={<Expenses />}  />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports"   element={<Reports />}   />
          <Route path="aicoach"   element={<AICoach />}   />
          <Route path="settings"  element={<Settings />}  />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;