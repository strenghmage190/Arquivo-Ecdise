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

    // --- LÓGICA ANTI-CONFLITO ---
    // 1. Primeiro, checa se já sou membro
    try {
      const { data: existingMember } = await supabase
        .from('investigation_members')
        .select('id')
        .eq('investigation_id', inviteInfo.investigation_id)
        .eq('user_id', user.id)
        .single();

      // 2. Se já sou membro, apenas redireciono
      if (existingMember) {
        console.log('Usuário já é membro, redirecionando...');
        const rawId = inviteInfo.investigation_id as string;
        const cleanId = rawId?.split(':')?.[0] || rawId;
        navigate(`/case/${cleanId}`);
        return;
      }
    } catch (checkErr) {
      // se a consulta single() falhar com 406 por exemplo, continuamos e tentamos inserir
      console.debug('check existingMember error (non-fatal)', checkErr);
    }

    // Se não sou membro, continuo com o processo de inserção
    const { error } = await supabase
      .from('investigation_members')
      .insert({ investigation_id: inviteInfo.investigation_id, user_id: user.id } as any);

    if (error) {
      // se já existir (conflito), simplesmente redireciona sem mostrar erro
      if (error.code === '23505') {
        const rawId = inviteInfo.investigation_id as string;
        const cleanId = rawId?.split(':')?.[0] || rawId;
        navigate(`/case/${cleanId}`);
        return;
      }
      alert('Erro ao entrar na missão: ' + (error.message || error.code));
      setStatus('valid');
    } else {
      const rawId = inviteInfo.investigation_id as string;
      const cleanId = rawId?.split(':')?.[0] || rawId;
      navigate(`/case/${cleanId}`);
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
             <h1>{inviteInfo?.investigation?.title || inviteInfo?.title || 'CASO'}</h1>
             <p>Você tem certeza que deseja aceitar esta missão e se juntar à investigação?</p>
             <button className="btn-accept" onClick={handleAccept}>ACEITAR MISSÃO</button>
           </>
        )}
        {status === 'joining' && <h1>ENTRANDO NA FREQUÊNCIA...</h1>}
      </div>
    </div>
  );
}
