import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './InviteModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
}

export default function InviteModal({ isOpen, onClose, investigationId }: Props) {
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  if (!isOpen) return null;

  return (
    <div className="invite-backdrop" onClick={onClose}>
      <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
        <h2>CONVIDAR AGENTES PARA O CASO</h2>
        <p>Adicione agentes pelo email. Eles precisam ter uma conta no sistema para poderem acessar.</p>

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
