import { AlertTriangle, Search, RefreshCw } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            padding: 'clamp(16px, 4vw, 32px)',
            background: 'var(--surface, #11141b)',
            border: '1px solid var(--institutional-red, #e63946)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--text-primary, #f1f5f9)',
            fontFamily: 'var(--font-system, monospace)',
            margin: 'var(--space-4, 16px) auto',
            width: 'min(94vw, 720px)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75)',
          }}
        >
          <h2
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2, 8px)',
              color: 'var(--institutional-red, #e63946)',
              margin: '0 0 var(--space-3, 12px)',
              fontSize: 'var(--font-size-lg, 1.25rem)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <AlertTriangle size={20} aria-hidden="true" />
            <span>Erro Crítico do Sistema</span>
          </h2>
          <p
            style={{
              margin: '0 0 var(--space-4, 16px)',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              color: 'var(--text-secondary, #94a3b8)',
            }}
          >
            Uma falha inesperada foi detectada no módulo atual. Você pode tentar recuperar ou reiniciar a aplicação.
          </p>
          <details style={{ marginTop: 'var(--space-4, 16px)', cursor: 'pointer' }}>
            <summary
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2, 8px)',
                color: 'var(--el-conhecimento, #eab308)',
                fontWeight: 700,
                fontSize: 'var(--font-size-sm, 0.875rem)',
              }}
            >
              <Search size={15} aria-hidden="true" />
              <span>Detalhes Técnicos</span>
            </summary>
            <pre
              style={{
                background: 'var(--bg, #0b0c10)',
                padding: 'var(--space-3, 12px)',
                borderRadius: 'var(--radius-sm, 4px)',
                overflow: 'auto',
                maxHeight: '40dvh',
                fontSize: 'var(--font-size-xs, 12px)',
                border: '1px solid var(--border, #29313d)',
                marginTop: 'var(--space-3, 12px)',
                color: '#fca5a5',
              }}
            >
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-3, 12px)',
              marginTop: 'var(--space-6, 24px)',
            }}
          >
            <button
              type="button"
              onClick={this.handleRetry}
              className="btn-ordo btn-ordo-secondary control-md"
            >
              Tentar Novamente
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-ordo btn-ordo-primary control-md"
            >
              <RefreshCw size={15} aria-hidden="true" />
              <span>Reiniciar Aplicação</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
