import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '40px',
          background: 'linear-gradient(135deg, #1a0000, #000)',
          border: '2px solid #ff0000',
          borderRadius: '12px',
          color: '#ff6666',
          fontFamily: 'monospace',
          margin: '20px',
          maxWidth: '800px',
          boxShadow: '0 0 30px rgba(255,0,0,0.3)'
        }}>
          <h2 style={{ color: '#ff3333', marginBottom: '20px', fontSize: '24px' }}>
            ⚠️ ERRO CRÍTICO DO SISTEMA
          </h2>
          <p style={{ marginBottom: '16px', fontSize: '14px' }}>
            Uma falha inesperada foi detectada. O sistema pode estar instável.
          </p>
          <details style={{ marginTop: '20px', cursor: 'pointer' }}>
            <summary style={{ color: '#ffaa00', fontWeight: 'bold', marginBottom: '12px' }}>
              🔍 Detalhes Técnicos (clique para expandir)
            </summary>
            <pre style={{
              background: '#0a0000',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '12px',
              border: '1px solid #330000',
              marginTop: '12px'
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              background: '#ff3333',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 0 15px rgba(255,0,0,0.4)'
            }}
          >
            🔄 REINICIAR APLICAÇÃO
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
