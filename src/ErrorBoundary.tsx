import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100dvh',
            width: '100%',
            background: 'var(--bg, #0b0c10)',
            color: 'var(--text-primary, #f1f5f9)',
            fontFamily: 'var(--font-system, monospace)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4, 16px)',
            zIndex: 'var(--z-toasts, 4000)',
            position: 'fixed',
            inset: 0,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              width: 'min(94vw, 680px)',
              background: 'var(--surface, #11141b)',
              border: '1px solid var(--institutional-red, #e63946)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: 'clamp(16px, 4vw, 32px)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 0 12px',
                color: 'var(--institutional-red, #e63946)',
                fontSize: 'var(--font-size-lg, 1.25rem)',
                textTransform: 'uppercase',
              }}
            >
              <AlertTriangle size={20} aria-hidden="true" />
              <span>Falha de Execução — C.R.I.S.</span>
            </h2>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary, #94a3b8)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>
              Ocorreu um erro inesperado na interface. Recarregue a página para restaurar a sessão.
            </p>
            <details style={{ marginBottom: '20px' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--el-conhecimento, #eab308)', fontSize: 'var(--font-size-sm, 0.875rem)' }}>
                Detalhes do erro
              </summary>
              <pre
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'var(--bg, #0b0c10)',
                  border: '1px solid var(--border, #29313d)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                  maxHeight: '40dvh',
                  fontSize: '12px',
                  color: '#fca5a5',
                }}
              >
                {this.state.error?.toString()}
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-ordo btn-ordo-primary control-md"
            >
              <RefreshCw size={15} aria-hidden="true" />
              <span>Recarregar Sistema</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
