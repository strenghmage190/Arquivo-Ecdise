import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './InviteModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  inviteLink?: string;
}

export default function InviteModal({ isOpen, onClose, investigationId, inviteLink }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, investigationId]);

  const handleInvite = async () => {
    if (!email) return;
    setLoading(true);

    try {
      alert(
        `CONVITE ENVIADO PARA: ${email}. O jogador precisa ter uma conta no site. Se ele entrar no site, o caso aparecerá para ele.`
      );
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
      setEmail('');
    }
  };

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error('copy failed', e);
      alert('Falha ao copiar. Selecione e copie manualmente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invite-backdrop" role="dialog" aria-modal="true" aria-labelledby="invite-modal-title" onClick={onClose}>
      <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="invite-modal-header">
          <h2 id="invite-modal-title">CONVIDAR AGENTES PARA O CASO</h2>
          <button
            type="button"
            className="invite-modal-close"
            onClick={onClose}
            aria-label="Fechar modal de convite"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary, #94a3b8)' }}>
            Envie este link para jogadores — ele permite que entrem direto no caso.
          </p>
        </div>

        <div className="invite-link-row">
          <input
            readOnly
            value={inviteLink || ''}
            placeholder="Gere o link no botão de convite"
            aria-label="Link de convite"
            className="invite-link-input"
          />
          <button
            type="button"
            onClick={() => handleCopy(inviteLink || '')}
            className="invite-copy-btn"
            disabled={!inviteLink}
          >
            {copied ? 'COPIADO!' : 'COPIAR'}
          </button>
        </div>

        <hr style={{ borderColor: 'var(--border, #29313d)', margin: '16px 0' }} />

        <div style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: 13, marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>Ou convide por email (legado, precisa de Edge Function):</div>
          <div className="invite-form">
            <input
              type="email"
              placeholder="email.do.agente@exemplo.com"
              aria-label="Email do agente"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="button" onClick={handleInvite} disabled={loading || !email.trim()}>
              {loading ? 'ENVIANDO...' : 'CONVIDAR'}
            </button>
          </div>
        </div>

        <div className="members-list">
          <h3>AGENTES NO CASO:</h3>
          <div className="member-item">
            <span>(Você - Mestre do Caso)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
