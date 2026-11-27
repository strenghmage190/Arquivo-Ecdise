import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import './Invite.css';
import { useAuth } from '../components/auth/AuthProvider';

function isMissingRpcError(err: any): boolean {
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    /Could not find the function|does not exist/i.test(msg)
  );
}

export default function InvitePage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [inviteInfo, setInviteInfo] = useState<{ investigation_id: string; title?: string } | null>(null);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'joining'>('loading');
  const { session } = useAuth();

  useEffect(() => {
    let active = true;
    async function validateInvite() {
      if (!inviteCode) {
        if (active) setStatus('invalid');
        return;
      }
      setStatus('loading');
      const { data, error } = await (supabase as any).rpc('validate_investigation_invite', {
        p_invite_code: inviteCode,
      });

      if (!active) return;

      if (error && isMissingRpcError(error)) {
        const legacy = await supabase
          .from('investigation_invites')
          .select('*, investigation:investigations(title)')
          .eq('invite_code', inviteCode)
          .single();
        if (!active) return;
        const legacyData = legacy.data as any;
        const isExpired = legacyData?.expires_at && new Date(legacyData.expires_at).getTime() < Date.now();
        if (legacy.error || !legacyData || isExpired) {
          setInviteInfo(null);
          setStatus('invalid');
        } else {
          setInviteInfo({
            investigation_id: String(legacyData.investigation_id),
            title: legacyData?.investigation?.title || legacyData?.title,
          });
          setStatus('valid');
        }
        return;
      }

      if (error || !data?.valid || !data?.investigation_id) {
        setInviteInfo(null);
        setStatus('invalid');
      } else {
        setInviteInfo({
          investigation_id: String(data.investigation_id),
          title: data.title ? String(data.title) : undefined,
        });
        setStatus('valid');
      }
    }

    if (session) {
      validateInvite();
    }
    return () => {
      active = false;
    };
  }, [inviteCode, session]);

  const handleAccept = async () => {
    if (!inviteCode || !inviteInfo) return;
    setStatus('joining');

    try {
      const { data, error } = await (supabase as any).rpc('accept_investigation_invite', {
        p_invite_code: inviteCode,
      });

      if (error && isMissingRpcError(error)) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus('valid');
          return;
        }
        const { data: existingMember } = await supabase
          .from('investigation_members')
          .select('id')
          .eq('investigation_id', inviteInfo.investigation_id)
          .eq('user_id', user.id)
          .maybeSingle();

        const rawId = String(inviteInfo.investigation_id);
        const cleanId = rawId.split(':')[0] || rawId;

        if (existingMember) {
          navigate(`/case/${cleanId}`);
          return;
        }

        const { error: insertErr } = await supabase
          .from('investigation_members')
          .insert({ investigation_id: inviteInfo.investigation_id, user_id: user.id } as any);

        if (insertErr && insertErr.code !== '23505') {
          toast.error('Erro ao entrar na missão: ' + (insertErr.message || insertErr.code));
          setStatus('valid');
          return;
        }
        navigate(`/case/${cleanId}`);
        return;
      }

      if (error || !data?.ok || !data?.investigation_id) {
        toast.error('Não foi possível aceitar o convite. Verifique se ele ainda é válido.');
        setStatus(data?.error === 'INVITE_NOT_FOUND' || data?.error === 'INVITE_EXPIRED' ? 'invalid' : 'valid');
        return;
      }

      const rawId = String(data.investigation_id);
      const cleanId = rawId.split(':')[0] || rawId;
      navigate(`/case/${cleanId}`);
    } catch (err: any) {
      toast.error('Erro ao entrar na missão: ' + (err?.message || 'tente novamente.'));
      setStatus('valid');
    }
  };

  return (
    <div className="invite-screen">
      <div className="invite-card">
        {status === 'loading' && <h1>VERIFICANDO CREDENCIAL...</h1>}
        {status === 'invalid' && (
           <>
             <h1><X className="lucide-icon inline-icon" size={16} /> CONVITE INVÁLIDO</h1>
             <p>Este link pode ter expirado ou não existe. Peça um novo convite ao Mestre.</p>
             <button onClick={() => navigate('/')}>VOLTAR PARA ARQUIVOS</button>
           </>
        )}
        {status === 'valid' && inviteInfo && (
           <>
             <span className="invite-from">VOCÊ FOI CONVOCADO PELA ORDEM</span>
             <h1>{inviteInfo?.title || 'CASO'}</h1>
             <p>Você tem certeza que deseja aceitar esta missão e se juntar à investigação?</p>
             <button className="btn-accept" onClick={handleAccept}>ACEITAR MISSÃO</button>
           </>
        )}
        {status === 'joining' && <h1>ENTRANDO NA FREQUÊNCIA...</h1>}
      </div>
    </div>
  );
}
