import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import InvestigationPage from './pages/Investigation';
import InvitePage from './pages/Invite';
import TestPage from './pages/TestPage';
import MobileTestPage from './pages/MobileTestPage';
import SystemOverlays from './components/ui/SystemOverlays';
import MobileControls from './components/MobileControls';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/test" element={<TestPage />} />

            <Route path="/mobile-test" element={<MobileTestPage />} />

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

            <Route
              path="/invite/:inviteCode"
              element={
                <ProtectedRoute>
                  <InvitePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
          <SystemOverlays />
        <MobileControls />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
