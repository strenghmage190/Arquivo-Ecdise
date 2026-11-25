import React, { useState, lazy, Suspense } from 'react';
import { useIsMobile } from './hooks/useIsMobile';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Home = lazy(() => import('./pages/Home'));
const InvestigationPage = lazy(() => import('./pages/Investigation'));
const InvitePage = lazy(() => import('./pages/Invite'));
const MobileTestPage = lazy(() => import('./pages/MobileTestPage'));
const SystemOverlays = lazy(() => import('./components/ui/SystemOverlays'));
const BottomNavigationBar = lazy(() => import('./components/BottomNavigationBar'));
const ForensicBenchmarkPage = lazy(() => import('./pages/__dev/ForensicBenchmarkPage'));
// ConnectionLine removed for production layout
import { Pencil } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';

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

const ForensicLoader: React.FC<{ message?: string }> = ({ message = 'INICIALIZANDO SISTEMA FORENSE...' }) => (
  <div className="min-h-screen bg-[#05080a] flex flex-col items-center justify-center text-emerald-400 font-mono p-4 select-none">
    <div className="relative flex items-center justify-center mb-6">
      <div className="w-16 h-16 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
      <div className="absolute w-8 h-8 border border-emerald-500/40 border-b-emerald-300 rounded-full animate-ping" />
      <div className="absolute text-[10px] tracking-widest text-emerald-300 font-bold">C.R.I.S.</div>
    </div>
    <div className="text-xs uppercase tracking-[0.25em] text-emerald-400 mb-2 font-bold animate-pulse">
      [ ORDO REALITAS // PROTOCOLO FORENSE ]
    </div>
    <div className="text-[13px] tracking-wider text-emerald-200/80 max-w-xs text-center font-mono">
      {message}
    </div>
    <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-500/60">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span>SINCRONIZANDO REGISTROS CLASSIFICADOS</span>
    </div>
  </div>
);

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
          <Suspense fallback={<ForensicLoader />}>
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
          </Suspense>
          </div>
          <Suspense fallback={null}>
            <SystemOverlays />
          </Suspense>
      </BrowserRouter>
      {/* Interaction toggle moved into mobile-only FAB in this file; removed global hand button */}
      <Suspense fallback={null}>
        <BottomNavigationBar />
      </Suspense>
      <Toaster 
        position={isMobile ? "bottom-center" : "bottom-right"} 
        containerStyle={{
          bottom: isMobile ? 80 : 20, // Above the Bottom Bar on mobile
        }}
      />
      <SonnerToaster richColors theme="dark" position="top-right" />
      {/* Board container removed - example cards were for demo */}
      {isMobile && (
        <button 
          className="fab-toggle-mode" 
          onClick={() => setInteractionMode(prev => prev === 'pan' ? 'edit' : 'pan')}
        >
          {interactionMode === 'pan' ? '' : <Pencil size={15} />}
        </button>
      )}
    </AuthProvider>
  );
}

export default App;
