import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './InviteModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  inviteLink?: string;
}

export default function InviteModal({ isOpen, onClose, investigationId, inviteLink }: Props) {
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadMembers() {
      // Placeholder: in a real setup we'd query an RPC or view that joins investigation_members -> auth.users
      // For now, we leave members empty or simulate a load.
      try {
        // Example fetch if you had a view: await supabase.from('investigation_members_view').select('*').eq('investigation_id', investigationId)
        setMembers([]);
      } catch (e) {
        // ignore
      }
    }
    if (isOpen) loadMembers();
  }, [isOpen, investigationId]);

  const handleInvite = async () => {
    if (!email) return;
    setLoading(true);

    try {
      // Supabase doesn't allow direct user lookup by email from client for security reasons.
      // In production you'd have an Edge Function that resolves email -> user_id and adds investigation_members.
      alert(`CONVITE ENVIADO PARA: ${email}. O jogador precisa ter uma conta no site. Se ele entrar no site, o caso aparecerá para ele.`);

      // Example Edge Function call:
      // const { data, error } = await supabase.functions.invoke('invite-player', { body: { investigationId, email } });
      // if (error) throw error;

    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    } finally {
      setLoading(false);
      setEmail('');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      alert('Link copiado para a área de transferência!');
    } catch (e) {
      console.error('copy failed', e);
      alert('Falha ao copiar. Selecione e copie manualmente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invite-backdrop" onClick={onClose}>
      <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
        <h2>CONVIDAR AGENTES PARA O CASO</h2>

        {/* If parent passed an inviteLink prop, show it for easy copy */}
        {(/* @ts-ignore */ (window as any).__inviteLinkProvided) ? null : null}

        <div style={{ marginBottom: 12 }}>
          <p>Envie este link para jogadores — ele permite que entrem direto no caso.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* The investigationId prop remains available for legacy flows */}
          <input
            readOnly
            value={inviteLink || ''}
            placeholder="Gere o link no botão ✉️"
            style={{ flex: 1, background: '#000', border: '1px solid #444', color: '#c6a45f', padding: 8 }}
          />
          <button onClick={() => handleCopy(inviteLink || '')} style={{ background: '#c6a45f', color: '#000', border: 'none', cursor: 'pointer' }}>COPIAR</button>
        </div>

        <hr style={{ borderColor: '#333', margin: '12px 0' }} />

        <div style={{ color: '#aaa', fontSize: 13, marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>Ou convide por email (legado, precisa de Edge Function):</div>
          <div className="invite-form">
            <input
              type="email"
              placeholder="email.do.agente@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleInvite} disabled={loading}>
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
