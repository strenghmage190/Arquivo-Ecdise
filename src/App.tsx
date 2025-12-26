import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import InvestigationPage from './pages/Investigation';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/case/:id"
              element={
                <ProtectedRoute>
                  <InvestigationPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
