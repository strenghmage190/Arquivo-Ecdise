import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg, #0b0c10)',
          color: 'var(--text-primary, #f1f5f9)',
          fontFamily: 'var(--font-system, monospace)',
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4, 16px)',
          boxSizing: 'border-box',
          letterSpacing: '0.12em',
        }}
      >
        VERIFICANDO CREDENCIAIS...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
