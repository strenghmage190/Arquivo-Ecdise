import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Invite.css';
import { useAuth } from '../components/auth/AuthProvider';

export default function InvitePage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'joining'>('loading');
  const { session } = useAuth();

  useEffect(() => {
    async function validateInvite() {
      const { data, error } = await supabase
        .from('investigation_invites')
        .select('*, investigation:investigations(title)')
        .eq('invite_code', inviteCode)
        .single();

      if (error || !data) {
        setStatus('invalid');
      } else {
        setInviteInfo(data);
        setStatus('valid');
      }
    }
    validateInvite();
  }, [inviteCode]);

  const handleAccept = async () => {
    setStatus('joining');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !inviteInfo) return;

    const { error } = await supabase
      .from('investigation_members')
      .insert({ investigation_id: inviteInfo.investigation_id, user_id: user.id });

    if (error && error.code !== '23505') {
      alert('Erro ao entrar na missão.');
      setStatus('valid');
    } else {
      navigate(`/case/${inviteInfo.investigation_id}`);
    }
  };

  useEffect(() => {
    if (session && status === 'loading') {
      // If user was redirected to login and then back, re-validate
      (async () => {
        const { data, error } = await supabase
          .from('investigation_invites')
          .select('*, investigation:investigations(title)')
          .eq('invite_code', inviteCode)
          .single();
        if (!error && data) {
          setInviteInfo(data);
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      })();
    }
  }, [session, inviteCode, status]);

  return (
    <div className="invite-screen">
      <div className="invite-card">
        {status === 'loading' && <h1>VERIFICANDO CREDENCIAL...</h1>}
        {status === 'invalid' && (
           <>
             <h1>❌ CONVITE INVÁLIDO</h1>
             <p>Este link pode ter expirado ou não existe. Peça um novo convite ao Mestre.</p>
             <button onClick={() => navigate('/')}>VOLTAR PARA ARQUIVOS</button>
           </>
        )}
        {status === 'valid' && inviteInfo && (
           <>
             <span className="invite-from">VOCÊ FOI CONVOCADO PELA ORDEM</span>
             <h1>{inviteInfo.investigation.title}</h1>
             <p>Você tem certeza que deseja aceitar esta missão e se juntar à investigação?</p>
             <button className="btn-accept" onClick={handleAccept}>ACEITAR MISSÃO</button>
           </>
        )}
        {status === 'joining' && <h1>ENTRANDO NA FREQUÊNCIA...</h1>}
      </div>
    </div>
  );
}
