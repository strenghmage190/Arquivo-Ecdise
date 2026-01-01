import React, { useEffect, useState } from 'react';
import './CodePromptModal.css';

export type CodePromptResult = { success: boolean; message?: string; closeModal?: boolean };

type BootPhase = 'booting' | 'ready' | 'error' | 'success';

interface CodePromptModalProps {
  onSubmit: (code: string) => Promise<CodePromptResult> | CodePromptResult;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function CodePromptModal({
  onSubmit,
  onClose,
  title = 'ARQUIVO PROTEGIDO',
  description = 'Este arquivo requer autenticação. Digite o código de acesso:',
}: CodePromptModalProps): React.ReactElement {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bootPhase, setBootPhase] = useState<BootPhase>('booting');
  const [visibleLines, setVisibleLines] = useState(0);

  const bootSequence = [
    { text: 'INICIALIZANDO INTERFACE DE ACESSO...', className: 'info' },
    { text: 'VERIFICANDO PROTOCOLOS DE SEGURANCA...', className: 'info' },
    { text: 'FIREWALL: ATIVO | CRIPTOGRAFIA: AES-256', className: 'success' },
    { text: 'ACESSO NEGADO - CREDENCIAIS NECESSARIAS', className: 'error' }
  ];

  useEffect(() => {
    if (bootPhase !== 'booting') return;
    setVisibleLines(0);
    const timers: NodeJS.Timeout[] = [];

    bootSequence.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
        if (index === bootSequence.length - 1) {
          setTimeout(() => setBootPhase('ready'), 320);
        }
      }, (index + 1) * 420);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [bootPhase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError(true);
      setFeedback({ type: 'error', message: 'Digite um código válido.' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit(code.toUpperCase());
      if (result?.success) {
        setCode('');
        setError(false);
        setFeedback(result.message ? { type: 'success', message: result.message } : null);
        setBootPhase('success');
        if (result.closeModal) {
          onClose();
        }
      } else {
        setError(true);
        setBootPhase('error');
        setFeedback(result?.message ? { type: 'error', message: result.message } : { type: 'error', message: 'Código inválido.' });
      }
    } catch (err) {
      console.error('Erro ao submeter código', err);
      setError(true);
      setBootPhase('error');
      setFeedback({ type: 'error', message: 'Erro ao validar código. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    setError(false);
    setFeedback(null);
  };

  return (
    <div className="code-prompt-overlay" onClick={onClose}>
      <div className="code-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="code-prompt-header">
          <h3>🔐 {title}</h3>
          <button className="code-prompt-close" onClick={onClose}>×</button>
        </div>
        
        <div className="code-prompt-body">
          <div className="code-prompt-terminal">
            {bootSequence.slice(0, visibleLines).map((line, index) => (
              <div key={line.text} className={`terminal-line ${line.className}`} style={{ animationDelay: `${index * 80}ms` }}>
                <span className="terminal-prompt">&gt;</span>
                <span className="terminal-text">
                  {line.text}
                  {index === visibleLines - 1 && bootPhase === 'booting' && <span className="blinking-cursor">_</span>}
                </span>
              </div>
            ))}
            {bootPhase === 'ready' && (
              <div className="terminal-line ready">
                <span className="terminal-prompt">&gt;</span>
                <span className="terminal-text">PRONTO PARA ENTRADA DE CODIGO</span>
              </div>
            )}
            {bootPhase === 'success' && (
              <div className="terminal-line success">
                <span className="terminal-prompt">&gt;</span>
                <span className="terminal-text">ACESSO CONCEDIDO</span>
              </div>
            )}
            {bootPhase === 'error' && feedback && (
              <div className="terminal-line error">
                <span className="terminal-prompt">&gt;</span>
                <span className="terminal-text">{feedback.message}</span>
              </div>
            )}
          </div>

          {bootPhase !== 'booting' && (
            <p className="code-prompt-description">{description}</p>
          )}

          {feedback && (
            <div className={`code-prompt-feedback ${feedback.type}`} role="status">
              {feedback.message}
            </div>
          )}
          
          {bootPhase !== 'booting' && (
            <>
              <form onSubmit={handleSubmit} className="form-fade-in">
                <div className="code-input-group">
                  <input
                    type="text"
                    value={code}
                    onChange={handleInputChange}
                    placeholder="_ _ _ _ _ - _ _ _ _"
                    className={`code-input ${error ? 'error' : ''}`}
                    autoFocus
                    maxLength={20}
                    disabled={submitting}
                  />
                  {error && <span className="code-error">⚠ Código inválido</span>}
                </div>

                <div className="code-prompt-actions">
                  <button type="submit" className="code-btn primary" data-text="CONFIRMAR" disabled={submitting}>
                    {submitting ? 'VALIDANDO...' : 'CONFIRMAR'}
                  </button>
                  <button type="button" className="code-btn secondary" data-text="CANCELAR" onClick={onClose}>
                    CANCELAR
                  </button>
                </div>
              </form>

              <div className="code-prompt-hint form-fade-in">
                <small>💡 Dica: Procure pistas nos documentos e fotografias da investigação</small>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
