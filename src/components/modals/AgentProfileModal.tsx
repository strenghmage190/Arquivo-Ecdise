import React, { useEffect, useState } from 'react';
import { Shield, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../auth/AuthProvider';
import './AgentProfileConfig.css';

interface AgentProfileModalProps {
  onClose: () => void;
}

const CLEARANCE_LEVELS = [
  'RECRUTA',
  'OPERATIVO',
  'ALPHA',
  'ESPECIALISTA',
  'AGENTE DE ELITE',
  'OMEGA',
] as const;

export default function AgentProfileModal({ onClose }: AgentProfileModalProps) {
  const { session } = useAuth();
  const user = session?.user;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [codename, setCodename] = useState('');
  const [specialization, setSpecialization] = useState('Investigação Geral');
  const [clearanceLevel, setClearanceLevel] = useState('ALPHA');
  const [prestige, setPrestige] = useState(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!user?.id) {
        if (active) setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('agent_name, full_name, codename, specialization, clearance_level, prestige')
          .eq('id', user.id)
          .maybeSingle();

        if (!active) return;
        if (!error && data) {
          setAgentName(data.agent_name || data.full_name || user.email?.split('@')[0] || '');
          setCodename(data.codename || '');
          setSpecialization(data.specialization || 'Investigação Geral');
          setClearanceLevel(data.clearance_level || 'ALPHA');
          setPrestige(Number(data.prestige) || 0);
        } else {
          setAgentName(user.email?.split('@')[0] || '');
        }
      } catch (err) {
        console.error('Erro ao carregar perfil do agente:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [user?.id, user?.email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      const cleanName = agentName.trim() || user.email?.split('@')[0] || 'Agente';
      const cleanCodename = codename.trim() || null;
      const cleanSpec = specialization.trim() || 'Investigação Geral';

      const { error } = await (supabase as any)
        .from('profiles')
        .upsert(
          {
            id: user.id,
            agent_name: cleanName,
            full_name: cleanName,
            codename: cleanCodename,
            specialization: cleanSpec,
            clearance_level: clearanceLevel,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) throw error;
      toast.success('Credencial do agente atualizada.');
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      toast.error(err?.message || 'Erro ao salvar perfil do agente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="agent-profile-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-profile-title"
      onClick={onClose}
    >
      <div className="agent-profile-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <User size={22} color="var(--nexus-blue, #00f3ff)" aria-hidden="true" />
          <h2 id="agent-profile-title">CREDENCIAL DO AGENTE // C.R.I.S.</h2>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Fechar perfil do agente"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="loading-text">SINCRONIZANDO CREDENCIAL...</div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="agent-name">NOME DO AGENTE</label>
                <input
                  id="agent-name"
                  className="nexus-input"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ex: Arthur Cervero"
                  maxLength={60}
                />
              </div>

              <div className="form-group">
                <label htmlFor="agent-codename">CODINOME OPERACIONAL</label>
                <input
                  id="agent-codename"
                  className="nexus-input"
                  value={codename}
                  onChange={(e) => setCodename(e.target.value)}
                  placeholder="Ex: Veríssimo"
                  maxLength={40}
                />
              </div>

              <div className="form-group">
                <label htmlFor="agent-spec">ESPECIALIZAÇÃO</label>
                <input
                  id="agent-spec"
                  className="nexus-input"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Ex: Ocultismo / Criptografia"
                  maxLength={60}
                />
              </div>

              <div className="form-group">
                <label htmlFor="agent-clearance">NÍVEL DE ACESSO</label>
                <select
                  id="agent-clearance"
                  className="nexus-select"
                  value={clearanceLevel}
                  onChange={(e) => setClearanceLevel(e.target.value)}
                >
                  {CLEARANCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Credencial'}
                </button>
              </div>
            </div>

            <div className="profile-preview">
              <div className="preview-label">
                <Shield size={12} style={{ display: 'inline', marginRight: 6 }} aria-hidden="true" />
                Prévia da Identificação
              </div>
              <div className="agent-card">
                <div className="agent-clearance">{clearanceLevel}</div>
                <div className="agent-name">{agentName || 'Agente da Ordem'}</div>
                {codename && <div className="agent-codename">&ldquo;{codename}&rdquo;</div>}
                <div className="agent-spec">{specialization || 'Investigação Geral'}</div>
                <div className="agent-prestige">PRESTÍGIO: {prestige}</div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
