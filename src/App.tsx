import React, { useState } from 'react';
import { useIsMobile } from './hooks/useIsMobile';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import InvestigationPage from './pages/Investigation';
import InvitePage from './pages/Invite';
import MobileTestPage from './pages/MobileTestPage';
import SystemOverlays from './components/ui/SystemOverlays';
import BottomNavigationBar from './components/BottomNavigationBar';
import ForensicBenchmarkPage from './pages/__dev/ForensicBenchmarkPage';
// ConnectionLine removed for production layout
import { Toaster } from 'react-hot-toast';

type EvidenceCardProps = {
  title: string;
  description?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onConnect?: () => void;
};

const EvidenceCard: React.FC<EvidenceCardProps> = ({ title, description, onEdit, onDelete, onConnect }) => {
  return (
    <div className="evidence-card">
      <div className="evidence-card-content">
        <h3 className="evidence-card-title">{title}</h3>
        {description && <p className="evidence-card-description">{description}</p>}
      </div>
      <div className="evidence-card-actions">
        {onEdit && <button onClick={onEdit}>Edit</button>}
        {onDelete && <button onClick={onDelete}>Delete</button>}
        {onConnect && <button onClick={onConnect}>Connect</button>}
      </div>
    </div>
  );
};

type InspectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  children?: React.ReactNode;
};

const InspectionModal: React.FC<InspectionModalProps> = ({ isOpen, onClose, onSave, children }) => {
  if (!isOpen) return null;
  return (
    <div className="inspection-modal-backdrop">
      <div className="inspection-modal">
        <div className="inspection-modal-body">{children}</div>
        <div className="inspection-modal-actions">
          <button onClick={onClose}>Close</button>
          {onSave && <button onClick={onSave}>Save</button>}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [interactionMode, setInteractionMode] = useState<'pan' | 'edit'>('pan');
  const isMobile = useIsMobile();
  React.useEffect(() => {
    try {
      if (isMobile) document.body.classList.add('mobile-mode');
      else document.body.classList.remove('mobile-mode');
    } catch (e) { /* ignore server */ }
    return () => {};
  }, [isMobile]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Test route removed - developer test page not included in production */}

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
            {process.env.NODE_ENV !== 'production' && (
              <Route path="/__dev/forensic-benchmark" element={<ForensicBenchmarkPage />} />
            )}
          </Routes>
          </div>
          <SystemOverlays />
      </BrowserRouter>
      {/* Interaction toggle moved into mobile-only FAB in this file; removed global hand button */}
      <BottomNavigationBar />
      <Toaster 
        position={isMobile ? "bottom-center" : "bottom-right"} 
        containerStyle={{
          bottom: isMobile ? 80 : 20, // Above the Bottom Bar on mobile
        }}
      />
      {/* Board container removed - example cards were for demo */}
      {isMobile && (
        <button 
          className="fab-toggle-mode" 
          onClick={() => setInteractionMode(prev => prev === 'pan' ? 'edit' : 'pan')}
        >
          {interactionMode === 'pan' ? '🖐️' : '✏️'}
        </button>
      )}
    </AuthProvider>
  );
}

export default App;
