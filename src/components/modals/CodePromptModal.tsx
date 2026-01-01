import React, { useState } from 'react';
import './CodePromptModal.css';

interface CodePromptModalProps {
  onSubmit: (code: string) => void;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function CodePromptModal({ 
  onSubmit, 
  onClose, 
  title = "ARQUIVO PROTEGIDO",
  description = "Este arquivo requer autenticação. Digite o código de acesso:"
}: CodePromptModalProps): React.ReactElement {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError(true);
      return;
    }
    onSubmit(code.toUpperCase());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    setError(false);
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
            <div className="terminal-line">
              <span className="terminal-prompt">&gt;</span>
              <span className="terminal-text">SISTEMA DE SEGURANÇA ATIVO</span>
            </div>
            <div className="terminal-line">
              <span className="terminal-prompt">&gt;</span>
              <span className="terminal-text">Verificando permissões...</span>
            </div>
            <div className="terminal-line error">
              <span className="terminal-prompt">&gt;</span>
              <span className="terminal-text">ACESSO NEGADO - Credenciais necessárias</span>
            </div>
          </div>

          <p className="code-prompt-description">{description}</p>
          
          <form onSubmit={handleSubmit}>
            <div className="code-input-group">
              <input
                type="text"
                value={code}
                onChange={handleInputChange}
                placeholder="_ _ _ _ _ - _ _ _ _"
                className={`code-input ${error ? 'error' : ''}`}
                autoFocus
                maxLength={20}
              />
              {error && <span className="code-error">⚠ Código inválido</span>}
            </div>

            <div className="code-prompt-actions">
              <button type="submit" className="code-btn primary">
                CONFIRMAR
              </button>
              <button type="button" className="code-btn secondary" onClick={onClose}>
                CANCELAR
              </button>
            </div>
          </form>

          <div className="code-prompt-hint">
            <small>💡 Dica: Procure pistas nos documentos e fotografias da investigação</small>
          </div>
        </div>
      </div>
    </div>
  );
}
